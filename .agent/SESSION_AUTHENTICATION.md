# Session 认证说明

## 概述

本项目后端使用 **Session 认证**，不使用 JWT Token。本文档详细说明 Session 认证的工作原理、特点以及前后端实现细节。

## Session 认证原理

### 认证流程

```
1. 用户登录
   ↓
2. 后端验证用户名和密码
   ↓
3. 后端创建 Session（存储在服务器内存或数据库）
   ↓
4. 后端生成 Session ID
   ↓
5. 后端通过 Set-Cookie 响应头将 Session ID 发送给浏览器
   ↓
6. 浏览器自动存储 Cookie（包含 Session ID）
   ↓
7. 后续请求时浏览器自动携带 Cookie
   ↓
8. 后端通过 Cookie 中的 Session ID 查找对应的 Session
   ↓
9. 后端验证 Session 有效性和用户身份
   ↓
10. 后端返回请求结果
```

### Cookie 机制

浏览器在同源请求中会自动携带 Cookie，无需前端手动处理：

```http
# 后端响应（登录成功）
HTTP/1.1 200 OK
Set-Cookie: JSESSIONID=ABC123; Path=/; HttpOnly; Secure; SameSite=Strict

# 前端请求（后续请求）
GET /api/user/profile HTTP/1.1
Host: localhost:8080
Cookie: JSESSIONID=ABC123  # 浏览器自动携带
```

## Session vs JWT Token

| 特性 | Session 认证 | JWT Token |
|------|--------------|-----------|
| **存储位置** | 服务器端（内存或数据库） | 客户端（localStorage、Cookie） |
| **传输方式** | 浏览器自动通过 Cookie 携带 | 手动添加到请求头 |
| **管理方式** | 后端服务器管理 | 前端手动管理 |
| **过期处理** | 服务器自动过期 | 前端或后端检查过期时间 |
| **安全性** | 相对较高（HttpOnly Cookie） | 需要额外防护（XSS、CSRF） |
| **服务器负载** | 需要存储 Session 数据 | 无状态，无需存储 |
| **扩展性** | 需要分布式 Session 共享 | 天然支持分布式 |
| **撤销能力** | 可立即撤销（删除 Session） | 难以立即撤销 |
| **适用场景** | 传统 Web 应用 | 微服务、移动端应用 |

## 前端实现

### 无需额外代码

使用 Session 认证时，前端无需额外的代码处理认证：

```typescript
// 不需要设置 Token
// setAccessToken('xxx')  // ❌ 不需要

// 直接发送请求即可
const response = await post('/api/user/login', {
  userAccount: 'test@example.com',
  userPassword: 'password123'
})
```

### Cookie 自动携带

浏览器会自动在同源请求中携带 Cookie：

```typescript
// 任何请求都会自动携带 Session Cookie
const response = await get('/api/user/profile')
// 请求头会自动包含：Cookie: JSESSIONID=ABC123
```

### 注意事项

1. **不需要手动管理 Token**
   - 不需要存储 Token 到 localStorage
   - 不需要在请求头中添加 Authorization
   - 不需要处理 Token 过期

2. **CORS 配置**
   - 后端需要允许凭证（credentials）
   - 前端不需要特殊配置（同源请求自动携带 Cookie）

3. **Session 过期处理**
   - 后端返回 401 状态码表示 Session 过期
   - 前端需要处理 401 错误，跳转到登录页

## 后端实现要点

### CORS 配置

后端需要配置 CORS 允许凭证：

```java
// Spring Boot 示例
@Configuration
public class CorsConfig {
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.setAllowCredentials(true);  // 允许凭证
        config.addAllowedOrigin("http://localhost:5173");  // 允许的前端地址
        config.addAllowedHeader("*");
        config.addAllowedMethod("*");

        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);

        return new CorsFilter(source);
    }
}
```

### Cookie 设置

后端登录成功后设置 Cookie：

```java
// 登录成功后设置 Cookie
Cookie cookie = new Cookie("JSESSIONID", sessionId);
cookie.setPath("/");
cookie.setHttpOnly(true);  // 防止 XSS 攻击
cookie.setSecure(true);   // 仅 HTTPS 传输（生产环境）
cookie.setMaxAge(3600);   // 过期时间（秒）
response.addCookie(cookie);
```

### Session 管理

后端管理 Session：

```java
// 创建 Session
HttpSession session = request.getSession(true);
session.setAttribute("userId", user.getId());

// 获取 Session
HttpSession session = request.getSession(false);
if (session != null) {
    Long userId = (Long) session.getAttribute("userId");
}

// 销毁 Session（退出登录）
session.invalidate();
```

## 安全注意事项

### 1. HttpOnly Cookie

设置 Cookie 时添加 `HttpOnly` 标志，防止 XSS 攻击：

```java
cookie.setHttpOnly(true);
```

