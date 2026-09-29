/**
 * dsh-desktop — Electron main process.
 *
 * The harness host runs as a managed child process (`dsh web --port <fixed>`)
 * under a plain Node runtime, never inside Electron. Electron only owns the
 * native window and the child lifecycle: it spawns the host on launch, parses
 * the readiness URL line from stdout, loads that URL in a BrowserWindow, and
 * stops the host on quit. Keeping the host on plain Node preserves the ABI of
 * the harness's native addons (Landlock sandbox, node-addon-require-builtin)
 * and reuses the exact launch path `dsh web` already exercises.
 *
 * Runtime layout, unpackaged vs packaged:
 *
 *   dev      node = `node` on PATH (or $DSH_NODE)
 *            resources = <repo>/apps/desktop/resources
 *   packaged node = <app>/resources/node/bin/node (official build, see
 *            scripts/fetch-node.mjs)
 *            resources = <app>/resources
 *
 * On first launch the packaged app seeds $DSH_HOME with the profile, preset and
 * default settings it ships; an existing file is never overwritten, so a user
 * who already runs the harness CLI keeps every session and setting.
 */

import { execFileSync, spawn } from 'node:child_process'
import { appendFileSync, chmodSync, cpSync, createWriteStream, existsSync, lstatSync, mkdirSync, readFileSync, renameSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { dirname, isAbsolute, join } from 'node:path'
import { createRequire } from 'node:module'
import { Readable } from 'node:stream'
import { pipeline } from 'node:stream/promises'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, crashReporter, dialog, Menu, shell } from 'electron'
import { UPDATE_REPO, downloadRelease, fetchLatestRelease, isNewer, pickAsset } from './update-logic.mjs'
import { readPreferences, wantsNativeFrame, writePreferences } from './desktop-preferences.mjs'
import {
  HOST_MARKER, classifyProbe, clearHostRecord, findPortHolder, isOrphan, portAction, probePort,
  readHolder, readHostRecord, waitForFree, writeHostRecord,
} from './host-guard.mjs'
import {
  SAFE_PROFILE, clearBootFailures, isSafeRequested, profileBundles, readBootState,
  recordBootFailure, repairProfile, repairSettings, shouldOfferSafeMode, unresolvedBundles,
} from './boot-guard.mjs'
import {
  defaultHome, defaultUserDataDir, legacyHome, moveHome, relocationPlan, resolveHome, syncHome,
  writeDataHome,
} from './desktop-home.mjs'

const require = createRequire(import.meta.url)

/** Same parser the harness uses for settings.yaml. */
const yaml = require('js-yaml')
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))

/** Electron's own per-user directory: settings that must survive a change of data
 * location, above all the location itself. A pointer cannot live inside the
 * directory it points at. */
function userDataDir() {
  try {
    return app.getPath('userData')
  } catch {
    // Only reachable if getPath failed; the computed default is still better than
    // refusing to start, and it is the same path scripts/app-home.mjs reads.
    return defaultUserDataDir(process.platform, process.env)
  }
}

/** Harness home: this app's OWN directory, not the shared `~/.dsh` the harness CLI
 * uses — two writers on one session store is how logs get corrupted. The user can
 * point it elsewhere from Settings; `DSH_HOME` outranks that for development. */
const HOME_CHOICE = resolveHome({
  configDir: userDataDir(),
  platform: process.platform,
  env: process.env,
})
const DSH_HOME = HOME_CHOICE.path

/** Safe mode: the shipped profile only, plus a settings file that parses. It can be
 * asked for on the command line (`--safe`), through the environment, or offered by the
 * shell itself after repeated failures to start. */
let safeMode = isSafeRequested(process.argv, process.env)

/** Shipped read-only tree (runtime, profile, preset, defaults). */
const RESOURCES = app.isPackaged ? process.resourcesPath : join(projectRoot, 'resources')

/** Log file: lives beside the rest of the harness data in $DSH_HOME. */
const LOG_PATH = join(DSH_HOME, 'desktop.log')

/** Readiness line the host prints once the server is up. Since 0.1.2-rc.1 the
 * local URL carries a one-time `?token=` auth query — the shell must load the
 * FULL URL (token included), never a bare `http://127.0.0.1:<port>`. */
const READY_LINE = /^dsh web: (http:\/\/127\.0\.0\.1:\d+[^\s]*)/
/** The `dsh` CLI bin the host runs: the bundled dependency, or an override.
 *
 * `DSH_DESKTOP_DSH_BIN` points the shell at a different harness build — a source
 * checkout's `lib/bin.js`, or another install — so the harness can be developed
 * without repackaging this app.
 * @returns the absolute path of the host entry point.
 */
function resolveDshBin() {
  const override = process.env.DSH_DESKTOP_DSH_BIN
  if (override !== undefined && override !== '') return override
  const manifest = require.resolve('@deepseek-ai/dsh/package.json')
  return join(dirname(manifest), 'lib', 'bin.js')
}

/**
 * The Node runtime that runs the host: an explicit override, else the runtime
 * shipped with the app, else whatever `node` is on PATH (development).
 * @returns the executable path or bare command name.
 */
function resolveNode() {
  if (process.env.DSH_NODE) return process.env.DSH_NODE
  const bundled = process.platform === 'win32'
    ? join(RESOURCES, 'node', 'node.exe')
    : join(RESOURCES, 'node', 'bin', 'node')
  return existsSync(bundled) ? bundled : 'node'
}

/**
 * The client plugins this app ships, as named by the shipped profile.
 *
 * They travel as `vendor/<name>` (electron-builder filters node_modules out of
 * extraResources) and the host resolves a bundle through the live profile's own
 * node_modules + `dsh.profile.bundles`, so both have to be present in the user's
 * writable profile — including in one that was seeded by an older build.
 * @returns the plugin package names the shipped profile declares.
 */
function bundledPlugins() {
  const manifest = join(RESOURCES, 'profile-web', 'package.json')
  if (!existsSync(manifest)) return []
  try {
    const profile = JSON.parse(readFileSync(manifest, 'utf8'))
    const bundles = profile?.dsh?.profile?.bundles
    if (!Array.isArray(bundles)) return []
    return bundles.filter((name) => typeof name === 'string' && !name.startsWith('@deepseek-ai/'))
  } catch {
    return []
  }
}

/**
 * Which app version materialised this copy of a bundled plugin.
 * @param target - the plugin directory in the live profile.
 * @param marker - marker file name.
 * @returns the recorded version, or '' when the copy carries no marker.
 */
function materialisedVersion(target, marker) {
  try {
    return JSON.parse(readFileSync(join(target, marker), 'utf8')).version ?? ''
  } catch {
    return ''
  }
}

/**
 * Keep the live profile in step with the plugins this app ships: materialise any
 * bundled plugin the profile is missing and append it to the profile's bundle
 * list. It only ever ADDS — a plugin the user installed or upgraded themselves
 * wins — and it backs up and re-parses the manifest before replacing it, because
 * a broken profile manifest means the host cannot boot at all.
 * @returns the plugin names that were materialised, for the log.
 */
