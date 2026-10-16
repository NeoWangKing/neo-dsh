/**
 * Update logic for the desktop shell: version comparison, release-asset
 * selection and a streaming download.
 *
 * Deliberately free of Electron and of the shell's own state, so it can be
 * unit-tested and driven from a plain-node script (`apps/desktop/scripts/update-check.mjs`).
 * The packaged app is the only place that can perform the actual install, but
 * everything up to and including "the bytes are on disk" is verifiable here.
 *
 * @module update-logic
 */

import { createWriteStream, existsSync, mkdirSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'

/** Releases come from here — this project's own repository, not DeepSeek's. */
export const UPDATE_REPO = 'NeoWangKing/neo-dsh'

/** Where downloads land. */
export function updateDir() {
  return join(tmpdir(), 'neo-dsh-update')
}

/**
 * Compare two dotted versions, tolerating a leading `v` and prerelease suffixes.
 * @param candidate - version to test, e.g. `v0.1.4`.
 * @param current - version currently installed.
 * @returns true when `candidate` is strictly newer than `current`.
 */
export function isNewer(candidate, current) {
  const parse = (value) => {
    const [release, ...pre] = String(value).replace(/^v/i, '').split('-')
    return { nums: release.split('.').map((part) => Number(part) || 0), pre: pre.join('-') }
  }
  const left = parse(candidate)
  const right = parse(current)
  for (let i = 0; i < Math.max(left.nums.length, right.nums.length); i += 1) {
    const a = left.nums[i] ?? 0
    const b = right.nums[i] ?? 0
    if (a !== b) return a > b
  }
  if (left.pre === right.pre) return false
  // Same release number: a prerelease (`0.1.4-rc.1`) ranks below the release.
  if (left.pre === '') return true
  if (right.pre === '') return false
  return left.pre > right.pre
}

/**
 * Pick the release asset to install on this machine.
 * @param assets - GitHub release assets (`{ name, size, browser_download_url }`).
 * @param target - what we are running on: `platform`, `arch`, `appImage`.
 * @returns the matching asset, or undefined when the release has none.
 */
export function pickAsset(assets, target) {
  const { platform, arch, appImage } = target
  let pattern
  if (platform === 'darwin') pattern = /-(mac|darwin)-(arm64|x64)\.dmg$/i
  else if (platform === 'win32') pattern = /-win-x64\.exe$/i
  // An AppImage run replaces its own file; the zip is the install.sh flavor.
  else if (appImage !== undefined && appImage !== '') pattern = /-linux-x86_64\.AppImage$/i
  else pattern = /-linux-x64\.zip$/i

  const candidates = (assets ?? []).filter((entry) => pattern.test(entry.name))
  if (candidates.length <= 1) return candidates[0]
  // More than one match (both mac arches, say): prefer the running architecture.
  const mine = candidates.find((entry) => new RegExp(`-(${arch}|x86_64)\\.`, 'i').test(entry.name))
  return mine ?? candidates[0]
}

/** An HTTP answer that is not a success, carrying what the caller needs to explain it. */
export class GithubHttpError extends Error {
  /**
   * @param status - HTTP status.
   * @param statusText - HTTP reason phrase.
   * @param headers - response headers (used for the rate-limit reset).
   */
  constructor(status, statusText, headers) {
    super(`GitHub API ${status} ${statusText}`)
    this.name = 'GithubHttpError'
    this.status = status
    this.rateLimitReset = Number(headers?.get?.('x-ratelimit-reset') ?? 0)
  }
}

/** Last ETag seen for the release list, and the release it resolved to. */
let latestEtag = ''
let latestRelease = null

/**
 * A tag we are willing to call a version: `v0.2.4`, `0.2.4`, `0.2.4-rc.1`.
 * Anything else — `patch`, a date, a bookmark — is not a release this updater installs.
 */
const VERSION_TAG = /^v?\d+\.\d+(?:\.\d+)?(?:[-+][0-9A-Za-z.-]+)?$/

/** Raised when the repository has releases but none of them is a version. */
export class NoVersionReleaseError extends Error {
  constructor(message = '这个仓库还没有版本发布（只有补丁或预发布）') {
    super(message)
    this.name = 'NoVersionReleaseError'
  }
}

/**
 * The newest version release out of a release list, or `null` when there is none.
 *
 * Drafts and prereleases are skipped — the same ones `releases/latest` would have skipped — and
 * so is any tag that is not a version, which is what stops the hot-patch release from shadowing
 * a real one. The comparison is numeric (`isNewer`), so v0.2.10 beats v0.2.9 and the result does
 * not depend on the order GitHub returns.
 * @param releases - release objects from the API.
 */
export function pickNewestVersionRelease(releases) {
  const candidates = (Array.isArray(releases) ? releases : []).filter(
    (release) =>
      release !== null &&
      typeof release === 'object' &&
      release.draft !== true &&
      release.prerelease !== true &&
      typeof release.tag_name === 'string' &&
      VERSION_TAG.test(release.tag_name),
  )
  let newest = null
  for (const release of candidates) {
    if (newest === null || isNewer(release.tag_name, newest.tag_name)) newest = release
  }
  return newest
}

/**
 * Turn a fetch failure into something a person can act on.
 *
 * undici rejects with a bare "fetch failed" and hides the reason in `cause`, which
 * is useless in a settings row: the code (ENOTFOUND, ECONNRESET, a connect timeout)
 * is the part that says whether it is worth retrying.
 * @param error - whatever fetch rejected with.
 * @returns a message that names the underlying cause when there is one.
 */
export function describeNetworkError(error) {
  // Not every failure is a network one. "The repository has no version release" is a statement
  // about the repository, and prefixing it with "cannot reach GitHub" would be a lie.
  if (error instanceof NoVersionReleaseError) return error.message
  // A rate limit is not a network problem: the unauthenticated API allows 60
  // requests an hour, and the answer says when it resets.
  if (error instanceof GithubHttpError && (error.status === 403 || error.status === 429)) {
    const seconds = error.rateLimitReset > 0 ? error.rateLimitReset - Math.floor(Date.now() / 1000) : 0
    const minutes = seconds > 0 ? Math.max(1, Math.ceil(seconds / 60)) : null
    return minutes === null
      ? 'GitHub 接口限流（未认证每 IP 每小时 60 次），请稍后再试'
      : `GitHub 接口限流（未认证每 IP 每小时 60 次），约 ${minutes} 分钟后恢复`
  }
  const cause = error?.cause
  const code = cause?.code ?? cause?.errno ?? error?.code ?? ''
  const base = String(error?.message ?? error)
  return code === '' ? `无法连接 GitHub：${base}` : `无法连接 GitHub：${base}（${code}）`
}

/**
 * Ask GitHub for this project's newest version release.
 *
 * Deliberately **not** `releases/latest`. GitHub defines that as the most recently *published*
 * release that is neither a draft nor a prerelease — a statement about publishing order, not
 * about versions. The hot-patch channel keeps a release tagged `patch` whose assets are replaced
 * in place; the moment it was created it became "latest", so the updater read the tag `patch`,
 * found it was not a version, and reported the app up to date while v0.2.4 sat one entry below
 * it. The list is filtered to version tags and the highest one wins, which is what "newest
 * release" has to mean for an updater. That also keeps the two channels independent: patches go
 * on shipping quietly, and a version release is always visible.
 *
 * Retries a couple of times: on a laptop network a single DNS hiccup or dropped
 * SYN was enough to leave the settings row in an error state until the next
 * scheduled check. Each attempt is bounded, so a black-holed route cannot leave
 * the row spinning either.
 * @param fetchImpl - fetch implementation (injectable for tests).
 * @param options - `attempts`, `timeoutMs`, `sleep` (injectable for tests).
 * @returns the release JSON of the newest version release.
 */
export async function fetchLatestRelease(fetchImpl = fetch, options = {}) {
  const { attempts = 3, timeoutMs = 15000, sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)) } = options
  const url = `https://api.github.com/repos/${UPDATE_REPO}/releases?per_page=100`
  let lastError
  for (let attempt = 1; attempt <= attempts; attempt += 1) {
    try {
      const headers = { accept: 'application/vnd.github+json', 'user-agent': 'neo-dsh-updater' }
      // Conditional request: GitHub does not count a 304 against the limit, so a
      // repeated check costs nothing after the first one.
      if (latestEtag !== '') headers['if-none-match'] = latestEtag
      const response = await fetchImpl(url, {
        headers,
        signal: typeof AbortSignal?.timeout === 'function' ? AbortSignal.timeout(timeoutMs) : undefined,
      })
      if (response.status === 304 && latestRelease !== null) return latestRelease
      if (!response.ok) throw new GithubHttpError(response.status, response.statusText, response.headers)
      latestEtag = response.headers?.get?.('etag') ?? ''
      const newest = pickNewestVersionRelease(await response.json())
      if (newest === null) throw new NoVersionReleaseError()
      latestRelease = newest
      return latestRelease
    } catch (error) {
      lastError = error
      // Retry only what can get better: a transport failure or a 5xx may pass on a second
      // attempt, while a 4xx (rate limit, bad request) and a repository with no version release
      // will answer exactly the same — and for a rate limit retrying is worse.
      const retryable =
        !(error instanceof NoVersionReleaseError) &&
        (!(error instanceof GithubHttpError) || error.status >= 500)
      if (retryable && attempt < attempts) await sleep(attempt * 750)
      else break
    }
  }
  throw new Error(describeNetworkError(lastError))
}

