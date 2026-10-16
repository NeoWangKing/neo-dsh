#!/usr/bin/env node
/**
 * Apply, inspect or undo a hot patch against an installed Neo DSH tree.
 *
 *   node scripts/neo-dsh-patch.mjs --status
 *   node scripts/neo-dsh-patch.mjs --apply --from <patch.json|payload.tar.gz|https://…>
 *   node scripts/neo-dsh-patch.mjs --rollback
 *
 * The app applies patches by itself once the receiving half is in the build; this CLI is the
 * manual entry point, and the only way to reach an install that predates that half.
 */
import { execFileSync } from 'node:child_process'
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { basename, dirname, join } from 'node:path'
import { fileURLToPath } from 'node:url'
import { applyPayload, pendingPatch, restoreBackup, sha256Of, STATE_DIRNAME, validateManifest } from '../apps/desktop/src/patch-apply.mjs'

const args = process.argv.slice(2)
const flag = (name) => args.includes(name)
const value = (name, fallback = '') => {
  const index = args.indexOf(name)
  return index === -1 ? fallback : (args[index + 1] ?? fallback)
}
const root = value('--root', join(process.env.HOME ?? '', '.local', 'opt', 'neo-dsh'))
const stateDir = join(root, STATE_DIRNAME)
const from = value('--from')
const appVersion = existsSync(join(root, 'resources/app/package.json'))
  ? JSON.parse(readFileSync(join(root, 'resources/app/package.json'), 'utf8')).version
  : ''

if (flag('--status')) {
  const pending = pendingPatch(stateDir)
  const applied = existsSync(join(stateDir, 'applied.json'))
    ? JSON.parse(readFileSync(join(stateDir, 'applied.json'), 'utf8'))
    : null
  console.log(JSON.stringify({ root, appVersion, pending, applied }, null, 2))
  process.exit(0)
}

if (flag('--rollback')) {
  const pending = pendingPatch(stateDir)
  const patchId = value('--patch-id', pending?.patchId ?? (existsSync(join(stateDir, 'applied.json'))
    ? JSON.parse(readFileSync(join(stateDir, 'applied.json'), 'utf8')).patchId : ''))
  if (patchId === '') {
    console.error('rollback: 没有找到补丁记录（--patch-id 指定）')
    process.exit(2)
  }
  const done = restoreBackup({ root, stateDir, patchId })
  rmSync(join(stateDir, `backup-${patchId}`), { recursive: true, force: true })
  console.log(`已回滚 ${done.patchId}：还原 ${done.restored} 个文件，删除 ${done.removed} 个新增文件`)
  process.exit(0)
}

if (!flag('--apply') || from === '') {
  console.error('用法: --apply --from <patch.json|payload.tar.gz|https://…> [--root <安装目录>]')
  process.exit(2)
}

/** Fetch a URL through the environment proxy (the app does the same for the harness). */
async function fetchTo(url, file) {
  const response = await fetch(url, { redirect: 'follow' })
  if (!response.ok) throw new Error(`${response.status} ${response.statusText} for ${url}`)
  writeFileSync(file, Buffer.from(await response.arrayBuffer()))
  return file
}

const work = mkdtempSync(join(tmpdir(), 'neo-patch-'))
try {
  let local = from
  if (/^https?:\/\//.test(from)) {
    local = join(work, basename(new URL(from).pathname) || 'download')
    await fetchTo(from, local)
    console.log(`下载完成：${local} (${readFileSync(local).length} 字节)`)
  }
  if (!existsSync(local)) throw new Error(`找不到 ${local}`)

  // A manifest names the payload; a bare payload is applied as-is (handy for a local test).
  let manifest = null
  let payloadFile = local
  if (local.endsWith('.json')) {
    manifest = validateManifest(readFileSync(local, 'utf8'), { appVersion })
    console.log(`清单通过：${manifest.patchId}（appliesTo ${manifest.appliesTo.join(', ')}）`)
    payloadFile = join(work, basename(new URL(manifest.payloadUrl).pathname) || 'payload.tar.gz')
    if (/^https?:\/\//.test(manifest.payloadUrl)) await fetchTo(manifest.payloadUrl, payloadFile)
    else payloadFile = manifest.payloadUrl
    const digest = sha256Of(payloadFile)
    if (digest !== manifest.sha256) throw new Error(`sha256 不匹配：得到 ${digest}，清单写的是 ${manifest.sha256}`)
    console.log('sha256 校验通过 ✓')
  } else {
    manifest = validateManifest(JSON.stringify({
      patchId: '0.2.3-p0',
      appliesTo: [appVersion],
      payloadUrl: 'https://example.invalid/manual.tar.gz',
      sha256: sha256Of(payloadFile),
      summary: 'manual payload',
    }), { appVersion })
    console.log(`未带清单，按 ${manifest.patchId} 手动应用（仅限本地文件）`)
  }

  const payloadDir = join(work, 'payload')
  mkdirSync(payloadDir, { recursive: true })
  execFileSync('tar', ['-xzf', payloadFile, '-C', payloadDir], { stdio: 'inherit' })
  const applied = applyPayload({ root, payloadDir, stateDir, manifest })
  console.log(`已应用 ${applied.patchId}：${applied.files.length} 个文件`)
  console.log(`  备份在 ${applied.backupDir}`)
  console.log('  重启应用后生效；启动正常会自动确认，启动失败会在下次启动自动回滚')
} finally {
  rmSync(work, { recursive: true, force: true })
}