### 2. Secure Cookie

生产环境使用 HTTPS 时，添加 `Secure` 标志：

```java
cookie.setSecure(true);
```

### 3. SameSite Cookie

设置 `SameSite` 属性防止 CSRF 攻击：

```java
cookie.setSameSite("Strict");  // 或 "Lax"
```

### 4. Session 过期

设置合理的 Session 过期时间：

```java
session.setMaxInactiveInterval(3600);  // 1小时
```

### 5. Session 固定攻击防护

登录成功后重新生成 Session ID：

```java
HttpSession session = request.getSession(true);
session.invalidate();  // 销毁旧 Session
session = request.getSession(true);  // 创建新 Session
session.setAttribute("userId", user.getId());
```

## 常见问题

### 1. Cookie 未携带

**问题**: 请求时未携带 Cookie

**原因**:
- 跨域请求未配置 CORS
- Cookie 的 Path 设置不正确
- Cookie 已过期

**解决**:
- 检查后端 CORS 配置
- 检查 Cookie 的 Path 设置
- 检查 Cookie 的过期时间

### 2. Session 丢失

**问题**: 登录后 Session 丢失

**原因**:
- 服务器重启导致内存中的 Session 丢失
- Session 过期时间设置过短
- 分布式环境未配置 Session 共享

**解决**:
- 使用持久化 Session（Redis）
- 延长 Session 过期时间
- 配置分布式 Session 共享

### 3. CORS 错误

**问题**: 浏览器控制台显示 CORS 错误

**原因**:
- 后端未配置 CORS
- 后端未允许凭证（credentials）
- 前端和后端域名不匹配

**解决**:
- 配置后端 CORS
- 设置 `config.setAllowCredentials(true)`
- 确保前端域名在允许列表中

### 4. 401 未授权

**问题**: 请求返回 401 状态码

**原因**:
- Session 过期
- Session 无效
- Cookie 未携带

**解决**:
- 检查 Session 过期时间
- 检查 Cookie 是否正确携带
- 前端处理 401 错误，跳转到登录页

## 前端错误处理

### 401 错误处理

当 Session 过期时，后端返回 401，前端需要处理：

```typescript
import { request } from '@/utils/http'

// 在 HTTP 工具类中统一处理 401 错误
try {
  const response = await request('/api/user/profile')
  // 处理响应...
} catch (error: any) {
  if (error.code === 401) {
    // Session 过期，清除用户信息并跳转到登录页
    userStore.logout()
    router.push('/login')
  }
}
```

### 请求拦截器

可以在 HTTP 工具类中添加拦截器统一处理错误：

```typescript
export async function request<T = any>(
  url: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  try {
    // ... 发送请求
    const response = await fetchWithTimeout(fullUrl, requestConfig, timeout)

    // 检查响应状态码
    if (response.status === 401) {
      // Session 过期，清除用户信息
      const userStore = useUserStore()
      userStore.logout()
      router.push('/login')
      throw new Error('登录已过期，请重新登录')
    }

    // ... 其他处理
  } catch (error) {
    // 错误处理
  }
}
```

## 优势与劣势

### 优势

1. **安全性高**: HttpOnly Cookie 防止 XSS 攻击
2. **管理简单**: 浏览器自动处理 Cookie，前端无需额外代码
3. **立即撤销**: 服务器可立即撤销 Session
4. **适合传统 Web**: 传统 Web 应用的首选方案

### 劣势

1. **服务器负载**: 需要存储 Session 数据
2. **扩展性差**: 分布式环境需要配置 Session 共享
3. **移动端支持**: 移动端应用需要额外处理 Cookie

## 适用场景

### 适合使用 Session 的场景

1. **传统 Web 应用**: 前后端分离的传统 Web 应用
2. **单服务器部署**: 应用部署在单个服务器上
3. **安全性要求高**: 对安全性要求较高的应用
4. **需要立即撤销**: 需要能够立即撤销用户会话

### 不适合使用 Session 的场景

1. **微服务架构**: 分布式微服务架构
2. **移动端应用**: 移动端应用（Cookie 支持不佳）
3. **无状态应用**: 需要完全无状态的应用
4. **高并发场景**: 需要高并发的场景（Session 存储压力）

## 总结

Session 认证是一种成熟、安全的认证方式，特别适合传统 Web 应用。本项目的后端使用 Session 认证，前端无需额外的代码处理认证，浏览器会自动携带 Cookie。

关键点：
- ✅ 前端无需管理 Token
- ✅ 浏览器自动携带 Cookie
- ✅ 后端管理 Session
- ✅ 注意 CORS 配置
- ✅ 处理 401 错误
- ✅ 注意安全配置（HttpOnly、Secure、SameSite）

通过合理配置和使用 Session 认证，可以实现安全、可靠的用户认证功能。
