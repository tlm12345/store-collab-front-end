# 前后端 API 集成说明

## 概述

本项目已完成前后端 API 集成，实现了真正的用户认证功能。按照企业级开发规范，提供了完善的配置管理和错误处理机制。

## 认证方式说明

本项目后端使用 **Session 认证**，不使用 JWT Token。

### Session 认证特点

- **无 Token**: 不需要在请求头中手动添加 Token
- **Cookie 自动管理**: 浏览器自动携带 Session Cookie
- **服务器端管理**: Session 由后端服务器管理
- **自动过期**: Session 超时后自动失效

### 与 JWT Token 的区别

| 特性 | Session 认证 | JWT Token |
|------|--------------|-----------|
| 存储位置 | 服务器端 | 客户端 |
| 传输方式 | Cookie | 请求头 |
| 管理方式 | 后端管理 | 前端管理 |
| 过期处理 | 服务器自动过期 | 前端手动管理 |
| 安全性 | 相对较高 | 需要额外防护 |

## 架构设计

### 目录结构

```
src/
├── config/
│   └── api.ts              # API 配置文件
├── types/
│   └── api.ts              # API 类型定义
├── utils/
│   └── http.ts             # HTTP 请求工具类
├── api/
│   └── auth.ts             # 用户认证 API
└── stores/
    └── user.ts             # 用户状态管理（已集成 API）
```

### 分层架构

```
┌─────────────────────────────────────┐
│         View Layer (视图层)          │
│    LoginView.vue, RegisterView.vue │
└──────────────┬──────────────────────┘
               │ 调用
┌──────────────▼──────────────────────┐
│      Store Layer (状态管理层)       │
│         useUserStore                │
└──────────────┬──────────────────────┘
               │ 调用
┌──────────────▼──────────────────────┐
│      API Layer (API 层)             │
│    loginUser(), registerUser()      │
└──────────────┬──────────────────────┘
               │ 调用
┌──────────────▼──────────────────────┐
│    HTTP Utils Layer (HTTP 工具层)   │
│    request(), post(), get()         │
└──────────────┬──────────────────────┘
               │ 调用
┌──────────────▼──────────────────────┐
│      Config Layer (配置层)          │
│    API_BASE_URL, API_ENDPOINTS     │
└──────────────┬──────────────────────┘
               │ 发送请求
┌──────────────▼──────────────────────┐
│      Backend Server (后端服务器)    │
│    http://localhost:8080/api        │
└─────────────────────────────────────┘
```

---

## 配置管理

### 环境变量配置

#### 开发环境 (`.env.development`)
```bash
# API 基础地址
VITE_API_BASE_URL=http://localhost:8080/api
```

#### 生产环境 (`.env.production`)
```bash
# API 基础地址
# 部署到服务器时，修改为实际的生产环境地址
VITE_API_BASE_URL=https://your-domain.com/api
```

### 配置说明

- **VITE_API_BASE_URL**: API 基础地址，根据不同环境自动切换
- **使用 `VITE_` 前缀**: Vite 要求环境变量使用 `VITE_` 前缀才能在客户端代码中访问
- **环境隔离**: 开发和生产环境使用不同的配置，避免混淆

---

## API 配置文件

### `src/config/api.ts`

```typescript
// API 基础地址
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

// API 请求超时时间（毫秒）
export const API_TIMEOUT = 10000

// API 端点路径
export const API_ENDPOINTS = {
  AUTH: {
    REGISTER: '/user/register',
    LOGIN: '/user/login'
  }
} as const
```

### 配置特点

1. **集中管理**: 所有 API 相关配置集中在一个文件中
2. **环境隔离**: 自动根据环境变量切换配置
3. **易于维护**: 修改 API 地址或端点只需修改一个文件
4. **类型安全**: 使用 TypeScript 类型检查

---

## 类型定义

### `src/types/api.ts`

#### 通用响应结构
```typescript
export interface ApiResponse<T = any> {
  code: number        // 响应状态码 (0 表示成功)
  data: T | null     // 响应数据
  message: string    // 响应消息 (简要提示)
  description: string // 响应描述 (详细信息)
}
```

**字段说明**：

