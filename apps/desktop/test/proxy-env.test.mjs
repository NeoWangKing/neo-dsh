/**
 * Unit tests for proxy resolution. No Electron, no network.
 *
 *   node apps/desktop/test/proxy-env.test.mjs
 */
import {
  LOOPBACK_BYPASS, composeNoProxy, describeProxy, normaliseProxyUrl, parseGsettings, parseScutil,
  parseWindowsProxy, proxyEnvFor, readProxyEnv, readSystemProxy, resolveProxy,
} from '../src/proxy-env.mjs'

let failures = 0
function check(name, actual, expected) {
  const ok = JSON.stringify(actual) === JSON.stringify(expected)
  if (!ok) failures += 1
  console.log(`${ok ? 'ok  ' : 'FAIL'}  ${name} → ${JSON.stringify(actual)}${ok ? '' : ` (expected ${JSON.stringify(expected)})`}`)
}

// ---- what the environment says -------------------------------------------
check('小写变量', readProxyEnv({ http_proxy: 'http://a:1', https_proxy: 'http://b:2' }), {
  httpProxy: 'http://a:1', httpsProxy: 'http://b:2', allProxy: '', noProxy: '',
})
check('大写变量也认', readProxyEnv({ HTTP_PROXY: 'http://a:1' }).httpProxy, 'http://a:1')
check('空字符串不算设过', readProxyEnv({ http_proxy: '   ' }).httpProxy, '')
check('只有 all_proxy', readProxyEnv({ all_proxy: 'socks5://127.0.0.1:1080' }).allProxy, 'socks5://127.0.0.1:1080')

check('地址没带协议 → 补 http://', normaliseProxyUrl('127.0.0.1:7897'), 'http://127.0.0.1:7897')
check('已有协议 → 原样', normaliseProxyUrl('socks5://127.0.0.1:1080'), 'socks5://127.0.0.1:1080')
check('空 → 空', normaliseProxyUrl('  '), '')

// ---- bypass list ----------------------------------------------------------
check('loopback 永远在 bypass 里', composeNoProxy(''), [...LOOPBACK_BYPASS])
check('合并去重、保留用户的条目', composeNoProxy('*.local,127.0.0.1', ['github.com']), ['*.local', '127.0.0.1', 'github.com', 'localhost', '::1'])
check('大小写不重复', composeNoProxy('LOCALHOST'), ['LOCALHOST', '127.0.0.1', '::1'])

// ---- the environment the host actually gets ------------------------------
const withProxy = proxyEnvFor({ httpProxy: '127.0.0.1:7897', noProxy: '*.local' })
check('http/https/all 都指向同一个代理', [withProxy.http_proxy, withProxy.https_proxy, withProxy.all_proxy], ['http://127.0.0.1:7897', 'http://127.0.0.1:7897', 'http://127.0.0.1:7897'])
check('关键：打开 Node 读环境代理的开关', withProxy.NODE_USE_ENV_PROXY, '1')
check('大写变量也给一份', [withProxy.HTTP_PROXY, withProxy.NO_PROXY], ['http://127.0.0.1:7897', '*.local,localhost,127.0.0.1,::1'])
check('all_proxy 为空 → 回落到 http 代理', proxyEnvFor({ httpProxy: '127.0.0.1:7897', allProxy: '', httpsProxy: '' }).all_proxy, 'http://127.0.0.1:7897')
check('直连时不设代理变量，但 loopback 仍然 bypass', proxyEnvFor({ httpProxy: '' }), { no_proxy: 'localhost,127.0.0.1,::1', NO_PROXY: 'localhost,127.0.0.1,::1' })
check('直连时不开 NODE_USE_ENV_PROXY', 'NODE_USE_ENV_PROXY' in proxyEnvFor({}), false)

// ---- the desktop's own settings ------------------------------------------
// Exactly what `gsettings get …` prints on this machine.
const gnome = parseGsettings({
  mode: "'manual'",
  httpHost: "'127.0.0.1'",
  httpPort: '7897',
  httpsHost: "''",
  httpsPort: '0',
  ignoreHosts: "['localhost', '127.0.0.1', '::1']",
})
check('GNOME manual → 代理地址', [gnome.httpProxy, gnome.httpsProxy, gnome.mode], ['http://127.0.0.1:7897', 'http://127.0.0.1:7897', 'manual'])
check('  ignore-hosts 解析成数组', gnome.noProxy, ['localhost', '127.0.0.1', '::1'])
check('GNOME none → 没有代理', parseGsettings({ mode: "'none'", ignoreHosts: "['localhost']" }).httpProxy, '')
check('https 单独填了就用 https 的', parseGsettings({
  mode: "'manual'", httpHost: "'10.0.0.1'", httpPort: '3128', httpsHost: "'10.0.0.2'", httpsPort: '3129',
}).httpsProxy, 'http://10.0.0.2:3129')

