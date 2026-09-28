#!/usr/bin/env bash
# Launch a throwaway Neo DSH from THIS source checkout, so a change can be looked
# at in a real window without touching the install or the app you are running.
#
#   bash scripts/dev-window.sh                       # /tmp home, port 3199
#   DSH_DEV_PORT=3210 bash scripts/dev-window.sh     # another port
#   DSH_DEV_KEEP_HOME=1 bash scripts/dev-window.sh   # reuse the previous home
#
# Three things are isolated on purpose:
#   * $DSH_HOME      a temporary copy of settings/credentials/sessions, so the dev
#                    window looks like the real app but anything it writes stays
#                    in /tmp (never a symlink: the harness writes to these files)
#   * --user-data-dir  its own Electron profile; sharing the real one would fight
#                    the running app over Chromium's SingletonLock
#   * DSH_DESKTOP_PORT a spare loopback port; 3081 belongs to the running app, and
#                    two hosts must never share one session store
#
# Pair it with `pnpm run test` before launching: the unit suites are seconds, the
# window is how the interface itself gets checked.
set -euo pipefail
cd "$(dirname "${BASH_SOURCE[0]}")/.."

PORT="${DSH_DEV_PORT:-3199}"
DEV_HOME="${DSH_DEV_HOME:-/tmp/neo-dev-home}"
DEV_PROFILE="${DSH_DEV_PROFILE:-/tmp/neo-dev-profile}"
REAL_HOME="${DSH_HOME:-$HOME/.dsh}"

[ -x apps/desktop/node_modules/.bin/electron ] \
  || { echo "dev-window: run 'pnpm --dir apps/desktop install' first" >&2; exit 1; }

node scripts/check-node.mjs >/dev/null
if [ "${DSH_DEV_SKIP_RESOURCES:-0}" != "1" ]; then
  node scripts/build-resources.mjs >/dev/null
fi

# Stop a previous dev run. Two shapes have to go: its shell (findable by the
# profile argument) and its HOST, which is just `node … --port $PORT` and shows up
# only as whatever holds the port. Killing the shell alone leaves that host behind,
# and the next launch then dies with EADDRINUSE inside an error dialog.
for pid in $(pgrep -f "user-data-dir=$DEV_PROFILE" 2>/dev/null || true); do
  [ "$pid" = "$$" ] || kill "$pid" 2>/dev/null || true
done
sleep 1
HOLDER="$(ss -ltnp 2>/dev/null | grep ":$PORT " | grep -o 'pid=[0-9]*' | head -1 | cut -d= -f2 || true)"
if [ -n "${HOLDER:-}" ]; then
  HOLDER_EXE="$(readlink -f "/proc/$HOLDER/exe" 2>/dev/null || true)"
  case "$HOLDER_EXE" in
    *neo-dsh*|*Projects/neo-dsh*) kill "$HOLDER" 2>/dev/null || true; sleep 1 ;;
    *) echo "dev-window: port $PORT is held by PID $HOLDER ($HOLDER_EXE) — not ours, refusing" >&2; exit 1 ;;
  esac
fi
if ss -ltn 2>/dev/null | grep -q ":$PORT "; then
  echo "dev-window: port $PORT is still in use — stop it and retry" >&2
  exit 1
fi

if [ "${DSH_DEV_KEEP_HOME:-0}" != "1" ]; then
  rm -rf "$DEV_HOME" "$DEV_PROFILE"
fi
mkdir -p "$DEV_HOME"
for item in settings.yaml .credentials.yaml sessions storages attachments .agent-presets; do
  if [ -e "$REAL_HOME/$item" ] && [ ! -e "$DEV_HOME/$item" ]; then
    cp -a "$REAL_HOME/$item" "$DEV_HOME/$item"
  fi
done

echo "dev window: DSH_HOME=$DEV_HOME  port=$PORT  userData=$DEV_PROFILE"
echo "            (a copy of $REAL_HOME — changes here stay in /tmp)"
exec env DSH_HOME="$DEV_HOME" DSH_DESKTOP_PORT="$PORT" \
  apps/desktop/node_modules/.bin/electron apps/desktop --user-data-dir="$DEV_PROFILE"
