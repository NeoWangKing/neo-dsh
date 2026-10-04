# Developing Neo DSH

Four planes, each with its own edit loop. Knowing which plane you are in is the
whole trick: three of them are editable while the app runs, and one is a build
artifact.

| Plane | Lives at runtime in | Edit by | Takes effect after |
| --- | --- | --- | --- |
| **Client plugins** (`client.js`, browser side) | a directory linked into `~/.dsh/profiles/web/node_modules` | editing the file | **host restart** (the ⟳ button) |
| **Host plugins** (`index.js`, cordis rows) | same | editing the file | **host restart** |
| **Agent presets** (`~/.dsh/.agent-presets/<name>/`) | `$DSH_HOME` | editing in place | the next session |
| **The shell** (`src/main.mjs`, window, host lifecycle) | frozen inside the app bundle | editing this repo, then `pnpm start` / reinstall | app restart |
| **The harness** (`@deepseek-ai/*`) | frozen inside the app bundle | a harness source checkout (see below) | app restart |

The frozen planes are a feature: the installed app is a reproducible artifact, so
plugin work can never half-break the runtime underneath it.

## Recipes

### Develop a client plugin against the installed app

```sh
# once: point the profile at your working copy (uses the pnpm on your PATH)
dsh plugin --profile web add link:~/Projects/neo-dsh/plugins/activity-line

# then loop: edit client.js → press ⟳ in the app → reload the page
```

`dsh plugin` works from the installed app because it only wraps pnpm; the
packaged runtime deliberately ships no npm/npx of its own.

### Look at a change in a dev window

`scripts/dev-window.sh` boots this checkout in a real window without touching the
install or the app that is already running. It gives Electron its own
`--user-data-dir` (sharing the real one fights the running app over Chromium's
SingletonLock), points the data home at `/tmp/neo-dev-home` through that profile's
own `desktop-config.json` — the same file Settings → General → Data location writes,
so the dev window exercises the real resolution order instead of the `DSH_HOME`
override — and serves on a spare loopback port. The `/tmp` home starts empty and is
filled on first launch by the app's own `~/.dsh` migration, the same code path an
installed build runs (bump `apps/desktop/package.json` to watch the version-gated
merge, which re-runs on every version change). `DSH_DESKTOP_FORCE_BUNDLED=1` (which the script sets) re-copies
the bundled plugins even when the version did not change, so an edit to
`plugins/*/client.js` shows up in the dev window without a version bump.

```sh
pnpm run test                    # seconds — catches the logic
bash scripts/dev-window.sh       # then look at it: port 3199, isolated home
```

This is the loop for interface work: the unit suites cannot see a button that is
white-on-white, a window that quits when it is rebuilt, or a row that renders on
the wrong line — and a screenshot from someone else's machine is a slow way to
find that out. Starting the script again stops the previous run first; its host
shows up only as the process holding the port, so killing the shell alone leaves
it behind and the next launch dies with EADDRINUSE.

### Each front end has its own data directory

Since 0.1.12 the desktop app keeps its own data directory (see README, *Where your
data lives*). On Linux the terminal `dsh` (TUI / headless / plugin management) is
started by `~/.local/bin/dsh`, and that wrapper sets its `DSH_HOME` to
`${XDG_DATA_HOME:-~/.local/share}/dsh-tui`: **the two front ends keep separate
sessions, credentials and settings, and neither writes the other's session store.**
Two hosts on one home corrupt session logs. With no subcommand the wrapper adds
`--profile dsh-tui`, so plain `dsh` is the TUI; an explicit `--profile` and
subcommands like `plugin` pass through untouched.

Plugin sets are divided by **profile, not by home**, so "GUI plugins are useless in
the TUI" needs no sync mechanism of its own:

| profile | used by | contents |
| --- | --- | --- |
| `web` | the desktop app | `dsh-base` + `dsh-web-app` + the bundled plugins |
| `dsh-tui` | the terminal TUI | `dsh-base` + `@deepseek-harness-tui/dsh-tui` |
| `headless` | `dsh --profile headless "…"` | `dsh-base` + `dsh-headless` |

