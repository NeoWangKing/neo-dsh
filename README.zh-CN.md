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

产物**默认未签名**。macOS 首次需右键 → 打开；Windows 会弹 SmartScreen 的"未知发布者"。签名走 electron-builder 的常规环境变量（`CSC_LINK`、`CSC_KEY_PASSWORD`，以及 Apple 公证的三件套）——详见 [docs/packaging.md](docs/packaging.md)。

## 日常操作

| 想做的事 | 怎么做 |
| --- | --- |
| 升级 harness 版本 | `pnpm --dir apps/desktop add @deepseek-ai/dsh@<版本> && node scripts/sync-peers.mjs`，然后重新构建 |
| 改随包的 profile | 编辑 `apps/desktop/resources/profile-web/package.json`（`dsh.profile.bundles`），重跑 `build-resources`，再构建 |
| 再随包带一个插件 | 放进 `plugins/`，加进 `build-resources.mjs`，并在 profile 的 bundles 里列出 |
| 用独立的状态目录 | 应用读 `$DSH_HOME`；设成别的路径即可与 CLI 的 `~/.dsh` 分开 |
| 校验生成的依赖清单 | `node scripts/sync-peers.mjs --check`（harness 升级带来新 peer 时 CI 会失败） |
| 跳过播种 | `DSH_DESKTOP_NO_SEED=1` |
| 换端口 | `DSH_DESKTOP_PORT=3198` |
| 诊断 | `DSH_DESKTOP_SMOKE=1` 会启动、报告窗口/布局事实、失败时以非零码退出 |

## 已知限制

- **产物未签名** —— 见上。
- **体积** —— 解包后约 650 MB / 每个安装包 250–350 MB：Electron、完整 harness 依赖树、125 MB 的 Node 运行时。运行时的体积就是"不要求用户装 Node"的代价。
- **没有自动更新。** 升级 = 装一个更新的产物。
- **profile 只播种一次。** 已存在的 `$DSH_HOME/profiles/web` 不会被改动，包括它的插件集合。

## 仓库与自动化

仓库在 <https://github.com/NeoWangKing/neo-dsh>。各工作流的行为：

| 工作流 | 触发 | 说明 |
| --- | --- | --- |
| `build` | 每次 push 到 `main` | 构建 **Linux**（AppImage + deb + zip）并作为 artifact 上传。macOS 与 Windows 默认不跑，除非用 `workflow_dispatch` 指定 `platforms=mac` / `platforms=win`。 |
| `build` | tag `v*` | 同样的构建，外加把所有产物挂到 GitHub Release。 |
| `publish-plugin` | push/PR 涉及 `plugins/activity-line/**` | 跑插件测试，并断言 npm tarball 里必须有 `index.js`、`client.js`、`cordis.patch.yml`。 |
| `publish-plugin` | tag `plugin-v*` | 对 `dsh-activity-line` 执行 `npm publish --provenance`。需要仓库 secret `NPM_TOKEN`（npm automation token）；没配的话发布任务失败，但检查任务仍会通过。 |

发布 Release 那一步需要 `permissions: contents: write`，工作流里已声明：新仓库默认的 token 是只读的，否则会在**构建成功之后**以 `Resource not accessible by integration` 失败。

发版：

```sh
git tag v0.1.0 && git push origin v0.1.0                  # 桌面安装包 → GitHub Release
git tag plugin-v1.0.0 && git push origin plugin-v1.0.0    # 插件 → npm
```

两个 tag 相互独立：桌面的版本号和插件的版本号各走各的节奏。
