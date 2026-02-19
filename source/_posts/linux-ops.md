---
title: Linux 服务器运维入门：从零开始管理你的服务器
date: 2026-02-17 14:00:00
updated: 2026-02-17 14:00:00
tags:
  - Linux
  - 运维
  - DevOps
  - 服务器
categories:
  - Linux
keywords: Linux, 服务器运维, SSH, Nginx, 防火墙, 系统管理
description: Linux 服务器运维入门教程，涵盖 SSH 连接、用户管理、防火墙配置、Nginx 部署、系统监控等核心运维技能。
cover: https://picsum.photos/seed/linux-ops/800/400
---

## 前言

掌握 Linux 服务器管理是后端开发者和运维工程师的必备技能。本教程涵盖日常运维中最常用的操作和最佳实践。

<!-- more -->

## 1. SSH 远程连接

### 1.1 密钥认证（推荐）

```bash
# 本地生成 SSH 密钥对
ssh-keygen -t ed25519 -C "your@email.com"

# 将公钥复制到服务器
ssh-copy-id -i ~/.ssh/id_ed25519.pub user@server_ip

# 使用密钥登录
ssh user@server_ip
```

### 1.2 SSH 配置优化

编辑 `~/.ssh/config`：
```
Host myserver
    HostName 192.168.1.100
    User deploy
    Port 22
    IdentityFile ~/.ssh/id_ed25519
    ServerAliveInterval 60
    ServerAliveCountMax 3
```

使用后直接 `ssh myserver` 即可连接。

### 1.3 安全加固 `/etc/ssh/sshd_config`

```bash
# 禁用密码登录（确保密钥已配置）
PasswordAuthentication no

# 禁止 root 远程登录
PermitRootLogin no

# 修改默认端口
Port 2222

# 限制登录尝试
MaxAuthTries 3

# 重启 SSH 服务
sudo systemctl restart sshd
```

## 2. 用户与权限管理

```bash
# 创建用户
sudo useradd -m -s /bin/bash deploy

# 设置密码
sudo passwd deploy

# 添加到 sudo 组
sudo usermod -aG sudo deploy

# 查看用户信息
id deploy

# 文件权限
chmod 755 /var/www          # rwxr-xr-x
chmod 644 config.yml        # rw-r--r--
chown -R deploy:deploy /var/www/app
```

### 权限数字对照

| 数字 | 权限 | 说明 |
|------|------|------|
| 7 | rwx | 读+写+执行 |
| 6 | rw- | 读+写 |
| 5 | r-x | 读+执行 |
| 4 | r-- | 只读 |
| 0 | --- | 无权限 |

## 3. 防火墙配置 (UFW)

```bash
# 安装并启用
sudo apt install ufw
sudo ufw enable

# 基本规则
sudo ufw allow 22/tcp          # SSH
sudo ufw allow 80/tcp          # HTTP
sudo ufw allow 443/tcp         # HTTPS
sudo ufw allow 2222/tcp        # 自定义 SSH 端口

# 限制来源 IP
sudo ufw allow from 10.0.0.0/8 to any port 3306  # MySQL

# 查看规则
sudo ufw status numbered

# 删除规则
sudo ufw delete 3
```

## 4. Nginx 配置

### 4.1 安装

```bash
sudo apt update
sudo apt install nginx
sudo systemctl enable nginx
```

### 4.2 反向代理配置

```nginx
# /etc/nginx/sites-available/myapp.conf

# 上游服务
upstream app_backend {
    server 127.0.0.1:3000;
    keepalive 32;
}

server {
    listen 80;
    server_name example.com www.example.com;

    # 重定向到 HTTPS
    return 301 https://$server_name$request_uri;
}

server {
    listen 443 ssl http2;
    server_name example.com;

    # SSL 证书 (Let's Encrypt)
    ssl_certificate /etc/letsencrypt/live/example.com/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/example.com/privkey.pem;

    # 安全头
    add_header X-Frame-Options SAMEORIGIN;
    add_header X-Content-Type-Options nosniff;
    add_header X-XSS-Protection "1; mode=block";

    # Gzip 压缩
    gzip on;
    gzip_types text/plain application/json application/javascript text/css;

    # 静态文件缓存
    location /static/ {
        alias /var/www/app/static/;
        expires 30d;
        add_header Cache-Control "public, immutable";
    }

    # 反向代理
    location / {
        proxy_pass http://app_backend;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

### 4.3 启用站点

```bash
# 创建软链接
sudo ln -s /etc/nginx/sites-available/myapp.conf /etc/nginx/sites-enabled/

# 测试配置
sudo nginx -t

# 重载配置
sudo systemctl reload nginx
```

## 5. 系统监控

### 5.1 常用监控命令

```bash
# CPU 和内存概览
htop

# 磁盘使用
df -h

# 查看大文件/目录
du -sh /var/* | sort -rh | head -10

# 网络连接
ss -tlnp

# 实时网络流量
iftop

# 进程查看
ps aux --sort=-%mem | head -20

# 系统日志
journalctl -u nginx --since "1 hour ago"
tail -f /var/log/syslog
```

### 5.2 磁盘清理

```bash
# 清理 APT 缓存
sudo apt autoremove -y
sudo apt autoclean

# 清理日志
sudo journalctl --vacuum-size=100M

# 查找大文件
find / -type f -size +100M 2>/dev/null | head -20
```

## 6. 自动化部署脚本

```bash
#!/bin/bash
# deploy.sh - 简单部署脚本

set -euo pipefail

APP_DIR="/var/www/myapp"
REPO_URL="git@github.com:user/repo.git"
BRANCH="main"

echo "🚀 开始部署..."

# 拉取最新代码
cd "$APP_DIR"
git fetch origin "$BRANCH"
git reset --hard "origin/$BRANCH"

# 安装依赖
npm ci --production

# 构建
npm run build

# 重启服务
sudo systemctl restart myapp

# 等待服务启动
sleep 3

# 健康检查
if curl -sf http://localhost:3000/health > /dev/null; then
    echo "✅ 部署成功！"
else
    echo "❌ 部署失败，正在回滚..."
    git reset --hard HEAD~1
    npm ci --production
    npm run build
    sudo systemctl restart myapp
    exit 1
fi
```

## 7. 定时任务 (Crontab)

```bash
# 编辑定时任务
crontab -e

# 格式: 分 时 日 月 周 命令
# 每天凌晨 3 点备份数据库
0 3 * * * /home/deploy/scripts/backup-db.sh >> /var/log/backup.log 2>&1

# 每小时清理临时文件
0 * * * * find /tmp -type f -mtime +1 -delete

# 每周一发送系统报告
0 9 * * 1 /home/deploy/scripts/weekly-report.sh

# 查看定时任务
crontab -l
```

## 总结

掌握这些 Linux 运维基础知识后，你可以胜任大多数日常服务器管理工作：

- ✅ SSH 安全连接与配置
- ✅ 用户权限管理
- ✅ 防火墙规则配置
- ✅ Nginx 反向代理与 SSL
- ✅ 系统监控与日志分析
- ✅ 自动化部署与定时任务

---

> 📚 **推荐资源**：[Linux Command](https://linuxcommand.org/) | [Nginx 官方文档](https://nginx.org/en/docs/)
