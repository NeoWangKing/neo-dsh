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
 *     profile-web/presets/    the agent preset, as a profile patch layer
 *     profile-web/vendor/dsh-liangshen-preset/
 *                             the preset's own plugin modules
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
import { chmodSync, cpSync, existsSync, mkdirSync, readFileSync, readdirSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { createRequire } from 'node:module'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = dirname(dirname(fileURLToPath(import.meta.url)))
const APP = join(REPO, 'apps', 'desktop')
const RES = join(APP, 'resources')
const PLUGINS = [
  { dir: join(REPO, 'plugins', 'activity-line'), name: 'dsh-activity-line' },
  { dir: join(REPO, 'plugins', 'desktop-settings'), name: 'dsh-desktop-settings' },
  { dir: join(REPO, 'plugins', 'smart-approval'), name: 'dsh-smart-approval' },
]
const YAML = createRequire(join(APP, 'package.json'))('yaml')
const PRESET = join(REPO, 'presets', 'liangshen')
/** The preset's local plugin modules travel as a package the profile can resolve. */
const PRESET_PACKAGE = 'dsh-liangshen-preset'
/** Local plugin modules the preset mounts by subpath, shipped beside the package. */
const PRESET_MODULES = ['tool-bootstrap', 'instruction-hint', 'custom-bash', 'skill-search', 'todo-closer', 'compaction-epoch']

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
/** Copy one file with the same mode normalisation the tree copy applies. */
function copyFile(from, to) {
  if (!existsSync(from)) throw new Error(`build-resources: missing source ${from}`)
  cpSync(from, to, { dereference: true })
  chmodSync(to, 0o644)
}

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

// 1. the agent preset. The harness dropped the `$DSH_HOME/.agent-presets/<id>/`
//    directory in 0.2 in favour of a profile entry (`@deepseek-ai/dsh-agent-preset`),
//    so the preset ships as two pieces: its local plugin modules as a resolvable
//    package, and a patch layer that declares the entry itself. The id stays
//    `liangshen`: sessions created by an earlier build record it and have to keep
//    resolving.
const presetVendor = join(RES, 'profile-web', 'vendor', PRESET_PACKAGE)
rmSync(presetVendor, { recursive: true, force: true })
mkdirSync(presetVendor, { recursive: true })
copyFile(join(PRESET, 'package.json'), join(presetVendor, 'package.json'))
for (const module of PRESET_MODULES) {
  copyFile(join(PRESET, `${module}.mjs`), join(presetVendor, `${module}.mjs`))
}
steps.push(`profile-web/vendor/${PRESET_PACKAGE}`)

const presetMeta = YAML.parse(readFileSync(join(PRESET, 'preset.yml'), 'utf8'))
const presetRows = readFileSync(join(PRESET, 'agent.cordis.yml'), 'utf8').replace(/\s+$/, '')
const indent = (text, width) =>
  text
    .split('\n')
    .map((line) => (line.trim() === '' ? line : ' '.repeat(width) + line))
    .join('\n')
const presetPatch = [
  '# Generated by scripts/build-resources.mjs from presets/liangshen/ — do not edit.',
  '#',
  '# 0.2 declares an agent preset as a profile entry rather than a directory under',
  '# $DSH_HOME/.agent-presets, and a patch can only override entries that already',
  '# exist, so the entry is added with a root-level `insert` list.',
  // 0.1.5 named the default preset in settings (`agent-presets.default`); 0.2 owns it in
  // the registry row, so the same choice travels here instead.
  '- id: agent-preset-registry',
  '  config:',
  '    default: liangshen',
  '- insert:',
  '    - id: preset-liangshen',
  "      name: '@deepseek-ai/dsh-agent-preset'",
  '      config:',
  '        id: liangshen',
  `        name: ${JSON.stringify(presetMeta.name)}`,
  `        order: ${JSON.stringify(presetMeta.order)}`,
  `        description: ${JSON.stringify(presetMeta.description)}`,
  '        plugins:',
  indent(presetRows, 10),
  '',
].join('\n')
const presetPatchPath = join(RES, 'profile-web', 'presets', 'liangshen.patch.yml')
mkdirSync(dirname(presetPatchPath), { recursive: true })
writeFileSync(presetPatchPath, presetPatch)
// A mis-indented block would still parse as YAML but drop the rows into the wrong
// list, so the generated layer is parsed back and counted before it can ship.
const parsed = YAML.parse(presetPatch, { logLevel: 'error' })
const declared = parsed?.find((patch) => Array.isArray(patch?.insert))?.insert?.[0]?.config?.plugins
if (!Array.isArray(declared) || declared.length === 0) {
  throw new Error('build-resources: the generated preset patch has no plugin rows')
}
steps.push(`profile-web/presets/liangshen.patch.yml (${declared.length} rows)`)
// The old directory form is dead in 0.2; drop it so it cannot ship again.
rmSync(join(RES, 'presets'), { recursive: true, force: true })

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