function syncBundledPlugins(profileName = 'web') {
  const liveDir = join(DSH_HOME, 'profiles', profileName)
  const liveManifest = join(liveDir, 'package.json')
  if (!existsSync(liveManifest)) return []
  const names = bundledPlugins()
  if (names.length === 0) return []

  const version = app.getVersion()
  // `DSH_DESKTOP_FORCE_BUNDLED=1` re-copies them even when the version is unchanged:
  // editing a bundled plugin in a source checkout keeps the version, and the dev
  // window has to show the edit (the dev-window script sets this).
  const forced = process.env.DSH_DESKTOP_FORCE_BUNDLED === '1'
  const marker = '.neo-dsh-bundled.json'
  const added = []
  for (const name of names) {
    const source = join(RESOURCES, 'profile-web', 'vendor', name)
    if (!existsSync(source)) continue
    for (const target of [join(liveDir, 'vendor', name), join(liveDir, 'node_modules', name)]) {
      let stat = null
      try { stat = lstatSync(target) } catch { /* absent */ }
      // A symlink is the user's own install (or a `link:` dependency) — never touched.
      if (stat !== null && !stat.isDirectory()) continue
      if (!forced && stat !== null && materialisedVersion(target, marker) === version) continue
      // A real directory here is a copy this app made, so it follows the app: without
      // this, a plugin that ships with the app would never update with it.
      rmSync(target, { recursive: true, force: true })
      mkdirSync(dirname(target), { recursive: true })
      cpSync(source, target, { recursive: true, dereference: true })
      writeFileSync(join(target, marker), `${JSON.stringify({ version }, null, 2)}\n`)
      added.push(name)
    }
  }

  let profile
  try {
    profile = JSON.parse(readFileSync(liveManifest, 'utf8'))
  } catch (error) {
    log(`plugin sync: ${liveManifest} is not valid JSON, leaving it alone (${error.message})`)
    return added
  }
  const section = profile?.dsh?.profile
  if (section === undefined || !Array.isArray(section.bundles)) return added
  const missing = names.filter((name) => !section.bundles.includes(name))
  if (missing.length === 0) return added
  section.bundles.push(...missing)
  profile.dependencies = profile.dependencies ?? {}
  for (const name of missing) {
    if (profile.dependencies[name] === undefined) profile.dependencies[name] = `file:vendor/${name}`
  }
  const serialized = `${JSON.stringify(profile, null, 2)}\n`
  try {
    JSON.parse(serialized)
    writeFileSync(`${liveManifest}.bak-${Date.now()}`, readFileSync(liveManifest))
    const temp = `${liveManifest}.tmp-${process.pid}`
    writeFileSync(temp, serialized)
    renameSync(temp, liveManifest)
    log(`profile: added bundled plugin(s) ${missing.join(', ')} to ${liveManifest}`)
  } catch (error) {
    log(`profile: could not update ${liveManifest}: ${error.message}`)
  }
  return added
}

/**
 * Copy a shipped directory into $DSH_HOME when the destination is absent.
 * Existing state always wins: this only ever fills in what is missing.
 * @param from - shipped source directory.
 * @param to - destination directory.
 * @returns whether anything was copied.
 */
function seedDirectory(from, to) {
  if (!existsSync(from) || existsSync(to)) return false
  mkdirSync(dirname(to), { recursive: true })
  cpSync(from, to, { recursive: true, dereference: true, errorOnExist: false, force: false })
  return true
}

/**
 * First-launch seeding of the shipped profile, agent preset and default
 * settings. Never overwrites: a $DSH_HOME that already has a profile keeps it.
 * @returns the names of what was seeded, for the log.
 */
function seedHome() {
  const seeded = []
  if (process.env.DSH_DESKTOP_NO_SEED === '1') return seeded
  // Carry the shared ~/.dsh over: a full copy the first time this home is used,
  // and — because an update can land while the CLI or an older build kept writing
  // there — a merge of the files this home is missing, once per app version.
  // Everything is read-only towards the old home, and nothing here is overwritten.
  if (process.env.DSH_DESKTOP_NO_MIGRATE !== '1') {
    // Logs what it decided (including "nothing to do").
    syncHome({ from: legacyHome(), to: DSH_HOME, version: app.getVersion(), log })
  }
  mkdirSync(DSH_HOME, { recursive: true })
  if (seedDirectory(join(RESOURCES, 'profile-web'), join(DSH_HOME, 'profiles', 'web'))) seeded.push('profiles/web')
  if (safeMode) {
    // A profile of its own, rebuilt from the shipped one on every safe launch: it cannot
    // carry a broken plugin, and it leaves the user's own profile untouched.
    const live = join(DSH_HOME, 'profiles', SAFE_PROFILE)
    const shipped = join(RESOURCES, 'profile-web')
    if (existsSync(shipped)) {
      rmSync(live, { recursive: true, force: true })
      cpSync(shipped, live, { recursive: true, dereference: true })
      seeded.push(`profiles/${SAFE_PROFILE} (safe mode)`)
    } else {
      log('safe mode: the shipped profile is missing, cannot build one')
    }
    // The harness reads settings.yaml before it can serve anything, so a broken one means
    // no window at all. It is moved aside, never deleted.
    try {
      const repaired = repairSettings(DSH_HOME, join(RESOURCES, 'settings.defaults.yaml'), {
        parse: (text) => yaml.load(text),
        log,
      })
      if (repaired.repaired) seeded.push('settings.yaml (repaired)')
    } catch (error) {
      log(`safe mode: settings repair failed: ${String(error?.message ?? error)}`)
    }
  }
  // Safe mode materialises the plugins for its own profile and leaves the user's alone.
  seeded.push(...syncBundledPlugins(safeMode ? SAFE_PROFILE : 'web'))
  if (seedDirectory(join(RESOURCES, 'presets'), join(DSH_HOME, '.agent-presets'))) seeded.push('.agent-presets')
  const settings = join(DSH_HOME, 'settings.yaml')
  const defaults = join(RESOURCES, 'settings.defaults.yaml')
  if (!existsSync(settings) && existsSync(defaults)) {
    cpSync(defaults, settings, { errorOnExist: false, force: false })
    seeded.push('settings.yaml')
  }
  return seeded
}

function log(message) {
  const line = `${new Date().toISOString()} ${message}\n`
  try {
    mkdirSync(dirname(LOG_PATH), { recursive: true })
    appendFileSync(LOG_PATH, line)
  } catch {
    // Logging is best-effort; a read-only home must not break the shell.
  }
}

/** A bounded buffer of recent host stderr, shown when the host dies unexpectedly. */
class Tail {
  constructor(limit = 2000) {
    this.limit = limit
    this.text = ''
  }
  append(chunk) {
    this.text = (this.text + chunk).slice(-this.limit)
  }
}

/**
 * Ask whether to open in safe mode, when the last launches kept failing.
 *
 * A plugin or a settings file that breaks the boot leaves no UI to fix it from, so the
 * offer has to come from the shell before anything is loaded.
 */
async function offerSafeMode() {
  if (safeMode) return
  const state = readBootState(DSH_HOME)
  if (!shouldOfferSafeMode(state)) return
  const lastReason = String(state.lastReason ?? '').split('\n')[0]
  log(`boot: ${state.failures} failed start(s) in a row; offering safe mode`)
  const { response } = await dialog.showMessageBox({
    type: 'warning',
    title: 'Neo DSH',
    message: `Neo DSH failed to start ${state.failures} times in a row`,
    detail: [
      lastReason === '' ? '' : `Last failure: ${lastReason}`,
      'Safe mode opens the window with the bundled plugins only, and moves a settings file that cannot be parsed out of the way (never deleting it). Your own profile and settings are left as they are.',
      'The corner button leaves safe mode.',
    ].filter((line) => line !== '').join('\n\n'),
    buttons: ['Start in safe mode', 'Try again normally'],
    defaultId: 0,
    cancelId: 1,
  })
  if (response === 0) {
    safeMode = true
    log('boot: starting in safe mode')
  } else {
    // Do not ask again on every launch while they are trying things out; the counter
    // still grows, so a genuine loop comes back to this question.
    clearBootFailures(DSH_HOME)
  }
}

