/**
 * todo-closer.test.mjs — in-process checks for the row's two close paths.
 *
 * The fake host folds `todo/write` exactly like the real `todos` projection
 * (last-write-wins), so the second close path is exercised against the state the
 * first one produced — which is what makes the duplicate-write check meaningful.
 *
 * Usage: node todo-closer.test.mjs
 */
import { apply, inject, name } from './todo-closer.mjs'

let failures = 0
const ok = (m) => console.log('ok    ' + m)
const fail = (m) => { console.error('FAIL  ' + m); failures++ }

/** Item factory: content + status. */
const item = (content, status) => ({ content, status })

/** The pending list a finished turn leaves behind. */
const STALE = [item('抽取站内搜索逻辑', 'in_progress'), item('新增搜索弹窗', 'pending')]

/**
 * Build a fake host scope around one session.
 * @param config - row config passed to apply.
 * @returns handlers, appended events, folded state and the fake session.
 */
function harness(config) {
  const handlers = new Map()
  const appends = []
  const state = { todos: null }
  const session = {
    append(type, data) {
      appends.push({ type, data })
      if (type === 'todo/write') state.todos = data.todos
    },
  }
  const ctx = {
    sessionProjections: { snapshot: () => ({ values: { todos: state.todos } }) },
    on(event, fn) { handlers.set(event, fn) },
  }
  apply(ctx, config)
  return { handlers, appends, state, session, ctx }
}

/** Run the deferred (`session/event`) path and let its microtask settle. */
async function endTurn(h, event = { type: 'turn/end' }) {
  h.handlers.get('session/event')(h.session, event)
  await new Promise((resolve) => queueMicrotask(resolve))
}

// 1. the defect: a finished turn with a live `in_progress` row gets closed
{
  const h = harness({ leftover: 'pending' })
  h.state.todos = STALE
  h.handlers.get('agent/turn-stopping')({ agent: { session: h.session } })
  const write = h.appends.at(-1)
  const statuses = write?.data?.todos?.map((t) => t.status)
  if (write?.type === 'todo/write' && JSON.stringify(statuses) === '["pending","pending"]') ok('残留 in_progress 被收成 pending')
  else fail('expected one todo/write with [pending,pending], got ' + JSON.stringify(h.appends))
  if (write?.data?.todos?.[0]?.content === '抽取站内搜索逻辑') ok('条目内容原样保留')
  else fail('content changed: ' + JSON.stringify(write?.data))
}

// 2. no in_progress → nothing is written (a clean turn stays clean)
for (const [label, list] of [
  ['全部完成', [item('a', 'completed'), item('b', 'completed')]],
  ['只有待办', [item('a', 'pending')]],
  ['空列表', []],
  ['投影为空（本轮没用过 todo）', null],
]) {
  const h = harness({ leftover: 'pending' })
  h.state.todos = list
  h.handlers.get('agent/turn-stopping')({ agent: { session: h.session } })
  if (h.appends.length === 0) ok(label + ' → 不写入')
  else fail(label + ' should not write, got ' + JSON.stringify(h.appends))
}

// 3. the abort path: 中断/出错的回合不走 turn-stopping，turn/end 兜底
{
  const h = harness({ leftover: 'pending' })
  h.state.todos = STALE
  await endTurn(h)
  const statuses = h.appends.at(-1)?.data?.todos?.map((t) => t.status)
  if (JSON.stringify(statuses) === '["pending","pending"]') ok('回合中断（只有 turn/end）也能收尾')
  else fail('abort path did not close the list: ' + JSON.stringify(h.appends))
}

// 4. both paths on one turn → exactly one write
{
  const h = harness({ leftover: 'pending' })
  h.state.todos = STALE
  h.handlers.get('agent/turn-stopping')({ agent: { session: h.session } })
  await endTurn(h)
  if (h.appends.length === 1) ok('两条路径命中同一回合时只写一次（幂等）')
  else fail('expected exactly 1 write, got ' + h.appends.length)
}

// 5. `leftover: drop` hides the panel instead
{
  const h = harness({ leftover: 'drop' })
  h.state.todos = STALE
  h.handlers.get('agent/turn-stopping')({ agent: { session: h.session } })
  const todos = h.appends.at(-1)?.data?.todos
  if (Array.isArray(todos) && todos.length === 0) ok("leftover: drop 写空表（面板隐藏）")
  else fail('drop mode should write an empty list, got ' + JSON.stringify(todos))
}

// 6. misconfiguration fails loud at mount
{
  let threw = null
  try { harness({ leftover: 'nope' }) } catch (error) { threw = error }
  if (threw instanceof TypeError && /leftover/.test(threw.message)) ok('非法 leftover 在挂载时抛错')
  else fail('expected a TypeError for leftover: nope, got ' + String(threw))
}

// 7. a hostile session must not break the turn-end path
{
  const h = harness({ leftover: 'pending' })
  h.state.todos = STALE
  h.session.append = () => { throw new Error('session closed') }
  let threw = null
  try {
    h.handlers.get('agent/turn-stopping')({ agent: { session: h.session } })
    await endTurn(h)
  } catch (error) { threw = error }
  if (threw === null) ok('追加失败时静默降级（不影响回合）')
  else fail('close paths must never throw: ' + String(threw))
}

// 8. an agent without a session is ignored
{
  const h = harness({ leftover: 'pending' })
  h.handlers.get('agent/turn-stopping')({})
  if (h.appends.length === 0) ok('缺少 session 时忽略')
  else fail('missing session should be ignored')
}

// 9. the module face the loader needs
if (name === 'todo-closer' && inject.includes('sessionProjections')) ok('导出 name / inject 正确')
else fail(`bad module face: name=${name} inject=${JSON.stringify(inject)}`)

console.log('')
if (failures) { console.error(failures + ' todo-closer check(s) failed'); process.exit(1) }
console.log('all todo-closer checks passed')
