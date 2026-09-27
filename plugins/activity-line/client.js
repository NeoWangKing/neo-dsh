/**
 * dsh-activity-line — client half: one honest line under the composer saying what
 * the running turn is actually doing.
 *
 * WHY: the shipped turn status is the static label `Deep diving...` with a clock
 * that only appears after 15 s (`ChatView`), so a turn looks identical while the
 * model thinks, while a `bash` command runs for three minutes, while an approval
 * waits for the user, and while a failed request is being retried. Measured in this
 * machine's own sessions: single steps of 193 s / 203 s that were each one `bash`
 * call, a 418 s step with no output at all that the user cancelled by hand, and
 * sessions carrying five `llm/retry` events. This line names the phase so none of
 * that stays invisible.
 *
 * DATA SOURCES (the standard session kit, never DOM scraping):
 *   - `useSession` → the session status snapshot: `running` and `sessionId`.
 *   - `useChat` → the chat snapshot, whose `legacy` slice carries `runningCalls`
 *     (name, raw args, logged start time), `partial` (streaming assistant blocks) and
 *     `turnTimings` (the anchor the shipped clock uses). A build without `useChat`
 *     reads the same slice through `useConversation(c => c.views.get('chat'))`.
 *   - `useProjection('llmRetry')` → the retry projection
 *     `{ [provider|policy]: { retry, retryId } }`, cleared on every `step/start` and
 *     `turn/end`. A composition without that projection falls back to
 *     `sessions.binding(id).session.projections.faceOf('llmRetry')`.
 *
 * STATES, first match wins:
 *   ♻️ 请求重试中（第 N 次）        a retry is in flight — the honest explanation for a long silence
 *   🛠 bash: pnpm build 运行中 1m23s  a tool is running (oldest call wins; "+N more" when several run)
 *   ✍️ 输出中 42s                   the assistant is streaming
 *   🧠 等待模型响应 42s             the turn runs but nothing has arrived yet
 *   (no line)                      the turn is not running
 *
 * Placement: `conversation.composer.dock` — the band under the composer card where
 * the shipped stats line ("N 轮 M 步 · tok/s") already lives, as a second ordered
 * entry. It is a list slot, so nothing is replaced.
 */