/**
 * What keeps a profile from loading: an unreadable manifest, or bundles that do not
 * resolve. This is the check that turns "the app will not start" into a question the
 * window can ask.
 *
 * @param profileName - directory name under `profiles/`.
 * @returns the problems, in the words the dialog will show.
 */
function profileProblems(profileName) {
  const dir = join(DSH_HOME, 'profiles', profileName)
  const manifest = join(dir, 'package.json')
  if (!existsSync(manifest)) return [`${manifest} is missing`]
  let bundles
  try {
    bundles = profileBundles(readFileSync(manifest, 'utf8'))
  } catch (error) {
    return [`${manifest} ${String(error?.message ?? error)}`]
  }
  const searchPaths = [
    dir,
    join(projectRoot, 'apps', 'desktop', 'node_modules'),
    join(RESOURCES, 'app', 'node_modules'),
    RESOURCES,
  ]
  const canResolve = (name) => {
    if (existsSync(join(dir, 'node_modules', name))) return true
    try {
      require.resolve(name, { paths: searchPaths })
      return true
    } catch {
      return false
    }
  }
  return unresolvedBundles(bundles, canResolve).map((name) => `bundle "${name}" cannot be resolved`)
}

/**
 * Leave safe mode, offering to repair the profile on the way out.
 *
 * Leaving is exactly when the user finds out their own profile is what broke the boot, so
 * the repair belongs here rather than in a separate button: the broken directory is moved
 * aside (never deleted) and the shipped profile takes its place.
 */
async function leaveSafeMode() {
  const problems = profileProblems('web')
  if (problems.length > 0) {
    log(`safe mode: leaving, but profiles/web has ${problems.length} problem(s): ${problems.join('; ')}`)
    const { response } = await dialog.showMessageBox({
      type: 'warning',
      title: 'Neo DSH',
      message: 'Your own profile cannot be loaded',
      detail: [
        ...problems.map((problem) => `• ${problem}`),
        '',
        'Repair it by moving profiles/web aside and putting the shipped profile in its place? The current one is renamed, not deleted, and plugins you installed yourself can be installed again afterwards.',
      ].join('\n'),
      buttons: ['Repair and restart', 'Stay in safe mode'],
      defaultId: 0,
      cancelId: 1,
    })
    if (response !== 0) return
    const report = repairProfile({
      home: DSH_HOME,
      profile: 'web',
      shipped: join(RESOURCES, 'profile-web'),
      log,
    })
    if (!report.repaired) {
      dialog.showErrorBox('Neo DSH', `profiles/web could not be replaced. See ${LOG_PATH}.`)
      return
    }
    try {
      syncBundledPlugins('web')
    } catch (error) {
      log(`profile repair: bundled plugins could not be materialised: ${String(error?.message ?? error)}`)
    }
    log(`safe mode: repaired profiles/web (old copy at ${report.movedTo ?? 'n/a'})`)
  }
  safeMode = false
  clearBootFailures(DSH_HOME)
  log('safe mode: leaving, restarting the host with the normal profile')
  void restartHost()
}

/** Run a short diagnostic command (ss/lsof/ps) and return its stdout. */
function runCommand(command) {
  return execFileSync('/bin/sh', ['-c', command], { encoding: 'utf8', timeout: 5000 })
}

/**
 * Make sure the fixed port is free before a host is started on it.
 *
 * A host that outlived its window keeps the port, and then every launch fails with "the
 * host exited before it was ready" — a message that says nothing about the cause. So
 * the port is probed first: free is the normal case, a host this app can prove is its
 * own leftover is stopped, and anything else is put to the user with the pid and the
 * command line in front of them, rather than killed behind their back.
 *
 * @returns true when the port is ready to be used.
 */
async function ensureHostPort() {
  const port = DESKTOP_PORT
  const state = classifyProbe(await probePort({ port }))
  if (state === 'free') return true

  const { pid } = findPortHolder({ platform: process.platform, port, run: runCommand })
  const holder = readHolder({ platform: process.platform, pid, port, bin: resolveDshBin(), run: runCommand })
  const record = readHostRecord(DSH_HOME)
  const orphan = isOrphan({ holder, record })
  const { action, reason } = portAction({ probe: state, holder, record, orphan })
  const mine = holder.marker === true || (record.pid !== undefined && record.pid === holder.pid)
  log(
    `port ${port}: probe=${state} pid=${holder.pid ?? '?'} dsh-host=${holder.host} ours=${mine} ppid=${holder.ppid ?? '?'} orphan=${orphan} → ${action} (${reason})`,
  )

  const stopHolder = async () => {
    try {
      process.kill(holder.pid, 'SIGTERM')
    } catch (error) {
      log(`port ${port}: could not signal pid ${holder.pid}: ${String(error?.message ?? error)}`)
    }
    const freed = await waitForFree({ probe: () => probePort({ port }) })
    log(`port ${port}: ${freed ? 'free again' : 'still held'}`)
    return freed
  }

  if (action === 'reclaim') {
    log(`port ${port}: stopping pid ${holder.pid}, our host outlived its window`)
    if (await stopHolder()) return true
  }

  const { response } = await dialog.showMessageBox({
    type: 'warning',
    title: 'Neo DSH',
    message: `Port ${port} is already in use`,
    detail: [
      holder.cmdline === '' ? 'The process could not be identified.' : holder.cmdline.slice(0, 400),
      '',
      `pid ${holder.pid ?? '?'} — ${reason}`,
      '',
      'Neo DSH starts its own harness host on this port. Stopping it is usually right for a leftover from an earlier run, but it may be something you are using.',
      '',
      'DSH_DESKTOP_PORT can point this app at another port instead.',
    ].join('\n'),
    buttons: ['Stop it and continue', 'Quit'],
    defaultId: 0,
    cancelId: 1,
  })
  if (response === 0 && (await stopHolder())) return true

  dialog.showErrorBox(
    'Neo DSH could not start',
    `Port ${port} is still in use by pid ${holder.pid ?? '?'}. Stop that process, or start with DSH_DESKTOP_PORT=<another port>. See ${LOG_PATH}.`,
  )
  return false
}

/**
 * Start the host and resolve when its readiness URL appears. Rejects when the
 * child exits before ready, carrying the tail of its stderr for the dialog.
 * @returns a controller with `url`, `onExit`, and `stop()`.
 */
/**
 * Fixed loopback port for the host. Browser localStorage is scoped per origin
 * (scheme + host + PORT), so a random port (--port 0) would reset every
 * plugin's localStorage on each restart; a stable port keeps it. Override with
 * DSH_DESKTOP_PORT if 3081 collides with something else.
 */
const DESKTOP_PORT = process.env.DSH_DESKTOP_PORT || '3081'

/**
 * Optional window floor, in device-independent pixels. There is no floor by
 * default: the harness UI is flex-based and declares `min-width: 0` on its own
 * shell, so the 940x600 the shell used to hardcode was this file's choice, not a
 * layout requirement — and on a scrolling/tiling compositor (niri) it blocked
 * narrow columns the user explicitly wanted. Set DSH_DESKTOP_MIN_WIDTH /
 * DSH_DESKTOP_MIN_HEIGHT to put a floor back; 0 or unset means no constraint.
 */
const DESKTOP_MIN_WIDTH = Number(process.env.DSH_DESKTOP_MIN_WIDTH ?? 0)
const DESKTOP_MIN_HEIGHT = Number(process.env.DSH_DESKTOP_MIN_HEIGHT ?? 0)

