/**
 * Hot patches: small fixes applied to an installed tree, without shipping a new version.
 *
 * A release moves the harness and the Electron shell, so it is hundreds of megabytes and
 * needs three platform builds. Most of what we actually change between releases is much
 * smaller: one of our plugins, a line of a profile patch row, a default in
 * `settings.defaults.yaml`. Those files are ours, they live in the install tree as plain
 * files, and the app already re-copies the plugin ones into the live profile on every boot
 * — so a patch is a small, verifiable overwrite plus a way back.
 *
 * Three rules make that safe:
 *   - **a path policy**, so a patch can never touch the harness, `node_modules`, or the
 *     Electron shell: only the shipped profile resources and our own main-process modules;
 *   - **a checksum plus an explicit list of the versions it applies to**, so a payload can
 *     neither arrive corrupted nor land on a version it was never tested against;
 *   - **a backup of every file it replaces**, plus a pending marker, so a patch that breaks
 *     the boot can be rolled back mechanically instead of by hand.
 */
import { createHash } from 'node:crypto'
import { copyFileSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { dirname, isAbsolute, join, normalize, relative, sep } from 'node:path'

/** Where the app records an applied patch and a boot that has not confirmed itself yet. */
export const STATE_DIRNAME = 'patch-state'

/** Paths a payload may write, relative to the install root. Everything else is refused. */
export const ALLOWED_PREFIXES = [
  'resources/profile-web', // the shipped profile: manifest, patch rows, presets, defaults
  'resources/app/src',     // our own main-process modules
  'resources/app/dist',    // preload / renderer bundles we build
]

/** Within an allowed prefix these are still off limits: dependencies are not patchable. */
export const FORBIDDEN_SEGMENTS = ['node_modules', '.git']

/** The manifest that describes a patch. `appliesTo` is what keeps it off other versions. */
export function validateManifest(text, { appVersion = '' } = {}) {
  let raw
  try {
    raw = JSON.parse(text)
  } catch (error) {
    throw new Error(`patch manifest is not JSON: ${error.message}`)
  }
  const { patchId, appliesTo, payloadUrl, sha256, requiresRestart = true, summary = '' } = raw ?? {}
  if (typeof patchId !== 'string' || !/^[0-9]+\.[0-9]+\.[0-9]+-p[0-9]+$/.test(patchId)) {
    throw new Error('patch manifest needs a patchId like "0.2.3-p1"')
  }
  if (!Array.isArray(appliesTo) || appliesTo.length === 0 || appliesTo.some((one) => typeof one !== 'string')) {
    throw new Error('patch manifest needs a non-empty appliesTo list')
  }
  if (typeof sha256 !== 'string' || !/^[0-9a-f]{64}$/.test(sha256)) {
    throw new Error('patch manifest needs a sha256 of the payload')
  }
  if (typeof payloadUrl !== 'string' || !/^https?:\/\//.test(payloadUrl)) {
    throw new Error('patch manifest needs an http(s) payloadUrl')
  }
  if (appVersion !== '' && !appliesTo.includes(appVersion)) {
    const error = new Error(`patch ${patchId} does not apply to ${appVersion} (appliesTo: ${appliesTo.join(', ')})`)
    error.code = 'PATCH_WRONG_VERSION'
    throw error
  }
  return {
    patchId,
    appliesTo: [...appliesTo],
    payloadUrl,
    sha256: sha256.toLowerCase(),
    requiresRestart: requiresRestart !== false,
    summary: typeof summary === 'string' ? summary : '',
  }
}

/** The sha256 of a file, as the manifest records it. */
export function sha256Of(file) {
  return createHash('sha256').update(readFileSync(file)).digest('hex')
}

/** Whether a payload entry may be written to the install tree. */
export function isAllowedPath(rel) {
  if (typeof rel !== 'string' || rel === '' || isAbsolute(rel)) return false
  const clean = normalize(rel).split(sep).join('/')
  if (clean.startsWith('../') || clean.includes('/../')) return false
  if (FORBIDDEN_SEGMENTS.some((seg) => clean.split('/').includes(seg))) return false
  return ALLOWED_PREFIXES.some((prefix) => clean === prefix || clean.startsWith(`${prefix}/`))
}

/** Every file under `dir`, as paths relative to `dir`. */
function filesUnder(dir) {
  if (!existsSync(dir)) return []
  const out = []
  const walk = (current) => {
    for (const entry of readdirSync(current, { withFileTypes: true })) {
      const full = join(current, entry.name)
      if (entry.isDirectory()) walk(full)
      else if (entry.isFile()) out.push(relative(dir, full).split(sep).join('/'))
    }
  }
  walk(dir)
  return out.sort()
}

/** The payload entries a patch would write, refusing the whole payload on one bad path. */
export function planPayload(payloadDir) {
  const files = filesUnder(payloadDir)
  if (files.length === 0) throw new Error('the payload is empty')
  const refused = files.filter((rel) => !isAllowedPath(rel))
  if (refused.length > 0) throw new Error(`the payload writes outside the allowed paths: ${refused.join(', ')}`)
  return files
}

/**
 * Write a payload into the install tree, keeping a copy of everything it replaces.
 *
 * @param {{root: string, payloadDir: string, stateDir: string, manifest: object}} options
 * @returns {{patchId: string, files: string[], backupDir: string}} what was written, and where the way back is.
 */
export function applyPayload({ root, payloadDir, stateDir, manifest }) {
  const files = planPayload(payloadDir)
  const backupDir = join(stateDir, `backup-${manifest.patchId}`, 'files')
  mkdirSync(backupDir, { recursive: true })
  const replaced = []
  const created = []
  for (const rel of files) {
    const target = join(root, rel)
    if (existsSync(target)) {
      const saved = join(backupDir, rel)
      mkdirSync(dirname(saved), { recursive: true })
      copyFileSync(target, saved)
      replaced.push(rel)
    } else {
      created.push(rel)
    }
  }
  mkdirSync(join(stateDir, 'backup-' + manifest.patchId), { recursive: true })
  writeFileSync(join(stateDir, `backup-${manifest.patchId}`, 'backup.json'),
    `${JSON.stringify({ patchId: manifest.patchId, replaced, created }, null, 2)}\n`)
  for (const rel of files) {
    const target = join(root, rel)
    mkdirSync(dirname(target), { recursive: true })
    copyFileSync(join(payloadDir, rel), target)
  }
  // Pending until a boot confirms itself; see pendingPatch/confirmPatchBoot.
  writeFileSync(join(stateDir, 'pending.json'),
    `${JSON.stringify({ patchId: manifest.patchId, appliedAt: new Date().toISOString(), boots: 0 }, null, 2)}\n`)
  return { patchId: manifest.patchId, files, backupDir: join(stateDir, `backup-${manifest.patchId}`) }
}

/** Put back every file an earlier `applyPayload` replaced, and remove the ones it created. */
export function restoreBackup({ root, stateDir, patchId }) {
  const record = join(stateDir, `backup-${patchId}`, 'backup.json')
  if (!existsSync(record)) throw new Error(`no backup for patch ${patchId}`)
  const { replaced = [], created = [] } = JSON.parse(readFileSync(record, 'utf8'))
  for (const rel of replaced) {
    const saved = join(stateDir, `backup-${patchId}`, 'files', rel)
    if (!existsSync(saved)) continue
    mkdirSync(dirname(join(root, rel)), { recursive: true })
    copyFileSync(saved, join(root, rel))
  }
  for (const rel of created) {
    const target = join(root, rel)
    if (existsSync(target)) rmSync(target, { force: true })
  }
  rmSync(join(stateDir, 'pending.json'), { force: true })
  return { patchId, restored: replaced.length, removed: created.length }
}

/** The patch that is waiting for a boot to confirm itself, or null. */
export function pendingPatch(stateDir) {
  const file = join(stateDir, 'pending.json')
  if (!existsSync(file)) return null
  try {
    return JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    return null
  }
}

/**
 * Count a boot against the pending patch. Called once per launch, early.
 *
 * @returns {{rolledBack: string|null, boot: number|null}} `rolledBack` names the patch that was
 *   taken back out because an earlier launch never confirmed itself.
 */
export function countBoot({ root, stateDir }) {
  const pending = pendingPatch(stateDir)
  if (pending === null) return { rolledBack: null, boot: null }
  const boots = Number.isInteger(pending.boots) ? pending.boots + 1 : 1
  if (boots > 1) {
    // The previous launch applied this patch and never reached the ready signal.
    try {
      restoreBackup({ root, stateDir, patchId: pending.patchId })
      rmSync(join(stateDir, `backup-${pending.patchId}`), { recursive: true, force: true })
      return { rolledBack: pending.patchId, boot: null }
    } catch {
      return { rolledBack: null, boot: boots }
    }
  }
  writeFileSync(join(stateDir, 'pending.json'),
    `${JSON.stringify({ ...pending, boots }, null, 2)}\n`)
  return { rolledBack: null, boot: boots }
}

/** The launch reached the ready signal: the patch is good, stop counting boots at it. */
export function confirmPatchBoot(stateDir) {
  const pending = pendingPatch(stateDir)
  if (pending === null) return null
  rmSync(join(stateDir, 'pending.json'), { force: true })
  writeFileSync(join(stateDir, 'applied.json'),
    `${JSON.stringify({ patchId: pending.patchId, confirmedAt: new Date().toISOString() }, null, 2)}\n`)
  return pending.patchId
}
