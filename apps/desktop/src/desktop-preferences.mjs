/**
 * Shell-side preferences the *window* needs at creation time.
 *
 * Today that is only the Linux frame choice: the default here is a frameless
 * window (niri and friends move borderless windows, and the UI draws its own
 * chrome), but anyone on a desktop that expects a title bar can ask for the
 * native one instead. The value has to be readable before a window exists, so it
 * lives in $DSH_HOME rather than in the renderer's localStorage — and it survives
 * updates because $DSH_HOME does.
 *
 * Kept free of Electron so it can be unit-tested under plain node.
 *
 * @module desktop-preferences
 */

import { existsSync, mkdirSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'

/** File name inside $DSH_HOME. */
export const PREFERENCES_FILE = 'desktop-preferences.json'

/** Values used when the file is missing, unreadable or malformed. */
export const DEFAULT_PREFERENCES = Object.freeze({
  nativeFrame: false,
  // 'system' follows the environment and then the desktop's own proxy settings, which is
  // what almost everyone wants: the host is a Node process and Node ignores the variables
  // unless it is told, so the shell resolves this and hands it over.
  proxyMode: 'system',
  proxyUrl: '',
})

/**
 * Resolve the preferences file inside a harness home.
 * @param home - $DSH_HOME.
 * @returns the absolute path of the preferences file.
 */
export function preferencesPath(home) {
  return join(home, PREFERENCES_FILE)
}

/**
 * Read the preferences, falling back to the defaults for anything missing.
 * @param home - $DSH_HOME.
 * @returns the merged preferences.
 */
export function readPreferences(home) {
  const file = preferencesPath(home)
  if (!existsSync(file)) return { ...DEFAULT_PREFERENCES }
  let parsed
  try {
    parsed = JSON.parse(readFileSync(file, 'utf8'))
  } catch {
    // A malformed file must not stop the app from starting; the defaults are
    // always a working configuration.
    return { ...DEFAULT_PREFERENCES }
  }
  if (parsed === null || typeof parsed !== 'object' || Array.isArray(parsed)) return { ...DEFAULT_PREFERENCES }
  return { ...DEFAULT_PREFERENCES, ...parsed }
}

/**
 * Merge a patch into the preferences and write them back atomically.
 * @param home - $DSH_HOME.
 * @param patch - keys to change.
 * @returns the stored preferences after the write.
 */
export function writePreferences(home, patch) {
  const next = { ...readPreferences(home), ...patch }
  const file = preferencesPath(home)
  mkdirSync(dirname(file), { recursive: true })
  const serialized = `${JSON.stringify(next, null, 2)}\n`
  const temp = `${file}.tmp-${process.pid}`
  writeFileSync(temp, serialized)
  // Parse what we are about to install: a truncated write would otherwise brick
  // the next launch with a preference the shell cannot read.
  JSON.parse(readFileSync(temp, 'utf8'))
  renameSync(temp, file)
  return next
}

/**
 * Whether the window should carry the platform's own title bar.
 * @param platform - `process.platform`.
 * @param preferences - result of {@link readPreferences}.
 * @returns true when the native frame should be used.
 */
export function wantsNativeFrame(platform, preferences) {
  // macOS and Windows have no substitute for the system controls, so they always
  // get the native frame; Linux defaults to frameless and can opt in.
  if (platform !== 'linux') return true
  return preferences.nativeFrame === true
}
