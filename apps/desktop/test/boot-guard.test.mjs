/**
 * Unit tests for safe mode and the boot-failure counter. No Electron, no YAML library.
 *
 *   node apps/desktop/test/boot-guard.test.mjs
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  SAFE_PROFILE, clearBootFailures, isSafeRequested, profileBundles, readBootState, recordBootFailure,
  repairProfile, repairSettings, shouldOfferSafeMode, unresolvedBundles, writeBootState,
} from '../src/boot-guard.mjs'

let failures = 0
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name} → ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`)
}

// ---- how safe mode is asked for ------------------------------------------
check('--safe 就是要安全模式', isSafeRequested(['--safe']), true)
check('--safe-mode 也算', isSafeRequested(['electron', '--safe-mode']), true)
check('环境变量 DSH_DESKTOP_SAFE=1 也算', isSafeRequested([], { DSH_DESKTOP_SAFE: '1' }), true)
check('普通启动不是', isSafeRequested(['--inspect'], {}), false)
check('DSH_DESKTOP_SAFE=0 也不是', isSafeRequested([], { DSH_DESKTOP_SAFE: '0' }), false)
check('安全模式的 profile 名固定', SAFE_PROFILE, 'web-safe')

// ---- the counter ---------------------------------------------------------
const home = mkdtempSync(join(tmpdir(), 'neo-dsh-boot-'))
check('没有记录 → 0 次失败', readBootState(home), { failures: 0 })
check('0 次失败不提议安全模式', shouldOfferSafeMode(readBootState(home)), false)

recordBootFailure(home, 'the dsh host exited before it was ready')
check('失败一次 → 记下原因', [readBootState(home).failures, readBootState(home).lastReason], [1, 'the dsh host exited before it was ready'])
check('一次还不提议（可能只是偶发）', shouldOfferSafeMode(readBootState(home)), false)
recordBootFailure(home, 'the dsh host exited before it was ready')
check('连续两次 → 提议安全模式', shouldOfferSafeMode(readBootState(home)), true)
recordBootFailure(home, 'something else')
check('累积到三次 → 仍然提议，原因是最后一次', [readBootState(home).failures, readBootState(home).lastReason], [3, 'something else'])

clearBootFailures(home)
check('窗口起来了 → 清零（并记住成功）', [readBootState(home).failures, typeof readBootState(home).lastSuccessAt], [0, 'string'])
check('清零之后不再提议', shouldOfferSafeMode(readBootState(home)), false)

writeFileSync(join(home, 'desktop-boot.json'), '{ this is not json')
check('记录文件坏了 → 当作 0 次（不吓唬人）', readBootState(home).failures, 0)
writeFileSync(join(home, 'desktop-boot.json'), JSON.stringify({ failures: 'lots' }))
check('failures 不是数字 → 当作 0', readBootState(home).failures, 0)

writeBootState(home, { failures: 5 })
check('可以指定阈值', [shouldOfferSafeMode(readBootState(home), { threshold: 10 }), shouldOfferSafeMode(readBootState(home), { threshold: 5 })], [false, true])

// ---- repairing a settings.yaml that cannot be parsed ---------------------
const settingsHome = mkdtempSync(join(tmpdir(), 'neo-dsh-settings-'))
const defaults = join(settingsHome, 'settings.defaults.yaml')
writeFileSync(defaults, 'agent-default-model:\n  model: deepseek-flash\n')
const parse = (text) => {
  if (!/^[a-zA-Z-]+:/m.test(text)) throw new Error('bad yaml')
  return { ok: true }
}

check('settings.yaml 不存在 → 什么都不做', repairSettings(join(settingsHome, 'empty'), defaults, { parse }), { repaired: false })

const good = join(settingsHome, 'good')
mkdirSync(good, { recursive: true })
writeFileSync(join(good, 'settings.yaml'), 'ui-theme:\n  preference: dark\n')
check('能解析 → 不动它', repairSettings(good, defaults, { parse }), { repaired: false })
check('  文件还是原样', readFileSync(join(good, 'settings.yaml'), 'utf8'), 'ui-theme:\n  preference: dark\n')

const broken = join(settingsHome, 'broken')
mkdirSync(broken, { recursive: true })
writeFileSync(join(broken, 'settings.yaml'), '{{{{ not yaml at all')
const report = repairSettings(broken, defaults, { parse, now: () => new Date('2026-09-29T05:00:00Z') })
check('不能解析 → 报告已修复', report.repaired, true)
check('  坏文件被改名保留（不删）', readFileSync(report.movedTo, 'utf8'), '{{{{ not yaml at all')
check('  路径里带时间戳', report.movedTo, join(broken, 'settings.yaml.broken-2026-09-29T05-00-00-000Z'))
check('  默认设置被放回去', readFileSync(join(broken, 'settings.yaml'), 'utf8'), 'agent-default-model:\n  model: deepseek-flash\n')

const brokenNoDefaults = join(settingsHome, 'broken2')
mkdirSync(brokenNoDefaults, { recursive: true })
writeFileSync(join(brokenNoDefaults, 'settings.yaml'), '{{{ definitely not yaml')
const withoutDefaults = repairSettings(brokenNoDefaults, '', { parse })
check('没有默认设置可放 → 只把坏文件挪走', [withoutDefaults.repaired, existsSync(join(brokenNoDefaults, 'settings.yaml'))], [true, false])

// ---- is the profile loadable, and repairing it ---------------------------
check('能读出 bundle 列表', profileBundles(JSON.stringify({ dsh: { profile: { bundles: ['a', 'b'] } } })), ['a', 'b'])
check('清单不是 JSON → 报错', (() => { try { profileBundles('{ nope') } catch (error) { return /not valid JSON/.test(error.message) } return false })(), true)
check('清单没有 bundles → 报错', (() => { try { profileBundles('{}') } catch (error) { return /lists no dsh/.test(error.message) } return false })(), true)

const resolvable = (name) => name !== 'dsh-does-not-exist'
check('挑出解析不到的 bundle', unresolvedBundles(['a', 'dsh-does-not-exist', 'b'], resolvable), ['dsh-does-not-exist'])
check('全都解析得到 → 空', unresolvedBundles(['a', 'b'], resolvable), [])
check('不是数组也不崩', unresolvedBundles(undefined, resolvable), [])

const repairHome = mkdtempSync(join(tmpdir(), 'neo-dsh-repair-'))
const shippedProfile = join(repairHome, 'shipped')
mkdirSync(join(shippedProfile, 'vendor'), { recursive: true })
writeFileSync(join(shippedProfile, 'package.json'), '{"name":"neo-dsh-profile-web"}\n')
mkdirSync(join(repairHome, 'profiles', 'web'), { recursive: true })
writeFileSync(join(repairHome, 'profiles', 'web', 'package.json'), '{"broken":true}\n')
const repaired = repairProfile({
  home: repairHome,
  profile: 'web',
  shipped: shippedProfile,
  now: () => new Date('2026-09-29T06:00:00Z'),
})
check('坏 profile 被换掉', [repaired.repaired, readFileSync(join(repairHome, 'profiles', 'web', 'package.json'), 'utf8')], [true, '{"name":"neo-dsh-profile-web"}\n'])
check('旧的那份被改名保留（不删）', readFileSync(join(repaired.movedTo, 'package.json'), 'utf8'), '{"broken":true}\n')
check('  名字里带时间戳', repaired.movedTo, join(repairHome, 'profiles', 'web.broken-2026-09-29T06-00-00-000Z'))

const missingShipped = repairProfile({ home: repairHome, profile: 'web', shipped: join(repairHome, 'nope') })
check('随包 profile 不在 → 报告失败', missingShipped.repaired, false)

rmSync(home, { recursive: true, force: true })
rmSync(settingsHome, { recursive: true, force: true })
rmSync(repairHome, { recursive: true, force: true })
console.log(failures === 0 ? '\nall boot-guard checks passed' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
