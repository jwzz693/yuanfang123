---
title: TypeScript 类型体操：10 个实用技巧提升代码质量
date: 2026-02-17 09:00:00
updated: 2026-02-17 09:00:00
tags:
  - TypeScript
  - 前端
  - 类型系统
categories:
  - 前端
keywords: TypeScript, 类型体操, 泛型, 工具类型, 类型推断
description: 分享 10 个 TypeScript 类型体操实用技巧，包括泛型、条件类型、映射类型等高级用法，帮助你写出更安全的代码。
cover: https://picsum.photos/seed/typescript/800/400
---

## 前言

TypeScript 的类型系统非常强大，灵活运用可以大幅提高代码质量和开发体验。本文分享 10 个实用的类型技巧。

<!-- more -->

## 技巧 1：善用 `const` 断言

```typescript
// ❌ 类型被推断为 string[]
const colors = ['red', 'green', 'blue']

// ✅ 类型被推断为 readonly ['red', 'green', 'blue']
const colors = ['red', 'green', 'blue'] as const

// 从常量数组提取联合类型
type Color = typeof colors[number] // 'red' | 'green' | 'blue'
```

## 技巧 2：条件类型的妙用

```typescript
// 根据输入类型返回不同类型
type ApiResponse<T> = T extends 'user'
  ? { id: number; name: string }
  : T extends 'post'
  ? { id: number; title: string; content: string }
  : never

// 使用
type UserResponse = ApiResponse<'user'>
// { id: number; name: string }

type PostResponse = ApiResponse<'post'>
// { id: number; title: string; content: string }
```

## 技巧 3：模板字面量类型

```typescript
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE'
type ApiVersion = 'v1' | 'v2'

// 自动生成所有组合
type ApiEndpoint = `/${ApiVersion}/${string}`
type MethodKey = `${Lowercase<HttpMethod>}_${string}`

// 事件处理器类型
type EventName = 'click' | 'focus' | 'blur'
type EventHandler = `on${Capitalize<EventName>}`
// 'onClick' | 'onFocus' | 'onBlur'
```

## 技巧 4：用 `infer` 提取类型

```typescript
// 提取函数返回值类型
type ReturnOf<T> = T extends (...args: any[]) => infer R ? R : never

// 提取 Promise 中的类型
type UnwrapPromise<T> = T extends Promise<infer U> ? U : T

// 提取数组元素类型
type ElementOf<T> = T extends (infer E)[] ? E : never

// 实际使用
type Result = UnwrapPromise<Promise<string>> // string
type Item = ElementOf<string[]> // string
```

## 技巧 5：映射类型进阶

```typescript
// 将所有属性变为可选且可为 null
type Nullable<T> = {
  [K in keyof T]: T[K] | null
}

// 只选取指定类型的属性
type PickByType<T, U> = {
  [K in keyof T as T[K] extends U ? K : never]: T[K]
}

interface User {
  id: number
  name: string
  email: string
  age: number
  isActive: boolean
}

// 只保留 string 类型的属性
type StringProps = PickByType<User, string>
// { name: string; email: string }
```

## 技巧 6：递归类型

```typescript
// 深度只读
type DeepReadonly<T> = {
  readonly [K in keyof T]: T[K] extends object
    ? DeepReadonly<T[K]>
    : T[K]
}

// 深度可选
type DeepPartial<T> = {
  [K in keyof T]?: T[K] extends object
    ? DeepPartial<T[K]>
    : T[K]
}

// JSON 类型
type JsonValue =
  | string
  | number
  | boolean
  | null
  | JsonValue[]
  | { [key: string]: JsonValue }
```

## 技巧 7：函数重载替代方案

```typescript
// 使用条件类型替代函数重载
function process<T extends string | number>(
  input: T
): T extends string ? string[] : number[] {
  if (typeof input === 'string') {
    return input.split('') as any
  }
  return [input * 2] as any
}

const a = process('hello') // string[]
const b = process(42)       // number[]
```

## 技巧 8：类型守卫

```typescript
// 自定义类型守卫
interface Cat { meow(): void }
interface Dog { bark(): void }

function isCat(animal: Cat | Dog): animal is Cat {
  return 'meow' in animal
}

// 使用 discriminated unions 更优雅
interface Success { type: 'success'; data: any }
interface Failure { type: 'failure'; error: string }
type Result = Success | Failure

function handleResult(result: Result) {
  switch (result.type) {
    case 'success':
      console.log(result.data)    // TypeScript 知道这里是 Success
      break
    case 'failure':
      console.log(result.error)   // TypeScript 知道这里是 Failure
      break
  }
}
```

## 技巧 9：实用工具类型组合

```typescript
// 必选部分属性
type RequireSome<T, K extends keyof T> = T & Required<Pick<T, K>>

// 可选部分属性
type PartialSome<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>

// 创建用户 - id 可选（由服务器生成）
interface User {
  id: string
  name: string
  email: string
}
type CreateUserInput = PartialSome<User, 'id'>
// { name: string; email: string; id?: string }

// 更新用户 - 必须有 id
type UpdateUserInput = RequireSome<Partial<User>, 'id'>
// { id: string; name?: string; email?: string }
```

## 技巧 10：类型安全的事件系统

```typescript
// 定义事件映射
interface EventMap {
  'user:login':  { userId: string; timestamp: number }
  'user:logout': { userId: string }
  'post:create': { postId: string; title: string }
  'post:delete': { postId: string }
}

// 类型安全的事件发射器
class TypedEventEmitter {
  private handlers = new Map<string, Function[]>()

  on<K extends keyof EventMap>(
    event: K,
    handler: (payload: EventMap[K]) => void
  ): void {
    const list = this.handlers.get(event) || []
    list.push(handler)
    this.handlers.set(event, list)
  }

  emit<K extends keyof EventMap>(
    event: K,
    payload: EventMap[K]
  ): void {
    const list = this.handlers.get(event) || []
    list.forEach(fn => fn(payload))
  }
}

// 使用 - 完全类型安全
const emitter = new TypedEventEmitter()

emitter.on('user:login', (data) => {
  console.log(data.userId)     // ✅ 自动推断类型
  console.log(data.timestamp)  // ✅
})

emitter.emit('post:create', {
  postId: '123',
  title: 'Hello'  // ✅ 类型安全，缺少字段会报错
})
```

## 总结

TypeScript 类型系统是图灵完备的，掌握这些技巧能让你写出更安全、可维护的代码。关键是要在复杂性和实用性之间找到平衡 —— 不要为了炫技而写过于复杂的类型。

---

> 📚 **推荐学习**：[Type Challenges](https://github.com/type-challenges/type-challenges) — 通过练习掌握 TypeScript 类型体操。
