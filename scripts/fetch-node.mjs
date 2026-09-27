/**
 * fetch-node.mjs — download the official Node runtime the packaged app spawns
 * the harness host with, and verify it against the release's own SHA256SUMS.
 *
 * Why bundle Node at all: the host is `@deepseek-ai/dsh/lib/bin.js` run as a
 * plain child process. It must NOT run on Electron's Node — Electron's ABI does
 * not match the harness's prebuilt native addons (Landlock, node-addon-system,
 * node-addon-require-builtin) — and requiring end users to install Node 22
 * defeats shipping a .dmg/.exe at all. So each platform's build downloads the
 * official runtime for its own platform and arch into
 * apps/desktop/resources/node/, which electron-builder copies into the app.
 *
 * Usage:
 *   node scripts/fetch-node.mjs                     # current platform/arch
 *   node scripts/fetch-node.mjs --platform darwin --arch arm64
 *   NEO_DSH_NODE_VERSION=22.23.1 node scripts/fetch-node.mjs
 *
 * The version is pinned so builds are reproducible; bump it deliberately.
 */
import { createHash } from 'node:crypto'
import { chmodSync, cpSync, createWriteStream, existsSync, mkdirSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs'
import { get } from 'node:https'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { execFileSync } from 'node:child_process'

const REPO = dirname(dirname(fileURLToPath(import.meta.url)))
/** Pinned runtime version. Must satisfy @deepseek-ai/dsh engines (^22.19 || >=24). */
const VERSION = process.env.NEO_DSH_NODE_VERSION ?? '22.23.1'
const OUT = join(REPO, 'apps', 'desktop', 'resources', 'node')
const MIRROR = process.env.NEO_DSH_NODE_MIRROR ?? 'https://nodejs.org/dist'

/** @param argv - process.argv.
 *  @returns parsed `--platform` / `--arch` overrides. */
function parseArgs(argv) {
  const out = {}
  for (let i = 0; i < argv.length; i += 1) {
    if (argv[i] === '--platform') out.platform = argv[++i]
    else if (argv[i] === '--arch') out.arch = argv[++i]
  }
  return out
}

const args = parseArgs(process.argv.slice(2))
const platform = args.platform ?? process.platform
const arch = args.arch ?? process.arch

/** Node's own platform/arch naming for release artifacts.
 *  @returns the `{ file, strip }` pair for this target. */
function artifactFor() {
  const key = `${platform}-${arch}`
  const table = {
    'linux-x64': { file: `node-v${VERSION}-linux-x64.tar.xz`, strip: 1 },
    'linux-arm64': { file: `node-v${VERSION}-linux-arm64.tar.xz`, strip: 1 },
    'darwin-x64': { file: `node-v${VERSION}-darwin-x64.tar.gz`, strip: 1 },
    'darwin-arm64': { file: `node-v${VERSION}-darwin-arm64.tar.gz`, strip: 1 },
    'win32-x64': { file: `node-v${VERSION}-win-x64.zip`, strip: 1 },
    'win32-arm64': { file: `node-v${VERSION}-win-arm64.zip`, strip: 1 },
  }
  const entry = table[key]
  if (entry === undefined) throw new Error(`fetch-node: unsupported target ${key}`)
  return entry
}

/** @param url - URL to fetch.
 *  @returns the response body as a Buffer. */
function fetchBuffer(url) {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        fetchBuffer(res.headers.location).then(resolve, reject)
        return
      }
      if (res.statusCode !== 200) {
        reject(new Error(`fetch-node: GET ${url} → HTTP ${res.statusCode}`))
        res.resume()
        return
      }
      const chunks = []
      res.on('data', (c) => chunks.push(c))
      res.on('end', () => resolve(Buffer.concat(chunks)))
    }).on('error', reject)
  })
}

/** @param url - URL to stream to disk.
 *  @param dest - destination path. */
function download(url, dest) {
  return new Promise((resolve, reject) => {
    get(url, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        download(res.headers.location, dest).then(resolve, reject)
        return
      }
      if (res.statusCode !== 200) {
        reject(new Error(`fetch-node: GET ${url} → HTTP ${res.statusCode}`))
        res.resume()
        return
      }
      const file = createWriteStream(dest)
      res.pipe(file)
      file.on('finish', () => file.close(() => resolve()))
      file.on('error', reject)
    }).on('error', reject)
  })
}

