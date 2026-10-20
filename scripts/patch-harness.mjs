#!/usr/bin/env node
/**
 * Local fixes to the vendored harness, applied after install and before packaging.
 *
 * Every patch here is a workaround for something the harness gets wrong on a machine we
 * can see, and every one of them fails loudly when its anchor is gone: a silent no-op
 * would mean shipping a build that looks fine and quietly lost the fix.
 *
 * Run by `pnpm run install:app` and by `pnpm run resources` (which every build and
 * packaging script runs), so a fresh `pnpm install` and every artifact carry them.
 *
 *   node scripts/patch-harness.mjs                       # patch this checkout
 *   node scripts/patch-harness.mjs --check               # report only; non-zero if missing
 *   node scripts/patch-harness.mjs --package-dir <dir>   # patch an installed copy
 *
 * `--package-dir` takes the tree holding the packages to patch: the app's `node_modules`
 * (or its `@deepseek-ai` scope), or a single package directory when only that package is
 * meant.
 */
import { existsSync, readFileSync, renameSync, writeFileSync } from 'node:fs'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const scopeName = '@deepseek-ai'
const root = dirname(dirname(fileURLToPath(import.meta.url)))

/**
 * Replace a file in one step. A running app watches the client bundles it serves — the
 * client HMR plugin reloads a module the moment it changes — and a reader that caught a
 * half-written file would lose that module instead of picking up the change: that is how a
 * composer disappeared once. The temporary file lives in the target directory so the rename
 * stays on one filesystem, and therefore atomic.
 */
function writeInOneStep(file, text) {
  const temporary = `${file}.patch-harness-${process.pid}`
  writeFileSync(temporary, text)
  renameSync(temporary, file)
}

/**
 * A client bundle is spliced with JSX-runtime calls, so it has to keep parsing: a broken
 * bundle takes the whole Web UI down instead of one icon. `new Function` parses without
 * running, which is the check we want — and only a bundle that is a single expression
 * statement can be parsed that way, hence the per-patch opt-in.
 */
function assertParses(file, text) {
  try {
    // eslint-disable-next-line no-new-func
    new Function(text)
  } catch (error) {
    console.error(`patch-harness: ${file} no longer parses after patching: ${error.message}`)
    process.exit(1)
  }
}

/**
 * The client bundle names its JSX runtime after the import it came from. Reading the
 * binding out of the file keeps this patch working if the bundler renames the alias.
 */
/**
 * `dsh-host-open-in-app` takes a Linux icon only from the desktop entry whose id its
 * table names, and it names none for these two rows — so they can never show an icon,
 * however well the applications are installed. Both ship a usable desktop entry on every
 * distribution we have looked at; naming it is the fix.
 *
 * The package ships a pre-bundled `lib/index.js` (what the host actually loads) with the
 * region-split sources beside it, hence two files per patch. The expressions survive
 * either quoting style, because the bundle and the sources differ.
 *
 * Upstream is the right place for this (the icon should come from the desktop entry the
 * launcher actually resolved to), so it is deliberately small and easy to drop.
 */
