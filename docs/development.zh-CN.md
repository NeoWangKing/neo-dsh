# 开发 Neo DSH

四个层面，各有各的编辑回路。关键是**先分清自己在哪一层**：其中三层在应用运行时就能改，只有一层是构建产物。

| 层面 | 运行时位于 | 怎么改 | 何时生效 |
| --- | --- | --- | --- |
| **客户端插件**（`client.js`，浏览器侧） | 被 link 进 `~/.dsh/profiles/web/node_modules` 的某个目录 | 直接改文件 | **重启 host**（⟳ 按钮） |
| **Host 插件**（`index.js`、cordis row） | 同上 | 直接改文件 | **重启 host** |
| **Agent preset**（`~/.dsh/.agent-presets/<name>/`） | `$DSH_HOME` | 就地编辑 | 下一个会话 |
| **外壳**（`src/main.mjs`、窗口、host 生命周期） | 冻结在应用包里 | 改本仓库，再 `pnpm start` / 重装 | 重启应用 |
| **harness 本体**（`@deepseek-ai/*`） | 冻结在应用包里 | 用 harness 源码 checkout（见下） | 重启应用 |

"冻结"这两层恰恰是优点：安装版是**可复现的产物**，所以插件层的折腾永远不会把底下的运行时改坏一半。

## 具体做法

### 对着安装版开发客户端插件

```sh
# 一次性：把 profile 指向你的工作副本（用你 PATH 上的 pnpm）
dsh plugin --profile web add link:~/Projects/neo-dsh/plugins/activity-line

# 之后的循环：改 client.js → 应用里按 ⟳ → 刷新页面
```

安装版自带的 `dsh` 能这么用，是因为 `dsh plugin` 只是包了一层 pnpm；打包的运行时**故意不带自己的 npm/npx**。

### 用一个 dev 窗口看改动

`scripts/dev-window.sh` 会**直接从这份代码仓库**起一个真窗口，不碰安装版、也不碰你正在用的应用。它给 Electron 单独的 `--user-data-dir`（共用真的那个会和正在跑的应用抢 Chromium 的 SingletonLock）；数据目录则通过这个 profile 自己的 `desktop-config.json` 指到 `/tmp/neo-dev-home`——也就是「设置 → 通用 → 数据位置」写的那份文件，所以 dev 窗口走的是真实的位置解析顺序，而不是 `DSH_HOME` 这个开发覆盖项；端口用一个空闲的本地端口。`/tmp` 里的 home 一开始是空的，由应用自己的「从 `~/.dsh` 迁移」逻辑在首次启动时填上——和安装版跑的是同一条代码路径（想看版本门控的那次合并，把 `apps/desktop/package.json` 的版本号改一下再启动即可）。`DSH_DESKTOP_FORCE_BUNDLED=1`（脚本会设）会让随包插件在版本号没变时也重新复制一份，所以改完 `plugins/*/client.js` 不用改版本号就能在 dev 窗口看到。

```sh
pnpm run test                    # 秒级，先过逻辑
bash scripts/dev-window.sh       # 再看界面：端口 3199，home 是隔离副本
```

界面类的改动物测不出来：按钮白底白字、窗口被重建时顺手退出、某一行渲染错了位置——单测都看不见，靠"发出去让别人截图"来发现又太慢。再跑一次脚本会先清掉上一次：**它的 host 只以"占着端口"的形式存在**，只杀 shell 会把它留下来，下次启动就会死在 EADDRINUSE。

### 前端各有一套数据目录

0.1.12 起桌面应用有自己的数据目录（见 README「数据放在哪」）。终端里的 `dsh`（TUI / headless / 插件管理）在 Linux 上由 `~/.local/bin/dsh` 启动，那个 wrapper 把它的 `DSH_HOME` 设到 `${XDG_DATA_HOME:-~/.local/share}/dsh-tui`：**两个前端各自一套会话、凭证和设置，谁都不会写对方的会话库。**两个 host 共用一份 home 会损坏会话日志。wrapper 在没给子命令时会补上 `--profile dsh-tui`，所以直接敲 `dsh` 就是 TUI；显式 `--profile` 和 `plugin` 这类子命令原样透传。

