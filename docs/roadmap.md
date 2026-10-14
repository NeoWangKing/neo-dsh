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

---

## 3. 评估：外部项目 `T-Auto/dsh-ops`（token 优化）

*提出：2026-10-07，用户从网上看到（1213 star 的 DSH 插件）。结论：**现在整合不了，但它的"对标基线"提示了一个零成本的大杀器**。*

**它是什么**：npm 包 `dsh-ops`，一个 DSH host 插件，四个组件（`ptc` / `file` / `shell` / `background`），
Rust 原生工具 + IPC，宣称相比 Windows 标准模式省 97% token、相比 Linux 原装 PTC 模式省 65%。

**为什么现在整合不进 Neo DSH**

1. npm 包 **`os: ["win32"]`, `cpu: ["x64"]`**，可选依赖全是 `@dsh-ops/*-win32-x64` → Arch 上连载荷都取不到；
   源码号称跨平台，但要自己编 Rust + 造 bash/pwsh 载荷。
2. `peerDependencies: { "@deepseek-ai/dsh": "^0.2.0-rc.2" }` + 新一代插件清单（`dsh-plugin.json` v0.15 /
   `tools.dsh/v1alpha1` contracts）→ **我们 vendored 的 harness 是 0.1.5-rc.3**，插件装载机制完全不同，
   根本挂不起来。
3. 即便移植，它**替换整个工具层**（file/shell/ptc），与 liangshen 预设（bash / str_replace_editor / fs 行 +
   bootstrap 门）正面冲突。
4. 许可证是 `MIT AND Apache-2.0`（宽松）→ **借鉴想法/代码没问题**，标注出处即可。

**真正值得偷的一条（零代码）**：harness **自带 PTC**，`tools` 插件有 `mode: native|ptc|both`
（`dsh-web-app/cordis.patch.yml` 里通过 `DSH_TOOLS_MODE` 环境变量开启，默认 native）。dsh-ops 的 65% 就是
"相对 Linux 原装 PTC" 算的——所以**先试 PTC 本身**：`DSH_TOOLS_MODE=ptc bash scripts/dev-window.sh`
（独立 dev 窗口，不碰正在跑的会话），比 token 用量与工具调用轮数。若确实大赢，就在
`resources/profile-web/cordis.patch.yml` 里给 `tools` 加一行 `mode: ptc`（或 `both`）当作随包默认。

**其它可借鉴的小东西**：它用 `docs/schema-baseline.json` 记录工具 schema 的 token 基线（我们也可以量自己的）；
"错误循环 / 只顾思考不交付"的护栏思路（我们已有 `todo-closer.mjs` / `instruction-hint.mjs`，可以再加一条）。
原生 IPC 那套（Rust）成本太高，先不碰。

**升级到 harness 0.2.x：已在仓库里完成**（2026-10-14，harness 现在钉 `0.2.0-rc.2`）

原先只敢说"这是迁移"的 8 个担心，实际动手后长这样（细节见 `AGENT.md` 的 "The 0.2 harness migration"）：

- 91 个 `@deepseek-ai/*` 依赖里有 **87 个只是照 `dsh@0.2.0-rc.2` 的 lockstep 表跳版本** ✓
  （独立线只动 3 个：`cordis-plugin-group` 1.0.4 / `cordis-plugin-timer` 1.1.6 / `schemastery` 3.18.4）；
- 真正被改名/删除的只有两个 ✗ → 已按上游替换：`dsh-code-runtime` → `dsh-ptc-runtime` + `dsh-ptc-runtime-node`，
  `dsh-agent-presets` → `dsh-agent-preset-registry`；
- 三处 vendored 补丁里 **1 处锚点随代码搬走**（权限字形表从 `dsh-client-ui-conversation` 挪到了
  `dsh-client-ui-permission-presets`），另两处原样可用；
- **预设要换形态**（最大的那块）：0.2 删掉了 `$DSH_HOME/.agent-presets/<id>/` 目录发现，预设变成 profile 里的
  `@deepseek-ai/dsh-agent-preset` 条目，默认预设也改由注册器行配置。已搬完，id 保持 `liangshen`，老会话照常打开；
- 途中抓到一个会**让每一轮都失败**的坑：0.2 的 `plugin-package-inventory-deepseek` 每轮上报活跃插件清单，
  包清单里少一个 `version` 字段就抛 `REQUEST_EXTENSION`（症状是回合在 `turn/end` 静默死掉，看不出是包清单问题）；
- 另外 0.2 的 `reasoningEffort` 档位改成 `off/low/high/max`，而**我们自己发的默认值是 `medium`** ✗ →
  已加开机修复（`repairReasoningEffort`），否则凡是用旧默认值起的 home 每轮都会报 `UNSUPPORTED_REASONING_EFFORT`；
- 回归：`pnpm test` 全绿、`patches:check` 全绿、隔离 home 的 smoke 启动 ✓，
  并且用 web 的 HTTP RPC（`POST /api/session/create` + `session/prompt`）真的建了 `agentPreset: liangshen` 的会话跑完
  一轮问答 ✓ —— 这条 RPC 路径值得留着，它是唯一能**非交互地端到端验证 agent 平面**的办法（`dsh headless` 明确拒绝
  带 agent preset 的会话）。

**dsh-ops 在 Linux 上已经自己编出来了**（2026-10-14，实测可用）

上游只发 Windows x64（README 明说其它平台不在兼容承诺内），但 Rust worker 与打包脚本本身跨平台：
只需改两处（`lib/ptc/runtime.js` 的平台白名单 + `package.json` 的 `os`），`cargo build --release`
后 `bin/native-runtime.mjs stage --platform linux-x64` 就会校验 ELF 架构并写 provenance。
产物在 `~/Projects/dsh-ops-linux/`（源码 + `BUILD-LINUX.md` 记录了来源 commit、两处改动、构建/安装命令）。
实测：插件零告警加载，`ops_glob`/`ops_grep`/`ops_inspect_local_file`/`ops_replace` 四个原生文件工具
进入模型目录，`ops_grep` 真跑出正确结果；`ops_bash`/pwsh（Windows 载荷）与 FastCtx 后台组件在 Linux 上不可用。
**待办**：`smart-approval` 还不认识 `ops_*` 工具（按"未知工具交给模型判"处理，会弹审批）——
只读的 `ops_glob`/`ops_grep`/`ops_inspect_local_file` 应该像内置只读工具一样直接放行。

**还没做的**：装到 Linux/macOS 上（要重启应用、会打断正在跑的长线任务，等你发话）；
第三方插件 `dshmarket@1.45.1` 的 peer 范围只到 `^0.1.x`，0.2 会**跳过它**并打日志——要么等上游发兼容版，
要么用 `dsh plugin allow-version` 显式放行。

