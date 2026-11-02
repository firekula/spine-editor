#!/usr/bin/env bash
# Phase 1 视口视觉验证（一键，内存预载版）：
#   1. 服务器 --preload 启动时把整个仓库同步读进内存，绕开平台存储层的
#      按文件读取抖动（读取发生在进程最早期，实测可靠）
#   2. curl 复核关键 URL
#   3. agent-browser 无头加载 4.2 与 3.8 两个语料，截图存 build/visual/
# 用法：bash scripts/visual-check.sh [端口=8124]
set -uo pipefail

PROJ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
PORT="${1:-8124}"
OUT="$PROJ/build/visual"
FAIL=0

mkdir -p "$OUT"

echo "== 1/3 启动内存预载服务器 :$PORT =="
pkill -f "serve.mjs" 2>/dev/null; sleep 1
node "$PROJ/scripts/serve.mjs" "$PORT" --preload > /tmp/serve-vc.log 2>&1 &
SRV=$!
sleep 2.5

echo "== 2/3 curl 复核关键 URL =="
for u in /harness/index.html /build/spine-webgl-4.2.mjs /build/spine-webgl-3.8.mjs \
         /corpus/v4.2/Box.json /corpus/v4.2/Box.png /corpus/v3.8/boss1.json /corpus/v3.8/boss1.png; do
  code=$(curl -s -o /dev/null -w "%{http_code}" "http://127.0.0.1:$PORT$u")
  echo "  $u → $code"
  [ "$code" != "200" ] && FAIL=1
done
[ "$FAIL" = 1 ] && { echo "服务器复核未过，中止"; kill $SRV 2>/dev/null; cat /tmp/serve-vc.log | head -5; exit 1; }

echo "== 3/3 无头浏览器验证 =="
pkill -f "agent-browser" 2>/dev/null; sleep 1
for asset in "v4.2/Box" "v3.8/boss1"; do
  name="${asset//\//-}"
  timeout 90 agent-browser open "http://127.0.0.1:$PORT/harness/?asset=$asset" > /dev/null 2>&1
  sleep 6
  hud=$(timeout 30 agent-browser eval "document.getElementById('hudName').textContent + ' | ' + document.getElementById('versionBadge').textContent + ' | ' + document.getElementById('hudStats').textContent" 2>/dev/null)
  err=$(timeout 30 agent-browser errors 2>/dev/null | head -2)
  echo "  [$asset] hud = $hud"
  [ -n "$err" ] && echo "  [$asset] 页面错误: $err"
  timeout 60 agent-browser screenshot "$OUT/p1-$name.png" > /dev/null 2>&1
  echo "  [$asset] 截图 → build/visual/p1-$name.png"
done

kill $SRV 2>/dev/null
timeout 30 agent-browser close > /dev/null 2>&1
ls -la "$OUT"
echo "完成。"
