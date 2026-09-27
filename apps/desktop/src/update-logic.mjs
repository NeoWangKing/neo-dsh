/**
 * Update logic for the desktop shell: version comparison, release-asset
 * selection and a streaming download.
 *
 * Deliberately free of Electron and of the shell's own state, so it can be
 * unit-tested and driven from a plain-node script (`scripts/update-check.mjs`).
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

/**
 * Ask GitHub for this project's newest release.
 * @param fetchImpl - fetch implementation (injectable for tests).
 * @returns the release JSON.
 */
export async function fetchLatestRelease(fetchImpl = fetch) {
  const response = await fetchImpl(`https://api.github.com/repos/${UPDATE_REPO}/releases/latest`, {
    headers: { accept: 'application/vnd.github+json', 'user-agent': 'neo-dsh-updater' },
  })
  if (!response.ok) throw new Error(`GitHub API ${response.status} ${response.statusText}`)
  return await response.json()
}

/**
 * Stream a release asset into the update directory, reporting progress.
 * @param asset - GitHub asset (`name`, `size`, `browser_download_url`).
 * @param options - `onProgress({received, total, percent})`, `fetchImpl`.
 * @returns `{ path, bytes, asset }`.
 */
export async function downloadRelease(asset, options = {}) {
  const { onProgress = () => {}, fetchImpl = fetch } = options
  const dir = updateDir()
  mkdirSync(dir, { recursive: true })
  const target = join(dir, asset.name)
  const total = Number(asset.size ?? 0)
  if (existsSync(target)) rmSync(target, { force: true })

  const response = await fetchImpl(asset.browser_download_url, {
    headers: { 'user-agent': 'neo-dsh-updater' },
    redirect: 'follow',
  })
  if (!response.ok) throw new Error(`download failed: HTTP ${response.status}`)

  onProgress({ received: 0, total, percent: 0 })
  // Progress off the file size: simpler than wrapping the stream, and it reports
  // the number that matters — bytes actually on disk.
  const ticker = setInterval(() => {
    let received = 0
    try { received = statSync(target).size } catch { /* not created yet */ }
    onProgress({ received, total, percent: total > 0 ? Math.min(100, Math.round((received / total) * 100)) : null })
  }, 500)
  try {
    await pipeline(Readable.fromWeb(response.body), createWriteStream(target))
  } finally {
    clearInterval(ticker)
  }

  const bytes = statSync(target).size
  if (total > 0 && bytes !== total) throw new Error(`incomplete download: ${bytes}/${total} bytes`)
  onProgress({ received: bytes, total, percent: 100 })
  return { path: target, bytes, asset }
}
