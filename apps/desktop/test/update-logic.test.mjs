/**
 * Unit tests for the updater's pure logic. No network, no Electron.
 *
 *   node apps/desktop/test/update-logic.test.mjs
 */
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { isNewer, pickAsset, downloadRelease, UPDATE_REPO } from '../src/update-logic.mjs'

let failures = 0
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name} → ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`)
}

// ---- version comparison ----------------------------------------------------
check('0.1.4 比 0.1.3 新', isNewer('0.1.4', '0.1.3'), true)
check('带 v 前缀一样可比', isNewer('v0.1.4', '0.1.3'), true)
check('同版本不算新', isNewer('0.1.3', '0.1.3'), false)
check('旧版本不算新', isNewer('0.1.2', '0.1.3'), false)
check('多位数字按数值比（0.1.10 > 0.1.9）', isNewer('0.1.10', '0.1.9'), true)
check('次版本进位（0.2.0 > 0.1.99）', isNewer('0.2.0', '0.1.99'), true)
check('预发布旧于正式版（0.1.4-rc.1 < 0.1.4）', isNewer('0.1.4-rc.1', '0.1.4'), false)
check('正式版新于预发布（0.1.4 > 0.1.4-rc.1）', isNewer('0.1.4', '0.1.4-rc.1'), true)
check('预发布之间可比（rc.2 > rc.1）', isNewer('0.1.4-rc.2', '0.1.4-rc.1'), true)
check('缺段按 0（0.2 == 0.2.0）', isNewer('0.2', '0.2.0'), false)

// ---- asset selection ------------------------------------------------------
const assets = [
  { name: 'neo-dsh-0.1.4-linux-x64.zip', size: 10, browser_download_url: 'https://example.invalid/zip' },
  { name: 'neo-dsh-0.1.4-linux-x86_64.AppImage', size: 10, browser_download_url: 'https://example.invalid/ai' },
  { name: 'neo-dsh-0.1.4-mac-arm64.dmg', size: 10, browser_download_url: 'https://example.invalid/dmg' },
  { name: 'neo-dsh-0.1.4-win-x64.exe', size: 10, browser_download_url: 'https://example.invalid/exe' },
  { name: 'neo-dsh-0.1.4-linux-amd64.deb', size: 10, browser_download_url: 'https://example.invalid/deb' },
]
const pick = (t) => pickAsset(assets, t)?.name
check('Linux（installer 版）拿 zip', pick({ platform: 'linux', arch: 'x64' }), 'neo-dsh-0.1.4-linux-x64.zip')
check('Linux（AppImage 版）拿 AppImage', pick({ platform: 'linux', arch: 'x64', appImage: '/opt/x.AppImage' }), 'neo-dsh-0.1.4-linux-x86_64.AppImage')
check('macOS 拿 dmg', pick({ platform: 'darwin', arch: 'arm64' }), 'neo-dsh-0.1.4-mac-arm64.dmg')
check('Windows 拿 exe', pick({ platform: 'win32', arch: 'x64' }), 'neo-dsh-0.1.4-win-x64.exe')
const bothArches = [
  { name: 'neo-dsh-0.1.4-mac-x64.dmg', size: 1, browser_download_url: 'https://example.invalid/a' },
  { name: 'neo-dsh-0.1.4-mac-arm64.dmg', size: 1, browser_download_url: 'https://example.invalid/b' },
]
check('两个 mac 架构时按当前架构挑', pickAsset(bothArches, { platform: 'darwin', arch: 'arm64' })?.name, 'neo-dsh-0.1.4-mac-arm64.dmg')
check('发行版里没有匹配资源 → undefined', pickAsset([{ name: 'notes.txt' }], { platform: 'linux', arch: 'x64' }), undefined)
check('资源列表缺失 → undefined', pickAsset(undefined, { platform: 'linux', arch: 'x64' }), undefined)
check('仓库指向本项目', UPDATE_REPO, 'NeoWangKing/neo-dsh')

// ---- download ------------------------------------------------------------
const payload = new Uint8Array(4096).fill(7)
const fakeFetch = async () => ({ ok: true, body: Readable.toWeb(Readable.from([payload])) })
const progress = []
const done = await downloadRelease(
  { name: 'fake-asset.zip', size: payload.length, browser_download_url: 'https://example.invalid/x' },
  { fetchImpl: fakeFetch, onProgress: (p) => progress.push(p.percent) },
)
check('下载落盘字节数正确', statSync(done.path).size, payload.length)
check('内容与源一致', readFileSync(done.path).equals(Buffer.from(payload)), true)
check('最后一次进度是 100%', progress[progress.length - 1], 100)

let threw = ''
try {
  await downloadRelease(
    { name: 'short.zip', size: 999, browser_download_url: 'https://example.invalid/x' },
    { fetchImpl: fakeFetch, onProgress: () => {} },
  )
} catch (error) { threw = String(error.message) }
check('字节数不符会报错（不会静默装上半个包）', threw.includes('incomplete download'), true)

let httpThrew = ''
try {
  await downloadRelease(
    { name: 'x.zip', size: 1, browser_download_url: 'https://example.invalid/x' },
    { fetchImpl: async () => ({ ok: false, status: 500 }), onProgress: () => {} },
  )
} catch (error) { httpThrew = String(error.message) }
check('HTTP 错误会报错', httpThrew.includes('HTTP 500'), true)

rmSync(join(tmpdir(), 'neo-dsh-update'), { recursive: true, force: true })
console.log(failures === 0 ? '\nall update-logic checks passed' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
