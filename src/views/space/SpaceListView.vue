<script setup lang="ts">
/**
 * 空间列表页面
 * 展示用户创建和加入的所有空间，支持创建、删除、进入空间
 */

import { ref, computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { useSpaceStore } from '@/stores/space'
import type { SpaceCreateRequest } from '@/types/api'

const router = useRouter()
const userStore = useUserStore()
const spaceStore = useSpaceStore()

// ========== 状态定义 ==========

// 创建空间弹窗
const showCreateModal = ref(false)
const creating = ref(false)

// 创建表单
const createForm = ref<SpaceCreateRequest>({
  spaceName: '',
  spaceType: 0,
  spaceLevel: 0
})

// 删除确认
const showDeleteConfirm = ref(false)
const spaceToDelete = ref<string | null>(null)
const deleting = ref(false)

// 空间类型选项
const spaceTypeOptions = [
  { value: 0, label: '私人空间', description: '仅自己可访问的个人存储空间' },
  { value: 1, label: '团队空间', description: '可与团队成员协作的共享空间' }
]

// 空间等级选项
const spaceLevelOptions = [
  { value: 0, label: '普通版', description: '100MB / 100张', disabled: false },
  { value: 1, label: '专业版', description: '500MB / 500张', disabled: true },
  { value: 2, label: '旗舰版', description: '1GB / 1000张', disabled: true }
]

// ========== 计算属性 ==========

const isAdmin = computed(() => userStore.user?.role === 'admin')

const hasSpaces = computed(() => spaceStore.userSpaces.length > 0)

// 按类型分组的空间
const privateSpaces = computed(() =>
  spaceStore.userSpaces.filter((s) => s.spaceType === 0)
)

const teamSpaces = computed(() =>
  spaceStore.userSpaces.filter((s) => s.spaceType === 1)
)

// ========== 方法定义 ==========

/**
 * 加载用户空间列表
 */
async function loadSpaces() {
  await spaceStore.loadUserSpaces()
}

/**
 * 进入空间详情
 */
function enterSpace(spaceId: string) {
  router.push(`/space/${spaceId}`)
}

/**
 * 打开创建空间弹窗
 */
function openCreateModal() {
  createForm.value = {
    spaceName: '',
    spaceType: 0,
    spaceLevel: 0
  }
  showCreateModal.value = true
}

/**
 * 创建空间
 */
async function handleCreateSpace() {
  if (!createForm.value.spaceName.trim()) {
    alert('请输入空间名称')
    return
  }

  creating.value = true
  const space = await spaceStore.createNewSpace(createForm.value)
  creating.value = false

  if (space) {
    showCreateModal.value = false
    // 询问是否立即进入空间
    if (confirm('空间创建成功！是否立即进入？')) {
      enterSpace(space.id)
    }
  } else {
    alert(spaceStore.error || '创建空间失败')
  }
}

/**
 * 确认删除空间
 */
function confirmDeleteSpace(spaceId: string, spaceName: string) {
  spaceToDelete.value = spaceId
  showDeleteConfirm.value = true
}

/**
 * 删除空间
 */
async function handleDeleteSpace() {
  if (!spaceToDelete.value) return

  deleting.value = true
  const success = await spaceStore.deleteSpaceById(spaceToDelete.value)
  deleting.value = false
  showDeleteConfirm.value = false

  if (!success) {
    alert(spaceStore.error || '删除空间失败')
  }
}

/**
 * 返回图库
 */
function goToGallery() {
  router.push('/gallery')
}

/**
 * 跳转到管理后台
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
 * 计算容量使用率百分比
 */
function getUsagePercent(used?: number, max?: number): number {
  if (!used || !max || max === 0) return 0
  return Math.min((used / max) * 100, 100)
}

/**
 * 获取容量使用率颜色
 */
function getUsageColor(percent: number): string {
  if (percent < 70) return '#10b981' // green
  if (percent < 90) return '#f59e0b' // yellow
  return '#ef4444' // red
}

/**
 * 检查是否是空间所有者
 */
function isOwner(space: { userId?: string }): boolean {
  return space.userId === userStore.user?.id
}

// ========== 生命周期 ==========

onMounted(() => {
  loadSpaces()
})
</script>

<template>
  <div class="space-list-page">
    <!-- 顶部导航栏 -->
    <header class="page-header">
      <div class="header-content">
        <div class="logo-section">
          <button class="btn btn-ghost" @click="goToGallery">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="19" y1="12" x2="5" y2="12"></line>
              <polyline points="12 19 5 12 12 5"></polyline>
            </svg>
            图库
          </button>
          <span class="header-divider">/</span>
          <h1 class="page-title">我的空间</h1>
        </div>

        <div class="header-actions">
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

    <!-- 主体内容 -->
    <main class="main-content">
      <div class="content-header">
        <h2>我的空间</h2>
        <button class="btn btn-primary" @click="openCreateModal">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="12" y1="5" x2="12" y2="19"></line>
            <line x1="5" y1="12" x2="19" y2="12"></line>
          </svg>
          创建空间
        </button>
      </div>

      <!-- 加载状态 -->
      <div v-if="spaceStore.loading" class="loading-state">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>

      <!-- 空状态 -->
      <div v-else-if="!hasSpaces" class="empty-state">
        <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
          <circle cx="8.5" cy="8.5" r="1.5"></circle>
          <polyline points="21 15 16 10 5 21"></polyline>
        </svg>
        <h3>还没有空间</h3>
        <p>创建一个私人空间或团队空间来存储和管理您的图片</p>
        <button class="btn btn-primary btn-large" @click="openCreateModal">创建空间</button>
      </div>

      <!-- 空间列表 -->
      <div v-else class="space-list">
        <!-- 私人空间 -->
        <section v-if="privateSpaces.length > 0" class="space-section">
          <h3 class="section-title">
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
              <circle cx="12" cy="7" r="4"></circle>
            </svg>
            私人空间
          </h3>
          <div class="space-grid">
            <div
              v-for="space in privateSpaces"
              :key="space.id"
              class="space-card"
              @click="enterSpace(space.id)"
            >
              <div class="space-card-header">
                <div class="space-icon private">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </div>
                <div class="space-info">
                  <h4 class="space-name">{{ space.spaceName }}</h4>
                  <span class="space-type-badge private">私人</span>
                </div>
                <button
                  v-if="isOwner(space)"
                  class="btn-delete"
                  @click.stop="confirmDeleteSpace(space.id, space.spaceName)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>

              <div class="space-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ space.spaceTotalCount || 0 }}</span>
                  <span class="stat-label">图片</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ formatFileSize(space.spaceSizeUsed) }}</span>
                  <span class="stat-label">已用</span>
                </div>
              </div>

              <div class="capacity-bar">
                <div
                  class="capacity-fill"
                  :style="{
                    width: `${getUsagePercent(space.spaceSizeUsed, space.spaceMaxSize)}%`,
                    backgroundColor: getUsageColor(getUsagePercent(space.spaceSizeUsed, space.spaceMaxSize))
                  }"
                ></div>
              </div>
              <div class="capacity-text">
                {{ formatFileSize(space.spaceSizeUsed) }} / {{ formatFileSize(space.spaceMaxSize) }}
              </div>
            </div>
          </div>
        </section>

        <!-- 团队空间 -->
        <section v-if="teamSpaces.length > 0" class="space-section">
          <h3 class="section-title">
            <svg class="section-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            团队空间
          </h3>
          <div class="space-grid">
            <div
              v-for="space in teamSpaces"
              :key="space.id"
              class="space-card"
              @click="enterSpace(space.id)"
            >
              <div class="space-card-header">
                <div class="space-icon team">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                    <circle cx="9" cy="7" r="4"></circle>
                    <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                    <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
                  </svg>
                </div>
                <div class="space-info">
                  <h4 class="space-name">{{ space.spaceName }}</h4>
                  <span class="space-type-badge team">团队</span>
                </div>
                <button
                  v-if="isOwner(space)"
                  class="btn-delete"
                  @click.stop="confirmDeleteSpace(space.id, space.spaceName)"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>

              <div class="space-stats">
                <div class="stat-item">
                  <span class="stat-value">{{ space.spaceTotalCount || 0 }}</span>
                  <span class="stat-label">图片</span>
                </div>
                <div class="stat-item">
                  <span class="stat-value">{{ formatFileSize(space.spaceSizeUsed) }}</span>
                  <span class="stat-label">已用</span>
                </div>
              </div>

              <div class="capacity-bar">
                <div
                  class="capacity-fill"
                  :style="{
                    width: `${getUsagePercent(space.spaceSizeUsed, space.spaceMaxSize)}%`,
                    backgroundColor: getUsageColor(getUsagePercent(space.spaceSizeUsed, space.spaceMaxSize))
                  }"
                ></div>
              </div>
              <div class="capacity-text">
                {{ formatFileSize(space.spaceSizeUsed) }} / {{ formatFileSize(space.spaceMaxSize) }}
              </div>
            </div>
          </div>
        </section>
      </div>
    </main>

    <!-- 创建空间弹窗 -->
    <div v-if="showCreateModal" class="modal-overlay" @click.self="showCreateModal = false">
      <div class="modal-content">
        <div class="modal-header">
          <h3>创建新空间</h3>
          <button class="btn-close" @click="showCreateModal = false">×</button>
        </div>

        <div class="modal-body">
          <div class="form-group">
            <label>空间名称</label>
            <input
              v-model="createForm.spaceName"
              type="text"
              placeholder="请输入空间名称"
              maxlength="128"
            />
          </div>

          <div class="form-group">
            <label>空间类型</label>
            <div class="radio-group">
              <label
                v-for="option in spaceTypeOptions"
                :key="option.value"
                class="radio-option"
                :class="{ active: createForm.spaceType === option.value }"
              >
                <input
                  v-model="createForm.spaceType"
                  type="radio"
                  :value="option.value"
                />
                <div class="radio-content">
                  <span class="radio-label">{{ option.label }}</span>
                  <span class="radio-desc">{{ option.description }}</span>
                </div>
              </label>
            </div>
          </div>

          <div class="form-group">
            <label>空间等级</label>
            <div class="radio-group">
              <label
                v-for="option in spaceLevelOptions"
                :key="option.value"
                class="radio-option"
                :class="{ active: createForm.spaceLevel === option.value, disabled: option.disabled && !isAdmin }"
              >
                <input
                  v-model="createForm.spaceLevel"
                  type="radio"
                  :value="option.value"
                  :disabled="option.disabled && !isAdmin"
                />
                <div class="radio-content">
                  <span class="radio-label">{{ option.label }}</span>
                  <span class="radio-desc">{{ option.description }}</span>
                </div>
              </label>
            </div>
            <p v-if="!isAdmin" class="form-hint">* 只有管理员可以创建专业版和旗舰版空间</p>
          </div>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showCreateModal = false">取消</button>
          <button
            class="btn btn-primary"
            :disabled="!createForm.spaceName.trim() || creating"
            @click="handleCreateSpace"
          >
            {{ creating ? '创建中...' : '创建' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 删除确认弹窗 -->
    <div v-if="showDeleteConfirm" class="modal-overlay" @click.self="showDeleteConfirm = false">
      <div class="modal-content modal-small">
        <div class="modal-header">
          <h3>确认删除</h3>
          <button class="btn-close" @click="showDeleteConfirm = false">×</button>
        </div>

        <div class="modal-body">
          <p>确定要删除这个空间吗？此操作将删除空间内的所有图片，且无法撤销。</p>
        </div>

        <div class="modal-footer">
          <button class="btn btn-secondary" @click="showDeleteConfirm = false">取消</button>
          <button
            class="btn btn-danger"
            :disabled="deleting"
            @click="handleDeleteSpace"
          >
            {{ deleting ? '删除中...' : '删除' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== 页面布局 ========== */
.space-list-page {
  min-height: 100vh;
  background: #f5f7fa;
}

/* ========== 顶部导航 ========== */
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

.logo-section {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.header-divider {
  color: #d1d5db;
  font-size: 1.25rem;
}

.page-title {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.user-name {
  font-weight: 500;
  color: #374151;
}

/* ========== 按钮样式 ========== */
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

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.btn-danger {
  background: #ef4444;
  color: white;
}

.btn-danger:hover {
  background: #dc2626;
}

.btn-large {
  padding: 0.875rem 1.5rem;
  font-size: 0.9375rem;
}

.icon {
  width: 18px;
  height: 18px;
}

/* ========== 主体内容 ========== */
.main-content {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 2rem;
}

.content-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0;
}

/* ========== 加载和空状态 ========== */
.loading-state,
.empty-state {
  text-align: center;
  padding: 4rem 2rem;
  background: white;
  border-radius: 16px;
}

.spinner {
  width: 48px;
  height: 48px;
  border: 4px solid #f3f4f6;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin: 0 auto 1rem;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-icon {
  width: 80px;
  height: 80px;
  color: #d1d5db;
  margin-bottom: 1.5rem;
}

.empty-state h3 {
  font-size: 1.25rem;
  color: #374151;
  margin: 0 0 0.5rem 0;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 1.5rem;
}

/* ========== 空间列表 ========== */
.space-section {
  margin-bottom: 2rem;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
}

.section-icon {
  width: 20px;
  height: 20px;
}

.space-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 1.5rem;
}

.space-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.space-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.space-card-header {
  display: flex;
  align-items: center;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.space-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.space-icon svg {
  width: 24px;
  height: 24px;
  color: white;
}

.space-icon.private {
  background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
}

.space-icon.team {
  background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
}

.space-info {
  flex: 1;
  min-width: 0;
}

.space-name {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.space-type-badge {
  display: inline-block;
  padding: 0.125rem 0.5rem;
  border-radius: 4px;
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

.btn-delete {
  width: 32px;
  height: 32px;
  border-radius: 8px;
  border: none;
  background: #fee2e2;
  color: #ef4444;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: all 0.2s ease;
}

.space-card:hover .btn-delete {
  opacity: 1;
}

.btn-delete:hover {
  background: #fecaca;
}

.btn-delete svg {
  width: 16px;
  height: 16px;
}

.space-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.stat-item {
  display: flex;
  flex-direction: column;
}

.stat-value {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1f2937;
}

.stat-label {
  font-size: 0.75rem;
  color: #6b7280;
}

.capacity-bar {
  height: 6px;
  background: #e5e7eb;
  border-radius: 3px;
  overflow: hidden;
  margin-bottom: 0.5rem;
}

.capacity-fill {
  height: 100%;
  border-radius: 3px;
  transition: width 0.3s ease;
}

.capacity-text {
  font-size: 0.75rem;
  color: #9ca3af;
}

/* ========== 弹窗样式 ========== */
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
  font-size: 1.125rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
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
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: #e5e7eb;
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

/* ========== 表单样式 ========== */
.form-group {
  margin-bottom: 1.5rem;
}

.form-group:last-child {
  margin-bottom: 0;
}

.form-group label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-group input[type='text'] {
  width: 100%;
  padding: 0.75rem 1rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9375rem;
  transition: border-color 0.2s ease;
}

.form-group input[type='text']:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.radio-group {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.radio-option {
  display: flex;
  align-items: flex-start;
  gap: 0.75rem;
  padding: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.2s ease;
}

.radio-option:hover:not(.disabled) {
  border-color: #d1d5db;
}

.radio-option.active {
  border-color: #667eea;
  background: #f5f3ff;
}

.radio-option.disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.radio-option input {
  margin-top: 0.25rem;
}

.radio-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.radio-label {
  font-weight: 500;
  color: #1f2937;
}

.radio-desc {
  font-size: 0.75rem;
  color: #6b7280;
}

.form-hint {
  font-size: 0.75rem;
  color: #9ca3af;
  margin: 0.5rem 0 0 0;
}

/* ========== 响应式设计 ========== */
@media (max-width: 768px) {
  .header-content {
    padding: 1rem;
  }

  .user-name {
    display: none;
  }

  .main-content {
    padding: 1rem;
  }

  .space-grid {
    grid-template-columns: 1fr;
  }

  .btn-delete {
    opacity: 1;
  }
}
</style>
