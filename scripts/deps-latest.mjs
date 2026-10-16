#!/usr/bin/env node
/**
 * Report every pin that is not the newest version on npm, for the release preflight.
 *
 * The rule this exists to enforce: **a release must carry the newest harness and the
 * newest vendored payloads as of the moment it is packaged**, not whatever happened to
 * be pinned when the work started. `@deepseek-ai/*` follows one lockstep version — the
 * newest published `@deepseek-ai/dsh`, prereleases included — and third-party payloads
 * in `vendor/` follow their own npm `latest`.
 *
 *   node scripts/deps-latest.mjs           # table + exit 1 when anything is behind
 *   node scripts/deps-latest.mjs --offline # skip npm, only show the pins
 *
 * Network: one `npm view` per package, eight at a time.
 */
import { readFileSync, readdirSync, existsSync } from 'node:fs'
import { execFile } from 'node:child_process'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { promisify } from 'node:util'

const run = promisify(execFile)
const repo = dirname(dirname(fileURLToPath(import.meta.url)))
const offline = process.argv.includes('--offline')

/** Newest version by semver, prereleases included (that is the point for `-rc` lines). */
function newest(versions) {
  const key = (v) => {
    const m = /^(\d+)\.(\d+)\.(\d+)(?:-(.*))?$/.exec(v)
    return m === null ? [0, 0, 0, ''] : [+m[1], +m[2], +m[3], m[4] ?? '~']
  }
  return [...versions].sort((a, b) => {
    const [A, B] = [key(a), key(b)]
    for (let i = 0; i < 3; i += 1) if (A[i] !== B[i]) return A[i] - B[i]
    return String(A[3]).localeCompare(String(B[3]))
  }).at(-1)
}

/** npm's versions for one package, or null when it cannot be read. */
async function versionsOf(name) {
  try {
    const { stdout } = await run('npm', ['view', name, 'versions', '--json'], { timeout: 90_000 })
    const parsed = JSON.parse(stdout)
    return Array.isArray(parsed) ? parsed : [parsed]
  } catch {
    return null
  }
}

/** The harness family: every `@deepseek-ai/*` in the app manifest, against the newest dsh. */
function harnessPins() {
  const manifest = JSON.parse(readFileSync(join(repo, 'apps', 'desktop', 'package.json'), 'utf8'))
  return Object.entries(manifest.dependencies ?? {})
    .filter(([name]) => name.startsWith('@deepseek-ai/'))
    .map(([name, spec]) => [name, spec.replace(/^[\^~=]/, '')])
}

/** Third-party payloads shipped beside the profile: `vendor/<name>/package.json`. */
function vendorPayloads() {
  const root = join(repo, 'vendor')
  if (!existsSync(root)) return []
  return readdirSync(root, { withFileTypes: true })
    .filter((entry) => entry.isDirectory())
    .map((entry) => {
      const file = join(root, entry.name, 'package.json')
      if (!existsSync(file)) return null
      const manifest = JSON.parse(readFileSync(file, 'utf8'))
      return manifest.name === undefined || manifest.version === undefined ? null : [manifest.name, manifest.version]
    })
    .filter((row) => row !== null)
}

/** Run `task` over `items`, eight at a time, preserving order. */
async function mapLimit(items, task) {
  const out = new Array(items.length)
  let next = 0
  await Promise.all(Array.from({ length: Math.min(8, items.length) }, async () => {
    while (next < items.length) {
      const index = next++
      out[index] = await task(items[index], index)
    }
  }))
  return out
}

const pins = harnessPins()
const payloads = vendorPayloads()
console.log(`deps-latest: ${pins.length} harness pins, ${payloads.length} vendored payload(s)`)
if (offline) {
  for (const [name, version] of [...pins, ...payloads]) console.log(`  ${name}  ${version}`)
  process.exit(0)
}

const harness = await versionsOf('@deepseek-ai/dsh')
if (harness === null) {
  console.error('deps-latest: npm is unreachable for @deepseek-ai/dsh; re-run when the network is up')
  process.exit(2)
}
const target = newest(harness)
console.log(`  harness target (newest published): ${target}`)

const harnessRows = await mapLimit(pins, async ([name, version]) => {
  if (version === target) return null
  const published = await versionsOf(name)
  const latest = published === null ? '?' : newest(published)
  return latest === version ? null : `  ${name}  pinned ${version}  →  newest ${latest}`
})

const payloadRows = await mapLimit(payloads, async ([name, version]) => {
  const published = await versionsOf(name)
  if (published === null) return `  ${name}  pinned ${version}  →  not on npm (our own build?)`
  const latest = newest(published)
  return latest === version ? null : `  ${name}  pinned ${version}  →  newest ${latest}`
})

const behind = [...harnessRows, ...payloadRows].filter((row) => row !== null)
if (behind.length === 0) {
  console.log('  every pin is current ✓')
  process.exit(0)
}
console.log('  behind:')
for (const row of behind) console.log(row)
console.log('\ndeps-latest: refresh these before tagging (see "How a release is made" in AGENT.md)')
process.exit(1)
