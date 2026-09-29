/**
 * Making the harness host use the proxy this machine already has.
 *
 * The host is a Node process, and Node ignores `http_proxy` unless it is told to look
 * (`NODE_USE_ENV_PROXY=1`). Behind an explicit proxy — Clash, a corporate gateway — a
 * model request then just times out, and it looks like "the app has no network" while the
 * browser sitting next to it works fine.
 *
 * So the shell resolves the proxy itself: an explicit choice in Settings → General, the
 * environment it was started with, or the desktop's own proxy settings (gsettings on
 * Linux, `scutil` on macOS, the registry on Windows). The host gets an environment it will
 * actually honour, and loopback is always bypassed so the window can still reach its host.
 *
 * No Electron and no child_process here: the shell injects the command runner, so every
 * parser and decision is unit-tested.
 *
 * @module proxy-env
 */

/** The window talks to its harness on loopback; that must never go through a proxy. */
export const LOOPBACK_BYPASS = Object.freeze(['localhost', '127.0.0.1', '::1'])

/** What a user can pick for the proxy. */
export const PROXY_MODES = Object.freeze(['system', 'direct', 'manual'])

/**
 * Read whichever proxy the environment already carries.
 * @param env - an environment object.
 * @returns `{httpProxy, httpsProxy, allProxy, noProxy}`, empty strings when unset.
 */
export function readProxyEnv(env = {}) {
  const pick = (...names) => {
    for (const name of names) {
      const value = env[name]
      if (typeof value === 'string' && value.trim() !== '') return value.trim()
    }
    return ''
  }
  return {
    httpProxy: pick('http_proxy', 'HTTP_PROXY'),
    httpsProxy: pick('https_proxy', 'HTTPS_PROXY'),
    allProxy: pick('all_proxy', 'ALL_PROXY'),
    noProxy: pick('no_proxy', 'NO_PROXY'),
  }
}

/**
 * Accept what people actually type: `127.0.0.1:7897`, `http://host:port`, `socks5://…`.
 * @param value - a proxy address.
 * @returns the address with a scheme, or '' when there is nothing usable.
 */
