<script setup lang="ts">
/**
 * 空间详情页面
 * 展示空间内的图片、成员列表，支持上传和管理
 */

import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useSpaceStore } from '@/stores/space'
import { listPictureByPage, uploadPictureByFile } from '@/api/picture'
import type { PictureVO, PictureQueryRequest, SpaceUserVO } from '@/types/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

// ========== 状态定义 ==========

// 空间ID
const spaceId = computed(() => route.params.id as string)

// 图片列表
const pictures = ref<PictureVO[]>([])
const picturesLoading = ref(false)
const picturesTotal = ref(0)
const currentPage = ref(1)
const pageSize = ref(12)

// 成员管理
const showMemberModal = ref(false)
const showAddMemberModal = ref(false)
const newMemberId = ref('')
const newMemberRole = ref<'viewer' | 'editor'>('viewer')
const addingMember = ref(false)
const removingMember = ref<string | null>(null)
const updatingRole = ref<string | null>(null)

// 上传
const uploadInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)

// 编辑空间名称
const editingName = ref(false)
const newSpaceName = ref('')
const updatingName = ref(false)

// ========== 计算属性 ==========

const isAdmin = computed(() => userStore.user?.role === 'admin')

const isSpaceOwner = computed(() => {
  return spaceStore.currentSpace?.userId === userStore.user?.id
})

const canManageMembers = computed(() => {
  return spaceStore.canManageSpace || isSpaceOwner.value
})

const canUpload = computed(() => {
  return spaceStore.canUploadPicture || isSpaceOwner.value
})

const isTeamSpace = computed(() => {
  return spaceStore.currentSpace?.spaceType === 1
})

// ========== 方法定义 ==========

/**
 * 加载空间详情和成员
 */
async function loadSpaceData() {
  await Promise.all([
    spaceStore.loadSpaceDetail(spaceId.value),
    spaceStore.loadSpaceMembers(spaceId.value)
  ])
  newSpaceName.value = spaceStore.currentSpace?.spaceName || ''
}

/**
 * 加载图片列表
 */
async function loadPictures() {
  try {
    picturesLoading.value = true
    const query: PictureQueryRequest = {
      spaceId: spaceId.value,
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }
    const response = await listPictureByPage(query)
    if (response.code === 0 && response.data) {
      pictures.value = response.data.records
      picturesTotal.value = response.data.total
    }
  } catch (error) {
    console.error('加载图片失败:', error)
  } finally {
    picturesLoading.value = false
  }
}

/**
 * 返回空间管理页面
 */
function goBack() {
  router.push('/space-management')
}

/**
 * 前往图库
 */
function goToGallery() {
  router.push('/gallery')
}

/**
 * 前往管理后台
 */
function goToAdmin() {
  router.push('/admin')
}

/**
 * 处理退出登录
 */
async function handleLogout() {
  await userStore.logout()
  spaceStore.resetState()
  router.push('/')
}

/**
 * 查看图片详情
 */
function viewImage(pictureId: string) {
  router.push(`/gallery/${pictureId}`)
}

/**
 * 触发文件上传
 */
function triggerUpload() {
  uploadInput.value?.click()
}

/**
 * 处理文件上传
 */
async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  uploading.value = true
  try {
    const response = await uploadPictureByFile(file, {
      spaceId: spaceId.value
    })
    if (response.code === 0 && response.data) {
      // 刷新图片列表和空间信息
      await Promise.all([loadPictures(), spaceStore.loadSpaceDetail(spaceId.value)])
      alert('上传成功！')
    } else {
      alert(response.message || '上传失败')
    }
  } catch (error) {
    console.error('上传失败:', error)
    alert('上传失败，请重试')
  } finally {
    uploading.value = false
    input.value = ''
  }
}

/**
 * 更新空间名称
 */
async function handleUpdateName() {
  if (!newSpaceName.value.trim()) {
    alert('空间名称不能为空')
    return
  }
  if (newSpaceName.value === spaceStore.currentSpace?.spaceName) {
    editingName.value = false
    return
  }

  updatingName.value = true
  const success = await spaceStore.updateSpace({
    id: spaceId.value,
    spaceName: newSpaceName.value.trim()
  })
  updatingName.value = false

  if (success) {
    editingName.value = false
  } else {
    alert(spaceStore.error || '更新失败')
  }
}

