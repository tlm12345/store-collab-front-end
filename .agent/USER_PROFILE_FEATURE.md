# 用户个人信息功能说明

## 概述

用户个人信息功能允许用户查看自己的详细信息，包括头像、用户名、账号、角色、个人简介等。

## 功能特性

1. **自动登录验证**：未登录用户访问个人信息页面会自动跳转到登录页
2. **完整信息展示**：显示后端返回的所有用户信息
3. **优雅的界面设计**：响应式布局，适配不同屏幕尺寸
4. **便捷的导航**：提供返回首页和退出登录功能

## 页面结构

### 路由配置

```typescript
{
  path: '/profile',
  name: 'profile',
  component: () => import('../views/ProfileView.vue'),
}
```

### 文件位置

```
src/views/ProfileView.vue
```

## 页面功能

### 显示的用户信息

| 字段 | 后端字段 | 显示标签 | 说明 |
|------|---------|---------|------|
| 头像 | userAvatar | 头像 | 用户头像图片，无头像时显示昵称首字母 |
| 用户名 | userName | 用户名 | 用户昵称或显示名称 |
| 账号 | userAccount | 账号 | 登录时使用的唯一标识 |
| 角色 | userRole | 角色 | 用户角色（如：user、admin） |
| 简介 | userProfile | 个人简介 | 用户的个人简介 |
| ID | id | 用户 ID | 用户唯一标识符 |

### 操作按钮

1. **返回按钮**：返回首页
2. **退出登录**：清除用户信息并跳转到登录页

## 数据流

### 访问个人信息页面

```
1. 用户访问 /profile
   ↓
2. ProfileView.vue 组件挂载
   ↓
3. 检查登录状态
   ↓
4a. 已登录：显示用户信息
4b. 未登录：跳转到登录页
```

### 显示用户信息

```
1. 从 Pinia Store 获取用户信息
   ↓
2. Store 从 localStorage 恢复数据
   ↓
3. 将后端 LoginUserVO 映射为前端 User 格式
   ↓
4. 在页面上展示用户信息
```

### 退出登录

```
1. 用户点击"退出登录"按钮
   ↓
2. 调用 userStore.logout()
   ↓
3. 清除 Store 中的用户信息
   ↓
4. 清除 localStorage 中的用户数据
   ↓
5. 跳转到登录页
```

## 代码实现

### ProfileView.vue 主要代码

```typescript
import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// 计算属性
const user = computed(() => userStore.user)
const isLoggedIn = computed(() => userStore.isLoggedIn)

// 登录状态检查
onMounted(() => {
  if (!isLoggedIn.value) {
    router.push('/login')
  }
})

// 退出登录
function handleLogout() {
  userStore.logout()
  router.push('/login')
}
```

### 数据映射

后端 LoginUserVO → 前端 User：

```typescript
const userData: User = {
  id: String(loginUserData.id),
  account: loginUserData.userAccount,
  displayName: loginUserData.userName,
  avatar: loginUserData.userAvatar,
  bio: loginUserData.userProfile,
  role: loginUserData.userRole
}
```

## 界面样式

### 响应式设计

- **桌面端** (>= 640px)：最大宽度 600px，完整布局
- **移动端** (< 640px)：适配小屏幕，缩小头像和标题

### 样式特点

1. **卡片式设计**：白色背景，圆角边框，阴影效果
2. **圆形头像**：头像显示为圆形，无头像时显示首字母
3. **信息分组**：每个信息项独立显示，便于阅读
4. **色彩搭配**：使用主题色和红色作为退出登录按钮

## 用户交互

### 正常流程

1. 用户登录成功后自动跳转到个人信息页面
2. 查看自己的详细信息
3. 可以点击"返回"按钮回到首页
4. 可以点击"退出登录"按钮退出

### 异常处理

1. **未登录访问**：自动跳转到登录页
2. **Session 过期**：需要重新登录
3. **网络错误**：显示错误提示

## 导航集成

### 顶部导航栏

在 `App.vue` 中添加了个人信息链接：

```vue
<!-- 已登录时显示的内容 -->
<RouterLink v-if="isLoggedIn" to="/profile">个人信息</RouterLink>
<span v-if="isLoggedIn" class="nav-user">{{ currentUser?.displayName }}</span>
<a v-if="isLoggedIn" class="nav-link" @click="handleLogout">退出</a>
```

### 路由跳转

- **登录成功后**：从 LoginView 跳转到 ProfileView
- **返回首页**：从 ProfileView 跳转到 HomeView
- **退出登录后**：从 ProfileView 跳转到 LoginView

## 数据持久化

### localStorage 存储格式

```json
{
  "id": "1",
  "account": "test@example.com",
  "displayName": "测试用户",
  "avatar": "http://...",
  "bio": "个人简介",
  "role": "user"
}
```

### 存储键名

- `user_info`：存储用户完整信息

## 测试

### 测试步骤

1. **登录测试**：
   - 访问登录页面
   - 输入正确的账户和密码
   - 点击登录
   - 验证是否跳转到个人信息页面

2. **信息显示测试**：
   - 验证所有用户信息是否正确显示
   - 验证头像是否正确加载
   - 验证无头像时是否显示首字母

3. **未登录访问测试**：
   - 退出登录
   - 直接访问 /profile
   - 验证是否跳转到登录页

4. **退出登录测试**：
   - 登录后访问个人信息页面
   - 点击"退出登录"按钮
   - 验证是否清除用户信息并跳转到登录页

## 后续优化建议

1. **编辑功能**：允许用户编辑个人信息（昵称、简介、头像）
2. **密码修改**：添加修改密码功能
3. **头像上传**：支持用户上传自定义头像
4. **信息验证**：添加个人信息验证机制
5. **历史记录**：显示用户登录历史或操作记录

## 注意事项

1. **登录验证**：访问个人信息页面必须先登录
2. **Session 管理**：后端 Session 过期后需要重新登录
3. **数据安全**：个人信息不应包含敏感数据
4. **用户体验**：提供清晰的错误提示和操作反馈