插件集**按 profile 分，不按 home 分**，所以"GUI 插件在 TUI 里没用"不需要额外的同步机制：

| profile | 谁在用 | 内容 |
| --- | --- | --- |
| `web` | 桌面 app | `dsh-base` + `dsh-web-app` + 随包插件（activity-line、desktop-settings、dshmarket） |
| `dsh-tui` | 终端 TUI | `dsh-base` + `@deepseek-harness-tui/dsh-tui` |
| `headless` | `dsh --profile headless "…"` | `dsh-base` + `dsh-headless` |

要给**桌面端**装插件，把命令指向 app 的 home：

```sh
DSH_HOME=$(pnpm run --silent app-home) dsh plugin --profile web list
DSH_HOME=$(pnpm run --silent app-home) dsh plugin --profile web add link:/path/to/plugin
```

`pnpm run app-home` 打印的就是应用真正在用的目录（读的是 app 自己那份位置配置，所以在「设置 → 数据位置」改过之后它也跟着变）。要让一个插件两边都有，就在两个 home 里各装一次、各用对应的 profile 名。

**一个坑：profile 没写 `patchReload` 时默认是 `live`，而它需要 Cordis HMR 服务，打包版又故意不含 HMR** —— 于是 `dsh --profile …` 会直接以 `user patch-layer watching requires the Cordis HMR service` 退出。随包的 `web` / `headless` profile 写的是 `"patchReload": "startup"`；由 harness 自己新建的 profile（例如早期的 `dsh-tui`）没有这一项，要手动补：

```json
"dsh": { "profile": { "bundles": ["…"], "patchReload": "startup" } }
```

### 改 UI 时要看控制台

```sh
DSH_DESKTOP_DEVTOOLS=1 neo-dsh      # 打开独立 DevTools 窗口（smoke 模式会忽略）
```

插件自己的报错都会出现在那里。记住 host 会缓存已组装的插件 bundle：改完要先 ⟳，再刷新页面。

### 开发外壳本身

```sh
cd ~/Projects/neo-dsh
pnpm --dir apps/desktop install
node scripts/build-resources.mjs
pnpm run start                       # 开发态：用 PATH 上的 node，资源就地读取
DSH_HOME=/tmp/scratch DSH_DESKTOP_PORT=3199 DSH_DESKTOP_SMOKE=1 pnpm run start
```

`DSH_DESKTOP_SMOKE=1` 会启动、打印一行窗口/布局事实、失败时以非零码退出——CI 用的就是这个形状。

### 开发 harness 本体

让安装版直接跑另一个 harness 构建，不必重新打包：

```sh
DSH_DESKTOP_DSH_BIN=/path/to/checkout/lib/bin.js \
DSH_NODE=~/.nvm/versions/node/v22.23.1/bin/node neo-dsh
```

实际用的是哪个构建，会写进 `$DSH_HOME/desktop.log` 的 `starting host: …` 一行，绝不会有歧义。

### 管理安装版的插件

```sh
dsh plugin --profile web list
dsh plugin --profile web add <名称|link:路径|github:用户/仓库|file:*.tgz>
dsh plugin --profile web remove <名称>
```

这些都改的是 `$DSH_HOME/profiles/web`——同一台机器上所有 dsh 前端（CLI、TUI、桌面端）共享同一份插件集合。

## Neo DSH 能自己开发自己吗？

**插件层和 preset 层：可以。** 跑在应用里的 agent 完全可以写出一个插件目录、用 `dsh plugin --profile web add link:<路径>` 注册它，然后 host 重启后它就生效了。这也包括**客户端插件**——正在渲染 UI 的东西可以扩展自己的 UI。preset 是每个会话读取的，所以新 preset 下个会话就生效，连重启都不用。

**外壳层和 harness 层：运行时不行。** 它们在 `~/.local/opt/neo-dsh` 里是构建产物。就地改也能"生效到下次安装为止"，但正在运行的进程不会因此改变——老实说，正确回路是：改仓库 → 重新构建 → 重新安装。

