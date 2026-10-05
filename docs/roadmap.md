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