const scutil = parseScutil(`<dictionary> {
  ExceptionsList : <array> {
    0 : *.local
    1 : 169.254/16
  }
  HTTPEnable : 1
  HTTPPort : 7897
  HTTPProxy : 127.0.0.1
  HTTPSEnable : 1
  HTTPSPort : 7897
  HTTPSProxy : 127.0.0.1
}`)
check('macOS scutil → 代理 + 例外', [scutil.httpProxy, scutil.httpsProxy, scutil.noProxy], ['http://127.0.0.1:7897', 'http://127.0.0.1:7897', ['*.local', '169.254/16']])
check('macOS 没开代理 → none', parseScutil('HTTPEnable : 0').mode, 'none')

check('Windows 注册表 → 代理', (() => {
  const parsed = parseWindowsProxy('    ProxyEnable    REG_DWORD    0x1\n    ProxyServer    REG_SZ    127.0.0.1:7897\n    ProxyOverride    REG_SZ    *.local;<local>')
  return [parsed.mode, parsed.httpProxy, parsed.noProxy]
})(), ['manual', 'http://127.0.0.1:7897', ['*.local']])
check('Windows 关掉代理 → none', parseWindowsProxy('    ProxyEnable    REG_DWORD    0x0').mode, 'none')

// ---- the decision ---------------------------------------------------------
check('跟随系统 + 环境里有 → 用环境的', resolveProxy({
  mode: 'system',
  env: { https_proxy: 'http://127.0.0.1:7897' },
  system: { httpProxy: 'http://other:1', httpsProxy: 'http://other:1', noProxy: [] },
}).source, 'environment')
check('跟随系统 + 环境没有 → 用桌面的', resolveProxy({
  mode: 'system',
  env: {},
  system: { httpProxy: 'http://127.0.0.1:7897', httpsProxy: 'http://127.0.0.1:7897', noProxy: ['*.local'] },
}).source, 'desktop settings')
check('  loopback 一定在 bypass 里', resolveProxy({ mode: 'system', env: {}, system: { httpProxy: 'http://127.0.0.1:7897', httpsProxy: '', noProxy: ['*.local'] } }).noProxy, ['*.local', 'localhost', '127.0.0.1', '::1'])
check('直连 → 不设代理', resolveProxy({ mode: 'direct', env: { https_proxy: 'http://x:1' }, system: null }).httpProxy, '')
check('手动 → 用手动地址，https 也用它', (() => {
  const p = resolveProxy({ mode: 'manual', manualUrl: '127.0.0.1:7897' })
  return [p.httpProxy, p.httpsProxy, p.allProxy, p.source]
})(), ['http://127.0.0.1:7897', 'http://127.0.0.1:7897', 'http://127.0.0.1:7897', 'manual'])
check('手动但没填地址 → 直连并说明', resolveProxy({ mode: 'manual', manualUrl: '' }).source, 'manual (no address)')
check('都没有 → 直连', resolveProxy({ mode: 'system', env: {}, system: null }).source, 'none configured')
check('描述文字', describeProxy(resolveProxy({ mode: 'system', env: {}, system: { httpProxy: 'http://127.0.0.1:7897', httpsProxy: '', noProxy: [] } })), 'system → http://127.0.0.1:7897 (desktop settings)')

// ---- reading the desktop, with a fake command runner ---------------------
const fakeRun = (command) => {
  const answers = {
    'gsettings get org.gnome.system.proxy mode': "'manual'\n",
    'gsettings get org.gnome.system.proxy.http host': "'127.0.0.1'\n",
    'gsettings get org.gnome.system.proxy.http port': '7897\n',
    'gsettings get org.gnome.system.proxy ignore-hosts': "['localhost', '127.0.0.1', '::1']\n",
    // gsettings itself exits non-zero for a key that does not exist.
    'gsettings get org.gnome.system.proxy.https host': () => { throw new Error("No such key 'host'") },
  }
  const answer = answers[command]
  if (answer === undefined) throw new Error(`unexpected command: ${command}`)
  return typeof answer === 'function' ? answer() : answer
}
check('Linux: 模式 + http 两段 schema 都要读对', readSystemProxy({ platform: 'linux', run: fakeRun }).httpProxy, 'http://127.0.0.1:7897')
check('某个 key 不存在也不整体失败', readSystemProxy({ platform: 'linux', run: fakeRun }).httpsProxy, 'http://127.0.0.1:7897')
check('mode 都读不到 → null（不是崩）', readSystemProxy({ platform: 'linux', run: () => { throw new Error('no gsettings') } }), null)
check('没有 scutil → null（不是崩）', readSystemProxy({ platform: 'darwin', run: () => { throw new Error('no scutil') } }), null)

console.log(failures === 0 ? '\nall proxy-env checks passed' : `\n${failures} CHECK(S) FAILED`)
process.exit(failures === 0 ? 0 : 1)
