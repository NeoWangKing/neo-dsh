/**
 * todo-closer — close a finished turn's todo list instead of leaving it looking busy.
 *
 * WHY: `@deepseek-ai/dsh-tool-todo` records the list as a session event
 * (`todo/write`) and the UI renders the `todos` projection, which is
 * last-write-wins and resets only on the NEXT turn's `turn/start`. Nothing clears
 * it when a turn ends, and `TodoPanel` has no notion of "the session is running":
 * any `in_progress` row keeps a spinning glyph, so a turn that finished minutes ago
 * still claims to be executing its first task.
 *
 * The tool description does tell the model to end with no `in_progress` item, but
 * that is a prompt-level hope, and this preset writes lists the model then stops
 * updating — measured in this preset's own sessions: one 25-tool-call turn wrote
 * the list twice and ended with item 1 still `in_progress`, and another wrote it
 * once and never again. This row makes the outcome deterministic instead.
 *
 * WHAT: at turn end, if the live projection still holds `in_progress` items,
 * append ONE `todo/write` that flips them to `pending` (config `leftover: drop`
 * writes an empty list instead, which makes the panel render nothing at all).
 * Contents are preserved — only the status of the abandoned active row changes — so
 * the panel reads "N 项待办" rather than pretending to execute. Nothing reaches the
 * model: `todo/write` is not a model-visible event.
 *
 * WHERE: `agent/turn-stopping` is the documented terminal checkpoint and still runs
 * inside the turn, but aborted and errored turns never dispatch it — `turn/end` is
 * the only event every outcome shares, so that path closes the list too, deferred to
 * a microtask because appending from inside the append's own event dispatch would
 * re-enter the session log.
 *
 * Both paths read the projection at call time and skip a list with no `in_progress`
 * item, so whichever fires second is a no-op rather than a duplicate write.
 */

/** Cordis plugin name used by loader diagnostics. */
export const name = 'todo-closer'

/** The projection key registered by `@deepseek-ai/dsh-tool-todo`. */
const TODOS = 'todos'

/** Services this row consumes: the projection read face the UI renders from. */
export const inject = ['sessionProjections']

/** Accepted values for the `leftover` config field. */
const LEFTOVER_MODES = ['pending', 'drop']

/**
 * Validate the row's configuration.
 * @param config - loader-supplied row config.
 * @returns the accepted leftover mode.
 * @throws {TypeError} when `leftover` is present but not a known mode.
 */
function readConfig(config) {
  const leftover = config?.leftover ?? 'pending'
  if (!LEFTOVER_MODES.includes(leftover)) {
    throw new TypeError(`${name}: leftover must be one of ${LEFTOVER_MODES.join(' | ')}`)
  }
  return leftover
}

/**
 * Flip one session's abandoned active rows, if it has any.
 * Never throws: a cosmetic list must not break a turn that is already ending.
 * @param ctx - the plugin context carrying the projection service.
 * @param leftover - accepted leftover mode.
 * @param session - the session to close; a missing session is ignored.
 */
function closeSession(ctx, leftover, session) {
  if (session === undefined || session === null) return
  let todos
  try {
    todos = ctx.sessionProjections.snapshot(session, [TODOS]).values[TODOS]
  } catch {
    // A session mid-disposal has no projection to read; the next turn resets anyway.
    return
  }
  if (!Array.isArray(todos) || todos.length === 0) return
  if (!todos.some((item) => item?.status === 'in_progress')) return
  const next = leftover === 'drop'
    ? []
    : todos.map((item) => (item?.status === 'in_progress' ? { ...item, status: 'pending' } : item))
  try {
    session.append('todo/write', { todos: next })
  } catch {
    // The session already closed and refused the append; the list is cosmetic and
    // the next turn's `turn/start` clears it regardless.
  }
}

/**
 * Register the two turn-end closers.
 * @param ctx - the preset's standing agent-scope context.
 * @param config - row config; `leftover` selects pending (default) or drop.
 */
export function apply(ctx, config) {
  const leftover = readConfig(config)
  // Normal completion: dispatched before `turn/end`, so the write stays in-turn.
  ctx.on('agent/turn-stopping', ({ agent }) => { closeSession(ctx, leftover, agent?.session) })
  // Aborted and errored turns skip turn-stopping; `turn/end` covers every outcome.
  ctx.on('session/event', (session, event) => {
    if (event?.type !== 'turn/end') return
    queueMicrotask(() => { closeSession(ctx, leftover, session) })
  })
}