function startHost() {
  const bin = resolveDshBin()
  const node = resolveNode()
  log(`starting host: ${node} ${bin} web --no-open --port ${DESKTOP_PORT}`)
  log(`DSH_HOME=${DSH_HOME} (${HOME_CHOICE.source}) resources=${RESOURCES} packaged=${app.isPackaged}`)
  // The watchdog is loaded into the host before the harness itself: if this shell dies
  // without a chance to clean up (SIGKILL, a crash, the whole session going away), the
  // host would otherwise hold the port until the machine reboots.
  const watchdog = join(dirname(fileURLToPath(import.meta.url)), 'host-watchdog.cjs')
  const child = spawn(node, [
    ...(existsSync(watchdog) ? ['--require', watchdog] : []),
    bin, ...(safeMode ? ['--profile', SAFE_PROFILE] : ['web']), '--no-open', '--port', DESKTOP_PORT,
  ], {
    env: {
      ...process.env,
      DSH_HOME,
      [HOST_MARKER]: '1',
      DSH_HOST_PARENT_PID: String(process.pid),
    },
    stdio: ['ignore', 'pipe', 'pipe'],
  })
  // Remember which pid serves this port, so a later launch can tell our own leftover
  // apart from someone else's host.
  child.once('spawn', () => {
    try {
      writeHostRecord(DSH_HOME, {
        pid: child.pid,
        port: Number(DESKTOP_PORT),
        parentPid: process.pid,
        startedAt: new Date().toISOString(),
      })
    } catch (error) {
      log(`could not record the host pid: ${String(error?.message ?? error)}`)
    }
  })

  const stderr = new Tail()
  let stdoutBuffer = ''
  let settled = false

  const ready = new Promise((resolve, reject) => {
    child.stdout.on('data', (chunk) => {
      stdoutBuffer += chunk.toString()
      log(`[host stdout] ${chunk.toString().trimEnd()}`)
      // The readiness line is a single physical line; keep only the tail that
      // could still hold an unread complete line.
      const lines = stdoutBuffer.split('\n')
      for (let i = 0; i < lines.length - 1; i += 1) {
        const match = READY_LINE.exec(lines[i])
        if (match?.[1] !== undefined && !settled) {
          settled = true
          resolve(match[1])
        }
      }
      stdoutBuffer = lines[lines.length - 1]
    })
    child.stderr.on('data', (chunk) => {
      stderr.append(chunk.toString())
      log(`[host stderr] ${chunk.toString().trimEnd()}`)
    })
    child.on('error', (error) => {
      if (!settled) {
        settled = true
        reject(new Error(`failed to start the dsh host: ${error.message}`))
      }
    })
    child.on('exit', (code, signal) => {
      log(`host exited: code=${code} signal=${signal}`)
      if (!settled) {
        settled = true
        reject(new Error(
          `the dsh host exited before it was ready (code=${code}, signal=${signal}).\n`
            + `Another process holding port ${DESKTOP_PORT} is the usual cause; see ${LOG_PATH}.\n\n`
            + stderr.text.trim(),
        ))
      }
    })
  })

  return {
    child,
    url: ready,
    onExit(listener) {
      child.on('exit', listener)
    },
    /** SIGTERM the host and wait up to `timeoutMs` for it to leave. */
    async stop(timeoutMs = 5000) {
      if (child.exitCode !== null || child.signalCode !== null) return
      child.kill('SIGTERM')
      await new Promise((resolve) => {
        const timer = setTimeout(resolve, timeoutMs)
        child.once('exit', () => {
          clearTimeout(timer)
          resolve()
        })
      })
      if (child.exitCode === null && child.signalCode === null) {
        child.kill('SIGKILL')
      }
    },
  }
}

function buildMenu() {
  const template = [
    { role: 'appMenu' },
    { role: 'editMenu' },
    { role: 'viewMenu' },
    {
      label: 'Window',
      submenu: [
        { role: 'minimize' },
        { role: 'zoom' },
        { type: 'separator' },
        { role: 'close' },
      ],
    },
    { role: 'help' },
  ]
  return Menu.buildFromTemplate(template)
}

let mainWindow = null
let host = null
let resolvedUrl = null
let quitting = false
/** Automatic renderer recoveries spent; refilled after a healthy minute. */
let rendererRecoveries = 0
let rendererRecoveryTimer = null

