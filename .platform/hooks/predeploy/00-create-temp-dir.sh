#!/bin/bash

LOG_FILE="/var/log/eb-hooks.log"

echo "[HOOK] Starting directory creation" >> "$LOG_FILE"

mkdir -p /mnt && echo "[HOOK] /mnt created or already exists" >> "$LOG_FILE"
chmod 777 /mnt && echo "[HOOK] /mnt permission set to 777" >> "$LOG_FILE"

setfacl -d -m u::rwx /mnt && echo "[HOOK] Default ACL u::rwx set on /mnt" >> "$LOG_FILE"
setfacl -d -m g::rwx /mnt && echo "[HOOK] Default ACL g::rwx set on /mnt" >> "$LOG_FILE"
setfacl -d -m o::rwx /mnt && echo "[HOOK] Default ACL o::rwx set on /mnt" >> "$LOG_FILE"

mkdir -p /mnt/notableBlock-temp && echo "[HOOK] notableBlock-temp created" >> "$LOG_FILE"
chmod 777 /mnt/notableBlock-temp && echo "[HOOK] notableBlock-temp permission set" >> "$LOG_FILE"

echo "[HOOK] Done" >> "$LOG_FILE"
