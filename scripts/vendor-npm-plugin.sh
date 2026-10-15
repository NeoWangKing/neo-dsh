#!/usr/bin/env bash
# Vendor an npm plugin, with its dependencies, into vendor/<name>/ so the desktop can ship it.
#
# The desktop never runs pnpm at install time: `build-resources.mjs` copies `vendor/<name>/` into
# the app's resources, and the first launch materialises it into the live profile's node_modules.
# So a plugin that has dependencies has to carry them *inside itself*, and npm's installed layout
# is reproduced here:
#
#   vendor/<name>/                  the plugin's own published files
#   vendor/<name>/node_modules/…    every dependency, including any nested copy npm created to
#                                   satisfy a version conflict
#
# Peer dependencies are deliberately NOT vendored — the host resolves those from the harness
# itself, which is how the plugins already shipped work. `--legacy-peer-deps` is what keeps a
# bare `npm install` from dragging alpha builds of host packages in.
#
# Symlinks are dereferenced: `.bin` is full of them, git stores them awkwardly, and
# `build-resources.mjs` would have to dereference them at copy time anyway.
#
# Usage: bash vendor-npm-plugin.sh <spec> <vendor-path-relative-to-vendor/>
set -euo pipefail

SPEC="${1:?usage: vendor-npm-plugin.sh <spec> <vendor-path>}"
DEST_REL="${2:?usage: vendor-npm-plugin.sh <spec> <vendor-path>}"

REPO="${NEO_DSH_REPO:-$HOME/Projects/neo-dsh}"
DEST="$REPO/vendor/$DEST_REL"
WORK="$(mktemp -d)"
trap 'rm -rf "$WORK"' EXIT

NAME="$(npm view "$SPEC" name --json 2>/dev/null | tr -d '"')"
VERSION="$(npm view "$SPEC" version --json 2>/dev/null | tr -d '"')"
[ -n "$NAME" ] && [ -n "$VERSION" ] || { echo "  ✗ npm view failed for $SPEC" >&2; exit 1; }
echo "vendor-npm-plugin: $NAME@$VERSION → vendor/$DEST_REL"

( cd "$WORK" && npm install --no-audit --no-fund --legacy-peer-deps --install-strategy=hoisted "$SPEC" >/dev/null 2>&1 )
[ -d "$WORK/node_modules/$NAME" ] || { echo "  ✗ install produced no node_modules/$NAME" >&2; exit 1; }

rm -rf "$DEST"
mkdir -p "$DEST"
cp -R "$WORK/node_modules/$NAME/." "$DEST/"

# No `node_modules` yet: a plugin with no dependencies must not end up with an empty one, because
# git cannot store an empty directory — it would exist here and be missing in a fresh clone,
# which is exactly the difference that makes a check pass locally and fail in CI.
moved=0
for entry in "$WORK"/node_modules/* "$WORK"/node_modules/@*/*; do
  [ -e "$entry" ] || continue
  rel="${entry#"$WORK"/node_modules/}"
  [ "$rel" = "$NAME" ] && continue
  mkdir -p "$(dirname "$DEST/node_modules/$rel")"
  cp -RL "$entry" "$DEST/node_modules/$rel"
  moved=$((moved + 1))
done
[ "$moved" -gt 0 ] || rmdir "$DEST/node_modules" 2>/dev/null || true

echo "  dependencies moved in: $moved"
echo "  size: $(du -sh "$DEST" | cut -f1)   files: $(find "$DEST" -type f | wc -l | tr -d ' ')"
echo "  symlinks in the copy: $(find "$DEST" -type l | wc -l | tr -d ' ') (must be 0)"

# A vendored copy is only useful if its dependencies are reachable from inside it.
( cd "$DEST" && node -e '
const { createRequire } = require("module");
const pkg = require(process.cwd() + "/package.json");
const req = createRequire(process.cwd() + "/package.json");
const deps = Object.keys(pkg.dependencies || {});
const missing = deps.filter((d) => { try { req.resolve(d); return false; } catch { return true; } });
if (missing.length) { console.error("  ✗ unreachable: " + missing.join(", ")); process.exit(1); }
console.log("  ✓ all " + deps.length + " declared dependencies resolve inside the copy");
' )