| 字段 | 类型 | 说明 | 示例 |
|------|------|------|------|
| `code` | `number` | 响应状态码 | `0` (成功), `40000` (参数错误), `50000` (服务器错误) |
| `data` | `T \| null` | 响应数据 | 成功时包含具体数据，失败时为 `null` |
| `message` | `string` | 响应消息 | 简要的提示信息，如 `"请求参数错误"`, `"操作成功"` |
| `description` | `string` | 响应描述 | 详细的错误或成功信息，如 `"用户不存在"`, `"密码错误"` |

**错误响应示例**：

```json
{
  "code": 40000,
  "data": null,
  "message": "请求参数错误",
  "description": "用户不存在"
}
```

**成功响应示例**：

```json
{
  "code": 0,
  "data": {
    "user": { ... }
  },
  "message": "操作成功",
  "description": "用户信息获取成功"
}
```

**前端错误处理**：

前端在处理错误时，会优先使用 `description` 字段（如果存在），然后回退到 `message` 字段。这样可以显示更详细的错误信息，帮助用户和开发者快速定位问题。

```typescript
// 优先使用 description，其次使用 message
const errorMessage = result.description || result.message || '操作失败'
```

#### 用户注册请求
```typescript
export interface UserRegisterRequest {
  userAccount: string      // 用户账号
  userPassword: string     // 用户密码
  confirmPassword: string  // 用户确认密码
}
```

#### 用户登录请求
```typescript
export interface UserLoginRequest {
  userAccount: string      // 用户账号
  userPassword: string     // 用户密码
}
```

#### 登录用户信息（LoginUserVO）
```typescript
/**
 * 登录用户信息 VO（View Object）
 * 对应后端 LoginUserVO 类
 */
export interface LoginUserVO {
  id: string              // 用户 ID（后端 Long 类型）
  userName: string        // 用户名（昵称/显示名称）
  userRole: string        // 用户角色
  userProfile: string     // 用户简介（个人简介）
  userAccount: string     // 账号（登录时使用的唯一标识）
  userAvatar: string      // 用户头像 URL
}
```

**字段映射说明**：

| 后端字段 | 前端字段 | 说明 |
|---------|---------|------|
| `id` | `id` | 用户 ID |
| `userName` | `displayName` | 用户名（显示名称） |
| `userRole` | `role` | 用户角色 |
| `userProfile` | `bio` | 用户简介 |
| `userAccount` | `account` | 账号 |
| `userAvatar` | `avatar` | 头像 URL |

#### 登录响应
```typescript
export interface LoginResponseData {
  user?: LoginUserVO      // 登录用户信息（可能存在）
  [key: string]: any     // 支持其他字段，兼容不同数据结构
}
```

**数据结构说明**：

后端可能返回两种数据结构：

1. **包裹格式**：`{ user: LoginUserVO }`
2. **直接格式**：`LoginUserVO`（直接返回用户信息）

前端代码会自动检测并处理这两种格式。

---

## HTTP 工具类

### `src/utils/http.ts`

#### 功能特性

1. **基于 Fetch API**: 使用原生的 Fetch API，无需额外依赖
2. **统一错误处理**: 集中的错误处理机制
3. **Session 认证**: 后端使用 Session 认证，无需手动管理 Token
4. **Cookie 自动携带**: 浏览器自动携带 Session Cookie
5. **超时控制**: 支持请求超时设置
6. **响应拦截**: 统一的响应数据处理

#### 核心方法

##### `request<T>(url, config)`
- 通用的 HTTP 请求方法
- 支持所有 HTTP 方法
- 自动处理错误和响应

##### `get<T>(url, config)`
- GET 请求快捷方法

##### `post<T>(url, data, config)`
- POST 请求快捷方法
- 自动序列化 JSON 数据

##### `put<T>(url, data, config)`
- PUT 请求快捷方法

##### `del<T>(url, config)`
- DELETE 请求快捷方法

#### 使用示例

```typescript
import { get, post } from '@/utils/http'

// GET 请求
const response = await get('/user/1')

// POST 请求
const result = await post('/user/login', {
  userAccount: 'admin',
  userPassword: '123456'
})

// 注意：后端使用 Session 认证，无需手动设置 Token
// 浏览器会自动携带 Session Cookie
```

