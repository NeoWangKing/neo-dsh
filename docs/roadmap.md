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
