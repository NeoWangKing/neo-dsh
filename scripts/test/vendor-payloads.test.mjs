/**
 * Tests for the payloads `scripts/build-resources.mjs` ships as *dependencies* of the
 * profile — the third-party plugins under `vendor/` that are not bundles.
 *
 * These look at the checked-in sources rather than at the assembled resources, because the
 * assembled tree is a build output that may not exist when the suite runs. Whether a payload
 * actually survives the copy into `resources/` is asserted inside `build-resources.mjs`, so a
 * miss fails the build instead of a test run — including `keepNodeModules` losing its nested
 * `node_modules`, and a platform build that never made it across.
 *
 * The cases that matter are the ones that went wrong or nearly did:
 *   * `dsh-ops` has one build per platform and they all land on one target, so the two copies
 *     must stay in step — an upstream bump is meant to be a two-line change each;
 *   * a vendored npm package is only useful if *every* dependency it declares is inside it,
 *     because the desktop never runs pnpm at install time.
 *
 *   node scripts/test/vendor-payloads.test.mjs
 */
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const vendor = join(root, 'vendor')

let failures = 0
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(
    `${ok ? 'ok  ' : 'fail'}  ${name} → ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`,
  )
}

/** Every file below `dir`, as sorted repo-relative paths. */
function filesUnder(dir, base = dir) {
  const out = []
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isDirectory()) out.push(...filesUnder(path, base))
    else if (entry.isFile()) out.push(relative(base, path))
  }
  return out.sort()
}

const sha256 = (path) => createHash('sha256').update(readFileSync(path)).digest('hex')

// ── a vendored plugin ships every path it declares ────────────────────────────────────
//
// Nothing else can supply these: the plugin page draws a card from `icon`, the loader mounts
// `main` and the `exports` subpaths that name components, and the host manifest names its own
// `facets.*.entry`. `icon` is how this was found — dsh-ops lists it, the vendored tree never
// carried it, and the page reported `包元信息错误` on that one card while everything else worked.
//
// `files` is deliberately not checked. It also lists build sources and docs that the vendored
// copy trims on purpose (each BUILD-*.md says so), and a miss there changes nothing at runtime.
const GLOB = /[*?]/

/** Every runtime path a plugin's manifests name, as [where it came from, path]. */
function declaredEntryPoints(dir) {
  const manifest = join(dir, 'package.json')
  if (!existsSync(manifest)) return []
  const pkg = JSON.parse(readFileSync(manifest, 'utf8'))
  const paths = []

  for (const field of ['main', 'module', 'icon', 'types', 'browser']) {
    if (typeof pkg[field] === 'string') paths.push([field, pkg[field]])
  }

  const walk = (node, label) => {
    if (typeof node === 'string') {
      if (node.startsWith('./')) paths.push([label, node])
    } else if (node !== null && typeof node === 'object') {
      for (const [key, value] of Object.entries(node)) walk(value, `${label}.${key}`)
    }
  }
  for (const field of ['exports', 'bin']) if (field in pkg) walk(pkg[field], field)

  const dshManifest = join(dir, 'dsh-plugin.json')
  if (existsSync(dshManifest)) {
    const parsed = JSON.parse(readFileSync(dshManifest, 'utf8'))
    for (const [facet, config] of Object.entries(parsed.facets ?? {})) {
      if (typeof config?.entry === 'string') {
        paths.push([`dsh-plugin.json facets.${facet}.entry`, config.entry])
      }
    }
  }

  // A glob names a set, not a file — `./locale/*.json` is satisfied by the files inside it.
  return paths.filter(([, path]) => !GLOB.test(path))
}

for (const name of readdirSync(vendor).filter((entry) => statSync(join(vendor, entry)).isDirectory())) {
  const dir = join(vendor, name)
  const missing = declaredEntryPoints(dir)
    .filter(([, path]) => !existsSync(join(dir, path)))
    .map(([where, path]) => `${where} → ${path}`)
  check(`${name}: every declared entry point is in the copy`, missing, [])
}

// ── a vendored payload carries no macOS packaging litter ──────────────────────────────
//
// Building the macOS copy on a Mac left AppleDouble sidecars behind (`._*`, one per file and
// per directory), and they landed inside `runtime/` — the one directory the symmetry check
// deliberately skips — so they would have been committed and shipped. They are inert, but
// they are not part of the plugin, and nothing but this notices them.
const LITTER = /^\._|^\.DS_Store$/
const litter = []
for (const name of readdirSync(vendor).filter((entry) => statSync(join(vendor, entry)).isDirectory())) {
  for (const path of filesUnder(join(vendor, name))) {
    const base = path.split('/').pop()
    if (LITTER.test(base)) litter.push(`${name}/${path}`)
  }
}
check('vendored payloads carry no macOS packaging litter', litter, [])

// ── the two dsh-ops platform builds stay in step ──────────────────────────────────────

const OPS_DIFFERENCES = new Set(['BUILD-LINUX.md', 'BUILD-MACOS.md', 'lib/ptc/runtime.js', 'package.json'])
const opsTrees = ['dsh-ops-linux', 'dsh-ops-macos'].map((name) => {
  const dir = join(vendor, name)
  return {
    name,
    dir,
    files: filesUnder(dir)
      .filter((path) => !path.startsWith('runtime/'))
      .filter((path) => !OPS_DIFFERENCES.has(path)),
  }
})

