/**
 * The web client loads each plugin's client bundle as a classic script and expects it to
 * register itself with `window.__ModuleLoader__.load({ id, factory })`. A bundle written as a
 * plain Node module (`exports.name = …`) is evaluated and then dropped: the browser shows
 * "Failed to load plugins" and skips the whole client graph — v0.2.9's Nord theme shipped
 * exactly that, and the host log stayed clean, so no host-side gate could see it.
 *
 * This evaluates every shipped client entry in a sandbox with a fake loader.
 *
 *   node scripts/test/client-entry.test.mjs
 */
import { readFileSync, readdirSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import vm from 'node:vm'

const REPO = dirname(dirname(dirname(fileURLToPath(import.meta.url))))

let failures = 0
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name} → ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`)
}

/** package dirs one level below `root`, plus one more level for @scope/name. */
function packageDirs(root) {
  const dirs = []
  for (const entry of readdirSync(join(REPO, root), { withFileTypes: true })) {
    if (!entry.isDirectory()) continue
    const dir = join(REPO, root, entry.name)
    dirs.push(dir)
    if (entry.name.startsWith('@')) {
      for (const scoped of readdirSync(dir, { withFileTypes: true })) {
        if (scoped.isDirectory()) dirs.push(join(dir, scoped.name))
      }
    }
  }
  return dirs
}

function clientEntry(dir) {
  let pkg
  try {
    pkg = JSON.parse(readFileSync(join(dir, 'package.json'), 'utf8'))
  } catch {
    return null
  }
  if (!pkg.dsh?.client) return null
  const declared = pkg.exports?.['./client'] ?? pkg.dsh.client.entry ?? './client.js'
  const rel = typeof declared === 'string' ? declared : (declared?.default ?? declared?.import ?? declared?.require)
  return typeof rel === 'string' ? { name: pkg.name, file: join(dir, rel) } : null
}

const entries = [...packageDirs('vendor'), ...packageDirs('plugins')].map(clientEntry).filter(Boolean)
check('找到了随包的 client 入口', entries.length >= 3, true)
check('Nord 主题在扫描范围内', entries.some((entry) => entry.name === 'dsh-nord-theme'), true)

for (const entry of entries) {
  const loaded = []
  const sandbox = { window: { __ModuleLoader__: { load: (spec) => loaded.push(spec) } } }
  try {
    vm.runInNewContext(readFileSync(entry.file, 'utf8'), sandbox, { filename: entry.file })
  } catch (error) {
    check(`${entry.name}: 能在浏览器沙箱里执行`, error.message, 'no error')
    continue
  }
  check(`${entry.name}: 注册且只注册一次`, loaded.length, 1)
  check(`${entry.name}: 注册 id 正确`, loaded[0]?.id, entry.name)
  // Third-party factories may build their module from real `require()`s; only ours is
  // asserted end to end (the theme is what broke).
  if (entry.name === 'dsh-nord-theme') {
    const exported = loaded[0].factory(() => ({}))
    check('dsh-nord-theme: 导出 apply', typeof exported.apply, 'function')
    check('dsh-nord-theme: 依赖 theme 服务', exported.inject, ['theme'])
  }
}

if (failures > 0) {
  console.error(`✗ ${failures} check(s) failed`)
  process.exit(1)
}
console.log('✓ client-entry checks passed')
