#!/usr/bin/env node
// Boot the host that actually ships, from the packaged tree, with a throwaway
// home — and require every plugin to activate.
//
// The desktop smoke test only proves a window renders; 0.2.6 shipped with "4
// entries did not activate" (the chat UI plus three memory plugins) and every
// check still passed. v0.2.8 shipped without @deepseek-ai/dsh-app-boot at all.
// This runs the packaged host headlessly, so a tree that cannot load its own
// plugins fails here.
//
//   node scripts/smoke-packaged.mjs [appOutDir]
//   (default: apps/desktop/release/linux-unpacked)
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { createServer } from 'node:net'
import { tmpdir } from 'node:os'
import { join, resolve } from 'node:path'

const appOutDir = resolve(process.argv[2] ?? 'apps/desktop/release/linux-unpacked')
const resourcesDir = existsSync(join(appOutDir, 'Contents', 'Resources'))
  ? join(appOutDir, 'Contents', 'Resources')
  : join(appOutDir, 'resources')
const node = existsSync(join(resourcesDir, 'node', 'node.exe'))
  ? join(resourcesDir, 'node', 'node.exe')
  : join(resourcesDir, 'node', 'bin', 'node')
const appDir = join(resourcesDir, 'app')
const bin = join(appDir, 'node_modules', '@deepseek-ai', 'dsh', 'lib', 'bin.js')

for (const [what, p] of [['packaged host bin', bin], ['bundled Node', node]]) {
  if (!existsSync(p)) {
    console.error(`✗ smoke-packaged: missing ${what}: ${p}`)
    process.exit(1)
  }
}

const port = await new Promise((ok, fail) => {
  const srv = createServer()
  srv.once('error', fail)
  srv.listen(0, '127.0.0.1', () => {
    const { port } = srv.address()
    srv.close(() => ok(port))
  })
})

const home = mkdtempSync(join(tmpdir(), 'neo-dsh-smoke-'))
const child = spawn(node, [bin, 'web', '--no-open', '--port', String(port)], {
  cwd: appDir,
  env: { ...process.env, DSH_HOME: home },
  stdio: ['ignore', 'pipe', 'pipe'],
})
let log = ''
child.stdout.on('data', (d) => (log += d))
child.stderr.on('data', (d) => (log += d))

const deadline = Date.now() + 90_000
const ready = () => /dsh web: http/.test(log)
while (!ready() && child.exitCode === null && Date.now() < deadline) {
  await new Promise((r) => setTimeout(r, 250))
}

const started = ready()
child.kill('SIGTERM')
await Promise.race([
  new Promise((r) => child.once('close', r)),
  new Promise((r) => setTimeout(r, 10_000)).then(() => child.kill('SIGKILL')),
])
rmSync(home, { recursive: true, force: true })

const broken = log
  .split('\n')
  .filter((l) => /did not activate|import failed|Failed to load plugins/i.test(l))

if (!started || broken.length > 0) {
  console.error(`✗ smoke-packaged: ${started ? 'boot log is not clean' : 'the host never became ready'}`)
  for (const line of broken.slice(0, 12)) console.error('  ' + line.trim())
  if (broken.length === 0) console.error(log.split('\n').slice(-15).join('\n'))
  process.exit(1)
}
console.log(`✓ smoke-packaged: every plugin activated (${resolve(appOutDir)})`)
