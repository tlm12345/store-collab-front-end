<script setup lang="ts">
/**
 * 图片详情页面
 * 展示图片的详细信息和下载功能
 */

import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { getPictureById, editPicture, getPictureTagCategory } from '@/api/picture'
import type { PictureVO, PictureTagCategory } from '@/types/api'

const route = useRoute()
const router = useRouter()
const userStore = useUserStore()

// ========== 状态定义 ==========

const picture = ref<PictureVO | null>(null)
const loading = ref(false)
const error = ref('')

// 编辑相关状态
const isEditing = ref(false)
const editLoading = ref(false)
const categories = ref<string[]>([])
const tags = ref<string[]>([])

// 编辑表单数据
const editForm = ref({
  name: '',
  introduction: '',
  category: '',
  tags: [] as string[]
})

// 表单验证错误
const editFormErrors = ref({
  name: ''
})

// ========== 计算属性 ==========

const pictureId = computed(() => route.params.id as string)

const isAdmin = computed(() => userStore.user?.role === 'admin')

/**
 * 当前用户是否是图片所有者
 */
const isOwner = computed(() => {
  return picture.value?.userId === userStore.user?.id
})

/**
 * 是否可以编辑（所有者或管理员）
 */
const canEdit = computed(() => {
  return isOwner.value || isAdmin.value
})

/**
 * 获取审核状态文本和样式
 */
const reviewStatus = computed(() => {
  const status = picture.value?.viewStatus
  switch (status) {
    case 0:
      return { text: '待审核', className: 'status-pending' }
    case 1:
      return { text: '已通过', className: 'status-approved' }
    case 2:
      return { text: '已拒绝', className: 'status-rejected' }
    default:
      return { text: '待审核', className: 'status-pending' }
  }
})

/**
 * 解析标签
 */
const parsedTags = computed(() => {
  if (!picture.value?.tags) return []
  try {
    return JSON.parse(picture.value.tags)
  } catch {
    return []
  }
})

/**
 * 格式化文件大小
 */
function formatFileSize(bytes?: number): string {
  if (!bytes) return '-'
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
 * 格式化日期
 */
function formatDate(dateStr?: string): string {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  })
}

// ========== 方法定义 ==========

/**
 * 获取图片详情
 */
async function fetchPictureDetail() {
  try {
    loading.value = true
    error.value = ''

    const response = await getPictureById(pictureId.value)

    if (response.code === 0 && response.data) {
      picture.value = response.data
    } else {
      error.value = response.message || '获取图片详情失败'
    }
  } catch (err) {
    error.value = '获取图片详情失败，请稍后重试'
    console.error('获取图片详情失败:', err)
  } finally {
    loading.value = false
  }
}

/**
 * 返回图库
 */
function goBack() {
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
  router.push('/')
}

/**
 * 下载图片
 */
async function downloadImage() {
  if (!picture.value?.url) return

  try {
    // 使用 fetch 获取图片数据
    const response = await fetch(picture.value.url)
    const blob = await response.blob()

    // 创建下载链接
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url

    // 设置文件名
    const extension = picture.value.picFormat || 'jpg'
    const filename = `${picture.value.name}.${extension}`
    link.download = filename

    // 触发下载
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)

    // 清理
    window.URL.revokeObjectURL(url)
  } catch (err) {
    console.error('下载图片失败:', err)
    // 降级方案：直接打开图片链接
    window.open(picture.value.url, '_blank')
  }
}

/**
 * 在新标签页打开图片
 */
function openInNewTab() {
  if (picture.value?.url) {
    window.open(picture.value.url, '_blank')
  }
}

/**
 * 获取标签和分类
 */
async function fetchTagCategory() {
  try {
    const response = await getPictureTagCategory()
    if (response.code === 0 && response.data) {
      categories.value = response.data.categories || []
      tags.value = response.data.tags || []
    }
  } catch (error) {
    console.error('获取标签分类失败:', error)
  }
}

