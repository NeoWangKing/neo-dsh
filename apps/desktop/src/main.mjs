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

import { spawn } from 'node:child_process'
import { appendFileSync, cpSync, existsSync, mkdirSync, statSync } from 'node:fs'
import { homedir } from 'node:os'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'
import { app, BrowserWindow, crashReporter, dialog, Menu, shell } from 'electron'

const require = createRequire(import.meta.url)
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))

/** Harness home: the same default the `dsh` CLI uses, overridable. */
const DSH_HOME = process.env.DSH_HOME ?? join(homedir(), '.dsh')

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
  mkdirSync(DSH_HOME, { recursive: true })
  if (seedDirectory(join(RESOURCES, 'profile-web'), join(DSH_HOME, 'profiles', 'web'))) seeded.push('profiles/web')
  // The package ships the plugin as `vendor/` (electron-builder filters
  // node_modules out of extraResources); the host resolves bundles through
  // node_modules, so materialise it here, in the user's own writable profile.
  // Only fills a gap: a plugin the user installed or upgraded themselves wins.
  const vendor = join(DSH_HOME, 'profiles', 'web', 'vendor', 'dsh-activity-line')
  const installed = join(DSH_HOME, 'profiles', 'web', 'node_modules', 'dsh-activity-line')
  if (existsSync(vendor) && !existsSync(installed)) {
    mkdirSync(dirname(installed), { recursive: true })
    cpSync(vendor, installed, { recursive: true, dereference: true })
    seeded.push('profiles/web/node_modules/dsh-activity-line')
  }
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
  log(`DSH_HOME=${DSH_HOME} resources=${RESOURCES} packaged=${app.isPackaged}`)
  const child = spawn(node, [bin, 'web', '--no-open', '--port', DESKTOP_PORT], {
    env: { ...process.env, DSH_HOME },
    stdio: ['ignore', 'pipe', 'pipe'],
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
          `the dsh host exited before it was ready (code=${code}, signal=${signal})\n\n${stderr.text.trim()}`,
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
    frame: false,
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
    if (url !== resolvedUrl) {
      event.preventDefault()
      if (url.startsWith('http://') || url.startsWith('https://')) shell.openExternal(url)
    }
  })
  mainWindow.webContents.on('did-finish-load', () => {
    injectRestartButton()
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
}

/** Attach the unexpected-exit watchdog to the CURRENT host (each host needs its own). */
function watchHostExit() {
  host.onExit((code, signal) => {
    // Unexpected exit only: our own shutdown/restart nulls `host` first.
    if (!quitting && host) {
      host = null
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

/** Full restart: stop the host, boot a fresh one, and reload the window. */
async function restartHost() {
  if (restarting) return
  restarting = true
  log('restart requested: stopping host')
  try {
    await shutdownHost()
    host = startHost()
    resolvedUrl = await host.url
    log(`restart: new host ready at ${resolvedUrl}`)
    watchHostExit()
    if (mainWindow) mainWindow.loadURL(resolvedUrl)
  } catch (error) {
    await fail(String(error.message ?? error))
  } finally {
    restarting = false
  }
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

async function fail(message) {
  log(`fatal: ${message}`)
  await shutdownHost()
  dialog.showErrorBox('Neo DSH failed to start', message)
  app.exit(1)
}

async function boot() {
  try {
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

  app.on('before-quit', (event) => {
    if (quitting || !host) return
    event.preventDefault()
    quitting = true
    shutdownHost().finally(() => app.quit())
  })

  app.on('window-all-closed', () => {
    // Quit entirely (host included) when the window closes; on this shell a
    // window-less app has nothing to show.
    app.quit()
  })

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0 && resolvedUrl) createWindow()
  })

  app.whenReady().then(() => {
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
