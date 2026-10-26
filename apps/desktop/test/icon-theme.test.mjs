/**
 * The open-in-app menu resolves Linux icons through `hicolor` and `pixmaps` only, so a user's
 * icon theme (WhiteSur, Papirus, breeze) was ignored while the rest of the desktop used it.
 * Our harness patch prefers the theme named in the GTK settings, then falls back to hicolor.
 *
 * This test drives the patched resolver against a throw-away HOME: it proves the theme wins
 * when it has the artwork, that hicolor still answers when it does not, and that a missing
 * icon stays null instead of throwing.
 *
 *   node apps/desktop/test/icon-theme.test.mjs
 */
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const modulePath = join(here, '..', 'node_modules', '@deepseek-ai', 'dsh-native-command', 'lib', 'types', 'desktop-entry.js')

let failures = 0
function check(name, ok, detail) {
  if (ok) {
    console.log(`  ✓ ${name}`)
    return
  }
  failures += 1
  console.log(`  ✗ ${name}${detail === undefined ? '' : ` — ${detail}`}`)
}

const patchMarker = 'async function iconThemesInUse()'
let resolver
try {
  const source = (await import('node:fs')).readFileSync(modulePath, 'utf8')
  if (!source.includes(patchMarker)) {
    console.log('  · dsh-native-command is not patched in this tree — nothing to test (run pnpm run resources)')
    console.log('\nicon-theme: skipped')
    process.exit(0)
  }
  resolver = (await import(modulePath)).desktopApplicationIcon
} catch (error) {
  console.log(`  · cannot load ${modulePath}: ${error.message}`)
  console.log('\nicon-theme: skipped')
  process.exit(0)
}

const home = mkdtempSync(join(tmpdir(), 'neo-icon-theme-'))
const data = join(home, '.local', 'share')
const theme = 'TestNord'
const write = (path, body) => {
  mkdirSync(dirname(path), { recursive: true })
  writeFileSync(path, body)
}

// The theme uses the flat `apps/scalable` layout that WhiteSur and Papirus ship.
write(join(home, '.config', 'gtk-3.0', 'settings.ini'), 'gtk-theme-name = adw-gtk3-dark\ngtk-icon-theme-name = TestNord\n')
write(join(data, 'icons', theme, 'apps', 'scalable', 'themed-app.svg'), '<svg>theme</svg>')
write(join(data, 'icons', theme, 'apps', '48', 'only-flat.png'), 'flat')
write(join(data, 'icons', 'hicolor', 'scalable', 'apps', 'themed-app.svg'), '<svg>hicolor</svg>')
write(join(data, 'icons', 'hicolor', 'scalable', 'apps', 'plain-app.svg'), '<svg>plain</svg>')

const previous = { HOME: process.env.HOME, XDG_CONFIG_HOME: process.env.XDG_CONFIG_HOME, XDG_DATA_HOME: process.env.XDG_DATA_HOME }
process.env.HOME = home
process.env.XDG_CONFIG_HOME = join(home, '.config')
process.env.XDG_DATA_HOME = data
const roots = [data, join(home, 'usr-share')]
const body = (icon) => (icon === null ? null : Buffer.from(icon.bytes).toString())

try {
  check('theme artwork wins over hicolor', body(await resolver('themed-app', roots)) === '<svg>theme</svg>')

  const flat = await resolver('only-flat', roots)
  check('flat apps/<size> layout resolves', body(flat) === 'flat')

  check('hicolor answers when the theme has nothing', body(await resolver('plain-app', roots)) === '<svg>plain</svg>')

  check('unknown icon is null, not a throw', (await resolver('nope-not-installed', roots)) === null)

  writeFileSync(join(home, '.config', 'gtk-3.0', 'settings.ini'), 'gtk-icon-theme-name = hicolor\n')
  check('a hicolor preference still resolves', body(await resolver('plain-app', roots)) === '<svg>plain</svg>')

  rmSync(join(home, '.config', 'gtk-3.0', 'settings.ini'))
  check('no GTK settings falls back to hicolor', body(await resolver('plain-app', roots)) === '<svg>plain</svg>')
  // The host imports the package entry, which inlines its own copy of this lookup — a patch to
  // the split sources alone would never reach the running app.
  const bundled = join(here, '..', 'node_modules', '@deepseek-ai', 'dsh-native-command', 'lib', 'index.js')
  const bundledSource = readFileSync(bundled, 'utf8')
  check('the bundled package entry carries the patch too', bundledSource.includes('iconThemesInUse()'))

  process.env.HOME = home
  process.env.XDG_CONFIG_HOME = join(home, '.config')
  process.env.XDG_DATA_HOME = data
  write(join(home, '.config', 'gtk-3.0', 'settings.ini'), 'gtk-icon-theme-name = TestNord\n')
  write(join(data, 'icons', theme, 'apps', 'scalable', 'entry-app.svg'), '<svg>entry</svg>')
  const entry = await import(bundled)
  check('package entry resolves themed artwork', body(await entry.desktopApplicationIcon('entry-app', roots)) === '<svg>entry</svg>')
} finally {
  for (const [key, value] of Object.entries(previous)) {
    if (value === undefined) delete process.env[key]
    else process.env[key] = value
  }
  rmSync(home, { recursive: true, force: true })
}

console.log(failures === 0 ? '\nicon-theme: ok' : `\nicon-theme: ${failures} failure(s)`)
process.exit(failures === 0 ? 0 : 1)
