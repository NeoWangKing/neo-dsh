/**
 * check-node.mjs — refuse to run the build with a Node the harness cannot use.
 *
 * The harness declares `^22.19 || >=24` (Node 20 has no `node:sqlite`), but a
 * machine's default Node is often older — nvm's default alias is a common trap.
 * Without this check the failure surfaces much later and much less clearly: the
 * host exits during boot, or pnpm resolves a tree the native addons do not match.
 *
 * Wired into the root scripts, so every build/run entry point checks first.
 * Usage: node scripts/check-node.mjs
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'

const REPO = dirname(dirname(fileURLToPath(import.meta.url)))
const range = JSON.parse(readFileSync(join(REPO, 'package.json'), 'utf8')).engines?.node ?? '^22.19 || >=24'
const current = process.versions.node
const [major, minor] = current.split('.').map((n) => Number.parseInt(n, 10))

if (major >= 24 || (major === 22 && minor >= 19)) {
  console.log(`check-node: node ${current} (requires ${range})`)
  process.exit(0)
}

console.error(`check-node: node ${current} cannot build or run this suite — it requires ${range}.`)
console.error('  the harness needs node:sqlite and the Node 22 native-addon ABI.')
console.error('  with nvm:  nvm alias default 22.23.1 && nvm use 22.23.1')
console.error('  or once:   PATH="$HOME/.nvm/versions/node/v22.23.1/bin:$PATH" pnpm ...')
process.exit(1)
