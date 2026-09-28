/**
 * Unit tests for the app's own home and the one-time migration. No Electron.
 *
 *   node apps/desktop/test/desktop-home.test.mjs
 */
import { existsSync, mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import {
  defaultHome, legacyHome, migrateHome, migrationPlan, MIGRATION_ITEMS, MIGRATION_MARKER,
  MOVE_SKIP, MOVED_MARKER, isEffectivelyEmpty, moveHome, pathRelation, readDataHome,
  relocationPlan, resolveHome, writeDataHome,
} from '../src/desktop-home.mjs'

let failures = 0
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name} → ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`)
}

// ---- where the home goes -------------------------------------------------
check('Linux 默认落在 ~/.local/share/neo-dsh', defaultHome('linux', {}, '/home/u'), '/home/u/.local/share/neo-dsh')
check('Linux 认 XDG_DATA_HOME', defaultHome('linux', { XDG_DATA_HOME: '/data' }, '/home/u'), '/data/neo-dsh')
check('macOS 落在 Application Support', defaultHome('darwin', {}, '/Users/u'), '/Users/u/Library/Application Support/neo-dsh')
check('Windows 落在 %APPDATA%', defaultHome('win32', { APPDATA: 'C:\\Users\\u\\AppData\\Roaming' }, 'C:\\Users\\u'), 'C:\\Users\\u\\AppData\\Roaming\\neo-dsh')
check('Windows 没有 APPDATA 时退回 AppData/Roaming', defaultHome('win32', {}, 'C:\\Users\\u'), 'C:\\Users\\u\\AppData\\Roaming\\neo-dsh')
check('旧位置是 ~/.dsh', legacyHome('/home/u'), '/home/u/.dsh')

// ---- what the plan decides ----------------------------------------------
const base = { from: '/old/.dsh', to: '/new/neo-dsh' }
// An old home that exists (its own path and anything inside it), and nothing else.
const oldOnly = (p) => p === base.from || p.startsWith(`${base.from}/`)
check('同路径不迁移', migrationPlan({ ...base, from: '/same', to: '/same', exists: () => true }).reason, 'same path')
check('没有旧 home → 不迁移', migrationPlan({ ...base, exists: () => false }).reason, 'no previous home')
check('已有标记 → 不迁移（幂等）', migrationPlan({ ...base, exists: (p) => oldOnly(p) || p === join(base.to, MIGRATION_MARKER) }).reason, 'already migrated')
const happy = migrationPlan({ ...base, exists: oldOnly })
check('正常情况：迁移全部存在的条目', [happy.migrate, happy.items.length], [true, MIGRATION_ITEMS.length])
check('旧 home 缺的条目不会硬搬', migrationPlan({ ...base, exists: (p) => oldOnly(p) && !p.endsWith('/profiles') }).items.includes('profiles'), false)
check('新 home 里已有的条目不覆盖', migrationPlan({ ...base, exists: (p) => oldOnly(p) || p.startsWith(`${base.to}/sessions`) }).items.includes('sessions'), false)

// ---- the migration itself ------------------------------------------------
const root = mkdtempSync(join(tmpdir(), 'neo-dsh-home-'))
const from = join(root, 'old', '.dsh')
const to = join(root, 'new', 'neo-dsh')
mkdirSync(join(from, 'sessions'), { recursive: true })
writeFileSync(join(from, 'sessions', 'session-x.jsonl.zstd'), 'x')
writeFileSync(join(from, 'settings.yaml'), 'model: x\n')
mkdirSync(join(from, 'cache'), { recursive: true })

const report = migrateHome({ from, to })
check('迁移结果：sessions + settings.yaml', report.migrated.slice().sort(), ['sessions', 'settings.yaml'])
check('缓存目录没有被搬（caches are rebuilt）', report.migrated.includes('cache'), false)
const second = migrateHome({ from, to })
check('第二次启动不再迁移（标记生效）', [second.migrated, second.reason], [[], 'already migrated'])
check('标记文件记录了来源', JSON.parse(readFileSync(join(to, MIGRATION_MARKER), 'utf8')).from, from)

// ---- the user picks the location -----------------------------------------
const cfg = join(root, 'userData')
check('没配置过 → null', readDataHome(cfg), null)
writeDataHome(cfg, join(root, 'chosen'))
check('选过的位置会写进 shell 自己的配置里', readDataHome(cfg), join(root, 'chosen'))
writeFileSync(join(cfg, 'desktop-config.json'), '{ not json')
check('配置文件坏了 → 当作没配置', readDataHome(cfg), null)
writeFileSync(join(cfg, 'desktop-config.json'), JSON.stringify({ dataHome: 'relative/dir' }))
check('相对路径不算位置', readDataHome(cfg), null)

const resolved = (env, configDir) => resolveHome({ configDir, platform: 'linux', env, home: '/home/u' })
writeDataHome(cfg, '/mnt/data/neo-dsh')
check('默认：用平台默认位置', resolved({}, undefined), { path: '/home/u/.local/share/neo-dsh', source: 'default' })
check('选过：用用户选的位置', resolved({}, cfg), { path: '/mnt/data/neo-dsh', source: 'configured' })
check('DSH_HOME 优先级最高（开发用）', resolved({ DSH_HOME: '/tmp/dev' }, cfg), { path: '/tmp/dev', source: 'env' })
writeDataHome(cfg, null)
check('清掉选择后回到默认', resolved({}, cfg), { path: '/home/u/.local/share/neo-dsh', source: 'default' })

// ---- deciding where it may move to ---------------------------------------
check('同一条路径不算搬', pathRelation('/a/b', '/a/b/'), 'same')
check('搬到自己的子目录 → 拒绝（会递归）', pathRelation('/a', '/a/b'), 'inside-source')
check('搬到自己的父目录 → 拒绝', pathRelation('/a/b', '/a'), 'inside-target')
check('不相关的两个目录 → 可以', pathRelation('/a/b', '/c/d'), 'separate')
check('不存在 → 空', isEffectivelyEmpty(join(root, 'nope')), true)
mkdirSync(join(root, 'junk'), { recursive: true })
writeFileSync(join(root, 'junk', '.DS_Store'), '')
check('只有 .DS_Store → 还算空', isEffectivelyEmpty(join(root, 'junk')), true)
writeFileSync(join(root, 'junk', 'someone-elses-file'), 'x')
check('里面有别的东西 → 不空', isEffectivelyEmpty(join(root, 'junk')), false)
check('目标非空 → 拒绝，不合并', relocationPlan({ from: join(root, 'old', '.dsh'), to: join(root, 'junk') }).reason, 'target-not-empty')

// ---- carrying a home to the location the user chose ----------------------
const src = join(root, 'move-src')
const dst = join(root, 'move-dst')
mkdirSync(join(src, 'sessions'), { recursive: true })
writeFileSync(join(src, 'sessions', 'a.jsonl.zstd'), 'a')
writeFileSync(join(src, 'settings.yaml'), 'model: y\n')
writeFileSync(join(src, 'desktop.log'), 'noise')
const copied = moveHome({ from: src, to: dst, mode: 'copy' })
check('复制：搬了会话和设置', copied.moved.slice().sort(), ['sessions', 'settings.yaml'])
check('复制：日志不搬', copied.moved.some((n) => MOVE_SKIP.includes(n)), false)
check('复制：旧目录原封不动', existsSync(join(src, 'sessions', 'a.jsonl.zstd')), true)
check('复制：新目录里有数据', readFileSync(join(dst, 'sessions', 'a.jsonl.zstd'), 'utf8'), 'a')
check('复制：新目录写了标记（下次启动不再自动迁移）', existsSync(join(dst, MIGRATION_MARKER)), true)
check('复制：旧目录不留 moved 标记', existsSync(join(src, MOVED_MARKER)), false)

const src2 = join(root, 'move-src2')
const dst2 = join(root, 'move-dst2')
mkdirSync(join(src2, 'sessions'), { recursive: true })
writeFileSync(join(src2, 'sessions', 'b.jsonl.zstd'), 'b')
writeFileSync(join(src2, 'desktop.log'), 'noise')
const movedReport = moveHome({ from: src2, to: dst2, mode: 'move' })
check('移动：数据到了新目录', readFileSync(join(dst2, 'sessions', 'b.jsonl.zstd'), 'utf8'), 'b')
check('移动：旧目录里的数据被删掉', existsSync(join(src2, 'sessions')), false)
check('移动：旧目录的日志留下（记录）', existsSync(join(src2, 'desktop.log')), true)
check('移动：旧目录留了 moved 标记，指向新位置', JSON.parse(readFileSync(join(src2, MOVED_MARKER), 'utf8')).to, dst2)
check('移动：报告了搬了什么', movedReport.moved.includes('sessions'), true)

const blocked = moveHome({ from: src, to: join(root, 'junk'), mode: 'move' })
check('目标非空 → 一个文件都不搬', [blocked.moved.length, blocked.reason], [0, 'target-not-empty'])
check('搬到自己里面 → 拒绝', moveHome({ from: src, to: join(src, 'inner') }).reason, 'nested-path')

rmSync(root, { recursive: true, force: true })
console.log(failures === 0 ? '\nall desktop-home checks passed' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
