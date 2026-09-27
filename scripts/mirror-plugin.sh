#!/usr/bin/env bash
# Push plugins/activity-line to its standalone mirror repository.
#
# The monorepo is the source of truth; NeoWangKing/dsh-activity-line exists so the
# plugin can be found on its own and installed with
# `dsh plugin --profile web add github:NeoWangKing/dsh-activity-line`. This script
# splits the plugin's own history out of the monorepo (`git subtree split`) and
# force-free pushes it, so the mirror stays a faithful projection — never edit the
# mirror directly.
#
# Usage: bash scripts/mirror-plugin.sh [git-remote-or-url]
set -euo pipefail

REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REMOTE="${1:-git@github.com:NeoWangKing/dsh-activity-line.git}"
BRANCH="plugin-mirror-tmp"

cd "${REPO_DIR}"

if [ -n "$(git status --porcelain -- plugins/activity-line)" ]; then
  echo "mirror-plugin: plugins/activity-line has uncommitted changes — commit them first" >&2
  exit 1
fi

echo "mirror-plugin: splitting plugins/activity-line"
git subtree split --prefix=plugins/activity-line -b "${BRANCH}" >/dev/null
echo "mirror-plugin: pushing to ${REMOTE} (main)"
git push "${REMOTE}" "${BRANCH}:main"
git branch -D "${BRANCH}" >/dev/null
echo "mirror-plugin: done"
