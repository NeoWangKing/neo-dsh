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
/**
 * Third-party plugins that ship as a *dependency* of the shipped profile rather than as a
 * bundle, so they land in the live profile's `node_modules` and wait for the user to switch
 * them on (the plugin page, or `dsh plugin --profile web add <name>`).
 *
 * `platforms` is optional — omit it for a plugin that ships on every platform. When it is
 * given, the assembler deletes the vendor copy on any other platform and the manifest entry
 * is left dangling **on purpose**: `src/main.mjs` skips a `file:vendor/...` dependency whose
 * payload is absent, so on that platform the plugin simply never appears.
 *
 * `dsh-ops` is ours: upstream publishes Windows x64 only (`os: ["win32"]`, win32-only runtime
 * payloads), so each platform carries a copy we built from their source. `BUILD-LINUX.md`
 * and `BUILD-MACOS.md` record the upstream commit and the two edits per platform; the two
 * copies are byte-identical outside `runtime/` and those two edits, which is what keeps an
 * upstream bump a two-line change per platform.
 *
 * `dshmarket` is upstream's (npm `dshmarket`). It has two runtime dependencies and the
 * desktop never runs pnpm at install time, so they travel *inside* the package as
 * `vendor/dshmarket/node_modules/`; that entry sets `keepNodeModules` because the tree copy
 * drops `node_modules` by default (see `copyTree`). See `vendor/dshmarket/VENDOR.md`.
 *
 * Several entries may share one `name`: `dsh-ops` has one per platform. The assembler picks
 * the entry whose `platforms` covers the build host, and removes the target only when none
 * does — otherwise the second entry would delete what the first just copied.
 */
const OPTIONAL_PLUGINS = [
  { dir: join(REPO, 'vendor', 'dsh-ops-linux'), name: 'dsh-ops', platforms: ['linux'] },
  { dir: join(REPO, 'vendor', 'dsh-ops-macos'), name: 'dsh-ops', platforms: ['darwin'] },
  { dir: join(REPO, 'vendor', 'dshmarket'), name: 'dshmarket', keepNodeModules: true },
  // Community plugins the desktop now carries by default, one payload each on every platform.
  // They are ordinary npm packages, so they are vendored with their dependencies inside them —
  // that is what `keepNodeModules` is for, and why `.gitignore` re-includes
  // `vendor/<name>/node_modules/`. `scripts/vendor-npm-plugin.sh` builds each of these.
  { dir: join(REPO, 'vendor', 'dsh-whale-widget'), name: 'dsh-whale-widget', keepNodeModules: true },
  { dir: join(REPO, 'vendor', 'dsh-mnemon'), name: 'dsh-mnemon', keepNodeModules: true },
  { dir: join(REPO, 'vendor', 'dsh-context'), name: 'dsh-context', keepNodeModules: true },
  { dir: join(REPO, 'vendor', 'dsh-cost-meter'), name: 'dsh-cost-meter', keepNodeModules: true },
  { dir: join(REPO, 'vendor', 'cc-safety-net'), name: 'cc-safety-net', keepNodeModules: true },
  { dir: join(REPO, 'vendor', '@liustack', 'modsearch'), name: '@liustack/modsearch', keepNodeModules: true },
  { dir: join(REPO, 'vendor', '@nanmicoder', 'dsh-agent-teams'), name: '@nanmicoder/dsh-agent-teams', keepNodeModules: true },
  { dir: join(REPO, 'vendor', '@michengai', 'dsh-skills-manager'), name: '@michengai/dsh-skills-manager', keepNodeModules: true },
]
/** The preset's local plugin modules travel as a package the profile can resolve. */
const PRESET_PACKAGE = 'dsh-liangshen-preset'
/** Local plugin modules the preset mounts by subpath, shipped beside the package. */
const PRESET_MODULES = ['tool-bootstrap', 'instruction-hint', 'custom-bash', 'skill-search', 'todo-closer', 'compaction-epoch']

/**
 * Copy a directory tree as real files, normalising modes: a source file that
 * happens to be 0600 must not ship unreadable to another user.
 *
 * `node_modules` is dropped by default. That is deliberate: a plugin's own
 * dependencies are normally materialised by pnpm in the live profile, and a pnpm tree
 * is full of symlinks that `cpSync` would have to dereference into a second copy of
 * everything. A plugin that cannot rely on that — because the desktop never runs pnpm
 * at install time — ships its dependencies *inside* itself instead and sets
 * `keepNodeModules`, which is only safe because those copies are hand-built real files
 * with no symlinks (see `vendor/dshmarket/VENDOR.md`).
 *
 * @param from - source directory.
 * @param to - destination directory (replaced).
 * @param options.keepNodeModules - keep nested `node_modules` instead of dropping it.
 */
