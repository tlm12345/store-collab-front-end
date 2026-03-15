/**
 * 用户管理相关 API
 * 封装管理员用户管理功能的接口调用
 */

import {
  API_ENDPOINTS
} from '@/config/api'
import {
  post,
  get
} from '@/utils/http'
import type {
  ApiResponse,
  UserAddRequest,
  UserUpdateRequest,
  UserQueryRequest,
  PageResponse,
  UserVO
} from '@/types/api'

/**
 * 创建用户
 * 管理员创建新用户
 *
 * @param data - 创建用户请求数据
 * @returns Promise<ApiResponse<number>> 返回创建的用户 ID
 *
 * @example
 * const result = await addUser({
 *   userName: '张三',
 *   userAccount: 'zhangsan',
 *   userPassword: '123456',
 *   userAvatar: 'https://example.com/avatar.jpg',
 *   userProfile: '这是张三的个人简介',
 *   userRole: 'user'
 * })
 */
export async function addUser(
  data: UserAddRequest
): Promise<ApiResponse<number>> {
  return post<number>(API_ENDPOINTS.USER.ADD, data)
}

/**
 * 更新用户
 * 管理员更新用户信息
 *
 * @param data - 更新用户请求数据
 * @returns Promise<ApiResponse<boolean>>
 *
 * @example
 * const result = await updateUser({
 *   id: '123',
 *   userName: '李四',
 *   userAvatar: 'https://example.com/new-avatar.jpg',
 *   userRole: 'admin'
 * })
 */
export async function updateUser(
  data: UserUpdateRequest
): Promise<ApiResponse<boolean>> {
  return post<boolean>(API_ENDPOINTS.USER.UPDATE, data)
}

/**
 * 删除用户
 * 根据 ID 删除用户
 *
 * @param id - 用户 ID
 * @returns Promise<ApiResponse<boolean>>
 *
 * @example
 * const result = await deleteUser('123')
 */
export async function deleteUser(
  id: string
): Promise<ApiResponse<boolean>> {
  console.log('删除用户' + id)
  return post<boolean>(API_ENDPOINTS.USER.DELETE, { id })
}

/**
 * 根据 ID 获取用户信息
 *
 * @param id - 用户 ID
 * @returns Promise<ApiResponse<UserVO>>
 *
 * @example
 * const result = await getUserById('123')
 */
export async function getUserById(
  id: string
): Promise<ApiResponse<UserVO>> {
  return get<UserVO>(`${API_ENDPOINTS.USER.GET_BY_ID}?id=${id}`)
}

/**
 * 分页查询用户列表
 * 支持多条件组合查询
 *
 * @param data - 查询条件
 * @returns Promise<ApiResponse<PageResponse<UserVO>>>
 *
 * @example
 * const result = await listUserByPage({
 *   userName: '张',
 *   userRole: 'user',
 *   current: 1,
 *   pageSize: 10
 * })
 */
export async function listUserByPage(
  data: UserQueryRequest
): Promise<ApiResponse<PageResponse<UserVO>>> {
  return post<PageResponse<UserVO>>(API_ENDPOINTS.USER.LIST_PAGE, data)
}

/**
 * 获取当前登录用户信息
 * 验证用户登录状态
 *
 * @returns Promise<ApiResponse<UserVO>>
 *
 * @example
 * const result = await getCurrentUser()
 * if (result.code === 0) {
 *   console.log('当前用户:', result.data)
 * }
 */
export async function getCurrentUser(): Promise<ApiResponse<UserVO>> {
  return get<UserVO>(API_ENDPOINTS.USER.GET_CURRENT)
}
