/**
 * Tests for the packaging completeness hook.
 *
 * 0.2.8 shipped without @deepseek-ai/dsh-app-boot (and 56 other packages)
 * because electron-builder's pnpm collector skipped entries pnpm marked as
 * deduplicated. This hook restores what the collector drops; these tests pin
 * the behaviours that matter: the dependency list is complete (cycles
 * included), a package with an `exports` map is still copyable (koffi and
 * @vscode/ripgrep made the first Windows build fail here), and packages that
 * were never installed are not invented.
 *
 *   node apps/desktop/test/after-pack.test.mjs
 */
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const { listNames, walkNames, locatePackage, syncPackages, hostBoots } = require('../scripts/after-pack.cjs')

let failures = 0
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name} → ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`)
}

// ---- pnpm's list output ---------------------------------------------------
const pnpm11 = [
  {
    name: 'neo-dsh-desktop',
    dependencies: {
      '@deepseek-ai/dsh': {
        version: '0.2.0-rc.2',
        dedupedDependenciesCount: 18,
        dependencies: {
          '@deepseek-ai/dsh-app-boot': {
            version: '0.2.0-rc.2',
            optionalDependencies: { '@deepseek-ai/node-addon-system-linux-x64': { version: '0.1.2' } },
          },
        },
      },
    },
  },
]
check('pnpm 11 的数组输出', [...listNames(pnpm11)].sort(), [
  '@deepseek-ai/dsh', '@deepseek-ai/dsh-app-boot', '@deepseek-ai/node-addon-system-linux-x64',
].sort())
check('pnpm < 11 的单对象输出', [...listNames({ dependencies: { a: { version: '1.0.0' } } })], ['a'])
check('没有依赖 → 空集合', listNames([]).size, 0)

const root = mkdtempSync(join(tmpdir(), 'neo-after-pack-test-'))
try {
  const projectDir = join(root, 'app')
  const packaged = join(root, 'packaged', 'node_modules')
  const write = (rel, text) => {
    const file = join(projectDir, rel)
    mkdirSync(dirname(file), { recursive: true })
    writeFileSync(file, text)
  }

  write('package.json', '{"name":"fixture","private":true,"dependencies":{"foo":"1.0.0"}}')
  write('node_modules/foo/package.json', '{"name":"foo","version":"1.0.0","dependencies":{"@scope/bar":"2.0.0","locked":"3.0.0"}}')
  write('node_modules/foo/index.js', 'module.exports = "foo"\n')
  write('node_modules/@scope/bar/package.json', '{"name":"@scope/bar","version":"2.0.0","dependencies":{"cycle":"1.0.0"}}')
  write('node_modules/@scope/bar/lib.js', 'export const bar = 2\n')
  // A cycle back to foo: the walk must terminate.
  write('node_modules/cycle/package.json', '{"name":"cycle","version":"1.0.0","dependencies":{"foo":"1.0.0"}}')
  // koffi / @vscode/ripgrep shape: an exports map that hides package.json.
  write('node_modules/locked/package.json', '{"name":"locked","version":"3.0.0","exports":{".":"./index.js"}}')
  write('node_modules/locked/index.js', 'module.exports = 3\n')

  check('遍历完整生产依赖树（含环）', [...walkNames(projectDir)].sort(), ['@scope/bar', 'cycle', 'foo', 'locked'])
  check('exports 挡住 package.json 也能定位', locatePackage(projectDir, 'locked'), join(projectDir, 'node_modules', 'locked'))

  // The packager copied `foo` but skipped the rest; `ghost` was never installed.
  mkdirSync(join(packaged, 'foo'), { recursive: true })
  writeFileSync(join(packaged, 'foo', 'package.json'), '{"name":"foo","version":"1.0.0"}')
  mkdirSync(join(packaged, '@scope', 'bar'), { recursive: true }) // empty dir, no package.json

  const names = new Set(['foo', '@scope/bar', 'cycle', 'locked', 'ghost'])
  const first = syncPackages({ projectDir, packagedModules: packaged, names })
  check('只补缺的、能解析的包', first, { copied: ['@scope/bar', 'cycle', 'locked'], unresolved: [] })
  check('补进来的文件是真实内容', readFileSync(join(packaged, '@scope', 'bar', 'lib.js'), 'utf8'), 'export const bar = 2\n')
  check('exports 包的实现也补进来了', existsSync(join(packaged, 'locked', 'index.js')), true)
  check('已经存在的包不覆盖', existsSync(join(packaged, 'foo', 'index.js')), false)

  check('重跑是幂等的', syncPackages({ projectDir, packagedModules: packaged, names }), { copied: [], unresolved: [] })

  let bootError = ''
  try {
    hostBoots({ resourcesDir: join(root, 'packaged', 'resources'), appDir: join(root, 'packaged', 'app') })
  } catch (error) {
    bootError = error.message
  }
  check('缺 host 时闸门报错', /bin\.js is missing/.test(bootError), true)
} finally {
  rmSync(root, { recursive: true, force: true })
}

if (failures > 0) {
  console.error(`✗ ${failures} check(s) failed`)
  process.exit(1)
}
console.log('✓ after-pack checks passed')
