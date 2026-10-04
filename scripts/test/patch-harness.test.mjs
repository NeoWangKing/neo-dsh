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
    '\tid: "@deepseek-ai/dsh-client-ui-conversation",',
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

const freshEntry = '\t\t\t["read-only", null],'
const legacyEntry = [
  '\t\t\t["smart-approval", (0, react_jsx_runtime.jsxs)("svg", {',
  '\t\t\t\twidth: "16",',
  '\t\t\t\theight: "16",',
  '\t\t\t\tviewBox: "0 0 16 16",',
  '\t\t\t\tfill: "none",',
  '\t\t\t\t"aria-hidden": true,',
  '\t\t\t\tchildren: [(0, react_jsx_runtime.jsx)("path", {',
  '\t\t\t\t\td: "M9.4 6.8Q10.46 8.94 12.6 10Q10.46 11.06 9.4 13.2Q8.34 11.06 6.2 10Q8.34 8.94 9.4 6.8Z",',
  '\t\t\t\t\tfill: "currentColor"',
  '\t\t\t\t})]',
  '\t\t\t})],',
].join('\n')

const dirs = []
function tree(entries) {
  const dir = mkdtempSync(join(tmpdir(), 'patch-harness-'))
  dirs.push(dir)
  const pkg = join(dir, '@deepseek-ai', 'dsh-client-ui-conversation', 'lib')
  mkdirSync(pkg, { recursive: true })
  const file = join(pkg, 'client.js')
  writeFileSync(file, bundleWith(entries))
  return { dir, file }
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
const fresh = tree([freshEntry])
check('未打补丁时 --check 失败', run('--check', '--package-dir', fresh.dir).code !== 0, true)
const first = run('--package-dir', fresh.dir)
check('首次打补丁成功', first.code, 0)
let text = readFileSync(fresh.file, 'utf8')
check('插入了一条 smart-approval 条目', count(text, '["smart-approval",'), 1)
check('条目带上了内容横线与角星', [text.includes('M10.6 4.65V5.75H4.8V4.65H10.6Z'), text.includes('M11.85 7.95Q13.01'), text.includes('smart-approval-notch')], [true, true, true])
check('打完补丁 --check 通过', run('--check', '--package-dir', fresh.dir).code, 0)
run('--package-dir', fresh.dir)
check('再跑一次仍是同一条（幂等）', count(readFileSync(fresh.file, 'utf8'), '["smart-approval",'), 1)

// ---- 旧版本留下的条目：要替换掉，不能变成两条 ----
const legacy = tree([freshEntry, legacyEntry])
const upgrade = run('--package-dir', legacy.dir)
check('旧条目能被升级', upgrade.code, 0)
text = readFileSync(legacy.file, 'utf8')
check('升级后只剩一条', count(text, '["smart-approval",'), 1)
check('旧的星形路径被清掉', text.includes('M9.4 6.8Q10.46'), false)
check('读到的是新图形', text.includes('M11.85 7.95Q13.01'), true)

// ---- 锚点消失：要大声失败，而不是悄悄跳过 ----
const broken = tree([freshEntry])
writeFileSync(broken.file, readFileSync(broken.file, 'utf8').replace('const permissionGlyphs = new Map([', 'const permissionGlyphsRenamed = new Map(['))
const missing = run('--package-dir', broken.dir)
check('锚点不见了会失败', missing.code !== 0, true)
check('并且说出是哪个补丁', missing.out.includes('smart-approval-glyph'), true)

// ---- 指向只含一个包的目录：不该抱怨另一个包没装 ----
const partial = run('--check', '--package-dir', join(fresh.dir, '@deepseek-ai'))
check('只含一个包的目录不再报缺包', partial.code, 0)

for (const dir of dirs) rmSync(dir, { recursive: true, force: true })
console.log(failures === 0 ? '\nall patch-harness checks passed' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