/**
 * 解析标签字符串为数组
 */
function parseTags(tagsStr?: string): string[] {
  if (!tagsStr) return []
  try {
    return JSON.parse(tagsStr)
  } catch {
    return []
  }
}

/**
 * 开始编辑
 */
function startEdit() {
  if (!picture.value) return
  editForm.value = {
    name: picture.value.name || '',
    introduction: picture.value.introduction || '',
    category: picture.value.category || '',
    tags: parseTags(picture.value.tags)
  }
  editFormErrors.value = { name: '' }
  isEditing.value = true
  fetchTagCategory()
}

/**
 * 取消编辑
 */
function cancelEdit() {
  isEditing.value = false
  editFormErrors.value = { name: '' }
}

/**
 * 验证表单
 */
function validateEditForm(): boolean {
  if (!editForm.value.name.trim()) {
    editFormErrors.value.name = '请输入图片名称'
    return false
  }
  editFormErrors.value.name = ''
  return true
}

/**
 * 切换标签选择
 */
function toggleTag(tag: string) {
  const index = editForm.value.tags.indexOf(tag)
  if (index > -1) {
    editForm.value.tags.splice(index, 1)
  } else {
    editForm.value.tags.push(tag)
  }
}

/**
 * 移除标签
 */
function removeTag(index: number) {
  editForm.value.tags.splice(index, 1)
}

/**
 * 提交编辑表单
 */
async function submitEdit() {
  if (!picture.value) return
  if (!validateEditForm()) return

  editLoading.value = true
  try {
    const response = await editPicture({
      id: picture.value.id,
      name: editForm.value.name,
      introduction: editForm.value.introduction,
      category: editForm.value.category,
      tags: JSON.stringify(editForm.value.tags)
    })

    if (response.code === 0 && response.data) {
      alert('图片信息更新成功！')
      isEditing.value = false
      await fetchPictureDetail()
    } else {
      alert(response.message || '更新失败')
    }
  } catch (error) {
    console.error('更新图片信息失败:', error)
    alert('更新失败，请重试')
  } finally {
    editLoading.value = false
  }
}

// ========== 生命周期 ==========

onMounted(() => {
  fetchPictureDetail()
})
</script>