/** Headless verification mode: load the page, report, and quit without showing a window. */
const smoke = process.env.DSH_DESKTOP_SMOKE === '1'
/** Smoke variant that also crashes the renderer once and requires a self-recovery. */
const smokeCrashTest = smoke && process.env.DSH_DESKTOP_SMOKE_CRASH === '1'

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 840,
    // Only sent when a floor is configured: passing 0 would still be a hint some
    // compositors read as "at least 0", and an absent key is the honest "no floor".
    ...(DESKTOP_MIN_WIDTH > 0 ? { minWidth: DESKTOP_MIN_WIDTH } : {}),
    ...(DESKTOP_MIN_HEIGHT > 0 ? { minHeight: DESKTOP_MIN_HEIGHT } : {}),
    title: 'Neo DSH',
    icon: join(projectRoot, 'assets', 'icon.png'),
    show: false,
    // Linux is frameless by default — niri and friends move borderless windows and
    // the UI draws its own chrome — but Settings can ask for the native title bar.
    // macOS and Windows always get the native frame: frameless there means no
    // traffic lights / minimise / close buttons and nothing to drag the window by.
    ...(windowUsesNativeFrame() ? {} : { frame: false }),
    autoHideMenuBar: true,
    backgroundColor: '#0f1115',
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  if (!smoke) mainWindow.once('ready-to-show', () => mainWindow.show())
  mainWindow.on('closed', () => {
    mainWindow = null
  })

  /* A dead renderer used to leave a dead window: the shell kept running, the host
     kept serving, and the user had to relaunch the app by hand. The renderer is the
     part that holds a long transcript's DOM, so when it dies the only sane recovery
     is a reload — one automatic attempt, then a dialog that carries the reason
     (`oom`, `crashed`, `killed`, ...) instead of looping on a page that keeps
     dying. The host process is untouched: sessions live there, not in the window. */
  mainWindow.webContents.on('render-process-gone', (_event, details) => {
    const reason = `${details.reason} (exitCode=${details.exitCode})`
    log(`renderer gone: ${reason}`)
    // A plain smoke run must fail loudly; the crash-recovery smoke drives its own
    // assertion through the real recovery branch below.
    if (smoke && !smokeCrashTest) {
      console.error(`SMOKE FAIL: renderer gone ${reason}`)
      app.exit(4)
      return
    }
    if (rendererRecoveries < 1 && resolvedUrl !== null) {
      rendererRecoveries += 1
      if (!smoke) {
        dialog.showMessageBox({
          type: 'warning',
          title: 'Neo DSH window restarted',
          message: 'The interface process stopped and has been reloaded.',
          detail: `Reason: ${reason}. Your sessions live in the dsh host and are unaffected.\n\nIf this keeps happening, start a new conversation for long tasks — a very large transcript is the usual cause.`,
          buttons: ['OK'],
        }).catch(() => {})
      }
      setTimeout(() => {
        if (mainWindow !== null) mainWindow.loadURL(resolvedUrl).catch(() => {})
      }, 300)
      return
    }
    if (smoke) {
      console.error(`SMOKE FAIL: renderer gone twice ${reason}`)
      app.exit(4)
      return
    }
    dialog.showErrorBox(
      'Neo DSH window stopped again',
      `The interface process stopped more than once (${reason}). The dsh host is still running; restart the app to recover. See ${LOG_PATH}.`,
    )
  })

  // The harness UI is a single-page app; every outbound link opens in the
  // system browser instead of navigating the app window away. The special
  // /__dsh_desktop_restart path is the injected restart button's trigger.
  mainWindow.webContents.setWindowOpenHandler(({ url }) => {
    if (url.startsWith('http://') || url.startsWith('https://')) shell.openExternal(url)
    return { action: 'deny' }
  })
  mainWindow.webContents.on('will-navigate', (event, url) => {
    let pathname = ''
    try { pathname = new URL(url).pathname } catch { /* non-URL navigation */ }
    if (pathname === '/__dsh_desktop_restart') {
      event.preventDefault()
      void restartHost()
      return
    }
    // Settings changes that only the shell can make: the window frame, and where
    // the harness data lives.
    if (pathname === '/__dsh_desktop_set') {
      event.preventDefault()
      let key = ''
      let value = ''
      let mode = ''
      try {
        const params = new URL(url).searchParams
        key = params.get('key') ?? ''
        value = params.get('value') ?? ''
        mode = params.get('mode') ?? ''
      } catch { /* keep the empties: the handler logs an unknown key */ }
      handlePreferenceCommand(key, value, mode)
      return
    }
    // A folder chooser: the renderer cannot open one, so it navigates here and the
    // shell answers through window.__NEO_DSH_CHOOSE__.
    if (pathname === '/__dsh_desktop_choose') {
      event.preventDefault()
      let key = ''
      try { key = new URL(url).searchParams.get('key') ?? '' } catch { /* keep '' */ }
      void handleChooseCommand(key)
      return
    }
    // Self-update commands from the settings plugin: the renderer cannot touch
    // files or processes, so it navigates here and the shell does the work.
    if (pathname === '/__dsh_desktop_update') {
      event.preventDefault()
      let action = ''
      try { action = new URL(url).searchParams.get('action') ?? '' } catch { /* keep '' */ }
      void handleUpdateCommand(action)
      return
    }
    if (url !== resolvedUrl) {
      event.preventDefault()
      if (url.startsWith('http://') || url.startsWith('https://')) shell.openExternal(url)
    }
  })
  mainWindow.webContents.on('did-finish-load', () => {
    injectRestartButton()
    injectSafeBanner()
    injectDesktopInfo()
    // The window loaded: whatever failed before is not failing now.
    try { clearBootFailures(DSH_HOME) } catch (error) { log(`boot: could not clear the failure count: ${String(error?.message ?? error)}`) }
    /* Updater self-test: runs the real check/download and exits, so the updater
       can be verified from a terminal (or CI) instead of by clicking around.
       It never installs — see DSH_DESKTOP_UPDATE_SMOKE in docs/development.md. */
    const updateSmoke = process.env.DSH_DESKTOP_UPDATE_SMOKE
    if (updateSmoke !== undefined && updateSmoke !== '') {
      void runUpdateSmoke(updateSmoke)
      return
    }
    /* A window that has stayed up for a minute is healthy again, so the next crash
       gets its own automatic recovery instead of being treated as a repeat. */
    if (rendererRecoveryTimer !== null) clearTimeout(rendererRecoveryTimer)
    rendererRecoveryTimer = setTimeout(() => {
      rendererRecoveryTimer = null
      rendererRecoveries = 0
    }, 60_000)
  })

  if (smoke) {
    const timer = setTimeout(() => {
      log('smoke: timed out waiting for page load')
      console.error('SMOKE FAIL: timeout')
      app.exit(2)
    }, 30_000)
    mainWindow.webContents.once('did-finish-load', async () => {
      clearTimeout(timer)
      const url = mainWindow.webContents.getURL()
      log(`smoke: page loaded ${url}`)
      let detail = ''
      try {
        const check = await mainWindow.webContents.executeJavaScript(`(() => {
          const persist = localStorage.getItem('__dsh_persist_test')
          localStorage.setItem('__dsh_persist_test', 'yes')
          return {
            rootChildren: document.getElementById('root')?.childElementCount ?? -1,
            noTitlebar: !document.getElementById('dsh-titlebar'),
            paddingTop: getComputedStyle(document.body).paddingTop,
            restartBtn: !!document.getElementById('dsh-desktop-restart'),
            persist: persist,
          }
        })()`)
        detail = ` rootChildren=${check.rootChildren} noTitlebar=${check.noTitlebar} paddingTop=${check.paddingTop} restartBtn=${check.restartBtn} persist=${check.persist}`
        log(`smoke: ${detail.trim()}`)
      } catch (error) {
        detail = ` (layout check failed: ${error.message})`
        log(`smoke: layout check failed: ${error.message}`)
      }
      /* Window constraints are part of what the smoke run reports: the floor is
         configuration (see DESKTOP_MIN_WIDTH), so a run should show whether one is
         in force instead of leaving it to a manual resize test. */
      const minSize = mainWindow.getMinimumSize()
      const size = mainWindow.getSize()
      detail += ` window=${size[0]}x${size[1]} min=${minSize[0]}x${minSize[1]}`
      console.log(`SMOKE OK: ${url}${detail}`)

      /* DSH_DESKTOP_SMOKE_CRASH=1 extends the smoke run into a crash-recovery check:
         kill the renderer and require the shell to reload the window by itself.

         The kill goes through the main process, not an external shell: a sandboxed
         renderer runs in its own PID namespace, so a PID from outside cannot reach
         it, while the main process holds the parent-namespace pid from
         getOSProcessId(). `webContents.forcefullyCrashRenderer()` would be the
         obvious API, but on this stack it is a no-op — measured: no
         render-process-gone event and isCrashed() stays false — so it cannot be the
         trigger this check relies on. */
      if (smokeCrashTest) {
        const recoverTimer = setTimeout(() => {
          log('smoke: renderer did not come back')
          console.error('SMOKE FAIL: renderer did not recover')
          app.exit(5)
        }, 25_000)
        mainWindow.webContents.once('did-finish-load', () => {
          clearTimeout(recoverTimer)
          log('smoke: renderer recovered')
          console.log('SMOKE CRASH-RECOVERY OK: window reloaded after a forced renderer crash')
          app.quit()
        })
        const rendererPid = mainWindow.webContents.getOSProcessId()
        log(`smoke: killing renderer pid=${rendererPid}`)
        try {
          process.kill(rendererPid, 'SIGKILL')
        } catch (error) {
          log(`smoke: could not kill renderer: ${error.message}`)
          console.error('SMOKE FAIL: could not kill the renderer')
          app.exit(6)
        }
        return
      }

      app.quit()
    })
    mainWindow.webContents.once('did-fail-load', (_event, code, description) => {
      clearTimeout(timer)
      log(`smoke: page load failed ${code} ${description}`)
      console.error(`SMOKE FAIL: ${code} ${description}`)
      app.exit(3)
    })
  }

  mainWindow.loadURL(resolvedUrl)
  // Developing a client plugin means reading its own console; `smoke` runs must
  // stay headless, so the hook is ignored there.
  if (process.env.DSH_DESKTOP_DEVTOOLS === '1' && !smoke) {
    mainWindow.webContents.openDevTools({ mode: 'detach' })
  }
}

async function shutdownHost() {
  const current = host
  host = null
  if (current) await current.stop()
  clearHostRecord(DSH_HOME)
}

/** Attach the unexpected-exit watchdog to the CURRENT host (each host needs its own). */
function watchHostExit() {
  host.onExit((code, signal) => {
    // Unexpected exit only: our own shutdown/restart nulls `host` first.
    if (!quitting && host) {
      host = null
      recordBootFailure(DSH_HOME, `the dsh host exited unexpectedly (code=${code}, signal=${signal})`)
      dialog.showErrorBox(
        'Neo DSH stopped',
        `The dsh host exited unexpectedly (code=${code}, signal=${signal}). See ${LOG_PATH} for details.`,
      )
      app.exit(1)
    }
  })
}

