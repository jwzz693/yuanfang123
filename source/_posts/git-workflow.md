---
title: Git 工作流最佳实践：从入门到团队协作
date: 2026-02-19 10:00:00
updated: 2026-02-19 10:00:00
tags:
  - Git
  - DevOps
  - 团队协作
categories:
  - DevOps
keywords: Git, 工作流, Git Flow, GitHub Flow, 团队协作
description: 本文详细介绍 Git 工作流的最佳实践，包括 Git Flow、GitHub Flow、Trunk-Based 等策略，帮助团队高效协作。
cover: https://picsum.photos/seed/git-workflow/800/400
---

## 前言

在团队开发中，良好的 Git 工作流是保证代码质量和高效协作的关键。本文将介绍几种常见的 Git 工作流策略及其最佳实践。

<!-- more -->

## 1. 常见的 Git 工作流

### 1.1 Git Flow

Git Flow 是最经典的分支管理策略，由 Vincent Driessen 在 2010 年提出。

```bash
# 主要分支
main        # 生产环境代码
develop     # 开发分支

# 辅助分支
feature/*   # 功能分支
release/*   # 发布分支
hotfix/*    # 热修复分支
```

**适用场景：** 版本发布周期较长的项目（如桌面应用、移动 App）。

### 1.2 GitHub Flow

GitHub Flow 是一种更简洁的工作流，只有一个主分支 `main`。

```bash
# 流程
1. 从 main 创建功能分支
2. 提交代码并 Push
3. 创建 Pull Request
4. Code Review
5. 合并到 main
6. 自动部署
```

**适用场景：** 持续部署的 Web 应用。

### 1.3 Trunk-Based Development

所有开发者直接向 `main` 分支提交，搭配 Feature Flags。

```bash
# 关键实践
- 小批量提交 (Small Commits)
- Feature Flags 控制功能开关
- 自动化测试覆盖
- 持续集成
```

**适用场景：** 高频发布、DevOps 成熟的团队。

## 2. Git 提交规范

推荐使用 [Conventional Commits](https://www.conventionalcommits.org/) 规范：

```text
<type>(<scope>): <description>

[optional body]

[optional footer(s)]
```

常用 type：

| Type | 说明 |
| ------ | ------ |
| `feat` | 新功能 |
| `fix` | 修复 Bug |
| `docs` | 文档更新 |
| `style` | 代码格式 |
| `refactor` | 重构 |
| `perf` | 性能优化 |
| `test` | 测试 |
| `ci` | CI/CD 相关 |

## 3. 实用 Git 技巧

### 3.1 交互式变基

```bash
# 整理最近 3 次提交
git rebase -i HEAD~3

# 常用操作
pick   → 保留提交
squash → 合并到上一个提交
reword → 修改提交信息
drop   → 删除提交
```

### 3.2 Git Stash 暂存

```bash
# 暂存当前修改
git stash save "临时保存：正在开发的功能"

# 查看暂存列表
git stash list

# 恢复最近的暂存
git stash pop

# 恢复指定暂存
git stash apply stash@{2}
```

### 3.3 Git Bisect 二分查找

```bash
# 启动二分查找
git bisect start

# 标记当前版本有 Bug
git bisect bad

# 标记已知正常的版本
git bisect good v1.0.0

# Git 会自动切换到中间版本，测试后标记 good 或 bad
git bisect good  # 或 git bisect bad

# 找到问题提交后重置
git bisect reset
```

## 4. 团队协作建议

1. **保护主分支**：设置分支保护规则，禁止直接 Push
2. **Code Review**：所有代码必须通过 PR 审核
3. **自动化检查**：CI 中集成代码质量检查
4. **及时合并**：避免长期未合并的分支
5. **定期同步**：经常 rebase 主分支避免冲突

## 总结

选择合适的 Git 工作流取决于团队规模、发布频率和项目特点。对于大多数 Web 项目，推荐使用 **GitHub Flow** 配合 **Conventional Commits** 规范。

---

> 💡 **推荐工具**：[commitlint](https://commitlint.js.org/) + [husky](https://typicode.github.io/husky/) 可以自动化检查提交信息格式。
