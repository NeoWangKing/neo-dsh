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

`scripts/dev-window.sh` 会**直接从这份代码仓库**起一个真窗口，不碰安装版、也不碰你正在用的应用。它给 Electron 单独的 `--user-data-dir`（共用真的那个会和正在跑的应用抢 Chromium 的 SingletonLock）；数据目录则通过这个 profile 自己的 `desktop-config.json` 指到 `/tmp/neo-dev-home`——也就是「设置 → 通用 → 数据位置」写的那份文件，所以 dev 窗口走的是真实的位置解析顺序，而不是 `DSH_HOME` 这个开发覆盖项；端口用一个空闲的本地端口。`/tmp` 里的 home 一开始是空的，由应用自己的「从 `~/.dsh` 迁移」逻辑在首次启动时填上——和安装版跑的是同一条代码路径。`DSH_DESKTOP_FORCE_BUNDLED=1`（脚本会设）会让随包插件在版本号没变时也重新复制一份，所以改完 `plugins/*/client.js` 不用改版本号就能在 dev 窗口看到。

```sh
pnpm run test                    # 秒级，先过逻辑
bash scripts/dev-window.sh       # 再看界面：端口 3199，home 是隔离副本
```

界面类的改动物测不出来：按钮白底白字、窗口被重建时顺手退出、某一行渲染错了位置——单测都看不见，靠"发出去让别人截图"来发现又太慢。再跑一次脚本会先清掉上一次：**它的 host 只以"占着端口"的形式存在**，只杀 shell 会把它留下来，下次启动就会死在 EADDRINUSE。

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

## 环境变量

| 变量 | 作用 |
| --- | --- |
| `DSH_HOME` | harness home。优先级高于「设置 → 通用 → 数据位置」，后者又高于平台默认（Linux 是 `~/.local/share/neo-dsh`）。开发用逃生舱 |
| `DSH_DESKTOP_PORT` | 固定的 host 端口（默认 3081）。别改来改去：origin 里包含端口 |
| `DSH_NODE` | 跑 host 用的 Node（打包时默认是内嵌运行时） |
| `DSH_DESKTOP_DSH_BIN` | 用另一个 harness 构建作为 host |
| `DSH_DESKTOP_DEVTOOLS` | `1` 启动时打开 DevTools |
| `DSH_DESKTOP_NO_SEED` | `1` 跳过播种随包的 profile/preset/设置 |
| `DSH_DESKTOP_NO_MIGRATE` | `1` 不把已存在的 `~/.dsh` 搬进新 home |
| `DSH_DESKTOP_FORCE_BUNDLED` | `1` 版本号没变也重新复制随包插件（dev 窗口用） |
| `DSH_DESKTOP_MIN_WIDTH` / `_HEIGHT` | 可选的窗口下限（不设＝没有下限） |
| `DSH_DESKTOP_SMOKE` | `1` 启动→报告→退出；`_SMOKE_CRASH=1` 额外测试渲染进程自恢复 |

## 值得记住的坑

- **host 会缓存已组装的插件 bundle。** 改完插件只刷新页面是没用的，必须重启 host（⟳）。
- **绝不要用同一个 `$DSH_HOME` 同时跑两个 host。** 两个写入者会损坏同一个会话日志（这台机器的历史里就有因此产生的 `corrupt-backup` 文件）。端口冲突反而是小问题。
- **profile 没写 `dsh.profile.patchReload` 时默认是 `live`**，而它需要 Cordis HMR 服务。打包版**故意排除了** `@deepseek-ai/cordis-plugin-hmr`（原因见 [packaging.md](packaging.md)），而它播种的 profile 写的是 `patchReload: "startup"`。
- **preset 必须是真目录。** harness 用 `readdir(dir, { withFileTypes: true })` 扫描
  `$DSH_HOME/.agent-presets`，凡是 `child.isDirectory()` 为 false 的一律跳过——而
  **指向目录的软链就是 false**。这个失败是静默的：`startSession()` 只把错误写进
  `console.warn("new session failed: …")`，于是点"新建会话"看起来毫无反应，而 host 报的是
  `agent-preset/not-found`。想保持单一源头，就把 preset 做成**真目录**、把里面的**文件**
  做成软链（`stat` 会跟随文件软链，加载器读得到）。
- **仓库需要 Node 22**（`.nvmrc`、`engines`、`scripts/check-node.mjs`）。安装版不受影响：它自带 Node。
