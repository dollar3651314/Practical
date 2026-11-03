#!/usr/bin/env bash
# 部署 Practical（agents 项目/Practical）：CI 的 deploy job 运行；可以重复运行。
#   bash scripts/deploy.sh staging      测试版 practical-staging
#   bash scripts/deploy.sh production   正式版 practical
# 步骤：说清这次带多少素材（ensure-r2.mjs）→ 构建 dist/（web/ + media/ + 素材清单）→ 部署（带提交号）
#      → 打印健康检查（不含密钥，顺带报素材齐了几个）。
# 1.0 不用 R2（Amos 2026-11-03 不绑卡）：素材跟代码一起走 Workers 静态资源，所以这里不再建桶。
# 没有 CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID 时打印"跳过"并成功（C103）——这两个由 Amos 填进 GitHub Secrets（底线 1）。
# 参照：Marketing scripts/deploy.sh。
set -euo pipefail
cd "$(dirname "$0")/.."
TARGET="${1:-}"
case "$TARGET" in
  staging) E="staging"; WORKER="practical-staging" ;;
  production) E=""; WORKER="practical" ;;
  *) echo "用法：bash scripts/deploy.sh staging|production" >&2; exit 2 ;;
esac
if [ -z "${CLOUDFLARE_API_TOKEN:-}" ] || [ -z "${CLOUDFLARE_ACCOUNT_ID:-}" ]; then
  echo "· 跳过部署：还没有 CLOUDFLARE_API_TOKEN / CLOUDFLARE_ACCOUNT_ID（《上线操作手册》第二步由 Amos 填）"
  exit 0
fi
export WRANGLER_SEND_METRICS=false
SHA="${GITHUB_SHA:-$(git rev-parse HEAD)}"
OUT="$(mktemp)"
trap 'rm -f "$OUT"' EXIT
node scripts/ensure-r2.mjs --env "$TARGET"
# wrangler.toml 的 [build] 也会跑这一句；这里先跑一遍，是为了素材不对时在部署之前就看见
node scripts/build-assets.mjs
npx wrangler deploy --env="$E" --var "VERSION:$SHA" 2>&1 | tee "$OUT"
[ "${PIPESTATUS[0]}" = 0 ] || { echo "✗ 部署失败" >&2; exit 1; }
echo "✓ 部署 $TARGET（版本 $SHA）"
URL="$(grep -oE "https://${WORKER}\.[a-z0-9-]+\.workers\.dev" "$OUT" | head -1 || true)"
if [ -n "$URL" ]; then
  body="$(curl -s --max-time 10 "$URL/health" || true)"
  echo "· 健康检查（$URL/health，不含密钥）：$body"
  echo "  media_ready 是素材齐了几个场景；是 0 就是仓库的 media/ 文件夹里还没有素材，网站会说「素材还没生成」"
fi
