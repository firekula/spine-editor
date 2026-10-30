# Git 工作流（本仓库专用）

## 背景（2026-10-30 架构变更）

- ~~git 仓库根目录 = `/home/z/my-project`，由平台托管~~ → **已废弃**。
  平台的自动快照会覆盖平台侧仓库与工作树（本轮实测第三次复现：
  平台侧 `.git`、`scripts/` 整个消失，仅 `download/` 内容幸存）。
- **现架构：本目录（`spine-phase0/`）自身就是一个独立 git 仓库**，
  远程为团队 GitHub 仓库 `git@github.com:firekula/spine-editor.git`，
  **`dev` 分支是唯一可信主干**，所有正式提交都落在 dev；里程碑打 tag。
- 平台侧 `/home/z/my-project` 目录只是沙箱工作区，随时可能被快照重置；
  任何需要持久化的东西**必须在 `spine-phase0/` 仓库内**。

## 日常（一键）

```bash
cd download/spine-phase0
bash scripts/git-checkpoint.sh "提交说明"
```

## 推送到 GitHub

沙箱没有 openssh 客户端，仓库内置 `scripts/git-ssh.py`（paramiko 实现，
GIT_SSH_COMMAND 包装）：

```bash
# 一次性配置（仓库 config 已写入，恢复后如丢失执行以下两行）
git remote add origin git@github.com:firekula/spine-editor.git
git config core.sshCommand "python3 scripts/git-ssh.py"

# 推送
git push -u origin dev
```

- SSH 私钥位于沙箱 `~/.ssh/id_ed25519`（平台快照**不会**清除 home 目录，
  本轮实测幸存）；公钥已交由仓库管理员添加到 GitHub Deploy Keys / 账号 SSH Keys；
- 若 home 目录也被重置：用 `scripts/gen_ssh_key.py` 重新生成并**重新登记公钥**。

## 备份与外发（bundle）

- `*.bundle` 在 .gitignore（产物不入库），checkpoint 脚本会重新生成到
  `/home/z/my-project/download/` 供下载；
- **建议把 bundle 下载一份存到内网**，任何时候都能完整恢复：

```bash
git clone spine-phase0.bundle spine-internal     # 得到含全部历史的完整仓库
cd spine-internal && git pull /path/to/spine-phase0.bundle dev
```

- 万一沙箱工作树被平台快照重置：本目录 `.git` 独立于平台仓库，重新进入后
  `git checkout -- .` 即可恢复到 dev 最新提交（2026-10-30 实测：平台覆盖后
  `.git` 与全部提交完好，仅外层平台目录受损）。

## 约定

- `main`（GitHub）：保留给团队主分支策略，当前由 dev 承载开发主干；
- `dev`：主干，唯一的正式提交目标；
- tag：`phase0`、`p1-viewport`……每个里程碑一个；
- `corpus/`（语料）与 `vendor/`（官方 runtime 源码）都入库——恢复时一步到位；
- `node_modules/`、`*.bundle`、`*.log` 不入库。

## 平台快照行为（已实证，2026-10-30）

- 平台会在**消息边界**重置 `/home/z/my-project`：外层 `.git`、新建的顶层目录
  （如 `scripts/`）会消失；`download/spine-phase0/`（含嵌套 `.git`）内容幸存，
  但**外层仓库的 stash/merge 操作可能波及本目录工作树**——涉及外层 git 操作前
  先确认本目录工作树干净（`git status`），必要时先 checkpoint。
- 恢复流程：进本目录 → `git status` → `git checkout -- .` → 重跑 `npm test` 验证。
