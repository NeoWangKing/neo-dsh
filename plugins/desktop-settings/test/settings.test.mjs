/**
 * Unit tests for the desktop-settings client half. No browser, no React runtime:
 * the bundle only builds components inside the module loader's factory, so loading
 * it under Node exercises the pure parts (status copy, dictionaries).
 *
 *   node plugins/desktop-settings/test/settings.test.mjs
 */
import { createRequire } from 'node:module'

const require = createRequire(import.meta.url)
const { statusText, dataErrorText, LOCALE_ZH, LOCALE_EN } = require('../client.js')

let failures = 0
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name} → ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`)
}

const t = (key) => LOCALE_ZH[key] ?? key

check('空闲 → 无文案', statusText({ phase: 'idle' }, t), '')
check('检查中', statusText({ phase: 'checking' }, t), '正在检查更新…')
check('已是最新（带版本号）', statusText({ phase: 'checked', version: '0.1.3', latest: '0.1.3', hasUpdate: false }, t), '已是最新版本')
check('发现新版本（当前与最新都显示）', statusText({ phase: 'checked', version: '0.1.3', latest: '0.1.4', hasUpdate: true }, t), '发现新版本 v0.1.4')
check('安装包还在上传 → 明确说明', statusText({ phase: 'checked', version: '0.1.3', latest: '0.1.4', hasUpdate: true, assetReady: false }, t), '发现新版本 v0.1.4（安装包仍在上传，稍后再试）')
check('下载中带百分比', statusText({ phase: 'downloading', version: '0.1.4', percent: 42 }, t), '正在下载 v0.1.4 42%')
check('下载中无百分比也不崩', statusText({ phase: 'downloading', version: '0.1.4', percent: null }, t), '正在下载 v0.1.4')
check('已下载', statusText({ phase: 'downloaded', version: '0.1.4' }, t), '已下载，可以安装：v0.1.4')
check('安装中', statusText({ phase: 'installing', version: '0.1.4' }, t), '正在安装并重启… v0.1.4')
check('错误带原因', statusText({ phase: 'error', message: 'GitHub API 403' }, t), '检查更新失败：GitHub API 403')
check('未知状态不崩', statusText(undefined, t), '')

// ---- the data-location row's failure copy --------------------------------
check('目标目录非空 → 说清楚该怎么办', dataErrorText('target-not-empty', t), '这个目录里已经有别的东西了，请换一个空目录，避免两边混在一起。')
check('没有错误 → 不显示', dataErrorText('', t), '')
check('未知代码 → 原样显示，不静默', dataErrorText('boom', t), 'boom')
const codes = ['not-absolute', 'same-path', 'nested-path', 'target-not-empty', 'failed']
check('每个失败代码都有文案', codes.filter((code) => { const text = dataErrorText(code, t); return text === '' || text === code }), [])

const zhKeys = Object.keys(LOCALE_ZH).sort()
const enKeys = Object.keys(LOCALE_EN).sort()
check('中英文字典键完全一致', enKeys, zhKeys)
check('没有空文案', zhKeys.filter((key) => String(LOCALE_ZH[key]).trim() === '' || String(LOCALE_EN[key]).trim() === ''), [])

console.log(failures === 0 ? '\nall desktop-settings checks passed' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
