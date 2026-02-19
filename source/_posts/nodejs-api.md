---
title: Node.js RESTful API 实战：Express + TypeScript + Prisma
date: 2026-02-18 10:00:00
updated: 2026-02-18 10:00:00
tags:
  - Node.js
  - TypeScript
  - Express
  - API
  - Prisma
categories:
  - Node.js
keywords: Node.js, RESTful API, Express, TypeScript, Prisma, 后端开发
description: 使用 Express + TypeScript + Prisma 从零搭建一个完整的 RESTful API 服务，包含认证、验证、错误处理等最佳实践。
cover: https://picsum.photos/seed/nodejs-api/800/400
---

## 前言

Node.js 凭借高性能和 JavaScript 全栈的优势，成为构建 RESTful API 的热门选择。本教程使用 Express + TypeScript + Prisma 打造一个生产级 API 服务。

<!-- more -->

## 1. 项目初始化

```bash
mkdir my-api && cd my-api
npm init -y

# 安装核心依赖
npm install express cors helmet morgan dotenv
npm install @prisma/client jsonwebtoken bcryptjs zod

# 安装开发依赖
npm install -D typescript ts-node-dev @types/node @types/express \
  @types/cors @types/morgan @types/jsonwebtoken @types/bcryptjs \
  prisma
```

### `tsconfig.json`

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "module": "commonjs",
    "lib": ["ES2022"],
    "outDir": "./dist",
    "rootDir": "./src",
    "strict": true,
    "esModuleInterop": true,
    "skipLibCheck": true,
    "resolveJsonModule": true,
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "baseUrl": ".",
    "paths": { "@/*": ["src/*"] }
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist"]
}
```

## 2. 项目结构

```text
src/
├── config/           # 配置
│   └── env.ts
├── middleware/        # 中间件
│   ├── auth.ts
│   ├── validate.ts
│   └── errorHandler.ts
├── modules/          # 业务模块
│   └── user/
│       ├── user.controller.ts
│       ├── user.service.ts
│       ├── user.routes.ts
│       └── user.schema.ts
├── prisma/           # 数据库
│   └── schema.prisma
├── utils/            # 工具函数
│   └── jwt.ts
├── app.ts            # Express 应用
└── server.ts         # 服务启动
```

## 3. Prisma 数据模型

### `prisma/schema.prisma`

```prisma
generator client {
  provider = "prisma-client-js"
}

datasource db {
  provider = "postgresql"
  url      = env("DATABASE_URL")
}

model User {
  id        String   @id @default(cuid())
  email     String   @unique
  name      String
  password  String
  role      Role     @default(USER)
  posts     Post[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("users")
}

model Post {
  id        String   @id @default(cuid())
  title     String
  content   String
  published Boolean  @default(false)
  author    User     @relation(fields: [authorId], references: [id])
  authorId  String
  tags      String[]
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@map("posts")
}

enum Role {
  USER
  ADMIN
}
```

## 4. Express 应用配置

### `src/app.ts`

```typescript
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import morgan from 'morgan'
import { errorHandler } from './middleware/errorHandler'
import { userRoutes } from './modules/user/user.routes'

const app = express()

// 中间件
app.use(helmet())
app.use(cors())
app.use(morgan('dev'))
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ extended: true }))

// 健康检查
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// 路由
app.use('/api/v1/users', userRoutes)

// 404 处理
app.use((req, res) => {
  res.status(404).json({ error: 'Route not found' })
})

// 全局错误处理
app.use(errorHandler)

export default app
```

## 5. Zod 请求验证

### `src/modules/user/user.schema.ts`

```typescript
import { z } from 'zod'

export const createUserSchema = z.object({
  body: z.object({
    name: z.string().min(2, '名称至少 2 个字符').max(50),
    email: z.string().email('邮箱格式不正确'),
    password: z.string().min(8, '密码至少 8 位')
      .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, '密码需包含大小写字母和数字')
  })
})

export const loginSchema = z.object({
  body: z.object({
    email: z.string().email(),
    password: z.string().min(1, '请输入密码')
  })
})

export const updateUserSchema = z.object({
  body: z.object({
    name: z.string().min(2).max(50).optional(),
    email: z.string().email().optional()
  }),
  params: z.object({
    id: z.string().cuid()
  })
})
```

## 6. JWT 认证中间件

### `src/middleware/auth.ts`

```typescript
import { Request, Response, NextFunction } from 'express'
import jwt from 'jsonwebtoken'

interface JwtPayload {
  userId: string
  role: string
}

declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload
    }
  }
}

export function authenticate(req: Request, res: Response, next: NextFunction) {
  const authHeader = req.headers.authorization
  if (!authHeader?.startsWith('Bearer ')) {
    return res.status(401).json({ error: '未提供认证令牌' })
  }

  const token = authHeader.split(' ')[1]
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JwtPayload
    req.user = decoded
    next()
  } catch {
    return res.status(401).json({ error: '令牌无效或已过期' })
  }
}

export function authorize(...roles: string[]) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (!req.user || !roles.includes(req.user.role)) {
      return res.status(403).json({ error: '权限不足' })
    }
    next()
  }
}
```

## 7. 全局错误处理

### `src/middleware/errorHandler.ts`

```typescript
import { Request, Response, NextFunction } from 'express'

class AppError extends Error {
  constructor(
    public statusCode: number,
    public message: string,
    public isOperational = true
  ) {
    super(message)
    Object.setPrototypeOf(this, AppError.prototype)
  }
}

function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  if (err instanceof AppError) {
    return res.status(err.statusCode).json({
      error: err.message
    })
  }

  // 未预期的错误
  console.error('Unexpected error:', err)
  res.status(500).json({
    error: process.env.NODE_ENV === 'production'
      ? '服务器内部错误'
      : err.message
  })
}

export { AppError, errorHandler }
```

## 8. 启动脚本

### `package.json` 脚本

```json
{
  "scripts": {
    "dev": "ts-node-dev --respawn --transpile-only src/server.ts",
    "build": "tsc",
    "start": "node dist/server.js",
    "db:migrate": "prisma migrate dev",
    "db:seed": "ts-node prisma/seed.ts",
    "db:studio": "prisma studio"
  }
}
```

## 总结

通过本教程，你已经学会了如何构建一个完整的 RESTful API，包含：

- ✅ TypeScript 类型安全
- ✅ Prisma ORM 数据库操作
- ✅ JWT 认证与授权
- ✅ Zod 请求验证
- ✅ 统一错误处理
- ✅ 模块化项目结构

---

> 🔗 **进阶学习**：[Prisma 文档](https://www.prisma.io/docs) | [Express 最佳实践](https://expressjs.com/en/advanced/best-practice-security.html)
