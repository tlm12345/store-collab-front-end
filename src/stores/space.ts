/**
 * 空间状态管理 Store
 * 负责管理空间列表、当前空间、空间成员等状态
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  createSpace,
  deleteSpace,
  editSpace,
  getSpaceById,
  listMySpaces,
  addSpaceUser,
  removeSpaceUser,
  updateSpaceUserRole,
  listSpaceUsers
} from '@/api/space'
import type {
  SpaceVO,
  SpaceUser,
  SpaceUserVO,
  SpaceCreateRequest,
  SpaceEditRequest,
  SpaceAddUserRequest,
  SpaceUpdateUserRequest,
  GetSpaceUserRequest
} from '@/types/api'

export const useSpaceStore = defineStore('space', () => {
  // ========== 状态定义 ==========

  /**
   * 当前用户的所有空间列表
   */
  const userSpaces = ref<SpaceVO[]>([])

  /**
   * 当前正在查看的空间
   */
  const currentSpace = ref<SpaceVO | null>(null)

  /**
   * 当前空间的成员列表
   */
  const spaceMembers = ref<SpaceUserVO[]>([])

  /**
   * 加载状态
   */
  const loading = ref(false)

  /**
   * 错误信息
   */
  const error = ref<string | null>(null)

  // ========== 计算属性 ==========

  /**
   * 是否有空间
   */
  const hasSpaces = computed(() => userSpaces.value.length > 0)

  /**
   * 私有空间列表
   */
  const privateSpaces = computed(() =>
    userSpaces.value.filter((space) => space.spaceType === 0)
  )

  /**
   * 团队空间列表
   */
  const teamSpaces = computed(() =>
    userSpaces.value.filter((space) => space.spaceType === 1)
  )

  /**
   * 当前用户是否是空间所有者
   */
  const isSpaceOwner = computed(() => {
    // 需要在组件中传入 userId 进行比较
    return (userId: string) => currentSpace.value?.userId === userId
  })

  /**
   * 当前用户是否有管理权限
   */
  const canManageSpace = computed(() => {
    return currentSpace.value?.permissionList?.includes('spaceUser:manage') ?? false
  })

  /**
   * 当前用户是否可以上传图片
   */
  const canUploadPicture = computed(() => {
    return currentSpace.value?.permissionList?.includes('picture:upload') ?? false
  })

  // ========== 方法定义 ==========

  /**
   * 加载当前用户的所有空间
   * 流程：1. 获取用户的空间关系列表 2. 获取每个空间的详情
   */
  async function loadUserSpaces(): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      // Step 1: Get user's space relationships (SpaceUser[])
      const response = await listMySpaces()

      if (response.code === 0 && response.data) {
        const spaceUsers = response.data

        // Handle empty space list
        if (spaceUsers.length === 0) {
          userSpaces.value = []
          return true
        }

        // Step 2: Extract unique space IDs
        const spaceIds = [...new Set(spaceUsers.map((su: SpaceUser) => su.spaceId))]

        // Step 3: Fetch full space details for each space ID
        const spacePromises = spaceIds.map(async (spaceId: string) => {
          try {
            const spaceResponse = await getSpaceById(spaceId)
            if (spaceResponse.code === 0 && spaceResponse.data) {
              return spaceResponse.data
            }
            return null
          } catch (err) {
            console.error(`Failed to fetch space ${spaceId}:`, err)
            return null
          }
        })

        // Step 4: Wait for all requests and filter out failures
        const spaces = (await Promise.all(spacePromises)).filter(
          (s): s is SpaceVO => s !== null
        )

        userSpaces.value = spaces
        return true
      } else {
        error.value = response.message || '获取空间列表失败'
        return false
      }
    } catch (err: any) {
      error.value = err.message || '获取空间列表失败'
      console.error('获取空间列表失败:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载空间详情
   */
  async function loadSpaceDetail(spaceId: string): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      const response = await getSpaceById(spaceId)

      if (response.code === 0 && response.data) {
        currentSpace.value = response.data
        return true
      } else {
        error.value = response.message || '获取空间详情失败'
        return false
      }
    } catch (err: any) {
      error.value = err.message || '获取空间详情失败'
      console.error('获取空间详情失败:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 创建新空间
   */
  async function createNewSpace(data: SpaceCreateRequest): Promise<SpaceVO | null> {
    try {
      loading.value = true
      error.value = null

      const response = await createSpace(data)

      if (response.code === 0 && response.data) {
        // 添加到空间列表
        userSpaces.value.push(response.data)
        return response.data
      } else {
        error.value = response.message || '创建空间失败'
        return null
      }
    } catch (err: any) {
      error.value = err.message || '创建空间失败'
      console.error('创建空间失败:', err)
      return null
    } finally {
      loading.value = false
    }
  }

  /**
   * 删除空间
   */
  async function deleteSpaceById(spaceId: string): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      const response = await deleteSpace(spaceId)

      if (response.code === 0) {
        // 从列表中移除
        userSpaces.value = userSpaces.value.filter((s) => s.id !== spaceId)
        // 如果删除的是当前空间，清空当前空间
        if (currentSpace.value?.id === spaceId) {
          currentSpace.value = null
        }
        return true
      } else {
        error.value = response.message || '删除空间失败'
        return false
      }
    } catch (err: any) {
      error.value = err.message || '删除空间失败'
      console.error('删除空间失败:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 编辑空间信息
   */
  async function updateSpace(data: SpaceEditRequest): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      const response = await editSpace(data)

      if (response.code === 0) {
        // 更新本地数据
        const space = userSpaces.value.find((s) => s.id === data.id)
        if (space) {
          space.spaceName = data.spaceName
        }
        if (currentSpace.value?.id === data.id) {
          currentSpace.value.spaceName = data.spaceName
        }
        return true
      } else {
        error.value = response.message || '编辑空间失败'
        return false
      }
    } catch (err: any) {
      error.value = err.message || '编辑空间失败'
      console.error('编辑空间失败:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 加载空间成员列表
   */
  async function loadSpaceMembers(spaceId: string): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      const response = await listSpaceUsers(spaceId)

      if (response.code === 0 && response.data) {
        spaceMembers.value = response.data
        return true
      } else {
        error.value = response.message || '获取成员列表失败'
        return false
      }
    } catch (err: any) {
      error.value = err.message || '获取成员列表失败'
      console.error('获取成员列表失败:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 添加空间成员
   */
  async function addMember(data: SpaceAddUserRequest): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      const response = await addSpaceUser(data)

      if (response.code === 0) {
        // 重新加载成员列表
        await loadSpaceMembers(data.spaceId)
        return true
      } else {
        error.value = response.message || '添加成员失败'
        return false
      }
    } catch (err: any) {
      error.value = err.message || '添加成员失败'
      console.error('添加成员失败:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 移除空间成员
   */
  async function removeMember(spaceId: string, userId: string): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      const data: GetSpaceUserRequest = { spaceId, userId }
      const response = await removeSpaceUser(data)

      if (response.code === 0) {
        // 从列表中移除
        spaceMembers.value = spaceMembers.value.filter(
          (m) => !(m.spaceId === spaceId && m.userId === userId)
        )
        return true
      } else {
        error.value = response.message || '移除成员失败'
        return false
      }
    } catch (err: any) {
      error.value = err.message || '移除成员失败'
      console.error('移除成员失败:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 更新成员角色
   */
  async function updateMemberRole(data: SpaceUpdateUserRequest): Promise<boolean> {
    try {
      loading.value = true
      error.value = null

      const response = await updateSpaceUserRole(data)

      if (response.code === 0) {
        // 更新本地数据
        const member = spaceMembers.value.find((m) => m.id === data.id)
        if (member) {
          member.spaceRole = data.spaceRole
        }
        return true
      } else {
        error.value = response.message || '更新角色失败'
        return false
      }
    } catch (err: any) {
      error.value = err.message || '更新角色失败'
      console.error('更新角色失败:', err)
      return false
    } finally {
      loading.value = false
    }
  }

  /**
   * 清除错误信息
   */
  function clearError() {
    error.value = null
  }

  /**
   * 重置状态
   */
  function resetState() {
    userSpaces.value = []
    currentSpace.value = null
    spaceMembers.value = []
    loading.value = false
    error.value = null
  }

  // ========== 导出 ==========

  return {
    // 状态
    userSpaces,
    currentSpace,
    spaceMembers,
    loading,
    error,
    // 计算属性
    hasSpaces,
    privateSpaces,
    teamSpaces,
    isSpaceOwner,
    canManageSpace,
    canUploadPicture,
    // 方法
    loadUserSpaces,
    loadSpaceDetail,
    createNewSpace,
    deleteSpaceById,
    updateSpace,
    loadSpaceMembers,
    addMember,
    removeMember,
    updateMemberRole,
    clearError,
    resetState
  }
})
