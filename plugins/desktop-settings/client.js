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
    assetPending: '安装包仍在上传，稍后再试',
    downloading: '正在下载',
    downloaded: '已下载，可以安装',
    installing: '正在安装并重启…',
    failed: '检查更新失败',
    failedDownload: '下载失败',
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
    dataTitle: '数据位置',
    dataDesc: '会话、附件和设置都在这里',
    dataSourceDefault: '默认位置',
    dataSourceConfigured: '自定义位置',
    dataSourceEnv: '由环境变量 DSH_HOME 指定，设置里改不了',
    dataChange: '更改位置…',
    dataCliNote: '命令行 dsh 仍在使用 ~/.dsh：那边的会话不会出现在这里。',
    moveTitle: '把数据搬到这里？',
    moveBody: '复制会保留原目录作为备份；移动只删除复制成功的部分，日志留在原处。完成后应用会自动重启。',
    moveCopy: '复制并切换',
    moveMove: '移动并切换',
    moveCancel: '取消',
    moveWorking: '正在复制数据…',
    moveRestarting: '正在重启应用…',
    moveFrom: '当前位置',
    moveTo: '新位置',
    moveErrNotAbsolute: '请选择一个绝对路径。',
    moveErrSame: '这就是当前使用的位置。',
    moveErrNested: '新目录不能位于当前数据目录内部，也不能是它的上层目录。',
    moveErrNotEmpty: '这个目录里已经有别的东西了，请换一个空目录，避免两边混在一起。',
    moveErrFailed: '迁移失败，数据仍留在原位置。',
    proxyTitle: '网络代理',
    proxyFollow: '跟随系统',
    proxyDirect: '直连',
    proxyManual: '手动填写',
    proxySave: '保存',
    proxyPlaceholder: '127.0.0.1:7897',
    proxyNoProxy: '没有检测到代理，直连',
    proxyUsing: '正在使用',
    proxySourceEnv: '来自环境变量',
    proxySourceSystem: '来自系统设置',
    proxySourceManual: '手动指定',
    proxyHint: 'host 是 Node 子进程，而 Node 默认不读代理环境变量——这里会把解析结果交给它，所以用 Clash 这类显式代理时模型请求不会超时。',
  };
  const LOCALE_EN = {
    title: 'Neo DSH desktop app',
    hostOnly: 'Not running as the desktop app, so updates can only be handled there.',
    checking: 'Checking for updates…',
    upToDate: 'Up to date',
    available: 'Update available',
    assetPending: 'the installer is still uploading — try again shortly',
    downloading: 'Downloading',
    downloaded: 'Downloaded — ready to install',
    installing: 'Installing and restarting…',
    failed: 'Update check failed',
    failedDownload: 'Download failed',
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
    dataTitle: 'Data location',
    dataDesc: 'Conversations, attachments and settings live here',
    dataSourceDefault: 'default location',
    dataSourceConfigured: 'chosen location',
    dataSourceEnv: 'set by the DSH_HOME environment variable — not changeable here',
    dataChange: 'Change…',
    dataCliNote: 'The dsh command line still uses ~/.dsh, so its conversations will not appear here.',
    moveTitle: 'Move the data here?',
    moveBody: 'Copying keeps the old directory as a backup; moving deletes only what was copied and leaves the logs behind. The app restarts when it is done.',
    moveCopy: 'Copy and switch',
    moveMove: 'Move and switch',
    moveCancel: 'Cancel',
    moveWorking: 'Copying the data…',
    moveRestarting: 'Restarting the app…',
    moveFrom: 'Now',
    moveTo: 'New',
    moveErrNotAbsolute: 'Pick an absolute path.',
    moveErrSame: 'That is the location already in use.',
    moveErrNested: 'The new directory cannot be inside the current one, or above it.',
    moveErrNotEmpty: 'That directory already holds something else — pick an empty one so the two never mix.',
    moveErrFailed: 'The move failed; the data is still where it was.',
    proxyTitle: 'Network proxy',
    proxyFollow: 'Follow the system',
    proxyDirect: 'Direct',
    proxyManual: 'Enter one manually',
    proxySave: 'Save',
    proxyPlaceholder: '127.0.0.1:7897',
    proxyNoProxy: 'no proxy detected, connecting directly',
    proxyUsing: 'Using',
    proxySourceEnv: 'from the environment',
    proxySourceSystem: 'from the desktop settings',
    proxySourceManual: 'set by hand',
    proxyHint: 'The host is a Node process, and Node ignores proxy environment variables unless it is told to — this is where that happens, so an explicit proxy like Clash does not turn model requests into timeouts.',
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
  .dsk-input {
    height: 26px; padding: 0 10px; min-width: 180px; border: .5px solid var(--dsw-alias-border-l3, rgba(127,127,127,.2));
    border-radius: 13px; background: var(--dsw-alias-bg-module-platform, rgba(127,127,127,.12));
    font: inherit; font-size: 12px; color: var(--dsw-alias-label-primary, inherit);
  }
  .dsk-bar {
    height: 4px; border-radius: 2px; overflow: hidden; background: var(--dsw-alias-bg-module-platform, rgba(127,127,127,.14));
  }
  .dsk-bar > i { display: block; height: 100%; background: var(--dsw-alias-brand-primary, #4d6bfe); transition: width .3s; }
  .dsk-err { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-error, #d94a4a); }
  /* Paths are long and have no spaces to break at, so let them wrap anywhere. */
  .dsk-path {
    font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-secondary, #6b7280);
    word-break: break-all;
  }
  .dsk-note { font-size: 12px; line-height: 18px; color: var(--dsw-alias-label-tertiary, #8b8f97); }
  .dsk-dialog .dsk-dialog-path { display: flex; flex-direction: column; gap: 4px; margin: 0 0 16px; }
  .dsk-dialog .dsk-dialog-path .dsk-desc { padding-right: 0; }
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
      if (!state.hasUpdate) return t('upToDate');
      // A release shows up on GitHub before its installers finish uploading.
      return state.assetReady === false
        ? `${t('available')} v${state.latest}（${t('assetPending')}）`
        : `${t('available')} v${state.latest}`;
    }
    if (phase === 'downloading') {
      const percent = state.percent === null || state.percent === undefined ? '' : ` ${state.percent}%`;
      return `${t('downloading')} v${state.version}${percent}`;
    }
    if (phase === 'downloaded') return `${t('downloaded')}：v${state.version}`;
    if (phase === 'installing') return `${t('installing')} v${state.version}`;
    if (phase === 'error') {
      // A stalled or failed download is not a failed check, and saying so is the whole
      // point of that message.
      const prefix = state.action === 'download' ? t('failedDownload') : t('failed')
      return `${prefix}：${state.message ?? ''}`
    };
    return '';
  }

  /** The shell's relocation failure codes, in the reader's language. */
  const DATA_ERROR_KEYS = {
    'not-absolute': 'moveErrNotAbsolute',
    'same-path': 'moveErrSame',
    'nested-path': 'moveErrNested',
    'target-not-empty': 'moveErrNotEmpty',
    failed: 'moveErrFailed',
  }

  /**
   * Turn a relocation failure code into a sentence. Pure, so the test can drive it.
   * @param code - the shell's `error` field.
   * @param t - locale lookup.
   * @returns the text to show, or '' when there is nothing to say.
   */
  function dataErrorText(code, t) {
    if (code === undefined || code === null || code === '') return ''
    const key = DATA_ERROR_KEYS[code]
    // An unknown code is a bug, but showing the code beats showing nothing.
    return key === undefined ? String(code) : t(key)
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

      /**
       * Where the harness data lives, and how to move it somewhere else.
       *
       * The data home is resolved before any window exists, so switching it needs a
       * new process: the shell copies (or moves) the directory, records the choice
       * and relaunches — this row only proposes a folder and shows the progress.
       */
      function DataLocationRow() {
        const info = (typeof window !== 'undefined' && window.__NEO_DSH__) || undefined;
        const [proposal, setProposal] = react.useState(null);
        const [phase, setPhase] = react.useState('idle');
        const [error, setError] = react.useState('');

        // The shell reports the folder chooser's answer, and the relocation's
        // progress, through here.
        react.useEffect(() => {
          if (typeof window === 'undefined') return undefined;
          const previous = window.__NEO_DSH_CHOOSE__;
          window.__NEO_DSH_CHOOSE__ = (next) => {
            if (next === undefined || next === null || next.key !== 'dataHome') return;
            if (next.phase === 'moving' || next.phase === 'restarting') {
              setProposal(null); setError(''); setPhase(next.phase); return;
            }
            if (next.error) { setProposal(null); setError(dataErrorText(next.error, t)); setPhase('idle'); return; }
            if (next.canceled) return;
            if (typeof next.path === 'string' && next.path !== '') { setError(''); setProposal(next.path); }
          };
          return () => { window.__NEO_DSH_CHOOSE__ = previous; };
        }, []);

        if (info === undefined || typeof info.homePath !== 'string' || info.dataMoves !== true) return null;
        // DSH_HOME outranks the settings row, so offering a change there would lie.
        const pinned = info.homeSource === 'env';
        const sourceLabel = pinned ? t('dataSourceEnv')
          : info.homeSource === 'configured' ? t('dataSourceConfigured') : t('dataSourceDefault');
        const status = phase === 'moving' ? t('moveWorking')
          : phase === 'restarting' ? t('moveRestarting') : sourceLabel;

        const submit = (kind) => {
          setProposal(null); setError(''); setPhase('moving');
          location.href = `${info.setPath ?? '/__dsh_desktop_set'}?key=dataHome`
            + `&value=${encodeURIComponent(proposal)}&mode=${kind}`;
        };

        const modal = proposal === null ? null : react.createElement('div', {
          className: 'dsk-overlay', onClick: () => setProposal(null),
        }, react.createElement('div', { className: 'dsk-dialog', onClick: (event) => event.stopPropagation() }, [
          react.createElement('h3', { key: 'title' }, t('moveTitle')),
          react.createElement('p', { key: 'body' }, t('moveBody')),
          react.createElement('div', { className: 'dsk-dialog-path', key: 'paths' }, [
            react.createElement('div', { className: 'dsk-desc', key: 'from' }, `${t('moveFrom')}：${info.homePath}`),
            react.createElement('div', { className: 'dsk-path', key: 'to' }, `${t('moveTo')}：${proposal}`),
          ]),
          react.createElement('div', { className: 'dsk-dialog-actions', key: 'actions' }, [
            react.createElement('button', {
              key: 'cancel', type: 'button', className: 'dsk-btn', onClick: () => setProposal(null),
            }, t('moveCancel')),
            react.createElement('button', {
              key: 'move', type: 'button', className: 'dsk-btn', onClick: () => submit('move'),
            }, t('moveMove')),
            react.createElement('button', {
              key: 'copy', type: 'button', className: 'dsk-btn dsk-primary', onClick: () => submit('copy'),
            }, t('moveCopy')),
          ]),
        ]));

        return react.createElement('div', { id: 'dsh-data-location', className: 'dsk-row' }, [
          react.createElement('div', { className: 'dsk-main', key: 'main' }, [
            react.createElement('div', { className: 'dsk-text', key: 'text' }, [
              react.createElement('div', { className: 'dsk-title', key: 'title' }, t('dataTitle')),
              react.createElement('div', { className: 'dsk-desc', key: 'desc' }, `${t('dataDesc')} · ${status}`),
              react.createElement('div', { className: 'dsk-path', key: 'path', title: info.homePath }, info.homePath),
              info.homeSource === 'configured' ? react.createElement('div', { className: 'dsk-note', key: 'cli' }, t('dataCliNote')) : null,
              error === '' ? null : react.createElement('div', { className: 'dsk-err', key: 'err' }, error),
            ]),
            react.createElement('div', { className: 'dsk-actions', key: 'actions' },
              react.createElement('button', {
                type: 'button', className: 'dsk-btn', disabled: pinned || phase !== 'idle',
                onClick: () => {
                  setError(''); setPhase('idle');
                  location.href = `${info.choosePath ?? '/__dsh_desktop_choose'}?key=dataHome`;
                },
              }, t('dataChange'))),
          ]),
          modal,
        ]);
      }

      /**
       * The proxy the harness host runs behind.
       *
       * The host is a Node process, so an explicit proxy (Clash and friends) only works if
       * Node is told to read the variables: the shell resolves the proxy and passes it on.
       * This row is where that choice lives.
       */
      function ProxyRow() {
        const info = (typeof window !== 'undefined' && window.__NEO_DSH__) || undefined;
        const proxy = info?.proxy;
        if (info === undefined || proxy === undefined) return null;

        const [mode, setMode] = react.useState(proxy.mode ?? 'system');
        const [url, setUrl] = react.useState(proxy.url ?? '');
        const send = (nextMode, nextUrl) => {
          const base = `${info.setPath ?? '/__dsh_desktop_set'}?key=proxy&value=${encodeURIComponent(nextMode)}`;
          location.href = nextUrl === undefined ? base : `${base}&url=${encodeURIComponent(nextUrl)}`;
        };

        const sourceLabel = proxy.source === 'environment' ? t('proxySourceEnv')
          : proxy.source === 'desktop settings' ? t('proxySourceSystem')
          : proxy.source === 'manual' ? t('proxySourceManual')
          : proxy.source;
        const status = mode === 'direct' ? t('proxyDirect')
          : mode === 'manual'
            ? `${t('proxyManual')} · ${url === '' ? t('proxyNoProxy') : url}`
            : proxy.effective === '' ? `${t('proxyFollow')} · ${t('proxyNoProxy')}`
            : `${t('proxyFollow')} · ${t('proxyUsing')} ${proxy.effective}（${sourceLabel}）`;

        const actions = [
          react.createElement('select', {
            key: 'mode', className: 'dsk-select', value: mode,
            onChange: (event) => {
              const next = event.target.value;
              setMode(next);
              if (next !== 'manual') send(next);
            },
          }, [
            react.createElement('option', { key: 'system', value: 'system' }, t('proxyFollow')),
            react.createElement('option', { key: 'direct', value: 'direct' }, t('proxyDirect')),
            react.createElement('option', { key: 'manual', value: 'manual' }, t('proxyManual')),
          ]),
        ];
        if (mode === 'manual') {
          actions.push(react.createElement('input', {
            key: 'url', className: 'dsk-input', type: 'text', value: url,
            placeholder: t('proxyPlaceholder'), spellCheck: false,
            onChange: (event) => setUrl(event.target.value),
            onKeyDown: (event) => { if (event.key === 'Enter') send('manual', url) },
          }));
          actions.push(react.createElement('button', {
            key: 'save', type: 'button', className: 'dsk-btn dsk-primary',
            onClick: () => send('manual', url),
          }, t('proxySave')));
        }

        return react.createElement('div', { id: 'dsh-network-proxy', className: 'dsk-row' }, [
          react.createElement('div', { className: 'dsk-main', key: 'main' }, [
            react.createElement('div', { className: 'dsk-text', key: 'text' }, [
              react.createElement('div', { className: 'dsk-title', key: 'title' }, t('proxyTitle')),
              react.createElement('div', { className: 'dsk-desc', key: 'desc' }, status),
              react.createElement('div', { className: 'dsk-note', key: 'hint' }, t('proxyHint')),
            ]),
            react.createElement('div', { className: 'dsk-actions', key: 'actions' }, actions),
          ]),
        ]);
      }

      const entry = {
        name: 'settings.general.item',
        id: 'neo-dsh-desktop',
        order: 40,
        label: () => t('title'),
      };
      const proxyEntry = {
        name: 'settings.general.item',
        id: 'neo-dsh-network-proxy',
        order: 43,
        label: () => t('proxyTitle'),
      };
      const dataEntry = {
        name: 'settings.general.item',
        id: 'neo-dsh-data-location',
        order: 42,
        label: () => t('dataTitle'),
      };
      const frameEntry = {
        name: 'settings.general.item',
        id: 'neo-dsh-window-frame',
        order: 41,
        label: () => t('frameTitle'),
      };
      if (localeReady) { entry.locale = NS; frameEntry.locale = NS; dataEntry.locale = NS; proxyEntry.locale = NS; }
      ctx.effect(
        () => slots.inject('settings.general.item', () => slots.register(entry, DesktopSettingsRow)),
        'dsh-desktop-settings: settings row',
      );
      ctx.effect(
        () => slots.inject('settings.general.item', () => slots.register(frameEntry, WindowFrameRow)),
        'dsh-desktop-settings: window frame row',
      );
      ctx.effect(
        () => slots.inject('settings.general.item', () => slots.register(dataEntry, DataLocationRow)),
        'dsh-desktop-settings: data location row',
      );
      ctx.effect(
        () => slots.inject('settings.general.item', () => slots.register(proxyEntry, ProxyRow)),
        'dsh-desktop-settings: network proxy row',
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
    module.exports = { statusText, dataErrorText, LOCALE_ZH, LOCALE_EN };
  }
})();
