/**
 * Where this app keeps its harness data, how the user points it somewhere else,
 * and how an existing home is carried over when it moves.
 *
 * WHY a home of its own: sharing `~/.dsh` with the harness CLI (and with whatever
 * else was installed before) means any of them can migrate a session log, rewrite
 * settings or hold a session store open while another one writes — the failure
 * mode is a corrupted log in a conversation the user cared about. The app owns its
 * data instead, and `DSH_HOME` still overrides everything for development.
 *
 * The first-run move is a COPY, not a rename: the old home stays intact as a
 * fallback, and a running harness CLI pointed at it keeps working. Only user data
 * is carried — caches and logs are rebuilt. Relocating by hand (Settings → General →
 * data location) is the same operation with the source chosen by the user, and can
 * additionally delete what it copied ("move").
 *
 * The chosen location is recorded in a small config file inside Electron's own
 * userData directory, NOT inside the home: a pointer cannot live in the directory
 * it points at. `DSH_HOME` still outranks it, for development.
 *
 * No Electron imports: the decision logic is unit-tested under plain node.
 *
 * @module desktop-home
 */

import { chmodSync, cpSync, existsSync, lstatSync, mkdirSync, readFileSync, readdirSync, renameSync, rmSync, writeFileSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, isAbsolute, join, relative, resolve, win32 } from 'node:path'

/**
 * Items the harness refuses to run with when they are group/world readable.
 * A copy keeps the permissions it found, so a `~/.dsh` whose credentials were
 * created with a loose umask would migrate into a home that cannot start: the
 * host exits with "is readable beyond its owner (mode 644)". Tightening them on
 * the way in costs nothing and turns a dead app into a working one.
 */
export const PRIVATE_ITEMS = Object.freeze(['.credentials.yaml'])

/**
 * chmod 600 every private item that is now in the target home.
 * @param items - top-level entries that were considered.
 * @param to - destination home.
 * @param options - injectable `chmod`/`exists`/`log`.
 */
function restrictPrivateItems(items, to, { chmod = chmodSync, exists = existsSync, log = () => {} } = {}) {
  for (const item of items) {
    if (!PRIVATE_ITEMS.includes(item)) continue
    const target = join(to, item)
    if (!exists(target)) continue
    try {
      chmod(target, 0o600)
    } catch (error) {
      log(`home: could not restrict ${target}: ${String(error?.message ?? error)}`)
    }
  }
}

/** Marker written into the new home once the migration ran. */
export const MIGRATION_MARKER = '.migrated-from-dsh-home.json'

/** The previous, shared location this app used before it had its own home. */
export function legacyHome(home = homedir()) {
  return join(home, '.dsh')
}

/**
 * The platform's own place for per-user application data.
 * @param platform - `process.platform`.
 * @param env - environment (honours XDG_DATA_HOME / APPDATA).
 * @param home - user's home directory.
 * @returns the default `$DSH_HOME` for this app.
 */
export function defaultHome(platform, env = {}, home = homedir()) {
  if (platform === 'darwin') return join(home, 'Library', 'Application Support', 'neo-dsh')
  // `win32.join` rather than `join`: this function is also called from tests and
  // tools on Linux/macOS to ask "what would Windows use?", and there the default
  // `join` is POSIX and would hand back a doctored `C:\…/neo-dsh`.
  if (platform === 'win32') {
    return win32.join(env.APPDATA ?? win32.join(home, 'AppData', 'Roaming'), 'neo-dsh')
  }
  return join(env.XDG_DATA_HOME ?? join(home, '.local', 'share'), 'neo-dsh')
}

/**
 * Electron's own per-user directory for this app (`app.getPath('userData')`),
 * computed without Electron so scripts and tests can find the config file that
 * records the chosen data location.
 *
 * The name is the package name, which is what Electron uses by default; only a
 * `--user-data-dir` switch (the dev window) changes it at runtime.
 *
 * @param platform - `process.platform`.
 * @param env - environment (honours XDG_CONFIG_HOME / APPDATA).
 * @param home - user's home directory.
 * @returns the default userData directory.
 */
export function defaultUserDataDir(platform, env = {}, home = homedir()) {
  const name = 'neo-dsh-desktop'
  if (platform === 'darwin') return join(home, 'Library', 'Application Support', name)
  if (platform === 'win32') {
    return win32.join(env.APPDATA ?? win32.join(home, 'AppData', 'Roaming'), name)
  }
  return join(env.XDG_CONFIG_HOME ?? join(home, '.config'), name)
}

