/**
 * Unit tests for the updater's pure logic. No network, no Electron.
 *
 *   node apps/desktop/test/update-logic.test.mjs
 */
import { mkdtempSync, readFileSync, rmSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { Readable } from 'node:stream'
import { describeNetworkError, fetchLatestRelease, GithubHttpError, isNewer, NoVersionReleaseError, pickAsset, pickNewestVersionRelease, downloadRelease, UPDATE_REPO } from '../src/update-logic.mjs'

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

// ---- release lookup: version releases only --------------------------------
//
// The regression this file exists for now: the hot-patch channel keeps a release tagged `patch`
// whose assets are replaced in place. Being published last, it became what `releases/latest`
// returned — so the app read the tag `patch`, found it was not a version, and reported itself up
// to date while v0.2.4 sat one entry below it. The two channels have to stay independent:
// patches ship quietly, and a version release is always visible.
const publishedAfterTheVersion = [
  { tag_name: 'patch', draft: false, prerelease: false, assets: [{ name: 'patch.json' }] },
  { tag_name: 'v0.2.4', draft: false, prerelease: false, assets: [{ name: 'neo-dsh-0.2.4-mac-arm64.dmg' }] },
  { tag_name: 'v0.2.3', draft: false, prerelease: false, assets: [{ name: 'neo-dsh-0.2.3-mac-arm64.dmg' }] },
]
check(
  '非版本 release（tag=patch）被忽略，最高版本胜出',
  pickNewestVersionRelease(publishedAfterTheVersion)?.tag_name,
  'v0.2.4',
)
check(
  '发布顺序颠倒也不影响：列表里挂着 patch，仍选中 v0.2.4 的资源',
  pickAsset(pickNewestVersionRelease(publishedAfterTheVersion).assets, { platform: 'darwin', arch: 'arm64' })?.name,
  'neo-dsh-0.2.4-mac-arm64.dmg',
)
check(
  '低于当前版本时不提示（0.2.4 对 0.2.4）',
  isNewer(pickNewestVersionRelease(publishedAfterTheVersion).tag_name, '0.2.4'),
  false,
)
check(
  '最高版本按数值比较，不按字符串（v0.2.10 > v0.2.9）',
  pickNewestVersionRelease([{ tag_name: 'v0.2.9' }, { tag_name: 'v0.2.10' }])?.tag_name,
  'v0.2.10',
)
check(
  'prerelease 被跳过（同 tag 的正式版胜出）',
  pickNewestVersionRelease([
    { tag_name: 'v0.3.0-rc.1', prerelease: true },
    { tag_name: 'v0.2.4' },
  ])?.tag_name,
  'v0.2.4',
)
check(
  'draft 被跳过',
  pickNewestVersionRelease([{ tag_name: 'v0.3.0', draft: true }, { tag_name: 'v0.2.4' }])?.tag_name,
  'v0.2.4',
)
check('只有补丁 release → null', pickNewestVersionRelease([{ tag_name: 'patch' }]), null)
check('不是数组 → null', pickNewestVersionRelease(undefined), null)
check('空列表 → null', pickNewestVersionRelease([]), null)
check(
  '仓库没有版本发布时报的是可读的话，而不是"连不上 GitHub"',
  [describeNetworkError(new NoVersionReleaseError()).includes('版本'), describeNetworkError(new NoVersionReleaseError()).includes('无法连接')],
  [true, false],
)

// ---- release lookup: retry + readable failure ----------------------------
let askedUrl = ''
await fetchLatestRelease(
  async (url) => {
    askedUrl = String(url)
    return { ok: true, headers: { get: () => null }, json: async () => [{ tag_name: 'v1.0.0' }] }
  },
  { sleep: async () => {} },
)
check(
  '查询的是 release 列表，而不是 /releases/latest',
  [askedUrl.includes('/releases?'), askedUrl.includes('/releases/latest')],
  [true, false],
)

let calls = 0
const flakyFetch = async () => {
  calls += 1
  if (calls < 3) throw Object.assign(new Error('fetch failed'), { cause: { code: 'ECONNRESET' } })
  return { ok: true, headers: { get: () => null }, json: async () => [{ tag_name: 'v9.9.9' }] }
}
const release = await fetchLatestRelease(flakyFetch, { sleep: async () => {} })
check('瞬时失败会重试，第三次成功', [release.tag_name, calls], ['v9.9.9', 3])

let attempts = 0
let thrown = ''
try {
  await fetchLatestRelease(async () => { attempts += 1; throw Object.assign(new Error('fetch failed'), { cause: { code: 'ENOTFOUND' } }) }, { sleep: async () => {} })
} catch (error) { thrown = String(error.message) }
check('一直失败 → 报出原因码，而不是裸的 fetch failed', [attempts, thrown.includes('ENOTFOUND'), thrown.includes('fetch failed')], [3, true, true])
check('HTTP 错误带状态码', describeNetworkError(new Error('GitHub API 500 Internal Server Error')).includes('500'), true)

let limited = 0
let limitedMessage = ''
try {
  await fetchLatestRelease(async () => {
    limited += 1
    return { ok: false, status: 403, statusText: 'rate limit exceeded', headers: { get: (k) => (k === 'x-ratelimit-reset' ? String(Math.floor(Date.now() / 1000) + 600) : null) } }
  }, { sleep: async () => {} })
} catch (error) { limitedMessage = String(error.message) }
check('403 限流不重试（重试只会更糟）', limited, 1)
check('限流文案给出恢复时间', [limitedMessage.includes('限流'), limitedMessage.includes('分钟')], [true, true])

let seq = 0
const etagFetch = async (_url, options) => {
  seq += 1
  if (options?.headers?.['if-none-match'] === 'W/"abc"') return { status: 304, ok: false, headers: { get: () => null } }
  return { status: 200, ok: true, headers: { get: (k) => (k === 'etag' ? 'W/"abc"' : null) }, json: async () => [{ tag_name: `v1.0.${seq}` }] }
}
const first = await fetchLatestRelease(etagFetch, { sleep: async () => {} })
const second = await fetchLatestRelease(etagFetch, { sleep: async () => {} })
check('304 条件请求复用上次结果（不计入配额）', [first.tag_name, second.tag_name, seq], ['v1.0.1', 'v1.0.1', 2])

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
// ---- a download that never delivers must not hang forever ---------------
{
  const { downloadRelease } = await import('../src/update-logic.mjs')
  const { Readable } = await import('node:stream')
  const never = new Readable({ read() {} })
  const stalledAsset = {
    name: 'stalled-probe.bin',
    size: 1000,
    browser_download_url: 'https://example.invalid/stalled',
  }
  let message = ''
  const attempt = (async () => {
    try {
      await downloadRelease(stalledAsset, {
        idleTimeoutMs: 200,
        probeEveryMs: 50,
        fetchImpl: async () => ({ ok: true, status: 200, body: Readable.toWeb(never) }),
        onProgress: () => {},
      })
      return 'resolved'
    } catch (error) {
      return String(error?.message ?? error)
    }
  })()
  // The suite must not hang on the very failure this test is about.
  message = await Promise.race([
    attempt,
    new Promise((resolve) => setTimeout(() => resolve('TIMED OUT (still hanging)'), 5000)),
  ])
  never.destroy()
  check('下载一直没有数据 → 超时放弃（而不是永远挂在 0%）', /stalled/.test(message), true)
  check('  不会挂住（5 秒内一定有结果）', message.includes('TIMED OUT'), false)
}


// ---- 注入的 fetch 必须被真的用上 ----
// 应用把 Electron 的 net.fetch（Chromium 栈：走系统代理与系统信任库）注进来，
// 而不是 Node 的全局 fetch；这里锁住"注入会被用"，免得哪天被改回默认值。
// 同时锁住请求的是 release **列表**：/releases/latest 会被热补丁那类 release 顶替。
{
  const seen = []
  const fake = async (url, init) => {
    seen.push({ url, ua: init?.headers?.['user-agent'] })
    return { ok: true, status: 200, headers: { get: () => null }, json: async () => [{ tag_name: 'v9.9.9', assets: [] }] }
  }
  const release = await fetchLatestRelease(fake, { repo: UPDATE_REPO })
  check('注入的 fetch 收到了 GitHub releases API 地址（列表，不是 latest）', seen[0]?.url, `https://api.github.com/repos/${UPDATE_REPO}/releases?per_page=100`)
  check('注入的 fetch 收到了 updater 的 UA', seen[0]?.ua, 'neo-dsh-updater')
  check('返回值原样透出', release.tag_name, 'v9.9.9')
}

console.log(failures === 0 ? '\nall update-logic checks passed' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
