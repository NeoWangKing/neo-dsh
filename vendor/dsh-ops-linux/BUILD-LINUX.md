# dsh-ops 的 Linux x64 本地构建

上游 `T-Auto/dsh-ops` 只发布 Windows x64（README 明说"其它平台/架构未交付，不在兼容承诺内"），
但它的 Rust worker 与打包脚本本身是跨平台的，所以 Linux 上可以自己编。

## 来源
- `github.com/T-Auto/dsh-ops` main = `6e133320b4f7a81c289e05ff6afddc740cdef36e`（0.3.0）
- 经 `https://ghfast.top/` 取 tarball（直连 GitHub 在这台机器上会静默截断），
  解出 435 个文件 = GitHub API 的 blob 数，校验通过。

## 改了两处（就这两处）
1. `lib/ptc/runtime.js`：`PLATFORMS = ['win32-x64']` → `['win32-x64', 'linux-x64']`
   （这是运行时唯一的平台白名单；`workerName()` 本来就会给非 win32 选无扩展名的 `dsh-ops-worker`）
2. `package.json`：`os: ['win32'] / cpu: ['x64']` → `os: ['linux'] / cpu: ['x64']`

`bin/native-runtime.mjs` **不需要改**：它自带 linux-* 的分支，会校验 ELF magic、x86_64 机器码、
并写 `runtime/<target>/provenance.json`（含 sha256）。

## 构建
```sh
cd native && cargo build --release          # → native/target/release/dsh-ops-worker
cd .. && node bin/native-runtime.mjs stage --platform linux-x64 --input native/target/release
node bin/native-runtime.mjs check --platform linux-x64   # 校验 ELF + provenance
```

## 安装（装进当前 profile）
```sh
NODE=~/.local/opt/neo-dsh/resources/node/bin/node
DSH=~/.local/opt/neo-dsh/resources/app/node_modules/@deepseek-ai/dsh/lib/bin.js
DSH_HOME=~/.local/share/neo-dsh $NODE $DSH plugin --profile web add file:$HOME/Projects/dsh-ops-linux
```

## Linux 上能用 / 不能用
- ✅ 原生文件工具：`ops_glob`、`ops_grep`、`ops_inspect_local_file`、`ops_replace`（Rust worker，实测可用）
- ⛔ `ops_bash` / pwsh 路由：Windows 专用载荷（MSYS bash IPC、PowerShell 7），Linux 上不发布
- ⛔ FastCtx 后台组件：依赖 `@dsh-ops/fastctx-win32-x64`，默认关闭
- ⚠️ PTC 工具（`ops_batch` / `ops_result`）默认关闭，需显式启用
- ⚠️ 上游升级后要重新走"取源码 → 打这两处补丁 → cargo build → stage"，`check` 会拦住忘记 stage 的情况
