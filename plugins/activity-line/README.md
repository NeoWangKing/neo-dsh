# dsh-activity-line

**English** · [中文](README.zh-CN.md)

A [DeepSeek Harness](https://www.npmjs.com/package/@deepseek-ai/dsh) web plugin: one line under the composer that says what the running turn is actually doing.

## Install (into your own dsh)

```sh
# from npm
dsh plugin --profile web add dsh-activity-line

# from a local checkout
dsh plugin --profile web add link:/path/to/activity-line

# from git
dsh plugin --profile web add github:<user>/<repo>
```

The plugin is installed into the **profile**, not an agent preset, so a preset
manager cannot overwrite it.

**Restart the host afterwards** — the host process caches the assembled plugin
bundles, so reloading the page is not enough:

- desktop app: the **⟳** button (or restart the app)
- CLI: restart the `dsh web` process

Uninstall:

```sh
dsh plugin --profile web remove dsh-activity-line
```

Requirements: dsh ≥ 0.1.5 on the web profile (it needs the
`conversation.composer.dock` slot and the `useSession` / `useChat` /
`useProjection` session kit). The plugin has no runtime dependencies of its own
and writes no configuration; all you get is the line.

## Why it exists

The shipped turn status is the static label **"Deep diving..."** hardcoded in
`ChatView`, with a clock that only appears after 15 seconds. So these look
identical:

- the model is thinking;
- a `bash` command has been running for three minutes;
- an approval is waiting for you;
- a failed request is being retried.

Measured in real sessions on this machine: single steps of 193 s / 203 s were each
**one `bash` call**; one 418.6 s step produced no output at all and was cancelled
by hand; some sessions carry five `llm/retry` events. This line names the phase.

## States (first match wins, top to bottom)

| Shown | Meaning | Source |
| --- | --- | --- |
| `♻️ 请求重试中（第 N 次）` | a retry is in flight — the honest explanation for a long silence | `useProjection('llmRetry')` |
| `🛠 bash: pnpm run build 运行中 1m23s` | a tool is running (oldest call wins; `另有 N 个` when several run, and the clock is **that tool's own**) | chat snapshot `legacy.runningCalls` |
| `✍️ 输出中 42s` | the assistant is streaming | chat snapshot `legacy.partial` |
| `🧠 等待模型响应 42s` | the turn runs but nothing has arrived yet | `legacy.turnTimings` + a 1 s clock |
| (nothing) | no turn is running | — |

The texts are Chinese today; the line registers a locale namespace, so the labels
follow the app's language as the dictionary grows.

## Data sources (subscriptions from the standard session kit, never DOM scraping)

The slot hands over point-in-time props, so every value has to be subscribed:

| Source | What it gives |
| --- | --- |
| `useSession` | session status snapshot: `running`, `sessionId` |
| `useChat` | the chat snapshot's `legacy` slice: `runningCalls` (name, raw arguments, logged time), `partial`, `turnTimings`; a build without `useChat` falls back to `useConversation(c => c.views.get('chat'))` |
| `useProjection('llmRetry')` | the retry projection `{ [provider\|policy]: { retry, retryId } }`, cleared on every `step/start` and `turn/end`; without that projection it falls back to `sessions.binding(id).session.projections.faceOf('llmRetry')` |

Placement: `conversation.composer.dock` — the band under the composer card, the
same list slot the shipped "N turns M steps · tok/s" stats line occupies. This is
a second entry (`order: 5`); nothing is replaced.

## Tests

```sh
node test/activity.test.mjs
```

Covers phase priority (retry > tool > stream > wait), multi-tool selection and
counting, the tool's own clock, the degraded case with no chat snapshot, duration
formatting, argument previews (first line / collapsed whitespace / truncation /
non-JSON / arrays), the projection face shapes, and both turn-anchor sources.

## Files

| File | Role |
| --- | --- |
| `index.js` | host half: a no-op placeholder (this is a client-only plugin) |
| `client.js` | client half: reads the snapshots and the projection, renders the line |
| `cordis.patch.yml` | bundle patch: inserts this plugin's row |
| `test/activity.test.mjs` | unit tests for the pure helpers above |