const { file } = artifactFor()
// Stage OUTSIDE the destination: the copy below replaces OUT wholesale, and a
// staging directory inside it would be deleted by that very step.
const tmp = mkdtempSync(join(tmpdir(), 'dsh-node-'))

const sums = (await fetchBuffer(`${MIRROR}/v${VERSION}/SHASUMS256.txt`)).toString('utf8')
const expected = sums.split('\n').map((l) => l.trim().split(/\s+/)).find(([, name]) => name === file)?.[0]
if (expected === undefined) throw new Error(`fetch-node: ${file} is not listed in SHASUMS256.txt for v${VERSION}`)

const tarball = join(tmp, file)
console.log(`fetch-node: v${VERSION} ${platform}-${arch} → ${file}`)
await download(`${MIRROR}/v${VERSION}/${file}`, tarball)

const actual = createHash('sha256').update(readFileSync(tarball)).digest('hex')
if (actual !== expected) {
  rmSync(tmp, { recursive: true, force: true })
  throw new Error(`fetch-node: checksum mismatch for ${file}\n  expected ${expected}\n  actual   ${actual}`)
}
console.log(`fetch-node: sha256 verified (${expected.slice(0, 16)}…)`)

// bsdtar ships with Windows 10+ and reads both .zip and .tar.*; GNU/BSD tar
// covers Linux and macOS. One code path, no extraction dependency.
execFileSync('tar', ['-xf', tarball, '-C', tmp], { stdio: 'inherit' })
const listing = readdirSync(tmp)
const extracted = listing.find((n) => statSync(join(tmp, n), { throwIfNoEntry: false })?.isDirectory() === true)
if (extracted === undefined) {
  throw new Error(`fetch-node: extracted directory not found; ${tmp} holds: ${listing.join(', ')}`)
}
console.log(`fetch-node: extracted ${extracted}`)
const root = join(tmp, extracted)

// Take only the interpreter and the licence. Copying the whole release drags in
// npm/npx/corepack, whose `bin/` entries are absolute symlinks into the release
// tree — cpSync copies those links rather than their targets, so they end up
// dangling the moment the staging directory goes away. electron-builder then
// fails packaging with `./resources/node/bin/npm : errno=2`. The host spawns
// `bin/node` (or `node.exe`) and nothing else, so nothing else ships.
rmSync(OUT, { recursive: true, force: true })
const nodeBin = platform === 'win32' ? join(OUT, 'node.exe') : join(OUT, 'bin', 'node')
mkdirSync(dirname(nodeBin), { recursive: true })
cpSync(platform === 'win32' ? join(root, 'node.exe') : join(root, 'bin', 'node'), nodeBin, { dereference: true })
if (existsSync(join(root, 'LICENSE'))) cpSync(join(root, 'LICENSE'), join(OUT, 'LICENSE'))
writeFileSync(join(OUT, 'SOURCE.txt'), [
  `node v${VERSION} for ${platform}-${arch}`,
  `from ${MIRROR}/v${VERSION}/${file}`,
  `sha256 ${expected}`,
  'Only the interpreter and the licence are kept: the harness spawns bin/node and',
  'never npm/npx/corepack, and the release tree\'s symlinks do not survive copying.',
  '',
].join('\n'))
rmSync(tmp, { recursive: true, force: true })

if (!existsSync(nodeBin)) throw new Error(`fetch-node: ${nodeBin} missing after extraction`)
if (platform !== 'win32') chmodSync(nodeBin, 0o755)

// A dangling link here would only surface later, inside electron-builder's AppImage
// scan, as an unhelpful `errno=2`. Assert the invariant now, where it is cheap.
const links = []
const walk = (dir) => {
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const path = join(dir, entry.name)
    if (entry.isSymbolicLink()) links.push(path)
    else if (entry.isDirectory()) walk(path)
  }
}
walk(OUT)
if (links.length > 0) throw new Error(`fetch-node: runtime contains symlinks: ${links.join(', ')}`)

console.log(`fetch-node: ready → ${nodeBin}`)
console.log(`fetch-node: ${execFileSync(nodeBin, ['--version']).toString().trim()}`)
