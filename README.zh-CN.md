# Neo DSH

[English](README.md) · **中文**

我自己的 [DeepSeek Harness](https://www.npmjs.com/package/@deepseek-ai/dsh) 桌面套件——一个仓库装下 Electron 外壳、我的客户端插件、我的 agent preset，以及它们随包发布的 profile 组合；再加上构建 Linux AppImage/deb/zip、macOS dmg、Windows 安装包所需的一切。

名字是我的（Neo Wang），harness 是 DeepSeek 的。这个仓库是**harness 外面的打包层和个人层**，不是 harness 的分支。

```
apps/desktop/          Electron 外壳：拉起 harness host，用原生窗口显示
plugins/activity-line/ 客户端插件：输入框下方那行"此刻在干什么"
presets/liangshen/     agent preset（人设、工具集、todo-closer）
apps/desktop/resources/
  profile-web/         首次启动时播种到 $DSH_HOME 的 web profile
  settings.defaults.yaml
scripts/               组装随包资源、拉取内嵌的 Node 运行时
.github/workflows/     各平台打包
```

## 应用是怎么跑起来的

窗口是 Electron，**harness 不是**。启动时外壳会：

1. 把随包附带的 profile、preset 和默认设置播种到 `$DSH_HOME`（默认 `~/.dsh`）——**已存在的文件一律不覆盖**，所以原本用 CLI 的机器会保留全部会话与设置；
2. 用子进程拉起 `node .../@deepseek-ai/dsh/lib/bin.js web --no-open --port 3081`；打包版用**内嵌的官方 Node 22**（绝不用 Electron 的 Node——harness 预编译的原生插件是按纯 Node 的 ABI 编译的）；
3. 从 host 的 stdout 解析就绪 URL（带一次性 token），在窗口里加载；
4. 退出时结束 host，点 ⟳ 时重启它。

端口固定是为了浏览器存储稳定——origin 由 scheme + host + **端口** 组成，随机端口会让每个插件的设置每次启动都被重置。

## 环境要求

- **使用现成安装包**：什么都不需要。Node、harness、profile 都在包里。
- **自行构建**：Node 22（`^22.19 || >=24`）——Node 20 **跑不了** harness（没有 `node:sqlite`，原生插件 ABI 也不匹配）。仓库对此有三道约束：根目录与 `apps/desktop` 的 `.nvmrc`、两个 manifest 的 `engines`、`apps/desktop/.npmrc` 的 `engine-strict`，以及挂在每个构建/运行脚本前的 `scripts/check-node.mjs`。`.nvmrc` 写的是 `22`，所以带 nvm-on-cd 钩子的 shell 一进目录就切过去；没有钩子就手动 `nvm use`。CI 和非交互 shell 不跑钩子，所以那几道约束仍然必要。
- **其他**：pnpm 11；Linux 打包还需要常规的 Electron 打包工具链。
- **API key**：应用不附带任何凭证。设置 `DEEPSEEK_API_KEY`，或首次启动后在应用设置里登录。

## 快速开始（开发）

```sh
pnpm --dir apps/desktop install     # app 自己的依赖（Electron + @deepseek-ai/dsh）
node scripts/build-resources.mjs    # 把 profile + preset + 插件装进 apps/desktop/resources
pnpm run start                      # 需要时播种 $DSH_HOME，然后打开窗口
```

开发态下 host 用 `PATH` 上的 `node`（可用 `DSH_NODE` 覆盖），随包资源直接从 `apps/desktop/resources` 读取，不需要打包步骤。

## 构建安装包

```sh
node scripts/fetch-node.mjs                  # 本平台的官方 Node 运行时（校验 SHA256）
node scripts/build-resources.mjs             # profile/preset/插件 载荷
pnpm --dir apps/desktop exec electron-builder --linux   # 或 --mac / --win
```

产物落在 `apps/desktop/release/`，命名形如 `neo-dsh-<版本>-<系统>-<架构>.<扩展名>`：

| 平台 | 目标 | 状态 |
| --- | --- | --- |
| Linux x64 | AppImage、deb、**zip + install.sh** | **已端到端验证**——三种产物都能启动、播种 `$DSH_HOME`、加载随包插件 |
| macOS arm64 | dmg | **已在 macos-14 runner 上验证**（arm64 的 `Neo DSH.app`、内嵌 `darwin-arm64` Node、原生插件架构正确） |
| macOS x64 | — | **明确不支持**：只做 Apple Silicon。GitHub 的 Intel runner 标签（`macos-13`）会无限排队，而 Intel 包需要在 `macos-14` 上做交叉装配 |
| Windows x64 | nsis 安装包 | 已配置；尚未在 Windows runner 上构建过 |

zip 是"不要安装器"的选项：解压后执行 `./install.sh`，它会把整棵树复制到 `~/.local/opt/neo-dsh`，并加上 `neo-dsh` 启动器、图标和菜单项——**不需要 root、不需要包管理器、不需要预装 Node**。`./uninstall.sh` 可反向卸载，默认保留 `$DSH_HOME`（加 `--purge` 才删）。

**故意不支持交叉构建**：harness 依赖一批平台特有的可选二进制（Landlock、node-addon-system、sharp、koffi、ripgrep），所以每个平台都由 `.github/workflows/build.yml` **在各自的系统上**打包。该工作流每次 push 都构建 Linux；mac/win 要等这些 runner 上的结果被验证过，才通过 `workflow_dispatch` 的 `platforms` 输入来跑。

产物**默认未签名**。签名走 electron-builder 的常规环境变量（`CSC_LINK`、`CSC_KEY_PASSWORD`，以及 Apple 公证的三件套）——详见 [docs/packaging.md](docs/packaging.md)——但没有证书时，macOS 首次启动会撞上 Gatekeeper，**两种提示的处理方式不一样**：

- 「无法验证开发者／无法检查是否包含恶意软件」——右键 app → **打开**，确认一次即可。
- 「**"Neo DSH.app" 已损坏，无法打开**」——这种对话框**没有"打开"按钮**（浏览器下载的 dmg 一定会被打上隔离标记）。文件其实没坏，清掉标记就好：

  ```sh
  xattr -dr com.apple.quarantine "/Applications/Neo DSH.app"
  ```

Windows 上会弹 SmartScreen 的"未知发布者"（更多信息 → 仍要运行）。

## 更新

Neo DSH 从**本项目自己的 release**（`NeoWangKing/neo-dsh`）更新自己——和 DeepSeek 官方 harness 的发布无关。设置 → 通用里会多出一行「**Neo DSH 桌面版**」：显示当前版本、手动「检查更新」、按固定间隔自动检查（1/6/24 小时）、「发现新版本后自动下载」开关，以及发现新版本时的弹窗。安装会下载对应平台的安装包 → 退出 → 由脱离进程的助手脚本就地覆盖 → 自动重启。

开关状态存在渲染进程的 localStorage 里（这也是 host 端口被固定的原因：端口属于 origin 的一部分）。**到"下载完成"为止的整条链都能不开界面验证**：

```sh
node apps/desktop/scripts/update-check.mjs              # 最新版本 + 本平台对应的安装包
node apps/desktop/scripts/update-check.mjs --download   # 顺便真的下载下来
DSH_DESKTOP_UPDATE_SMOKE=check  <打包后的可执行文件>      # 在外壳里跑同一套检查
DSH_DESKTOP_UPDATE_SMOKE=download <打包后的可执行文件>
```

### 窗口边框（Linux）

默认是**无边框**窗口：平铺合成器可以直接移动它（niri 是 Mod+拖动），界面自己画标题区。如果你的桌面环境需要一条真正的标题栏（没有修饰键拖动、也没有关闭按钮），在**设置 → 通用**里勾上「**使用系统标题栏**」即可——外壳会把选择存进 `$DSH_HOME/desktop-preferences.json` 并**立刻重建窗口**，不用重启应用。macOS 和 Windows 恒用系统原生边框：那里无边框窗口既没有红绿灯/最小化/关闭按钮，也没有可拖动的地方。

### 数据位置

会话、附件、凭证和设置都存在应用**自己的**目录里，不再是那个共享的 `~/.dsh`：

| 平台 | 默认位置 |
| --- | --- |
| Linux | `$XDG_DATA_HOME/neo-dsh`（通常是 `~/.local/share/neo-dsh`） |
| macOS | `~/Library/Application Support/neo-dsh` |
| Windows | `%APPDATA%\neo-dsh` |

在那个目录里首次启动时，应用会从 `~/.dsh` **复制**用户数据（会话、storages、附件、profile、模型缓存、preset、`settings.yaml`、`.credentials.yaml`、`.anonymous-user-id`、窗口偏好），并写下 `.migrated-from-dsh-home.json` 标记。旧目录原封不动：指向它的 harness CLI 仍然能用，只是从此看不到应用新建的会话。

**每次升级还会再合并一次。** 新版本第一次启动时，会把旧目录这段时间新增的东西（你用 CLI 或旧版本新建的会话）补进来，仅此而已：这里已存在的文件**绝不覆盖**，配置（`settings.yaml`、凭证、窗口偏好）也不会被重新读进来——这个 home 里的那份才是保持更新的那份。版本没变时连 `~/.dsh` 都不会打开。另外，如果 `.credentials.yaml` 的权限不止所有者可读，复制过来时会被收紧到 `600`；否则 harness 会拒绝启动。

**设置 → 通用 → 数据位置**会显示数据在哪、为什么在那里（默认位置 / 自定义位置 / 由 `DSH_HOME` 指定），并且可以搬家：选一个目录（必须是空的），然后选「复制并切换」（旧目录留作备份）或「移动并切换」（只删除复制成功的部分，日志留在原处）。应用会自己重启进新位置。这个选择记在 Electron user-data 目录里的 `desktop-config.json`（不能记在数据目录里面——一个指针没法描述它自己所在的目录），删掉这个文件、或把里面的 `dataHome` 清空就回到默认；`DSH_HOME` 优先级最高。

## 日常操作

| 想做的事 | 怎么做 |
| --- | --- |
| 升级 harness 版本 | `pnpm --dir apps/desktop add @deepseek-ai/dsh@<版本> && node scripts/sync-peers.mjs`，然后重新构建 |
| 改随包的 profile | 编辑 `apps/desktop/resources/profile-web/package.json`（`dsh.profile.bundles`），重跑 `build-resources`，再构建 |
| 再随包带一个插件 | 放进 `plugins/`，加进 `build-resources.mjs`，并在 profile 的 bundles 里列出 |
| 换一个状态目录 | 设置 → 通用 → 数据位置；或设 `DSH_HOME`（开发用的覆盖项，优先级高于设置里存的位置） |
| 校验生成的依赖清单 | `node scripts/sync-peers.mjs --check`（harness 升级带来新 peer 时 CI 会失败） |
| 跳过播种 | `DSH_DESKTOP_NO_SEED=1` |
| 换端口 | `DSH_DESKTOP_PORT=3198` |
| 诊断 | `DSH_DESKTOP_SMOKE=1` 会启动、报告窗口/布局事实、失败时以非零码退出 |
| 对着安装版继续开发 | 见 [docs/development.zh-CN.md](docs/development.zh-CN.md)：插件与 preset 都能就地改，所以应用可以扩展自己的 UI |

## 已知限制

- **产物未签名** —— 见上。
- **体积** —— 解包后约 650 MB / 每个安装包 250–350 MB：Electron、完整 harness 依赖树、125 MB 的 Node 运行时。运行时的体积就是"不要求用户装 Node"的代价。
- **命令行 `dsh` 仍然只用 `~/.dsh`。** 数据搬走之后，CLI 管的是旧目录；想让它俩共用，需要把 wrapper 指到新位置。
- **profile 只播种一次。** 已存在的 `$DSH_HOME/profiles/web` 不会被改动，包括它的插件集合。

## 仓库与自动化

仓库在 <https://github.com/NeoWangKing/neo-dsh>。各工作流的行为：

| 工作流 | 触发 | 说明 |
| --- | --- | --- |
| `build` | 每次 push 到 `main` | 构建 **Linux**（AppImage + deb + zip）并作为 artifact 上传。macOS 与 Windows 默认不跑，除非用 `workflow_dispatch` 指定 `platforms=mac` / `platforms=win`。 |
| `build` | tag `v*` | **三个平台全部构建**（Linux、macOS arm64、Windows），并把所有安装包挂到 GitHub Release。 |
| `publish-plugin` | push/PR 涉及 `plugins/activity-line/**` | 跑插件测试，并断言 npm tarball 里必须有 `index.js`、`client.js`、`cordis.patch.yml`。 |
| `publish-plugin` | tag `plugin-v*` | 对 `dsh-activity-line` 执行 `npm publish --provenance`。需要仓库 secret `NPM_TOKEN`（npm automation token）；没配的话发布任务失败，但检查任务仍会通过。 |

发布 Release 那一步需要 `permissions: contents: write`，工作流里已声明：新仓库默认的 token 是只读的，否则会在**构建成功之后**以 `Resource not accessible by integration` 失败。

发版：

```sh
git tag v0.1.2 && git push origin v0.1.2                  # 桌面安装包 → GitHub Release
git tag plugin-v1.0.0 && git push origin plugin-v1.0.0    # 插件 → npm
```

两个 tag 相互独立：桌面的版本号和插件的版本号各走各的节奏。
