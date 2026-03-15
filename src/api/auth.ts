/**
 * 用户认证相关 API
 * 封装用户登录、注册等认证相关的接口调用
 */

import {
  API_ENDPOINTS
} from '@/config/api'
import {
  post
} from '@/utils/http'
import type {
  ApiResponse,
  UserRegisterRequest,
  UserLoginRequest,
  LoginResponseData,
  RegisterResponseData
} from '@/types/api'

/**
 * 用户注册
 * 向后端发送注册请求，创建新用户账户
 *
 * @param data - 注册请求数据
 * @returns Promise<ApiResponse<RegisterResponseData>>
 *
 * @example
 * const result = await registerUser({
 *   userAccount: 'user@example.com',
 *   userPassword: 'password123',
 *   confirmPassword: 'password123'
 * })
 *
 * if (result.code === 0) {
 *   console.log('注册成功', result.data)
 * }
 */
export async function registerUser(
  data: UserRegisterRequest
): Promise<ApiResponse<RegisterResponseData>> {
  return post<RegisterResponseData>(API_ENDPOINTS.AUTH.REGISTER, data)
}

/**
 * 用户登录
 * 向后端发送登录请求，验证用户身份
 *
 * @param data - 登录请求数据
 * @returns Promise<ApiResponse<LoginResponseData>>
 *
 * @example
 * const result = await loginUser({
 *   userAccount: 'user@example.com',
 *   userPassword: 'password123'
 * })
 *
 * if (result.code === 0) {
 *   console.log('登录成功', result.data)
 *   const { user, token } = result.data
 * }
 */
export async function loginUser(
  data: UserLoginRequest
): Promise<ApiResponse<LoginResponseData>> {
  return post<LoginResponseData>(API_ENDPOINTS.AUTH.LOGIN, data)
}

/**
 * 用户退出登录
 * 向后端发送退出登录请求，清除服务端 Session
 *
 * @returns Promise<ApiResponse<boolean>>
 *
 * @example
 * const result = await logoutUser()
 *
 * if (result.code === 0) {
 *   console.log('退出登录成功')
 * }
 */
export async function logoutUser(): Promise<ApiResponse<boolean>> {
  return post<boolean>(API_ENDPOINTS.AUTH.LOGOUT, {})
}