(function () {
  /**
   * Preview text after the tool name, taken from the call's own arguments.
   * @param {string} name - tool name.
   * @param {unknown} argsRaw - the raw JSON argument string logged with the call.
   * @returns {string} a single-line preview, or '' when the arguments carry nothing useful.
   */
  function toolPreview(name, argsRaw) {
    let args = null;
    try {
      args = typeof argsRaw === 'string' ? JSON.parse(argsRaw) : argsRaw;
    } catch {
      return '';
    }
    if (args === null || typeof args !== 'object') return '';
    const candidate = args.command ?? args.file_path ?? args.path ?? args.pattern
      ?? args.query ?? args.queries ?? args.url ?? args.prompt ?? args.tasks;
    if (Array.isArray(candidate)) return candidate.length + ' 项';
    if (typeof candidate !== 'string') return '';
    const line = candidate.split('\n')[0].replace(/\s+/g, ' ').trim();
    if (line === '') return '';
    return line.length > 42 ? line.slice(0, 41) + '…' : line;
  }

  /**
   * Compact duration: `12s`, `1m23s`, `2h05m`.
   * @param {number} ms - elapsed milliseconds.
   * @returns {string} the formatted duration.
   */
  function formatDuration(ms) {
    const total = Math.max(0, Math.floor(ms / 1000));
    if (total < 60) return total + 's';
    const minutes = Math.floor(total / 60);
    if (minutes < 60) return minutes + 'm' + String(total % 60).padStart(2, '0') + 's';
    return Math.floor(minutes / 60) + 'h' + String(minutes % 60).padStart(2, '0') + 'm';
  }

  /**
   * The running turn's logged start time, mirroring the shipped clock's anchor.
   * @param {Map|object|undefined} turnTimings - `ConversationSnapshot.turnTimings`.
   * @returns {number|null} epoch ms, or null when the boundary is outside the window.
   */
  function turnAnchor(turnTimings) {
    if (turnTimings && typeof turnTimings.forEach === 'function') {
      let anchor = null;
      turnTimings.forEach((value) => {
        if (value?.endTime === undefined && typeof value?.startTime === 'number') {
          anchor = anchor === null ? value.startTime : Math.max(anchor, value.startTime);
        }
      });
      if (anchor !== null) return anchor;
    }
    return null;
  }

  /**
   * Read a projection value face without committing to one observable shape.
   * @param {object|undefined} face - the face from `projections.faceOf(...)`.
   * @returns {unknown} the current snapshot value, or undefined.
   */
  function readFace(face) {
    if (face === undefined || face === null) return undefined;
    if (typeof face.getSnapshot === 'function') return face.getSnapshot();
    if (typeof face.get === 'function') return face.get();
    if ('value' in face) return face.value;
    return undefined;
  }

  /**
   * Derive the one line to render.
   * @param {object} input - the conversation snapshot's running fields plus the current clock.
   * @returns {{kind: string, text: string, elapsedMs: number|null}|null} null hides the line.
   */
  function deriveActivity(input) {
    const { running, calls: runningCalls, partial, turnTimings, retry, now, mountedAt } = input;
    if (running !== true) return null;
    const anchor = turnAnchor(turnTimings) ?? mountedAt;
    const turnElapsed = Math.max(0, now - anchor);
    const attempts = retry !== null && typeof retry === 'object'
      ? Object.values(retry).map((entry) => Number(entry?.retry) || 0)
      : [];
    const attempt = attempts.length === 0 ? 0 : Math.max(...attempts);
    if (attempt > 0) return { kind: 'retry', text: '请求重试中（第 ' + attempt + ' 次）', elapsedMs: null };
    const calls = Array.isArray(runningCalls) ? runningCalls : [];
    if (calls.length > 0) {
      let oldest = calls[0];
      for (const call of calls) {
        if ((call?.time ?? now) < (oldest?.time ?? now)) oldest = call;
      }
      const preview = toolPreview(oldest?.name, oldest?.argsRaw);
      const more = calls.length > 1 ? ' · 另有 ' + (calls.length - 1) + ' 个' : '';
      const name = typeof oldest?.name === 'string' && oldest.name !== '' ? oldest.name : '工具';
      return {
        kind: 'tool',
        text: name + (preview === '' ? '' : ': ' + preview) + ' 运行中' + more,
        elapsedMs: Math.max(0, now - (typeof oldest?.time === 'number' ? oldest.time : anchor)),
      };
    }
    if (partial !== null && partial !== undefined) {
      return { kind: 'stream', text: '输出中', elapsedMs: turnElapsed };
    }
    return { kind: 'model', text: '等待模型响应', elapsedMs: turnElapsed };
  }

  const ICONS = { retry: '♻️', tool: '🛠', stream: '✍️', model: '🧠' };
  const NS = 'activity-line';
  const LOCALE_ZH = { label: '运行状态' };
  const LOCALE_EN = { label: 'Activity' };
  const STYLE_ID = 'dsh-activity-line-style';

  /**
   * Stand-in for an absent session-kit hook: reads nothing, calls no hooks.
   * @returns {undefined} always.
   */
  function NO_KIT() {
    return undefined;
  }

  /**
   * Bind the chat-snapshot hook this build serves, preferring the dedicated
   * `useChat` and otherwise selecting the same view off the conversation store.
   * @param {object} props - the slot entry props.
   * @returns {Function} a selector hook over the chat snapshot.
   */
  function chatHookOf(props) {
    if (typeof props.useChat === 'function') return props.useChat;
    if (typeof props.useConversation === 'function') {
      return (selector) => props.useConversation((conversation) => selector(conversation?.views?.get?.('chat')));
    }
    return NO_KIT;
  }

  /** Inject the line's stylesheet once. */
  function insertStyle() {
    if (typeof document === 'undefined' || document.getElementById(STYLE_ID) !== null) return;
    const el = document.createElement('style');
    el.id = STYLE_ID;
    el.textContent = `
      #dsh-activity-line {
        display: flex; align-items: center; gap: 6px;
        font: inherit; font-size: 12px; line-height: 1.4;
        color: var(--dsw-alias-label-secondary, rgba(0, 0, 0, 0.6));
        white-space: nowrap; overflow: hidden; text-overflow: ellipsis;
      }
      #dsh-activity-line .dsh-activity-icon { flex: none; }
      #dsh-activity-line .dsh-activity-text { overflow: hidden; text-overflow: ellipsis; }
      #dsh-activity-line .dsh-activity-elapsed {
        flex: none; font-variant-numeric: tabular-nums;
        color: var(--dsw-alias-label-tertiary, rgba(0, 0, 0, 0.45));
      }
      #dsh-activity-line[data-kind='retry'] { color: var(--dsw-alias-state-warn-primary, #b26a00); }
    `;
    document.head.appendChild(el);
  }

  /**
   * Build the plugin's apply with React in scope.
   * @param {object} react - the module table's React.
   * @returns {(ctx: object) => void} the cordis plugin body.
   */
  function makeApply(react) {
    return function apply(ctx) {
      const slots = ctx.get('slots');
      const sessions = ctx.get('sessions');
      // Nothing to render without the composer band; the rest of the composition
      // must still load.
      if (slots === undefined) return;

      const locale = ctx.get('locale');
      let t = (key) => LOCALE_ZH[key] ?? key;
      let localeReady = false;
      if (locale !== undefined && typeof locale.register === 'function') {
        try {
          ctx.effect(() => locale.register(NS, { zh: LOCALE_ZH, en: LOCALE_EN }), 'dsh-activity-line: dictionaries');
          const bound = typeof locale.bind === 'function' ? locale.bind(NS) : undefined;
          if (typeof bound === 'function') t = bound;
          localeReady = true;
        } catch {
          // A composition that refuses the namespace keeps the built-in Chinese copy;
          // naming an unregistered namespace in the slot entry would be an error, so
          // the entry only declares one when the registration took.
          localeReady = false;
        }
      }
      insertStyle();

      function ActivityLine(props) {
        // The slot hands over point-in-time props, so every value comes from a
        // subscription: `useSession` for the status snapshot, `useChat` for the chat
        // snapshot, `useProjection` for the retry projection. The stand-ins keep the
        // hook order identical in a composition that serves none of them.
        const useSession = typeof props.useSession === 'function' ? props.useSession : NO_KIT;
        const useProjection = typeof props.useProjection === 'function' ? props.useProjection : NO_KIT;
        const useChat = chatHookOf(props);
        const [now, setNow] = react.useState(() => Date.now());
        const [mountedAt] = react.useState(() => Date.now());
        const running = useSession((status) => status?.running === true);
        const sessionId = useSession((status) => status?.sessionId);
        const runningCalls = useChat((chat) => chat?.legacy?.runningCalls);
        const partial = useChat((chat) => chat?.legacy?.partial);
        const turnTimings = useChat((chat) => chat?.legacy?.turnTimings);
        const projectedRetry = useProjection('llmRetry');
        react.useEffect(() => {
          if (!running) return undefined;
          const id = setInterval(() => { setNow(Date.now()); }, 1000);
          return () => { clearInterval(id); };
        }, [running]);
        // The binding face is the fallback for a composition that serves no projection.
        const retryValue = projectedRetry !== undefined
          ? projectedRetry
          : (() => {
            if (sessions === undefined || typeof sessions.binding !== 'function' || sessionId === undefined) return undefined;
            const face = sessions.binding(sessionId)?.session?.projections?.faceOf?.('llmRetry');
            return readFace(face);
          })();
        const activity = deriveActivity({
          running, calls: runningCalls, partial, turnTimings, retry: retryValue, now, mountedAt,
        });
        if (activity === null) return null;
        return react.createElement('div', {
          id: 'dsh-activity-line',
          'data-kind': activity.kind,
          role: 'status',
          'aria-live': 'polite',
          title: t('label'),
        },
        react.createElement('span', { className: 'dsh-activity-icon', 'aria-hidden': 'true' }, ICONS[activity.kind] ?? '•'),
        react.createElement('span', { className: 'dsh-activity-text' }, activity.text),
        activity.elapsedMs === null
          ? null
          : react.createElement('span', { className: 'dsh-activity-elapsed', 'aria-hidden': 'true' }, formatDuration(activity.elapsedMs)));
      }

      const entry = {
        name: 'conversation.composer.dock',
        id: 'activity',
        order: 5,
        label: () => t('label'),
      };
      if (localeReady) entry.locale = NS;
      ctx.effect(
        () => slots.inject('conversation.composer.dock', () => slots.register(entry, ActivityLine)),
        'dsh-activity-line: composer band entry',
      );
    };
  }

  if (typeof window !== 'undefined' && window.__ModuleLoader__ !== undefined) {
    window.__ModuleLoader__.load({
      id: 'dsh-activity-line',
      factory: (require) => {
        var module = { exports: {} };
        var exports = module.exports;
        Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
        const react = require('react');
        exports.name = 'dsh-activity-line';
        /* dsh >= 0.1.2-rc.1 client-module contract: exports.inject names the ctx
           service seats this bundle consumes, so the guarded client ctx exposes them.
           package.json dsh.client.inject (module ids) only orders the boot graph. */
        exports.inject = ['slots', 'sessions', 'locale'];
        exports.apply = makeApply(react);
        return module.exports;
      },
    });
  }

  // Node-side export for the unit test; the browser never defines `module` here.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { deriveActivity, formatDuration, toolPreview, turnAnchor, readFace };
  }
})();
