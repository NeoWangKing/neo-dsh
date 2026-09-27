#!/usr/bin/env bash
# Install Neo DSH for the current user, from the directory this script
# was extracted into. No root, no package manager, no Node prerequisite: the
# runtime ships in this tree.
#
#   ./install.sh                     install under ~/.local
#   ./install.sh --prefix /usr/local  install elsewhere (must be writable)
#   ./install.sh --no-desktop         skip the .desktop entry and icons
#   ./uninstall.sh                    remove it again
#
# Layout it creates:
#   <prefix>/opt/neo-dsh/          the application tree (copy, not a symlink)
#   <prefix>/bin/neo-dsh           launcher
#   <prefix>/share/applications/neo-dsh.desktop
#   <prefix>/share/icons/hicolor/<size>/apps/neo-dsh.png
set -euo pipefail

HERE="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PREFIX="${HOME}/.local"
WITH_DESKTOP=1
while [ $# -gt 0 ]; do
  case "$1" in
    --prefix) PREFIX="$2"; shift 2 ;;
    --prefix=*) PREFIX="${1#*=}"; shift ;;
    --no-desktop) WITH_DESKTOP=0; shift ;;
    -h|--help) sed -n '2,16p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "install.sh: unknown option $1" >&2; exit 2 ;;
  esac
done

APP_NAME="Neo DSH"
BIN_NAME="neo-dsh"
DEST="${PREFIX}/opt/neo-dsh"
LAUNCHER="${PREFIX}/bin/${BIN_NAME}"
DESKTOP_ID="neo-dsh-desktop"

# --- sanity: this must be the packaged tree, not a source checkout ------------
EXE="${HERE}/${BIN_NAME}"
NODE="${HERE}/resources/node/bin/node"
PROFILE="${HERE}/resources/profile-web/package.json"
for required in "${EXE}" "${NODE}" "${PROFILE}"; do
  if [ ! -e "${required}" ]; then
    echo "install.sh: ${required} is missing — extract the whole archive before running this script" >&2
    exit 1
  fi
done
if [ "$(uname -s)" != "Linux" ]; then
  echo "install.sh: this archive is the Linux build (uname says $(uname -s))" >&2
  exit 1
fi

echo "==> ${APP_NAME}"
echo "    from:   ${HERE}"
echo "    to:     ${DEST}"
echo "    prefix: ${PREFIX}"

# --- stop a running copy so the tree can be replaced --------------------------
if pgrep -f "${DEST}/${BIN_NAME}-desktop|${DEST}/neo-dsh-desktop" >/dev/null 2>&1; then
  echo "    stopping the running copy"
  pkill -f "${DEST}/${BIN_NAME}" || true
  sleep 2
fi

# --- copy the tree -----------------------------------------------------------
rm -rf "${DEST}"
mkdir -p "$(dirname "${DEST}")" "${PREFIX}/bin"
cp -R "${HERE}" "${DEST}"
chmod +x "${DEST}/${BIN_NAME}" "${DEST}/resources/node/bin/node" 2>/dev/null || true
# Electron's sandbox helper must be root-owned and setuid; a user install cannot
# provide that, so rely on unprivileged user namespaces (the default on Arch,
# Fedora, Ubuntu 24.04+) and surface the failure clearly if they are disabled.
if [ -e "${DEST}/chrome-sandbox" ] && [ "$(id -u)" = "0" ]; then
  chown root:root "${DEST}/chrome-sandbox"
  chmod 4755 "${DEST}/chrome-sandbox"
fi

cat > "${LAUNCHER}" <<LAUNCHER
#!/usr/bin/env sh
exec "${DEST}/${BIN_NAME}" "\$@"
LAUNCHER
chmod +x "${LAUNCHER}"

# --- desktop entry + icons ---------------------------------------------------
if [ "${WITH_DESKTOP}" = "1" ]; then
  APPS="${PREFIX}/share/applications"
  ICONS="${PREFIX}/share/icons/hicolor"
  mkdir -p "${APPS}"
  for size in 16 32 48 64 128 256 512; do
    src="${DEST}/resources/icons/${size}x${size}.png"
    [ -f "${src}" ] || continue
    mkdir -p "${ICONS}/${size}x${size}/apps"
    cp "${src}" "${ICONS}/${size}x${size}/apps/${DESKTOP_ID}.png"
  done
  ICON_NAME="${DESKTOP_ID}"
  if [ ! -f "${ICONS}/512x512/apps/${DESKTOP_ID}.png" ] && [ -f "${DEST}/resources/icon.png" ]; then
    mkdir -p "${ICONS}/512x512/apps"
    cp "${DEST}/resources/icon.png" "${ICONS}/512x512/apps/${DESKTOP_ID}.png"
  fi
  if [ ! -f "${ICONS}/512x512/apps/${DESKTOP_ID}.png" ]; then
    ICON_NAME="${DEST}/resources/icon.png"
  fi
  cat > "${APPS}/${DESKTOP_ID}.desktop" <<DESKTOP
[Desktop Entry]
Type=Application
Name=${APP_NAME}
Comment=AI coding agent harness
Exec=${LAUNCHER}
Icon=${ICON_NAME}
Terminal=false
Categories=Development;Utility;
StartupWMClass=${DESKTOP_ID}
DESKTOP
  chmod +x "${APPS}/${DESKTOP_ID}.desktop"
  command -v update-desktop-database >/dev/null 2>&1 && update-desktop-database "${APPS}" 2>/dev/null || true
  command -v gtk-update-icon-cache >/dev/null 2>&1 && gtk-update-icon-cache -f -t "${ICONS}" 2>/dev/null || true
fi

echo
echo "Installed."
echo "  run:      ${LAUNCHER}"
if [ "${WITH_DESKTOP}" = "1" ]; then
  echo "  menu:     ${APP_NAME}"
fi
case ":${PATH}:" in
  *":${PREFIX}/bin:"*) ;;
  *) echo "  note:     add ${PREFIX}/bin to PATH to run '${BIN_NAME}' by name" ;;
esac
echo "  data:     \${DSH_HOME:-$HOME/.dsh} — the app seeds the profile and preset there on first launch"
echo "  api key:  export DEEPSEEK_API_KEY=... , or sign in from the app's settings"
