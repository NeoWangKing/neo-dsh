/**
 * Guarding the host's port.
 *
 * The window talks to exactly one harness host, on a fixed port. If a host outlives
 * its shell — and a shell that was SIGKILLed gets no chance to clean up after itself —
 * that port stays taken, and every later launch fails with "the host exited before it
 * was ready". This module answers the question the shell has to ask before it starts a
 * host: who holds the port, and is it ours to take back?
 *
 * Killing another program's process is not this app's business, so reclaiming happens
 * only for a host that can be proven to be ours and whose shell is gone; anything else
 * becomes a question for the user.
 *
 * No Electron, and no process lookups at import time: the shell injects the probe, the
 * filesystem seams and a command runner, so every decision here is unit-tested.
 *
 * @module host-guard
 */

import { existsSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'

/** Record of the host this shell started, kept in $DSH_HOME. */
export const HOST_RECORD = 'desktop-host.json'

/** Environment marker set on the host process, so a later launch recognises it. */
export const HOST_MARKER = 'DSH_DESKTOP_HOST'

/** Path of the host record inside a harness home. */
export function hostRecordPath(home) {
  return join(home, HOST_RECORD)
}

/**
 * Read the host record.
 * @param home - the harness home.
 * @param options - injectable `read`/`exists`.
 * @returns the record, or `{}` when it is missing or unreadable.
 */
export function readHostRecord(home, { read = readFileSync, exists = existsSync } = {}) {
  const file = hostRecordPath(home)
  if (!exists(file)) return {}
  try {
    const parsed = JSON.parse(read(file, 'utf8'))
    return parsed !== null && typeof parsed === 'object' && !Array.isArray(parsed) ? parsed : {}
  } catch {
    return {}
  }
}

/**
 * Write the host record.
 * @param home - the harness home.
 * @param record - `{pid, port, startedAt, parentPid}`.
 * @param options - injectable `write`/`mkdir`.
 * @returns the record as written.
 */
export function writeHostRecord(home, record, { write = writeFileSync, mkdir = mkdirSync } = {}) {
  const file = hostRecordPath(home)
  mkdir(dirname(file), { recursive: true })
  write(file, `${JSON.stringify(record, null, 2)}\n`)
  return record
}

/**
 * Remove the host record, best effort.
 * @param home - the harness home.
 * @param options - injectable `remove`.
 */
export function clearHostRecord(home, { remove = rmSync } = {}) {
  try {
    remove(hostRecordPath(home), { force: true })
  } catch {
    // A leftover record only costs one identification attempt.
  }
}

/**
 * What answered on the port.
 * @param result - `{status, body}` from the probe, or `{error}` when it failed.
 * @returns `free` (nothing there), `dsh-host` (a harness host) or `busy` (something else).
 */
export function classifyProbe(result = {}) {
  if (result.error !== undefined && result.error !== null) {
    // Nothing listening is the answer we want. A timeout, a reset or any other failure
    // means something is there but is not answering like a web server.
    return /ECONNREFUSED|ENOTFOUND|EADDRNOTAVAIL|EHOSTUNREACH/i.test(String(result.error)) ? 'free' : 'busy'
  }
  const status = Number(result.status ?? 0)
  if (status === 0) return 'free'
  // A harness host answers an unauthenticated request with 401 and this sentence.
  if (status === 401 && /dsh web authentication required/i.test(String(result.body ?? ''))) return 'dsh-host'
  return 'busy'
}

/**
 * Whether a command line is a harness host serving this port.
 * @param cmdline - the process's command line, spaces or NULs already collapsed.
 * @param options - `port` to match, and `bin` (the harness entry this app spawns).
 * @returns true when the command line looks like a host for this port.
 */
export function looksLikeHost(cmdline, { port, bin } = {}) {
  const line = String(cmdline ?? '')
  if (!/\bweb\b/.test(line)) return false
  if (!line.includes('--no-open')) return false
  if (port !== undefined && port !== null && !new RegExp(`--port[= ]\\s*${port}(\\s|$)`).test(line)) return false
  if (bin !== undefined && bin !== null && bin !== '') {
    // The entry file is what identifies a harness, wherever it is installed or however
    // it was invoked (an absolute path from here, a relative one from a shell, another
    // dsh install). Whether it is *ours* is a separate question, answered by the record
    // file and the marker.
    const name = basename(bin)
    if (name !== '' && !line.includes(name) && !line.includes(bin)) return false
  }
  return true
}

/**
 * Whether the shell that started this host is gone.
 *
 * Not simply "is the parent pid 1": a process gains orphans when the shell dies, and on
 * Linux that can be a subreaper rather than init, so the parent pid changes to something
 * that very much exists. The reliable signal is the record: the host's current parent
 * must still be the shell that this app started it from, otherwise it has been
 * reparented and its shell is gone.
 *
 * @param options - `holder` (from {@link readHolder}), `record` (from {@link readHostRecord}),
 *   injectable `exists`.
 * @returns true (orphaned), false (its shell is still there) or null (unknown).
 */
export function isOrphan({ holder, record, exists = existsSync } = {}) {
  const ppid = holder?.ppid ?? null
  if (ppid === null) return null
  if (ppid === 1) return true
  const declared = record?.parentPid
  if (typeof declared === 'number' && Number.isInteger(declared) && declared > 0) {
    // The pid it was started from is known: still being that process's child means the
    // shell is alive, anything else means we were reparented.
    return ppid !== declared
  }
  // No record to compare against. Only a reparent to init is provable; the rest is
  // treated as "someone else's, still attached" so it gets asked about rather than killed.
  return ppid !== 1 && exists(`/proc/${ppid}`) ? false : true
}

/**
 * Decide what to do about the current holder of the port.
 * @param options - `probe` (from {@link classifyProbe}), `holder` (from {@link readHolder}),
 *   `record` (from {@link readHostRecord}), and an optional precomputed `orphan`.
 * @returns `{action, reason}` with action `start`, `reclaim` or `ask`.
 */
export function portAction({ probe, holder, record, orphan, exists = existsSync } = {}) {
  if (probe === 'free') return { action: 'start', reason: 'port is free' }
  const pid = holder?.pid ?? null
  if (pid === null) return { action: 'ask', reason: 'the holder could not be identified' }

  const host = holder?.host === true
  const ours = holder?.marker === true || record?.pid === pid
  const orphaned = orphan ?? isOrphan({ holder, record, exists })
  if (host && ours && orphaned === true) {
    return { action: 'reclaim', reason: 'our host outlived its window' }
  }
  if (host && ours) return { action: 'ask', reason: 'our host still has a shell attached' }
  if (host) return { action: 'ask', reason: 'another dsh host holds the port' }
  return { action: 'ask', reason: 'another program holds the port' }
}

/** Parse `ss -ltnp` output for the pids listening on the port. */
export function parseSsHolders(output) {
  const pids = []
  for (const match of String(output ?? '').matchAll(/pid=(\d+)/g)) pids.push(Number(match[1]))
  return [...new Set(pids)]
}

/** Parse `lsof -t` output: one pid per line. */
export function parseLsofHolders(output) {
  const pids = String(output ?? '')
    .split('\n')
    .map((line) => Number(line.trim()))
    .filter((pid) => Number.isInteger(pid) && pid > 0)
  return [...new Set(pids)]
}

/** Parse `netstat -ano` on Windows for the pid listening on `port`. */
export function parseWinNetstat(output, port) {
  const pids = []
  for (const line of String(output ?? '').split('\n')) {
    if (!/LISTENING/i.test(line)) continue
    if (!new RegExp(`[:.]${port}\\s`).test(line)) continue
    const columns = line.trim().split(/\s+/)
    const pid = Number(columns[columns.length - 1])
    if (Number.isInteger(pid) && pid > 0) pids.push(pid)
  }
  return [...new Set(pids)]
}

/** Parse `/proc/<pid>/stat`: everything after the command name ends with state, ppid, … */
export function parseProcStat(stat) {
  const text = String(stat ?? '')
  const close = text.lastIndexOf(')')
  if (close === -1) return { ppid: null }
  const fields = text.slice(close + 1).trim().split(/\s+/)
  const ppid = Number(fields[1])
  return { ppid: Number.isInteger(ppid) ? ppid : null }
}

/** Parse `ps -o ppid=,command=`: the first column is the parent, the rest the command. */
export function parsePs(output) {
  const text = String(output ?? '').trim()
  if (text === '') return { ppid: null, cmdline: '' }
  const [first, ...rest] = text.split(/\s+/)
  const ppid = Number(first)
  return { ppid: Number.isInteger(ppid) ? ppid : null, cmdline: rest.join(' ') }
}

/**
 * Ask the OS which process listens on a port.
 * @param options - `platform`, `port`, and `run` (command → stdout).
 * @returns `{pid, pids?, error?}`.
 */
export function findPortHolder({ platform, port, run }) {
  const command =
    platform === 'darwin'
      ? `lsof -nP -iTCP:${port} -sTCP:LISTEN -t`
      : platform === 'win32'
        ? 'netstat -ano -p tcp'
        : `ss -ltnpH "sport = :${port}"`
  let output = ''
  try {
    output = String(run?.(command) ?? '')
  } catch (error) {
    return { pid: null, error: String(error?.message ?? error) }
  }
  const pids =
    platform === 'darwin'
      ? parseLsofHolders(output)
      : platform === 'win32'
        ? parseWinNetstat(output, port)
        : parseSsHolders(output)
  return { pid: pids[0] ?? null, pids }
}

/**
 * What is known about a process: its parent, its command line, whether it is a host for
 * this port, and whether it carries this app's marker.
 * @param options - `platform`, `pid`, `port`, `bin`, injectable `read`/`exists`/`run`.
 * @returns the holder description.
 */
export function readHolder({ platform, pid, port, bin, read = readFileSync, exists = existsSync, run }) {
  if (pid === null || pid === undefined) {
    return { pid: null, cmdline: '', ppid: null, parentAlive: null, host: false, marker: false }
  }
  if (platform === 'linux') {
    let stat = ''
    let cmdline = ''
    let environ = ''
    try {
      stat = read(`/proc/${pid}/stat`, 'utf8')
    } catch {
      // Gone between the port lookup and now.
    }
    try {
      cmdline = read(`/proc/${pid}/cmdline`, 'utf8').replace(/\0+/g, ' ').trim()
    } catch {
      // Not readable, or gone.
    }
    try {
      environ = read(`/proc/${pid}/environ`, 'utf8').replace(/\0+/g, '\n')
    } catch {
      // Another user's process; the marker is simply unknown.
    }
    const line = cmdline !== '' ? cmdline : String(run?.(`ps -o command= -p ${pid}`) ?? '').trim()
    const ppid = parseProcStat(stat).ppid
    return {
      pid,
      cmdline: line,
      ppid,
      // Whether the process it has *now* exists; whether that process is still the shell
      // it was started from is a separate question ({@link isOrphan}).
      parentAlive: ppid === null ? null : exists(`/proc/${ppid}`),
      host: looksLikeHost(line, { port, bin }),
      marker: environ.split('\n').includes(`${HOST_MARKER}=1`),
    }
  }

  const { ppid, cmdline } = parsePs(run?.(`ps -o ppid=,command= -p ${pid}`))
  return {
    pid,
    cmdline,
    ppid,
    parentAlive: ppid === null ? null : ppid !== 1,
    host: looksLikeHost(cmdline, { port, bin }),
    marker: false,
  }
}

/**
 * Probe the port over HTTP. A harness host answers 401 with a sentence that names it.
 * @param options - `port`, `fetchImpl` (defaults to global fetch), `timeoutMs`.
 * @returns `{status, body}` or `{error}`.
 */
export async function probePort({ port, fetchImpl = globalThis.fetch, timeoutMs = 2000 } = {}) {
  const controller = typeof AbortController === 'function' ? new AbortController() : undefined
  const timer = controller === undefined ? undefined : setTimeout(() => controller.abort(), timeoutMs)
  try {
    const response = await fetchImpl(`http://127.0.0.1:${port}/`, {
      signal: controller?.signal,
      redirect: 'manual',
    })
    let body = ''
    try {
      body = await response.text()
    } catch {
      // The body is only a hint; a status is enough to know something is there.
    }
    return { status: response.status, body }
  } catch (error) {
    const code = error?.cause?.code ?? error?.code ?? ''
    return { error: `${code} ${String(error?.message ?? error)}`.trim() }
  } finally {
    if (timer !== undefined) clearTimeout(timer)
  }
}

/**
 * Wait for the port to stop answering.
 * @param options - `probe` (returns a {@link probePort} result), `timeoutMs`, `intervalMs`, `sleep`.
 * @returns true when the port is free before the deadline.
 */
export async function waitForFree({
  probe,
  timeoutMs = 10_000,
  intervalMs = 250,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = () => Date.now(),
}) {
  const deadline = now() + timeoutMs
  for (;;) {
    if (classifyProbe(await probe()) === 'free') return true
    if (now() >= deadline) return false
    await sleep(intervalMs)
  }
}