const onlyIn = (a, b) => a.filter((path) => !b.includes(path))
check(
  'dsh-ops builds carry the same files outside runtime/ and the four allowed differences',
  [...onlyIn(opsTrees[0].files, opsTrees[1].files), ...onlyIn(opsTrees[1].files, opsTrees[0].files)],
  [],
)

check(
  'dsh-ops builds are byte-identical outside runtime/ and the two edited files',
  opsTrees[0].files.filter((path) => sha256(join(opsTrees[0].dir, path)) !== sha256(join(opsTrees[1].dir, path))),
  [],
)

// ── the platform edits are the ones the BUILD-*.md files describe ─────────────────────

const OPS_TARGETS = [
  { dir: 'dsh-ops-linux', platform: 'linux', arch: 'x64', magic: '7f454c46' },
  { dir: 'dsh-ops-macos', platform: 'darwin', arch: 'arm64', magic: 'cffaedfe' },
]

for (const { dir, platform, arch, magic } of OPS_TARGETS) {
  const pkg = JSON.parse(readFileSync(join(vendor, dir, 'package.json'), 'utf8'))
  check(`${dir}: os/cpu name this build only`, [pkg.os, pkg.cpu], [[platform], [arch]])

  const runtime = readFileSync(join(vendor, dir, 'lib', 'ptc', 'runtime.js'), 'utf8')
  check(
    `${dir}: PLATFORMS lists its own target`,
    /PLATFORMS = Object\.freeze\(\[([^\]]*)\]\)/.exec(runtime)?.[1].replaceAll(/['\s]/g, '').split(','),
    ['win32-x64', `${platform}-${arch}`],
  )

  const worker = join(vendor, dir, 'runtime', `${platform}-${arch}`, 'dsh-ops-worker')
  check(`${dir}: the staged worker has the expected magic`, readFileSync(worker).subarray(0, 4).toString('hex'), magic)

  const provenance = JSON.parse(readFileSync(join(vendor, dir, 'runtime', `${platform}-${arch}`, 'provenance.json'), 'utf8'))
  check(`${dir}: provenance matches the worker it ships`, provenance.sha256, sha256(worker))
  check(`${dir}: provenance names the target`, provenance.target, `${platform}-${arch}`)
}

// ── a vendored npm plugin carries everything it declares ──────────────────────────────

const MARKET = join(vendor, 'dshmarket')
const marketPkg = JSON.parse(readFileSync(join(MARKET, 'package.json'), 'utf8'))

check(
  'dshmarket ships its own dependencies, since the installer never runs pnpm',
  Object.keys(marketPkg.dependencies ?? {}).filter((name) => !existsSync(join(MARKET, 'node_modules', name))),
  [],
)

// …including the transitive ones, which is why they are hoisted into that same directory.
const hoisted = existsSync(join(MARKET, 'node_modules')) ? readdirSync(join(MARKET, 'node_modules')) : []
for (const name of hoisted) {
  const depPkg = join(MARKET, 'node_modules', name, 'package.json')
  if (!existsSync(depPkg)) continue
  const missing = Object.keys(JSON.parse(readFileSync(depPkg, 'utf8')).dependencies ?? {}).filter(
    (child) => !hoisted.includes(child),
  )
  check(`${name}: its own dependencies are hoisted alongside it`, missing, [])
}

check('dshmarket is vendored as real files, not symlinks', existsSync(join(MARKET, 'node_modules')) && statSync(join(MARKET, 'node_modules')).isDirectory(), true)

// Shipping the dependencies is only half the mechanism: `.gitignore` excludes `node_modules/`
// at every level, so the plugin also needs a negation rule naming that *directory* (git will
// not descend into an ignored parent, so a `!…/node_modules/**` line alone is a no-op). The
// build cannot see this and neither can a test that only looks at the working tree — both look
// perfectly healthy while the commit carries a dshmarket with no dependencies in it.
function notIgnoredByGit() {
  try {
    execFileSync('git', ['rev-parse', '--git-dir'], { cwd: root, stdio: 'ignore' })
  } catch {
    return null // not a checkout (a tarball, say) — nothing to assert
  }
  const ignored = []
  for (const path of filesUnder(join(MARKET, 'node_modules'))) {
    const relativeToRoot = relative(root, join(MARKET, 'node_modules', path))
    try {
      execFileSync('git', ['check-ignore', '--quiet', relativeToRoot], { cwd: root, stdio: 'ignore' })
      ignored.push(relativeToRoot)
    } catch {
      // exit 1 means "not ignored", which is the healthy case
    }
  }
  return ignored
}

const ignoredDeps = notIgnoredByGit()
if (ignoredDeps !== null) {
  check('dshmarket dependencies are not git-ignored, or they never reach the commit', ignoredDeps, [])
}

console.log(failures === 0 ? '\nvendor-payloads: all checks passed' : `\nvendor-payloads: ${failures} check(s) failed`)
process.exit(failures === 0 ? 0 : 1)
