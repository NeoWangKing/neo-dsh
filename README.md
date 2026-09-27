# Neo DSH

My own [DeepSeek Harness](https://www.npmjs.com/package/@deepseek-ai/dsh) desktop suite — one repository holding the Electron shell, my client plugins, my agent preset, and the profile composition they ship with, plus everything needed to build a Linux AppImage/deb/zip, a macOS dmg and a Windows installer.

The name is mine (Neo Wang); the harness is DeepSeek's. This repository is the packaging and the personal layer around it, not a fork of the harness.

```
apps/desktop/          Electron shell: spawns the harness host, shows it in a native window
plugins/activity-line/ client plugin: the live "what is the turn doing" line under the composer
presets/liangshen/     agent preset (persona, tools, todo-closer)
apps/desktop/resources/
  profile-web/         the web profile this app seeds on first launch
  settings.defaults.yaml
scripts/               assemble resources, fetch the Node runtime the app ships
.github/workflows/     per-platform packaging
```

## How the app runs

The window is Electron; the harness is **not**. On launch the shell:

1. seeds `$DSH_HOME` (default `~/.dsh`) with the shipped profile, preset and default settings — existing files are never overwritten, so an existing CLI install keeps its sessions and settings;
2. spawns `node .../@deepseek-ai/dsh/lib/bin.js web --no-open --port 3081` as a child process, using the **bundled official Node 22** when packaged (never Electron's Node: the harness's prebuilt native addons are ABI-bound to plain Node);
3. parses the readiness URL (with its one-time auth token) from the host's stdout and loads it in the window;
4. stops the host when the app quits, and restarts it from the ⟳ button.

The fixed port keeps browser storage stable — the origin is scheme + host + **port**, so a random port would reset every plugin's settings on each launch.

## Requirements

- **Using a build**: nothing. Node, the harness and the profile are in the package.
- **Building**: Node 22 (`^22.19 || >=24`), pnpm 11, and for Linux also the usual Electron packaging tools.
- **An API key**: the app does not ship credentials. Set `DEEPSEEK_API_KEY`, or sign in through the app's settings on first run.

## Quick start (development)

```sh
pnpm --dir apps/desktop install     # app deps (Electron + @deepseek-ai/dsh)
node scripts/build-resources.mjs    # profile + preset + plugin into apps/desktop/resources
pnpm run start                      # seeds $DSH_HOME if needed, then opens the window
```

In development the host runs under whatever `node` is on `PATH` (override with `DSH_NODE`), and the shipped resources are read straight from `apps/desktop/resources` — no packaging step needed.

## Building installers

```sh
node scripts/fetch-node.mjs                  # official Node runtime for this platform (SHA256-verified)
node scripts/build-resources.mjs             # profile/preset/plugin payload
pnpm --dir apps/desktop exec electron-builder --linux   # or --mac / --win
```

Artifacts land in `apps/desktop/release/` as `neo-dsh-<version>-<os>-<arch>.<ext>`:

| Platform | Targets | Status |
| --- | --- | --- |
| Linux x64 | AppImage, deb, **zip + install.sh** | **verified end-to-end** — all three artifacts boot, seed `$DSH_HOME`, and load the bundled plugin |
| macOS arm64/x64 | dmg | configured; not yet built on a Mac runner |
| Windows x64 | nsis installer | configured; not yet built on a Windows runner |

The zip is the no-installer option: extract it and run `./install.sh`, which copies
the tree to `~/.local/opt/neo-dsh`, adds a `neo-dsh` launcher, an icon and a menu
entry — no root, no package manager, no Node prerequisite. `./uninstall.sh` reverses
it and keeps `$DSH_HOME` unless given `--purge`.

Cross-building is not supported on purpose: the harness pulls platform-specific optional binaries (Landlock, node-addon-system, sharp, koffi, ripgrep), so each target is packaged **on its own OS** by `.github/workflows/build.yml`. That workflow builds Linux on every push and takes `mac`/`win` from a `workflow_dispatch` input until those runs have been checked.

Builds are **unsigned**. macOS needs a right-click → Open the first time; Windows shows SmartScreen's "unknown publisher". Signing is wired through the usual electron-builder variables (`CSC_LINK`, `CSC_KEY_PASSWORD`, plus the Apple notarization trio) — see [docs/packaging.md](docs/packaging.md).

## Operating it

| Task | How |
| --- | --- |
| Change the harness version | `pnpm --dir apps/desktop add @deepseek-ai/dsh@<version> && node scripts/sync-peers.mjs`, then rebuild |
| Change the shipped profile | edit `apps/desktop/resources/profile-web/package.json` (`dsh.profile.bundles`), re-run `build-resources`, rebuild |
| Ship another plugin | drop it in `plugins/`, add it to `build-resources.mjs`, list it in the profile's bundles |
| Use my own state | the app reads `$DSH_HOME`; set it to keep this suite's state away from the CLI's `~/.dsh` |
| Check the generated dependency list | `node scripts/sync-peers.mjs --check` (CI fails when a harness bump adds a peer) |
| Skip seeding | `DSH_DESKTOP_NO_SEED=1` |
| Other port | `DSH_DESKTOP_PORT=3198` |
| Diagnostics | `DSH_DESKTOP_SMOKE=1` boots, reports window/layout facts, exits non-zero on failure |

## Known limitations

- **Unsigned builds** — see above.
- **Size** — roughly 650 MB unpacked / 250–350 MB per installer: Electron, the whole harness dependency tree, and a 125 MB Node runtime. The runtime is the price of not asking users to install Node.
- **No auto-update.** Updating means installing a newer artifact.
- **The profile only seeds once.** An existing `$DSH_HOME/profiles/web` is left alone, including its plugin set.

## Publishing

The repository has no remote yet. Create an empty repository on GitHub (no
README, no .gitignore — the history here is already the starting point) and push:

```sh
git remote add origin git@github.com:ymh0000123/neo-dsh.git   # or https://…
git push -u origin main
```

What the workflows then do by themselves:

| Workflow | Trigger | Notes |
| --- | --- | --- |
| `build` | every push to `main` | builds **Linux** (AppImage + deb + zip) and uploads them as artifacts. macOS and Windows stay off unless selected: `workflow_dispatch` with `platforms=mac` or `platforms=win`. |
| `build` | tag `v*` | same builds, plus attaches every artifact to a GitHub Release. |
| `publish-plugin` | push/PR touching `plugins/activity-line/**` | runs the plugin tests and asserts the npm tarball carries `index.js`, `client.js` and `cordis.patch.yml`. |
| `publish-plugin` | tag `plugin-v*` | `npm publish --provenance` for `dsh-activity-line`. Needs the repository secret `NPM_TOKEN` (an npm automation token); without it the publish job fails while the check job still passes. |

Releasing:

```sh
git tag v0.1.0 && git push origin v0.1.0          # desktop installers → GitHub Release
git tag plugin-v1.0.0 && git push origin plugin-v1.0.0   # plugin → npm
```

Both tags are independent: the desktop version and the plugin version move on
their own schedules.
