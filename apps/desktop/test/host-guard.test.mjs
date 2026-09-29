/**
 * Unit tests for the port guard, plus one real process test for the watchdog.
 * No Electron.
 *
 *   node apps/desktop/test/host-guard.test.mjs
 */
import { spawn } from 'node:child_process'
import { existsSync, mkdtempSync, rmSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { fileURLToPath } from 'node:url'
import {
  HOST_MARKER, classifyProbe, clearHostRecord, findPortHolder, isOrphan, looksLikeHost,
  parseLsofHolders, parseProcStat, parsePs, parseSsHolders, parseWinNetstat, portAction, probePort,
  readHolder, readHostRecord, waitForFree, writeHostRecord,
} from '../src/host-guard.mjs'

let failures = 0
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name} → ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`)
}

// ---- what is on the port -------------------------------------------------
check('连接被拒绝 → 端口是空的', classifyProbe({ error: 'ECONNREFUSED connect ECONNREFUSED 127.0.0.1:3081' }), 'free')
check('超时 → 有东西在，但不是正常 web 服务', classifyProbe({ error: 'TimeoutError operation timed out' }), 'busy')
check('401 + harness 的提示语 → 这是 dsh 宿主', classifyProbe({ status: 401, body: 'dsh web authentication required; reopen the URL printed by dsh web.' }), 'dsh-host')
check('401 但提示语不认识 → 别的东西', classifyProbe({ status: 401, body: 'nginx' }), 'busy')
check('200 → 别的 HTTP 服务', classifyProbe({ status: 200, body: 'hi' }), 'busy')
check('没有响应信息 → 空的', classifyProbe({}), 'free')

// ---- is this process our host? -------------------------------------------
const hostLine = `/home/u/.local/opt/neo-dsh/resources/node/bin/node /home/u/.local/opt/neo-dsh/resources/app/node_modules/@deepseek-ai/dsh/lib/bin.js web --no-open --port 3081`
check('真正的宿主命令行 → 认得出来', looksLikeHost(hostLine, { port: 3081, bin: '@deepseek-ai/dsh/lib/bin.js' }), true)
check('端口不一样 → 不是这个端口的宿主', looksLikeHost(hostLine, { port: 3199, bin: '@deepseek-ai/dsh/lib/bin.js' }), false)
check('TUI（没有 web --no-open）→ 不是宿主', looksLikeHost('/usr/bin/node .../lib/bin.js --profile dsh-tui', { port: 3081, bin: 'lib/bin.js' }), false)
check('别的程序的 web 服务 → 不是宿主', looksLikeHost('/usr/bin/python -m http.server --port 3081', { port: 3081, bin: 'lib/bin.js' }), false)
check('别的安装位置 → 还是 dsh 宿主（之后由标记区分是谁的）', looksLikeHost('/other/node /other/dsh/lib/bin.js web --no-open --port 3081', { port: 3081, bin: '/home/u/.local/opt/neo-dsh/resources/app/node_modules/@deepseek-ai/dsh/lib/bin.js' }), true)
check('相对路径启动的宿主 → 也算', looksLikeHost('apps/desktop/resources/node/bin/node apps/desktop/node_modules/@deepseek-ai/dsh/lib/bin.js web --no-open --port 3199', { port: 3199, bin: '/abs/apps/desktop/node_modules/@deepseek-ai/dsh/lib/bin.js' }), true)
check('完全无关的程序 → 不是宿主', looksLikeHost('/usr/bin/node /opt/other/server.js web --no-open --port 3081', { port: 3081, bin: '/home/u/.local/opt/neo-dsh/resources/app/node_modules/@deepseek-ai/dsh/lib/bin.js' }), false)

// ---- the decision ---------------------------------------------------------
const ours = { pid: 4242, cmdline: hostLine, ppid: 1, host: true, marker: true }
check('端口空着 → 直接启动', portAction({ probe: 'free' }).action, 'start')
check('我们自己的孤儿宿主 → 回收', portAction({ probe: 'dsh-host', holder: ours, record: { pid: 4242, parentPid: 900 }, orphan: true }), { action: 'reclaim', reason: 'our host outlived its window' })
check('标记法（没有记录文件也能认）→ 回收', portAction({ probe: 'dsh-host', holder: ours, record: {} }).action, 'reclaim')
check('我们的宿主但 shell 还活着 → 问用户', portAction({ probe: 'dsh-host', holder: { ...ours, ppid: 900 }, record: { pid: 4242, parentPid: 900 }, orphan: false }).action, 'ask')
check('别人的 dsh 宿主 → 问用户（不擅自杀）', portAction({ probe: 'dsh-host', holder: { ...ours, marker: false }, record: {} }).action, 'ask')
check('别的程序占着端口 → 问用户', portAction({ probe: 'busy', holder: { pid: 7, host: false, marker: false, ppid: 900 }, record: {}, orphan: false }).action, 'ask')
check('认不出占用者 → 问用户', portAction({ probe: 'busy', holder: { pid: null } }).action, 'ask')

// ---- is it an orphan? ----------------------------------------------------
check('ppid=1 → 孤儿', isOrphan({ holder: { ppid: 1 }, record: {} }), true)
check('被 subreaper 收养（父 pid 不是 1，但已经不是启动它的那个 shell）→ 孤儿', isOrphan({
  holder: { ppid: 1318 },
  record: { pid: 4242, parentPid: 36282 },
  exists: () => true,
}), true)
check('还挂在启动它的 shell 上 → 不是孤儿', isOrphan({
  holder: { ppid: 36282 },
  record: { pid: 4242, parentPid: 36282 },
}), false)
check('没有记录文件、父进程还在 → 保守当作"别人挂着的"', isOrphan({ holder: { ppid: 36282 }, record: {}, exists: () => true }), false)
check('父进程查不到 → 孤儿', isOrphan({ holder: { ppid: 36282 }, record: {}, exists: () => false }), true)
check('拿不到 ppid → 不知道', isOrphan({ holder: {}, record: {} }), null)

// ---- reading the OS ------------------------------------------------------
check('ss 输出 → pid', parseSsHolders('LISTEN 0 511 127.0.0.1:3081 0.0.0.0:* users:(("node",pid=36327,fd=39))'), [36327])
check('ss 输出里有多个 pid → 全都要', parseSsHolders('users:(("node",pid=1,fd=1),("node",pid=2,fd=2))'), [1, 2])
check('lsof 输出 → pid 列表', parseLsofHolders('36327\n\n'), [36327])
check('netstat 输出 → pid', parseWinNetstat('  TCP    127.0.0.1:3081    0.0.0.0:0    LISTENING    4242\n', 3081), [4242])
check('/proc/<pid>/stat → ppid', parseProcStat('4242 (node) S 1 4242 4242 0 -1 4194560'), { ppid: 1 })
check('/proc/<pid>/stat 里有括号也不怕', parseProcStat('4242 (wei (rd) name) S 900 4242'), { ppid: 900 })
check('ps 输出 → ppid + 命令行', parsePs('  900 /usr/bin/node /a/b web --no-open --port 3081'), { ppid: 900, cmdline: '/usr/bin/node /a/b web --no-open --port 3081' })
check('ps 没有输出 → 空', parsePs(''), { ppid: null, cmdline: '' })

const read = (file) => {
  if (file === '/proc/4242/stat') return '4242 (node) S 1 0 0'
  if (file === '/proc/4242/cmdline') return `${hostLine.replace(/ /g, '\0')}\0`
  if (file === '/proc/4242/environ') return `HOME=/home/u\0${HOST_MARKER}=1\0`
  throw Object.assign(new Error('ENOENT'), { code: 'ENOENT' })
}
const holder = readHolder({ platform: 'linux', pid: 4242, port: 3081, bin: 'lib/bin.js', read, exists: () => false })
check('Linux：读到 ppid=1，父进程不存在', [holder.ppid, holder.parentAlive], [1, false])
check('Linux：ppid=1 就是孤儿', isOrphan({ holder, record: {}, exists: () => false }), true)
check('Linux：命令行与标记都读到了', [holder.host, holder.marker], [true, true])

const byPs = readHolder({
  platform: 'darwin',
  pid: 7,
  port: 3081,
  bin: 'lib/bin.js',
  run: () => '  1 /usr/bin/node /a/lib/bin.js web --no-open --port 3081',
})
check('macOS：用 ps 读，ppid=1 → 孤儿', [byPs.ppid, byPs.host, isOrphan({ holder: byPs, record: {} })], [1, true, true])

check('找占用者：把命令交给运行器', findPortHolder({ platform: 'linux', port: 3081, run: (cmd) => {
  if (!cmd.includes('sport = :3081')) throw new Error('wrong command')
  return 'LISTEN 0 511 127.0.0.1:3081 0.0.0.0:* users:(("node",pid=99,fd=1))'
} }).pid, 99)

// ---- the record file -----------------------------------------------------
const home = mkdtempSync(join(tmpdir(), 'neo-dsh-guard-'))
check('没有记录 → 空对象', readHostRecord(home), {})
writeHostRecord(home, { pid: 4242, port: 3081, parentPid: 1, startedAt: 'now' })
check('记录写得进去也读得回来', readHostRecord(home).pid, 4242)
clearHostRecord(home)
check('记录删得掉', readHostRecord(home), {})

// ---- waiting for the port to free up -------------------------------------
const answers = [{ status: 401, body: 'dsh web authentication required' }, { error: 'ECONNREFUSED' }]
let calls = 0
const freed = await waitForFree({
  probe: () => answers[Math.min(calls++, answers.length - 1)],
  sleep: async () => {},
  timeoutMs: 1000,
})
check('等到端口空出来 → true', [freed, calls], [true, 2])
check('一直不空 → false（不死等）', await waitForFree({
  probe: () => ({ status: 401, body: 'dsh web authentication required' }),
  sleep: async () => {},
  timeoutMs: 1,
}), false)

// ---- the watchdog, with real processes -----------------------------------
if (process.platform !== 'win32') {
  const watchdog = fileURLToPath(new URL('../src/host-watchdog.cjs', import.meta.url))
  const alive = (pid) => {
    try {
      process.kill(pid, 0)
      return true
    } catch {
      return false
    }
  }
  // The child is told which pid is its shell, exactly like the real spawn does. Here the
  // shell is a wrapper script, so it exports its own pid before starting the child.
  const wrapper = spawn('/bin/sh', [
    '-c',
    `export DSH_HOST_PARENT_PID=$$; node --require ${watchdog} -e "setInterval(() => {}, 1000)" & echo "pid=$!"; wait`,
  ], { env: { ...process.env, DSH_HOST_WATCHDOG_MS: '100' }, stdio: ['ignore', 'pipe', 'pipe'] })

  const pid = await new Promise((resolve) => {
    let buffered = ''
    wrapper.stdout.on('data', (chunk) => {
      buffered += chunk.toString()
      const match = /pid=(\d+)/.exec(buffered)
      if (match) resolve(Number(match[1]))
    })
    setTimeout(() => resolve(null), 5000)
  })
  check('watchdog：子进程起来了', typeof pid === 'number' && alive(pid), true)

  // Kill the shell *without* letting it clean up, exactly like the real case.
  wrapper.kill('SIGKILL')
  const deadline = Date.now() + 6000
  while (alive(pid) && Date.now() < deadline) await new Promise((resolve) => setTimeout(resolve, 100))
  check('watchdog：父进程被 SIGKILL 后，宿主自己退出', alive(pid), false)
  try {
    process.kill(pid, 'SIGKILL')
  } catch {
    // Already gone, which is the point.
  }
} else {
  console.log('skip  watchdog 进程测试（Windows 没有 /bin/sh）')
}

rmSync(home, { recursive: true, force: true })
console.log(failures === 0 ? '\nall host-guard checks passed' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
