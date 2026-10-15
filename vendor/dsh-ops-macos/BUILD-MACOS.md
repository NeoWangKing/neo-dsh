# dsh-ops 的 macOS arm64 本地构建

上游 `T-Auto/dsh-ops` 只发布 Windows x64（README 明说"其它平台/架构未交付，不在兼容承诺内"），
但它的 Rust worker 与打包脚本本身是跨平台的，所以 macOS 上可以自己编。

本目录与 `vendor/dsh-ops-linux/` 是同一个上游提交的两份平台构建，除 `runtime/` 与下面那两处外
**逐字节一致**——改动越少，上游升级时越好跟。

## 来源
- `github.com/T-Auto/dsh-ops` main = `6e133320b4f7a81c289e05ff6afddc740cdef36e`（0.3.0），
  与 `vendor/dsh-ops-linux/` 是同一个提交。
- macOS 上直连 GitHub 正常，`git clone --depth 1` 取得（Linux 那台需要走 `ghfast.top` 镜像，
  见 `BUILD-LINUX.md`）。
- worker 在 macOS 27.0 / arm64 上用 Homebrew 的 `cargo 1.99.0` 构建。

## 改了两处（就这两处）
1. `lib/ptc/runtime.js`：`PLATFORMS = ['win32-x64']` → `['win32-x64', 'darwin-arm64']`
   （这是运行时唯一的平台白名单；`workerName()` 本来就会给非 win32 选无扩展名的 `dsh-ops-worker`）
2. `package.json`：`os: ['win32'] / cpu: ['x64']` → `os: ['darwin'] / cpu: ['arm64']`

`bin/native-runtime.mjs` **不需要改**：它自带 darwin-* 的分支，会校验 Mach-O magic、arm64 机器码、
并写 `runtime/<target>/provenance.json`（含 sha256）。

`native/` 源码不进仓库——和 Linux 那份一样，这是**产物目录**，不是源码目录。

## 构建
需要 Rust ≥ 1.88（crate 的 `rust-version`）。在源码 checkout 的根目录：

```sh
cd native && cargo build --release          # → native/target/release/dsh-ops-worker
cd .. && node bin/native-runtime.mjs stage --platform darwin-arm64
node bin/native-runtime.mjs check --platform darwin-arm64   # 校验 Mach-O + provenance
```

`stage` 把 worker 拷进 `runtime/darwin-arm64/` 并写 `provenance.json`；`check` 会校验 Mach-O 头
与每个摘要。`lib/ptc/runtime.js` 的 `resolveWorker()` 每次加载都读这份回执，所以**源码改动后
忘记 stage 会 fail-closed**，不会静默跑旧二进制。

## 安装（装进当前 profile）
```sh
NODE="/Applications/Neo DSH.app/Contents/Resources/node/bin/node"
DSH="/Applications/Neo DSH.app/Contents/Resources/app/node_modules/@deepseek-ai/dsh/lib/bin.js"
DSH_HOME="$HOME/Library/Application Support/neo-dsh" \
  "$NODE" "$DSH" plugin --profile web add "file:$PWD/vendor/dsh-ops-macos"
```

注意 macOS 上 `DSH_HOME` 是 `~/Library/Application Support/neo-dsh`，**不是** `~/.dsh`
（后者只是旧版本留下的、启动时会被合并进来的目录）。装完要重启应用才会加载。

## macOS 上能用 / 不能用
- ✅ 原生文件工具：`ops_glob`、`ops_grep`、`ops_inspect_local_file`、`ops_replace`（Rust worker，实测可用）
- ⛔ `ops_bash` / pwsh 路由：Windows 专用载荷（MSYS bash IPC、PowerShell 7），**本移植没有启用**
  - 上游有 PR #67 打开了 macOS 的 shell 支持，但它要求给 `dsh-ops/shell` 配 `bashPath`
    （macOS 没有随包 shell 载荷，必须显式指定，否则 `ops_bash` 静默不发布）。而 profile 的补丁层
    是**平台无关**的，写死 `/opt/homebrew/bin/bash` 到 Linux 上会指向不存在的路径。
    要做得干净得先有「按平台覆盖 profile 补丁」的机制，见 `docs/roadmap.md`。
- ⛔ FastCtx 后台组件：依赖 `@dsh-ops/fastctx-win32-x64`，默认关闭
- ⚠️ PTC 工具（`ops_batch` / `ops_result`）默认关闭，需显式启用
- ⚠️ `/tmp` 在 macOS 上是符号链接（`/tmp` → `/private/tmp`），而这个 worker **拒绝穿越链接**。
  传给文件工具的路径要用规范形式（`/private/tmp/...`），否则报
  `POLICY_DENIED: Links, reparse points and special objects are not traversed`。这是它
  no-follow 的设计，不是缺陷。
- ⚠️ 上游升级后要重新走"取源码 → 打这两处补丁 → cargo build → stage"，`check` 会拦住忘记 stage 的情况
