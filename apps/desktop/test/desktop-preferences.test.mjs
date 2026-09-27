/**
 * Unit tests for the shell's window preferences. No Electron, no window.
 *
 *   node apps/desktop/test/desktop-preferences.test.mjs
 */
import { mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  DEFAULT_PREFERENCES, preferencesPath, readPreferences, wantsNativeFrame, writePreferences,
} from '../src/desktop-preferences.mjs'

let failures = 0
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name} → ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`)
}

const home = mkdtempSync(join(tmpdir(), 'neo-dsh-prefs-'))

check('没有文件时用默认值', readPreferences(home), { ...DEFAULT_PREFERENCES })
check('路径在 $DSH_HOME 下', preferencesPath(home), join(home, 'desktop-preferences.json'))
check('默认：Linux 不用原生边框', wantsNativeFrame('linux', readPreferences(home)), false)
check('默认：macOS 恒用原生边框', wantsNativeFrame('darwin', readPreferences(home)), true)
check('默认：Windows 恒用原生边框', wantsNativeFrame('win32', readPreferences(home)), true)

check('写入后可读回', writePreferences(home, { nativeFrame: true }), { nativeFrame: true })
check('回读一致', readPreferences(home).nativeFrame, true)
check('开关后 Linux 用原生边框', wantsNativeFrame('linux', readPreferences(home)), true)
check('关掉后回到无边框', writePreferences(home, { nativeFrame: false }).nativeFrame, false)
check('未知键会被保留（向前兼容）', writePreferences(home, { future: 'keep-me' }).future, 'keep-me')

writeFileSync(preferencesPath(home), '{ this is not json', 'utf8')
check('文件损坏 → 回落默认值，不抛错', readPreferences(home), { ...DEFAULT_PREFERENCES })
writeFileSync(preferencesPath(home), '[1,2,3]', 'utf8')
check('文件是数组 → 回落默认值', readPreferences(home), { ...DEFAULT_PREFERENCES })

rmSync(home, { recursive: true, force: true })
console.log(failures === 0 ? '\nall desktop-preferences checks passed' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
