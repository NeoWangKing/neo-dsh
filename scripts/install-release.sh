#!/usr/bin/env bash
# Install a Neo DSH release into a local prefix, verifying it before it replaces anything.
#
#   bash scripts/install-release.sh --dry-run              # 只说明会做什么
#   bash scripts/install-release.sh                        # 装最新版到 ~/.local/opt/neo-dsh
#   bash scripts/install-release.sh --version 0.1.16       # 装指定版本
#   bash scripts/install-release.sh --prefix /tmp/try      # 装到别处（试跑用）
#
# Why a script: the in-app update check needs Chromium's network stack (fixed after
# 0.1.16), and on this network GitHub downloads arrive truncated without an error —
# which is why every download here is checked against the release's sha256 and retried,
# and why the new tree is unpacked and inspected *before* the old one is moved aside.
set -euo pipefail

REPO="${NEO_DSH_REPO:-NeoWangKing/neo-dsh}"
PREFIX="${HOME}/.local/opt/neo-dsh"
VERSION="latest"
ASSET="auto"
MIRRORS=("" "https://gh-proxy.com/" "https://ghfast.top/")
DRY_RUN=0
CACHE="${XDG_CACHE_HOME:-$HOME/.cache}/neo-dsh-update"

die() { printf '\033[31m✗ %s\033[0m\n' "$*" >&2; exit 1; }
info() { printf '  %s\n' "$*"; }
ok() { printf '\033[32m✓ %s\033[0m\n' "$*"; }

usage() { sed -n '2,12p' "$0" | sed 's/^# \{0,1\}//'; exit 0; }

while [ $# -gt 0 ]; do
  case "$1" in
    --version) VERSION="${2:?--version 需要一个版本号}"; shift 2 ;;
    --prefix) PREFIX="${2:?--prefix 需要一个目录}"; shift 2 ;;
    --asset) ASSET="${2:?--asset 需要 zip 或 appimage}"; shift 2 ;;
    --mirror) MIRRORS=("${2:?}"); shift 2 ;;
    --dry-run) DRY_RUN=1; shift ;;
    -h|--help) usage ;;
    *) die "不认识的参数：$1（--help 看用法）" ;;
  esac
done

case "$(uname -s)" in
  Linux) PLATFORM=linux ;;
  Darwin) die "macOS 用的是 .app 套件（结构和 Linux 树不同），请用 dmg 覆盖 /Applications/Neo DSH.app（或找我要已校验的 dmg）" ;;
  *) die "这个脚本只处理 Linux" ;;
esac
ARCH="$(uname -m)"
case "$ARCH" in
  x86_64|amd64) ARCH=x64 ;;
  arm64|aarch64) ARCH=arm64 ;;
  *) die "不认识的架构：$ARCH" ;;
esac

if ! command -v sha256sum >/dev/null; then
  command -v shasum >/dev/null || die "缺少 sha256sum / shasum"
  sha256sum() { shasum -a 256 "$@"; }
fi
for tool in curl sha256sum unzip; do command -v "$tool" >/dev/null || die "缺少 $tool"; done

echo "Neo DSH 本地更新：$PLATFORM-$ARCH → $PREFIX"

# ---------------------------------------------------------------- release metadata
API="https://api.github.com/repos/$REPO/releases"
command -v python3 >/dev/null || die "缺少 python3（用来解析 release 的 JSON）"

WORK="$(mktemp -d "${TMPDIR:-/tmp}/neo-dsh-update-XXXXXX")"
trap 'rm -rf "$WORK"' EXIT
META="$WORK/release.json"
ASSETS="$WORK/assets.tsv"

if [ "$VERSION" = latest ]; then API_URL="$API/latest"; else API_URL="$API/tags/v$VERSION"; fi
info "查询 release 元数据（走你 shell 里的代理）…"
curl -fsSL --max-time 60 -H 'accept: application/vnd.github+json' -H 'user-agent: neo-dsh-installer' \
  -o "$META" "$API_URL" || die "取不到 release 信息（curl 需要能走 http_proxy/https_proxy）"

python3 - "$META" > "$ASSETS" <<'PYEOF'
import json, sys
release = json.load(open(sys.argv[1]))
print("tag\t" + str(release.get("tag_name", "")))
for asset in release.get("assets", []):
    digest = (asset.get("digest") or "").removeprefix("sha256:")
    print("asset\t" + "\t".join([asset.get("name", ""), asset.get("browser_download_url", ""), digest, str(asset.get("size", 0))]))
PYEOF

TAG="$(awk -F'\t' '$1=="tag"{print $2}' "$ASSETS")"
[ -n "$TAG" ] || die "release 信息里没有 tag_name"
VER="${TAG#v}"
info "目标版本：$VER"

if [ "$ASSET" = auto ]; then
  CANDIDATES=("neo-dsh-$VER-linux-x64.zip" "neo-dsh-$VER-mac-arm64.dmg" "neo-dsh-$VER-linux-x86_64.AppImage")
else
  case "$ASSET" in
    zip) CANDIDATES=("neo-dsh-$VER-linux-x64.zip" "neo-dsh-$VER-mac-arm64.zip") ;;
    appimage) CANDIDATES=("neo-dsh-$VER-linux-x86_64.AppImage") ;;
    *) die "--asset 只支持 auto / zip / appimage" ;;
  esac
fi

CHOSEN=""; URL=""; SHA=""; SIZE=""
for name in "${CANDIDATES[@]}"; do
  row="$(awk -F'\t' -v n="$name" '$1=="asset" && $2==n{print; exit}' "$ASSETS")"
  if [ -n "$row" ]; then
    CHOSEN="$(printf '%s' "$row" | cut -f2)"
    URL="$(printf '%s' "$row" | cut -f3)"
    SHA="$(printf '%s' "$row" | cut -f4)"
    SIZE="$(printf '%s' "$row" | cut -f5)"
    break
  fi