harness 自带的自我检视工具（`dsh-tool-cordis`、设置里的插件清单）可以用来查看自己挂载了什么，这算是"自我修改"里真正有用的那一半：看清自己的组合。

### 对 vendored harness 的补丁

`scripts/patch-harness.mjs` 把几处来不及推上游的本地修复应用到 `node_modules/@deepseek-ai/*`。
它挂在 `pnpm run install:app` 和 `pnpm run resources`（所有构建与打包脚本都会走）上，所以一次全新的
安装和每个产物都会带上；`--check` 在补丁缺失时失败，锚点找不到时也会**大声失败**，而不是悄悄发一个
没有修复的版本。

目前它给 `dsh-host-open-in-app` 里两条 Linux 条目补上了 desktop 条目 id
（`filemanager` → `org.gnome.Nautilus`，`androidstudio` → `android-studio`）：没有这个 id，
插件根本不会去找图标，那两行无论系统装得多好都是空白。注意这个包**既有预打包的 `lib/index.js`、
也有旁边拆分出来的源文件**，而运行时加载的是 bundle —— 两个文件都得打，这正是这个脚本要把这件事
收在一处的原因。

给已安装的那份打补丁：`--package-dir <app>/node_modules/@deepseek-ai/dsh-host-open-in-app`。

### 网络代理

harness host 是个 Node 进程，而 Node 默认**不读** `http_proxy`——必须显式告诉它
（`NODE_USE_ENV_PROXY=1`）。于是用着 Clash 这类显式代理时，模型请求会直接超时，而旁边的浏览器
一切正常，很容易误判成"应用没网"。

外壳现在自己解析代理，并把一套真正有效的环境交给 host 和自己（更新检查也走同一条路）：

* 优先用 设置 → 通用 → **网络代理** 里的显式选择（`system` / `direct` / 手填地址），存在
  `$DSH_HOME/desktop-preferences.json`；
* 其次是应用启动时继承的环境变量；
* 再次才是桌面自己的设置：Linux 读 `gsettings org.gnome.system.proxy`，macOS 读
  `scutil --proxy`，Windows 读注册表 `Internet Settings`。

`loopback`（`localhost` / `127.0.0.1` / `::1`）永远会被加进 `no_proxy`，否则窗口连不上自己的
host。改这一行会重启 host 让新环境生效，解析结果会写进日志：
`proxy: system → http://127.0.0.1:7897 (desktop settings)`。

`src/proxy-env.mjs` 里是解析与判定，带单测；整条链路是在 Clash 后面启动应用、再读 host 进程的
环境验证的。

### 安全模式

插件或设置文件加载不了时，就没有窗口可以拿来修它，所以需要一条"只用随包内容"的启动路径：

* `--safe`（或 `DSH_DESKTOP_SAFE=1`）会使用 `profiles/web-safe`：每次启动都从
  `resources/profile-web` 重新播种，并把随包插件物化进它的 `node_modules`。用户自己的 profile
  既不会被读、也不会被写。
* 解析不了的 `settings.yaml` 会被改名成 `settings.yaml.broken-<时间戳>`，随包的默认值顶上。
* 连续两次启动失败（记在数据目录的 `desktop-boot.json` 里）会让下次启动询问是否用安全模式；
  窗口一旦加载成功就把计数清零。
* 退出安全模式会先体检 `profiles/web`：清单解析不了、或某个 bundle 解析不到，就把问题报出来，
  并可以修复它——挪成 `profiles/web.broken-<时间戳>`，用随包的那份顶上。

`src/boot-guard.mjs` 里是这些判定（标志、计数、设置修复、profile 体检与修复），都带单测。

### 宿主的端口，以及守着它的东西

窗口只连一个 harness 宿主、只用一个固定端口。宿主如果比它的外壳活得久，就会一直占着这个
端口，之后每次启动都死在 EADDRINUSE 上，表现成"the host exited before it was ready"。
两层东西防这件事：

