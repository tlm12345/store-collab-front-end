/**
 * 图片管理相关 API
 * 封装管理员图片管理功能的接口调用
 */

import { API_ENDPOINTS } from '@/config/api'
import { post, get } from '@/utils/http'
import type {
  ApiResponse,
  Picture,
  PictureVO,
  PictureUpdateRequest,
  PictureEditRequest,
  PictureQueryRequest,
  UploadPictureRequest,
  PictureTagCategory,
  PageResponse,
  DeleteRequest
} from '@/types/api'

/**
 * 通过 URL 上传图片
 * 管理员通过图片 URL 上传图片
 *
 * @param data - 上传图片请求数据
 * @returns Promise<ApiResponse<PictureVO>> 返回上传的图片信息
 *
 * @example
 * const result = await uploadPictureByUrl({
 *   url: 'https://example.com/image.jpg',
 *   name: '示例图片',
 *   introduction: '这是一张示例图片',
 *   category: '风景',
 *   tags: ['自然', '风景']
 * })
 */
export async function uploadPictureByUrl(
  data: UploadPictureRequest
): Promise<ApiResponse<PictureVO>> {
  return post<PictureVO>(API_ENDPOINTS.PICTURE.UPLOAD_URL, data)
}

/**
 * 通过文件上传图片
 * 管理员通过 multipart/form-data 上传图片文件
 *
 * @param file - 图片文件
 * @param params - 其他上传参数
 * @returns Promise<ApiResponse<PictureVO>> 返回上传的图片信息
 *
 * @example
 * const fileInput = document.getElementById('file') as HTMLInputElement
 * const file = fileInput.files![0]
 * const result = await uploadPictureByFile(file, {
 *   name: '示例图片',
 *   category: '风景'
 * })
 */
export async function uploadPictureByFile(
  file: File,
  params?: Omit<UploadPictureRequest, 'url'>
): Promise<ApiResponse<PictureVO>> {
  const formData = new FormData()
  formData.append('file', file)

  if (params) {
    if (params.name) formData.append('name', params.name)
    if (params.introduction) formData.append('introduction', params.introduction)
    if (params.category) formData.append('category', params.category)
    if (params.tags) formData.append('tags', JSON.stringify(params.tags))
    if (params.spaceId) formData.append('spaceId', params.spaceId)
    if (params.id) formData.append('id', params.id)
  }

  return post<PictureVO>(API_ENDPOINTS.PICTURE.UPLOAD, formData)
}

/**
 * 删除图片
 * 根据 ID 删除图片（需要空间权限、所有者或管理员权限）
 *
 * @param id - 图片 ID
 * @returns Promise<ApiResponse<boolean>>
 *
 * @example
 * const result = await deletePicture('123')
 */
export async function deletePicture(id: string): Promise<ApiResponse<boolean>> {
  return post<boolean>(API_ENDPOINTS.PICTURE.DELETE, { id } as DeleteRequest)
}

/**
 * 根据 ID 获取图片信息
 *
 * @param id - 图片 ID
 * @returns Promise<ApiResponse<PictureVO>>
 *
 * @example
 * const result = await getPictureById('123')
 */
export async function getPictureById(id: string): Promise<ApiResponse<PictureVO>> {
  return get<PictureVO>(`${API_ENDPOINTS.PICTURE.GET_BY_ID}?id=${id}`)
}

/**
 * 分页查询图片列表
 * 支持多条件组合查询
 *
 * @param data - 查询条件
 * @returns Promise<ApiResponse<PageResponse<PictureVO>>>
 *
 * @example
 * const result = await listPictureByPage({
 *   searchText: '风景',
 *   category: '自然',
 *   current: 1,
 *   pageSize: 10
 * })
 */
export async function listPictureByPage(
  data: PictureQueryRequest
): Promise<ApiResponse<PageResponse<PictureVO>>> {
  return post<PageResponse<PictureVO>>(API_ENDPOINTS.PICTURE.LIST_PAGE, data)
}

/**
 * 管理员分页查询图片列表
 * 管理员专用接口，返回完整的 Picture 实体数据
 *
 * @param data - 查询条件
 * @returns Promise<ApiResponse<PageResponse<Picture>>>
 *
 * @example
 * const result = await listPictureByPageForAdmin({
 *   searchText: '风景',
 *   category: '自然',
 *   current: 1,
 *   pageSize: 10
 * })
 */
export async function listPictureByPageForAdmin(
  data: PictureQueryRequest
): Promise<ApiResponse<PageResponse<Picture>>> {
  return post<PageResponse<Picture>>(API_ENDPOINTS.PICTURE.ADMIN_LIST_PAGE, data)
}

/**
 * 更新图片（管理员）
 * 管理员更新图片信息，包括审核状态
 *
 * @param data - 更新图片请求数据
 * @returns Promise<ApiResponse<boolean>>
 *
 * @example
 * const result = await updatePicture({
 *   id: '123',
 *   name: '新名称',
 *   viewStatus: 1,
 *   viewMessage: '审核通过'
 * })
 */
export async function updatePicture(
  data: PictureUpdateRequest
): Promise<ApiResponse<boolean>> {
  return post<boolean>(API_ENDPOINTS.PICTURE.UPDATE, data)
}

/**
 * 编辑图片（所有者或管理员）
 * 编辑图片的基本信息
 *
 * @param data - 编辑图片请求数据
 * @returns Promise<ApiResponse<boolean>>
 *
 * @example
 * const result = await editPicture({
 *   id: '123',
 *   name: '新名称',
 *   category: '新分类'
 * })
 */
export async function editPicture(
  data: PictureEditRequest
): Promise<ApiResponse<boolean>> {
  return post<boolean>(API_ENDPOINTS.PICTURE.EDIT, data)
}

/**
 * 获取图片标签和分类列表
 * 获取所有可用的标签和分类
 *
 * @returns Promise<ApiResponse<PictureTagCategory>>
 *
 * @example
 * const result = await getPictureTagCategory()
 * if (result.code === 0) {
 *   console.log('标签:', result.data.tags)
 *   console.log('分类:', result.data.categories)
 * }
 */
export async function getPictureTagCategory(): Promise<ApiResponse<PictureTagCategory>> {
  return get<PictureTagCategory>(API_ENDPOINTS.PICTURE.GET_TAG_CATEGORY)
}
