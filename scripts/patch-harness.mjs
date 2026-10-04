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
 */
import { existsSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const root = dirname(dirname(fileURLToPath(import.meta.url)))

const flagIndex = process.argv.indexOf('--package-dir')
const packageDir =
  flagIndex === -1
    ? join(root, 'apps', 'desktop', 'node_modules', '@deepseek-ai', 'dsh-host-open-in-app')
    : process.argv[flagIndex + 1]

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
const PATCHES = [
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

const catalogFiles = [join(packageDir, 'lib', 'index.js'), join(packageDir, 'lib', 'types', 'catalog.js')]

const missing = catalogFiles.filter((file) => !existsSync(file))
if (missing.length > 0) {
  console.error(`patch-harness: ${missing[0]} is missing — install the app's dependencies first`)
  process.exit(1)
}

const checkOnly = process.argv.includes('--check')
const report = []

for (const file of catalogFiles) {
  const label = file.slice(packageDir.length + 1)
  let text = readFileSync(file, 'utf8')
  for (const patch of PATCHES) {
    if (patch.applied.test(text)) {
      report.push(`  already applied  ${patch.id} (${label})`)
      continue
    }
    if (!patch.find.test(text)) {
      console.error(`patch-harness: anchor for "${patch.id}" is gone in ${label} (${patch.why})`)
      console.error(`  expected to match: ${String(patch.find)}`)
      process.exit(1)
    }
    if (checkOnly) {
      console.error(`patch-harness: "${patch.id}" is NOT applied in ${label} (${patch.why})`)
      process.exit(1)
    }
    text = text.replace(patch.find, patch.replace)
    report.push(`  applied          ${patch.id} (${label})`)
  }
  if (!checkOnly) writeFileSync(file, text)
}

console.log(`patch-harness: ${report.join('\n')}`)
