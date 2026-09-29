# Neo DSH

[![build](https://github.com/NeoWangKing/neo-dsh/actions/workflows/build.yml/badge.svg)](https://github.com/NeoWangKing/neo-dsh/actions/workflows/build.yml)

**English** · [中文](README.md)

Neo DSH is a desktop app for [DeepSeek Harness](https://www.npmjs.com/package/@deepseek-ai/dsh).
It runs the harness's web UI in an Electron window, adds an activity line under the
composer and a few rows to Settings, and packages the result for Linux, macOS and
Windows. Node ships inside the package, so installing it needs nothing else.

The harness is a dependency, not a fork. This repository holds the shell, two client
plugins, an agent preset and the profile that composes them.

## Install

Download the asset for your platform from
[Releases](https://github.com/NeoWangKing/neo-dsh/releases/latest):

| Platform | Asset | How |
| --- | --- | --- |
| Linux x64 | `neo-dsh-<version>-linux-x86_64.AppImage` | `chmod +x` and run it |
| Linux x64 | `neo-dsh-<version>-linux-amd64.deb` | `sudo dpkg -i <file>` |
| Linux x64 | `neo-dsh-<version>-linux-x64.zip` | unzip, then `./install.sh`; installs into `~/.local`, no root |
| macOS arm64 | `neo-dsh-<version>-mac-arm64.dmg` | open it and drag the app to Applications |
| Windows x64 | `neo-dsh-<version>-win-x64.exe` | run the installer |

The builds are unsigned, so the first launch is blocked:

```
"…cannot be opened because Apple cannot check it for malicious software"
  → right-click the app, choose Open, confirm once.

"…is damaged and can't be opened"
  → this dialog has no Open button. The file is not damaged: a dmg that came
    through a browser carries a quarantine flag. Clear it and open again:
    xattr -dr com.apple.quarantine "/Applications/Neo DSH.app"
```

On Windows, SmartScreen reports an unknown publisher: *More info*, then *Run anyway*.

No credentials are bundled. Set `DEEPSEEK_API_KEY`, or sign in from the app's settings
on first run.

## What you get

- **Self-update** from this repository's releases: a manual check, an optional
  automatic check every 1, 6 or 24 hours, and an optional automatic download
  (Settings → General → Neo DSH desktop app).
- **Its own data directory**, with a Settings row that moves it (copy or move) to a
  folder you pick. Data that is already in `~/.dsh` is copied over on first launch;
  the old directory is left alone.
- **A borderless window on Linux by default**, with a switch back to the system title
  bar (Settings → General → Window frame). Dragging works with the window manager's
  modifier, Mod+drag on niri for instance.
- **`activity-line`**: a live line under the composer showing what the current turn is
  doing.
- **`desktop-settings`**: the update and data-location rows in Settings.
- **Safe mode**: when a plugin or a settings file breaks the boot, the next launch offers
  to open with the bundled plugins only. Leaving safe mode checks your own profile first,
  and offers to move a broken one aside (renamed, not deleted) for the shipped one.
- **`liangshen` preset**: persona, tool selection and a todo-closer.

## How it runs

The window is Electron; the harness is not. On launch the shell:

1. seeds the data directory with the bundled profile, preset and default settings,
   keeping files that are already there;
2. starts the harness host as a child process (`dsh web --no-open --port 3081`) under
   the bundled Node 22, because the harness's prebuilt native addons are built for
   plain Node and cannot load into Electron's;
3. reads the readiness URL from the host's stdout, one-time auth token included, and
   loads it in the window;
4. stops the host when the app quits, and restarts it from the ⟳ button.

The port is fixed because the renderer keeps plugin settings in localStorage, which is
scoped to the origin, port included.

## Where your data lives

| Platform | Default |
| --- | --- |
| Linux | `$XDG_DATA_HOME/neo-dsh`, usually `~/.local/share/neo-dsh` |
| macOS | `~/Library/Application Support/neo-dsh` |
| Windows | `%APPDATA%\neo-dsh` |

The first launch in that directory copies your existing data out of `~/.dsh`:
sessions, storages, attachments, profiles, the model cache, presets, `settings.yaml`
and `.credentials.yaml`. The old directory is not modified, so a harness CLI pointed
at it keeps working.

Each later version copies across whatever appeared in `~/.dsh` since the last one, and
never overwrites a file that already exists in the app's directory. Settings → General
→ Data location shows the current path and can move the whole thing; `DSH_HOME`
overrides all of it.

## Development

Node 22 or newer (`^22.19 || >=24`) and pnpm 11. Node 20 cannot run the harness: it has
no `node:sqlite` and the native addons do not match. `scripts/check-node.mjs` guards
every script, and `.nvmrc` pins 22 for shells that switch version on directory change.

```sh
pnpm run install:app    # Electron and the harness
pnpm run start          # build the resources, then open the window
pnpm test               # unit suites: plugins, preset, updater, data directory
```

To look at a change in a real window without touching the installed app or your own data:

```sh
bash scripts/dev-window.sh
```

[docs/development.md](docs/development.md) covers the plugin workflow, the environment
variables and what the dev window isolates.

## Building installers

```sh
pnpm run dist:linux     # also dist:mac and dist:win
```

Artifacts land in `apps/desktop/release/`. Each platform is built on its own OS,
because the harness pulls platform-specific binaries: `.github/workflows/build.yml`
builds Linux on every push to `main`, and all three platforms for a `v*` tag.
Releasing is the tag:

```sh
git tag v0.1.13 && git push origin v0.1.13
```

The builds are unsigned; signing is wired through the usual electron-builder variables.
See [docs/packaging.md](docs/packaging.md).

The `activity-line` plugin is published to npm separately, on its own tag:
`git tag plugin-v1.0.1 && git push origin plugin-v1.0.1`.

## Layout

```
apps/desktop/             Electron shell: host lifecycle, updater, data directory, preferences
  resources/              profile, preset and default settings, seeded on first launch
plugins/activity-line/    client plugin: the activity line under the composer
plugins/desktop-settings/ client plugin: update and data-location rows in Settings
presets/liangshen/        agent preset
scripts/                  resource assembly, Node runtime download, peer list, dev window
packaging/linux/          install.sh and uninstall.sh for the zip build
docs/                     development and packaging notes
```

## Known limitations

- Unsigned builds, so macOS and Windows warn on first launch.
- Size: about 650 MB unpacked, 250–350 MB per installer. That is Electron, the whole
  harness dependency tree and a 125 MB Node runtime.
- macOS arm64 only; an Intel build would need a cross-arch install.
- The Windows installer is built by CI but has not been run on a real Windows machine.
- The `dsh` command line has its own data directory, so terminal sessions and the app's
  sessions stay separate.

## License

There is no LICENSE file yet. Until there is one, all rights reserved.
