# Git 工作流（本仓库专用）

## 背景（2026-10-30 架构变更，当晚二次修订）

- ~~git 仓库根目录 = `/home/z/my-project`，由平台托管~~ → **已废弃**。
  平台的自动快照会覆盖平台侧仓库与工作树。
- **现架构：本目录（`spine-phase0/`）自身就是一个独立 git 仓库**，
  远程为团队 GitHub 仓库 `git@github.com:firekula/spine-editor.git`，
  **`dev` 分支是唯一可信主干**，所有正式提交都落在 dev；里程碑打 tag。
- 平台侧 `/home/z/my-project` 目录只是沙箱工作区，随时可能被快照重置；
  任何需要持久化的东西**必须在 `spine-phase0/` 仓库内**。

## 平台快照行为（已实证两次，2026-10-30）

- 平台在**消息边界**重置沙箱。幸存机制是"平台 git 跟踪 `download/` 下的普通文件"：
  - **文件内容幸存**（`corpus/`、`src/`、`vendor/` 等都被平台仓库跟踪）；
  - **嵌套 `.git/` 会消失**（平台 git 不跟踪嵌套仓库），本轮第二次复现：
    12:31 重置后 `spine-phase0/.git` 整个没了，靠 `spine-phase0.bundle` 恢复；
  - **`~/.ssh`（含 SSH 私钥）也会被清**（早前"home 不会被清"的判断被推翻）；
  - 文件权限位会被统一 chmod 成 755 → 仓库已设 `core.fileMode=false` 屏蔽。
- **恢复流程只有一条命令**：`bash scripts/recover.sh`
  （自动：bundle 恢复 .git → 重建 git 配置 → 确保 paramiko → 检查/重建 SSH 密钥）。
  只有当密钥被重建时，才需要人工把新公钥登记到 GitHub，其余全自动。

## 日常（一键）

```bash
cd download/spine-phase0
bash scripts/git-checkpoint.sh "提交说明"   # 提交到 dev + 刷新 bundle 备份
```

## 推送到 GitHub

沙箱没有 openssh 客户端，仓库内置 `scripts/git-ssh.py`（paramiko 实现，
GIT_SSH_COMMAND 包装）。**注意：必须用沙箱 venv 的 python**
（`/home/z/.venv/bin/python`，系统 `python3` 没装 paramiko）；
recover.sh 会自动写好配置，手工配置则执行：

```bash
git remote add origin git@github.com:firekula/spine-editor.git   # 已配置则用 set-url
git config core.sshCommand "/home/z/.venv/bin/python /home/z/my-project/download/spine-phase0/scripts/git-ssh.py"

git push -u origin dev
```

- SSH 私钥位于沙箱 `~/.ssh/id_ed25519`；**沙箱重置会清掉它**，
  此时 `scripts/gen_ssh_key.py` 重新生成后必须**重新登记公钥**到 GitHub
  （仓库 Settings → Deploy keys，删旧加新，勾选 Allow write access）。
- paramiko 丢失时用国内镜像安装（PyPI 直连会超时）：
  `uv pip install paramiko --python /home/z/.venv/bin/python --index-url https://mirrors.aliyun.com/pypi/simple/`

## 备份与外发（bundle）

- `*.bundle` 在 .gitignore（产物不入库），checkpoint 脚本会重新生成到
  `/home/z/my-project/download/` 供下载——它是嵌套 `.git` 被清后唯一的恢复源；
- **建议把 bundle 下载一份存到内网**，任何时候都能完整恢复：

```bash
git clone spine-phase0.bundle spine-internal     # 得到含全部历史的完整仓库
cd spine-internal && git pull /path/to/spine-phase0.bundle dev
```

- 备用法：若暂时不方便换 GitHub 公钥，也可以自己在本地直接把 bundle 推上去：

```bash
git clone spine-phase0.bundle push-tmp -b dev
cd push-tmp && git remote add origin git@github.com:firekula/spine-editor.git
git push -u origin dev
```

## 约定

- `main`（GitHub）：保留给团队主分支策略，当前由 dev 承载开发主干；
- `dev`：主干，唯一的正式提交目标；
- tag：`phase0`、`p1-viewport`……每个里程碑一个；
- `corpus/`（语料）与 `vendor/`（官方 runtime 源码）都入库——恢复时一步到位；
- `node_modules/`、`*.bundle`、`*.log` 不入库。

## 2026-11-02 第三次重置实录（重要教训）

- 重置不只发生在**消息边界**，本轮发生在**工作中途**（Import Data 预检刚跑完、
  checkpoint 之前）：外层平台仓库被重置到平台自己的 main（UUID 快照提交），
  嵌套 `.git`、`~/.ssh`、`~/.venv` 全被清；
- **工作文件零丢失**：平台仓库跟踪 `download/` 普通文件，未提交的
  harness 源码与文档全部幸存，`recover.sh` 一条命令恢复仓库后直接继续提交；
- 教训：**做完一段工作立刻 checkpoint + push**，不要攒；
- recover.sh 已升级：恢复后自动 fetch origin 快进（GitHub 远程是权威源，
  bundle 可能落后于已推送的提交）。
