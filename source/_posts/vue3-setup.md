---
title: 从零搭建 Vue3 + TypeScript + Vite 项目全教程
date: 2026-02-19 08:00:00
updated: 2026-02-19 08:00:00
tags:
  - Vue3
  - TypeScript
  - Vite
  - 前端
categories:
  - Vue3
keywords: Vue3, TypeScript, Vite, Pinia, Vue Router, 项目搭建
description: 手把手教你从零搭建一个完整的 Vue3 + TypeScript + Vite 项目，包含路由、状态管理、Axios 封装、代码规范等完整配置。
cover: https://picsum.photos/seed/vue3-tutorial/800/400
---

## 前言

Vue3 配合 TypeScript 和 Vite 已经成为现代前端开发的主流选择。本教程将手把手带你搭建一个完整的企业级项目模板。

<!-- more -->

## 1. 初始化项目

```bash
# 使用 Vite 创建项目
npm create vite@latest my-vue3-app -- --template vue-ts

# 进入目录并安装依赖
cd my-vue3-app
npm install
```

## 2. 安装核心依赖

```bash
# 路由
npm install vue-router@4

# 状态管理
npm install pinia

# HTTP 请求
npm install axios

# UI 组件库 (可选 Element Plus 或 Ant Design Vue)
npm install element-plus

# 图标
npm install @element-plus/icons-vue
```

## 3. 项目目录结构

```text
src/
├── api/              # API 接口
│   ├── index.ts
│   └── modules/
│       └── user.ts
├── assets/           # 静态资源
├── components/       # 公共组件
│   └── Layout/
├── composables/      # 组合式函数
│   └── useAuth.ts
├── router/           # 路由配置
│   └── index.ts
├── stores/           # Pinia 状态管理
│   └── user.ts
├── styles/           # 全局样式
│   └── index.css
├── types/            # 类型定义
│   └── index.ts
├── utils/            # 工具函数
│   └── request.ts
├── views/            # 页面组件
│   ├── Home.vue
│   └── Login.vue
├── App.vue
└── main.ts
```

## 4. 配置路由

### `src/router/index.ts`

```typescript
import { createRouter, createWebHistory, RouteRecordRaw } from 'vue-router'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/Home.vue'),
    meta: { title: '首页', requiresAuth: false }
  },
  {
    path: '/login',
    name: 'Login',
    component: () => import('@/views/Login.vue'),
    meta: { title: '登录', requiresAuth: false }
  },
  {
    path: '/dashboard',
    name: 'Dashboard',
    component: () => import('@/views/Dashboard.vue'),
    meta: { title: '控制台', requiresAuth: true }
  },
  {
    path: '/:pathMatch(.*)*',
    name: 'NotFound',
    component: () => import('@/views/NotFound.vue')
  }
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 })
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 设置页面标题
  document.title = `${to.meta.title || ''} - My App`

  // 需要登录验证的页面
  if (to.meta.requiresAuth) {
    const token = localStorage.getItem('token')
    if (!token) {
      next({ name: 'Login', query: { redirect: to.fullPath } })
      return
    }
  }
  next()
})

export default router
```

## 5. 配置 Pinia 状态管理

### `src/stores/user.ts`

```typescript
import { defineStore } from 'pinia'
import { ref, computed } from 'vue'

interface UserInfo {
  id: string
  name: string
  email: string
  avatar: string
}

export const useUserStore = defineStore('user', () => {
  // State
  const token = ref(localStorage.getItem('token') || '')
  const userInfo = ref<UserInfo | null>(null)

  // Getters
  const isLoggedIn = computed(() => !!token.value)
  const userName = computed(() => userInfo.value?.name || '游客')

  // Actions
  async function login(username: string, password: string) {
    try {
      // const res = await api.login({ username, password })
      // 模拟登录
      const mockToken = 'mock-jwt-token-' + Date.now()
      token.value = mockToken
      localStorage.setItem('token', mockToken)

      userInfo.value = {
        id: '1',
        name: username,
        email: `${username}@example.com`,
        avatar: ''
      }
    } catch (error) {
      throw new Error('登录失败')
    }
  }

  function logout() {
    token.value = ''
    userInfo.value = null
    localStorage.removeItem('token')
  }

  return {
    token, userInfo, isLoggedIn, userName,
    login, logout
  }
})
```

