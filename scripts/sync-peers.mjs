/**
 * sync-peers.mjs — promote the harness's peer dependencies into the app's own
 * dependency list, because the packager does not follow peer edges.
 *
 * electron-builder collects what goes into `resources/app/node_modules` by
 * walking `dependencies` from the app's package.json. The harness declares its
 * loader plugins and capability packages (`@deepseek-ai/cordis-plugin-group`,
 * `@deepseek-ai/dsh-shell`, `@deepseek-ai/dsh-settings`, …) as *peer*
 * dependencies, and imports several of them dynamically at boot. A pnpm install
 * puts them on disk, so a development tree works — and the packaged app then
 * dies with `ERR_MODULE_NOT_FOUND: Cannot find package
 * '@deepseek-ai/cordis-plugin-group'` the moment the host boots.
 *
 * So: read the installed tree, keep every `@deepseek-ai/*` package that any
 * installed package lists as a peer, and write them into the app's
 * `dependencies` at the exact versions already installed. The list is generated,
 * committed, and checked in CI (`--check`) so a harness bump that adds a peer
 * fails the build instead of shipping a broken installer.
 *
 * Usage:
 *   node scripts/sync-peers.mjs           # write apps/desktop/package.json
 *   node scripts/sync-peers.mjs --check   # exit 1 when the file is stale
 */
import { readFileSync, readdirSync, statSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = dirname(dirname(fileURLToPath(import.meta.url)))
const APP = join(REPO, 'apps', 'desktop')
const MODULES = join(APP, 'node_modules')
const MANIFEST = join(APP, 'package.json')

/** @returns every installed package's manifest, keyed by name. */
function installedManifests() {
  const found = new Map()
  /** @param dir - directory holding package folders.
   *  @param scope - scope name when walking a scope directory. */
  const walk = (dir, scope) => {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      if (!entry.isDirectory()) continue
      if (scope === undefined && entry.name.startsWith('@')) {
        walk(join(dir, entry.name), entry.name)
        continue
      }
      const name = scope === undefined ? entry.name : `${scope}/${entry.name}`
      const manifest = join(dir, entry.name, 'package.json')
      try {
        if (!statSync(manifest).isFile()) continue
      } catch {
        continue
      }
      try {
        found.set(name, JSON.parse(readFileSync(manifest, 'utf8')))
      } catch {
        // A malformed third-party manifest is not this script's business.
      }
    }
  }
  walk(MODULES, undefined)
  return found
}

const installed = installedManifests()

/** @returns `{ name: version }` for every harness peer that is installed.
 *
 * Only `@deepseek-ai/*` manifests are consulted: build tools in the dev tree
 * (electron-builder and friends) declare peers of their own, and pulling those
 * into the app's dependencies would ship packaging tooling inside the app.
 */
function peerClosure() {
  const peers = new Map()
  for (const [owner, manifest] of installed) {
    if (!owner.startsWith('@deepseek-ai/')) continue
    for (const name of Object.keys(manifest.peerDependencies ?? {})) {
      const found = installed.get(name)
      if (found === undefined) continue
      peers.set(name, found.version)
    }
  }
  peers.delete('@deepseek-ai/dsh')
  // Excluded on purpose. This one is an authoring-time plugin (hot reload of the
  // host's cordis config), and its presence is actively harmful in a packaged app:
  // a profile that does not set `dsh.profile.patchReload` defaults to "live", the
  // boot then tries to watch the patch layer through HMR, finds no `hmr` service,
  // and the host dies with "user patch-layer watching requires the Cordis HMR
  // service" — after the readiness URL was already printed, so the window shows
  // "the dsh host exited unexpectedly". Without the package the attempt fails
  // harmlessly and boot continues. An existing profile from an older install has
  // exactly this shape, which is how it was found.
  peers.delete('@deepseek-ai/cordis-plugin-hmr')
  return Object.fromEntries([...peers.entries()].sort(([a], [b]) => a.localeCompare(b)))
}

const manifest = JSON.parse(readFileSync(MANIFEST, 'utf8'))
const peers = peerClosure()
// Exactly one dependency is hand-written: the harness itself. Everything else in
// this file is generated, so the list cannot drift from what is installed.
const harness = manifest.dependencies['@deepseek-ai/dsh'] ?? installed.get('@deepseek-ai/dsh')?.version
if (harness === undefined) throw new Error('sync-peers: @deepseek-ai/dsh is not installed — run pnpm install first')
const sorted = Object.fromEntries(
  Object.entries({ '@deepseek-ai/dsh': harness, ...peers }).sort(([a], [b]) => a.localeCompare(b)),
)

const before = JSON.stringify(manifest.dependencies)
const after = JSON.stringify(sorted)
if (before === after) {
  console.log(`sync-peers: up to date (${Object.keys(sorted).length} entries, ${Object.keys(peers).length} peers)`)
  process.exit(0)
}

const added = Object.keys(sorted).filter((n) => manifest.dependencies[n] === undefined)
const changed = Object.keys(sorted).filter(
  (n) => manifest.dependencies[n] !== undefined && manifest.dependencies[n] !== sorted[n],
)
if (process.argv.includes('--check')) {
  console.error('sync-peers: apps/desktop/package.json is stale — run `node scripts/sync-peers.mjs`')
  if (added.length) console.error(`  missing: ${added.join(', ')}`)
  if (changed.length) console.error(`  changed: ${changed.join(', ')}`)
  process.exit(1)
}

manifest.dependencies = sorted
writeFileSync(MANIFEST, `${JSON.stringify(manifest, null, 2)}\n`)
console.log(`sync-peers: ${Object.keys(sorted).length} dependencies written`)
if (added.length) console.log(`  added: ${added.join(', ')}`)
if (changed.length) console.log(`  updated: ${changed.join(', ')}`)
