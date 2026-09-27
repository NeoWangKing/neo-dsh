/**
 * dsh-desktop-settings — client half: one row in Settings → General that keeps the
 * *desktop app* up to date.
 *
 * WHAT: Neo DSH is this project's own desktop build (Electron shell + harness host),
 * released on its own GitHub repository — entirely separate from DeepSeek's harness
 * releases. This row shows the running version, checks that repository for a newer
 * release, and offers to download + install it in place.
 *
 * WHO DOES WHAT: the renderer is sandboxed (no filesystem, no process spawn), so this
 * half is only the surface. Every command travels as a navigation to
 * `/__dsh_desktop_update?action=…`, which the desktop shell intercepts; the shell
 * answers by calling `window.__NEO_DSH_UPDATE__(state)`. `window.__NEO_DSH__` carries
 * the running version/platform the shell injected at load. In a plain web session
 * (no desktop shell) none of that exists, and the row says so instead of pretending.
 *
 * PREFERENCES live in localStorage, which is per-origin — the shell pins port 3081
 * precisely so this survives restarts and updates: auto-check on/off, its interval,
 * auto-download, and the version the user snoozed.
 */
(function () {
  const NS = 'desktop-settings';
  const LOCALE_ZH = {
    title: 'Neo DSH 桌面版',
    hostOnly: '当前不是桌面版（浏览器里打开），更新只能由桌面应用处理。',
    checking: '正在检查更新…',
    upToDate: '已是最新版本',
    available: '发现新版本',
    downloading: '正在下载',
    downloaded: '已下载，可以安装',
    installing: '正在安装并重启…',
    failed: '检查更新失败',
    check: '检查更新',
    download: '下载更新',
    install: '立即更新并重启',
    autoCheck: '自动检查更新',
    every: '每',
    hours: '小时',
    autoDownload: '发现新版本后自动下载',
    frameTitle: '窗口边框',
    frameDesc: '默认无边框：平铺合成器可直接拖动窗口。需要标题栏和关闭按钮时切到这个。',
    frameBorderless: '无边框',
    frameNative: '系统标题栏',
    foundTitle: '发现新版本',
    foundBody: '更新会覆盖当前安装并自动重启应用。',
    later: '稍后',
    updateNow: '下载更新',
    notes: '更新说明',
    version: '当前版本',
  };
  const LOCALE_EN = {
    title: 'Neo DSH desktop app',
    hostOnly: 'Not running as the desktop app, so updates can only be handled there.',
    checking: 'Checking for updates…',
    upToDate: 'Up to date',
    available: 'Update available',
    downloading: 'Downloading',
    downloaded: 'Downloaded — ready to install',
    installing: 'Installing and restarting…',
    failed: 'Update check failed',
    check: 'Check for updates',
    download: 'Download update',
    install: 'Install and restart',
    autoCheck: 'Check automatically',
    every: 'every',
    hours: 'h',
    autoDownload: 'Download automatically when an update appears',
    frameTitle: 'Window frame',
    frameDesc: 'Borderless by default: a tiling compositor moves it directly. Switch to the native title bar for the usual drag handle and close button.',
    frameBorderless: 'Borderless',
    frameNative: 'System title bar',
    foundTitle: 'Update available',
    foundBody: 'Installing replaces the current build and restarts the app.',
    later: 'Later',
    updateNow: 'Download update',
    notes: 'Release notes',
    version: 'Current version',
  };
  const KEY = {
    autoCheck: 'neo-dsh.update.autoCheck',
    autoDownload: 'neo-dsh.update.autoDownload',
    interval: 'neo-dsh.update.intervalHours',
    snoozed: 'neo-dsh.update.snoozedVersion',
  };

  // Numbers come from the shipped settings rows (figma "Setting-Cell": gap 8,
  // pad 16/0, hairline separator; selector pill h36 r18), so this row sits in the
  // section like a native one instead of looking bolted on.
  const STYLE = `
  .dsk-row {
    display: flex; flex-direction: column; gap: 12px;
    padding: 16px 0; border-bottom: .5px solid var(--dsw-alias-border-l2, rgba(0,0,0,.08));
  }
  .dsk-main { display: flex; align-items: center; gap: 8px; }
  .dsk-text {
    flex: 1; min-width: 0; display: flex; flex-direction: column; gap: 4px; padding-right: 48px;
  }
  .dsk-title {
    font-size: 14px; font-weight: 400; line-height: 22px; color: var(--dsw-alias-label-primary, inherit);
  }
  .dsk-desc {
    font-size: 12px; font-weight: 400; line-height: 18px; color: var(--dsw-alias-label-tertiary, #8b8f97);
  }
  .dsk-actions { display: inline-flex; flex: none; gap: 8px; }
  .dsk-btn {
    display: inline-flex; align-items: center; height: 36px; padding: 0 14px;
    border: .5px solid var(--dsw-alias-border-l3, rgba(127,127,127,.2)); border-radius: 18px;
    background: var(--dsw-alias-button-elevated-fill, rgba(127,127,127,.12));
    font: inherit; font-size: 14px; line-height: 22px; color: var(--dsw-alias-label-primary, inherit); cursor: pointer;
  }
  .dsk-btn:hover:not(:disabled) { background: var(--dsw-alias-interactive-bg-hover-solid, rgba(127,127,127,.22)); }
  .dsk-btn:disabled { cursor: default; opacity: .55; }
  /* Filled primary action, deliberately a stable BLUE in both themes — the same
     pair the harness's own send button uses:
       .XXX_primary { background: var(--dsw-alias-button-info-fill); color: #fff }
     "button-info-fill" is the DeepSeek blue (deepseek-500 light / deepseek-400
     dark), and a theme that overrides it (or button-info-hover) recolours every
     primary action here in one place. Avoid "--dsw-alias-button-primary-fill"
     (it is the *inverted* surface: light in the dark theme) and
     "--dsw-alias-brand-primary" (a text colour). */
  .dsk-primary {
    background: var(--dsw-alias-button-info-fill, #4d6bfe);
    color: #fff;
  }
  .dsk-primary:hover:not(:disabled) { background: var(--dsw-alias-button-info-hover, #3f6ae0); }
  .dsk-opts {
    display: flex; flex-wrap: wrap; align-items: center; gap: 20px;
    font-size: 12px; font-weight: 400; line-height: 18px; color: var(--dsw-alias-label-secondary, #6b7280);
  }
  .dsk-opt { display: inline-flex; align-items: center; gap: 8px; cursor: pointer; }
  input[type="checkbox"] { margin: 0; accent-color: var(--dsw-alias-brand-primary, #4d6bfe); }
  .dsk-select {
    height: 26px; padding: 0 8px; border: none; border-radius: 13px;
    background: var(--dsw-alias-bg-module-platform, rgba(127,127,127,.12));
    font: inherit; font-size: 12px; color: var(--dsw-alias-label-primary, inherit); cursor: pointer;
  }
  .dsk-bar {
    height: 4px; border-radius: 2px; overflow: hidden; background: var(--dsw-alias-bg-module-platform, rgba(127,127,127,.14));
  }
  .dsk-bar > i { display: block; height: 100%; background: var(--dsw-alias-brand-primary, #4d6bfe); transition: width .3s; }
  .dsk-err { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-error, #d94a4a); }
  .dsk-overlay { position: fixed; inset: 0; z-index: 9998; display: flex; align-items: center; justify-content: center; background: rgba(0,0,0,.38); }
  .dsk-dialog {
    width: min(420px, calc(100vw - 48px)); border-radius: 14px; padding: 18px 20px;
    background: var(--dsw-alias-bg-layer-3, #fff); color: var(--dsw-alias-label-primary, #222);
    box-shadow: 0 12px 40px rgba(0,0,0,.28);
  }
  .dsk-dialog h3 { margin: 0 0 6px; font-size: 15px; font-weight: 500; line-height: 22px; }
  .dsk-dialog p { margin: 0 0 14px; font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary, #8b8f97); }
  .dsk-dialog .dsk-dialog-actions { display: flex; justify-content: flex-end; gap: 8px; }
  .dsk-dialog .dsk-btn {
    display: inline-flex; align-items: center; height: 32px; padding: 0 16px;
    border: .5px solid var(--dsw-alias-border-l3, rgba(127,127,127,.2)); border-radius: 16px;
    background: var(--dsw-alias-button-elevated-fill, rgba(127,127,127,.12));
    color: var(--dsw-alias-label-primary, inherit); font: inherit; font-size: 13px; cursor: pointer;
  }
  .dsk-dialog .dsk-btn:hover { background: var(--dsw-alias-interactive-bg-hover-solid, rgba(127,127,127,.22)); }
  .dsk-dialog .dsk-primary { border-color: transparent; background: var(--dsw-alias-button-info-fill, #4d6bfe); color: #fff; }
  .dsk-dialog .dsk-primary:hover { background: var(--dsw-alias-button-info-hover, #3f6ae0); }
  `;

  function insertStyle() {
    if (typeof document === 'undefined') return;
    if (document.getElementById('dsh-desktop-settings-style')) return;
    const el = document.createElement('style');
    el.id = 'dsh-desktop-settings-style';
    el.textContent = STYLE;
    document.head.appendChild(el);
  }

  function readFlag(key, fallback) {
    try {
      const raw = localStorage.getItem(key);
      return raw === null ? fallback : raw === '1';
    } catch {
      return fallback;
    }
  }

  function writeFlag(key, value) {
    try { localStorage.setItem(key, value ? '1' : '0'); } catch { /* private mode */ }
  }

  function readHours() {
    try {
      const raw = Number(localStorage.getItem(KEY.interval));
      return [1, 6, 24].includes(raw) ? raw : 6;
    } catch {
      return 6;
    }
  }

  /**
   * The status line for one updater state. Pure, so the test can drive it.
   * @param state - the shell's last `window.__NEO_DSH_UPDATE__(state)` payload.
   * @param t - locale lookup.
   * @returns the text to show under the title.
   */
  function statusText(state, t) {
    const phase = state?.phase ?? 'idle';
    if (phase === 'checking') return t('checking');
    if (phase === 'checked') {
      return state.hasUpdate ? `${t('available')} v${state.latest}` : t('upToDate');
    }
    if (phase === 'downloading') {
      const percent = state.percent === null || state.percent === undefined ? '' : ` ${state.percent}%`;
      return `${t('downloading')} v${state.version}${percent}`;
    }
    if (phase === 'downloaded') return `${t('downloaded')}：v${state.version}`;
    if (phase === 'installing') return `${t('installing')} v${state.version}`;
    if (phase === 'error') return `${t('failed')}：${state.message ?? ''}`;
    return '';
  }

  /**
   * Build the plugin's apply with React in scope.
   * @param react - the module table's React.
   * @returns {(ctx: object) => void} the cordis plugin body.
   */
  function makeApply(react) {
    return function apply(ctx) {
      const slots = ctx.get('slots');
      if (slots === undefined) return;

      const locale = ctx.get('locale');
      let t = (key) => LOCALE_ZH[key] ?? key;
      let localeReady = false;
      if (locale !== undefined && typeof locale.register === 'function') {
        try {
          ctx.effect(() => locale.register(NS, { zh: LOCALE_ZH, en: LOCALE_EN }), 'dsh-desktop-settings: dictionaries');
          const bound = typeof locale.bind === 'function' ? locale.bind(NS) : undefined;
          if (typeof bound === 'function') t = bound;
          localeReady = true;
        } catch {
          localeReady = false;
        }
      }
      insertStyle();

      function DesktopSettingsRow() {
        const info = (typeof window !== 'undefined' && window.__NEO_DSH__) || undefined;
        const [state, setState] = react.useState({ phase: 'idle' });
        const [autoCheck, setAutoCheck] = react.useState(() => readFlag(KEY.autoCheck, true));
        const [autoDownload, setAutoDownload] = react.useState(() => readFlag(KEY.autoDownload, false));
        const [hours, setHours] = react.useState(readHours);
        const [dialog, setDialog] = react.useState(false);
        const autoDownloadRef = react.useRef(autoDownload);
        const askedRef = react.useRef('');
        autoDownloadRef.current = autoDownload;

        const send = react.useCallback((action) => {
          if (info === undefined) return;
          location.href = `${info.updatePath ?? '/__dsh_desktop_update'}?action=${action}`;
        }, [info]);

        // The shell pushes state here; keep the previous handler for a page that
        // already has one (another plugin, or a reload race).
        react.useEffect(() => {
          if (typeof window === 'undefined') return undefined;
          const previous = window.__NEO_DSH_UPDATE__;
          window.__NEO_DSH_UPDATE__ = (next) => {
            setState(next ?? { phase: 'idle' });
            if (next?.phase === 'checked' && next.hasUpdate) {
              let snoozed = '';
              try { snoozed = localStorage.getItem(KEY.snoozed) ?? ''; } catch { /* ignore */ }
              if (snoozed !== next.latest) setDialog(true);
              // Auto-download asks once per version, and never twice for the same one.
              if (autoDownloadRef.current && askedRef.current !== next.latest) {
                askedRef.current = next.latest;
                send('download');
              }
            }
          };
          return () => { window.__NEO_DSH_UPDATE__ = previous; };
        }, [send]);

        // Periodic check, plus one shortly after the row first appears.
        react.useEffect(() => {
          if (!autoCheck) return undefined;
          const first = setTimeout(() => send('check'), 8000);
          const every = setInterval(() => send('check'), hours * 3600 * 1000);
          return () => { clearTimeout(first); clearInterval(every); };
        }, [autoCheck, hours, send]);

        if (info === undefined) {
          return react.createElement('div', { id: 'dsh-desktop-settings', className: 'dsk-row' },
            react.createElement('div', { className: 'dsk-main' },
              react.createElement('div', { className: 'dsk-text' },
                react.createElement('div', { className: 'dsk-title' }, t('title')),
                react.createElement('div', { className: 'dsk-desc' }, t('hostOnly')))));
        }

        const phase = state.phase ?? 'idle';
        const busy = phase === 'downloading' || phase === 'installing';
        const showPercent = phase === 'downloading' && typeof state.percent === 'number';

        const descText = `${t('version')} v${info.version}` + (statusText(state, t) === '' ? '' : ` · ${statusText(state, t)}`)
        const hourOptions = [1, 6, 24]

        const buttons = [react.createElement('button', {
          key: 'check', type: 'button', className: 'dsk-btn', disabled: busy,
          onClick: () => { setState({ phase: 'checking' }); send('check') },
        }, t('check'))]
        if (phase === 'checked' && state.hasUpdate) {
          buttons.push(react.createElement('button', {
            key: 'download', type: 'button', className: 'dsk-btn dsk-primary',
            onClick: () => send('download'),
          }, t('download')))
        }
        if (phase === 'downloaded') {
          buttons.push(react.createElement('button', {
            key: 'install', type: 'button', className: 'dsk-btn dsk-primary',
            onClick: () => send('install'),
          }, t('install')))
        }

        const mainLine = react.createElement('div', { className: 'dsk-main' }, [
          react.createElement('div', { className: 'dsk-text', key: 'text' }, [
            react.createElement('div', { className: 'dsk-title', key: 'title' }, t('title')),
            react.createElement('div', { className: 'dsk-desc', key: 'desc' }, descText),
          ]),
          react.createElement('div', { className: 'dsk-actions', key: 'actions' }, buttons),
        ])

        const optionsLine = react.createElement('div', { className: 'dsk-opts' }, [
          react.createElement('label', { className: 'dsk-opt', key: 'auto' }, [
            react.createElement('input', {
              type: 'checkbox', checked: autoCheck, key: 'box',
              onChange: (event) => { const next = event.target.checked; setAutoCheck(next); writeFlag(KEY.autoCheck, next) },
            }),
            react.createElement('span', { key: 'label' }, t('autoCheck')),
            react.createElement('select', {
              className: 'dsk-select', value: String(hours), disabled: !autoCheck, key: 'every',
              onChange: (event) => {
                const next = Number(event.target.value)
                setHours(next)
                try { localStorage.setItem(KEY.interval, String(next)) } catch { /* ignore */ }
              },
            }, hourOptions.map((value) => react.createElement('option', { key: value, value: String(value) }, `${t('every')} ${value} ${t('hours')}`))),
          ]),
          react.createElement('label', { className: 'dsk-opt', key: 'autodownload' }, [
            react.createElement('input', {
              type: 'checkbox', checked: autoDownload, key: 'box',
              onChange: (event) => { const next = event.target.checked; setAutoDownload(next); writeFlag(KEY.autoDownload, next) },
            }),
            react.createElement('span', { key: 'label' }, t('autoDownload')),
          ]),
        ])


        const extras = []
        if (showPercent) {
          extras.push(react.createElement('div', { className: 'dsk-bar', key: 'bar' },
            react.createElement('i', { style: { width: `${state.percent}%` } })))
        }
        if (phase === 'error' && state.message) {
          extras.push(react.createElement('div', { className: 'dsk-err', key: 'error' }, state.message))
        }

        const modal = (dialog && phase === 'checked' && state.hasUpdate)
          ? react.createElement('div', { className: 'dsk-overlay', onClick: () => setDialog(false) },
            react.createElement('div', { className: 'dsk-dialog', onClick: (event) => event.stopPropagation() }, [
              react.createElement('h3', { key: 'title' }, `${t('foundTitle')} v${state.latest}`),
              react.createElement('p', { key: 'body' }, `${t('foundBody')}（${t('version')} v${state.version}）`),
              react.createElement('div', { className: 'dsk-dialog-actions', key: 'actions' }, [
                react.createElement('button', {
                  key: 'later', type: 'button', className: 'dsk-btn',
                  onClick: () => {
                    try { localStorage.setItem(KEY.snoozed, state.latest) } catch { /* ignore */ }
                    setDialog(false)
                  },
                }, t('later')),
                react.createElement('button', {
                  key: 'now', type: 'button', className: 'dsk-btn dsk-primary',
                  onClick: () => { setDialog(false); send('download') },
                }, t('updateNow')),
              ]),
            ]))
          : null

        return react.createElement('div', { id: 'dsh-desktop-settings', className: 'dsk-row' }, [mainLine, optionsLine, ...extras, modal])
      }

      /** The window frame is a setting of its own, so it gets its own row. */
      function WindowFrameRow() {
        const info = (typeof window !== 'undefined' && window.__NEO_DSH__) || undefined;
        // Only Linux gets the choice: macOS and Windows need the native frame to have
        // any window controls at all, so there is nothing to choose there.
        if (info === undefined || info.frameChoice !== true) return null;
        const native = info.nativeFrame === true;
        return react.createElement('div', { id: 'dsh-window-frame', className: 'dsk-row' },
          react.createElement('div', { className: 'dsk-main' },
            react.createElement('div', { className: 'dsk-text' },
              react.createElement('div', { className: 'dsk-title' }, t('frameTitle')),
              react.createElement('div', { className: 'dsk-desc' }, t('frameDesc'))),
            react.createElement('div', { className: 'dsk-actions' },
              react.createElement('button', {
                type: 'button', className: 'dsk-btn', title: t('frameDesc'),
                onClick: () => {
                  const value = native ? 'none' : 'native';
                  location.href = `${info.setPath ?? '/__dsh_desktop_set'}?key=frame&value=${value}`;
                },
              }, native ? t('frameNative') : t('frameBorderless')))));
      }

      const entry = {
        name: 'settings.general.item',
        id: 'neo-dsh-desktop',
        order: 40,
        label: () => t('title'),
      };
      const frameEntry = {
        name: 'settings.general.item',
        id: 'neo-dsh-window-frame',
        order: 41,
        label: () => t('frameTitle'),
      };
      if (localeReady) { entry.locale = NS; frameEntry.locale = NS; }
      ctx.effect(
        () => slots.inject('settings.general.item', () => slots.register(entry, DesktopSettingsRow)),
        'dsh-desktop-settings: settings row',
      );
      ctx.effect(
        () => slots.inject('settings.general.item', () => slots.register(frameEntry, WindowFrameRow)),
        'dsh-desktop-settings: window frame row',
      );
    };
  }

  if (typeof window !== 'undefined' && window.__ModuleLoader__ !== undefined) {
    window.__ModuleLoader__.load({
      id: 'dsh-desktop-settings',
      factory: (require) => {
        var module = { exports: {} };
        var exports = module.exports;
        Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
        const react = require('react');
        exports.name = 'dsh-desktop-settings';
        /* dsh >= 0.1.2-rc.1 client-module contract: exports.inject names the ctx
           service seats this bundle consumes. package.json dsh.client.inject
           (module ids) only orders the boot graph. */
        exports.inject = ['slots', 'locale'];
        exports.apply = makeApply(react);
        return module.exports;
      },
    });
  }

  // Node-side export for the unit test; the browser never defines `module` here.
  if (typeof module !== 'undefined' && module.exports) {
    module.exports = { statusText, LOCALE_ZH, LOCALE_EN };
  }
})();
