# Neo DSH 待做（roadmap）

按用户提出的顺序记录。每条写清"要什么 / 为什么 / 已知的实现难点 / 待定的选择"，只记计划，
不动手实现。发版与否永远等用户说。

---

## 1. 系统通知（Codex 风格）

*提出：2026-10-05（用户给了 Codex 的截图：`Command approval` + 打开 / Approve / Approve for session / Decline）*

**要什么**
在**需要审批**、**工作完成**这些时刻弹**系统级通知**，最好带可直接操作的按钮。

**为什么**
现在审批只出现在 app 窗口里。窗口被切走或最小化时，用户根本不知道 agent 停在那里等批准，
一个会话就这么干等着。Codex 的做法是把审批推进系统通知，点一下就能批、或者直接拒。

**已知实现难点**（先记下来，省得下次重新查）

- **通知本身**：Electron 主进程的 `Notification` 在 Linux / macOS / Windows 都能弹，这部分不难。
- **按钮才是难点**：Electron 的 `Notification` **不支持 action 按钮**（`actions` 字段只有 macOS 部分支持）。
  Linux 上要真正的按钮得走 D-Bus 的 `org.freedesktop.Notifications`（`notify-send` / `gdbus` 都支持
  actions，但要看通知守护进程——GNOME 支持，点按钮回来的是一条 `ActionInvoked` 信号），
  也就是说"按钮点回来之后怎么回答那次审批"要自己接。
- **架构**：审批事件发生在 **host**（第一方插件能收到 `session/event` 里的 `approval/asked`，
  也能挂在 `tools/pre-execute` 上），而通知要由 **shell**（Electron）发。可行路径：
  host 插件 → 本地 HTTP 路由（照现有 `/__dsh_desktop_set` 那条的样子加一条）→ shell 弹通知；
  按钮/点击的回程则 shell → host 去回答那次审批。
- **别打扰**：只在窗口失焦时弹、同一审批去重、设置里给开关；通知正文是否要抹掉敏感命令的细节待定。

**待定的选择（等用户拍板）**

1. 按钮做到什么程度：只做"点通知 → 聚焦窗口并跳到那条审批"，还是真做
   Approve / Approve for session / Decline（要接 D-Bus）？
2. 哪些事件要通知：审批必须有；**工作完成**、长任务（job）结束、需要 `ask_user_question`、
   host 崩溃——各自要不要？
3. 外观：像 Codex 那样 图标 + 标题 + 正文 + 按钮？标题用什么（"Neo DSH" vs 会话标题）？

---

## 待发布（等用户说"发"）

`main` 上已经攒了三处修复，合起来发一次 `v0.1.17` 就行（发版步骤见 AGENT.md：改两处版本号 → commit → tag → push tag → CI 自动打包并附到 release → 补发布说明）：

1. **应用内"检查更新"走 Chromium 栈**（`net.fetch`）——修 `无法连接 GitHub：fetch failed（UNABLE_TO_GET_ISSUER_CERT_LOCALLY）`。
2. **关机不再卡 90 秒**——信号退出改成"销毁窗口 + 杀 host + 1.5 秒兜底 `app.exit(0)`"，systemd 里实测 868 ms `Result=success`。
3. **CI 产物带上 vendored 补丁**（智能批准图标 / open-in-app 图标 / 切档位先关持久终端）——CI 已改成 `pnpm run resources` + `patches:check`。

注：0.1.16 的两台机器已经手工把第 3 条补上，所以那三处功能眼下是好的；第 1、2 条要等 0.1.17。

---

## 2. 插话时也要能立刻对话（长任务进行中）

*提出：2026-10-07。用户观察：上一轮没结束时插话，agent 不会立刻回（当时那一步是一个跑了 8 分多钟的 `bash`）。*
*约束（用户明确要求）：不要动他正在跑的那个会话/进程。*

**机制（已查证，别重复挖）**：harness 的收件箱有两种目标——`next-turn`（等整轮结束）和 `next-step`（下一步并入）。
Web 端发消息用的是 **`next-step`**（`@deepseek-ai/dsh-api-session-controller` 里 `target: "next-step"`），
所以**插话本来就在"当前这一步结束、下一步开始"之间生效**，不用等整轮。

**所以症状的真正来源**：那一步是一个长 `bash` 调用 → 没有 step 边界 → 看起来像"不理人"。
一个 `while … sleep …` 轮询循环也算**一步**，一样挡住插话。

**三条路线（按性价比排序）**

1. **长活后台化（推荐先做，几乎零成本）**：预设/规则要求"预计很久的命令走 `run_in_background`，之后用
   `job_output` 短轮询"，这样每一步都是秒级，插话秒级生效。附带好处：**停止按钮只结束当前轮，不会杀掉
   后台 job**（job 注册表在 host 侧），于是"先停一下回你、稍后再收 job 结果"这条路是通的。
2. **插话起子代理、答案走旁路 UI**（用户最初的想法）：用 `subagent_fork`（会带上当前会话上下文）回答用户，
   结果显示在侧栏/通知里，**不要写进主会话的对话流**（会污染正在进行的轮）。需要 host 插件（挂在
   `agent/inbox`/`session/event`）+ 客户端侧栏各一个。代价：fork 一份很长的上下文很烧 token。
3. **显式"打断并回答"按钮**：停当前轮（后台 job 继续跑）→ 先回答插话 → 再收 job 结果继续。多数情况够用。

**注意**：真要动的是**下一版**的代码；分析阶段只读代码与日志，不碰正在运行的会话。
