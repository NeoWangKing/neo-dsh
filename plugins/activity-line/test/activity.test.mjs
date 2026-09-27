/**
 * activity.test.mjs — in-process checks for the line's derivation.
 *
 * The browser half only registers a module factory; the pure helpers are exported
 * for Node so the phase priority, the tool preview and the clock can be tested
 * without a browser. `require` is used deliberately: client.js is a classic script
 * whose Node branch assigns `module.exports`.
 *
 * Usage: node test/activity.test.mjs
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { deriveActivity, formatDuration, toolPreview, turnAnchor, readFace } = require('../client.js')

let failures = 0
const ok = (m) => console.log('ok    ' + m)
const fail = (m) => { console.error('FAIL  ' + m); failures++ }
const eq = (actual, expected, label) => {
  const a = JSON.stringify(actual)
  const e = JSON.stringify(expected)
  if (a === e) ok(`${label} → ${a}`)
  else fail(`${label}: got ${a}, expected ${e}`)
}

/** One open turn started `ago` ms before `now`, as `ConversationSnapshot` fields. */
const runWith = (now, ago, extra = {}) => ({
  running: true,
  turnTimings: new Map([[7, { startTime: now - ago }]]),
  calls: [],
  partial: null,
  retry: {},
  now,
  mountedAt: now,
  ...extra,
})

const NOW = 1_700_000_000_000

// 1. idle hides the line
eq(deriveActivity(runWith(NOW, 5000, { running: false })), null, '回合未运行 → 不显示')

// 2. a running tool wins over model/stream, with name, preview and its own clock
{
  const input = runWith(NOW, 90_000, {
    calls: [{ callId: 'c1', name: 'bash', argsRaw: '{"command":"pnpm run build --filter web"}', time: NOW - 83_000 }],
    partial: { turn: 7, step: 2, blocks: [] },
  })
  const a = deriveActivity(input)
  eq(a.kind, 'tool', '有工具在跑 → kind')
  eq(a.text, 'bash: pnpm run build --filter web 运行中', '工具行文本')
  eq(a.elapsedMs, 83_000, '工具行用工具自己的计时（不是回合计时）')
}

// 3. several tools: the oldest one is named, the rest are counted
{
  const input = runWith(NOW, 10_000, {
    calls: [
      { callId: 'c1', name: 'read', argsRaw: '{"file_path":"/a/b/c.md"}', time: NOW - 4_000 },
      { callId: 'c2', name: 'bash', argsRaw: '{"command":"sleep 30"}', time: NOW - 9_000 },
    ],
  })
  const a = deriveActivity(input)
  eq(a.text, 'bash: sleep 30 运行中 · 另有 1 个', '多工具 → 取最老的并报数量')
  eq(a.elapsedMs, 9_000, '多工具 → 计时取最老的')
}

// 4. retry outranks everything else (that is the long-silence case)
{
  const input = runWith(NOW, 200_000, {
    calls: [{ callId: 'c1', name: 'bash', argsRaw: '{"command":"x"}', time: NOW - 1_000 }],
    retry: { 'deepseek-official|default': { retry: 3, retryId: 'r' } },
  })
  const a = deriveActivity(input)
  eq(a.kind, 'retry', '重试优先于工具')
  eq(a.text, '请求重试中（第 3 次）', '重试行文本')
  eq(a.elapsedMs, null, '重试不显示计时')
}

// 5. streaming vs waiting for the first token
{
  const streaming = deriveActivity(runWith(NOW, 42_000, { partial: { turn: 7, step: 1, blocks: [] } }))
  eq(streaming.kind, 'stream', '有 partial → 输出中')
  eq(streaming.elapsedMs, 42_000, '输出中用回合计时')
  const waiting = deriveActivity(runWith(NOW, 418_600))
  eq(waiting.kind, 'model', '无工具无 partial → 等待模型响应')
  eq(waiting.elapsedMs, 418_600, '等待用回合计时（复现那次 418s）')
}

// 6. a snapshot without the running fields still yields a usable line
{
  const a = deriveActivity({ running: true, calls: undefined, partial: undefined, turnTimings: undefined, retry: undefined, now: NOW, mountedAt: NOW - 5_000 })
  eq(a.kind, 'model', '缺快照字段 → 退化为等待模型响应')
  eq(a.elapsedMs, 5_000, '缺快照字段 → 计时回退到挂载时刻')
}

// 7. durations
eq([formatDuration(0), formatDuration(12_400), formatDuration(83_000), formatDuration(7_500_000)], ['0s', '12s', '1m23s', '2h05m'], '时长格式化')

// 8. tool preview: first line only, whitespace collapsed, truncated; junk args ignored
eq(toolPreview('bash', '{"command":"echo a\\necho b"}'), 'echo a', '只取命令首行')
eq(toolPreview('bash', '{"command":"   spaced   out  "}'), 'spaced out', '折叠空白')
eq(toolPreview('bash', '{"command":"' + 'x'.repeat(80) + '"}').length, 42, '超长截断到 42 字符（含省略号）')
eq(toolPreview('bash', 'not json'), '', '非 JSON 参数 → 无预览')
eq(toolPreview('todo_write', '{"todos":[{"content":"a"},{"content":"b"}]}'), '', '没有可用字段 → 无预览')
eq(toolPreview('web_search', '{"queries":["a","b","c"]}'), '3 项', '数组参数 → 报数量')

// 9. projection faces: every shape the frameworks use
eq(readFace({ getSnapshot: () => 7 }), 7, 'face.getSnapshot()')
eq(readFace({ get: () => 8 }), 8, 'face.get()')
eq(readFace({ value: 9 }), 9, 'face.value')
eq(readFace(undefined), undefined, 'face 缺失')
eq(readFace({}), undefined, '未知 face 形状不会抛错')

// 10. turn anchor: the open turn wins, closed turns and missing maps yield null
{
  const timings = new Map([[1, { startTime: 100, endTime: 200 }], [2, { startTime: 300 }]])
  eq(turnAnchor(timings), 300, 'turnTimings 里取未结束的回合')
  eq(turnAnchor(new Map([[1, { startTime: 100, endTime: 200 }]])), null, '全部已结束 → null')
  eq(turnAnchor(undefined), null, '没有 turnTimings → null')
}

console.log('')
if (failures) { console.error(failures + ' activity-line check(s) failed'); process.exit(1) }
console.log('all activity-line checks passed')
