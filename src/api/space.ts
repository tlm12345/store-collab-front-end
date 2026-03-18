/**
 * 空间管理相关 API
 * 封装空间管理功能的接口调用
 */

import { API_ENDPOINTS } from '@/config/api'
import { post, get } from '@/utils/http'
import type {
  ApiResponse,
  SpaceVO,
  SpaceUser,
  SpaceUserVO,
  SpaceCreateRequest,
  SpaceEditRequest,
  SpaceAddUserRequest,
  SpaceUpdateUserRequest,
  GetSpaceUserRequest
} from '@/types/api'

/**
 * 创建空间
 * 用户可以创建私人空间或团队空间
 *
 * @param data - 创建空间请求数据
 * @returns Promise<ApiResponse<SpaceVO>> 返回创建的空间信息
 *
 * @example
 * const result = await createSpace({
 *   spaceName: '我的私人空间',
 *   spaceLevel: 0,
 *   spaceType: 0  // 0=私人空间, 1=团队空间
 * })
 */
export async function createSpace(
  data: SpaceCreateRequest
): Promise<ApiResponse<SpaceVO>> {
  return post<SpaceVO>(API_ENDPOINTS.SPACE.CREATE, data)
}

/**
 * 删除空间
 * 仅空间所有者可以删除
 *
 * @param id - 空间 ID
 * @returns Promise<ApiResponse<boolean>>
 *
 * @example
 * const result = await deleteSpace('123')
 */
export async function deleteSpace(id: string): Promise<ApiResponse<boolean>> {
  return post<boolean>(API_ENDPOINTS.SPACE.DELETE, { id })
}

/**
 * 编辑空间信息
 * 修改空间名称
 *
 * @param data - 编辑空间请求数据
 * @returns Promise<ApiResponse<boolean>>
 *
 * @example
 * const result = await editSpace({
 *   id: '123',
 *   spaceName: '新空间名称'
 * })
 */
export async function editSpace(
  data: SpaceEditRequest
): Promise<ApiResponse<boolean>> {
  return post<boolean>(API_ENDPOINTS.SPACE.EDIT, data)
}

/**
 * 根据 ID 获取空间详情
 *
 * @param id - 空间 ID
 * @returns Promise<ApiResponse<SpaceVO>>
 *
 * @example
 * const result = await getSpaceById('123')
 */
export async function getSpaceById(id: string): Promise<ApiResponse<SpaceVO>> {
  return get<SpaceVO>(`${API_ENDPOINTS.SPACE.GET_BY_ID}?id=${id}`)
}

/**
 * 获取当前用户的所有空间列表
 * 包括用户创建的空间和用户作为成员加入的空间
 *
 * @returns Promise<ApiResponse<SpaceUser[]>>
 *
 * @example
 * const result = await listMySpaces()
 * if (result.code === 0) {
 *   console.log('我的空间关系:', result.data)
 * }
 */
export async function listMySpaces(): Promise<ApiResponse<SpaceUser[]>> {
  return get<SpaceUser[]>(API_ENDPOINTS.SPACE_USER.LIST_MY_ALL_JOINED_SPACE)
}

/**
 * 获取当前用户的私人空间
 * 返回用户私人空间的详细信息
 *
 * @returns Promise<ApiResponse<SpaceVO>>
 *
 * @example
 * const result = await getMyPrivateSpace()
 * if (result.code === 0) {
 *   console.log('私人空间ID:', result.data.id)
 * }
 */
export async function getMyPrivateSpace(): Promise<ApiResponse<SpaceVO>> {
  return get<SpaceVO>(API_ENDPOINTS.SPACE.GET_MY_SPACE)
}

// ==================== 空间成员管理 API ====================

/**
 * 添加空间成员
 * 需要 spaceUser:manage 权限
 *
 * @param data - 添加成员请求数据
 * @returns Promise<ApiResponse<boolean>>
 *
 * @example
 * const result = await addSpaceUser({
 *   spaceId: '123',
 *   userId: '456',
 *   spaceRole: 'viewer'  // admin, editor, viewer
 * })
 */
export async function addSpaceUser(
  data: SpaceAddUserRequest
): Promise<ApiResponse<boolean>> {
  return post<boolean>(API_ENDPOINTS.SPACE_USER.ADD, data)
}

/**
 * 删除空间成员
 * 需要 spaceUser:manage 权限
 *
 * @param data - 删除成员请求数据
 * @returns Promise<ApiResponse<boolean>>
 *
 * @example
 * const result = await removeSpaceUser({
 *   spaceId: '123',
 *   userId: '456'
 * })
 */
export async function removeSpaceUser(
  data: GetSpaceUserRequest
): Promise<ApiResponse<boolean>> {
  return post<boolean>(API_ENDPOINTS.SPACE_USER.DELETE, data)
}

/**
 * 更新空间成员角色
 *
 * @param data - 更新成员请求数据
 * @returns Promise<ApiResponse<boolean>>
 *
 * @example
 * const result = await updateSpaceUserRole({
 *   id: '789',  // spaceUser record id
 *   spaceRole: 'editor'
 * })
 */
export async function updateSpaceUserRole(
  data: SpaceUpdateUserRequest
): Promise<ApiResponse<boolean>> {
  return post<boolean>(API_ENDPOINTS.SPACE_USER.UPDATE, data)
}

/**
 * 获取空间成员列表
 *
 * @param spaceId - 空间 ID
 * @returns Promise<ApiResponse<SpaceUserVO[]>>
 *
 * @example
 * const result = await listSpaceUsers('123')
 */
export async function listSpaceUsers(
  spaceId: string
): Promise<ApiResponse<SpaceUserVO[]>> {
  return get<SpaceUserVO[]>(`${API_ENDPOINTS.SPACE_USER.LIST}?spaceId=${spaceId}`)
}

/**
 * 获取当前用户在空间中的信息
 *
 * @param spaceId - 空间 ID
 * @param userId - 用户 ID
 * @returns Promise<ApiResponse<SpaceUserVO>>
 *
 * @example
 * const result = await getSpaceUserInfo('123', '456')
 */
export async function getSpaceUserInfo(
  spaceId: string,
  userId: string
): Promise<ApiResponse<SpaceUserVO>> {
  return get<SpaceUserVO>(
    `${API_ENDPOINTS.SPACE_USER.GET}?spaceId=${spaceId}&userId=${userId}`
  )
}