<template>
  <div class="detail-page">
    <!-- 顶部导航栏 -->
    <header class="detail-header">
      <div class="header-content">
        <button class="btn btn-ghost" @click="goBack">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="19" y1="12" x2="5" y2="12"></line>
            <polyline points="12 19 5 12 12 5"></polyline>
          </svg>
          返回图库
        </button>

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

    <!-- 加载状态 -->
    <div v-if="loading" class="loading-state">
      <div class="spinner"></div>
      <p>加载中...</p>
    </div>

    <!-- 错误状态 -->
    <div v-else-if="error" class="error-state">
      <svg class="error-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
        <circle cx="12" cy="12" r="10"></circle>
        <line x1="12" y1="8" x2="12" y2="12"></line>
        <line x1="12" y1="16" x2="12.01" y2="16"></line>
      </svg>
      <p>{{ error }}</p>
      <button class="btn btn-primary" @click="fetchPictureDetail">重试</button>
    </div>

    <!-- 图片详情内容 -->
    <div v-else-if="picture" class="detail-container">
      <!-- 左侧：图片展示 -->
      <div class="image-section">
        <div class="image-wrapper">
          <img :src="picture.url" :alt="picture.name" />
        </div>

        <div class="image-actions">
          <button class="btn btn-primary btn-large" @click="downloadImage">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
              <polyline points="7 10 12 15 17 10"></polyline>
              <line x1="12" y1="15" x2="12" y2="3"></line>
            </svg>
            下载图片
          </button>
          <button class="btn btn-secondary btn-large" @click="openInNewTab">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"></path>
              <polyline points="15 3 21 3 21 9"></polyline>
              <line x1="10" y1="14" x2="21" y2="3"></line>
            </svg>
            在新窗口打开
          </button>
          <button v-if="canEdit && !isEditing" class="btn btn-secondary btn-large" @click="startEdit">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
              <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
            </svg>
            编辑信息
          </button>
        </div>
      </div>

      <!-- 右侧：图片信息 -->
      <div class="info-section">
        <!-- 编辑模式 -->
        <div v-if="isEditing" class="info-card edit-card">
          <div class="edit-header">
            <h2>编辑图片信息</h2>
            <button class="btn-close" @click="cancelEdit">×</button>
          </div>

          <div class="edit-form">
            <!-- 图片名称 -->
            <div class="form-group">
              <label class="form-label required">图片名称</label>
              <input
                v-model="editForm.name"
                type="text"
                class="form-input"
                placeholder="请输入图片名称"
                @blur="validateEditForm"
              />
              <span v-if="editFormErrors.name" class="error-text">{{ editFormErrors.name }}</span>
            </div>

            <!-- 图片描述 -->
            <div class="form-group">
              <label class="form-label">图片描述</label>
              <textarea
                v-model="editForm.introduction"
                class="form-textarea"
                rows="3"
                placeholder="请输入图片描述（可选）"
              ></textarea>
            </div>

            <!-- 分类 -->
            <div class="form-group">
              <label class="form-label">分类</label>
              <select v-model="editForm.category" class="form-select">
                <option value="">请选择分类</option>
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

            <!-- 标签 -->
            <div class="form-group">
              <label class="form-label">标签</label>
              <div class="tag-input-section">
                <div class="selected-tags">
                  <span
                    v-for="(tag, index) in editForm.tags"
                    :key="tag"
                    class="selected-tag"
                  >
                    {{ tag }}
                    <button @click="removeTag(index)">×</button>
                  </span>
                </div>
                <div class="tag-suggestions">
                  <span class="suggestion-label">推荐标签：</span>
                  <button
                    v-for="tag in tags.filter(t => !editForm.tags.includes(t))"
                    :key="tag"
                    class="tag-suggestion-btn"
                    :class="{ active: editForm.tags.includes(tag) }"
                    @click="toggleTag(tag)"
                  >
                    {{ tag }}
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div class="edit-actions">
            <button class="btn btn-secondary" @click="cancelEdit" :disabled="editLoading">
              取消
            </button>
            <button class="btn btn-primary" @click="submitEdit" :disabled="editLoading">
              <span v-if="editLoading">保存中...</span>
              <span v-else>保存修改</span>
            </button>
          </div>
        </div>

        <!-- 查看模式 -->
        <div v-else class="info-card">
          <h1 class="image-title">{{ picture.name }}</h1>

          <p v-if="picture.introduction" class="image-description">
            {{ picture.introduction }}
          </p>

          <!-- 标签 -->
          <div v-if="parsedTags.length > 0" class="info-group">
            <h3>标签</h3>
            <div class="tags-list">
              <span v-for="tag in parsedTags" :key="tag" class="tag">
                {{ tag }}
              </span>
            </div>
          </div>

          <!-- 审核状态 -->
          <div class="info-group">
            <h3>审核状态</h3>
            <div class="review-status" :class="reviewStatus.className">
              <span class="status-text">{{ reviewStatus.text }}</span>
              <span v-if="picture.viewTime" class="status-time">
                审核时间：{{ formatDate(picture.viewTime) }}
              </span>
              <span v-if="picture.viewMessage" class="status-message">
                {{ picture.viewMessage }}
              </span>
            </div>
          </div>

          <!-- 分类 -->
          <div v-if="picture.category" class="info-group">
            <h3>分类</h3>
            <span class="category-badge">{{ picture.category }}</span>
          </div>

          <!-- 文件信息 -->
          <div class="info-group">
            <h3>文件信息</h3>
            <div class="info-grid">
              <div class="info-item">
                <span class="info-label">格式</span>
                <span class="info-value">{{ picture.picFormat?.toUpperCase() || '-' }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">文件大小</span>
                <span class="info-value">{{ formatFileSize(picture.picSize) }}</span>
              </div>
              <div class="info-item">
                <span class="info-label">尺寸</span>
                <span class="info-value">
                  {{ picture.picWidth && picture.picHeight ? `${picture.picWidth} × ${picture.picHeight}` : '-' }}
                </span>
              </div>
              <div class="info-item">
                <span class="info-label">宽高比</span>
                <span class="info-value">{{ picture.picScale?.toFixed(2) || '-' }}</span>
              </div>
            </div>
          </div>

          <!-- 创建者信息 -->
          <div class="info-group">
            <h3>上传者</h3>
            <div class="creator-info">
              <img
                v-if="picture.userVO?.userAvatar"
                :src="picture.userVO.userAvatar"
                class="creator-avatar"
                alt=""
              />
              <div v-else class="creator-avatar-placeholder">
                {{ picture.userVO?.userName?.charAt(0) || '?' }}
              </div>
              <div class="creator-details">
                <span class="creator-name">{{ picture.userVO?.userName || '未知用户' }}</span>
                <span v-if="picture.userVO?.userProfile" class="creator-bio">
                  {{ picture.userVO.userProfile }}
                </span>
              </div>
            </div>
          </div>

          <!-- 时间信息 -->
          <div class="info-group">
            <h3>时间</h3>
            <div class="time-info">
              <div class="time-item">
                <span class="time-label">上传时间</span>
                <span class="time-value">{{ formatDate(picture.createTime) }}</span>
              </div>
              <div v-if="picture.updateTime !== picture.createTime" class="time-item">
                <span class="time-label">更新时间</span>
                <span class="time-value">{{ formatDate(picture.updateTime) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== 页面布局 ========== */
.detail-page {
  min-height: 100vh;
  background: #f5f7fa;
}

/* ========== 顶部导航 ========== */
.detail-header {
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

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: white;
  color: #374151;
  border: 1px solid #e5e7eb;
}

.btn-secondary:hover {
  background: #f9fafb;
  border-color: #d1d5db;
}

.btn-large {
  padding: 0.875rem 1.5rem;
  font-size: 0.9375rem;
}

.icon {
  width: 18px;
  height: 18px;
}

/* ========== 加载和错误状态 ========== */
.loading-state,
.error-state {
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
  to {
    transform: rotate(360deg);
  }
}

.error-icon {
  width: 64px;
  height: 64px;
  color: #ef4444;
}

.error-state p {
  color: #6b7280;
  margin-bottom: 1rem;
}

/* ========== 详情容器 ========== */
.detail-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: 1fr 380px;
  gap: 2rem;
}

/* ========== 图片展示区 ========== */
.image-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.image-wrapper {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 4px 6px rgba(0, 0, 0, 0.05);
}

.image-wrapper img {
  width: 100%;
  height: auto;
  display: block;
}

.image-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

/* ========== 信息区 ========== */
.info-section {
  position: sticky;
  top: 88px;
  height: fit-content;
}

.info-card {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.image-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 1rem 0;
  line-height: 1.4;
}

.image-description {
  font-size: 0.9375rem;
  color: #4b5563;
  line-height: 1.6;
  margin-bottom: 1.5rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
}

.info-group {
  margin-bottom: 1.5rem;
}

.info-group:last-child {
  margin-bottom: 0;
}

.info-group h3 {
  font-size: 0.75rem;
  font-weight: 600;
  color: #9ca3af;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  margin: 0 0 0.75rem 0;
}

/* ========== 标签 ========== */
.tags-list {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag {
  padding: 0.375rem 0.75rem;
  background: #ede9fe;
  color: #7c3aed;
  border-radius: 20px;
  font-size: 0.875rem;
}

/* ========== 分类 ========== */
.category-badge {
  display: inline-block;
  padding: 0.5rem 1rem;
  background: #dbeafe;
  color: #2563eb;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
}

/* ========== 审核状态 ========== */
.review-status {
  padding: 0.75rem 1rem;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  gap: 0.375rem;
}

.review-status .status-text {
  font-weight: 600;
  font-size: 0.9375rem;
}

.review-status .status-time {
  font-size: 0.75rem;
  opacity: 0.9;
}

.review-status .status-message {
  font-size: 0.875rem;
  margin-top: 0.25rem;
  padding-top: 0.375rem;
  border-top: 1px dashed rgba(255, 255, 255, 0.3);
}

.status-pending {
  background: linear-gradient(135deg, #fbbf24 0%, #f59e0b 100%);
  color: white;
}

.status-approved {
  background: linear-gradient(135deg, #34d399 0%, #10b981 100%);
  color: white;
}

.status-rejected {
  background: linear-gradient(135deg, #f87171 0%, #ef4444 100%);
  color: white;
}

/* ========== 文件信息网格 ========== */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  color: #9ca3af;
}

.info-value {
  font-size: 0.9375rem;
  font-weight: 500;
  color: #1f2937;
}

/* ========== 创建者信息 ========== */
.creator-info {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.creator-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  object-fit: cover;
}

.creator-avatar-placeholder {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 1.25rem;
  font-weight: 600;
}

.creator-details {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.creator-name {
  font-weight: 600;
  color: #1f2937;
}

.creator-bio {
  font-size: 0.875rem;
  color: #6b7280;
}

/* ========== 时间信息 ========== */
.time-info {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.time-item {
  display: flex;
  justify-content: space-between;
  font-size: 0.875rem;
}

.time-label {
  color: #6b7280;
}

.time-value {
  color: #1f2937;
}

/* ========== 响应式设计 ========== */
@media (max-width: 1024px) {
  .detail-container {
    grid-template-columns: 1fr;
  }

  .info-section {
    position: static;
  }
}

@media (max-width: 640px) {
  .header-content {
    padding: 1rem;
  }

  .user-name {
    display: none;
  }

  .detail-container {
    padding: 1rem;
  }

  .image-actions {
    flex-direction: column;
  }

  .btn-large {
    width: 100%;
    justify-content: center;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }
}

/* ========== 编辑表单样式 ========== */
.edit-card {
  position: relative;
}

.edit-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.edit-header h2 {
  font-size: 1.25rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0;
}

.btn-close {
  width: 32px;
  height: 32px;
  border: none;
  background: #f3f4f6;
  border-radius: 8px;
  font-size: 1.25rem;
  color: #6b7280;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: #e5e7eb;
}

.edit-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
}

.form-label.required::after {
  content: '*';
  color: #ef4444;
  margin-left: 0.25rem;
}

.form-input,
.form-textarea,
.form-select {
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9375rem;
  transition: border-color 0.2s;
  background: white;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
}

.error-text {
  font-size: 0.75rem;
  color: #ef4444;
}

.tag-input-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem;
  background: white;
}

.selected-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
  min-height: 32px;
}

.selected-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.25rem 0.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 4px;
  font-size: 0.75rem;
}

.selected-tag button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  font-size: 1rem;
  line-height: 1;
  padding: 0;
  width: 16px;
  height: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.tag-suggestions {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
  gap: 0.5rem;
  padding-top: 0.75rem;
  border-top: 1px dashed #e5e7eb;
}

.suggestion-label {
  font-size: 0.75rem;
  color: #9ca3af;
}

.tag-suggestion-btn {
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  border: none;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s;
}

.tag-suggestion-btn:hover {
  background: #e5e7eb;
}

.tag-suggestion-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.edit-actions {
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
  margin-top: 1.5rem;
  padding-top: 1rem;
  border-top: 1px solid #e5e7eb;
}
</style>
