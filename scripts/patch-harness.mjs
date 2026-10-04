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
function jsxRuntimeName(file) {
  const match = file.match(/([A-Za-z_$][\w$]*)\s*=\s*require\(\s*(["'])react\/jsx-runtime\2\s*\)/)
  if (match === null) {
    console.error('patch-harness: the client bundle has no "react/jsx-runtime" binding to splice against')
    process.exit(1)
  }
  return match[1]
}

/** The shield every permission glyph is drawn from, copied so this entry cannot break. */
const shieldPath =
  'M8.20554 0.899994L14.7901 3.36857V7.01026C14.7901 12 11.0466 14.2103 8.20554 15.3C5.36446 14.2103 1.62012 12 1.62012 7.01026V3.36857L8.20554 0.899994Z'

/**
 * The glyph is a shield holding two content lines, with a four-pointed star over its lower
 * right corner — the same shape language as 工作区内修改, whose pen covers that corner.
 *
 * The star is a solid shape that reaches past the shield's outline, so the outline cannot
 * simply be drawn under it: a circular mask cuts the stroke away inside the star's corner,
 * the way the workspace glyph's own path leaves that corner out. The mask id is shared by
 * every instance, which is harmless because each instance paints the same thing.
 */
const notchId = 'smart-approval-notch'
const notchCx = '11.85'
const notchCy = '11.45'
const notchRadius = '3'
/** Content lines, in the upper half, kept clear of the star's top point. */
const contentLines = ['M10.6 4.65V5.75H4.8V4.65H10.6Z', 'M9.2 6.45V7.55H4.8V6.45H9.2Z']
/** Star: radius 3.5 about the notch centre, waist at 0.235 of the radius. */
const starPath =
  'M11.85 7.95Q13.01 10.29 15.35 11.45Q13.01 12.61 11.85 14.95Q10.69 12.61 8.35 11.45Q10.69 10.29 11.85 7.95Z'

/** One `permissionGlyphs` entry: mask, notched shield outline, content lines, corner star. */
function smartApprovalGlyph(file) {
  const jsx = jsxRuntimeName(file)
  const lines = contentLines
    .map((d) => `\t\t\t\t\t(0, ${jsx}.jsx)("path", { d: "${d}", fill: "currentColor" }),\n`)
    .join('')
  return `\t\t\t["smart-approval", (0, ${jsx}.jsxs)("svg", {
\t\t\t\twidth: "16",
\t\t\t\theight: "16",
\t\t\t\tviewBox: "0 0 16 16",
\t\t\t\tfill: "none",
\t\t\t\t"aria-hidden": true,
\t\t\t\tchildren: [
\t\t\t\t\t(0, ${jsx}.jsxs)("mask", {
\t\t\t\t\t\tid: "${notchId}",
\t\t\t\t\t\tmaskUnits: "userSpaceOnUse",
\t\t\t\t\t\tx: "0",
\t\t\t\t\t\ty: "0",
\t\t\t\t\t\twidth: "16",
\t\t\t\t\t\theight: "16",
\t\t\t\t\t\tchildren: [
\t\t\t\t\t\t\t(0, ${jsx}.jsx)("rect", {
\t\t\t\t\t\t\t\twidth: "16",
\t\t\t\t\t\t\t\theight: "16",
\t\t\t\t\t\t\t\tfill: "#fff"
\t\t\t\t\t\t\t}),
\t\t\t\t\t\t\t(0, ${jsx}.jsx)("circle", {
\t\t\t\t\t\t\t\tcx: "${notchCx}",
\t\t\t\t\t\t\t\tcy: "${notchCy}",
\t\t\t\t\t\t\t\tr: "${notchRadius}",
\t\t\t\t\t\t\t\tfill: "#000"
\t\t\t\t\t\t\t})
\t\t\t\t\t\t]
\t\t\t\t\t}),
\t\t\t\t\t(0, ${jsx}.jsx)("path", {
\t\t\t\t\t\td: "${shieldPath}",
\t\t\t\t\t\tstroke: "currentColor",
\t\t\t\t\t\tstrokeWidth: "1.31831",
\t\t\t\t\t\tstrokeLinejoin: "round",
\t\t\t\t\t\tmask: "url(#${notchId})"
\t\t\t\t\t}),
${lines}\t\t\t\t\t(0, ${jsx}.jsx)("path", {
\t\t\t\t\t\td: "${starPath}",
\t\t\t\t\t\tfill: "currentColor"
\t\t\t\t\t})
\t\t\t\t]
\t\t\t})],
`
}

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
    id: 'filemanager-icon',
    why: 'the file-manager row has no desktop id, so its icon is never looked up',
    find: /linux:\s*spec\(\s*desktopCli\(\s*(["'])xdg-open\1\s*\)\s*\)/,
    replace: 'linux: desktopSpec("org.gnome.Nautilus", desktopCli("xdg-open"))',
    applied: /linux:\s*desktopSpec\(\s*(["'])org\.gnome\.Nautilus\1/,
  },
  {
    id: 'androidstudio-icon',
    why: 'Android Studio has no desktop id, so its icon is never looked up',
    find: /linux:\s*spec\(\s*cli\(\s*(["'])studio\1\s*\)\s*,\s*file\(\[/,
    replace: 'linux: desktopSpec("android-studio", cli("studio"), file([',
    applied: /linux:\s*desktopSpec\(\s*(["'])android-studio\1/,
  },
]

/**
 * The permission glyph table in `dsh-client-ui-conversation` is a fixed design set, and
 * the composer chip draws nothing for a preset value it does not know — which is what
 * happened to our own `smart-approval` preset, a shipped row of the default composition.
 * The preset table itself has no icon field to fill in, so the glyph has to join the
 * table. Upstream would take this as a real contribution; until then this is the patch
 * that keeps the chip from losing its icon while the user is on 智能批准.
 */
const clientPatches = [
  {
    id: 'smart-approval-glyph',
    why: 'the glyph table has no entry for the smart-approval preset, so its chip shows no icon',
    find: /(\t*const permissionGlyphs = new Map\(\[\n)/,
    // An earlier copy of this entry (the star alone) is dropped first, so revising the
    // design replaces it instead of leaving a second entry for the same key behind.
    remove: /\t*\["smart-approval", \(0, \w+\.jsxs\)\("svg",[\s\S]*?\n\t*\}\)\],\n/g,
    replace: (match, file) => match + smartApprovalGlyph(file),
    applied: new RegExp(notchId),
    parse: true,
  },
]

const targets = [
  {
    package: 'dsh-host-open-in-app',
    files: ['lib/index.js', 'lib/types/catalog.js'],
    linuxOnly: true,
    patches: openInAppPatches,
  },
  {
    package: 'dsh-client-ui-conversation',
    files: ['lib/client.js'],
    linuxOnly: false,
    patches: clientPatches,
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
