#!/usr/bin/env bash
# dsh-desktop uninstaller: removes the launcher, desktop entry, and icon.
set -euo pipefail

LAUNCHER_NAME="dsh-desktop"
BIN_DIR="${HOME}/.local/bin"
APPS_DIR="${HOME}/.local/share/applications"
ICON_DIR="${HOME}/.local/share/icons/hicolor/512x512/apps"
ICON_NAME="dsh-desktop"

rm -f "${BIN_DIR}/${LAUNCHER_NAME}"
rm -f "${BIN_DIR}/dsh"
rm -f "${APPS_DIR}/${LAUNCHER_NAME}.desktop"
rm -f "${ICON_DIR}/${ICON_NAME}.png"

command -v update-desktop-database >/dev/null 2>&1 \
  && update-desktop-database "${APPS_DIR}" >/dev/null 2>&1 || true
command -v gtk-update-icon-cache >/dev/null 2>&1 \
  && gtk-update-icon-cache -t -f "${HOME}/.local/share/icons/hicolor" >/dev/null 2>&1 || true

echo "dsh-desktop uninstalled."
