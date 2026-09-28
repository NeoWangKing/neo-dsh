#!/usr/bin/env bash
# Launch a throwaway Neo DSH from THIS source checkout, so a change can be looked
# at in a real window without touching the install or the app you are running.
#
#   bash scripts/dev-window.sh                       # /tmp home, port 3199
#   DSH_DEV_PORT=3210 bash scripts/dev-window.sh     # another port
#   DSH_DEV_KEEP_HOME=1 bash scripts/dev-window.sh   # reuse the previous home
#
# Three things are isolated on purpose:
#   * --user-data-dir  its own Electron profile. That directory also holds the
#                    app's data-location pointer, so the dev shell is pointed at
#                    /tmp without touching the real app's config — and the settings
#                    row under test can move it around freely.
#   * the home         /tmp/neo-dev-home, filled on first run by the app's own
#                    migration (the same code path an installed build runs), so the
#                    dev window shows your conversations;
#                    anything it writes stays in /tmp
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

# Point the dev shell at the throwaway home through the app's own preference file
# (the same one Settings → General → data location writes), not through DSH_HOME:
# that way the dev window exercises the real resolution order instead of the
# development override.
mkdir -p "$DEV_PROFILE"
printf '{\n  "dataHome": %s\n}\n' "$(node -e 'console.log(JSON.stringify(process.argv[1]))' "$DEV_HOME")" \
  > "$DEV_PROFILE/desktop-config.json"

echo "dev window: data home=$DEV_HOME  port=$PORT  userData=$DEV_PROFILE"
echo "            (fresh home: the app migrates your conversations in on first run,"
echo "             exactly like an installed build would — nothing here touches $REAL_HOME)"
exec env DSH_DESKTOP_PORT="$PORT" DSH_DESKTOP_FORCE_BUNDLED=1 \
  apps/desktop/node_modules/.bin/electron apps/desktop --user-data-dir="$DEV_PROFILE"