---

## API 服务层

### `src/api/auth.ts`

#### 用户注册

```typescript
export async function registerUser(
  data: UserRegisterRequest
): Promise<ApiResponse<RegisterResponseData>> {
  return post<RegisterResponseData>(API_ENDPOINTS.AUTH.REGISTER, data)
}
```

#### 用户登录

```typescript
export async function loginUser(
  data: UserLoginRequest
): Promise<ApiResponse<LoginResponseData>> {
  return post<LoginResponseData>(API_ENDPOINTS.AUTH.LOGIN, data)
}
```

#### 使用示例

```typescript
import { loginUser, registerUser } from '@/api/auth'

// 注册
const registerResult = await registerUser({
  userAccount: 'user@example.com',
  userPassword: 'password123',
  confirmPassword: 'password123'
})

// 登录
const loginResult = await loginUser({
  userAccount: 'user@example.com',
  userPassword: 'password123'
})
```

---

## 状态管理集成

### `src/stores/user.ts`

#### 更新内容

1. **集成 API**: 调用真实的后端 API
2. **异步操作**: 支持异步登录和注册
3. **加载状态**: 提供 `isLoading` 状态
4. **错误管理**: 统一的错误处理
5. **Session 认证**: 后端使用 Session，无需手动管理 Token
6. **状态持久化**: 用户信息存储到 localStorage

#### 新增状态

```typescript
const loading = ref(false)        // 加载状态
const error = ref<string | null>(null)  // 错误信息
```

#### 新增计算属性

```typescript
const isLoading = computed(() => loading.value)
const hasError = computed(() => error.value !== null)
```

#### 更新的方法

##### `login(data: LoginData): Promise<boolean>`
- 异步登录方法
- 调用后端 API
- 存储用户信息
- 返回登录结果

##### `register(data: RegisterData): Promise<boolean>`
- 异步注册方法
- 调用后端 API
- 返回注册结果

##### `logout()`
- 清除用户信息
- 清除 localStorage 数据
- 注意：不清除 Token，因为后端使用 Session

##### `clearError()`
- 清除错误信息

##### `initializeUser()`
- 初始化用户状态
- 从 localStorage 恢复用户信息

---

## 页面组件更新

### 登录页面 (`src/views/LoginView.vue`)

#### 更新内容

1. **异步登录**: 使用 `async/await` 处理登录
2. **加载状态**: 显示加载中的按钮状态
3. **错误显示**: 显示服务器返回的错误信息
4. **表单数据**: 调整为使用对象传参

#### 关键代码

```typescript
// 计算属性
const isLoading = computed(() => userStore.isLoading)
const serverError = computed(() => userStore.error)
const displayError = computed(() => serverError.value || errorMessage.value)

// 异步登录
async function handleLogin() {
  errorMessage.value = ''
  userStore.clearError()

  if (!account.value || !password.value) {
    errorMessage.value = '请输入账户和密码'
    return
  }

  const success = await userStore.login({
    account: account.value,
    password: password.value
  })

  if (success) {
    router.push('/')
  }
}
```

#### 模板更新

```vue
<!-- 显示综合错误信息 -->
<p v-if="displayError" class="error-message">{{ displayError }}</p>

<!-- 按钮加载状态 -->
<button type="submit" class="btn btn-primary" :disabled="isLoading">
  {{ isLoading ? '登录中...' : '登录' }}
</button>
```

---

### 注册页面 (`src/views/RegisterView.vue`)

#### 更新内容

1. **异步注册**: 使用 `async/await` 处理注册
2. **加载状态**: 显示加载中的按钮状态
3. **错误显示**: 显示服务器返回的错误信息
4. **表单数据**: 调整为使用对象传参（包含 confirmPassword）

#### 关键代码

```typescript
// 计算属性
const isLoading = computed(() => userStore.isLoading)
const serverError = computed(() => userStore.error)
const displayError = computed(() => serverError.value || errorMessage.value)

// 异步注册
async function handleRegister() {
  errorMessage.value = ''
  successMessage.value = ''
  userStore.clearError()

  // 表单验证...

  const success = await userStore.register({
    account: account.value,
    displayName: displayName.value,
    password: password.value,
    confirmPassword: confirmPassword.value,
    avatar: avatar.value || undefined,
    bio: bio.value || undefined
  })

  if (success) {
    successMessage.value = '注册成功！正在跳转到登录页...'
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  }
}
```

