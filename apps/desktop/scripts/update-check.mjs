#!/usr/bin/env node
/**
 * Check the update path without Electron.
 *
 *   node apps/desktop/scripts/update-check.mjs              # what is newest?
 *   node apps/desktop/scripts/update-check.mjs --download   # also fetch the asset
 *
 * Reports the newest release of this project, which asset this platform would
 * install, and — with --download — streams it to the update directory. It never
 * installs anything: the swap needs the app to be closed and is done by the
 * shell's detached helper.
 */
import { readFileSync } from 'node:fs'
import { dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { UPDATE_REPO, downloadRelease, fetchLatestRelease, isNewer, pickAsset } from '../src/update-logic.mjs'

const here = dirname(fileURLToPath(import.meta.url))
const manifest = JSON.parse(readFileSync(join(here, '..', 'package.json'), 'utf8'))
const wantDownload = process.argv.includes('--download')

const current = process.env.NEO_DSH_VERSION ?? manifest.version
const release = await fetchLatestRelease()
const latest = String(release.tag_name ?? '').replace(/^v/i, '')
const asset = pickAsset(release.assets, {
  platform: process.platform,
  arch: process.arch,
  appImage: process.env.APPIMAGE,
})

console.log(`repo     ${UPDATE_REPO}`)
console.log(`current  ${current}`)
console.log(`latest   ${latest}  (${isNewer(latest, current) ? '有更新' : '已是最新'})`)
console.log(`asset    ${asset === undefined ? '(本平台无匹配资源)' : `${asset.name}  ${asset.size} bytes`}`)
console.log(`url      ${release.html_url ?? ''}`)

if (wantDownload) {
  if (asset === undefined) {
    console.error('没有可下载的资源')
    process.exit(1)
  }
  let lastLine = 0
  const done = await downloadRelease(asset, {
    onProgress: ({ received, total, percent }) => {
      const now = Date.now()
      if (percent !== null && now - lastLine > 900) {
        lastLine = now
        process.stdout.write(`\r  ${percent}%  ${received}/${total} bytes   `)
      }
    },
  })
  console.log(`\ndownloaded ${done.path} (${done.bytes} bytes)`)
}
