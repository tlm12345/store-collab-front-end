# Store Collab 项目结构分析

## 项目概述

项目名称: `store-collab`
项目类型: Vue 3 + TypeScript + Vite 单页应用
Node.js 版本要求: ^20.19.0 || >=22.12.0

## 技术栈

### 核心依赖
- **Vue 3.5.29**: 渐进式 JavaScript 框架
- **Vue Router 5.0.3**: 官方路由管理器
- **Pinia 3.0.4**: 状态管理库
- **TypeScript 5.9.3**: JavaScript 的超集，提供类型安全

### 构建工具
- **Vite 7.3.1**: 新一代前端构建工具
- **@vitejs/plugin-vue 6.0.4**: Vite 的 Vue 插件
- **vite-plugin-vue-devtools 8.0.6**: Vue DevTools 开发工具

### 代码质量工具
- **ESLint 10.0.2**: JavaScript/TypeScript 代码检查
- **Oxlint 1.50.0**: 快速的 ESLint 包装器
- **Prettier 3.8.1**: 代码格式化工具
- **vue-tsc 3.2.5**: Vue TypeScript 类型检查器

### 测试工具
- **Vitest 4.0.18**: 单元测试框架
- **@vue/test-utils 2.4.6**: Vue 组件测试工具
- **jsdom 28.1.0**: Node.js 的 DOM 实现

## 项目目录结构

```
store-collab/
├── src/                          # 源代码目录
│   ├── assets/                   # 静态资源
│   │   ├── base.css             # 基础样式（颜色变量、全局样式）
│   │   ├── main.css             # 主样式文件
│   │   └── logo.svg             # Vue Logo
│   ├── components/              # 组件目录
│   │   ├── __tests__/           # 组件测试
│   │   │   └── HelloWorld.spec.ts
│   │   ├── icons/               # 图标组件
│   │   │   ├── IconCommunity.vue
│   │   │   ├── IconDocumentation.vue
│   │   │   ├── IconEcosystem.vue
│   │   │   ├── IconSupport.vue
│   │   │   └── IconTooling.vue
│   │   ├── HelloWorld.vue       # 示例组件
│   │   ├── TheWelcome.vue       # 欢迎页组件
│   │   └── WelcomeItem.vue      # 欢迎页子组件
│   ├── router/                  # 路由配置
│   │   └── index.ts             # 路由定义
│   ├── stores/                  # Pinia 状态管理
│   │   ├── counter.ts           # 计数器示例 Store
│   │   └── user.ts              # 用户状态管理 Store（登录、注册）
│   ├── views/                   # 页面组件
│   │   ├── AboutView.vue        # 关于页面
│   │   ├── HomeView.vue         # 首页
│   │   ├── LoginView.vue        # 登录页面
│   │   └── RegisterView.vue     # 注册页面
│   ├── App.vue                  # 根组件
│   └── main.ts                  # 应用入口
├── public/                      # 公共静态资源
├── env.d.ts                     # 环境变量类型定义
├── eslint.config.ts             # ESLint 配置
├── index.html                   # HTML 入口文件
├── package.json                 # 项目配置和依赖
├── tsconfig.json                # TypeScript 配置（主配置）
├── tsconfig.app.json            # 应用代码 TypeScript 配置
├── tsconfig.node.json           # Node 环境代码 TypeScript 配置
├── tsconfig.vitest.json         # Vitest 测试 TypeScript 配置
├── vite.config.ts               # Vite 配置
└── vitest.config.ts             # Vitest 配置
```

## 核心文件说明

### 1. 入口文件 - `src/main.ts`
应用的启动入口，负责：
- 引入全局样式
- 创建 Vue 应用实例
- 集成 Pinia 状态管理
- 集成 Vue Router 路由
- 挂载应用到 DOM

### 2. 根组件 - `src/App.vue`
应用的根组件，包含：
- 头部导航区域
- Logo 展示
- 路由导航链接（RouterLink）
- 路由视图出口（RouterView）
- 响应式布局样式

### 3. 路由配置 - `src/router/index.ts`
定义应用的路由规则：
- 使用 HTML5 History 模式
- 路径别名配置（@ 指向 src）
- 支持路由懒加载，优化性能

### 4. 状态管理

#### 用户状态管理 - `src/stores/user.ts`
用户认证相关的状态管理：
- 用户登录、注册、退出登录
- 用户信息存储和管理
- 使用 TypeScript 定义用户接口

