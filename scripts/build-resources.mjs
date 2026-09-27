/**
 * build-resources.mjs — assemble everything the packaged app ships beside its
 * own code, from the repo's sources.
 *
 * The shipped tree is deliberately plain files, no symlinks and no package
 * manager run:
 *
 *   apps/desktop/resources/
 *     profile-web/            the web profile seeded into $DSH_HOME on first launch
 *       node_modules/dsh-activity-line/   the plugin, as real files
 *       vendor/dsh-activity-line/         the same files, so a later
 *                                         `dsh plugin add` can re-resolve the
 *                                         `file:vendor/...` dependency offline
 *     presets/liangshen/      the agent preset
 *     settings.defaults.yaml  first-launch settings
 *     node/                   official Node runtime (scripts/fetch-node.mjs)
 *
 * pnpm would leave a relative symlink for a `file:` dependency; a symlink inside
 * a .dmg/AppImage/nsis payload is one more thing that can break, and the plugin
 * has no dependencies of its own to install, so the assembler copies it twice
 * instead. Running `dsh plugin --profile web add ...` later still works: the
 * declared `file:vendor/dsh-activity-line` dependency resolves inside the app.
 *
 * Usage: node scripts/build-resources.mjs
 */
import { chmodSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = dirname(dirname(fileURLToPath(import.meta.url)))
const APP = join(REPO, 'apps', 'desktop')
const RES = join(APP, 'resources')
const PLUGINS = [
  { dir: join(REPO, 'plugins', 'activity-line'), name: 'dsh-activity-line' },
  { dir: join(REPO, 'plugins', 'desktop-settings'), name: 'dsh-desktop-settings' },
]
const PRESET = join(REPO, 'presets', 'liangshen')

/**
 * Copy a directory tree as real files, normalising modes: a source file that
 * happens to be 0600 must not ship unreadable to another user.
 * @param from - source directory.
 * @param to - destination directory (replaced).
 */
function copyTree(from, to) {
  if (!existsSync(from)) throw new Error(`build-resources: missing source ${from}`)
  rmSync(to, { recursive: true, force: true })
  mkdirSync(dirname(to), { recursive: true })
  cpSync(from, to, {
    recursive: true,
    dereference: true,
    filter: (src) => !src.includes('node_modules') && !src.endsWith('.git'),
  })
  chmodTree(to)
}

/**
 * Give every file under `root` a mode that survives packaging and copying:
 * directories and scripts keep an execute bit, everything else becomes 0644.
 * @param root - directory to walk.
 */
function chmodTree(root) {
  for (const entry of readdirSync(root, { withFileTypes: true })) {
    const path = join(root, entry.name)
    if (entry.isDirectory()) chmodTree(path)
    else if (entry.isFile()) {
      const mode = statSync(path).mode & 0o777
      if (mode !== 0o644 && mode !== 0o755) chmodSync(path, mode & 0o111 ? 0o755 : 0o644)
    }
  }
}

const steps = []

// 1. the agent preset
copyTree(PRESET, join(RES, 'presets', 'liangshen'))
steps.push('presets/liangshen')

// 2. the plugin, as `vendor/`: electron-builder filters `node_modules` out of
//    extraResources, and shipping no node_modules at all is also what keeps the
//    package free of symlinks. The first launch materialises the plugin into the
//    seeded profile's node_modules from this copy (see src/main.mjs seedHome).
for (const plugin of PLUGINS) {
  copyTree(plugin.dir, join(RES, 'profile-web', 'vendor', plugin.name))
  steps.push(`profile-web/vendor/${plugin.name}`)
}

// 3. report what will actually ship, so a silent miss is impossible
const profile = JSON.parse(readFileSync(join(RES, 'profile-web', 'package.json'), 'utf8'))
const bundles = profile.dsh.profile.bundles
console.log('build-resources: assembled')
for (const step of steps) console.log(`  ${step}`)
console.log(`  profile bundles: ${bundles.join(', ')}`)
for (const bundle of bundles.filter((b) => !b.startsWith('@deepseek-ai/'))) {
  const target = join(RES, 'profile-web', 'vendor', bundle)
  if (!existsSync(target)) throw new Error(`build-resources: bundle ${bundle} is not in the shipped profile`)
  console.log(`  ✓ ${bundle} → ${relative(REPO, target)}`)
}
if (!existsSync(join(RES, 'settings.defaults.yaml'))) throw new Error('build-resources: settings.defaults.yaml missing')
