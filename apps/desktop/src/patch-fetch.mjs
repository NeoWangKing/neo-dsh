/**
 * Fetch, verify and apply a hot patch on launch — the receiving half of the channel.
 *
 * The manifest lives on a release tag called `patch`, whose assets are replaced in place, so
 * clients poll one fixed URL forever instead of chasing version numbers:
 *
 *   https://github.com/<owner>/<repo>/releases/download/patch/patch.json
 *
 * Deliberately silent: a patch may only touch our own files (see patch-apply.mjs), it is
 * checksum-verified, it is gated on the running app version, and a launch that never reaches
 * a clean quit is rolled back automatically — so the safe side is already the default and a
 * prompt would only add a dialog to click. `DSH_PATCH_URL` overrides the manifest address
 * (empty string disables the check), which is what the tests and a local dry run use.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { applyPayload, pendingPatch, sha256Of, validateManifest } from './patch-apply.mjs'

/** The fixed manifest address, overridable for tests and dry runs. */
export function manifestUrl(env = process.env) {
  if ('DSH_PATCH_URL' in env) return env.DSH_PATCH_URL
  return 'https://github.com/NeoWangKing/neo-dsh/releases/download/patch/patch.json'
}

/**
 * Check for a patch and apply it, so the *next* launch runs it.
 *
 * @param {{root: string, stateDir: string, appVersion: string, fetchImpl?: Function, url?: string, log?: Function}} options
 * @returns {Promise<{patchId: string, files: string[]}|null>} null when there is nothing to do.
 */
export async function checkAndApplyPatch({ root, stateDir, appVersion, fetchImpl, url, log = () => {} }) {
  const address = url ?? manifestUrl()
  if (address === '') return null
  if (pendingPatch(stateDir) !== null) {
    log('a patch is already waiting for its boot to confirm; not applying another')
    return null
  }
  const doFetch = fetchImpl ?? ((...args) => fetch(...args))

  // A patch that is already on disk stays there: re-applying it would only rewrite the same
  // bytes and, worse, overwrite the rollback copy with patched content.
  const appliedFile = join(stateDir, 'applied.json')
  const alreadyApplied = (() => {
    try {
      return existsSync(appliedFile) ? JSON.parse(readFileSync(appliedFile, 'utf8'))?.patchId ?? null : null
    } catch {
      return null
    }
  })()

  let manifest
  try {
    const response = await doFetch(address, { redirect: 'follow' })
    if (!response.ok) {
      log(`no patch manifest at ${address} (${response.status})`)
      return null
    }
    manifest = validateManifest(await response.text(), { appVersion })
  } catch (error) {
    if (error?.code === 'PATCH_WRONG_VERSION') {
      log(error.message)
      return null
    }
    log(`patch check skipped: ${error.message}`)
    return null
  }

  if (alreadyApplied === manifest.patchId) {
    log(`patch ${manifest.patchId} is already applied`)
    return null
  }

  const work = mkdtempSync(join(tmpdir(), 'neo-patch-'))
  try {
    const payloadFile = join(work, 'payload.tar.gz')
    const payloadResponse = await doFetch(manifest.payloadUrl, { redirect: 'follow' })
    if (!payloadResponse.ok) {
      log(`patch payload unreachable (${payloadResponse.status})`)
      return null
    }
    writeFileSync(payloadFile, Buffer.from(await payloadResponse.arrayBuffer()))
    const digest = sha256Of(payloadFile)
    if (digest !== manifest.sha256) {
      log(`patch ${manifest.patchId} refused: sha256 ${digest} does not match the manifest`)
      return null
    }
    const payloadDir = join(work, 'payload')
    mkdirSync(payloadDir, { recursive: true })
    execFileSync('tar', ['-xzf', payloadFile, '-C', payloadDir], { stdio: 'ignore' })
    const applied = applyPayload({ root, payloadDir, stateDir, manifest })
    // A patched plugin only reaches the running app if the live profile is re-copied, and the
    // app skips that while its own version is unchanged. Leave it a reason to redo the copy.
    if (applied.files.some((file) => file.startsWith('resources/profile-web/vendor/'))) {
      writeFileSync(join(stateDir, 'force-bundled'), `${manifest.patchId}\n`)
    }
    log(`applied patch ${manifest.patchId} (${applied.files.length} file(s)); it runs from the next launch`)
    return { patchId: manifest.patchId, files: applied.files }
  } finally {
    rmSync(work, { recursive: true, force: true })
  }
}