* 宿主启动时带 `--require src/host-watchdog.cjs`，外壳通过 `DSH_HOST_PARENT_PID` 告诉它
  自己是哪个 pid，并打上 `DSH_DESKTOP_HOST=1` 标记。当那个 pid 不再是它的父进程时，宿主
  自己退出。外壳被 SIGKILL（没有任何清理机会）时，只有这一层还管用。
* 启动宿主之前，外壳先探测端口。空着是常态；能证明是自己的宿主（`$DSH_HOME` 里的
  `desktop-host.json`，或那个标记）而且外壳已经不在了，就停掉它并等端口松开；其余的会把
  pid 和命令行摆到用户面前让他决定，而不是擅自杀掉。`DSH_DESKTOP_PORT` 可以整体换端口，
  代价是渲染进程的 localStorage 会重置（origin 包含端口）。

`ensureHostPort`、`isOrphan`、`portAction` 在 `src/host-guard.mjs` 里，有单测；看门狗有一个
真实进程的测试：杀掉它的父进程，然后等它自己离开。

## 环境变量

| 变量 | 作用 |
| --- | --- |
| `DSH_HOME` | harness home。优先级高于「设置 → 通用 → 数据位置」，后者又高于平台默认（Linux 是 `~/.local/share/neo-dsh`）。开发用逃生舱 |
| `DSH_DESKTOP_PORT` | 固定的 host 端口（默认 3081）。别改来改去：origin 里包含端口 |
| `DSH_NODE` | 跑 host 用的 Node（打包时默认是内嵌运行时） |
| `DSH_DESKTOP_DSH_BIN` | 用另一个 harness 构建作为 host |
| `DSH_DESKTOP_DEVTOOLS` | `1` 启动时打开 DevTools |
| `DSH_DESKTOP_NO_SEED` | `1` 跳过播种随包的 profile/preset/设置 |
| `DSH_DESKTOP_SAFE` | `1` 用安全模式打开（等同 `--safe`）：只加载随包 profile |
| `http_proxy` / `https_proxy` / `no_proxy` | 启动时读取，解析出的代理会交给 host（见「网络代理」） |
| `DSH_DESKTOP_NO_MIGRATE` | `1` 不把已存在的 `~/.dsh` 搬进新 home |
| `DSH_HOST_PARENT_PID` / `DSH_HOST_WATCHDOG_MS` | 外壳给宿主设的（看门狗用），不是给人设的 |
| `DSH_DESKTOP_FORCE_BUNDLED` | `1` 版本号没变也重新复制随包插件（dev 窗口用） |
| `DSH_DESKTOP_MIN_WIDTH` / `_HEIGHT` | 可选的窗口下限（不设＝没有下限） |
| `DSH_DESKTOP_SMOKE` | `1` 启动→报告→退出；`_SMOKE_CRASH=1` 额外测试渲染进程自恢复 |

## 值得记住的坑

- **host 会缓存已组装的插件 bundle。** 改完插件只刷新页面是没用的，必须重启 host（⟳）。
- **绝不要用同一个 `$DSH_HOME` 同时跑两个 host。** 两个写入者会损坏同一个会话日志。端口冲突反而是小问题。
- **profile 没写 `dsh.profile.patchReload` 时默认是 `live`**，而它需要 Cordis HMR 服务。打包版**故意排除了** `@deepseek-ai/cordis-plugin-hmr`（原因见 [packaging.md](packaging.md)），而它播种的 profile 写的是 `patchReload: "startup"`。
- **preset 必须是真目录。** harness 用 `readdir(dir, { withFileTypes: true })` 扫描
  `$DSH_HOME/.agent-presets`，凡是 `child.isDirectory()` 为 false 的一律跳过——而
  **指向目录的软链就是 false**。这个失败是静默的：`startSession()` 只把错误写进
  `console.warn("new session failed: …")`，于是点"新建会话"看起来毫无反应，而 host 报的是
  `agent-preset/not-found`。想保持单一源头，就把 preset 做成**真目录**、把里面的**文件**
  做成软链（`stat` 会跟随文件软链，加载器读得到）。
- **仓库需要 Node 22**（`.nvmrc`、`engines`、`scripts/check-node.mjs`）。安装版不受影响：它自带 Node。