export function normaliseProxyUrl(value) {
  const text = String(value ?? '').trim()
  if (text === '') return ''
  if (/^[a-z][a-z0-9+.-]*:\/\//i.test(text)) return text
  return `http://${text}`
}

/**
 * Build the bypass list: what the user had, plus loopback, deduplicated.
 * @param lists - any number of comma- or array-shaped lists.
 * @returns the entries, in order.
 */
export function composeNoProxy(...lists) {
  const seen = new Set()
  const entries = []
  const add = (raw) => {
    const text = String(raw ?? '').trim()
    if (text === '') return
    const key = text.toLowerCase()
    if (seen.has(key)) return
    seen.add(key)
    entries.push(text)
  }
  for (const list of lists) {
    if (Array.isArray(list)) for (const item of list) add(item)
    else for (const item of String(list ?? '').split(',')) add(item)
  }
  for (const host of LOOPBACK_BYPASS) add(host)
  return entries
}

/**
 * The environment that makes Node — and everything else — use the proxy.
 * @param proxy - `{httpProxy, httpsProxy, allProxy, noProxy}`.
 * @returns the variables to set; only `no_proxy` when there is no proxy at all.
 */
export function proxyEnvFor(proxy = {}) {
  // `||`, not `??`: a resolver that knows there is no all_proxy hands back an empty
  // string, and tooling that only reads `all_proxy` should still find the HTTP one.
  const httpProxy = normaliseProxyUrl(proxy.httpProxy)
  const httpsProxy = normaliseProxyUrl(proxy.httpsProxy || proxy.httpProxy)
  const allProxy = normaliseProxyUrl(proxy.allProxy || proxy.httpProxy)
  const noProxy = composeNoProxy(proxy.noProxy).join(',')
  const env = { no_proxy: noProxy, NO_PROXY: noProxy }
  if (httpProxy === '' && httpsProxy === '' && allProxy === '') return env
  if (httpProxy !== '') {
    env.http_proxy = httpProxy
    env.HTTP_PROXY = httpProxy
  }
  if (httpsProxy !== '') {
    env.https_proxy = httpsProxy
    env.HTTPS_PROXY = httpsProxy
  }
  if (allProxy !== '') {
    env.all_proxy = allProxy
    env.ALL_PROXY = allProxy
  }
  // Node >= 22 only reads the proxy variables above when this is set (Node 24 calls it
  // `--use-env-proxy`). Without it, undici connects directly and times out.
  env.NODE_USE_ENV_PROXY = '1'
  return env
}

/** Strip GVariant quoting from `gsettings get` output. */
function unquoteGvariant(text) {
  const trimmed = String(text ?? '').trim()
  if (trimmed.startsWith('[') && trimmed.endsWith(']')) {
    return trimmed
      .slice(1, -1)
      .split(',')
      .map((part) => part.trim().replace(/^'|'$/g, ''))
      .filter((part) => part !== '')
  }
  return trimmed.replace(/^'|'$/g, '')
}

/**
 * Turn the desktop's proxy settings into one proxy, the way GNOME means them.
 * @param values - raw `gsettings get org.gnome.system.proxy …` output.
 * @returns `{mode, httpProxy, httpsProxy, noProxy}`; proxies are '' when the mode is not manual.
 */
export function parseGsettings({ mode, httpHost, httpPort, httpsHost, httpsPort, ignoreHosts } = {}) {
  const modeName = String(unquoteGvariant(mode) ?? '').trim() || 'none'
  const at = (host, port) => {
    const name = String(unquoteGvariant(host) ?? '').trim()
    const number = String(unquoteGvariant(port) ?? '').trim()
    if (name === '') return ''
    return normaliseProxyUrl(number === '' ? name : `${name}:${number}`)
  }
  const noProxy = composeNoProxy(Array.isArray(ignoreHosts) ? ignoreHosts : unquoteGvariant(ignoreHosts))
  if (modeName !== 'manual') return { mode: modeName, httpProxy: '', httpsProxy: '', noProxy }
  // GNOME's https fields are separate but in practice empty; Clash-style tools set http only.
  const http = at(httpHost, httpPort)
  const https = at(httpsHost, httpsPort)
  return { mode: modeName, httpProxy: http, httpsProxy: https === '' ? http : https, noProxy }
}

/**
 * Parse `scutil --proxy` on macOS.
 * @param text - the command's output.
 * @returns `{mode, httpProxy, httpsProxy, noProxy}`.
 */
export function parseScutil(text = '') {
  const body = String(text ?? '')
  const number = (key) => {
    const match = new RegExp(`${key}\\s*:\\s*(\\d+)`).exec(body)
    return match === null ? '' : match[1]
  }
  const string = (key) => {
    const match = new RegExp(`${key}\\s*:\\s*([^\\s<}]+)`).exec(body)
    return match === null ? '' : match[1]
  }
  const enabled = (key) => number(key) === '1'
  const http = enabled('HTTPEnable') ? `http://${string('HTTPProxy')}:${number('HTTPPort')}` : ''
  const https = enabled('HTTPSEnable') ? `http://${string('HTTPSProxy')}:${number('HTTPSPort')}` : ''
  const noProxy = []
  const exceptions = /ExceptionsList\s*:\s*<array>\s*\{([^}]*)\}/.exec(body)
  if (exceptions !== null) {
    for (const line of exceptions[1].split('\n')) {
      const value = line.split(':').slice(1).join(':').trim()
      if (value !== '') noProxy.push(value)
    }
  }
  const socks = enabled('SOCKSEnable') ? `socks5://${string('SOCKSProxy')}:${number('SOCKSPort')}` : ''
  return {
    mode: http !== '' || https !== '' || socks !== '' ? 'manual' : 'none',
    httpProxy: http !== '' ? http : socks,
    httpsProxy: https !== '' ? https : (http !== '' ? http : socks),
    noProxy,
  }
}

/**
 * Parse the Windows registry's proxy values.
 * @param text - `reg query … /v ProxyEnable` and `/v ProxyServer` output, concatenated.
 * @returns `{mode, httpProxy, httpsProxy, noProxy}`.
 */
export function parseWindowsProxy(text = '') {
  const body = String(text ?? '')
  const enabled = /ProxyEnable\s+REG_DWORD\s+0x1\b/i.test(body)
  const server = /ProxyServer\s+REG_SZ\s+(.+)/i.exec(body)
  const bypass = /ProxyOverride\s+REG_SZ\s+(.+)/i.exec(body)
  const noProxy = bypass === null ? [] : bypass[1].trim().split(';').filter((entry) => entry !== '' && entry !== '<local>')
  if (!enabled || server === null) return { mode: 'none', httpProxy: '', httpsProxy: '', noProxy }
  // `http=host:port;https=host:port` or just `host:port`.
  const parts = server[1].trim().split(';').reduce((acc, entry) => {
    const [key, value] = entry.includes('=') ? entry.split('=') : ['http', entry]
    if (value !== undefined) acc[key.trim()] = value.trim()
    return acc
  }, {})
  const http = parts.http ?? parts.https ?? ''
  return { mode: 'manual', httpProxy: normaliseProxyUrl(http), httpsProxy: normaliseProxyUrl(parts.https ?? http), noProxy }
}