/** Whether a host restart is already in flight. */
let restarting = false

/** Set while the window is rebuilt on purpose (a frame change), so
 *  `window-all-closed` does not read the gap as the user closing the app. */
let recreatingWindow = false

/** Full restart: stop the host, boot a fresh one, and reload the window. */
async function restartHost() {
  if (restarting) return
  restarting = true
  log('restart requested: stopping host')
  try {
    await shutdownHost()
    // The socket can outlive the process by a moment; a host that starts too early
    // would die on EADDRINUSE instead of serving the reloaded page.
    await waitForFree({ probe: () => probePort({ port: DESKTOP_PORT }), timeoutMs: 5000, intervalMs: 100 })
    host = startHost()
    resolvedUrl = await host.url
    log(`restart: new host ready at ${resolvedUrl}`)
    watchHostExit()
    if (mainWindow) {
      // Bypass the renderer's HTTP cache: a cached index carries the OLD client-module
      // manifest, and with it the old bundle URLs, so a plugin change would keep
      // rendering the previous code even though the fresh host already serves the new
      // one. The bundles themselves stay cacheable — only this document load is forced.
      await mainWindow.loadURL(resolvedUrl, { extraHeaders: 'pragma: no-cache\ncache-control: no-cache' })
    }
  } catch (error) {
    await fail(String(error.message ?? error))
  } finally {
    restarting = false
  }
}

/** Whether this launch wants the platform's own window frame. */
function windowUsesNativeFrame() {
  return wantsNativeFrame(process.platform, readPreferences(DSH_HOME))
}

/**
 * Apply one preference change from the settings page.
 *
 * Window-level options cannot be changed on a live BrowserWindow, so the frame
 * choice rebuilds the window (cheap: the host keeps running and the page reloads).
 * @param key - preference name.
 * @param value - new value, as a string from the URL.
 * @param mode - how a relocation treats the old directory (`copy`/`move`).
 */
function handlePreferenceCommand(key, value, mode) {
  try {
    if (key === 'frame') {
      const stored = writePreferences(DSH_HOME, { nativeFrame: value === 'native' })
      log(`preference: nativeFrame=${String(stored.nativeFrame)}`)
      recreateWindow()
      return
    }
    if (key === 'dataHome') {
      void relocateHome(value, mode)
      return
    }
    if (key === 'safe') {
      void leaveSafeMode()
      return
    }
    log(`preference: ignoring unknown key ${String(key)}`)
  } catch (error) {
    log(`preference: could not apply ${String(key)}: ${String(error?.message ?? error)}`)
  }
}

/** Answer the settings page with the result of a folder chooser. */
function publishChoose(state) {
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents
    .executeJavaScript(`window.__NEO_DSH_CHOOSE__ && window.__NEO_DSH_CHOOSE__(${JSON.stringify(state)}); true`)
    .catch(() => {})
}

/**
 * Open the OS folder chooser for the settings row.
 *
 * Picking a folder only *proposes* it: the row then asks whether to copy or move,
 * and sends the answer back through `/__dsh_desktop_set`.
 * @param key - which setting the folder is for (only `dataHome` today).
 */
async function handleChooseCommand(key) {
  if (key !== 'dataHome') {
    log(`choose: ignoring unknown key ${String(key)}`)
    return
  }
  try {
    const options = {
      title: '选择 Neo DSH 数据目录',
      defaultPath: DSH_HOME,
      buttonLabel: '用这个目录',
      // `createDirectory` is macOS-only; elsewhere the chooser still offers New Folder.
      properties: ['openDirectory', 'createDirectory'],
    }
    const result = mainWindow && !mainWindow.isDestroyed()
      ? await dialog.showOpenDialog(mainWindow, options)
      : await dialog.showOpenDialog(options)
    const path = result.canceled ? '' : (result.filePaths?.[0] ?? '')
    log(`choose dataHome: canceled=${result.canceled} path=${path}`)
    publishChoose({ key, canceled: result.canceled || path === '', path })
  } catch (error) {
    log(`choose dataHome failed: ${String(error?.message ?? error)}`)
    publishChoose({ key, canceled: true, error: String(error?.message ?? error) })
  }
}

/**
 * Carry the harness data to a directory the user chose, then restart into it.
 *
 * The host is stopped first: it holds session stores and log files open, and
 * copying a file another process is appending to is how a conversation gets
 * truncated. From there both sides are plain directories, so the shared,
 * unit-tested `moveHome` does the work. The choice is recorded only after the copy
 * succeeded, so a failure leaves the app on the home it already had.
 * @param target - the directory the user picked.
 * @param mode - `copy` (keep the old directory) or `move` (empty it afterwards).
 */
async function relocateHome(target, mode) {
  const to = String(target).trim()
  const kind = mode === 'move' ? 'move' : 'copy'
  try {
    if (to === '' || !isAbsolute(to)) {
      publishChoose({ key: 'dataHome', canceled: false, error: 'not-absolute' })
      return
    }
    if (to === DSH_HOME) {
      publishChoose({ key: 'dataHome', canceled: false, error: 'same-path' })
      return
    }
    // Validate BEFORE stopping anything: a refusal must not take a working app down,
    // and a page reload would swallow the message the row is meant to show.
    const plan = relocationPlan({ from: DSH_HOME, to })
    if (!plan.move) {
      log(`relocate: refused (${plan.reason}) ${DSH_HOME} → ${to}`)
      publishChoose({ key: 'dataHome', canceled: false, error: plan.reason, path: to })
      return
    }
    log(`relocate: ${kind} ${DSH_HOME} → ${to}`)
    publishChoose({ key: 'dataHome', canceled: false, phase: 'moving', path: to, mode: kind })
    await shutdownHost()
    const report = moveHome({ from: DSH_HOME, to, mode: kind, log })
    if (report.reason !== undefined) {
      // Nothing was written: bring the app back up on the home it already had.
      publishChoose({ key: 'dataHome', canceled: false, error: report.reason, path: to })
      host = startHost()
      resolvedUrl = await host.url
      watchHostExit()
      if (mainWindow) await mainWindow.loadURL(resolvedUrl)
      return
    }
    writeDataHome(userDataDir(), to)
    log(`relocate: recorded dataHome=${to}; restarting into it`)
    publishChoose({ key: 'dataHome', canceled: false, phase: 'restarting', path: to, moved: report.moved.length })
    // A new process is required: $DSH_HOME is resolved once, before any window exists.
    setTimeout(() => {
      app.relaunch()
      app.exit(0)
    }, 600)
  } catch (error) {
    log(`relocate failed: ${String(error?.message ?? error)}`)
    publishChoose({ key: 'dataHome', canceled: false, error: 'failed', path: to })
  }
}

/** Rebuild the window so creation-time options take effect. */
function recreateWindow() {
  const current = mainWindow
  if (current === null || current.isDestroyed() || resolvedUrl === '') return
  recreatingWindow = true
  mainWindow = null
  current.destroy()
  createWindow()
  // `window-all-closed` is emitted from the destroy, so clear it afterwards.
  setImmediate(() => { recreatingWindow = false })
}

