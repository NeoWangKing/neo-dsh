/**
 * Unit tests for the shipped-patch overlay decision: which entries the app still has to hand
 * the host because the profile's own patch file does not name them.
 *
 *   node apps/desktop/test/profile-patch.test.mjs
 */
import { reconcileBundles, withdrawable, missingPatchEntryIds, patchEntryIds } from '../src/profile-patch.mjs'

let failures = 0
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'ok  ' : 'fail'}  ${name} → ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`)
}

// The bundle-record cases below are written as eq(actual, expected, label). They used to sit
// after the `process.exit` in this file *and* to call a helper that no longer existed, so nothing
// about the bundle reconciliation was covered at all — which is how a reconcile bug that retired
// a user's whole plugin batch reached a release.
const eq = (actual, expected, name) => check(name, actual, expected)

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
  '    defaultPreset: workspace-write',
  '',
].join('\n')

check('读出 patch 文件声明的 id', patchEntryIds(SHIPPED), ['permission'])
check('没有 id 的文件读出空', patchEntryIds(STOCK_TEMPLATE), [])
check('同一 id 只算一次', patchEntryIds('- id: a\n- id: a\n- id: b\n'), ['a', 'b'])
check('注释里的 id 不算', patchEntryIds('# - id: permission\n[]'), [])

// 条目里的列表型配置（比如模型目录）也写 `- id:`，那些不是补丁目标
const NESTED = [
  '- id: llm-deepseek',
  '  config:',
  '    models:',
  '      - id: deepseek-flash',
  '        name: DeepSeek-Flash',
  '      - id: deepseek-v4-pro',
  '        name: DeepSeek-V4-Pro',
  '',
].join('\n')
check('嵌套的 - id: 不算补丁条目', patchEntryIds(NESTED), ['llm-deepseek'])
check('缩进的顶层条目也不算（条目一律在列 0）', patchEntryIds('  - id: permission\n'), [])

check('空模板缺我们的条目 → 需要覆盖层', missingPatchEntryIds(SHIPPED, STOCK_TEMPLATE), ['permission'])
check('profile 里一个 patch 都没有 → 需要覆盖层', missingPatchEntryIds(SHIPPED, ''), ['permission'])
check('profile 已经写了这条 → 不再覆盖（用户/旧版优先）', missingPatchEntryIds(SHIPPED, '- id: permission\n  config: {}\n'), [])
check('profile 有别的条目但没有我们的 → 仍然要覆盖', missingPatchEntryIds(SHIPPED, '- id: something-else\n'), ['permission'])
check('用户改过这条（同 id）→ 视为已有，不覆盖他的改动', missingPatchEntryIds(SHIPPED, '- id: permission\n  config:\n    presets: {}\n'), [])

// ---- the bundle record ----------------------------------------------------

// An update carries its plugins: shipped bundles are mounted, and bundles *this app* put in
// the home before that the build no longer ships are taken back out. A bundle the user
// installed themselves is never in the record, so it can never be removed.
eq(reconcileBundles(['a', 'b'], ['a', 'b'], ['a', 'b']), { remove: [], add: [] }, '一致时不动')
eq(reconcileBundles(['a'], ['a', 'b'], ['a', 'b']), { remove: ['b'], add: [] }, '不再随包 → 收回我们自己装过的那个')
eq(reconcileBundles(['a', 'c'], ['a'], ['a']), { remove: [], add: ['c'] }, '新随包的插件会被挂上')
eq(reconcileBundles(['a'], [], ['a', 'user-thing']), { remove: [], add: [] }, '用户自己装的插件永不被删')
eq(reconcileBundles(['a'], ['a', 'b'], ['a']), { remove: [], add: [] }, '已经不在 live 里的不重复处理')

// ---- withdrawal is explicit -------------------------------------------------
//
// The regression: an update retired the user's whole community plugin batch. Those plugins ship
// as `dependencies` (they are not in `dsh.profile.bundles`), so a reconcile driven by the bundle
// list alone saw them as ours-to-remove — it deleted what the same launch had just copied in.
// Anything this build still ships stays; only a name we have deliberately withdrawn may leave.
eq(
  withdrawable(['dsh-mnemon', 'dsh-context', 'dsh-ops'], ['dsh-mnemon', 'dsh-context', 'dsh-ops'], ['dsh-smart-approval', 'dshmarket']),
  [],
  '仍随包的（以 dependency 形式）永不退役',
)
eq(
  withdrawable(['dshmarket', 'dsh-mnemon'], ['dsh-mnemon'], ['dsh-smart-approval', 'dshmarket']),
  ['dshmarket'],
  '确实不再随包、且在我们明确退役的名单里 → 才收回',
)
eq(
  withdrawable(['someone-elses-plugin'], [], ['dsh-smart-approval', 'dshmarket']),
  [],
  '不在退役名单里的，即使记录里有也不动',
)
eq(
  withdrawable(['dsh-smart-approval'], [], ['dsh-smart-approval', 'dshmarket']),
  ['dsh-smart-approval'],
  '退役名单里的照旧退役',
)

console.log(failures === 0 ? '\nall profile-patch checks passed' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
