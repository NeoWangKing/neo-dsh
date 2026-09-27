/**
 * probe-host — verify the host plumbing without Electron.
 *
 * Replicates main.mjs's spawn + readiness-parse + shutdown sequence, then
 * fetches the served index to confirm the Web UI answers. Run after
 * `pnpm install`/`npm install`: `pnpm probe`. Exits 0 only when the whole
 * chain (spawn → ready URL → HTTP 200 → clean SIGTERM shutdown) succeeds.
 */

import { spawn } from 'node:child_process'
import { dirname, join } from 'node:path'
import { createRequire } from 'node:module'
import { fileURLToPath } from 'node:url'

const require = createRequire(import.meta.url)
const projectRoot = dirname(dirname(fileURLToPath(import.meta.url)))

// Since 0.1.2-rc.1 the local URL carries a one-time `?token=` auth query.
const READY_LINE = /^dsh web: (http:\/\/127\.0\.0\.1:\d+[^\s]*)/
const TIMEOUT_MS = 60_000

function resolveDshBin() {
  const manifest = require.resolve('@deepseek-ai/dsh/package.json')
  return join(dirname(manifest), 'lib', 'bin.js')
}

const node = process.env.DSH_NODE || 'node'
const bin = resolveDshBin()
console.log(`spawning: ${node} ${bin} web --no-open --port 0`)

const child = spawn(node, [bin, 'web', '--no-open', '--port', '0'], {
  env: process.env,
  stdio: ['ignore', 'pipe', 'pipe'],
})

let stdoutBuffer = ''
let stderr = ''
let settled = false
let timer

const ready = new Promise((resolve, reject) => {
  timer = setTimeout(() => {
    if (!settled) {
      settled = true
      reject(new Error(`timed out after ${TIMEOUT_MS}ms waiting for the readiness line\n${stderr}`))
    }
  }, TIMEOUT_MS)

  child.stdout.on('data', (chunk) => {
    process.stdout.write(`[host] ${chunk}`)
    stdoutBuffer += chunk.toString()
    const lines = stdoutBuffer.split('\n')
    for (let i = 0; i < lines.length - 1; i += 1) {
      const match = READY_LINE.exec(lines[i])
      if (match?.[1] !== undefined && !settled) {
        settled = true
        clearTimeout(timer)
        resolve(match[1])
      }
    }
    stdoutBuffer = lines[lines.length - 1]
  })
  child.stderr.on('data', (chunk) => {
    stderr += chunk.toString()
    process.stderr.write(`[host] ${chunk}`)
  })
  child.on('error', (error) => {
    if (!settled) {
      settled = true
      clearTimeout(timer)
      reject(new Error(`failed to spawn dsh: ${error.message}`))
    }
  })
  child.on('exit', (code, signal) => {
    if (!settled) {
      settled = true
      clearTimeout(timer)
      reject(new Error(`dsh exited before ready: code=${code} signal=${signal}\n${stderr}`))
    }
  })
})

/**
 * Fetch the served index the way a browser reaches it. Since 0.1.2-rc.1 the
 * readiness URL carries a one-time `?token=` query: that URL answers a 303 with
 * the session cookie, and only a request carrying that cookie reaches the clean
 * root page — a bare GET of the token URL itself answers 401.
 * @param readyUrl - the URL printed by the host's readiness line.
 * @returns the index response, its body, and the URL actually fetched.
 */
async function fetchIndex(readyUrl) {
  const rootUrl = new URL(readyUrl)
  rootUrl.search = ''
  if (!new URL(readyUrl).searchParams.has('token')) {
    const response = await fetch(rootUrl, { signal: AbortSignal.timeout(10_000) })
    return { response, body: await response.text(), url: rootUrl.href }
  }
  const handoff = await fetch(readyUrl, { redirect: 'manual', signal: AbortSignal.timeout(10_000) })
  const setCookies = handoff.headers.getSetCookie?.() ?? []
  const cookie = setCookies.map((entry) => entry.split(';')[0]).join('; ')
  const response = await fetch(rootUrl, {
    headers: cookie === '' ? {} : { cookie },
    signal: AbortSignal.timeout(10_000),
  })
  return { response, body: await response.text(), url: rootUrl.href }
}

try {
  const url = await ready
  console.log(`ready: ${url}`)

  const { response, body, url: fetched } = await fetchIndex(url)
  if (response.status !== 200) throw new Error(`GET ${fetched} returned ${response.status}`)
  if (!body.includes('__DSH_BOOT__') && !body.includes('<div id=')) {
    console.warn('warning: index.html does not look like the dsh SPA shell')
  }
  console.log(`GET ${fetched} -> ${response.status}, ${body.length} bytes`)

  console.log('shutting down host (SIGTERM)...')
  const exited = new Promise((resolve) => child.once('exit', (code, signal) => resolve({ code, signal })))
  child.kill('SIGTERM')
  const result = await Promise.race([
    exited,
    new Promise((resolve) => setTimeout(() => resolve({ timedOut: true }), 10_000)),
  ])
  if (result.timedOut) {
    child.kill('SIGKILL')
    throw new Error('host did not exit within 10s of SIGTERM')
  }
  console.log(`host exited cleanly: code=${result.code} signal=${result.signal}`)
  console.log('probe OK')
  process.exit(0)
} catch (error) {
  console.error(`probe FAILED: ${error.message ?? error}`)
  child.kill('SIGKILL')
  process.exit(1)
}