To install a plugin for the **desktop app**, point the command at the app's home:

```sh
DSH_HOME=$(pnpm run --silent app-home) dsh plugin --profile web list
DSH_HOME=$(pnpm run --silent app-home) dsh plugin --profile web add link:/path/to/plugin
```

`pnpm run app-home` prints the directory the app actually uses (it reads the app's
own location config, so it follows Settings → Data location). A plugin that belongs
in both front ends has to be installed twice, once per home, with that home's
profile name.

The app also ships a profile patch layer of its own (`resources/profile-web/cordis.patch.yml`
— today the permission preset table). A home that migrated from `~/.dsh`, or that an older
build seeded, carries its own `cordis.patch.yml`, and seeding never overwrites a file that is
already there — so the pristine empty file wins and a preset that exists only as a patch
entry, like 智能批准, is missing from that window entirely. The app therefore hands its own
layer to the host as an extra `--patch` overlay, but only for entries the live file does not
already name: an entry that is there was written by an earlier build or by the user, and an
overlay would silently override the latter. The decision is `apps/desktop/src/profile-patch.mjs`
and `desktop.log` records when it fires. `--patch` belongs with the profile selector: the `web`
subcommand passes everything after its own options through to the web app, and the wrong place
gives `unknown option '--patch'` — a start-up failure dialog.

**A trap: a profile without `patchReload` defaults to `live`, which needs the Cordis
HMR service that the packaged runtime deliberately does not ship** — so `dsh
--profile …` exits with `user patch-layer watching requires the Cordis HMR
service`. The shipped `web` / `headless` profiles set `"patchReload": "startup"`;
profiles the harness created itself (an early `dsh-tui`, say) do not, and need:

```json
"dsh": { "profile": { "bundles": ["…"], "patchReload": "startup" } }
```

### Debug the UI while you work

```sh
DSH_DESKTOP_DEVTOOLS=1 neo-dsh      # opens detached DevTools (ignored in smoke runs)
```

The plugin's own console errors land there. Remember the host caches assembled
plugin bundles: a change needs ⟳ first, then a page reload.

### Develop the shell

```sh
cd ~/Projects/neo-dsh
pnpm --dir apps/desktop install
node scripts/build-resources.mjs
pnpm run start                       # dev: `node` on PATH, resources read in place
DSH_HOME=/tmp/scratch DSH_DESKTOP_PORT=3199 DSH_DESKTOP_SMOKE=1 pnpm run start
```

`DSH_DESKTOP_SMOKE=1` boots, prints one line of window/layout facts and exits
non-zero on failure — that is the shape to keep in CI.

### Develop the harness itself

Point the installed shell at another harness build instead of repackaging:

```sh
DSH_DESKTOP_DSH_BIN=/path/to/checkout/lib/bin.js \
DSH_NODE=~/.nvm/versions/node/v22.23.1/bin/node neo-dsh
```

The override is printed to `$DSH_HOME/desktop.log` as `starting host: …`, so
there is never any doubt which build is running.

### Manage the installed app's plugins

```sh
dsh plugin --profile web list
dsh plugin --profile web add <name|link:path|github:user/repo|file:*.tgz>
dsh plugin --profile web remove <name>
```

All of these edit `$DSH_HOME/profiles/web`, which is shared with every other dsh
front end on this machine — the CLI, the TUI and the desktop app see the same
plugin set.

## Can Neo DSH develop itself?

**At the plugin and preset planes, yes.** An agent running inside the app can
write a plugin directory, register it with `dsh plugin --profile web add
link:<path>`, and have it live after the host restarts. That includes *client*
plugins: the thing rendering the UI can extend its own UI. Presets are read per
session, so a new preset applies to the next session without a restart.

**At the shell and harness planes, no — not at runtime.** Those are build
artifacts inside `~/.local/opt/neo-dsh`. Editing them in place works until the
next install, and nothing about the running process changes until the app
restarts. The honest workflow is: edit the repo, rebuild, reinstall.

The harness's own introspection tooling (`dsh-tool-cordis`, the plugin inventory
in Settings) is available for looking at what is mounted, which is the useful half
of self-modification: seeing your own composition.

