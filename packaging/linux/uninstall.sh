#!/usr/bin/env bash
# Remove a user install created by install.sh. Leaves $DSH_HOME alone: sessions,
# settings and credentials are user data, not part of the application.
#
#   ./uninstall.sh                    remove from ~/.local
#   ./uninstall.sh --prefix /usr/local
#   ./uninstall.sh --purge            also delete ${DSH_HOME:-~/.dsh}
set -euo pipefail

PREFIX="${HOME}/.local"
PURGE=0
while [ $# -gt 0 ]; do
  case "$1" in
    --prefix) PREFIX="$2"; shift 2 ;;
    --prefix=*) PREFIX="${1#*=}"; shift ;;
    --purge) PURGE=1; shift ;;
    -h|--help) sed -n '2,9p' "${BASH_SOURCE[0]}"; exit 0 ;;
    *) echo "uninstall.sh: unknown option $1" >&2; exit 2 ;;
  esac
done

DEST="${PREFIX}/opt/neo-dsh"
LAUNCHER="${PREFIX}/bin/neo-dsh"
DESKTOP_ID="neo-dsh"

echo "==> removing ${DEST}"
pkill -f "${DEST}/neo-dsh" 2>/dev/null || true
sleep 1
rm -rf "${DEST}"
rm -f "${LAUNCHER}"
rm -f "${PREFIX}/share/applications/${DESKTOP_ID}.desktop"
rm -rf "${PREFIX}/share/icons/hicolor"/*/apps/"${DESKTOP_ID}".png

if [ "${PURGE}" = "1" ]; then
  HOME_DIR="${DSH_HOME:-${HOME}/.dsh}"
  echo "==> purging ${HOME_DIR} (sessions, settings, credentials)"
  rm -rf "${HOME_DIR}"
else
  echo "    kept ${DSH_HOME:-$HOME/.dsh} (use --purge to delete it)"
fi
echo "Removed."
