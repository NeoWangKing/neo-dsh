/**
 * Safe mode, and noticing that the app keeps failing to start.
 *
 * A plugin, a profile manifest or a settings file that the user (or an agent) edited can
 * leave the app unable to open a window — and then there is no UI left to fix it from.
 * Two things make that survivable: a boot that starts from the shipped profile only, and
 * a counter that notices repeated failures and offers that boot on the next launch.
 *
 * Safe mode deliberately does not touch what is broken. It loads `profiles/web-safe`
 * (re-seeded from the shipped profile every launch) and only moves a `settings.yaml` that
 * cannot be parsed out of the way, so nothing about the user's own setup is lost or
 * rewritten.
 *
 * No Electron and no YAML parser here: the shell injects the parser, so everything is
 * unit-tested under plain node.
 *
 * @module boot-guard
 */

import { copyFileSync, cpSync, existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/** Boot state file, inside the harness home. */
export const BOOT_STATE = 'desktop-boot.json'

/** The profile safe mode serves. Re-seeded from the shipped profile on every launch. */
export const SAFE_PROFILE = 'web-safe'

/**
 * Whether this launch asked for safe mode.
 * @param argv - the process arguments (`--safe`, `--safe-mode`).
 * @param env - the environment (`DSH_DESKTOP_SAFE=1`).
 * @returns true when safe mode was requested.
 */
export function isSafeRequested(argv = [], env = {}) {
  if (/^(1|true|yes|on)$/i.test(String(env.DSH_DESKTOP_SAFE ?? '').trim())) return true
  return (argv ?? []).some((arg) => arg === '--safe' || arg === '--safe-mode')
}

/** Where the boot state lives. */
export function bootStatePath(home) {
  return join(home, BOOT_STATE)
}

/**
 * Read the boot state.
 * @param home - the harness home.
 * @param options - injectable `read`/`exists`.
 * @returns `{failures, lastFailureAt?, lastReason?}`; failures is 0 when unknown.
 */
export function readBootState(home, { read = readFileSync, exists = existsSync } = {}) {
  const file = bootStatePath(home)
  if (!exists(file)) return { failures: 0 }
  try {
    const parsed = JSON.parse(read(file, 'utf8'))
    if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return { failures: 0 }
    const failures = Number(parsed.failures)
    return { ...parsed, failures: Number.isInteger(failures) && failures > 0 ? failures : 0 }
  } catch {
    return { failures: 0 }
  }
}

/**
 * Write the boot state.
 * @param home - the harness home.
 * @param state - what to store.
 * @param options - injectable `write`/`mkdir`.
 * @returns the state as written.
 */
export function writeBootState(home, state, { write = writeFileSync, mkdir = mkdirSync } = {}) {
  const file = bootStatePath(home)
  mkdir(dirname(file), { recursive: true })
  write(file, `${JSON.stringify(state, null, 2)}\n`)
  return state
}

/**
 * Count one start that did not make it.
 * @param home - the harness home.
 * @param reason - what failed, for the next launch to show.
 * @param options - injectable fs seams and `now`.
 * @returns the stored state.
 */
export function recordBootFailure(home, reason, options = {}) {
  const { now = () => new Date(), ...seams } = options
  const previous = readBootState(home, seams)
  return writeBootState(
    home,
    {
      ...previous,
      failures: previous.failures + 1,
      lastFailureAt: now().toISOString(),
      lastReason: String(reason ?? '').slice(0, 500),
    },
    seams,
  )
}

/**
 * Forget the failures: a window that loaded means the app is working again.
 * @param home - the harness home.
 * @param options - injectable fs seams and `now`.
 * @returns the stored state.
 */
export function clearBootFailures(home, options = {}) {
  const { now = () => new Date(), ...seams } = options
  const previous = readBootState(home, seams)
  if (previous.failures === 0 && previous.lastSuccessAt !== undefined) return previous
  return writeBootState(home, { ...previous, failures: 0, lastSuccessAt: now().toISOString() }, seams)
}

/**
 * Whether the failures have piled up enough to offer safe mode.
 * @param state - from {@link readBootState}.
 * @param options - `threshold` (default 2).
 * @returns true when the next launch should offer safe mode.
 */
export function shouldOfferSafeMode(state, { threshold = 2 } = {}) {
  return (state?.failures ?? 0) >= threshold
}

/**
 * Move a `settings.yaml` that cannot be parsed out of the way, and put the shipped
 * defaults back if there are any.
 *
 * The harness reads that file before it can serve anything, so a broken one means no
 * window at all. The file is renamed, never deleted.
 *
 * @param home - the harness home.
 * @param defaultsPath - the shipped defaults, or '' when there are none.
 * @param options - injectable `parse` (text → value, throwing on bad input), fs seams, `now`, `log`.
 * @returns `{repaired, movedTo?}`.
 */
export function repairSettings(home, defaultsPath, options = {}) {
  const {
    parse,
    read = readFileSync,
    exists = existsSync,
    rename = renameSync,
    copy = copyFileSync,
    now = () => new Date(),
    log = () => {},
  } = options

  const file = join(home, 'settings.yaml')
  if (!exists(file)) return { repaired: false }
  let text
  try {
    text = read(file, 'utf8')
  } catch (error) {
    log(`safe mode: could not read settings.yaml: ${String(error?.message ?? error)}`)
    return { repaired: false }
  }
  try {
    if (typeof parse === 'function') parse(text)
    return { repaired: false }
  } catch (error) {
    const stamp = now().toISOString().replace(/[:.]/g, '-')
    const movedTo = `${file}.broken-${stamp}`
    try {
      rename(file, movedTo)
    } catch (renameError) {
      log(`safe mode: could not move settings.yaml aside: ${String(renameError?.message ?? renameError)}`)
      return { repaired: false }
    }
    if (defaultsPath !== '' && exists(defaultsPath)) {
      try {
        copy(defaultsPath, file)
      } catch (copyError) {
        log(`safe mode: could not restore the default settings: ${String(copyError?.message ?? copyError)}`)
      }
    }
    log(`safe mode: settings.yaml does not parse, moved to ${movedTo}`)
    return { repaired: true, movedTo }
  }
}

// ---- is the normal profile even loadable? ---------------------------------

/**
 * The bundle list of a profile manifest.
 * @param text - contents of the profile's package.json.
 * @returns the bundle names.
 * @throws when the manifest is not JSON, or lists no bundles.
 */
export function profileBundles(text) {
  let parsed
  try {
    parsed = JSON.parse(String(text ?? ''))
  } catch (error) {
    throw new Error(`not valid JSON (${String(error?.message ?? error)})`)
  }
  const bundles = parsed?.dsh?.profile?.bundles
  if (!Array.isArray(bundles) || bundles.length === 0) throw new Error('lists no dsh.profile.bundles')
  return bundles
}

/**
 * Which of these bundles cannot be loaded.
 * @param bundles - names from `dsh.profile.bundles`.
 * @param canResolve - `(name) => boolean`, supplied by the shell.
 * @returns the names that do not resolve, in the order they were listed.
 */
export function unresolvedBundles(bundles, canResolve) {
  const list = Array.isArray(bundles) ? bundles : []
  return list.filter((name) => typeof name === 'string' && name !== '' && !canResolve(name))
}

/**
 * Replace a broken profile with the shipped one.
 *
 * The broken directory is renamed, never deleted: it is a working plugin set the user may
 * want to inspect or repair by hand. Materialising the bundled plugins is the caller's
 * job, because that needs the resources tree.
 *
 * @param options - `home`, `profile` (name), `shipped` (the profile to copy in), fs seams, `now`, `log`.
 * @returns `{repaired, movedTo?}`.
 */
export function repairProfile(options) {
  const {
    home,
    profile,
    shipped,
    move = renameSync,
    copy = cpSync,
    exists = existsSync,
    mkdir = mkdirSync,
    now = () => new Date(),
    log = () => {},
  } = options

  const live = join(home, 'profiles', profile)
  const stamp = now().toISOString().replace(/[:.]/g, '-')
  let movedTo
  if (exists(live)) {
    movedTo = `${live}.broken-${stamp}`
    try {
      move(live, movedTo)
    } catch (error) {
      log(`profile repair: could not move ${live} aside: ${String(error?.message ?? error)}`)
      return { repaired: false }
    }
  }
  if (!exists(shipped)) {
    log(`profile repair: the shipped profile ${shipped} is missing`)
    return { repaired: false, movedTo }
  }
  try {
    mkdir(join(home, 'profiles'), { recursive: true })
    copy(shipped, live, { recursive: true, dereference: true })
  } catch (error) {
    log(`profile repair: could not restore ${live}: ${String(error?.message ?? error)}`)
    return { repaired: false, movedTo }
  }
  log(`profile repair: ${live} replaced from ${shipped}${movedTo === undefined ? '' : ` (old copy at ${movedTo})`}`)
  return { repaired: true, movedTo }
}
