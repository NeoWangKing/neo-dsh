#!/usr/bin/env node
/**
 * Print the desktop app's data directory.
 *
 * Since 0.1.12 the app keeps its own home, so a `dsh` command run from a terminal
 * (which has one of its own) does not touch the app's sessions, credentials or
 * plugins. Point one at the app's home by exporting what this prints:
 *
 *   DSH_HOME=$(node apps/desktop/scripts/app-home.mjs) dsh plugin --profile web list
 *   DSH_HOME=$(pnpm run --silent app-home) dsh --profile headless "run the tests"
 *
 * `--verbose` writes where the answer came from (env / chosen / default) to stderr.
 */
import { homedir } from 'node:os'
import { defaultUserDataDir, resolveHome } from '../src/desktop-home.mjs'

const home = resolveHome({
  configDir: defaultUserDataDir(process.platform, process.env, homedir()),
  platform: process.platform,
  env: process.env,
})

if (process.argv.includes('--verbose')) {
  process.stderr.write(`# data home (${home.source}): ${home.path}\n`)
}
process.stdout.write(`${home.path}\n`)
