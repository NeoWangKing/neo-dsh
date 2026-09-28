# Neo DSH

[![build](https://github.com/NeoWangKing/neo-dsh/actions/workflows/build.yml/badge.svg)](https://github.com/NeoWangKing/neo-dsh/actions/workflows/build.yml)

[English](README.en.md) · **中文**

Neo DSH 是 [DeepSeek Harness](https://www.npmjs.com/package/@deepseek-ai/dsh) 的桌面应用：
把 harness 的 Web 界面放进一个 Electron 窗口，输入框下方加一行活动提示，设置里加几行，
然后打成 Linux、macOS、Windows 的安装包。Node 运行时随包附带，装完不用再装别的。

harness 本身是依赖，不是分支。这个仓库里是外壳、两个客户端插件、一个 agent preset，
以及把它们组合起来的 profile。

## 安装

到 [Releases](https://github.com/NeoWangKing/neo-dsh/releases/latest) 下载对应平台的文件：

| 平台 | 文件 | 用法 |
| --- | --- | --- |
| Linux x64 | `neo-dsh-<版本>-linux-x86_64.AppImage` | `chmod +x` 后直接运行 |
| Linux x64 | `neo-dsh-<版本>-linux-amd64.deb` | `sudo dpkg -i <文件>` |
| Linux x64 | `neo-dsh-<版本>-linux-x64.zip` | 解压后 `./install.sh`，装到 `~/.local`，不需要 root |
| macOS arm64 | `neo-dsh-<版本>-mac-arm64.dmg` | 打开后把应用拖进"应用程序" |
| Windows x64 | `neo-dsh-<版本>-win-x64.exe` | 运行安装程序 |

安装包没有签名，所以第一次打开会被拦住：

```
「……无法打开，因为 Apple 无法检查其是否包含恶意软件」
  → 右键点应用 → 打开 → 确认一次。

「……已损坏，无法打开」
  → 这个弹窗没有「打开」按钮。文件并没有损坏，只是浏览器下载的 dmg 带了隔离标记，
    清掉再打开即可：
    xattr -dr com.apple.quarantine "/Applications/Neo DSH.app"
```

Windows 上出现的是 SmartScreen 的「未知发布者」：更多信息 → 仍要运行。

应用不附带凭证。设置 `DEEPSEEK_API_KEY`，或首次启动后在应用设置里登录。

## 功能

- **自我更新**：从本仓库的 release 升级，可手动检查，也可每 1/6/24 小时自动检查、
  自动下载（设置 → 通用 → Neo DSH 桌面版）。
- **独立的数据目录**：设置里的「数据位置」可以把它搬到别的文件夹（复制或移动）。
  首次启动会把 `~/.dsh` 里已有的数据复制过来，旧目录保持不动。
- **Linux 默认无边框**：平铺合成器用 Mod+拖动 这类修饰键移动窗口；想要标题栏就在
  设置 → 通用 → 窗口边框 里切回系统标题栏。
- **`activity-line`**：输入框下方那行活动提示，显示当前这一轮在做什么。
- **`desktop-settings`**：设置里的更新和数据位置两行。
- **`liangshen` preset**：人设、工具集和一个 todo-closer。

## 运行方式

窗口是 Electron，harness 不是。启动时外壳会：

1. 把随包的 profile、preset 和默认设置播种到数据目录，已存在的文件不动；
2. 用子进程拉起 harness host（`dsh web --no-open --port 3081`），打包版用内嵌的
   Node 22——harness 预编译的原生插件是给纯 Node 编译的，装不进 Electron 自带的 Node；
3. 从 host 的 stdout 读取就绪 URL（含一次性 token），在窗口里加载；
4. 退出时结束 host；界面右下角的 ⟳ 按钮重启它。

端口固定，是因为渲染进程把插件设置存在 localStorage 里，而 localStorage 按 origin 隔离，
端口属于 origin 的一部分。

## 数据放在哪

| 平台 | 默认位置 |
| --- | --- |
| Linux | `$XDG_DATA_HOME/neo-dsh`，通常是 `~/.local/share/neo-dsh` |
| macOS | `~/Library/Application Support/neo-dsh` |
| Windows | `%APPDATA%\neo-dsh` |

在那个目录里首次启动时，会把 `~/.dsh` 里已有的数据复制过来：会话、storages、附件、
profile、模型缓存、preset、`settings.yaml`、`.credentials.yaml`。旧目录不会被修改，
指向它的 harness CLI 照常能用。

之后的每个版本会把 `~/.dsh` 里新增的内容复制过来，并且永不覆盖应用目录里已存在的文件。
设置 → 通用 → 数据位置 里能看到当前路径，也可以整个搬走；`DSH_HOME` 的优先级最高。

## 开发

需要 Node 22 以上（`^22.19 || >=24`）和 pnpm 11。Node 20 跑不了 harness：没有
`node:sqlite`，原生插件 ABI 也不匹配。`scripts/check-node.mjs` 挂在每个脚本前面，
`.nvmrc` 写的是 22，带 nvm-on-cd 钩子的 shell 会自动切过去。

```sh
pnpm run install:app    # 装 Electron 和 harness
pnpm run start          # 组装资源，然后打开窗口
pnpm test               # 单元测试：插件、preset、更新器、数据目录
```

想在不碰安装版、也不碰自己真实数据的前提下看一处改动：

```sh
bash scripts/dev-window.sh
```

插件开发流程、环境变量、dev 窗口隔离了什么，见
[docs/development.zh-CN.md](docs/development.zh-CN.md)。

## 打包

```sh
pnpm run dist:linux     # 还有 dist:mac 和 dist:win
```

产物在 `apps/desktop/release/`。每个平台都要在各自的系统上打包，因为 harness 会拉取
平台相关的二进制文件：`.github/workflows/build.yml` 在每次推送到 `main` 时构建 Linux，
在 `v*` tag 上构建三个平台。发布就是打 tag：

```sh
git tag v0.1.13 && git push origin v0.1.13
```

构建未签名；签名走 electron-builder 的常规变量，见 [docs/packaging.md](docs/packaging.md)。

`activity-line` 插件单独发到 npm，用自己的 tag：
`git tag plugin-v1.0.1 && git push origin plugin-v1.0.1`。

## 目录结构

```
apps/desktop/             Electron 外壳：host 生命周期、更新器、数据目录、偏好
  resources/              首次启动播种的 profile、preset 和默认设置
plugins/activity-line/    客户端插件：输入框下方的活动行
plugins/desktop-settings/ 客户端插件：设置里的更新与数据位置两行
presets/liangshen/        agent preset
scripts/                  资源组装、Node 运行时下载、peer 清单、dev 窗口
packaging/linux/          zip 版用的 install.sh 与 uninstall.sh
docs/                     开发与打包说明
```

## 已知限制

- 构建未签名，macOS 和 Windows 首次打开都会警告。
- 体积：解包约 650 MB，每个安装包 250–350 MB。这是 Electron、harness 的整棵依赖树，
  以及 125 MB 的 Node 运行时。
- 只提供 macOS arm64；Intel 版需要交叉安装。
- Windows 安装包由 CI 构建，但还没在真实的 Windows 上运行过。
- 命令行 `dsh` 有自己的数据目录，终端里的会话和应用里的会话是分开的。

## 许可证

还没有 LICENSE 文件。在加上之前，保留所有权利。