/** Inject a floating "restart dsh" button into the page, next to the settings button. */
function injectRestartButton() {
  if (!mainWindow) return
  mainWindow.webContents.executeJavaScript(`(() => {
    if (document.getElementById('dsh-desktop-restart')) return
    const btn = document.createElement('button')
    btn.id = 'dsh-desktop-restart'
    btn.type = 'button'
    btn.title = 'Restart dsh'
    btn.setAttribute('aria-label', 'Restart dsh')
    btn.style.cssText = [
      'position:fixed', 'right:16px', 'bottom:16px', 'z-index:9999',
      'width:36px', 'height:36px', 'border-radius:50%',
      'border:1px solid var(--dsw-alias-border-l2, rgba(0,0,0,.12))',
      'background:var(--dsw-alias-bg-layer-3, #ffffff)',
      'color:var(--dsw-alias-label-primary, #333333)',
      'cursor:pointer', 'display:flex', 'align-items:center', 'justify-content:center',
      'font-size:16px', 'box-shadow:0 2px 8px rgba(0,0,0,.15)',
    ].join(';')
    btn.innerHTML = '&#10227;'
    btn.onclick = () => { location.href = '/__dsh_desktop_restart' }
    document.body.appendChild(btn)
  })()`).catch(() => {})
}

// ---------------------------------------------------------------------------
// Self-update
//
// The settings UI carries a client plugin that asks this shell to update Neo DSH
// from this project's OWN GitHub releases (never DeepSeek's). The renderer can do
// none of it — it is sandboxed, with no filesystem and no process spawn — so the
// shell owns the check, the download and the platform-specific install. The two
// sides talk over two narrow channels:
//
//   page  -> shell   navigate to /__dsh_desktop_update?action=download|install
//   shell -> page    window.__NEO_DSH_UPDATE__(state)      progress + results
//
// Installing always means "quit, let a detached helper swap the app, relaunch":
// a running application cannot replace its own files.
// ---------------------------------------------------------------------------

