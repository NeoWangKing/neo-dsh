# Packaging notes

Everything below is the reasoning behind the build configuration. The short
version is in the [README](../README.en.md).

## What goes into a package

| Part | Where it comes from | Where it lands |
| --- | --- | --- |
| Electron shell | `apps/desktop/src` | `resources/app` (asar **disabled**) |
| Harness + deps | `apps/desktop/node_modules` (the app's own `pnpm install`) | `resources/app/node_modules` |
| Node runtime | `scripts/fetch-node.mjs` (official build, SHA256-verified) | `resources/node` |
| Web profile | `apps/desktop/resources/profile-web` + `plugins/activity-line` | `resources/profile-web` |
| Agent preset | `presets/liangshen` | `resources/presets/liangshen` |
| Default settings | `apps/desktop/resources/settings.defaults.yaml` | `resources/settings.defaults.yaml` |

`scripts/fetch-node.mjs` and `scripts/build-resources.mjs` produce the last four;
both are idempotent and run in CI before electron-builder.

## Decisions and why

**asar is off.** The harness host is a plain Node child process, so
`node_modules/@deepseek-ai/dsh/**` has to exist as real files — inside an asar
archive only Electron's own runtime can read them. `asarUnpack` would work but
needs path rewriting between `app.asar` and `app.asar.unpacked` on every
resolve; unarchived costs install size and removes that whole failure class.

**The app owns its install.** `apps/desktop` is its own pnpm project
(`pnpm-workspace.yaml` inside it, `nodeLinker: hoisted`, lockfile committed).
A workspace-root install would hoist `node_modules` to the repo root, where
electron-builder cannot see it — it packs the *app* directory. Hoisted linking
is required because electron-builder walks real directories, not pnpm's symlink
farm.

**The plugin ships as `vendor/`, not `node_modules/`.** electron-builder filters
`node_modules` out of `extraResources` (it assumes the dependency walk already
covered it), so a hand-copied plugin under `profile-web/node_modules` silently
disappears from the package. Instead the payload carries
`profile-web/vendor/dsh-activity-line`, the profile declares it as
`file:vendor/dsh-activity-line`, and the shell materialises it into
`node_modules/` while seeding. That also keeps the payload free of symlinks and
keeps a later `dsh plugin --profile web add ...` working offline.

**`patchReload: "startup"` in the seeded profile.** The harness defaults custom
profiles to `"live"`, which watches the profile's patch layer through the Cordis
HMR service. In a packaged app that watch is pointless and, when an HMR plugin
happens to be installed but does not provide the service, it **kills the host**
(`dsh: user patch-layer watching requires the Cordis HMR service`, followed by
an unhandled rejection and exit code 1 — the window then shows "the dsh host
exited unexpectedly"). `"startup"` applies the patch files at boot and sets up
no watcher. This was found by running the packaged app, not by reading the
config: the same profile boots fine in a dev tree where the HMR plugin is simply
absent.

**Fixed port.** `DSH_DESKTOP_PORT` defaults to 3081 because browser storage is
scoped per origin, and the origin includes the port. A random port would reset
every plugin's localStorage on every launch.

**Node is bundled, in the official build.** Electron's Node is not an option:
the harness's native addons (Landlock sandbox, `node-addon-system`,
`node-addon-require-builtin`) are prebuilt for plain Node's ABI. `fetch-node`
also pins the version and verifies the release checksum, so a build either ships
exactly the runtime it claims or fails.

## Per-platform builds

The harness depends on platform-specific optional binaries, and pnpm 10+ does
not install transitive platform binaries:

- `node-addon-landlock-run-linux-x64` (Linux sandbox)
- `@deepseek-ai/node-addon-system-linux-x64`, `...-darwin-*`
- `@img/sharp-<platform>`, `@koromix/koffi-<platform>`, `@vscode/ripgrep-<platform>`

electron-builder prints this as *"platform-specific optional dependencies not
bundled"* while listing **other** platforms' binaries — that warning is expected
on a correct per-platform build. What must be present is the current platform's
set, which the build installs by definition. A cross-build from Linux would
produce a macOS payload without macOS binaries, so the CI matrix builds each
target on its own runner.

## Signing

Unsigned by default (`mac.identity: null`, `CSC_IDENTITY_AUTO_DISCOVERY=false`
in CI). To sign:

| Platform | Variables |
| --- | --- |
| macOS | `CSC_LINK`, `CSC_KEY_PASSWORD`; set `mac.hardenedRuntime: true` and pass `APPLE_ID`, `APPLE_APP_SPECIFIC_PASSWORD`, `APPLE_TEAM_ID` for notarization |
| Windows | `CSC_LINK`, `CSC_KEY_PASSWORD` |

Without signing, the first macOS launch hits Gatekeeper. A browser-downloaded dmg
is always quarantined, and which dialog you get decides what actually works:

- *"cannot be opened because Apple cannot check it for malicious software"* —
  right-click → **Open**.
- *"…is damaged and can't be opened"* — **no Open button is offered**, and the
  wording is misleading: nothing is damaged, the quarantine flag is. Clear it:

  ```sh
  xattr -dr com.apple.quarantine "/Applications/Neo DSH.app"
  ```

Windows shows a SmartScreen warning.

## Verifying a build without opening a window on someone's desktop

`DSH_DESKTOP_SMOKE=1` runs the real app against a scratch home and exits:

```sh
DSH_HOME=/tmp/suite-check DSH_DESKTOP_PORT=3199 DSH_DESKTOP_SMOKE=1 \
  apps/desktop/release/linux-unpacked/dsh-suite-desktop
```

It prints one line (`SMOKE OK: <url> rootChildren=… window=…`) and exits
non-zero on failure. Useful facts it already reported while this suite was being
built:

- the host line names the runtime it used, so a packaged run proves the bundled
  Node was picked up rather than the system one;
- `seeded $DSH_HOME: …` in `$DSH_HOME/desktop.log` proves the profile/preset
  seeding ran;
- fetching the host's `?token=` URL and grepping the served manifest for
  `dsh-activity-line` proves the bundled plugin composed into the client graph.

## Troubleshooting

| Symptom | Cause |
| --- | --- |
| Dialog "the dsh host exited unexpectedly", log ends with `user patch-layer watching requires the Cordis HMR service` | profile manifest's `dsh.profile.patchReload` is `live` (the default when the key is absent) **and** the HMR plugin is present. Since dsh-base/dsh-app-boot rc.3 depend on `@deepseek-ai/cordis-plugin-hmr` as a hard dependency, the package excludes it (see the `files` list) and the seeded profile sets `patchReload: "startup"`. An **existing** profile from an older install still needs `"startup"` unless the app that loads it omits HMR |
| App boots but a plugin is missing from the UI | it was shipped under `node_modules` in `extraResources` and got filtered; ship it as `vendor/` and let the seeder materialise it |
| `platform-specific optional dependencies not bundled` lists the *current* platform | the install did not run on that platform; build on its own runner |
| Window opens, host started, page never loads | the readiness URL must be loaded **with** its `?token=` query; a bare `http://127.0.0.1:<port>` answers 401 |
