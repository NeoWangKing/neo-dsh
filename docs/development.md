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

## Environment variables

| Variable | Effect |
| --- | --- |
| `DSH_HOME` | harness home (default `~/.dsh`) — sessions, settings, credentials, profiles |
| `DSH_DESKTOP_PORT` | fixed host port (default 3081). Keep it stable: the origin includes the port |
| `DSH_NODE` | Node used for the host (default: the bundled runtime when packaged) |
| `DSH_DESKTOP_DSH_BIN` | run a different harness build as the host |
| `DSH_DESKTOP_DEVTOOLS` | `1` opens DevTools on launch |
| `DSH_DESKTOP_NO_SEED` | `1` skips seeding the shipped profile/preset/settings |
| `DSH_DESKTOP_MIN_WIDTH` / `_HEIGHT` | optional window floor (unset = no floor) |
| `DSH_DESKTOP_SMOKE` | `1` boots, reports, exits; `_SMOKE_CRASH=1` also tests renderer recovery |

## Gotchas worth knowing

- **The host caches assembled plugin bundles.** Editing a plugin and reloading
  the page does nothing; restart the host (⟳).
- **Never run two hosts on the same `$DSH_HOME`.** Two writers on one session log
  corrupts it (there are `corrupt-backup` files in this machine's history from
  exactly that). The port collision is the smaller problem.
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