### Patches to the vendored harness

`scripts/patch-harness.mjs` applies the few local fixes to `node_modules/@deepseek-ai/*`
that we cannot make upstream in time. It runs from `pnpm run install:app` and from
`pnpm run resources` (which every build and packaging script calls), so a fresh install and
every artifact carry them; `pnpm run patches:check` (`--check`) fails when a patch is
missing, and a patch whose anchor disappeared fails loudly instead of silently shipping
without it.

Today it gives `dsh-host-open-in-app` a desktop entry id for the two Linux rows that have
none (`filemanager` → `org.gnome.Nautilus`, `androidstudio` → `android-studio`). Without one
the plugin never looks for an icon at all, so those rows stay blank however well the
applications are installed. Note that the package ships a pre-bundled `lib/index.js` **and**
the region-split sources beside it, and the bundle is what the host loads — both files have
to be patched, which is exactly the mistake this script exists to keep in one place.

It also adds the 智能批准 glyph to the permission table in `dsh-client-ui-conversation`: the
composer chip draws an icon only for preset values that table names, and a preset of ours is
not one of them, so the chip would show a bare label. The preset schema has no icon field to
fill in, which is why this is a patch and not configuration. The glyph is a shield holding
two content lines with a four-pointed star over its lower-right corner; because that star
reaches past the shield's outline, a small mask cuts the stroke away inside the corner — the
same move the workspace-write pen makes with its own path.

An installed copy can be patched with `--package-dir <app>/node_modules`, or its
`@deepseek-ai` directory, or one package directory to touch only that package.

The open-in-app patches only touch `platforms.linux` specs, so those run on Linux builds and
skip everywhere else (`--package-dir` is an explicit target and always runs): a macOS or
Windows artifact ships that part of the harness untouched, and their builds cannot be broken
by an anchor that moved in a Linux-only line. The glyph patch is not platform-specific and
always runs.

### Network proxy

The harness host is a Node process, and Node ignores `http_proxy` unless it is told to look
(`NODE_USE_ENV_PROXY=1`). Behind an explicit proxy — Clash, a corporate gateway — a model
request then simply times out while the browser next to it works, which is a confusing way
to find that out.

The shell resolves the proxy itself and hands an environment that works to both the host
and its own HTTP client:

* an explicit choice in Settings → General → **Network proxy** (`system`, `direct`, or a
  manual address), stored in `$DSH_HOME/desktop-preferences.json`;
* otherwise the environment the app was started with;
* otherwise the desktop's own settings: `gsettings org.gnome.system.proxy` on Linux,
  `scutil --proxy` on macOS, the `Internet Settings` registry values on Windows.

`loopback` (`localhost`, `127.0.0.1`, `::1`) is always added to `no_proxy` so the window can
still reach its host. Changing the row restarts the host with the new environment, and the
resolution is logged as `proxy: system → http://127.0.0.1:7897 (desktop settings)`.

`src/proxy-env.mjs` holds the parsers and the decision, with unit tests; the whole path was
verified by starting the app behind Clash and looking at the host's environment.

### Safe mode

A plugin or a settings file that cannot load leaves no window to fix it from, so there is
a boot that uses only what ships:

* `--safe` (or `DSH_DESKTOP_SAFE=1`) serves `profiles/web-safe`, re-seeded from
  `resources/profile-web` on every launch, with the bundled plugins materialised into its
  `node_modules`. The user's own profile is neither read nor written.
* A `settings.yaml` that does not parse is renamed to `settings.yaml.broken-<stamp>` and
  the shipped defaults take its place.
* Two failed starts in a row (counted in `desktop-boot.json` in the data directory) make
  the next launch ask whether to start in safe mode; a window that loads clears the count.
* Leaving safe mode inspects `profiles/web` first. An unparsable manifest or an
  unresolvable bundle is reported, and the profile can be repaired: moved aside as
  `profiles/web.broken-<stamp>` and replaced from the shipped profile.

`src/boot-guard.mjs` holds the decisions (the flag, the counter, the settings repair, the
profile check and repair) with unit tests.