#### 计数器示例 - `src/stores/counter.ts`
示例 Store，展示 Pinia 的使用：
- 使用 Composition API 风格
- 定义响应式状态（ref）
- 定义计算属性（computed）
- 定义修改状态的方法

## 开发规范

### 1. 命名规范

#### 文件命名
- **组件文件**: 使用 PascalCase，如 `HelloWorld.vue`、`WelcomeItem.vue`
- **工具/配置文件**: 使用 kebab-case 或 camelCase，如 `index.ts`、`counter.ts`
- **样式文件**: 使用 kebab-case，如 `main.css`、`base.css`
- **测试文件**: 组件名 + `.spec.ts` 或 `.test.ts`，如 `HelloWorld.spec.ts`

#### 变量命名
- **组件名**: PascalCase，如 `HelloWorld`、`TheWelcome`
- **函数/方法**: camelCase，如 `increment`、`openReadmeInEditor`
- **常量**: UPPER_SNAKE_CASE 或 camelCase
- **类型/接口**: PascalCase

#### 样式命名
- **CSS 类名**: kebab-case，如 `router-link-exact-active`
- **CSS 变量**: kebab-case，如 `--color-background`

### 2. 组件开发规范

#### 组件结构
```vue
<script setup lang="ts">
// 1. 导入语句
import { ref, computed } from 'vue'
import ComponentName from './ComponentName.vue'

// 2. Props 定义（使用 TypeScript 类型）
defineProps<{
  msg: string
}>()

// 3. 事件定义
const emit = defineEmits<{
  update: [value: string]
}>()

// 4. 响应式状态
const count = ref(0)

// 5. 计算属性
const doubleCount = computed(() => count.value * 2)

// 6. 方法
function increment() {
  count.value++
}

// 7. 生命周期钩子（如果需要）
onMounted(() => {
  // 组件挂载后的逻辑
})
</script>

<template>
  <!-- 模板内容 -->
</template>

<style scoped>
/* 组件样式 */
</style>
```

#### 组件规范要点
- **优先使用 `<script setup>` 语法**：更简洁、性能更好
- **所有组件必须使用 TypeScript**：添加 `lang="ts"` 属性
- **使用 `defineProps` 和 `defineEmits`**：编译器宏，无需显式导入
- **Props 必须定义类型**：使用 TypeScript 类型定义
- **样式使用 `scoped`**：避免样式污染
- **组件单文件**：每个组件一个文件

### 3. 路由开发规范

#### 路由定义结构
```typescript
import { createRouter, createWebHistory } from 'vue-router'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: () => import('../views/HomeView.vue')
    }
  ]
})

export default router
```

#### 路由规范要点
- **使用命名路由**：每个路由定义 `name` 属性
- **路由懒加载**：使用动态 `import()`，实现代码分割
- **路径使用 kebab-case**：如 `/user-profile`
- **路由名使用 PascalCase**：如 `UserProfile`

### 4. 状态管理规范（Pinia）

#### Store 定义结构
```typescript
import { ref, computed } from 'vue'
import { defineStore } from 'pinia'

export const useCounterStore = defineStore('counter', () => {
  // 状态
  const count = ref(0)

  // 计算属性
  const doubleCount = computed(() => count.value * 2)

  // 方法
  function increment() {
    count.value++
  }

  return { count, doubleCount, increment }
})
```

#### Store 规范要点
- **使用 Composition API 风格**：函数式定义，更灵活
- **Store 函数名使用 `use` 前缀**：如 `useCounterStore`
- **Store ID 使用 kebab-case**：如 `'counter'`、`'user-store'`
- **返回对象明确导出**：清晰的状态、计算属性、方法
- **状态使用 `ref`**：支持 TypeScript 类型推断

### 5. TypeScript 使用规范

#### 类型定义规范
- **优先使用 TypeScript 内置类型**：避免 `any`
- **为组件 Props 定义类型**：使用接口或类型别名
- **使用 `interface` 定义对象结构**：支持扩展
- **使用 `type` 定义联合类型、元组**：更灵活
- **导出公共类型**：便于复用

#### 类型示例
```typescript
// 接口定义
interface UserInfo {
  id: number
  name: string
  email: string
}

// 类型定义
type Status = 'idle' | 'loading' | 'success' | 'error'

// 联合类型
type UserRole = 'admin' | 'user' | 'guest'

// 泛型
function fetchData<T>(url: string): Promise<T> {
  return fetch(url).then(res => res.json())
}
```

