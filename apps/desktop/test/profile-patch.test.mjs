/**
 * Unit tests for the shipped-patch overlay decision: which entries the app still has to hand
 * the host because the profile's own patch file does not name them.
 *
 *   node apps/desktop/test/profile-patch.test.mjs
 */
import { missingPatchEntryIds, patchEntryIds } from '../src/profile-patch.mjs'

let failures = 0
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'ok  ' : 'fail'}  ${name} → ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`)
}

// 这份是 harness 给新 profile 的模板：注释 + 空数组，什么都不声明
const STOCK_TEMPLATE = [
  '# Your patch layer for this dsh profile, applied after every bundle layer:',
  '# a top-level YAML array of loader patch entries (id-targeted config',
  '# overrides, disables, and insert lists; `!!js` expressions allowed).',
  '[]',
  '',
].join('\n')

const SHIPPED = [
  '- id: permission',
  '  config:',
  '    presets:',
  '      read-only:',
  '        sandbox: read-only',
  '        approval: ask',
  '        name: 仅可查看',
  '    defaultPreset: smart-approval',
  '',
].join('\n')

check('读出 patch 文件声明的 id', patchEntryIds(SHIPPED), ['permission'])
check('没有 id 的文件读出空', patchEntryIds(STOCK_TEMPLATE), [])
check('同一 id 只算一次', patchEntryIds('- id: a\n- id: a\n- id: b\n'), ['a', 'b'])
check('注释里的 id 不算', patchEntryIds('# - id: permission\n[]'), [])

check('空模板缺我们的条目 → 需要覆盖层', missingPatchEntryIds(SHIPPED, STOCK_TEMPLATE), ['permission'])
check('profile 里一个 patch 都没有 → 需要覆盖层', missingPatchEntryIds(SHIPPED, ''), ['permission'])
check('profile 已经写了这条 → 不再覆盖（用户/旧版优先）', missingPatchEntryIds(SHIPPED, '- id: permission\n  config: {}\n'), [])
check('profile 有别的条目但没有我们的 → 仍然要覆盖', missingPatchEntryIds(SHIPPED, '- id: something-else\n'), ['permission'])
check('用户改过这条（同 id）→ 视为已有，不覆盖他的改动', missingPatchEntryIds(SHIPPED, '- id: permission\n  config:\n    presets: {}\n'), [])

console.log(failures === 0 ? '\nall profile-patch checks passed' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