/**
 * What is worth carrying over from the old home: conversations and everything that
 * makes them usable (workspace registry, attachments), plus the user's settings,
 * credentials, presets and installed profile. Caches and logs are left behind.
 */
export const MIGRATION_ITEMS = Object.freeze([
  'sessions',
  'storages',
  'attachments',
  'profiles',
  'llm-deepseek',
  '.agent-presets',
  'settings.yaml',
  '.credentials.yaml',
  '.anonymous-user-id',
  'desktop-preferences.json',
])

/**
 * Decide whether the migration should run, and what it would copy.
 * @param options - `from`, `to`, plus injectable `exists` for tests.
 * @returns `{ migrate, reason?, items? }`.
 */
export function migrationPlan({ from, to, exists = existsSync }) {
  if (from === to) return { migrate: false, reason: 'same path' }
  if (!exists(from)) return { migrate: false, reason: 'no previous home' }
  if (exists(join(to, MIGRATION_MARKER))) return { migrate: false, reason: 'already migrated' }
  const items = MIGRATION_ITEMS.filter((item) => exists(join(from, item)) && !exists(join(to, item)))
  return { migrate: true, items }
}

/**
 * Copy the old home's user data into the new one and mark it done.
 *
 * Never overwrites: an item already present in the new home is left alone, so a
 * half-finished migration or a file the app recreated cannot be clobbered.
 * Symlinks are copied as symlinks (a preset whose files are linked into a source
 * checkout keeps working).
 *
 * @param options - `from`, `to`, injectable `copy`/`exists`/`write`/`now`/`log`.
 * @returns a report: `{ migrated, from? , reason? }`.
 */
export function migrateHome(options) {
  const {
    from,
    to,
    copy = (source, target) => cpSync(source, target, { recursive: true, errorOnExist: false }),
    exists = existsSync,
    lstat = lstatSync,
    readdir = (dir) => readdirSync(dir, { withFileTypes: true }),
    chmod = chmodSync,
    write = writeFileSync,
    mkdir = mkdirSync,
    version,
    now = () => new Date(),
    log = () => {},
  } = options

  const plan = migrationPlan({ from, to, exists })
  if (!plan.migrate) {
    log(`home: not migrating from ${from} (${plan.reason})`)
    return { migrated: [], reason: plan.reason }
  }

  mkdir(to, { recursive: true })
  const migrated = []
  // One whole-item copy per absent entry: it is a single recursive copy, and the
  // normal case (an empty new home) is the one that has to be fast.
  for (const item of plan.items) {
    try {
      copy(join(from, item), join(to, item))
      migrated.push(item)
    } catch (error) {
      // One unreadable item must not abort the move: the app can start without it
      // and the old home still has it.
      log(`home: could not carry over ${item}: ${String(error?.message ?? error)}`)
    }
  }
  // An entry the new home already had is walked file by file: it may have been
  // created by something else before this app ever ran (a CLI command pointed at
  // this home, a leftover), and skipping the whole entry would silently drop
  // everything inside it — including the user's plugin set.
  const shared = MIGRATION_ITEMS.filter((item) => exists(join(from, item)) && exists(join(to, item)))
  const added = carryMissing({
    from, to, items: shared, exists, lstat, readdir, copy, mkdir, log,
  })
  restrictPrivateItems(MIGRATION_ITEMS, to, { chmod, exists, log })
  write(
    join(to, MIGRATION_MARKER),
    `${JSON.stringify({ from, at: now().toISOString(), version, items: migrated }, null, 2)}\n`,
  )
  const carried = topLevelItems(added).filter((name) => !migrated.includes(name))
  log(`home: migrated ${migrated.length} item(s) from ${from} → ${to}: ${migrated.join(', ')}`)
  if (added.length > 0) {
    log(`home: carried ${added.length} more file(s) into entries this home already had: ${carried.join(', ')}`)
  }
  return { migrated: [...migrated, ...carried], added, from }
}

// ---- where the user put the data ------------------------------------------

/** Config file (inside Electron's userData) that records the chosen location. */
export const CONFIG_FILE = 'desktop-config.json'

