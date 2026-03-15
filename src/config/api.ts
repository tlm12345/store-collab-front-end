/**
 * API 配置文件
 * 集中管理 API 相关的配置项，便于维护和切换环境
 */

/**
 * API 基础地址
 * 从环境变量中读取，支持不同环境使用不同的 API 地址
 *
 * 开发环境: http://localhost:8080/api
 * 生产环境: https://your-domain.com/api
 */
export const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api'

/**
 * API 请求超时时间（毫秒）
 */
export const API_TIMEOUT = 10000

/**
 * API 端点路径
 * 集中管理所有 API 端点路径，便于统一维护
 *
 * 路由模式：/api/{模块路径}/{功能路径}
 * 示例：/api/user/login、/api/user/register
 */
export const API_ENDPOINTS = {
  // 用户认证相关 (用户信息管理模块)
  AUTH: {
    REGISTER: '/user/register',
    LOGIN: '/user/login',
    LOGOUT: '/user/logout'
  },
  // 用户管理相关 (管理员功能)
  USER: {
    ADD: '/user/add',
    UPDATE: '/user/update',
    DELETE: '/user/delete',
    GET_BY_ID: '/user/get',
    GET_CURRENT: '/user/current',
    LIST_PAGE: '/user/list/page/vo'
  }
} as const

/**
 * 完整的 API URL 生成器
 * 根据基础地址和端点路径生成完整的 API URL
 *
 * 路由模式：{基础地址}/{模块路径}/{功能路径}
 * 基础地址：http://localhost:8080/api
 * 端点示例：/user/login、/user/register
 * 完整示例：http://localhost:8080/api/user/login
 *
 * @param endpoint - API 端点路径（包含模块路径和功能路径）
 * @returns 完整的 API URL
 *
 * @example
 * getFullUrl('/user/login') // 返回 'http://localhost:8080/api/user/login'
 * getFullUrl('/user/register') // 返回 'http://localhost:8080/api/user/register'
 */
export function getFullUrl(endpoint: string): string {
  // 移除端点路径开头的斜杠，确保拼接正确
  const normalizedEndpoint = endpoint.startsWith('/') ? endpoint.slice(1) : endpoint
  // 移除基础地址末尾的斜杠，确保拼接正确
  const normalizedBaseUrl = API_BASE_URL.endsWith('/')
    ? API_BASE_URL.slice(0, -1)
    : API_BASE_URL

  return `${normalizedBaseUrl}/${normalizedEndpoint}`
}