/**
 * 添加成员
 */
async function handleAddMember() {
  if (!newMemberId.value.trim()) {
    alert('请输入用户ID')
    return
  }

  addingMember.value = true
  const success = await spaceStore.addMember({
    spaceId: spaceId.value,
    userId: newMemberId.value.trim(),
    spaceRole: newMemberRole.value
  })
  addingMember.value = false

  if (success) {
    showAddMemberModal.value = false
    newMemberId.value = ''
    newMemberRole.value = 'viewer'
  } else {
    alert(spaceStore.error || '添加成员失败')
  }
}

/**
 * 移除成员
 */
async function handleRemoveMember(userId: string) {
  if (!confirm('确定要移除该成员吗？')) return

  removingMember.value = userId
  const success = await spaceStore.removeMember(spaceId.value, userId)
  removingMember.value = null

  if (!success) {
    alert(spaceStore.error || '移除成员失败')
  }
}

/**
 * 更新成员角色
 */
async function handleUpdateMemberRole(member: SpaceUserVO, newRole: 'admin' | 'editor' | 'viewer') {
  if (!member.id) return

  updatingRole.value = member.id
  const success = await spaceStore.updateMemberRole({
    id: member.id,
    spaceRole: newRole
  })
  updatingRole.value = null

  if (!success) {
    alert(spaceStore.error || '更新角色失败')
  }
}

/**
 * 格式化文件大小
 */
function formatFileSize(bytes?: number): string {
  if (!bytes) return '0 B'
  const units = ['B', 'KB', 'MB', 'GB']
  let size = bytes
  let unitIndex = 0
  while (size >= 1024 && unitIndex < units.length - 1) {
    size /= 1024
    unitIndex++
  }
  return `${size.toFixed(2)} ${units[unitIndex]}`
}

/**
 * 获取容量使用率
 */
function getUsagePercent(used?: number, max?: number): number {
  if (!used || !max || max === 0) return 0
  return Math.min((used / max) * 100, 100)
}

/**
 * 解析标签
 */
function parseTags(tagsStr?: string): string[] {
  if (!tagsStr) return []
  try {
    return JSON.parse(tagsStr)
  } catch {
    return []
  }
}

// ========== 生命周期 ==========

onMounted(() => {
  loadSpaceData()
  loadPictures()
})

// 监听路由变化，重新加载数据
watch(() => route.params.id, () => {
  loadSpaceData()
  loadPictures()
})
</script>

