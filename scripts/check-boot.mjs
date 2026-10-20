#!/usr/bin/env node
// Release gate: a boot log is only healthy when every plugin activated.
//
// 0.2.6 shipped with "web boot: 4 entries did not activate" — the chat UI and three memory
// plugins — while the desktop smoke test still printed SMOKE OK, because that test only checks
// that the window renders. The window rendering is not the product working.
//
// Usage: node scripts/check-boot.mjs <logfile>   (or pipe the host output on stdin)
import { readFileSync } from 'node:fs'

const file = process.argv[2]
const text = file ? readFileSync(file, 'utf8') : readFileSync(0, 'utf8')

const lines = text.split('\n')
const failed = lines.filter((l) => /did not activate|import failed|Failed to load plugins/i.test(l))
const count = lines
  .map((l) => /(\d+) entries? did not activate/.exec(l))
  .filter(Boolean)
  .map((m) => Number(m[1]))
  .reduce((a, b) => Math.max(a, b), 0)

if (count > 0 || failed.length > 0) {
  console.error(`✗ boot log is not clean: ${count} plugin(s) did not activate`)
  for (const l of failed.slice(0, 12)) console.error('  ' + l.trim())
  process.exit(1)
}
console.log('✓ boot log clean: every plugin activated')