## 6. Axios 请求封装

### `src/utils/request.ts`

```typescript
import axios, { AxiosInstance, AxiosRequestConfig, AxiosResponse } from 'axios'

// 统一响应类型
interface ApiResponse<T = any> {
  code: number
  data: T
  message: string
}

// 创建实例
const service: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '/api',
  timeout: 15000,
  headers: { 'Content-Type': 'application/json' }
})

// 请求拦截器
service.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token')
    if (token) {
      config.headers.Authorization = `Bearer ${token}`
    }
    return config
  },
  (error) => Promise.reject(error)
)

// 响应拦截器
service.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    const { code, data, message } = response.data
    if (code === 200) {
      return data as any
    }
    // 业务错误
    console.error(`API Error: ${message}`)
    return Promise.reject(new Error(message))
  },
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      window.location.href = '/login'
    }
    return Promise.reject(error)
  }
)

// 导出封装后的方法
export const http = {
  get<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.get(url, config)
  },
  post<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return service.post(url, data, config)
  },
  put<T>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> {
    return service.put(url, data, config)
  },
  delete<T>(url: string, config?: AxiosRequestConfig): Promise<T> {
    return service.delete(url, config)
  }
}

export default service
```

## 7. 配置 `vite.config.ts`

```typescript
import { defineConfig } from 'vite'
import vue from '@vitejs/plugin-vue'
import { resolve } from 'path'

export default defineConfig({
  plugins: [vue()],
  resolve: {
    alias: {
      '@': resolve(__dirname, 'src')
    }
  },
  server: {
    port: 3000,
    proxy: {
      '/api': {
        target: 'http://localhost:8080',
        changeOrigin: true,
        rewrite: (path) => path.replace(/^\/api/, '')
      }
    }
  },
  build: {
    rollupOptions: {
      output: {
        chunkFileNames: 'js/[name]-[hash].js',
        entryFileNames: 'js/[name]-[hash].js',
        assetFileNames: '[ext]/[name]-[hash].[ext]'
      }
    }
  }
})
```

## 8. 配置 ESLint + Prettier

```bash
# 安装依赖
npm install -D eslint @typescript-eslint/eslint-plugin \
  @typescript-eslint/parser eslint-plugin-vue prettier \
  eslint-config-prettier eslint-plugin-prettier
```

### `.eslintrc.cjs`

```javascript
module.exports = {
  root: true,
  env: { browser: true, node: true, es2021: true },
  extends: [
    'eslint:recommended',
    'plugin:vue/vue3-recommended',
    'plugin:@typescript-eslint/recommended',
    'prettier'
  ],
  parser: 'vue-eslint-parser',
  parserOptions: {
    parser: '@typescript-eslint/parser',
    ecmaVersion: 'latest',
    sourceType: 'module'
  },
  rules: {
    'vue/multi-word-component-names': 'off',
    '@typescript-eslint/no-explicit-any': 'warn'
  }
}
```

## 总结

现在你已经拥有了一个完整的 Vue3 + TypeScript 开发模板，包含：

- ✅ Vite 构建工具
- ✅ Vue Router 路由管理
- ✅ Pinia 状态管理
- ✅ Axios 请求封装
- ✅ ESLint + Prettier 代码规范
- ✅ TypeScript 类型安全

你可以在此基础上快速开发业务功能。

---

> 🚀 **下一步**：学习 [Vue3 组合式 API](https://vuejs.org/guide/extras/composition-api-faq.html) 深入理解 Composition API 的设计理念。