### 6. 样式开发规范

#### 样式组织
- **全局样式**: `src/assets/base.css`（变量、基础样式）
- **主样式**: `src/assets/main.css`（应用级样式）
- **组件样式**: 使用 `<style scoped>`，组件内部样式

#### CSS 变量规范
```css
:root {
  /* 语义化变量命名 */
  --color-background: #ffffff;
  --color-text: #181818;
  --color-border: #e2e2e2;

  /* 间距变量 */
  --spacing-xs: 4px;
  --spacing-sm: 8px;
  --spacing-md: 16px;
  --spacing-lg: 24px;
  --spacing-xl: 32px;

  /* 字体变量 */
  --font-size-sm: 12px;
  --font-size-base: 14px;
  --font-size-lg: 16px;
}
```

#### 样式规范要点
- **优先使用 CSS 变量**：便于主题切换和维护
- **使用响应式设计**：媒体查询适配不同屏幕
- **避免深层次嵌套**：最多 3 层
- **使用 BEM 命名规范（可选）**：如 `.block__element--modifier`

### 7. 代码格式化规范

#### Prettier 配置（项目级）
```json
{
  "semi": false,
  "singleQuote": true,
  "tabWidth": 2,
  "trailingComma": "es5",
  "printWidth": 100
}
```

#### 格式化规范要点
- **运行 `npm run format`**：格式化代码
- **运行 `npm run lint`**：检查并修复代码问题
- **提交前自动格式化**：建议使用 Git Hook

### 8. 测试规范

#### 测试文件结构
```typescript
import { describe, it, expect } from 'vitest'
import { mount } from '@vue/test-utils'
import ComponentName from '../ComponentName.vue'

describe('ComponentName', () => {
  it('renders properly', () => {
    const wrapper = mount(ComponentName, { props: { msg: 'Hello' } })
    expect(wrapper.text()).toContain('Hello')
  })
})
```

#### 测试规范要点
- **测试文件放在 `__tests__` 目录**：与组件同级
- **测试命名清晰**：描述性命名，如 `renders properly`
- **使用 `describe` 分组**：相关测试放在一起
- **断言明确**：使用 `expect` 清晰表达测试意图

### 9. Git 提交规范

#### 提交信息格式
```
<type>(<scope>): <subject>

<body>

<footer>
```

#### 提交类型（type）
- `feat`: 新功能
- `fix`: 修复 Bug
- `docs`: 文档更新
- `style`: 代码格式（不影响功能）
- `refactor`: 重构
- `test`: 测试相关
- `chore`: 构建/工具相关

#### 提交示例
```
feat(router): add lazy loading for about page

- Implement dynamic import for AboutView
- Update route configuration to support code splitting
```

### 10. 性能优化规范

#### 路由懒加载
```typescript
// ✅ 推荐：懒加载
component: () => import('../views/HomeView.vue')

// ❌ 不推荐：同步导入
component: HomeView
```

#### 组件异步加载
```typescript
// 使用 defineAsyncComponent
import { defineAsyncComponent } from 'vue'

const HeavyComponent = defineAsyncComponent(() =>
  import('./HeavyComponent.vue')
)
```

#### 图片优化
- **使用适当格式**：WebP、AVIF
- **压缩图片**：使用工具压缩
- **懒加载**：大图懒加载

### 11. 安全规范

#### XSS 防护
- **Vue 自动转义**：插值 `{{ }}` 自动转义
- **避免 `v-html`**：除非必要且内容可信
- **使用 DOMPurify**：处理用户输入的 HTML

#### 依赖安全
- **定期更新依赖**：`npm audit fix`
- **使用 `npm audit`**：检查安全漏洞

### 12. 环境变量规范

#### 环境变量文件
- `.env`: 所有环境
- `.env.local`: 本地环境（不提交到 Git）
- `.env.development`: 开发环境
- `.env.production`: 生产环境

#### 使用方式
```typescript
// 访问环境变量
const apiUrl = import.meta.env.VITE_API_URL
```

#### 环境变量命名
- **使用 `VITE_` 前缀**：Vite 要求
- **使用大写下划线**：如 `VITE_API_BASE_URL`

### 13. 注释规范

