# Neo DSH desktop shell

**English** · [中文](README.zh-CN.md)

The Electron half of [Neo DSH](../../README.md): it owns the native window and the
harness host's lifecycle, and nothing else. The harness runs as a plain Node child
process (`dsh web --no-open --port 3081`), never inside Electron — its prebuilt
native addons are bound to plain Node's ABI.

Read the [root README](../../README.md) for the whole picture and
[docs/packaging.md](../../docs/packaging.md) for how a package is assembled.

## Working in here

```sh
pnpm install                    # this app's own install; hoisted on purpose
node ../../scripts/build-resources.mjs
pnpm start                      # dev: host under `node` on PATH, resources read in place
DSH_HOME=/tmp/check DSH_DESKTOP_PORT=3199 DSH_DESKTOP_SMOKE=1 pnpm start
```

| File | Role |
| --- | --- |
| `src/main.mjs` | window, host spawn, seeding `$DSH_HOME`, crash recovery, smoke mode |
| `electron-builder.yml` | targets (`AppImage`/`deb`/`zip`, `dmg`, `nsis`), `extraResources`, signing hooks |
| `resources/` | what ships beside the code (profile, preset, settings defaults, Node runtime) |
| `scripts/` | `probe-host.mjs` (host readiness check), `install.sh`/`uninstall.sh` (dev install), `gen-icon.mjs` |
| `assets/icon.svg` | the project's mark: a whale (the DeepSeek anchor) carrying an N drawn as a node graph, plus an amber spark. Hand-authored — not DeepSeek's logo, but deliberately still a whale |
| `build/icon.png` | 1024px render of it, from `scripts/gen-icon.mjs`; electron-builder derives `.icns`/`.ico` from here |

Environment knobs: `DSH_HOME`, `DSH_NODE`, `DSH_DESKTOP_PORT`,
`DSH_DESKTOP_MIN_WIDTH`/`_HEIGHT`, `DSH_DESKTOP_NO_SEED`, `DSH_DESKTOP_SMOKE`,
`DSH_DESKTOP_SMOKE_CRASH`.