done
[ -n "$CHOSEN" ] || die "release v$VER 里没有适合 $PLATFORM-$ARCH 的产物（见 https://github.com/$REPO/releases/tag/$TAG）"
info "产物：$CHOSEN（$(( ${SIZE:-0} / 1048576 )) MB）"
[ -n "$SHA" ] || die "这个 release 没有 sha256 摘要，拒绝在无法校验的情况下替换应用"
info "期望 sha256：${SHA:0:16}…"

if [ "$DRY_RUN" = 1 ]; then
  ok "dry-run：只解析元数据，不下载、不改动。真跑会："
  info "下载 $URL"
  info "校验 sha256 = ${SHA:0:16}…"
  info "解包 → 检查目录结构 → 把 $PREFIX 改名为 $PREFIX.bak-<旧版本>-<时间> → 放进 $VER"
  exit 0
fi

# ---------------------------------------------------------------------- download
mkdir -p "$CACHE"
FILE="$CACHE/$CHOSEN"
verify() { [ -f "$FILE" ] && [ "$(sha256sum "$FILE" | awk '{print $1}')" = "$SHA" ]; }

if verify; then
  ok "缓存里已有校验通过的文件，跳过下载"
else
  got=0
  # 第一遍接着上次没下完的地方续传，第二遍才从头来（防那次留下的是坏前缀）。
  for pass in resume fresh; do
    [ "$pass" = fresh ] && rm -f "$FILE"
    for mirror in "${MIRRORS[@]}"; do
      info "下载 ${mirror:-（直连 GitHub）}…（$pass）"
      if curl -fL --retry 2 --retry-delay 2 --max-time 1800 -C - -o "$FILE" "${mirror}${URL}" 2>/dev/null && verify; then
        got=1; break 2
      fi
      info "  这次没拿到完整文件（本网络常见），换下一个源"
    done
  done
  if [ "$got" != 1 ]; then
    if [ -t 0 ]; then
      read -r -p "  所有源都没下全（缓存里是半截文件）。要清掉重下一次吗？[y/N] " answer || true
      case "$answer" in y|Y) rm -f "$FILE"; exec "$0" "$@" ;; esac
    fi
    die "下载后 sha256 仍不一致（半截文件留在 $FILE，下次运行会尝试续传）"
  fi
  ok "下载完成并通过 sha256 校验"
fi

# ------------------------------------------------------------------- sanity checks
if pgrep -f "$PREFIX/neo-dsh" >/dev/null 2>&1; then
  die "Neo DSH 正在从 $PREFIX 运行，请先退出它（或选另一个 --prefix）再更新"
fi
case "$(findmnt -no TARGET --target "$(dirname "$PREFIX")" 2>/dev/null || echo /)" in
  /) ;;
  *) info "注意：$PREFIX 不在根文件系统上，替换是跨设备复制" ;;
esac

# ----------------------------------------------------------------------- unpack
WORK="$(mktemp -d "${TMPDIR:-/tmp}/neo-dsh-update-XXXXXX")"
trap 'rm -rf "$WORK"' EXIT
NEW="$WORK/new"
mkdir -p "$NEW"
case "$CHOSEN" in
  *.zip)
    info "解包 zip…"
    unzip -q "$FILE" -d "$NEW"
    # electron-builder 有时候多套一层目录
    if [ ! -x "$NEW/neo-dsh" ] && [ -d "$NEW/linux-unpacked" ]; then mv "$NEW/linux-unpacked"/* "$NEW/"; fi
    ;;
  *.AppImage)
    info "解包 AppImage…"
    chmod +x "$FILE"
    ( cd "$NEW" && "$FILE" --appimage-extract >/dev/null )
    [ -d "$NEW/squashfs-root" ] || die "AppImage 解包失败"
    mv "$NEW/squashfs-root"/* "$NEW/" 2>/dev/null || true
    ;;
  *) die "不认识的文件类型：$CHOSEN" ;;
esac

[ -f "$NEW/resources/app/package.json" ] || die "解出来的目录不像 Neo DSH 的应用树（缺少 resources/app/package.json）"
NEW_VER="$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' "$NEW/resources/app/package.json" | head -1)"
[ "$NEW_VER" = "$VER" ] || die "解出来的版本是 $NEW_VER，和期望的 $VER 不一致"
chmod +x "$NEW/neo-dsh" 2>/dev/null || true

# ---------------------------------------------------------------------- install
OLD_VER="?"
[ -f "$PREFIX/resources/app/package.json" ] && OLD_VER="$(sed -n 's/.*"version": *"\([^"]*\)".*/\1/p' "$PREFIX/resources/app/package.json" | head -1)"
BAK="$PREFIX.bak-$OLD_VER-$(date +%Y%m%d-%H%M%S)"
mkdir -p "$(dirname "$PREFIX")"
if [ -e "$PREFIX" ]; then
  mv "$PREFIX" "$BAK"
  ok "旧版 $OLD_VER 已备份 → $BAK"
fi
mv "$NEW" "$PREFIX"
ok "已安装 $VER → $PREFIX"

echo
echo "回滚：  rm -rf '$PREFIX' && mv '$BAK' '$PREFIX'"
echo "启动：  '$PREFIX/neo-dsh'      （或你平时用的桌面图标）"
echo "提示：  数据、会话、设置都在各自的数据目录里，这次替换没碰它们。"