const openInAppPatches = [
  {
    id: 'androidstudio-icon',
    why: 'Android Studio has no desktop id, so its icon is never looked up',
    find: /linux:\s*spec\(\s*cli\(\s*(["'])studio\1\s*\)\s*,\s*file\(\[/,
    replace: 'linux: desktopSpec("android-studio", cli("studio"), file([',
    applied: /linux:\s*desktopSpec\(\s*(["'])android-studio\1/,
  },
]

/**
 * The permission glyph table is a fixed design set, and the composer chip draws nothing
 * for a preset value it does not know — which is what happened to our own `smart-approval`
 * preset, a shipped row of the default composition. The preset table itself has no icon
 * field to fill in, so the glyph has to join the table. Upstream would take this as a real
 * contribution; until then this is the patch that keeps the chip from losing its icon
 * while the user is on 智能批准.
 *
 * 0.2 moved the table (and `PermissionSelect` itself) out of the conversation bundle into
 * the standalone `dsh-client-ui-permission-presets` package; the entry spliced in is
 * unchanged, so only the target below follows the move.
 */
/**
 * `dsh-terminal-bash` refuses a sandbox-mode change while a persistent terminal is alive,
 * because a PTY keeps the confinement it was spawned with. Our agent preset gives the model
 * a PTY-backed shell as its `bash` — the shell the official `minimal` preset also uses — so
 * that shell is warm nearly all the time, and the refusal meant the user could no longer
 * switch presets mid-conversation. That is the case the desktop app exists for: "I am going
 * out, hand it full access for a while."
 *
 * Closing the shells first keeps the invariant honest: nothing keeps running under the old
 * policy, and the new one applies to everything that follows. The shells are asked to exit
 * rather than killed, because the tool that owns a shell notices an exited session and
 * resets itself cleanly — so the next command runs in a fresh shell without an error.
 * Upstream is the right home for this (an app with a terminal panel would rather keep the
 * upstream refusal and let the user close them); a desktop app has no such panel.
 */
const terminalRetireHelper = `/**
 * [neo-dsh] Ask one persistent terminal to exit so a sandbox-mode change can take effect.
 *
 * A send is refused while the shell is running a command, and a shell that outlives the
 * policy it was created under is exactly what the mode-change check exists to prevent, so
 * anything still alive a second later is killed instead.
 */
function retireForModeChange(state, owner, sessionId) {
	try {
		const send = state.pty.startSend(owner, sessionId, { text: "exit\\n", submit: true });
		Promise.resolve(send?.done).catch(() => {});
	} catch {}
	setTimeout(() => {
		try {
			const snapshot = state.pty.list(owner).find((session) => session.sessionId === sessionId);
			if (snapshot === void 0 || snapshot.status?.kind === "exited") return;
			Promise.resolve(state.pty.kill(owner, sessionId, "sandbox mode changed")).catch(() => {});
		} catch {}
	}, 1e3);
}`

const terminalRetireCall = [
  '\t\tconst live = state.pty.list(owner);',
  '\t\tif (live.length === 0) {',
  '\t\t\tthrow new Error(`cannot change sandbox mode from "${currentMode}" to "${event.data.mode}" while a persistent terminal session is being created; try again in a moment`);',
  '\t\t}',
  '\t\tfor (const snapshot of live) retireForModeChange(state, owner, snapshot.sessionId);',
  '\t\tconsole.log(`dsh: sandbox mode ${currentMode} → ${event.data.mode}: closed ${live.length} persistent terminal session(s)`);',
].join('\n') + '\n'

const terminalPatches = [
  {
    id: 'sandbox-mode-closes-terminals',
    why: 'a preset switch is refused for as long as the agent keeps a shell warm',
    find: /(\t*throw new Error\(`cannot change sandbox mode[\s\S]*?close them first`\);\n)/,
    replace: () => terminalRetireCall,
    applied: /retireForModeChange\(state, owner, snapshot\.sessionId\)/,
  },
  {
    id: 'sandbox-mode-closes-terminals-helper',
    why: 'the helper that replacement calls',
    find: /(\nfunction ensureSandboxModeFence\(ctx, owner\) \{)/,
    replace: (match) => `\n${terminalRetireHelper}\n${match.slice(1)}`,
    applied: /function retireForModeChange\(state, owner, sessionId\) \{/,
  },
]

const targets = [
  {
    package: 'dsh-host-open-in-app',
    files: ['lib/index.js', 'lib/types/catalog.js'],    linuxOnly: true,
    patches: openInAppPatches,
  },
  {
    package: 'dsh-terminal-bash',
    files: ['lib/index.js'],
    linuxOnly: false,
    patches: terminalPatches,
  },
]

const flagIndex = process.argv.indexOf('--package-dir')
const explicitDir = flagIndex === -1 ? undefined : process.argv[flagIndex + 1]

/**
 * The scope directory that holds the packages, plus which targets live in it.
 *
 * An explicit directory may be an app's `node_modules`, its `@deepseek-ai` scope, or one
 * package directory; a tree that holds only some of the packages is patched for those and
 * left alone for the rest, because "install the other one" is not a useful answer when
 * somebody pointed at a tree on purpose.
 */
function resolveTree() {
  if (explicitDir === undefined) {
    return { scope: join(root, 'apps', 'desktop', 'node_modules', scopeName), explicit: false }
  }
  if (!existsSync(explicitDir)) {
    console.error(`patch-harness: ${explicitDir} does not exist`)
    process.exit(1)
  }
  const names = (scope) => targets.filter((t) => existsSync(join(scope, t.package))).map((t) => t.package)
  for (const scope of [join(explicitDir, scopeName), explicitDir]) {
    const found = names(scope)
    if (found.length > 0) return { scope, explicit: true, only: found }
  }
  const single = targets.find((target) => target.package === basename(explicitDir))
  if (single !== undefined) return { scope: dirname(explicitDir), explicit: true, only: [single.package] }
  console.error(`patch-harness: ${explicitDir} holds none of ${targets.map((t) => t.package).join(', ')}`)
  process.exit(1)
}

// The open-in-app patches are Linux-only, so a macOS or Windows build has no reason to
// apply them — and no reason to fail when the anchor moves. An explicit `--package-dir`
// is somebody pointing at a tree on purpose, so it always runs.
// (Cross-building the Linux artifact from another OS is not supported by this repository.)
function shouldSkip(target, explicit) {
  return target.linuxOnly && !explicit && process.platform !== 'linux'
}

const { scope, explicit, only } = resolveTree()
const checkOnly = process.argv.includes('--check')
const report = []

for (const target of targets) {
  if (only !== undefined && !only.includes(target.package)) continue
  if (shouldSkip(target, explicit)) {
    report.push(`  skipped          ${target.package} (Linux-only patches on ${process.platform})`)
    continue
  }
  for (const relative of target.files) {
    const file = join(scope, target.package, relative)
    if (!existsSync(file)) {
      console.error(`patch-harness: ${file} is missing — install the app's dependencies first`)
      process.exit(1)
    }
    const label = `${target.package}/${relative}`
    let text = readFileSync(file, 'utf8')
    let changed = false
    for (const patch of target.patches) {
      if (patch.applied.test(text)) {
        report.push(`  already applied  ${patch.id} (${label})`)
        continue
      }
      const anchor = patch.find.exec(text)
      if (anchor === null) {
        console.error(`patch-harness: anchor for "${patch.id}" is gone in ${label} (${patch.why})`)
        console.error(`  expected to match: ${String(patch.find)}`)
        process.exit(1)
      }
      if (checkOnly) {
        console.error(`patch-harness: "${patch.id}" is NOT applied in ${label} (${patch.why})`)
        process.exit(1)
      }
      // A previous revision of the same edit is taken out before the new one goes in.
      if (patch.remove !== undefined) text = text.replace(patch.remove, '')
      const replacement = typeof patch.replace === 'function' ? patch.replace(anchor[1], text) : patch.replace
      // A replacer function keeps `$` sequences in the replacement literal.
      text = text.replace(patch.find, () => replacement)
      changed = true
      report.push(`  applied          ${patch.id} (${label})`)
    }
    if (changed) {
      if (target.patches.some((patch) => patch.parse)) assertParses(file, text)
      writeInOneStep(file, text)
    }
  }
}

console.log(`patch-harness: ${report.join('\n')}`)