### The host's port, and what guards it

The window loads exactly one harness host, on one fixed port. A host that outlives its
shell keeps that port, and every later start then fails on EADDRINUSE, which surfaces as
"the host exited before it was ready". Two things keep that from happening:

* The host is started with `--require src/host-watchdog.cjs`, plus the shell's pid
  (`DSH_HOST_PARENT_PID`) and the marker `DSH_DESKTOP_HOST=1`. When that pid is no longer
  the host's parent, the host stops itself. This is the only layer that still works when
  the shell is SIGKILLed and gets no chance to clean up.
* Before starting a host, the shell probes the port. Free is the normal case. A host it
  can prove is its own — `desktop-host.json` in `$DSH_HOME`, or the marker — with no shell
  left is stopped and waited out. Anything else is put in front of the user with its pid
  and command line rather than killed. `DSH_DESKTOP_PORT` moves the whole thing elsewhere,
  at the cost of resetting the renderer's localStorage, since the origin includes the port.

`ensureHostPort`, `isOrphan` and `portAction` live in `src/host-guard.mjs` and are unit
tested; the watchdog has a real-process test that kills its parent and waits for the child
to leave.

## Environment variables

| Variable | Effect |
| --- | --- |
| `DSH_HOME` | harness home. Outranks Settings → General → Data location, which outranks the platform default (`~/.local/share/neo-dsh` on Linux). Development escape hatch |
| `DSH_DESKTOP_PORT` | fixed host port (default 3081). Keep it stable: the origin includes the port |
| `DSH_NODE` | Node used for the host (default: the bundled runtime when packaged) |
| `DSH_DESKTOP_DSH_BIN` | run a different harness build as the host |
| `DSH_DESKTOP_DEVTOOLS` | `1` opens DevTools on launch |
| `DSH_DESKTOP_NO_SEED` | `1` skips seeding the shipped profile/preset/settings |
| `DSH_DESKTOP_SAFE` | `1` opens in safe mode (same as `--safe`): shipped profile only |
| `http_proxy` / `https_proxy` / `no_proxy` | read at startup; the resolved proxy is handed to the host (see *Network proxy*) |
| `DSH_DESKTOP_NO_MIGRATE` | `1` skips carrying an existing `~/.dsh` into a fresh home |
| `DSH_HOST_PARENT_PID` / `DSH_HOST_WATCHDOG_MS` | set on the host by the shell (watchdog); not for humans |
| `DSH_DESKTOP_FORCE_BUNDLED` | `1` re-copies the bundled plugins even at the same version (dev window) |
| `DSH_DESKTOP_MIN_WIDTH` / `_HEIGHT` | optional window floor (unset = no floor) |
| `DSH_DESKTOP_SMOKE` | `1` boots, reports, exits; `_SMOKE_CRASH=1` also tests renderer recovery |

## Gotchas worth knowing

- **The host caches assembled plugin bundles.** Editing a plugin and reloading
  the page does nothing; restart the host (⟳).
- **Never run two hosts on the same `$DSH_HOME`.** Two writers on one session log
  corrupt it. The port collision is the smaller problem.
- **A profile without `dsh.profile.patchReload` defaults to `live`**, which needs
  the Cordis HMR service. The packaged app excludes `@deepseek-ai/cordis-plugin-hmr`
  on purpose (see [packaging.md](packaging.md)), and the profile it seeds sets
  `patchReload: "startup"`.
- **A preset must be a real directory.** The harness scans `$DSH_HOME/.agent-presets`
  with `readdir(dir, { withFileTypes: true })` and skips anything where
  `child.isDirectory()` is false — and that is false for a **symlink to a
  directory**. The failure is silent: `startSession()` only reaches
  `console.warn("new session failed: …")`, so clicking *New session* appears to do
  nothing while the host reports `agent-preset/not-found`. To keep one source of
  truth, make the preset a real directory and symlink the **files** inside it
  (`stat` follows those, so the loader reads them fine).
- **Node 22 is required** for the repo (`.nvmrc`, `engines`, `scripts/check-node.mjs`).
  The packaged app is unaffected: it carries its own Node.
