---
title: Docker 容器化入门指南：从零开始掌握容器技术
date: 2026-02-18 14:00:00
updated: 2026-02-18 14:00:00
tags:
  - Docker
  - 容器化
  - DevOps
  - 微服务
categories:
  - DevOps
keywords: Docker, 容器化, Dockerfile, Docker Compose, 微服务
description: 全面介绍 Docker 容器化技术，从基本概念到实战部署，包含 Dockerfile 编写、Docker Compose 编排等核心内容。
cover: https://picsum.photos/seed/docker-guide/800/400
---

## 前言

Docker 已经成为现代开发中不可或缺的工具。本文将从零开始带你了解 Docker 的核心概念，并通过实战示例掌握容器化部署。

<!-- more -->

## 1. Docker 基本概念

### 镜像 (Image)

镜像是一个只读的模板，包含运行应用所需的所有文件和配置。

### 容器 (Container)

容器是镜像的运行实例，是真正运行应用的地方。

### 仓库 (Registry)

仓库用于存储和分发镜像，如 Docker Hub。

```text
镜像 (Image)    →    容器 (Container)
  只读模板              运行实例
     ↑                    ↑
  Dockerfile 构建      docker run 启动
```

## 2. 常用 Docker 命令

```bash
# 镜像操作
docker pull nginx:latest          # 拉取镜像
docker images                      # 列出本地镜像
docker rmi nginx:latest           # 删除镜像
docker build -t myapp:1.0 .       # 构建镜像

# 容器操作
docker run -d -p 8080:80 nginx    # 后台运行容器
docker ps                          # 查看运行中的容器
docker ps -a                       # 查看所有容器
docker stop <container_id>         # 停止容器
docker rm <container_id>           # 删除容器

# 进入容器
docker exec -it <container_id> /bin/bash

# 查看日志
docker logs -f <container_id>
```

## 3. Dockerfile 编写

### 3.1 Node.js 应用示例

```dockerfile
# 使用 Node.js 官方镜像作为基础镜像
FROM node:20-alpine AS builder

# 设置工作目录
WORKDIR /app

# 复制依赖文件并安装 (利用缓存)
COPY package*.json ./
RUN npm ci --only=production

# 复制源代码
COPY . .

# 构建应用
RUN npm run build

# --- 多阶段构建：生产镜像 ---
FROM node:20-alpine

WORKDIR /app

# 从构建阶段复制产物
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./

# 暴露端口
EXPOSE 3000

# 设置非 root 用户
USER node

# 启动命令
CMD ["node", "dist/main.js"]
```

### 3.2 Dockerfile 最佳实践

| 实践 | 说明 |
| ------ | ------ |
| 多阶段构建 | 减小最终镜像体积 |
| .dockerignore | 排除不必要的文件 |
| 层缓存优化 | 将变化少的指令放前面 |
| 非 root 用户 | 提高安全性 |
| Alpine 基础镜像 | 使用更小的基础镜像 |

## 4. Docker Compose 编排

Docker Compose 用于管理多容器应用。

### 4.1 典型 Web 应用编排

```yaml
# docker-compose.yml
version: '3.8'

services:
  # Web 应用
  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      - NODE_ENV=production
      - DB_HOST=db
      - REDIS_HOST=redis
    depends_on:
      db:
        condition: service_healthy
      redis:
        condition: service_started
    restart: unless-stopped

  # 数据库
  db:
    image: postgres:16-alpine
    volumes:
      - postgres_data:/var/lib/postgresql/data
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: ${DB_PASSWORD}
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U admin"]
      interval: 5s
      timeout: 5s
      retries: 5

  # 缓存
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
    command: redis-server --appendonly yes

  # Nginx 反向代理
  nginx:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./nginx.conf:/etc/nginx/nginx.conf:ro
    depends_on:
      - app

volumes:
  postgres_data:
  redis_data:
```

### 4.2 常用 Compose 命令

```bash
# 启动所有服务
docker compose up -d

# 查看服务状态
docker compose ps

# 查看日志
docker compose logs -f app

# 停止所有服务
docker compose down

# 停止并删除数据卷
docker compose down -v

# 重新构建并启动
docker compose up -d --build
```

## 5. 生产环境注意事项

1. **不要在容器中存储数据** — 使用数据卷(Volumes)
2. **使用 .dockerignore** — 减小构建上下文
3. **固定镜像版本** — 避免使用 `latest` 标签
4. **资源限制** — 设置 CPU 和内存限制
5. **日志收集** — 使用集中式日志方案
6. **健康检查** — 配置 `healthcheck` 确保服务可用

```yaml
# 资源限制示例
services:
  app:
    deploy:
      resources:
        limits:
          cpus: '1.0'
          memory: 512M
        reservations:
          cpus: '0.5'
          memory: 256M
```

## 总结

Docker 极大地简化了应用的部署和管理。掌握 Dockerfile 编写和 Docker Compose 编排是每个开发者的必备技能。建议从简单的单容器应用开始练习，逐步过渡到多容器编排。

---

> 🔗 **参考资源**：[Docker 官方文档](https://docs.docker.com/) | [Docker Hub](https://hub.docker.com/)