function copyTree(from, to, { keepNodeModules = false } = {}) {
  if (!existsSync(from)) throw new Error(`build-resources: missing source ${from}`)
  rmSync(to, { recursive: true, force: true })
  mkdirSync(dirname(to), { recursive: true })
  cpSync(from, to, {
    recursive: true,
    dereference: true,
    filter: (src) =>
      (keepNodeModules || !src.includes('node_modules')) && !src.endsWith('.git'),
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

// 2. the plugin, as `vendor/`: the tree copy drops `node_modules` (which is what keeps
//    the payload free of symlinks; a plugin that needs its dependencies to travel sets
//    `keepNodeModules`). The first launch materialises the plugin into the seeded
//    profile's node_modules from this copy (see src/main.mjs seedHome).
for (const plugin of PLUGINS) {
  copyTree(plugin.dir, join(RES, 'profile-web', 'vendor', plugin.name))
  steps.push(`profile-web/vendor/${plugin.name}`)
}
// Group by plugin name first: one plugin can have several platform builds, and they all
// land on the same target. Deciding per entry would let a non-matching one delete the
// copy a matching one just made.
const optionalByName = new Map()
for (const plugin of OPTIONAL_PLUGINS) {
  if (!optionalByName.has(plugin.name)) optionalByName.set(plugin.name, [])
  optionalByName.get(plugin.name).push(plugin)
}
for (const [name, entries] of optionalByName) {
  const target = join(RES, 'profile-web', 'vendor', name)
  // No `platforms` means every platform; otherwise the host's platform must be listed.
  const chosen = entries.find(
    (entry) => entry.platforms === undefined || entry.platforms.includes(process.platform),
  )
  if (chosen === undefined) {
    rmSync(target, { recursive: true, force: true })
    steps.push(`profile-web/vendor/${name} (skipped on ${process.platform})`)
    continue
  }
  copyTree(chosen.dir, target, { keepNodeModules: chosen.keepNodeModules === true })
  steps.push(`profile-web/vendor/${name} ← ${relative(REPO, chosen.dir)}`)
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
// The optional third-party plugins are *dependencies* rather than bundles, so the loop above
// never looks at them — but a silent miss there is just as bad. Two failures are worth
// catching here rather than in an installed app:
//   * a `keepNodeModules` plugin whose nested `node_modules` was dropped by the tree copy;
//   * a platform payload that never made it across, which `resolveWorker()` would only
//     report at runtime (and a darwin-x64 build would otherwise ship an arm64 worker).
for (const [name, entries] of optionalByName) {
  const target = join(RES, 'profile-web', 'vendor', name)
  const chosen = entries.find(
    (entry) => entry.platforms === undefined || entry.platforms.includes(process.platform),
  )
  if (chosen === undefined) {
    if (existsSync(target)) throw new Error(`build-resources: ${name} should be absent on ${process.platform}`)
    console.log(`  – ${name} (not shipped on ${process.platform})`)
    continue
  }
  if (chosen.keepNodeModules === true) {
    // Compare the copy against the source instead of asserting the directory exists. A plugin
    // with no dependencies has an empty `node_modules`, and git cannot store an empty directory,
    // so on a fresh clone — which is what CI builds — it is simply absent. Asserting that it
    // exists passes locally and fails there; what actually matters is that nothing the source
    // had was dropped in transit.
    const sourceModules = join(chosen.dir, 'node_modules')
    const copiedModules = join(target, 'node_modules')
    const wanted = existsSync(sourceModules) ? readdirSync(sourceModules) : []
    const got = existsSync(copiedModules) ? readdirSync(copiedModules) : []
    const dropped = wanted.filter((entry) => !got.includes(entry))
    if (dropped.length > 0) {
      throw new Error(
        `build-resources: ${name} dropped ${dropped.length} node_modules entr${dropped.length === 1 ? 'y' : 'ies'} (${dropped.slice(0, 3).join(', ')})`,
      )
    }
  }
  const runtimeDir = join(target, 'runtime')
  if (existsSync(runtimeDir) && !existsSync(join(runtimeDir, `${process.platform}-${process.arch}`))) {
    throw new Error(
      `build-resources: ${name} carries no runtime for ${process.platform}-${process.arch}`,
    )
  }
  console.log(`  ✓ ${name} → ${relative(REPO, target)}`)
}
if (!existsSync(join(RES, 'settings.defaults.yaml'))) throw new Error('build-resources: settings.defaults.yaml missing')
