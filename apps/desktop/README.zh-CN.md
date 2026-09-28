# Neo DSH 桌面外壳

[English](README.md) · **中文**

[Neo DSH](../../README.md) 的 Electron 部分：它只负责原生窗口和 harness host 的生命周期，别的什么都不管。harness 以**纯 Node 子进程**运行（`dsh web --no-open --port 3081`），绝不在 Electron 里跑——它预编译的原生插件是按纯 Node 的 ABI 编译的。

整体图景看[根 README](../../README.md)，打包细节看 [docs/packaging.md](../../docs/packaging.md)。

## 在这里干活

```sh
pnpm install                    # 本 app 自己的安装；故意用 hoisted 布局
node ../../scripts/build-resources.mjs
pnpm start                      # 开发态：host 用 PATH 上的 node，资源就地读取
DSH_HOME=/tmp/check DSH_DESKTOP_PORT=3199 DSH_DESKTOP_SMOKE=1 pnpm start
```

| 文件 | 作用 |
| --- | --- |
| `src/main.mjs` | 窗口、拉起 host、播种 `$DSH_HOME`、崩溃自恢复、smoke 模式 |
| `electron-builder.yml` | 目标（`AppImage`/`deb`/`zip`、`dmg`、`nsis`）、`extraResources`、签名钩子 |
| `resources/` | 随包附带的资源（profile、preset、默认设置、Node 运行时） |
| `scripts/` | `probe-host.mjs`（host 就绪探测）、`install.sh`/`uninstall.sh`（开发态安装）、`gen-icon.mjs` |
| `assets/icon.svg` | **经典 DeepSeek 鲸鱼**（蓝底白鲸）+ 右下角 **Neo** 角标，标明这是个人衍生版。由 harness 自带的鲸鱼路径加角标合成；`gen-icon.mjs` 不再自己去抓 favicon |
| `build/icon.png` | 由 `scripts/gen-icon.mjs` 从上面那份 SVG 渲染的 1024px 图；electron-builder 由它派生 `.icns`/`.ico` |

环境变量：`DSH_HOME`、`DSH_NODE`、`DSH_DESKTOP_PORT`、`DSH_DESKTOP_DSH_BIN`（用另一个 harness 构建当 host）、`DSH_DESKTOP_DEVTOOLS`、`DSH_DESKTOP_MIN_WIDTH`/`_HEIGHT`、`DSH_DESKTOP_NO_SEED`、`DSH_DESKTOP_SMOKE`、`DSH_DESKTOP_SMOKE_CRASH`。详见 [docs/development.zh-CN.md](../../docs/development.zh-CN.md)。
