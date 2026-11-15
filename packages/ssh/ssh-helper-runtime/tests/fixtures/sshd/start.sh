#!/bin/sh
set -eu
ssh-keygen -q -t ed25519 -N '' -f /etc/ssh/ssh_host_ed25519_key
install -d -m 700 -o nhs -g nhs /home/nhs/.ssh
install -m 600 -o nhs -g nhs /fixture-key.pub /home/nhs/.ssh/authorized_keys
install -d -m 700 -o nhs -g nhs /home/nhs/workspace
exec /usr/sbin/sshd -D -e -f /etc/ssh/sshd_config
