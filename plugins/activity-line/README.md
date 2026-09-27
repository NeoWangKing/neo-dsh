# dsh-activity-line

A [DeepSeek Harness](https://www.npmjs.com/package/@deepseek-ai/dsh) web plugin: one line under the composer that says what the running turn is actually doing.

在输入框下方常驻一行**实时运行状态**，告诉你这一刻 agent 到底在干什么。

## 安装（装到你自己的 dsh 里）

```sh
# 从 npm
dsh plugin --profile web add dsh-activity-line

# 从源码 / 本地目录
dsh plugin --profile web add link:/path/to/activity-line

# 从 git
dsh plugin --profile web add github:<user>/<repo>
```

装完**重启 host** 才生效——host 进程会缓存已经组装好的插件 bundle，只刷新页面不够：

- 桌面端：右下角 **⟳**（或重启应用）
- 命令行：`dsh web` 那个进程重启

卸载：

```sh
dsh plugin --profile web remove dsh-activity-line
```

要求：dsh ≥ 0.1.5 的 web profile（需要 `conversation.composer.dock` 插槽和 `useSession` / `useChat` / `useProjection` 这套标准 session kit）。插件本身没有运行时依赖，不写任何配置文件，装完只有那一行。

## 为什么需要它

harness 自带的回合状态是 `ChatView` 里写死的静态文案 **「Deep diving...」**（中文即「深度求索中…」），只有超过 15 秒才会在旁边出现一个计时。于是下面这些情况长得一模一样：

- 模型在思考；
- 一条 `bash` 命令已经跑了三分钟；
- 审批在等你点确认；
- 请求失败正在重试。

从真实会话里量到的例子：单步 193s / 203s 其实是**一次 bash 调用**；某一步 418.6 秒毫无输出、最后被用户手动取消；有的会话带 5 次 `llm/retry`。这一行把这些阶段直接写出来。

## 显示的状态（优先级从上到下，取第一个匹配）

| 显示 | 含义 | 数据来源 |
|---|---|---|
| `♻️ 请求重试中（第 N 次）` | 请求正在重试——长时间静默的真正原因 | `useProjection('llmRetry')` |
| `🛠 bash: pnpm run build 运行中 1m23s` | 有工具在跑（取最老的那个；多个时显示「另有 N 个」，计时是**这个工具自己的**） | chat 快照 `legacy.runningCalls` |
| `✍️ 输出中 42s` | 助手正在流式输出 | chat 快照 `legacy.partial` |
| `🧠 等待模型响应 42s` | 回合在跑但还没有任何输出（首字还没到） | `legacy.turnTimings` + 1s 时钟 |
| （不显示） | 没有回合在跑 | — |

## 数据来源（都用框架的标准 session kit 订阅，不抓 DOM）

插槽给出的 props 只是某一时刻的快照，所以每个值都必须通过订阅拿到：

| 来源 | 取什么 |
| --- | --- |
| `useSession` | 会话状态快照：`running`、`sessionId` |
| `useChat` | chat 快照的 `legacy` 切片：`runningCalls`（工具名、原始参数、记录时间）、`partial`、`turnTimings`；没有 `useChat` 的构建回退到 `useConversation(c => c.views.get('chat'))` |
| `useProjection('llmRetry')` | 重试投影 `{ [provider|policy]: { retry, retryId } }`，每个 `step/start` 与 `turn/end` 清空；没有该投影的组装回退到 `sessions.binding(id).session.projections.faceOf('llmRetry')` |

位置：`conversation.composer.dock`（输入卡片下方那一条，现有「N 轮 M 步 · tok/s」统计行就在这里的 list 槽，本插件是第二个条目，不替换任何东西）。

> **改完插件要重启 host 才生效**：host 进程缓存已组装的插件 bundle，刷新页面不够（桌面端右下角 ⟳，或重启应用）。

## 安装

```sh
dsh plugin --profile web add link:/home/neowang/Software/DeepseekHarness/dsh-activity-line
# 重启 host（桌面端右下角 ⟳ 或重启应用）后生效
```

装在 **profile** 里（不是 agent preset），所以不会被 TUI 的 preset 托管更新覆盖。

## 测试

```sh
node test/activity.test.mjs
```

覆盖：优先级（重试 > 工具 > 输出 > 等待）、多工具取最老并计数、工具行用自己的计时、缺 chat 快照时的退化、时长格式化、参数预览（首行/折叠空白/截断/非 JSON/数组）、投影 face 的多种形状、回合锚点的两种来源。

## 结构

| 文件 | 作用 |
| --- | --- |
| `index.js` | Host 半部：无操作占位（纯客户端插件） |
| `client.js` | 客户端半部：读视图快照与投影，渲染这一行 |
| `cordis.patch.yml` | bundle patch：插入本插件的 plugin row |
| `test/activity.test.mjs` | 上述纯逻辑的单元测试 |