<template>
  <div class="space-detail-page">
    <!-- 顶部导航 -->
    <header class="page-header">
      <div class="header-content">
        <div class="header-left">
          <button class="btn btn-ghost" @click="goBack">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            空间管理
          </button>
        </div>
        <div class="header-right">
          <button class="btn btn-ghost" @click="goToGallery">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            图库
          </button>
          <button v-if="isAdmin" class="btn btn-ghost" @click="goToAdmin">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <line x1="3" y1="9" x2="21" y2="9"></line>
              <line x1="9" y1="21" x2="9" y2="9"></line>
            </svg>
            管理后台
          </button>
          <span class="user-name">{{ userStore.user?.displayName }}</span>
          <button class="btn btn-ghost" @click="handleLogout">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
              <polyline points="16 17 21 12 16 7"></polyline>
              <line x1="21" y1="12" x2="9" y2="12"></line>
            </svg>
            退出
          </button>
        </div>
      </div>
    </header>

    <!-- 加载状态 -->
    <div v-if="spaceStore.loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 空间内容 -->
    <div v-else-if="spaceStore.currentSpace" class="page-content">
      <!-- 左侧边栏 -->
      <aside class="sidebar">
        <!-- 空间信息卡片 -->
        <div class="card space-info-card">
          <div class="space-header">
            <div class="space-icon" :class="isTeamSpace ? 'team' : 'private'">
              <svg v-if="isTeamSpace" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <svg v-else viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div class="space-title">
              <div v-if="editingName" class="name-edit">
                <input v-model="newSpaceName" type="text" @keyup.enter="handleUpdateName" />
                <button class="btn-icon" @click="handleUpdateName" :disabled="updatingName">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="20 6 9 17 4 12"></polyline>
                  </svg>
                </button>
                <button class="btn-icon" @click="editingName = false">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <line x1="18" y1="6" x2="6" y2="18"></line>
                    <line x1="6" y1="6" x2="18" y2="18"></line>
                  </svg>
                </button>
              </div>
              <template v-else>
                <h1>{{ spaceStore.currentSpace.spaceName }}</h1>
                <button v-if="isSpaceOwner" class="btn-icon" @click="editingName = true">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
              </template>
            </div>
          </div>

          <span class="space-type-badge" :class="isTeamSpace ? 'team' : 'private'">
            {{ isTeamSpace ? '团队空间' : '私人空间' }}
          </span>

          <div class="capacity-section">
            <div class="capacity-info">
              <span>容量使用</span>
              <span>{{ formatFileSize(spaceStore.currentSpace.spaceSizeUsed) }} / {{ formatFileSize(spaceStore.currentSpace.spaceMaxSize) }}</span>
            </div>
            <div class="capacity-bar">
              <div
                class="capacity-fill"
                :style="{ width: `${getUsagePercent(spaceStore.currentSpace.spaceSizeUsed, spaceStore.currentSpace.spaceMaxSize)}%` }"
              ></div>
            </div>
          </div>

          <div class="stats-row">
            <div class="stat">
              <span class="stat-value">{{ spaceStore.currentSpace.spaceTotalCount || 0 }}</span>
              <span class="stat-label">图片</span>
            </div>
            <div class="stat">
              <span class="stat-value">{{ spaceStore.spaceMembers.length }}</span>
              <span class="stat-label">成员</span>
            </div>
          </div>
        </div>

        <!-- 成员列表 -->
        <div class="card members-card">
          <div class="card-header">
            <h3>成员</h3>
            <button v-if="canManageMembers && isTeamSpace" class="btn btn-sm" @click="showAddMemberModal = true">
              + 添加
            </button>
          </div>
          <div class="members-list">
            <div v-for="member in spaceStore.spaceMembers" :key="member.id" class="member-item">
              <div class="member-avatar">
                {{ member.userVO?.userName?.charAt(0) || '?' }}
              </div>
              <div class="member-info">
                <span class="member-name">{{ member.userVO?.userName || '未知用户' }}</span>
                <span class="member-role">{{ member.spaceRole }}</span>
              </div>
              <button
                v-if="canManageMembers && member.userId !== userStore.user?.id"
                class="btn-remove"
                @click="handleRemoveMember(member.userId)"
                :disabled="removingMember === member.userId"
              >
                {{ removingMember === member.userId ? '...' : '移除' }}
              </button>
            </div>
          </div>
          <button v-if="spaceStore.spaceMembers.length > 3" class="btn-view-all" @click="showMemberModal = true">
            查看全部
          </button>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="main-content">
        <!-- 工具栏 -->
        <div class="toolbar">
          <h2>图片</h2>
          <button v-if="canUpload" class="btn btn-primary" @click="triggerUpload" :disabled="uploading">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="12" y1="5" x2="12" y2="19"></line>
              <line x1="5" y1="12" x2="19" y2="12"></line>
            </svg>
            {{ uploading ? '上传中...' : '上传图片' }}
          </button>
          <input
            ref="uploadInput"
            type="file"
            accept="image/*"
            style="display: none"
            @change="handleFileUpload"
          />
        </div>

        <!-- 图片列表 -->
        <div v-if="picturesLoading" class="loading-state">
          <div class="spinner"></div>
          <p>加载图片...</p>
        </div>

        <div v-else-if="pictures.length === 0" class="empty-state">
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <p>暂无图片</p>
          <p v-if="canUpload" class="empty-hint">点击"上传图片"按钮添加图片</p>
        </div>

        <div v-else class="picture-grid">
          <div
            v-for="picture in pictures"
            :key="picture.id"
            class="picture-card"
            @click="viewImage(picture.id)"
          >
            <div class="picture-thumb">
              <img :src="picture.url" :alt="picture.name" loading="lazy" />
            </div>
            <div class="picture-info">
              <h4 class="picture-name">{{ picture.name }}</h4>
              <div class="picture-meta">
                <span v-if="picture.category" class="meta-tag">{{ picture.category }}</span>
                <span class="meta-tag">{{ picture.picFormat?.toUpperCase() }}</span>
              </div>
              <div v-if="parseTags(picture.tags).length > 0" class="picture-tags">
                <span v-for="tag in parseTags(picture.tags).slice(0, 2)" :key="tag" class="tag">
                  {{ tag }}
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="pictures.length > 0" class="pagination">
          <span>共 {{ picturesTotal }} 张</span>
          <div class="page-controls">
            <button
              :disabled="currentPage === 1"
              @click="currentPage--; loadPictures()"
            >
              上一页
            </button>
            <span>{{ currentPage }}</span>
            <button
              :disabled="currentPage * pageSize >= picturesTotal"
              @click="currentPage++; loadPictures()"
            >
              下一页
            </button>
          </div>
        </div>
      </main>
    </div>

    <!-- 成员管理弹窗 -->
    <div v-if="showMemberModal" class="modal-overlay" @click.self="showMemberModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>空间成员</h3>
          <button class="btn-close" @click="showMemberModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="members-list-modal">
            <div v-for="member in spaceStore.spaceMembers" :key="member.id" class="member-item-modal">
              <div class="member-avatar">{{ member.userVO?.userName?.charAt(0) || '?' }}</div>
              <div class="member-info">
                <span class="member-name">{{ member.userVO?.userName || '未知用户' }}</span>
                <span class="member-account">{{ member.userVO?.userAccount }}</span>
              </div>
              <select
                v-if="canManageMembers && member.userId !== userStore.user?.id"
                :value="member.spaceRole"
                @change="handleUpdateMemberRole(member, ($event.target as HTMLSelectElement).value as 'admin' | 'editor' | 'viewer')"
                :disabled="updatingRole === member.id"
              >
                <option value="admin">管理员</option>
                <option value="editor">编辑者</option>
                <option value="viewer">浏览者</option>
              </select>
              <span v-else class="role-badge">{{ member.spaceRole }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 添加成员弹窗 -->
    <div v-if="showAddMemberModal" class="modal-overlay" @click.self="showAddMemberModal = false">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h3>添加成员</h3>
          <button class="btn-close" @click="showAddMemberModal = false">×</button>
        </div>
        <div class="modal-body">
          <div class="form-group">
            <label>用户ID</label>
            <input v-model="newMemberId" type="text" placeholder="请输入用户ID" />
          </div>
          <div class="form-group">
            <label>角色</label>
            <select v-model="newMemberRole">
              <option value="editor">编辑者 - 可上传、编辑、删除图片</option>
              <option value="viewer">浏览者 - 仅可查看</option>
            </select>
          </div>
        </div>
        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showAddMemberModal = false">取消</button>
          <button
            class="btn btn-primary"
            :disabled="!newMemberId.trim() || addingMember"
            @click="handleAddMember"
          >
            {{ addingMember ? '添加中...' : '添加' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
.space-detail-page {
  min-height: 100vh;
  background: #f5f7fa;
}

.page-header {
  background: white;
  border-bottom: 1px solid #e5e7eb;
  position: sticky;
  top: 0;
  z-index: 100;
}

.header-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 1rem 2rem;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-name {
  font-weight: 500;
  color: #374151;
}

.btn {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
  border: none;
}

.btn-ghost {
  background: transparent;
  color: #6b7280;
}

.btn-ghost:hover {
  background: #f3f4f6;
  color: #374151;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-sm {
  padding: 0.25rem 0.75rem;
  font-size: 0.75rem;
}

.icon {
  width: 18px;
  height: 18px;
}

.loading-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: 60vh;
  gap: 1rem;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f4f6;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

.page-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
}

.sidebar {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.space-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1rem;
}

.space-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.space-icon.private {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.space-icon.team {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.space-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.space-title {
  flex: 1;
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.space-title h1 {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

.name-edit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  flex: 1;
}

.name-edit input {
  flex: 1;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 6px;
  font-size: 1rem;
}

.btn-icon {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-icon:hover {
  background: #e5e7eb;
}

.btn-icon svg {
  width: 16px;
  height: 16px;
}

.space-type-badge {
  display: inline-block;
  padding: 0.25rem 0.75rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 500;
}

.space-type-badge.private {
  background: #dbeafe;
  color: #2563eb;
}

.space-type-badge.team {
  background: #ede9fe;
  color: #7c3aed;
}

.capacity-section {
  margin-top: 1.5rem;
}

.capacity-info {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.capacity-bar {
  height: 8px;
  background: #e5e7eb;
  border-radius: 4px;
  overflow: hidden;
}

.capacity-fill {
  height: 100%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 4px;
  transition: width 0.3s ease;
}

.stats-row {
  display: flex;
  gap: 2rem;
  margin-top: 1.5rem;
  padding-top: 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.stat {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1rem;
}

.card-header h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #374151;
  margin: 0;
}

.members-list {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.member-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.member-avatar {
  width: 36px;
  height: 36px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.875rem;
  font-weight: 600;
}

.member-info {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.member-name {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.member-role {
  font-size: 0.75rem;
  color: #9ca3af;
  text-transform: capitalize;
}

.btn-remove {
  padding: 0.25rem 0.5rem;
  background: #fee2e2;
  color: #ef4444;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  cursor: pointer;
}

.btn-view-all {
  width: 100%;
  margin-top: 1rem;
  padding: 0.5rem;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #6b7280;
  cursor: pointer;
}

.main-content {
  min-width: 0;
}

.toolbar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
}

.toolbar h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
}

.empty-icon {
  width: 64px;
  height: 64px;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-hint {
  color: #9ca3af;
  font-size: 0.875rem;
}

.picture-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
  gap: 1.5rem;
}

.picture-card {
  background: white;
  border-radius: 12px;
  overflow: hidden;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.picture-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.picture-thumb {
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #f3f4f6;
}

.picture-thumb img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.picture-info {
  padding: 1rem;
}

.picture-name {
  font-size: 0.875rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picture-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.meta-tag {
  padding: 0.125rem 0.375rem;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #6b7280;
}

.picture-tags {
  display: flex;
  gap: 0.25rem;
  flex-wrap: wrap;
}

.tag {
  padding: 0.125rem 0.375rem;
  background: #ede9fe;
  color: #7c3aed;
  border-radius: 4px;
  font-size: 0.75rem;
}

.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
}

.page-controls {
  display: flex;
  gap: 0.5rem;
}

.page-controls button {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: none;
  border-radius: 6px;
  cursor: pointer;
}

.page-controls button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.modal-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 200;
  padding: 1rem;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 480px;
  max-height: 90vh;
  overflow: auto;
}

.modal-small {
  max-width: 400px;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.modal-header h3 {
  margin: 0;
  font-size: 1.125rem;
  font-weight: 600;
}

.btn-close {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: #f3f4f6;
  color: #6b7280;
  font-size: 1.5rem;
  cursor: pointer;
}

.modal-body {
  padding: 1.5rem;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 1rem;
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
}

.members-list-modal {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

.member-item-modal {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 0.75rem;
  background: #f9fafb;
  border-radius: 8px;
}

.member-account {
  font-size: 0.75rem;
  color: #9ca3af;
}

.role-badge {
  padding: 0.25rem 0.75rem;
  background: #e5e7eb;
  border-radius: 4px;
  font-size: 0.75rem;
  text-transform: capitalize;
}

.form-group {
  margin-bottom: 1rem;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group input,
.form-group select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9375rem;
}

@media (max-width: 968px) {
  .page-content {
    grid-template-columns: 1fr;
  }

  .sidebar {
    order: 2;
  }

  .user-name {
    display: none;
  }
}

@media (max-width: 640px) {
  .picture-grid {
    grid-template-columns: repeat(2, 1fr);
    gap: 1rem;
  }
}
</style>
