#!/usr/bin/env bash
# 沙箱被平台重置后的一键恢复：
#   1. 从 bundle 备份恢复 .git（若丢失）
#   2. 恢复 git 配置（origin / sshCommand / 身份 / fileMode）
#   3. 确保 paramiko 可用（git-ssh.py 依赖）
#   4. 确保 SSH 密钥存在；若重新生成，打印公钥供重新登记 GitHub
# 用法: bash scripts/recover.sh
set -uo pipefail

PROJ="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BUNDLE="$PROJ/../spine-phase0.bundle"
VENV_PY="/home/z/.venv/bin/python"
REMOTE="git@github.com:firekula/spine-editor.git"

step() { echo; echo "== [recover] $* =="; }

# ---------- 1) 仓库本体 ----------
step "1/4 仓库恢复"
if [ -d "$PROJ/.git" ]; then
  echo "git 仓库已存在，跳过"
else
  if [ ! -f "$BUNDLE" ]; then
    echo "错误: 找不到 bundle 备份 ($BUNDLE)，仓库无法恢复"
    exit 1
  fi
  TMP="$(mktemp -d)"
  if ! git clone "$BUNDLE" "$TMP/repo" -b dev; then
    rm -rf "$TMP"
    echo "错误: bundle 恢复失败"
    exit 1
  fi
  mv "$TMP/repo/.git" "$PROJ/.git"
  rm -rf "$TMP"
  echo "已从 bundle 恢复 .git（dev 分支）"
fi

# ---------- 2) git 配置（幂等） ----------
step "2/4 git 配置"
cd "$PROJ"
# 平台快照恢复会把文件 chmod 成 755，屏蔽权限位噪音
git config core.fileMode false
git config user.name  "spine-editor"
git config user.email "spine-editor@team.local"
if git remote get-url origin >/dev/null 2>&1; then
  git remote set-url origin "$REMOTE"
else
  git remote add origin "$REMOTE"
fi
# 系统 python3 无 paramiko，必须用沙箱 venv 的 python
git config core.sshCommand "$VENV_PY $PROJ/scripts/git-ssh.py"
echo "origin = $(git remote get-url origin)"
git status --short | head -5

# ---------- 3) paramiko ----------
step "3/4 paramiko 依赖"
if "$VENV_PY" -c "import paramiko" >/dev/null 2>&1; then
  echo "paramiko 已可用"
else
  echo "安装 paramiko（阿里云镜像，PyPI 直连超时）..."
  if command -v uv >/dev/null 2>&1; then
    timeout 180 uv pip install paramiko --python "$VENV_PY" \
      --index-url https://mirrors.aliyun.com/pypi/simple/ || \
    timeout 180 "$VENV_PY" -m pip install paramiko -i https://mirrors.aliyun.com/pypi/simple/
  else
    timeout 180 "$VENV_PY" -m pip install paramiko -i https://mirrors.aliyun.com/pypi/simple/
  fi
  "$VENV_PY" -c "import paramiko" >/dev/null 2>&1 \
    && echo "paramiko 安装成功" \
    || echo "警告: paramiko 安装失败，请手动安装后再推送"
fi

# ---------- 4) SSH 密钥 ----------
step "4/4 SSH 密钥"
# 备份在 download/deploy-key/（仓库外、download 内，扛平台沙箱重置）
KEY_BACKUP="$PROJ/../deploy-key"
if [ -f "$HOME/.ssh/id_ed25519" ]; then
  echo "已有密钥（若 GitHub 上登记的就是它，则无需任何操作）："
  cat "$HOME/.ssh/id_ed25519.pub"
elif [ -f "$KEY_BACKUP/id_ed25519" ]; then
  # 平台重置清了 ~/.ssh，但 download/ 备份还在 → 直接还原，无需重新登记
  mkdir -p "$HOME/.ssh"
  cp "$KEY_BACKUP/id_ed25519"     "$HOME/.ssh/id_ed25519"
  cp "$KEY_BACKUP/id_ed25519.pub" "$HOME/.ssh/id_ed25519.pub"
  chmod 600 "$HOME/.ssh/id_ed25519"
  chmod 644 "$HOME/.ssh/id_ed25519.pub"
  echo "已从备份还原密钥（$KEY_BACKUP），GitHub 无需重新登记："
  cat "$HOME/.ssh/id_ed25519.pub"
else
  echo "首次运行（无密钥备份）：生成新密钥并写入备份 ..."
  "$VENV_PY" "$PROJ/scripts/gen_ssh_key.py"
  cat <<'TIP'

>>> 新密钥已生成，必须把上面打印的公钥登记到 GitHub（理论上仅此一次）：
>>> 仓库页 Settings → Deploy keys → 删除旧 key → Add deploy key
>>> （粘贴公钥，勾选 Allow write access）
>>> 备份已写入 $KEY_BACKUP，今后沙箱重置将自动还原，无需再登记
TIP
fi

step "完成。下一步"
# 恢复后若 SSH 可用，从 GitHub 快进到远程最新（远程是权威源，bundle 可能落后）
if [ -f "$HOME/.ssh/id_ed25519" ]; then
  echo "尝试从 GitHub 快进 dev ..."
  if git fetch origin 2>/dev/null; then
    if git merge --ff-only refs/remotes/origin/dev 2>/dev/null; then
      echo "已快进到 origin/dev: $(git log --oneline -1)"
    else
      echo "本地与远程分叉，请人工检查（git log dev..origin/dev）"
    fi
    git push origin dev 2>/dev/null && echo "推送成功（密钥仍有效）" || \
      echo "推送失败：多半是密钥被重置，需重新登记公钥（见上方）"
  else
    echo "fetch 失败：密钥大概率已被重置，需重新登记公钥（见上方）"
  fi
fi
cat <<'EOF'
  公钥登记好后推送:   git push -u origin dev
  日常提交+备份:      bash scripts/git-checkpoint.sh "提交说明"
EOF
