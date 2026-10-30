#!/usr/bin/env python3
"""git-ssh：用 paramiko 模拟 ssh 客户端，供 GIT_SSH_COMMAND 调用。

沙箱无 openssh-client；git over SSH 需要 ssh 可执行文件。本脚本以
OpenSSH 兼容的参数形式接收调用（[-p port] [--] user@host command），
通过 paramiko 建立连接并双向转发 stdin/stdout/stderr。

用法（git 侧自动调用，无需手动运行）：
    git config core.sshCommand "python3 scripts/git-ssh.py"
    git push -u origin dev
"""
import os
import sys
import select

import paramiko


def main() -> int:
    args = sys.argv[1:]
    port = 22
    i = 0
    while i < len(args):
        a = args[i]
        if a == "-p":
            port = int(args[i + 1])
            i += 2
            continue
        if a == "--":
            i += 1
            continue
        break
    if i >= len(args):
        sys.stderr.write("git-ssh: 缺少 host 参数\n")
        return 255
    hostspec = args[i]
    command = " ".join(args[i + 1:])
    user, _, host = hostspec.partition("@")

    key_path = os.path.expanduser("~/.ssh/id_ed25519")
    client = paramiko.SSHClient()
    client.load_system_host_keys()
    client.set_missing_host_key_policy(paramiko.AutoAddPolicy())  # TOFU
    client.connect(
        host,
        port=port,
        username=user or "git",
        key_filename=key_path if os.path.exists(key_path) else None,
        look_for_keys=False,
        allow_agent=False,
        timeout=30,
    )
    chan = client.get_transport().open_session()
    chan.exec_command(command)

    stdin_open = True
    while True:
        rlist = [chan.fileno()]
        if stdin_open:
            rlist.append(0)
        ready, _, _ = select.select(rlist, [], [], 0.1)

        if 0 in ready:
            try:
                data = os.read(0, 65536)
            except OSError:
                data = b""
            if not data:
                stdin_open = False
                try:
                    chan.shutdown_write()
                except Exception:
                    pass
            else:
                chan.sendall(data)

        if chan.recv_ready():
            data = chan.recv(65536)
            if data:
                os.write(1, data)
        if chan.recv_stderr_ready():
            data = chan.recv_stderr(65536)
            if data:
                os.write(2, data)

        if chan.exit_status_ready() and chan.eof_received:
            while chan.recv_ready():
                os.write(1, chan.recv(65536))
            while chan.recv_stderr_ready():
                os.write(2, chan.recv_stderr(65536))
            break

    code = chan.recv_exit_status()
    client.close()
    return code


if __name__ == "__main__":
    sys.exit(main())
