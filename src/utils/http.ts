/**
 * HTTP 请求工具类
 * 基于 Fetch API 封装的 HTTP 请求工具
 * 提供统一的请求拦截、错误处理、响应拦截等功能
 *
 * 注意：本项目后端使用 Session 认证，不使用 JWT Token
 * 认证信息由浏览器通过 Cookie 自动携带，无需手动添加 Token
 */

import type {
  ApiResponse,
  RequestError
} from '@/types/api'
import {
  API_BASE_URL,
  API_TIMEOUT,
  getFullUrl
} from '@/config/api'

/**
 * HTTP 请求配置
 */
interface RequestConfig extends RequestInit {
  /**
   * 是否显示加载状态
   */
  showLoading?: boolean

  /**
   * 是否显示错误提示
   */
  showError?: boolean

  /**
   * 请求超时时间（毫秒）
   */
  timeout?: number
}

/**
 * HTTP 响应
 */
interface HttpResponse<T = any> extends Response {
  json(): Promise<ApiResponse<T>>
}

/**
 * 创建带超时的 Fetch 请求
 *
 * @param url - 请求 URL
 * @param options - 请求配置
 * @param timeout - 超时时间（毫秒）
 * @returns Promise<Response>
 */
async function fetchWithTimeout(
  url: string,
  options: RequestInit = {},
  timeout: number = API_TIMEOUT
): Promise<Response> {
  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeout)

  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    })
    clearTimeout(timeoutId)
    return response
  } catch (error) {
    clearTimeout(timeoutId)
    throw error
  }
}

/**
 * 统一的 HTTP 请求方法
 *
 * @param url - 请求 URL（相对路径或完整路径）
 * @param config - 请求配置
 * @returns Promise<ApiResponse<T>>
 *
 * @example
 * // GET 请求
 * const response = await request('/user/1')
 *
 * @example
 * // POST 请求
 * const response = await request('/user/login', {
 *   method: 'POST',
 *   body: JSON.stringify({ username: 'admin', password: '123456' })
 * })
 */
export async function request<T = any>(
  url: string,
  config: RequestConfig = {}
): Promise<ApiResponse<T>> {
  const {
    showLoading = true,
    showError = true,
    timeout = API_TIMEOUT,
    ...restConfig
  } = config

  // 如果是相对路径，使用基础地址拼接
  const fullUrl = url.startsWith('http')
    ? url
    : getFullUrl(url)

  // 构造请求头
  const headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...restConfig.headers
  }

  // 注意：后端使用 Session 认证，需要显式设置 credentials: 'include'
  // 这样浏览器才会跨域请求携带 Cookie 中的 Session ID

  // 构造请求配置
  const requestConfig: RequestInit = {
    ...restConfig,
    headers,
    credentials: 'include'  // 允许跨域请求携带 Cookie（Session 认证必需）
  }

  try {
    // 发送请求
    const response: HttpResponse<T> = await fetchWithTimeout(
      fullUrl,
      requestConfig,
      timeout
    )

    // 解析响应
    const result: ApiResponse<T> = await response.json()

    // 检查响应状态码
    if (!response.ok) {
      throw new Error(result.description || result.message || `HTTP ${response.status}`)
    }

    // 检查业务状态码
    // 后端业务状态码：0 表示成功，其他值表示错误
    if (result.code !== 0) {
      throw new Error(result.description || result.message || '请求失败')
    }

    return result
  } catch (error: any) {
    // 处理错误
    const requestError: RequestError = {
      message: error.message || '网络请求失败',
      code: error.code
    }

    // 显示错误提示
    if (showError) {
      console.error('请求错误:', requestError.message)
      // TODO: 可以集成 UI 组件显示错误提示
      // message.error(requestError.message)
    }

    throw requestError
  }
}

/**
 * GET 请求
 *
 * @param url - 请求 URL
 * @param config - 请求配置
 * @returns Promise<ApiResponse<T>>
 */
export function get<T = any>(
  url: string,
  config?: RequestConfig
): Promise<ApiResponse<T>> {
  return request<T>(url, {
    ...config,
    method: 'GET'
  })
}

/**
 * POST 请求
 *
 * @param url - 请求 URL
 * @param data - 请求数据
 * @param config - 请求配置
 * @returns Promise<ApiResponse<T>>
 */
export function post<T = any>(
  url: string,
  data?: any,
  config?: RequestConfig
): Promise<ApiResponse<T>> {
  return request<T>(url, {
    ...config,
    method: 'POST',
    body: data ? JSON.stringify(data) : undefined
  })
}

/**
 * PUT 请求
 *
 * @param url - 请求 URL
 * @param data - 请求数据
 * @param config - 请求配置
 * @returns Promise<ApiResponse<T>>
 */
export function put<T = any>(
  url: string,
  data?: any,
  config?: RequestConfig
): Promise<ApiResponse<T>> {
  return request<T>(url, {
    ...config,
    method: 'PUT',
    body: data ? JSON.stringify(data) : undefined
  })
}

/**
 * DELETE 请求
 *
 * @param url - 请求 URL
 * @param config - 请求配置
 * @returns Promise<ApiResponse<T>>
 */
export function del<T = any>(
  url: string,
  config?: RequestConfig
): Promise<ApiResponse<T>> {
  return request<T>(url, {
    ...config,
    method: 'DELETE'
  })
}