/** Written into an old home that was emptied by a "move", so it explains itself. */
export const MOVED_MARKER = '.moved-to.json'

/** A pointer to a location that is not there yet is a broken app, so it is dropped. */
export function configPath(configDir) {
  return join(configDir, CONFIG_FILE)
}

function readConfig(configDir) {
  try {
    const parsed = JSON.parse(readFileSync(configPath(configDir), 'utf8'))
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * The user's chosen data location, or null when they never chose one.
 * @param configDir - the shell's own userData directory.
 * @returns an absolute path, or null.
 */
export function readDataHome(configDir) {
  const value = readConfig(configDir).dataHome
  // A relative path would resolve against whatever the working directory happens
  // to be, which is not a location anyone can mean.
  return typeof value === 'string' && value.trim() !== '' && isAbsolute(value) ? value : null
}

/**
 * Record (or with null, forget) the user's chosen data location.
 * @param configDir - the shell's own userData directory.
 * @param value - absolute path, or null to fall back to the default.
 * @returns the config as stored.
 */
export function writeDataHome(configDir, value) {
  const next = { ...readConfig(configDir), dataHome: value === null ? null : resolve(String(value)) }
  const file = configPath(configDir)
  mkdirSync(dirname(file), { recursive: true })
  const temp = `${file}.tmp-${process.pid}`
  writeFileSync(temp, `${JSON.stringify(next, null, 2)}\n`)
  JSON.parse(readFileSync(temp, 'utf8'))
  renameSync(temp, file)
  return next
}

/**
 * Decide which directory the app should use, and why.
 * @param options - `configDir`, `platform`, `env`, `home`.
 * @returns `{ path, source }` with source `env` | `configured` | `default`.
 */
export function resolveHome({ configDir, platform, env = {}, home = homedir() }) {
  const override = typeof env.DSH_HOME === 'string' ? env.DSH_HOME.trim() : ''
  if (override !== '') return { path: override, source: 'env' }
  const chosen = configDir === undefined ? null : readDataHome(configDir)
  if (chosen !== null) return { path: chosen, source: 'configured' }
  return { path: defaultHome(platform, env, home), source: 'default' }
}

// ---- relocating an existing home ------------------------------------------

/** Rebuilt on demand, never worth carrying across a move. */
export const MOVE_SKIP = Object.freeze(['desktop.log', 'update.log'])

/** Files every desktop leaves in a folder they consider new. */
export const TARGET_JUNK = Object.freeze(['.DS_Store', '.localized'])

/**
 * Whether a directory is new enough to become the data location: absent, or empty
 * apart from the files the OS puts in every folder.
 * @param dir - target directory.
 * @param options - injectable `readdir`.
 * @returns true when nothing in there could be overwritten.
 */
export function isEffectivelyEmpty(dir, { readdir = (d) => readdirSync(d) } = {}) {
  let entries
  try {
    entries = readdir(dir)
  } catch (error) {
    if (error?.code === 'ENOENT') return true
    throw error
  }
  return entries.every((name) => TARGET_JUNK.includes(String(name)))
}

/**
 * How two paths relate: one inside the other cannot be a move target.
 * @param from - current location.
 * @param to - proposed location.
 * @returns `same` | `inside-source` | `inside-target` | `separate`.
 */
export function pathRelation(from, to) {
  if (resolve(from) === resolve(to)) return 'same'
  const within = (parent, child) => {
    const rel = relative(parent, child)
    return rel !== '' && !rel.startsWith('..') && !isAbsolute(rel)
  }
  if (within(from, to)) return 'inside-source'
  if (within(to, from)) return 'inside-target'
  return 'separate'
}

/**
 * Decide whether a relocation may run. Reasons are codes: the settings row turns
 * them into a sentence in the reader's language.
 * @param options - `from`, `to`, injectable `exists`/`readdir`.
 * @returns `{ move, reason?, relation? }`.
 */
export function relocationPlan({ from, to, exists = existsSync, readdir }) {
  const relation = pathRelation(from, to)
  if (relation === 'same') return { move: false, reason: 'same-path', relation }
  if (relation !== 'separate') return { move: false, reason: 'nested-path', relation }
  if (exists(to) && !isEffectivelyEmpty(to, readdir === undefined ? {} : { readdir })) {
    return { move: false, reason: 'target-not-empty', relation }
  }
  return { move: true, relation }
}

/**
 * Carry a home to a new location.
 *
 * `copy` leaves the old directory alone (the safe default, and what a first move
 * should be); `move` deletes only the entries it copied, and only after copying,
 * so an interrupted move can never lose data. Logs stay behind as a record.
 *
 * @param options - `from`, `to`, `mode`, injectable fs seams, `log`.
 * @returns `{ moved, failed, mode?, reason?, from?, to? }`.
 */
export function moveHome(options) {
  const {
    from,
    to,
    mode = 'copy',
    copy = (source, target) => cpSync(source, target, { recursive: true, errorOnExist: false, force: false }),
    exists = existsSync,
    readdir = (dir) => readdirSync(dir),
    remove = (target) => rmSync(target, { recursive: true, force: true }),
    chmod = chmodSync,
    mkdir = mkdirSync,
    write = writeFileSync,
    now = () => new Date(),
    log = () => {},
  } = options

  const plan = relocationPlan({ from, to, exists, readdir })
  if (!plan.move) {
    log(`home: not relocating to ${to} (${plan.reason})`)
    return { moved: [], reason: plan.reason }
  }

  mkdir(to, { recursive: true })
  const moved = []
  const failed = []
  for (const name of readdir(from)) {
    if (MOVE_SKIP.includes(name)) continue
    try {
      copy(join(from, name), join(to, name))
      moved.push(name)
    } catch (error) {
      log(`home: could not carry over ${name}: ${String(error?.message ?? error)}`)
      failed.push(name)
    }
  }
  restrictPrivateItems(moved, to, { chmod, exists, log })
  write(
    join(to, MIGRATION_MARKER),
    `${JSON.stringify({ from, at: now().toISOString(), mode, items: moved }, null, 2)}\n`,
  )
  if (mode === 'move') {
    for (const name of moved) {
      try {
        remove(join(from, name))
      } catch (error) {
        log(`home: copied ${name} but could not remove it: ${String(error?.message ?? error)}`)
      }
    }
    write(join(from, MOVED_MARKER), `${JSON.stringify({ to, at: now().toISOString(), items: moved }, null, 2)}\n`)
  }
  log(`home: ${mode === 'move' ? 'moved' : 'copied'} ${moved.length} item(s) ${from} → ${to}`)
  return { moved, failed, mode, from, to }
}

// ---- keeping a home current across updates --------------------------------

/**
 * What an update re-checks in the old home.
 *
 * Conversations and what makes them readable, plus the small text the user
 * authored (presets). Deliberately NOT the config files: those were settled by the
 * first migration and the app's copy is the one that stayed up to date. `profiles`
 * is left out too — it holds the plugin set the app manages itself, and walking
 * its `node_modules` on every update would cost far more than it could ever add.
 */
export const MERGE_ITEMS = Object.freeze([
  'sessions',
  'storages',
  'attachments',
  'llm-deepseek',
  '.agent-presets',
])

/**
 * Read a home's migration marker; `{}` when it is missing or unreadable.
 * @param to - the home.
 * @param options - injectable `read`/`exists`.
 * @returns the marker's fields.
 */
export function readMigrationMarker(to, { read = readFileSync, exists = existsSync } = {}) {
  const file = join(to, MIGRATION_MARKER)
  if (!exists(file)) return {}
  try {
    const parsed = JSON.parse(read(file, 'utf8'))
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

/** The top-level names behind a list of paths relative to the home. */
function topLevelItems(paths) {
  const names = new Set()
  for (const entry of paths) names.add(String(entry).split(/[\\/]/)[0])
  return [...names].sort()
}

/**
 * Copy every file under `items` that the destination does not have yet.
 *
 * The one primitive behind both the first migration and the per-update merge:
 * it only ever reads the source, and never overwrites a file that exists — a name
 * that is already in the destination is the live one. Directories are created as
 * needed, symlinks are copied as symlinks.
 *
 * @param options - `from`, `to`, `items`, injectable fs seams and `log`.
 * @returns the paths it copied, relative to `from`.
 */
function carryMissing(options) {
  const {
    from,
    to,
    items,
    exists = existsSync,
    lstat = lstatSync,
    readdir = (dir) => readdirSync(dir, { withFileTypes: true }),
    copy = (source, target) => cpSync(source, target, { recursive: true, errorOnExist: false, force: false }),
    mkdir = mkdirSync,
    log = () => {},
  } = options

  const added = []
  const walk = (source, target) => {
    let stat
    try {
      stat = lstat(source)
    } catch (error) {
      if (error?.code !== 'ENOENT') log(`home: could not read ${source}: ${String(error?.message ?? error)}`)
      return
    }
    if (stat.isDirectory()) {
      mkdir(target, { recursive: true })
      let entries
      try {
        entries = readdir(source)
      } catch (error) {
        log(`home: could not list ${source}: ${String(error?.message ?? error)}`)
        return
      }
      for (const entry of entries) {
        const name = typeof entry === 'string' ? entry : entry.name
        walk(join(source, name), join(target, name))
      }
      return
    }
    if (exists(target)) return
    try {
      copy(source, target)
      added.push(relative(from, source))
    } catch (error) {
      log(`home: could not carry over ${source}: ${String(error?.message ?? error)}`)
    }
  }

  for (const item of items) walk(join(from, item), join(to, item))
  return added
}

/** Copy everything in the old home this home does not have yet, then stamp the
 * marker with the version that did it.
 *
 * Runs when the app version changed since the last sync, so an update still finds
 * conversations that the CLI — or an older build — wrote to `~/.dsh` in the
 * meantime. Never overwrites: a file that exists here is the live one, and the old
 * home is only ever read.
 *
 * @param options - `from`, `to`, `version`, injectable fs seams and `log`.
 * @returns `{ added, reason? }` with paths relative to `from`.
 */
export function mergeHome(options) {
  const {
    from,
    to,
    version,
    items = MERGE_ITEMS,
    exists = existsSync,
    lstat = lstatSync,
    readdir = (dir) => readdirSync(dir, { withFileTypes: true }),
    copy = (source, target) => cpSync(source, target, { recursive: true, errorOnExist: false, force: false }),
    mkdir = mkdirSync,
    chmod = chmodSync,
    write = writeFileSync,
    read = readFileSync,
    now = () => new Date(),
    log = () => {},
  } = options

  if (pathRelation(from, to) === 'same') {
    log(`home: not merging ${from} into itself`)
    return { added: [], reason: 'same-path' }
  }
  if (!exists(from)) {
    log(`home: not merging from ${from} (no previous home)`)
    return { added: [], reason: 'no previous home' }
  }

  const added = carryMissing({ from, to, items, exists, lstat, readdir, copy, mkdir, log })
  restrictPrivateItems(items, to, { chmod, exists, log })

  const marker = readMigrationMarker(to, { read, exists })
  write(
    join(to, MIGRATION_MARKER),
    `${JSON.stringify(
      { ...marker, from, version, mergedAt: now().toISOString(), mergedItems: added },
      null,
      2,
    )}\n`,
  )
  log(`home: merged ${added.length} new file(s) from ${from} (app ${version})`)
  return { added, from, to, version }
}

/**
 * Make the home current with the shared `~/.dsh`, once per app version.
 *
 * Three outcomes, and the cheap one has to be the common one:
 *   * no marker      → the first migration (whole items the home does not have)
 *   * other version  → a merge (files the home does not have), then re-stamp
 *   * same version   → nothing at all, `~/.dsh` is not even opened
 *
 * @param options - `from`, `to`, `version`, plus the seams the called function takes.
 * @returns `{ kind, migrated?, added?, reason? }`.
 */
export function syncHome(options) {
  const { from, to, version, exists = existsSync, log = () => {} } = options

  if (pathRelation(from, to) === 'same') {
    log(`home: ${to} is the shared home; nothing to sync`)
    return { kind: 'same', migrated: [], added: [], reason: 'same-path' }
  }
  if (!exists(join(to, MIGRATION_MARKER))) {
    const report = migrateHome({ ...options, version })
    return { kind: 'migrate', migrated: report.migrated, added: [], reason: report.reason }
  }

  const marker = readMigrationMarker(to, { exists })
  if (marker.version === version) {
    log(`home: ${to} is already current (${version}); not scanning ${from}`)
    return { kind: 'current', migrated: [], added: [] }
  }
  const report = mergeHome({ ...options, version })
  return { kind: 'merge', migrated: [], added: report.added, reason: report.reason }
}
