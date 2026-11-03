#!/usr/bin/env bash
# 把 Phase 1 视口部署到平台预览（Next.js public/ 静态托管）。
#
# 平台沙箱跑着一个 Next.js dev server（端口 3000，平台 web UI 右侧预览面板可见，
# "Open in New Tab" 可外链访问）。harness 是纯静态 ES 模块页，直接放进 public/：
#   /                    → 307 重定向 → /harness/index.html
#   /harness/index.html  → 视口页面（?asset=v3.8/boss1 可指定初始素材）
#   /build/*.mjs         → spine-webgl 双版本 runtime（webgl bundle 已内联 core）
#   /corpus/**           → 语料（json/atlas/png）
#
# 用法（仓库任意位置）: bash scripts/deploy-preview.sh
# 注意：public/ 在仓库外；沙箱若被重置，先跑平台 fullstack 初始化脚本
#   curl https://z-cdn.chatglm.cn/fullstack/init-fullstack.sh | bash
# 再跑本脚本即可恢复部署。eslint 已 ignore public/**（压缩 bundle 会爆 lint）。
set -euo pipefail

PROJ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
WEBROOT="${SPINE_WEBROOT:-/home/z/my-project}"

step() { echo; echo "== [deploy] $* =="; }

step "1/3 复制静态资源"
mkdir -p "$WEBROOT/public/build"
cp -r "$PROJ/harness" "$WEBROOT/public/harness"
cp "$PROJ"/build/spine-webgl-*.mjs "$WEBROOT/public/build/"
rm -rf "$WEBROOT/public/corpus"
cp -r "$PROJ/corpus" "$WEBROOT/public/corpus"
echo "harness/build/corpus → $WEBROOT/public/"

step "2/3 根路由重定向"
# page.tsx: redirect('/harness/index.html')（若平台模板重置会丢，重新写入）
if ! rg -q "harness/index.html" "$WEBROOT/src/app/page.tsx" 2>/dev/null; then
  cat > "$WEBROOT/src/app/page.tsx" <<'TSX'
import { redirect } from 'next/navigation'

// 根路由直接进入 Spine Phase 1 视口（纯静态页，位于 public/harness/）
export default function Home() {
  redirect('/harness/index.html')
}
TSX
  echo "已重写 page.tsx（重定向到 harness）"
else
  echo "page.tsx 已含重定向，跳过"
fi

step "3/3 健康检查"
if curl -sf -o /dev/null http://localhost:3000/harness/index.html; then
  echo "✓ /harness/index.html 可达（dev server 在 3000 端口正常服务）"
  echo "在平台 web UI 右侧预览面板查看，或点 Open in New Tab 获取外链。"
else
  echo "✗ dev server 未响应。若沙箱被重置过，先执行："
  echo "  curl https://z-cdn.chatglm.cn/fullstack/init-fullstack.sh | bash"
  echo "再重跑本脚本。"
  exit 1
fi