---

## 请求流程

### 登录流程

```
1. 用户输入账户和密码
   ↓
2. 点击登录按钮
   ↓
3. 前端表单验证
   ↓
4. 调用 userStore.login()
   ↓
5. 设置 loading = true
   ↓
6. 构造 UserLoginRequest
   ↓
7. 调用 auth.loginUser()
   ↓
8. HTTP POST 请求到 http://localhost:8080/api/user/login
   ↓
9. 后端验证账户和密码
   ↓
10. 后端创建 Session 并设置 Cookie
    ↓
11. 后端返回用户信息
    ↓
12. 存储用户信息到 user.value
    ↓
13. 存储用户信息到 localStorage
    ↓
14. 设置 loading = false
    ↓
15. 跳转到首页

注意：Session 信息由浏览器通过 Cookie 自动携带，无需手动管理
```

### 注册流程

```
1. 用户填写注册表单
   ↓
2. 点击注册按钮
   ↓
3. 前端表单验证
   ↓
4. 调用 userStore.register()
   ↓
5. 设置 loading = true
   ↓
6. 构造 UserRegisterRequest
   ↓
7. 调用 auth.registerUser()
   ↓
8. HTTP POST 请求到 http://localhost:8080/api/user/register
   ↓
9. 后端验证注册信息
   ↓
10. 后端创建用户账户
    ↓
11. 返回注册结果
    ↓
12. 设置 loading = false
    ↓
13. 显示成功信息
    ↓
14. 1.5秒后跳转到登录页
```

---

## 错误处理

### 错误类型

1. **表单验证错误**: 前端表单验证失败
2. **网络错误**: 网络请求失败
3. **服务器错误**: 后端返回错误状态码
4. **业务错误**: 后端返回业务错误（如账户已存在）

### 错误显示

- **优先级**: 服务器错误 > 本地错误
- **显示位置**: 表单下方错误提示区域
- **错误清除**: 提交新请求前自动清除

### 错误示例

```typescript
// 表单验证错误
errorMessage.value = '请输入账户和密码'

// 服务器错误（由 Store 设置）
userStore.error = '账户或密码错误'

// 综合显示
const displayError = computed(() => serverError.value || errorMessage.value)
```

---

## 数据持久化

### localStorage 存储

#### 存储的数据

1. **用户信息**: `user_info`
   ```json
   {
     "id": "1",
     "account": "user@example.com",
     "displayName": "张三",
     "avatar": "http://...",
     "bio": "个人简介"
   }
   ```

#### 持久化时机

- **登录成功**: 存储用户信息
- **退出登录**: 清除所有数据
- **Session 过期**: 后端会返回 401，前端需要处理

#### 状态恢复

应用启动时，`initializeUser()` 会自动从 localStorage 恢复用户状态：
1. 读取 `user_info` 恢复用户信息
2. 如果用户信息存在，说明用户之前登录过
3. 注意：不验证 Token，因为后端使用 Session 认证

---

## Session 认证

### Session 认证流程

1. **登录成功**: 后端创建 Session 并设置 Cookie
2. **Cookie 存储**: 浏览器自动存储 Session Cookie
3. **发送请求**: 浏览器自动携带 Cookie
4. **验证 Session**: 后端验证 Session 有效性
5. **Session 过期**: 后端返回 401，需要重新登录

### Cookie 特点

- **自动携带**: 浏览器自动在同源请求中携带 Cookie
- **服务器管理**: Session 由后端服务器管理
- **自动过期**: Session 超时后自动失效
- **安全**: 相对 Token 更安全，不易被窃取

### 注意事项

- 不需要手动管理 Token
- 不需要在请求头中添加 Authorization
- 浏览器会自动处理 Cookie
- 后端需要配置 CORS 允许凭证

---

## 企业级开发规范

### 配置管理规范

1. **环境隔离**: 开发、测试、生产环境使用不同配置
2. **集中管理**: 所有配置集中在配置文件中
3. **类型安全**: 使用 TypeScript 类型检查
4. **易于切换**: 修改环境无需修改代码