/**
 * Ask the desktop for its proxy settings.
 * @param options - `platform` and `run` (command → stdout).
 * @returns `{mode, httpProxy, httpsProxy, noProxy}` or null when it cannot be read.
 */
export function readSystemProxy({ platform, run }) {
  try {
    if (platform === 'linux') {
      // The schema and the key are separate arguments: `org.gnome.system.proxy.http host`.
      // One missing key (a desktop without the https schema, say) must not lose the rest.
      const get = (schema, key) => {
        try {
          return String(run(`gsettings get ${schema} ${key}`) ?? '').trim()
        } catch {
          return ''
        }
      }
      const mode = get('org.gnome.system.proxy', 'mode')
      if (mode === '') return null
      return parseGsettings({
        mode,
        httpHost: get('org.gnome.system.proxy.http', 'host'),
        httpPort: get('org.gnome.system.proxy.http', 'port'),
        httpsHost: get('org.gnome.system.proxy.https', 'host'),
        httpsPort: get('org.gnome.system.proxy.https', 'port'),
        ignoreHosts: get('org.gnome.system.proxy', 'ignore-hosts'),
      })
    }
    if (platform === 'darwin') return parseScutil(String(run('scutil --proxy') ?? ''))
    if (platform === 'win32') {
      const key = 'HKCU\\Software\\Microsoft\\Windows\\CurrentVersion\\Internet Settings'
      return parseWindowsProxy(String(run(`reg query "${key}" /v ProxyEnable`) ?? '') + String(run(`reg query "${key}" /v ProxyServer`) ?? '') + String(run(`reg query "${key}" /v ProxyOverride`) ?? ''))
    }
  } catch {
    // No desktop proxy available: the caller falls back to the environment, then direct.
    return null
  }
  return null
}

/**
 * Decide which proxy the app should use.
 *
 * Order: an explicit choice from Settings, then the environment, then the desktop's own
 * settings. Someone who exported `https_proxy` in their session means it, so it outranks
 * whatever the desktop has configured.
 *
 * @param options - `mode` ('system' | 'direct' | 'manual'), `manualUrl`, `env`, `system`.
 * @returns `{mode, httpProxy, httpsProxy, allProxy, noProxy, source}`.
 */
export function resolveProxy({ mode = 'system', manualUrl = '', env = {}, system = null } = {}) {
  const direct = { mode: 'direct', httpProxy: '', httpsProxy: '', allProxy: '', noProxy: composeNoProxy(env.no_proxy) }

  if (mode === 'direct') return { ...direct, source: 'direct' }
  if (mode === 'manual') {
    const url = normaliseProxyUrl(manualUrl)
    if (url === '') return { ...direct, source: 'manual (no address)' }
    return {
      mode: 'manual',
      httpProxy: url,
      httpsProxy: url,
      allProxy: url,
      noProxy: composeNoProxy(env.no_proxy),
      source: 'manual',
    }
  }

  const fromEnv = readProxyEnv(env)
  if (fromEnv.httpProxy !== '' || fromEnv.httpsProxy !== '' || fromEnv.allProxy !== '') {
    return {
      mode: 'system',
      httpProxy: fromEnv.httpProxy,
      httpsProxy: fromEnv.httpsProxy,
      allProxy: fromEnv.allProxy,
      noProxy: composeNoProxy(fromEnv.noProxy),
      source: 'environment',
    }
  }
  if (system !== null && system !== undefined && (system.httpProxy !== '' || system.httpsProxy !== '')) {
    return {
      mode: 'system',
      httpProxy: system.httpProxy,
      httpsProxy: system.httpsProxy,
      allProxy: '',
      noProxy: composeNoProxy(system.noProxy, env.no_proxy),
      source: 'desktop settings',
    }
  }
  return { ...direct, source: 'none configured' }
}

/**
 * A one-line description for the log and the settings row.
 * @param proxy - the result of {@link resolveProxy}.
 * @returns something like `system → http://127.0.0.1:7897 (desktop settings)`.
 */
export function describeProxy(proxy) {
  const address = proxy.httpProxy !== '' ? proxy.httpProxy : (proxy.httpsProxy !== '' ? proxy.httpsProxy : 'direct')
  return `${proxy.mode} → ${address} (${proxy.source})`
}
