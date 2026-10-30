#!/usr/bin/env bash
# 一键 checkpoint：确认/切换到 dev 分支 → 提交全部变更 → 刷新完整 bundle 备份。
# 用法（项目目录内）: bash scripts/git-checkpoint.sh "提交说明"
set -euo pipefail

PROJ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
REPO="$(git -C "$PROJ" rev-parse --show-toplevel)"
MSG="${1:-checkpoint $(date +%F_%H:%M)}"
BUNDLE="$REPO/download/spine-phase0.bundle"

cd "$REPO"
BRANCH="$(git rev-parse --abbrev-ref HEAD)"
if [ "$BRANCH" != "dev" ]; then
  if git show-ref --verify --quiet refs/heads/dev; then
    git switch dev
  else
    git switch -c dev
  fi
fi

git add -A
if git diff --cached --quiet; then
  echo "[checkpoint] 无变更可提交"
else
  git commit -m "$MSG"
  echo "[checkpoint] 已提交: $MSG"
fi

git bundle create "$BUNDLE" --all
echo "[checkpoint] bundle 已刷新: $BUNDLE"
git log --oneline -5 || true