/** Releases come from here — this project's own repository. */
/** Push updater state into the page for the settings plugin to render. */
function sendUpdateState(state) {
  log(`update: ${JSON.stringify(state)}`)
  if (!mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents
    .executeJavaScript(`window.__NEO_DSH_UPDATE__ && window.__NEO_DSH_UPDATE__(${JSON.stringify(state)})`)
    .catch(() => {})
}

/** The release and file the last download produced; `install` only trusts this. */
let downloadedUpdate = null

/** Download this platform's asset for a release, reporting progress to the page. */
async function downloadUpdate(release, asset) {
  const done = await downloadRelease(asset, {
    onProgress: (progress) => sendUpdateState({ phase: 'downloading', version: release.version, ...progress }),
  })
  downloadedUpdate = { release, asset, path: done.path, bytes: done.bytes }
  sendUpdateState({ phase: 'downloaded', version: release.version, bytes: done.bytes, path: done.path })
  return downloadedUpdate
}

/**
 * Swap the installed app for the downloaded one, then quit. A running app cannot
 * replace its own files, so this writes a detached helper that waits for this
 * process to exit, installs, and relaunches.
 */
function installUpdate() {
  const pending = downloadedUpdate
  if (pending === null) {
    sendUpdateState({ phase: 'error', message: '还没有下载好的更新包，请先下载' })
    return
  }
  const logPath = join(DSH_HOME, 'update.log')
  const pid = process.pid

  if (process.platform === 'win32') {
    // The NSIS installer replaces the app itself; hand over and get out of the way.
    sendUpdateState({ phase: 'installing', version: pending.release.version })
    spawn(pending.path, [], { detached: true, stdio: 'ignore' }).unref()
    app.quit()
    return
  }

  const helper = join(tmpdir(), `neo-dsh-apply-${Date.now()}.sh`)
  const wait = `i=0\nwhile [ $i -lt 600 ]; do kill -0 ${pid} 2>/dev/null || break; sleep 0.5; i=$((i+1)); done\nsleep 1\n`
  let script

  if (process.platform === 'darwin') {
    const bundle = app.getPath('exe').replace(/\/Contents\/MacOS\/[^/]+$/, '')
    script = `#!/bin/bash
exec >>"${logPath}" 2>&1
echo "[$(date)] applying ${pending.release.version} to ${bundle}"
${wait}MOUNT="$(mktemp -d)"
hdiutil attach "${pending.path}" -nobrowse -quiet -mountpoint "$MOUNT" || exit 1
# Copy to the side first and only then swap: a failed copy must leave the working
# app in place rather than a deleted one.
rm -rf "${bundle}.new"
cp -R "$MOUNT/Neo DSH.app" "${bundle}.new" || exit 1
rm -rf "${bundle}"
mv "${bundle}.new" "${bundle}" || exit 1
hdiutil detach "$MOUNT" -quiet
# A browser-downloaded dmg is quarantined; the copy inherits that flag and would
# be refused on first launch (the "is damaged and can't be opened" dialog).
xattr -dr com.apple.quarantine "${bundle}"
echo "[$(date)] installed; relaunching"
open -a "${bundle}"
`
  } else if (process.env.APPIMAGE) {
    const image = process.env.APPIMAGE
    script = `#!/bin/sh
exec >>"${logPath}" 2>&1
echo "[$(date)] applying ${pending.release.version} to ${image}"
${wait}cp "${pending.path}" "${image}.new" || exit 1
chmod +x "${image}.new"
mv "${image}.new" "${image}" || exit 1
echo "[$(date)] installed; relaunching"
nohup "${image}" >/dev/null 2>&1 &
`
  } else {
    const launcher = join(homedir(), '.local', 'bin', 'neo-dsh')
    script = `#!/bin/sh
exec >>"${logPath}" 2>&1
echo "[$(date)] applying ${pending.release.version}"
${wait}D="${tmpdir()}/neo-dsh-update/tree-${Date.now()}"
rm -rf "$D"; mkdir -p "$D"
unzip -q -o "${pending.path}" -d "$D" || exit 1
# install.sh is bash; plain sh is dash on some distributions.
bash "$D/install.sh" || exit 1
echo "[$(date)] installed; relaunching"
nohup "${launcher}" >/dev/null 2>&1 &
`
  }

  writeFileSync(helper, script, { mode: 0o755 })
  chmodSync(helper, 0o755)
  sendUpdateState({ phase: 'installing', version: pending.release.version })
  spawn('/bin/sh', [helper], { detached: true, stdio: 'ignore' }).unref()
  log(`update: helper ${helper} applies the update once this process exits`)
  app.quit()
}

/**
 * Handle one `/__dsh_desktop_update` command from the settings plugin.
 * @param action - `check`, `download` or `install`.
 */
async function handleUpdateCommand(action) {
  try {
    if (action === 'check') {
      const release = await fetchLatestRelease()
      const latest = String(release.tag_name ?? '').replace(/^v/i, '')
      const current = app.getVersion()
      const checkAsset = pickAsset(release.assets, {
        platform: process.platform,
        arch: process.arch,
        appImage: process.env.APPIMAGE,
      })
      sendUpdateState({
        phase: 'checked',
        version: current,
        latest,
        hasUpdate: isNewer(latest, current),
        // A GitHub release appears before its installers finish uploading, so
        // "newer version, no asset yet" is a normal state to report, not an error.
        assetReady: checkAsset !== undefined,
        notes: typeof release.body === 'string' ? release.body.slice(0, 4000) : '',
        url: release.html_url ?? `https://github.com/${UPDATE_REPO}/releases`,
      })
      return
    }
    if (action === 'download') {
      const release = await fetchLatestRelease()
      const latest = String(release.tag_name ?? '').replace(/^v/i, '')
      const current = app.getVersion()
      if (!isNewer(latest, current)) {
        sendUpdateState({
          phase: 'checked',
          version: current,
          latest,
          hasUpdate: false,
          url: release.html_url ?? `https://github.com/${UPDATE_REPO}/releases`,
        })
        return
      }
      const asset = pickAsset(release.assets, {
        platform: process.platform,
        arch: process.arch,
        appImage: process.env.APPIMAGE,
      })
      if (asset === undefined) {
        // Still uploading: stay in "update available", so the button retries.
        sendUpdateState({
          phase: 'checked',
          version: current,
          latest,
          hasUpdate: true,
          assetReady: false,
          url: release.html_url ?? `https://github.com/${UPDATE_REPO}/releases`,
        })
        return
      }
      await downloadUpdate({ version: latest }, asset)
      return
    }
    if (action === 'install') {
      installUpdate()
      return
    }
    sendUpdateState({ phase: 'error', action, message: `未知操作：${action === '' ? '(空)' : action}` })
  } catch (error) {
    // `action` says whether the check or the download failed, so the row can say which.
    sendUpdateState({ phase: 'error', action, message: String(error?.message ?? error) })
  }
}

/**
 * Headless verification of the updater (`DSH_DESKTOP_UPDATE_SMOKE`): report what
 * the newest release is, and with `download` also fetch this platform's asset.
 * Never installs anything.
 * @param mode - `check` or `download`.
 */
async function runUpdateSmoke(mode) {
  try {
    const release = await fetchLatestRelease()
    const latest = String(release.tag_name ?? '').replace(/^v/i, '')
    const current = app.getVersion()
    const asset = pickAsset(release.assets, { platform: process.platform, arch: process.arch, appImage: process.env.APPIMAGE })
    console.log(`UPDATE SMOKE: current=${current} latest=${latest} hasUpdate=${isNewer(latest, current)} asset=${asset === undefined ? '(none)' : asset.name}`)
    if (mode === 'download') {
      if (asset === undefined) throw new Error('no asset for this platform in the latest release')
      const done = await downloadUpdate({ version: latest }, asset)
      console.log(`UPDATE SMOKE: downloaded ${done.path} (${done.bytes} bytes)`)
    }
    log(`update smoke ok: ${mode}`)
    app.exit(0)
  } catch (error) {
    console.error(`UPDATE SMOKE FAIL: ${String(error?.message ?? error)}`)
    log(`update smoke failed: ${String(error?.message ?? error)}`)
    app.exit(5)
  }
}

/** A badge that says the window is in safe mode, with the way out of it. */
function injectSafeBanner() {
  if (!safeMode || !mainWindow || mainWindow.isDestroyed()) return
  mainWindow.webContents.executeJavaScript(`(() => {
    if (document.getElementById('dsh-safe-banner')) return
    const bar = document.createElement('div')
    bar.id = 'dsh-safe-banner'
    bar.style.cssText = [
      'position:fixed', 'left:16px', 'bottom:16px', 'z-index:9999',
      'display:flex', 'align-items:center', 'gap:10px', 'max-width:60vw',
      'padding:8px 10px 8px 14px', 'border-radius:18px',
      'background:#f5a623', 'color:#1c1c1c',
      'font:400 13px/18px system-ui,sans-serif',
      'box-shadow:0 2px 10px rgba(0,0,0,.25)',
    ].join(';')
    const text = document.createElement('span')
    text.textContent = '安全模式：只加载随包插件，自定义设置未生效'
    const leave = document.createElement('button')
    leave.type = 'button'
    leave.textContent = '退出安全模式'
    leave.style.cssText = [
      'border:0', 'border-radius:12px', 'padding:3px 10px', 'cursor:pointer',
      'background:rgba(0,0,0,.14)', 'color:inherit', 'font:inherit',
    ].join(';')
    leave.onclick = () => { location.href = '/__dsh_desktop_set?key=safe&value=none' }
    bar.appendChild(text)
    bar.appendChild(leave)
    document.body.appendChild(bar)
  })()`).catch(() => {})
}

/** Publish this build's version and platform to the page for client plugins. */
function injectDesktopInfo() {
  if (!mainWindow) return
  const info = {
    version: app.getVersion(),
    platform: process.platform,
    arch: process.arch,
    updatePath: '/__dsh_desktop_update',
    setPath: '/__dsh_desktop_set',
    choosePath: '/__dsh_desktop_choose',
    // Where the data actually is, and why (the settings row shows both).
    homePath: DSH_HOME,
    homeSource: HOME_CHOICE.source,
    homeDefault: defaultHome(process.platform, process.env),
    dataMoves: true,
    // Only Linux gets to choose: elsewhere the native frame is not optional.
    frameChoice: process.platform === 'linux',
    nativeFrame: windowUsesNativeFrame(),
    safeMode,
  }
  mainWindow.webContents
    .executeJavaScript(`window.__NEO_DSH__ = ${JSON.stringify(info)}; true`)
    .catch(() => {})
}

async function fail(message) {
  log(`fatal: ${message}`)
  recordBootFailure(DSH_HOME, message)
  await shutdownHost()
  dialog.showErrorBox('Neo DSH failed to start', message)
  app.exit(1)
}

async function boot() {
  try {
    log(`data home: ${DSH_HOME} (${HOME_CHOICE.source})${safeMode ? ' [safe mode]' : ''}`)
    await offerSafeMode()
    if (!(await ensureHostPort())) {
      recordBootFailure(DSH_HOME, `port ${DESKTOP_PORT} stayed busy`)
      app.exit(1)
      return
    }
    const seeded = seedHome()
    if (seeded.length > 0) log(`seeded $DSH_HOME: ${seeded.join(', ')}`)
    host = startHost()
    resolvedUrl = await host.url
  } catch (error) {
    await fail(String(error.message ?? error))
    return
  }
  watchHostExit()
  createWindow()
}

const gotLock = app.requestSingleInstanceLock()
if (!gotLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    if (mainWindow) {
      if (mainWindow.isMinimized()) mainWindow.restore()
      mainWindow.focus()
    }
  })

  // A shell that is asked to stop should take its host with it.
  for (const signal of ['SIGINT', 'SIGTERM', 'SIGHUP']) {
    process.on(signal, () => {
      log(`received ${signal}`)
      app.quit()
    })
  }

  app.on('before-quit', (event) => {
    if (quitting || !host) return
    event.preventDefault()
    quitting = true
    shutdownHost().finally(() => app.quit())
  })

  app.on('window-all-closed', () => {
    // Quit entirely (host included) when the window closes; on this shell a
    // window-less app has nothing to show. Rebuilding the window for a settings
    // change closes one on purpose — destroying it used to quit the whole app.
    if (recreatingWindow) return
    app.quit()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && resolvedUrl) createWindow()
  })

  // `app.on('ready')` rather than `app.whenReady()`: with an ESM main script the
  // promise form can leave the ready event pending forever — the event waits for
  // the main module to finish evaluating, while the module is waiting on the
  // promise. It only showed up under `electron .` in development, but the event
  // form is correct in both, so there is no reason to keep the fragile one.
  app.on('ready', () => {
    app.setName('Neo DSH')
    /* Keep crash dumps local: the shell ships no upload channel, and a dump is the
       only artifact that says WHY a renderer died (the kernel core from the previous
       crash carried no symbols and no reason). */
    crashReporter.start({ uploadToServer: false, compress: true })
    log(`crash dumps: ${app.getPath('crashDumps')}`)
    Menu.setApplicationMenu(buildMenu())
    boot()
  })

  // GPU/utility crashes are recovered by Chromium itself; log them so a pattern is
  // visible in the desktop log rather than only in the kernel journal.
  app.on('child-process-gone', (_event, details) => {
    log(`child process gone: type=${details.type} reason=${details.reason} exitCode=${details.exitCode}`)
  })
}
