#!/usr/bin/env python3
"""生成 ed25519 SSH keypair（OpenSSH 格式）。

沙箱无 ssh-keygen；home 目录被平台重置后用本脚本重新生成密钥，
并把公钥（stdout）重新登记到 GitHub。

用法：python3 scripts/gen_ssh_key.py
"""
import os

from cryptography.hazmat.primitives import serialization
from cryptography.hazmat.primitives.asymmetric.ed25519 import Ed25519PrivateKey

OUT = os.path.expanduser("~/.ssh")
PRIV = os.path.join(OUT, "id_ed25519")
PUB = PRIV + ".pub"


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

    print("== PUBLIC KEY (add this to GitHub) ==")
    print(pub.decode() + " " + comment)


if __name__ == "__main__":
    main()
