import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { applyPayload, confirmPatchBoot, countBoot, isAllowedPath, pendingPatch, planPayload, restoreBackup, sha256Of, validateManifest } from '../src/patch-apply.mjs'

let failed = 0
const check = (name, actual, expected) => {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failed += 1
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${ok ? '' : ` → ${JSON.stringify(actual)} ≠ ${JSON.stringify(expected)}`}`)
}
const throws = (name, fn, needle) => {
  try {
    fn()
    failed += 1
    console.log(`FAIL  ${name} → 没有抛错`)
  } catch (error) {
    const ok = error.message.includes(needle)
    if (!ok) failed += 1
    console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name}${ok ? '' : ` → ${error.message}`}`)
  }
}

const manifest = (over = {}) => JSON.stringify({
  patchId: '0.2.3-p1',
  appliesTo: ['0.2.3'],
  payloadUrl: 'https://example.invalid/payload.tar.zst',
  sha256: 'a'.repeat(64),
  summary: 'test',
  ...over,
})

check('清单可解析', validateManifest(manifest(), { appVersion: '0.2.3' }).patchId, '0.2.3-p1')
throws('版本不匹配时拒绝', () => validateManifest(manifest(), { appVersion: '0.2.4' }), 'does not apply')
throws('sha256 缺失时拒绝', () => validateManifest(manifest({ sha256: 'nope' })), 'sha256')
throws('空 appliesTo 拒绝', () => validateManifest(manifest({ appliesTo: [] })), 'appliesTo')
throws('非 JSON 拒绝', () => validateManifest('{oops'), 'not JSON')

check('允许 profile 资源', isAllowedPath('resources/profile-web/cordis.patch.yml'), true)
check('允许我们的主进程模块', isAllowedPath('resources/app/src/patch-apply.mjs'), true)
check('拒绝 harness 依赖', isAllowedPath('resources/app/node_modules/@deepseek-ai/dsh/package.json'), false)
check('拒绝 Electron 本体', isAllowedPath('resources/app/package.json'), false)
check('拒绝越界路径', isAllowedPath('../../etc/passwd'), false)
check('拒绝绝对路径', isAllowedPath('/etc/shadow'), false)

const dir = mkdtempSync(join(tmpdir(), 'patch-test-'))
const root = join(dir, 'root')
const payload = join(dir, 'payload')
const stateDir = join(dir, 'state')
mkdirSync(join(root, 'resources/profile-web'), { recursive: true })
mkdirSync(join(root, 'resources/app/src'), { recursive: true })
writeFileSync(join(root, 'resources/profile-web/cordis.patch.yml'), 'old: 1\n')
mkdirSync(join(payload, 'resources/profile-web'), { recursive: true })
mkdirSync(join(payload, 'resources/app/src'), { recursive: true })
writeFileSync(join(payload, 'resources/profile-web/cordis.patch.yml'), 'new: 2\n')
writeFileSync(join(payload, 'resources/app/src/fresh.mjs'), 'export const fresh = 1\n')

check('列出 payload 文件', planPayload(payload).length, 2)
const applied = applyPayload({ root, payloadDir: payload, stateDir, manifest: validateManifest(manifest(), { appVersion: '0.2.3' }) })
check('覆盖了已有文件', readFileSync(join(root, 'resources/profile-web/cordis.patch.yml'), 'utf8'), 'new: 2\n')
check('写入了新文件', existsSync(join(root, 'resources/app/src/fresh.mjs')), true)
check('留下了待确认标记', pendingPatch(stateDir).patchId, '0.2.3-p1')
check('第一次启动只记数', countBoot({ root, stateDir }).boot, 1)
check('第二次启动触发回滚', countBoot({ root, stateDir }).rolledBack, '0.2.3-p1')
check('回滚后旧内容回来了', readFileSync(join(root, 'resources/profile-web/cordis.patch.yml'), 'utf8'), 'old: 1\n')
check('回滚后新增文件被删掉', existsSync(join(root, 'resources/app/src/fresh.mjs')), false)

applyPayload({ root, payloadDir: payload, stateDir, manifest: validateManifest(manifest(), { appVersion: '0.2.3' }) })
countBoot({ root, stateDir })
check('启动成功后确认补丁', confirmPatchBoot(stateDir), '0.2.3-p1')
check('确认后不再有待处理标记', pendingPatch(stateDir), null)
check('再启动不会误回滚', countBoot({ root, stateDir }).rolledBack, null)

rmSync(dir, { recursive: true, force: true })
console.log(failed === 0 ? 'all patch-apply checks passed' : `${failed} patch-apply check(s) failed`)
process.exit(failed === 0 ? 0 : 1)
