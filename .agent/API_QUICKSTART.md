# 前后端联调快速开始指南

## 前置要求

- Node.js >= 20.19.0 || >= 22.12.0
- 后端服务运行在 `http://localhost:8080/api`

## 快速开始

### 1. 安装依赖

```bash
npm install
```

### 2. 配置环境变量

项目已预配置开发环境，默认后端地址为 `http://localhost:8080/api`

如需修改，编辑 `.env.development` 文件：

```bash
VITE_API_BASE_URL=http://localhost:8080/api
```

### 3. 启动后端服务

确保后端服务已启动，并监听 `http://localhost:8080/api`

### 4. 启动前端开发服务器

```bash
npm run dev
```

访问 `http://localhost:5173` 即可看到应用

## 功能测试

### 测试注册

1. 访问 `http://localhost:5173/register`
2. 填写注册信息：
   - 账户：`test@example.com`
   - 显示名称：`测试用户`
   - 密码：`password123`
   - 确认密码：`password123`
3. 点击"注册"按钮
4. 注册成功后自动跳转到登录页

### 测试登录

1. 访问 `http://localhost:5173/login`
2. 输入账户和密码：
   - 账户：`test@example.com`
   - 密码：`password123`
3. 点击"登录"按钮
4. 登录成功后跳转到首页，显示用户信息

### 测试退出登录

1. 在首页点击"退出"按钮
2. 自动跳转到未登录状态

## API 接口说明

### 用户注册

**接口地址**: `POST /api/user/register`

**请求体**:
```json
{
  "userAccount": "test@example.com",
  "userPassword": "password123",
  "confirmPassword": "password123"
}
```

**响应示例**:
```json
{
  "code": 0,
  "data": {
    "user": {
      "id": "1",
      "userAccount": "test@example.com",
      "userNickname": "测试用户"
    },
    "userId": "1"
  },
  "message": "注册成功",
  "description": "用户账户创建成功"
}
```

### 用户登录

**接口地址**: `POST /api/user/login`

**请求体**:
```json
{
  "userAccount": "test@example.com",
  "userPassword": "password123"
}
```

**响应示例**:
```json
{
  "code": 0,
  "data": {
    "user": {
      "id": "1",
      "userName": "测试用户",
      "userRole": "user",
      "userProfile": "个人简介",
      "userAccount": "test@example.com",
      "userAvatar": "http://..."
    }
  },
  "message": "登录成功",
  "description": "登录验证通过"
}
```

**登录用户信息说明**：

data.user 字段包含登录用户的详细信息，格式如下：

| 字段 | 类型 | 说明 |
|------|------|------|
| `id` | `number` | 用户 ID（后端 Long 类型） |
| `userName` | `string` | 用户名（昵称/显示名称） |
| `userRole` | `string` | 用户角色 |
| `userProfile` | `string` | 用户简介（个人简介） |
| `userAccount` | `string` | 账号（登录时使用的唯一标识） |
| `userAvatar` | `string` | 用户头像 URL |

**登录成功后**：

1. 用户信息会自动保存到 Pinia Store 和 localStorage
2. 自动跳转到个人信息页面（`/profile`）
3. 后端通过 Session 管理登录状态，浏览器自动携带 Cookie

注意：后端使用 Session 认证，不返回 Token。Session 信息由浏览器通过 Cookie 自动管理。

### 通用响应结构说明

所有 API 接口统一返回以下格式的响应：

```typescript
{
  "code": number,       // 响应状态码：0 表示成功，其他值表示失败
  "data": T | null,     // 响应数据：成功时包含具体数据，失败时为 null
  "message": string,    // 响应消息：简要的提示信息（如："请求参数错误"、"操作成功"）
  "description": string // 响应描述：详细的错误或成功信息（如："用户不存在"、"密码错误"）
}
```

#### 字段说明

- **code**: 响应状态码
  - `0`: 请求成功
  - `40000`: 请求参数错误
  - `50000`: 服务器内部错误
  - 其他非零值：其他业务错误

- **data**: 响应数据
  - 成功时包含具体的业务数据
  - 失败时为 `null`

- **message**: 响应消息
  - 简要的提示信息
  - 适合在 UI 上显示

- **description**: 响应描述
  - 详细的错误或成功信息
  - 便于调试和定位问题
  - 前端会优先使用 `description` 显示错误信息

#### 错误处理示例

后端返回错误时：
```json
{
  "code": 40000,
  "data": null,
  "message": "请求参数错误",
  "description": "用户不存在"
}
```

前端会优先显示 `description` 字段（"用户不存在"），如果 `description` 不存在，则显示 `message` 字段。

## 项目结构

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
├── stores/
│   └── user.ts             # 用户状态管理
├── views/
│   ├── LoginView.vue       # 登录页面
│   └── RegisterView.vue    # 注册页面
└── App.vue                 # 根组件
```

## 环境配置

### 开发环境 (`.env.development`)

```bash
VITE_API_BASE_URL=http://localhost:8080/api
```

### 生产环境 (`.env.production`)

部署前修改 `.env.production` 文件：

```bash
VITE_API_BASE_URL=https://your-domain.com/api
```

## 常用命令

```bash
# 开发
npm run dev

# 构建
npm run build

# 预览
npm run preview

# 类型检查
npm run type-check

# 代码检查
npm run lint

# 代码格式化
npm run format

# 单元测试
npm run test:unit
```

## 故障排除

### 1. 无法连接到后端

**症状**: 登录/注册时显示网络错误

**解决方案**:
- 确认后端服务是否正在运行
- 检查后端地址是否正确
- 查看浏览器控制台的网络请求

### 2. CORS 错误

**症状**: 浏览器控制台显示 CORS 错误

**解决方案**:
- 后端需要配置 CORS 允许跨域请求
- 确认后端 CORS 配置包含前端地址

### 3. 环境变量不生效

**症状**: 修改环境变量后未生效

**解决方案**:
- 重启开发服务器
- 确认环境变量文件命名正确（`VITE_` 前缀）

### 4. Session 过期

**症状**: 登录一段时间后自动退出

**解决方案**:
- 检查后端 Session 过期时间设置
- 需要重新登录
- 可以请求后端延长 Session 过期时间

## 详细文档

更多详细信息请参考：

- [API 集成说明](./API_INTEGRATION.md) - 完整的 API 集成文档
- [项目结构分析](./PROJECT_STRUCTURE.md) - 项目结构和开发规范
- [用户认证功能](./USER_AUTH_FEATURE.md) - 用户认证功能说明

## 注意事项

1. **后端依赖**: 前端应用依赖后端 API，确保后端服务正常运行
2. **Session 管理**: 后端使用 Session 认证，Session 由服务器管理
3. **CORS 配置**: 后端需要配置 CORS 允许跨域请求和凭证
4. **密码安全**: 密码在传输过程中使用 HTTPS 加密
5. **错误处理**: 所有 API 请求都有完善的错误处理机制

## 下一步

- 实现用户信息修改功能
- 实现 Session 过期自动检测
- 添加更多用户相关 API
- 实现权限管理功能
- 添加 API 请求日志

## 技术支持

如有问题，请参考相关文档或联系开发团队。