### 代码组织规范

1. **分层架构**: 视图层 → 状态层 → API 层 → HTTP 层 → 配置层
2. **单一职责**: 每个模块只负责一个功能
3. **接口抽象**: 使用 TypeScript 接口定义数据结构
4. **错误处理**: 统一的错误处理机制

### 命名规范

1. **文件命名**: kebab-case（如 `api.ts`、`http.ts`）
2. **函数命名**: camelCase（如 `loginUser`、`registerUser`）
3. **接口命名**: PascalCase（如 `UserLoginRequest`）
4. **常量命名**: UPPER_SNAKE_CASE（如 `API_BASE_URL`）

### 注释规范

1. **文件注释**: 说明文件用途
2. **函数注释**: 说明函数功能、参数、返回值
3. **类型注释**: 说明类型用途
4. **关键逻辑**: 说明复杂逻辑

---

## 部署说明

### 开发环境部署

1. **后端服务**: 启动后端服务在 `http://localhost:8080/api`
2. **前端服务**: 运行 `npm run dev`
3. **环境配置**: 使用 `.env.development` 配置

### 生产环境部署

1. **修改配置**: 编辑 `.env.production`，设置生产环境 API 地址
   ```bash
   VITE_API_BASE_URL=https://your-domain.com/api
   ```

2. **构建项目**: 运行 `npm run build`

3. **部署静态文件**: 将 `dist` 目录部署到静态服务器

4. **配置代理**: 在 Nginx 或其他反向代理服务器中配置 API 转发

### Nginx 配置示例

```nginx
server {
    listen 80;
    server_name your-domain.com;

    # 前端静态文件
    location / {
        root /path/to/dist;
        try_files $uri $uri/ /index.html;
    }

    # API 转发
    location /api {
        proxy_pass http://backend-server:8080/api;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
    }
}
```

---

## 测试

### 本地测试

1. **启动后端服务**: 确保后端服务运行在 `http://localhost:8080/api`
2. **启动前端服务**: 运行 `npm run dev`
3. **测试注册**: 访问 `/register`，填写注册信息
4. **测试登录**: 访问 `/login`，使用注册的账户登录
5. **验证登录**: 登录成功后检查首页是否显示用户信息

### API 测试

使用 Postman 或其他工具测试后端 API：

#### 注册接口

```
POST http://localhost:8080/api/user/register
Content-Type: application/json

{
  "userAccount": "test@example.com",
  "userPassword": "password123",
  "confirmPassword": "password123"
}
```

#### 登录接口

```
POST http://localhost:8080/api/user/login
Content-Type: application/json

{
  "userAccount": "test@example.com",
  "userPassword": "password123"
}
```

---

## 常见问题

### 1. CORS 错误

**问题**: 浏览器控制台显示 CORS 错误

**解决**: 后端需要配置 CORS 允许跨域请求

### 2. 请求超时

**问题**: 请求长时间无响应

**解决**: 检查后端服务是否正常运行，或增加超时时间

### 3. Session 过期

**问题**: 登录一段时间后自动退出

**解决**:
- 后端 Session 过期时间设置较短
- 需要重新登录
- 可以请求后端延长 Session 过期时间

### 4. 环境变量不生效

**问题**: 修改环境变量后未生效

**解决**: 重启开发服务器

---

## 后续优化建议

1. **Session 管理**: 实现 Session 过期自动检测和提示
2. **请求重试**: 失败请求自动重试
3. **缓存机制**: 缓存 API 响应数据
4. **错误日志**: 记录错误日志便于排查问题
5. **性能监控**: 监控 API 请求性能
6. **离线支持**: 使用 Service Worker 实现离线功能

---

## 总结

本次更新实现了完整的前后端 API 集成，包括：

- ✅ 企业级配置管理
- ✅ 类型安全的 API 封装
- ✅ 统一的 HTTP 请求工具
- ✅ Session 认证机制
- ✅ 数据持久化
- ✅ 完善的错误处理
- ✅ 加载状态管理
- ✅ 详细的代码注释
- ✅ 遵循开发规范

所有代码都经过严格测试，符合企业级开发标准，便于后续维护和扩展。
