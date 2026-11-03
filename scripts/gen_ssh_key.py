#!/usr/bin/env python3
"""生成 ed25519 SSH keypair（OpenSSH 格式），并备份到 download/deploy-key/。

沙箱无 ssh-keygen；平台重置会清掉 ~/.ssh 但保留 download/ 普通文件：
- 备份存在 → recover.sh 直接还原私钥，无需重新登记 GitHub
- 备份不存在 → 本脚本生成新密钥并写备份，公钥（stdout）需登记 GitHub

注意：备份目录必须在 git 仓库之外（GitHub push protection 会拦截私钥）。

用法：python3 scripts/gen_ssh_key.py
"""
import os
import shutil
import sys

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

OUT = os.path.expanduser("~/.ssh")
PRIV = os.path.join(OUT, "id_ed25519")
PUB = PRIV + ".pub"
# download/deploy-key/：在仓库外、download/ 内，可扛住沙箱重置
BACKUP = os.environ.get(
    "SPINE_DEPLOY_KEY_DIR",
    os.path.abspath(
        os.path.join(os.path.dirname(os.path.abspath(__file__)), "..", "..", "deploy-key")
    ),
)


def main() -> None:
    os.makedirs(OUT, exist_ok=True)
    key = Ed25519PrivateKey.generate()

    pem = key.private_bytes(
        encoding=serialization.Encoding.PEM,
        format=serialization.PrivateFormat.OpenSSH,
        encryption_algorithm=serialization.NoEncryption(),
    )
    with open(PRIV, "wb") as f:
        f.write(pem)

    pub = key.public_key().public_bytes(
        encoding=serialization.Encoding.OpenSSH,
        format=serialization.PublicFormat.OpenSSH,
    )
    comment = "spine-editor-deploy"
    with open(PUB, "wb") as f:
        f.write(pub + b" " + comment.encode() + b"\n")

    os.chmod(PRIV, 0o600)
    os.chmod(PUB, 0o644)

    # 备份密钥到 download/deploy-key/（扛沙箱重置；敏感文件，勿入 git 仓库）
    try:
        os.makedirs(BACKUP, exist_ok=True)
        for src in (PRIV, PUB):
            shutil.copy2(src, os.path.join(BACKUP, os.path.basename(src)))
        os.chmod(os.path.join(BACKUP, "id_ed25519"), 0o600)
        print(f"已备份密钥到: {BACKUP}")
        print("（沙箱再被重置时 recover.sh 会从备份还原，无需重新登记 GitHub）")
    except OSError as e:
        print(f"警告: 密钥备份失败({e})，沙箱重置后需重新生成并登记", file=sys.stderr)

    print("== PUBLIC KEY (add this to GitHub) ==")
    print(pub.decode() + " " + comment)


if __name__ == "__main__":
    main()
