# 🚀 远方技术站

> 基于 **Hexo + Butterfly** 主题的技术博客，每次 `git push` 自动部署到 GitHub Pages、Netlify、Vercel、Cloudflare Pages 四大免费托管平台。

## ✨ 特性

- 📝 **Markdown 写作** — 用 Markdown 编写技术文章，专注内容创作
- 🦋 **Butterfly 主题** — 美观的 Butterfly 主题，支持暗黑模式、目录导航、代码高亮
- 🔍 **本地搜索** — 内置全文搜索，快速找到文章
- 🚀 **四平台自动部署** — 推送代码即自动构建部署到四大免费平台
- 📊 **访客统计** — 内置 Busuanzi 访客统计
- 📱 **响应式** — 完美适配桌面端和移动端

## 📦 快速开始

### 1. 克隆项目

```bash
git clone https://github.com/jwzz693/yuanfang123.git
cd yuanfang123
npm install
```

### 2. 本地预览

```bash
npx hexo server
# 浏览器访问 http://localhost:4000
```

### 3. 新建文章

```bash
npx hexo new post "文章标题"
# 会在 source/_posts/ 下生成 Markdown 文件，编辑即可
```

### 4. 新建页面

```bash
npx hexo new page "页面名称"
```

### 5. 本地构建

```bash
npx hexo generate
# 或
npm run build
```

## ✍️ 写文章

在 `source/_posts/` 目录下创建 `.md` 文件，文件头部添加 Front Matter：

```yaml
---
title: 文章标题
date: 2026-02-19 10:00:00
tags:
  - 标签1
  - 标签2
categories:
  - 分类名称
description: 文章简介
cover: https://picsum.photos/seed/xxx/800/400  # 封面图
---

文章正文...

<!-- more -->  <!-- 首页摘要分隔线 -->

继续正文...
```

## 🚀 自动部署配置

### 部署流程

```
git push 到 main 分支
        ↓
  GitHub Actions 自动触发
        ↓
    npm ci → hexo generate
        ↓
  ┌─────┼─────┬──────────────┐
  ↓     ↓     ↓              ↓
GitHub  Netlify  Vercel  Cloudflare
Pages                    Pages
```

### 平台配置指南

#### 1️⃣ GitHub Pages（无需额外配置）

推送到 GitHub 后自动部署。需要在仓库 **Settings → Pages** 中将 Source 设置为 **GitHub Actions**。

#### 2️⃣ Netlify

1. 前往 [Netlify](https://app.netlify.com/) 注册登录
2. 创建一个新站点（或 Import from Git）
3. 获取 Auth Token：**User Settings → Applications → Personal access tokens → New access token**
4. 获取 Site ID：**Site Settings → General → Site ID**
5. 在 GitHub 仓库 **Settings → Secrets and variables → Actions** 中添加：
   - `NETLIFY_AUTH_TOKEN`
   - `NETLIFY_SITE_ID`

> 💡 也可以直接在 Netlify 关联 GitHub 仓库，它会自动检测 `netlify.toml` 配置并自动部署。

#### 3️⃣ Vercel

1. 前往 [Vercel](https://vercel.com/) 注册登录
2. Import 你的 GitHub 仓库
3. 获取 Token：**Settings → Tokens → Create**
4. 获取 Org ID 和 Project ID：项目 **Settings → General**
5. 在 GitHub 仓库 Secrets 中添加：
   - `VERCEL_TOKEN`
   - `VERCEL_ORG_ID`
   - `VERCEL_PROJECT_ID`

> 💡 也可以直接在 Vercel 关联 GitHub 仓库，它会自动检测构建并部署。

#### 4️⃣ Cloudflare Pages

1. 前往 [Cloudflare Dashboard](https://dash.cloudflare.com/) 注册登录
2. 进入 **Workers & Pages → Create → Pages → Connect to Git**
3. 获取 API Token：**My Profile → API Tokens → Create Token → Edit Cloudflare Workers**
4. 获取 Account ID：右侧栏可以看到
5. 在 GitHub 仓库 Secrets 中添加：
   - `CLOUDFLARE_API_TOKEN`
   - `CLOUDFLARE_ACCOUNT_ID`

> 💡 也可以直接在 Cloudflare Pages 关联 GitHub 仓库，设置构建命令 `npm run build`，输出目录 `public`。

## 📁 项目结构

```
.
├── .github/workflows/          # GitHub Actions 工作流
│   ├── deploy-github-pages.yml # 部署到 GitHub Pages
│   ├── deploy-netlify.yml      # 部署到 Netlify
│   ├── deploy-vercel.yml       # 部署到 Vercel
│   └── deploy-cloudflare.yml   # 部署到 Cloudflare Pages
├── scaffolds/                  # Hexo 模板
├── source/
│   ├── _posts/                 # 📝 文章目录（在这里写文章）
│   ├── about/                  # 关于页面
│   ├── categories/             # 分类页面
│   └── tags/                   # 标签页面
├── themes/                     # 主题目录
├── _config.yml                 # Hexo 主配置
├── _config.butterfly.yml       # Butterfly 主题配置
├── netlify.toml                # Netlify 配置
├── vercel.json                 # Vercel 配置
└── package.json
```

## 🎨 自定义

### 修改站点信息

编辑 `_config.yml`：
```yaml
title: 你的站点名称
subtitle: 副标题
description: 站点描述
author: 你的名字
```

### 修改主题配置

编辑 `_config.butterfly.yml`，可以自定义：
- 导航菜单、头像、社交链接
- 封面图、代码高亮风格
- 侧边栏卡片、页脚信息
- 暗黑模式、搜索功能等

详细配置参考 [Butterfly 官方文档](https://butterfly.js.org/)。

## 📜 常用命令

| 命令 | 说明 |
|------|------|
| `npx hexo new post "标题"` | 新建文章 |
| `npx hexo new page "名称"` | 新建页面 |
| `npx hexo server` | 本地预览 (localhost:4000) |
| `npx hexo generate` | 生成静态文件 |
| `npx hexo clean` | 清除缓存和生成文件 |
| `npx hexo deploy` | 手动部署 |

## 📄 License

- 博客框架：[MIT](LICENSE)
- 文章内容：[CC BY-NC-SA 4.0](https://creativecommons.org/licenses/by-nc-sa/4.0/)
