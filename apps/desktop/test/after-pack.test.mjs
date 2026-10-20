/**
 * Tests for the packaging completeness hook.
 *
 * 0.2.8 shipped without @deepseek-ai/dsh-app-boot (and 56 other packages)
 * because electron-builder's pnpm collector skipped entries pnpm marked as
 * deduplicated. This hook restores what the collector drops; these tests pin
 * the two behaviours that matter: it copies a resolvable package the packager
 * missed, and it does not invent packages that were never installed.
 *
 *   node apps/desktop/test/after-pack.test.mjs
 */
import { createRequire } from 'node:module'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { dirname, join } from 'node:path'

const require = createRequire(import.meta.url)
const { listProductionNames, syncPackages, hostBoots } = require('../scripts/after-pack.cjs')

let failures = 0
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name} → ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`)
}

// ---- reading pnpm's dependency tree --------------------------------------
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
      electron: { version: '43.7.5' },
    },
  },
]
check('pnpm 11 的数组输出', [...listProductionNames(pnpm11)].sort(), [
  '@deepseek-ai/dsh', '@deepseek-ai/dsh-app-boot', '@deepseek-ai/node-addon-system-linux-x64', 'electron',
].sort())
check('pnpm < 11 的单对象输出', [...listProductionNames({ dependencies: { a: { version: '1.0.0' } } })], ['a'])
check('没有依赖 → 空集合', listProductionNames([]).size, 0)

// ---- restoring what the collector dropped --------------------------------
const root = mkdtempSync(join(tmpdir(), 'neo-after-pack-test-'))
try {
  const projectDir = join(root, 'app')
  const packaged = join(root, 'packaged', 'node_modules')
  const write = (rel, text) => {
    mkdirSync(dirname(join(projectDir, rel)), { recursive: true })
    writeFileSync(join(projectDir, rel), text)
  }
  mkdirSync(projectDir, { recursive: true })
  writeFileSync(join(projectDir, 'package.json'), '{"name":"fixture","private":true}')
  write('node_modules/foo/package.json', '{"name":"foo","version":"1.0.0"}')
  write('node_modules/foo/index.js', 'module.exports = "foo"\n')
  write('node_modules/@scope/bar/package.json', '{"name":"@scope/bar","version":"2.0.0"}')
  write('node_modules/@scope/bar/lib.js', 'export const bar = 2\n')

  // The packager copied `foo` but skipped `@scope/bar`; `ghost` was never installed.
  mkdirSync(join(packaged, 'foo'), { recursive: true })
  writeFileSync(join(packaged, 'foo', 'package.json'), '{"name":"foo","version":"1.0.0"}')
  mkdirSync(join(packaged, '@scope', 'bar'), { recursive: true }) // empty dir, no package.json

  const first = syncPackages({ projectDir, packagedModules: packaged, names: new Set(['foo', '@scope/bar', 'ghost']) })
  check('只补缺的、能解析的包', first, { copied: ['@scope/bar'], unresolved: [] })
  check('补进来的文件是真实内容', readFileSync(join(packaged, '@scope', 'bar', 'lib.js'), 'utf8'), 'export const bar = 2\n')
  check('已经存在的包不覆盖', existsSync(join(packaged, 'foo', 'index.js')), false)

  const second = syncPackages({ projectDir, packagedModules: packaged, names: new Set(['foo', '@scope/bar', 'ghost']) })
  check('重跑是幂等的', second, { copied: [], unresolved: [] })

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