#### 文件头注释
```typescript
/**
 * 组件描述
 * @author 作者名
 * @date 创建日期
 */
```

#### 函数注释
```typescript
/**
 * 计算两个数的和
 * @param a - 第一个数
 * @param b - 第二个数
 * @returns 两数之和
 */
function add(a: number, b: number): number {
  return a + b
}
```

#### 复杂逻辑注释
```typescript
// 检查用户是否有权限访问该资源
// 权限规则：admin 可以访问所有资源，user 只能访问自己的资源
if (user.role === 'admin' || user.id === resource.ownerId) {
  // 有权限
  grantAccess()
}
```

### 14. 错误处理规范

#### 组件错误边界
```vue
<template>
  <ErrorBoundary>
    <Component />
  </ErrorBoundary>
</template>
```

#### 异步错误处理
```typescript
async function fetchData() {
  try {
    const response = await fetch('/api/data')
    const data = await response.json()
    return data
  } catch (error) {
    console.error('Failed to fetch data:', error)
    // 显示错误提示
    showErrorToast('加载数据失败')
  }
}
```

## 常用命令

### 开发
```bash
npm run dev          # 启动开发服务器
npm run build        # 构建生产版本
npm run preview      # 预览生产构建
```

### 代码质量
```bash
npm run lint         # 运行 ESLint 检查并修复
npm run format       # 格式化代码
npm run type-check   # TypeScript 类型检查
```

### 测试
```bash
npm run test:unit    # 运行单元测试
```

## 项目特点

1. **现代化技术栈**: 使用最新的 Vue 3、Vite、TypeScript
2. **类型安全**: 全面的 TypeScript 支持
3. **代码质量**: ESLint + Prettier + Oxlint 三重保障
4. **测试覆盖**: Vitest + Vue Test Utils
5. **开发体验**: Vue DevTools 集成、热更新
6. **性能优化**: 路由懒加载、代码分割
7. **响应式设计**: 支持深色模式、移动端适配
8. **模块化架构**: 清晰的目录结构和职责分离

## 用户系统说明

### 核心概念

项目实现了完整的用户注册和登录功能，采用以下核心概念：

1. **账户**
   - 用户用于登录的唯一标识（如：用户名、邮箱、手机号等）
   - 后台系统使用的唯一标识
   - 用于身份验证和登录
   - 示例：`user@example.com`、`john123`

2. **显示名称**
   - 用户在界面中展示的名称
   - 用于其他用户称呼和识别
   - 可以随时修改，不影响账户登录
   - 示例：`张三`、`李四`、`John Doe`

### 数据结构

#### User 接口
```typescript
interface User {
  id: string          // 用户唯一标识符
  account: string     // 登录账户
  displayName: string // 显示名称（昵称）
  avatar?: string     // 用户头像 URL（可选）
  bio?: string        // 个人简介（可选）
}
```

### 功能模块

#### 1. 用户注册 (`/register`)
- 输入账户（至少3个字符）
- 输入显示名称（昵称）
- 设置密码（至少6个字符）
- 确认密码
- 上传头像（可选，支持图片预览）
- 填写个人简介（可选，最多200字）
- 账户唯一性验证

#### 2. 用户登录 (`/login`)
- 输入账户
- 输入密码
- 表单验证
- 错误提示

#### 3. 用户信息展示
- 首页显示当前登录用户信息
- 导航栏显示用户显示名称
- 支持退出登录

#### 4. 状态管理
使用 Pinia 进行用户状态管理：
- `useUserStore`: 用户 Store
- `user`: 当前登录用户
- `users`: 已注册用户列表
- `isLoggedIn`: 登录状态
- `login()`: 登录方法
- `logout()`: 退出登录方法
- `register()`: 注册方法

### 注意事项

1. **Node.js 版本**: 确保使用 ^20.19.0 或 >=22.12.0
2. **路径别名**: 使用 `@` 别名引用 src 目录，如 `@/components/HelloWorld.vue`
3. **样式作用域**: 组件样式默认使用 `scoped`，避免全局污染
4. **Git 忽略**: `.eslintcache`、`dist` 等已加入忽略列表
5. **类型检查**: 构建前会自动运行类型检查

## 总结

本项目是一个标准的 Vue 3 + TypeScript + Vite 现代化前端项目，具有清晰的代码结构、完善的开发工具链和严格的代码规范。在后续开发中，应严格遵循上述规范，确保代码质量和项目的可维护性。
