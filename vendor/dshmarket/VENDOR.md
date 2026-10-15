# dshmarket 的随包 vendor

`dshmarket` 是第三方插件（上游 `dsh-market/dsh-market`，npm 包名就是 `dshmarket`），不是本仓库的代码。
这里放的是它的**发布包 + 运行时依赖**，随桌面端一起分发。

## 为什么是 vendor，而不是写成普通 npm 依赖

桌面端分发插件的机制是 `file:vendor/<name>`：`scripts/build-resources.mjs` 把目录拷进
`apps/desktop/resources/profile-web/vendor/`，首次启动由 `src/main.mjs` 的
`syncBundledPlugins()` 铺进活 profile 的 `node_modules/`。**安装时不跑 pnpm** —— 这正是
`build-resources.mjs` 里那句 "the plugin has no dependencies of its own to install" 的前提。

而 `dshmarket` 有两个运行时依赖，所以必须**连依赖一起**放进它自己的 `node_modules/`，让它自包含：

```
vendor/dshmarket/
  ├─ lib/ client/ locale/ …     ← dshmarket 自己的发布内容
  └─ node_modules/
       ├─ js-yaml/              ← dshmarket 的直接依赖
       ├─ undici/               ← dshmarket 的直接依赖（自身无依赖）
       └─ argparse/             ← js-yaml 的依赖，提升到这一层
                                   （与 profile 的 nodeLinker: hoisted 一致）
```

`@deepseek-ai/*` 那三个 peer **不**在这里 —— 它们由宿主的 harness 提供，和其它插件一样。

## 版本

改动时同步更新这张表，并核对 sha256。

| 包 | 版本 | tarball sha256 |
| --- | --- | --- |
| `dshmarket` | 1.66.22 | `0a2151cd2bd8fe3d2e5eff3f108c1fa2eacf31c33b483ff5546e5191096b31b7` |
| `js-yaml` | 4.3.2 | `c7b241d2224cf9253ff53854aa4cee87da91bd889c4d0fa3a3ffd1041ecee5b1` |
| `argparse` | 2.0.1 | `27903847fc8215e6fc5a33e81490f7baba66403f8aade33771b988cca097728c` |
| `undici` | 7.30.0 | `afa0d7be8598012c601fff7ed0fdea01868184f5a223a6f656a4fce1da077819` |

**版本下限是有原因的**：老版本（如 `1.45.1`）的 peer 范围只到 `^0.1.x`，harness 0.2 会
**跳过它**并打一行日志 —— 表现为"装上了但不生效"。`1.66.22` 在 `0.2.0-rc.2` 上实测可加载。

## 重新 vendor

```sh
cd /tmp && rm -rf dmv && mkdir -p dmv/tars dmv/out && cd dmv/tars
for spec in dshmarket@1.66.22 js-yaml@4.3.2 argparse@2.0.1 undici@7.30.0; do
  npm pack "$spec"
done

cd ../out
tar xzf ../tars/dshmarket-1.66.22.tgz && mv package dshmarket
mkdir -p dshmarket/node_modules
for name in js-yaml argparse undici; do
  mkdir -p "dshmarket/node_modules/$name"
  tar xzf "../tars/${name}-"*.tgz -C "dshmarket/node_modules/$name" --strip-components=1
done

rsync -a --delete dshmarket/ ~/Projects/neo-dsh/vendor/dshmarket/
sha256sum ../tars/*.tgz   # 与上表核对
```

## 校验

```sh
cd ~/Projects/neo-dsh/vendor/dshmarket
node -e '
const {createRequire} = require("module");
const r = createRequire(process.cwd() + "/lib/index.js");
for (const m of ["js-yaml", "undici", "argparse"]) console.log("✓", m, "→", r.resolve(m));
'
```

三个都要解析成功，其中包括 `js-yaml` 找 `argparse` 这条传递依赖。

## 上游升级时要注意

- `npm pack` 尊重包自己的 `files` 白名单，解出来就是 npm 会装的东西 —— **不要**手工裁剪，
  否则容易漏掉运行时要用的文件。
- `dshmarket` 的 `dsh` 字段声明了 `bundle.patch` 与 `client.inject`（依赖宿主的
  locale / UI settings / theme 三个包）。
- 它随包时是**依赖**（进 `profile-web/package.json` 的 `dependencies`，**不**进
  `dsh.profile.bundles`），所以装完出现在插件页、由用户自己开启 —— 与 `dsh-ops` 同一套语义。

## 再加一个「自带依赖」的插件时

`keepNodeModules`（构建侧保留嵌套 `node_modules`）**不是全部**。`.gitignore` 第 2 行是
`node_modules/`，它匹配任意层级，所以还必须**同时**加一条反忽略规则：

```
!vendor/<name>/node_modules/
```

两个细节容易写错：

- 必须指名**目录本身**。git 不会进入被忽略的父目录，写 `!vendor/<name>/node_modules/**`
  是**无效的**。
- 反忽略规则要写在 `node_modules/` **之后**（后面的规则覆盖前面的）。

漏了这一半的表现极具迷惑性：**构建正常、dev 窗口正常、只看工作区的测试也正常**，
只是 `git add` 收不到那些文件 —— 提交出去的是一个没有依赖的插件，克隆和 CI 构建才会暴露。
`scripts/test/vendor-payloads.test.mjs` 会检查这对前提，缺了就报错。