/**
 * Stream a release asset into the update directory, reporting progress.
 * @param asset - GitHub asset (`name`, `size`, `browser_download_url`).
 * @param options - `onProgress({received, total, percent})`, `fetchImpl`.
 * @returns `{ path, bytes, asset }`.
 */
export async function downloadRelease(asset, options = {}) {
  const {
    onProgress = () => {},
    fetchImpl = fetch,
    // A connection that never delivers anything leaves the row stuck at "downloading 0%"
    // forever, with no way to tell a slow network from a dead one. Give up after this long
    // without a single new byte; 0 disables the check.
    idleTimeoutMs = 30_000,
    probeEveryMs = 500,
  } = options
  const dir = updateDir()
  mkdirSync(dir, { recursive: true })
  const target = join(dir, asset.name)
  const total = Number(asset.size ?? 0)
  if (existsSync(target)) rmSync(target, { force: true })

  const controller = typeof AbortController === 'function' ? new AbortController() : undefined
  const response = await fetchImpl(asset.browser_download_url, {
    headers: { 'user-agent': 'neo-dsh-updater' },
    redirect: 'follow',
    signal: controller?.signal,
  })
  if (!response.ok) throw new Error(`download failed: HTTP ${response.status}`)

  onProgress({ received: 0, total, percent: 0 })
  // Progress off the file size: simpler than wrapping the stream, and it reports
  // the number that matters — bytes actually on disk.
  let lastBytes = 0
  let lastChangeAt = Date.now()
  let stalled = false
  const source = Readable.fromWeb(response.body)
  const ticker = setInterval(() => {
    let received = 0
    try { received = statSync(target).size } catch { /* not created yet */ }
    if (received !== lastBytes) {
      lastBytes = received
      lastChangeAt = Date.now()
    } else if (idleTimeoutMs > 0 && Date.now() - lastChangeAt >= idleTimeoutMs && !stalled) {
      stalled = true
      // Aborting the request does not necessarily settle a web stream that never
      // produced anything, so the source is torn down as well.
      source.destroy(new Error('download stalled'))
      controller?.abort(new Error('download stalled'))
    }
    onProgress({ received, total, percent: total > 0 ? Math.min(100, Math.round((received / total) * 100)) : null })
  }, probeEveryMs)
  try {
    await pipeline(source, createWriteStream(target))
  } catch (error) {
    if (stalled) {
      throw new Error(
        `download stalled: no data for ${Math.round(idleTimeoutMs / 1000)}s (${String(error?.message ?? error)})`,
      )
    }
    throw error
  } finally {
    clearInterval(ticker)
  }

  const bytes = statSync(target).size
  if (total > 0 && bytes !== total) throw new Error(`incomplete download: ${bytes}/${total} bytes`)
  onProgress({ received: bytes, total, percent: 100 })
  return { path: target, bytes, asset }
}
