/**
 * Tests for the harness patch script. It edits real vendored packages, so these run it
 * against throwaway trees with the same shape instead: a client bundle with the glyph
 * table in it, alone in a scope directory.
 *
 * The cases that matter are the ones that already went wrong once — an upgrade that left a
 * second entry behind, and an anchor that quietly stopped matching.
 *
 *   node scripts/test/patch-harness.test.mjs
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(dirname(fileURLToPath(import.meta.url))))
const script = join(root, 'scripts', 'patch-harness.mjs')

let failures = 0
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'ok  ' : 'fail'}  ${name} → ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`)
}

/** A bundle carrying only what the patch looks for, in the loader wrapper the real one uses. */
function bundleWith(entries) {
  return [
    'window.__ModuleLoader__.load({',
    '\tid: "@deepseek-ai/dsh-client-ui-permission-presets",',
    '\tfactory: (require) => {',
    '\t\tvar react_jsx_runtime = require("react/jsx-runtime");',
    '\t\tconst FULL_ACCESS = "danger-full-access";',
    '\t\tconst shieldOutline = "M0 0";',
    '\t\tconst permissionGlyphs = new Map([',
    entries.join('\n'),
    '\t\t]);',
    '\t\t/** Glyph for a permission option value. */',
    '\t\tfunction permissionGlyph(value) {',
    '\t\t\treturn permissionGlyphs.get(value);',
    '\t\t}',
    '\t\treturn { permissionGlyph };',
    '\t}',
    '});',
    '',
  ].join('\n')
}

const dirs = []
/** A stand-in for the `dsh-terminal-bash` bundle: just the mode-change check and its anchor. */
const TERMINAL_BUNDLE = [
  '// stand-in for the dsh-terminal-bash bundle',
  'const sandboxModeFences = new WeakMap();',
  'function ensureSandboxModeFence(ctx, owner) {',
  '\tconst state = { pty: ctx.terminals };',
  '\towner.ctx.on("internal/dispatch", (_mode, eventName, args) => {',
  '\t\tif (eventName !== "session/event") return;',
  '\t\tconst [session, event] = args;',
  '\t\tif (session !== owner.session || event.type !== "sandbox/mode") return;',
  '\t\tconst currentMode = state.sessionProjections.stateOf(session, "sandboxMode") ?? null ?? state.sandboxPolicy.defaultMode;',
  '\t\tif (event.data.mode === currentMode || !state.pty.hasOwnerActivity(owner)) return;',
  '\t\tthrow new Error(`cannot change sandbox mode from "${currentMode}" to "${event.data.mode}" while persistent terminal sessions are open or being created; wait for creation to settle and close them first`);',
  '\t}, { global: true });',
  '}',
  '',
].join('\n')

function tree(entries, { terminal = false } = {}) {
  const dir = mkdtempSync(join(tmpdir(), 'patch-harness-'))
  dirs.push(dir)
  const pkg = join(dir, '@deepseek-ai', 'dsh-client-ui-permission-presets', 'lib')
  mkdirSync(pkg, { recursive: true })
  const file = join(pkg, 'client.js')
  writeFileSync(file, bundleWith(entries))
  let terminalFile
  if (terminal) {
    const termDir = join(dir, '@deepseek-ai', 'dsh-terminal-bash', 'lib')
    mkdirSync(termDir, { recursive: true })
    terminalFile = join(termDir, 'index.js')
    writeFileSync(terminalFile, TERMINAL_BUNDLE)
  }
  return { dir, file, terminalFile }
}

function run(...args) {
  try {
    const out = execFileSync(process.execPath, [script, ...args], { encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] })
    return { code: 0, out }
  } catch (error) {
    return { code: error.status ?? 1, out: `${error.stdout ?? ''}${error.stderr ?? ''}` }
  }
}

const count = (text, needle) => text.split(needle).length - 1

// ---- 全新的一棵树：插入一条，再跑一次不能变成两条 ----

// ---- 持久终端挡住档位切换：要把"拒绝"改成"先关掉再切" ----
const term = tree([], { terminal: true })
check('未打补丁时 --check 失败（终端闸门）', run('--check', '--package-dir', term.dir).code !== 0, true)
const termRun = run('--package-dir', term.dir)
check('终端补丁能应用', termRun.code, 0)
const terminalText = () => readFileSync(term.terminalFile, 'utf8')
check('原来那句拒绝已经不在了', terminalText().includes('close them first`);'), false)
check('改成先关掉该会话的持久终端再切', terminalText().includes('for (const snapshot of live) retireForModeChange(state, owner, snapshot.sessionId);'), true)
check('关闭用的 helper 只插入一份', count(terminalText(), 'function retireForModeChange('), 1)
check('helper 先发 exit，再兜底 kill', terminalText().includes('text: "exit\\n"') && terminalText().includes('state.pty.kill(owner, sessionId, "sandbox mode changed")'), true)
check('正在创建的终端仍然等一等', terminalText().includes('while a persistent terminal session is being created; try again in a moment'), true)
check('打完补丁 --check 通过（终端）', run('--check', '--package-dir', term.dir).code, 0)
run('--package-dir', term.dir)
check('再跑一次不会插第二份 helper（幂等）', count(terminalText(), 'function retireForModeChange('), 1)
check('helper 定义在闸门函数之前（先定义后用）', terminalText().indexOf('function retireForModeChange(') < terminalText().indexOf('function ensureSandboxModeFence('), true)

for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
console.log(failures === 0 ? '\nall patch-harness checks passed' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
