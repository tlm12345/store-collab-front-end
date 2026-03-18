<script setup lang="ts">
/**
 * 我的空间页面
 * 展示当前用户上传的所有图片，支持搜索、筛选和分页
 */

import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { listPictureByPage, getPictureTagCategory, uploadPictureByFile, editPicture } from '@/api/picture'
import { getMyPrivateSpace } from '@/api/space'
import type { PictureVO, PictureQueryRequest, PictureTagCategory, SpaceVO } from '@/types/api'

const router = useRouter()
const userStore = useUserStore()

// ========== 状态定义 ==========

// 图片列表
const pictures = ref<PictureVO[]>([])
const loading = ref(false)
const total = ref(0)

// 分页参数
const currentPage = ref(1)
const pageSize = ref(12)

// 搜索和筛选
const searchText = ref('')
const selectedCategory = ref('')
const selectedTags = ref<string[]>([])
const selectedFormat = ref('')

// 筛选选项
const categories = ref<string[]>([])
const tags = ref<string[]>([])
const formats = ['jpg', 'jpeg', 'png', 'gif', 'webp', 'bmp']

// 筛选面板显示状态
const showFilters = ref(false)

// 上传相关
const uploadInput = ref<HTMLInputElement | null>(null)
const reuploadInput = ref<HTMLInputElement | null>(null)
const uploading = ref(false)
const reuploading = ref(false)

// 私人空间信息
const privateSpace = ref<SpaceVO | null>(null)
const privateSpaceLoading = ref(false)

// 图片编辑对话框
const showEditDialog = ref(false)
const editingPicture = ref<PictureVO | null>(null)

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

const isAdmin = computed(() => userStore.user?.role === 'admin')

const currentUserId = computed(() => userStore.user?.id)

// 上传可用性：只要用户已登录就可以上传（后端自动推断空间）
const canUpload = computed(() => !!currentUserId.value)

const hasActiveFilters = computed(() => {
  return selectedCategory.value || selectedTags.value.length > 0 || selectedFormat.value
})

// 编辑表单可用的标签（排除已选择的）
const availableTagsForEdit = computed(() => {
  return tags.value.filter((tag) => !editForm.value.tags.includes(tag))
})

// ========== 方法定义 ==========

/**
 * 获取当前用户上传的图片列表
 */
async function fetchPictures() {
  if (!currentUserId.value) return

  try {
    loading.value = true

    const query: PictureQueryRequest = {
      searchText: searchText.value || undefined,
      category: selectedCategory.value || undefined,
      tags: selectedTags.value.length > 0 ? selectedTags.value : undefined,
      picFormat: selectedFormat.value || undefined,
      queryPrivateSpace: true, // 查询当前用户的私人空间图片
      pageNum: currentPage.value,
      pageSize: pageSize.value
    }

    const response = await listPictureByPage(query)

    if (response.code === 0 && response.data) {
      pictures.value = response.data.records
      total.value = response.data.total
    } else {
      console.error('获取图片列表失败:', response.message)
    }
  } catch (error) {
    console.error('获取图片列表失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 获取用户私人空间信息
 */
async function fetchPrivateSpace() {
  try {
    privateSpaceLoading.value = true
    const response = await getMyPrivateSpace()
    if (response.code === 0 && response.data) {
      privateSpace.value = response.data
    } else {
      console.error('获取私人空间失败:', response.message)
    }
  } catch (error) {
    console.error('获取私人空间失败:', error)
  } finally {
    privateSpaceLoading.value = false
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
 * 处理搜索
 */
function handleSearch() {
  currentPage.value = 1
  fetchPictures()
}

/**
 * 处理页码变化
 */
function handlePageChange(page: number) {
  currentPage.value = page
  fetchPictures()
}

/**
 * 处理每页数量变化
 */
function handleSizeChange(size: number) {
  pageSize.value = size
  currentPage.value = 1
  fetchPictures()
}

/**
 * 切换标签选择
 */
function toggleTag(tag: string) {
  const index = selectedTags.value.indexOf(tag)
  if (index > -1) {
    selectedTags.value.splice(index, 1)
  } else {
    selectedTags.value.push(tag)
  }
  currentPage.value = 1
  fetchPictures()
}

/**
 * 清除所有筛选
 */
function clearFilters() {
  selectedCategory.value = ''
  selectedTags.value = []
  selectedFormat.value = ''
  currentPage.value = 1
  fetchPictures()
}

/**
 * 触发文件上传
 */
function triggerUpload() {
  uploadInput.value?.click()
}

/**
 * 处理文件上传
 * 携带 spaceId 上传到用户的私人空间
 */
async function handleFileUpload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file) return

  if (!currentUserId.value) {
    alert('请先登录后再上传图片')
    return
  }

  if (!privateSpace.value) {
    alert('私人空间信息未加载，请刷新页面重试')
    return
  }

  uploading.value = true
  try {
    // 携带 spaceId 上传到私人空间
    const response = await uploadPictureByFile(file, {
      spaceId: privateSpace.value.id
    })
    if (response.code === 0 && response.data) {
      // 保存图片信息，打开编辑对话框
      editingPicture.value = response.data
      editForm.value = {
        name: response.data.name || file.name.replace(/\.[^/.]+$/, ''), // 使用文件名（去掉扩展名）
        introduction: response.data.introduction || '',
        category: response.data.category || '',
        tags: parseTags(response.data.tags) // 解析已有标签
      }
      showEditDialog.value = true
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
 * 查看图片详情
 */
function viewImageDetail(id: string) {
  router.push(`/gallery/${id}`)
}

/**
 * 前往图库
 */
function goToGallery() {
  router.push('/gallery')
}

/**
 * 前往空间管理页面（团队空间）
 */
function goToSpaceManagement() {
  router.push('/space-management')
}

/**
 * 跳转到管理员页面
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

/**
 * 获取审核状态文本和样式
 */
function getReviewStatus(viewStatus?: number): { text: string; className: string } {
  switch (viewStatus) {
    case 0:
      return { text: '待审核', className: 'status-pending' }
    case 1:
      return { text: '已通过', className: 'status-approved' }
    case 2:
      return { text: '已拒绝', className: 'status-rejected' }
    default:
      return { text: '待审核', className: 'status-pending' }
  }
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

/**
 * 切换编辑表单的标签选择
 */
function toggleEditTag(tag: string) {
  const index = editForm.value.tags.indexOf(tag)
  if (index > -1) {
    editForm.value.tags.splice(index, 1)
  } else {
    editForm.value.tags.push(tag)
  }
}

/**
 * 移除编辑表单的标签
 */
function removeEditTag(index: number) {
  editForm.value.tags.splice(index, 1)
}

/**
 * 验证名称
 */
function validateName() {
  if (!editForm.value.name.trim()) {
    editFormErrors.value.name = '请输入图片名称'
  } else {
    editFormErrors.value.name = ''
  }
}

/**
 * 完善图片信息（第二阶段）
 * 调用 /picture/edit 接口完善图片信息
 */
async function submitEditForm() {
  if (!editingPicture.value) return

  // 表单验证
  if (!editForm.value.name.trim()) {
    editFormErrors.value.name = '请输入图片名称'
    return
  }

  uploading.value = true
  try {
    const response = await editPicture({
      id: editingPicture.value.id,
      name: editForm.value.name,
      introduction: editForm.value.introduction,
      category: editForm.value.category,
      tags: JSON.stringify(editForm.value.tags)
    })

    if (response.code === 0 && response.data) {
      alert('图片信息完善成功！')
      showEditDialog.value = false
      editingPicture.value = null
      editForm.value = { name: '', introduction: '', category: '', tags: [] }
      editFormErrors.value = { name: '' }
      // 刷新图片列表
      await fetchPictures()
    } else {
      alert(response.message || '完善信息失败')
    }
  } catch (error) {
    console.error('完善信息失败:', error)
    alert('完善信息失败，请重试')
  } finally {
    uploading.value = false
  }
}

/**
 * 触发重新上传
 */
function triggerReupload() {
  reuploadInput.value?.click()
}

/**
 * 处理重新上传（替换图片）
 * 携带图片ID重新上传，替换原图片
 */
async function handleReupload(event: Event) {
  const input = event.target as HTMLInputElement
  const file = input.files?.[0]
  if (!file || !editingPicture.value) return

  reuploading.value = true
  try {
    const response = await uploadPictureByFile(file, {
      id: editingPicture.value.id // 携带图片ID，表示替换原图片
    })

    if (response.code === 0 && response.data) {
      // 更新编辑中的图片数据（URL可能已经改变）
      editingPicture.value = response.data
      // 如果名称还没填，使用新文件名
      if (!editForm.value.name.trim()) {
        editForm.value.name = response.data.name || file.name.replace(/\.[^/.]+$/, '')
      }
      alert('图片替换成功！')
    } else {
      alert(response.message || '重新上传失败')
    }
  } catch (error) {
    console.error('重新上传失败:', error)
    alert('重新上传失败，请重试')
  } finally {
    reuploading.value = false
    input.value = ''
  }
}

/**
 * 取消编辑
 */
function cancelEdit() {
  showEditDialog.value = false
  editingPicture.value = null
  editForm.value = { name: '', introduction: '', category: '', tags: [] }
  editFormErrors.value = { name: '' }
  // 即使没有完善信息，也刷新列表显示新上传的图片
  fetchPictures()
}

// ========== 生命周期 ==========

onMounted(() => {
  fetchPictures()
  fetchTagCategory()
  fetchPrivateSpace()
})

// 监听筛选条件变化
watch([selectedCategory, selectedFormat], () => {
  currentPage.value = 1
  fetchPictures()
})
</script>

<template>
  <div class="my-space-page">
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
          <div class="user-info">
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
      </div>
    </header>

    <div class="page-container">
      <!-- 左侧边栏 -->
      <aside class="sidebar">
        <!-- 空间导航卡片 -->
        <div class="card nav-card">
          <h3 class="nav-title">空间导航</h3>
          <button class="btn btn-secondary btn-nav" @click="goToSpaceManagement">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
              <circle cx="9" cy="7" r="4"></circle>
              <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
              <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
            </svg>
            空间管理
            <svg class="arrow-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </button>
        </div>

        <!-- 筛选面板 -->
        <div class="card filter-card">
          <div class="filter-header">
            <h3>筛选</h3>
            <button v-if="hasActiveFilters" class="btn-clear" @click="clearFilters">
              清除全部
            </button>
          </div>

          <!-- 分类筛选 -->
          <div class="filter-group">
            <h4>分类</h4>
            <div class="filter-options">
              <label
                v-for="category in categories"
                :key="category"
                class="filter-option"
              >
                <input
                  type="radio"
                  :value="category"
                  v-model="selectedCategory"
                  name="category"
                />
                <span class="option-label">{{ category }}</span>
              </label>
              <label class="filter-option">
                <input type="radio" value="" v-model="selectedCategory" name="category" />
                <span class="option-label">全部</span>
              </label>
            </div>
          </div>

          <!-- 标签筛选 -->
          <div class="filter-group">
            <h4>标签</h4>
            <div class="tag-cloud">
              <button
                v-for="tag in tags"
                :key="tag"
                class="tag-btn"
                :class="{ active: selectedTags.includes(tag) }"
                @click="toggleTag(tag)"
              >
                {{ tag }}
              </button>
            </div>
          </div>

          <!-- 格式筛选 -->
          <div class="filter-group">
            <h4>格式</h4>
            <select v-model="selectedFormat" class="format-select">
              <option value="">全部格式</option>
              <option v-for="format in formats" :key="format" :value="format">
                {{ format.toUpperCase() }}
              </option>
            </select>
          </div>
        </div>
      </aside>

      <!-- 主内容区 -->
      <main class="main-content">
        <!-- 页面标题和搜索 -->
        <div class="content-header">
          <div class="header-title">
            <h2>我上传的图片</h2>
            <p class="subtitle">管理您在各个空间中上传的所有图片</p>
          </div>

          <div class="header-actions">
            <input
              ref="uploadInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleFileUpload"
            />

            <!-- 上传按钮 -->
            <button
              v-if="canUpload"
              class="btn btn-primary btn-upload-header"
              @click="triggerUpload"
              :disabled="uploading"
            >
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              {{ uploading ? '上传中...' : '上传图片' }}
            </button>

            <!-- 刷新按钮 -->
            <button
              class="btn btn-secondary btn-refresh"
              @click="fetchPictures"
              :disabled="loading"
              title="刷新图片列表"
            >
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polyline points="23 4 23 10 17 10"></polyline>
                <polyline points="1 20 1 14 7 14"></polyline>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"></path>
              </svg>
              {{ loading ? '刷新中...' : '刷新' }}
            </button>

            <!-- 搜索栏 -->
            <div class="search-bar">
              <svg class="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
              </svg>
              <input
                v-model="searchText"
                type="text"
                placeholder="搜索图片名称、描述..."
                @keyup.enter="handleSearch"
              />
              <button class="btn-search" @click="handleSearch">搜索</button>
            </div>
          </div>
        </div>

        <!-- 已选筛选展示 -->
        <div v-if="hasActiveFilters" class="active-filters">
          <span v-if="selectedCategory" class="filter-tag">
            分类: {{ selectedCategory }}
            <button @click="selectedCategory = ''; fetchPictures()">×</button>
          </span>
          <span v-for="tag in selectedTags" :key="tag" class="filter-tag">
            {{ tag }}
            <button @click="toggleTag(tag)">×</button>
          </span>
          <span v-if="selectedFormat" class="filter-tag">
            格式: {{ selectedFormat.toUpperCase() }}
            <button @click="selectedFormat = ''; fetchPictures()">×</button>
          </span>
        </div>

        <!-- 图片网格 -->
        <div v-if="loading" class="loading-state">
          <div class="spinner"></div>
          <p>加载中...</p>
        </div>

        <div v-else-if="pictures.length === 0" class="empty-state">
          <div class="empty-upload-prompt" v-if="canUpload && !hasActiveFilters">
            <div class="empty-upload-icon-wrapper">
              <svg class="empty-upload-main-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                <polyline points="17 8 12 3 7 8"></polyline>
                <line x1="12" y1="3" x2="12" y2="15"></line>
              </svg>
            </div>
            <h3 class="empty-upload-title">开始上传您的第一张图片</h3>
            <p class="empty-upload-desc">将图片上传到您的私人空间，随时随地管理您的作品</p>
            <button
              class="btn btn-primary btn-upload-empty-prominent"
              @click="triggerUpload"
              :disabled="uploading"
            >
              <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <line x1="12" y1="5" x2="12" y2="19"></line>
                <line x1="5" y1="12" x2="19" y2="12"></line>
              </svg>
              {{ uploading ? '上传中...' : '立即上传' }}
            </button>
          </div>
          <template v-else>
            <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
              <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
              <circle cx="8.5" cy="8.5" r="1.5"></circle>
              <polyline points="21 15 16 10 5 21"></polyline>
            </svg>
            <p>暂无图片</p>
            <p class="empty-hint">您还没有上传过任何图片</p>
            <div class="empty-actions">
              <button v-if="hasActiveFilters" class="btn btn-secondary" @click="clearFilters">
                清除筛选条件
              </button>
            </div>
          </template>
        </div>

        <div v-else class="image-grid">
          <div
            v-for="picture in pictures"
            :key="picture.id"
            class="image-card"
            @click="viewImageDetail(picture.id)"
          >
            <div class="image-wrapper">
              <img :src="picture.url" :alt="picture.name" loading="lazy" />
              <!-- 审核状态标签 -->
              <div class="review-status-badge" :class="getReviewStatus(picture.viewStatus).className">
                <span class="status-text">{{ getReviewStatus(picture.viewStatus).text }}</span>
                <span v-if="picture.viewTime" class="status-time">{{ picture.viewTime?.split(' ')[0] }}</span>
              </div>
              <div class="image-overlay">
                <button class="btn-view">查看详情</button>
              </div>
            </div>
            <div class="image-info">
              <h3 class="image-title">{{ picture.name }}</h3>
              <p v-if="picture.introduction" class="image-desc">{{ picture.introduction }}</p>
              <div class="image-meta">
                <span v-if="picture.category" class="category-badge">{{ picture.category }}</span>
                <span class="format-badge">{{ picture.picFormat?.toUpperCase() }}</span>
              </div>
              <div v-if="parseTags(picture.tags).length > 0" class="image-tags">
                <span v-for="tag in parseTags(picture.tags).slice(0, 3)" :key="tag" class="tag">
                  {{ tag }}
                </span>
              </div>
              <div class="image-footer">
                <span class="file-size">{{ formatFileSize(picture.picSize) }}</span>
                <span class="create-time">{{ picture.createTime?.split(' ')[0] }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- 分页 -->
        <div v-if="pictures.length > 0" class="pagination">
          <div class="pagination-info">
            共 {{ total }} 条，{{ Math.ceil(total / pageSize) }} 页
          </div>
          <div class="pagination-controls">
            <button
              :disabled="currentPage === 1"
              class="btn-page"
              @click="handlePageChange(currentPage - 1)"
            >
              上一页
            </button>
            <span class="page-number">{{ currentPage }}</span>
            <button
              :disabled="currentPage >= Math.ceil(total / pageSize)"
              class="btn-page"
              @click="handlePageChange(currentPage + 1)"
            >
              下一页
            </button>
          </div>
          <select v-model="pageSize" class="page-size-select" @change="handleSizeChange(Number(($event.target as HTMLSelectElement).value))">
            <option :value="12">12条/页</option>
            <option :value="24">24条/页</option>
            <option :value="48">48条/页</option>
          </select>
        </div>
      </main>
    </div>

    <!-- 图片信息编辑对话框 -->
    <div v-if="showEditDialog" class="edit-dialog-overlay" @click.self="cancelEdit">
      <div class="edit-dialog">
        <div class="dialog-header">
          <h3>完善图片信息</h3>
          <p class="dialog-subtitle">图片已上传成功，请补充以下信息</p>
          <button class="btn-close" @click="cancelEdit">×</button>
        </div>

        <div class="dialog-body">
          <!-- 图片预览 -->
          <div class="preview-section">
            <input
              ref="reuploadInput"
              type="file"
              accept="image/*"
              style="display: none"
              @change="handleReupload"
            />
            <div class="preview-container">
              <img :src="editingPicture?.url" alt="预览" class="preview-image" />
              <div class="preview-overlay">
                <button
                  class="btn-reupload"
                  @click="triggerReupload"
                  :disabled="reuploading"
                >
                  <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                    <polyline points="17 8 12 3 7 8"></polyline>
                    <line x1="12" y1="3" x2="12" y2="15"></line>
                  </svg>
                  {{ reuploading ? '上传中...' : '重新上传' }}
                </button>
              </div>
            </div>
          </div>

          <!-- 表单 -->
          <div class="form-section">
            <div class="form-group">
              <label class="form-label required">图片名称</label>
              <input
                v-model="editForm.name"
                type="text"
                class="form-input"
                placeholder="请输入图片名称"
                @blur="validateName"
              />
              <span v-if="editFormErrors.name" class="error-text">{{ editFormErrors.name }}</span>
            </div>

            <div class="form-group">
              <label class="form-label">图片描述</label>
              <textarea
                v-model="editForm.introduction"
                class="form-textarea"
                rows="3"
                placeholder="请输入图片描述（可选）"
              ></textarea>
            </div>

            <div class="form-group">
              <label class="form-label">分类</label>
              <select v-model="editForm.category" class="form-select">
                <option value="">请选择分类</option>
                <option v-for="cat in categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>

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
                    <button @click="removeEditTag(index)">×</button>
                  </span>
                </div>
                <div class="tag-suggestions">
                  <span class="suggestion-label">推荐标签：</span>
                  <button
                    v-for="tag in availableTagsForEdit"
                    :key="tag"
                    class="tag-suggestion-btn"
                    :class="{ active: editForm.tags.includes(tag) }"
                    @click="toggleEditTag(tag)"
                  >
                    {{ tag }}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div class="dialog-footer">
          <button class="btn btn-secondary" @click="cancelEdit" :disabled="uploading">
            跳过，稍后完善
          </button>
          <button class="btn btn-primary" @click="submitEditForm" :disabled="uploading">
            {{ uploading ? '保存中...' : '保存信息' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== 页面布局 ========== */
.my-space-page {
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

.user-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
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
  background: #f3f4f6;
  color: #374151;
}

.btn-secondary:hover {
  background: #e5e7eb;
}

.icon {
  width: 18px;
  height: 18px;
}

/* ========== 主体布局 ========== */
.page-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: 300px 1fr;
  gap: 2rem;
}

/* ========== 侧边栏 ========== */
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

/* 私人空间卡片 */
.private-space-card .card-header {
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

.space-info h3 {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
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

.space-stats {
  display: flex;
  gap: 2rem;
  margin-bottom: 1rem;
}

.stat {
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
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 3px;
  transition: width 0.3s ease;
}

.capacity-text {
  font-size: 0.75rem;
  color: #9ca3af;
  margin-bottom: 1rem;
}

.btn-enter {
  width: 100%;
  padding: 0.75rem;
  justify-content: center;
}

/* 空状态上传按钮 */
.empty-actions {
  display: flex;
  gap: 1rem;
  margin-top: 1.5rem;
}

.btn-upload-empty {
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
}

/* 底部上传栏 */
.bottom-upload-bar {
  margin-top: 1.5rem;
  padding: 1.25rem 1.5rem;
  background: white;
  border-radius: 12px;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  border: 2px dashed #e5e7eb;
  transition: border-color 0.2s ease;
}

.bottom-upload-bar:hover {
  border-color: #667eea;
}

.upload-bar-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 1rem;
}

.upload-bar-info {
  display: flex;
  align-items: center;
  gap: 0.75rem;
}

.upload-bar-icon {
  width: 24px;
  height: 24px;
  color: #667eea;
}

.upload-bar-text {
  font-size: 0.9375rem;
  color: #374151;
}

.btn-upload-bottom {
  padding: 0.75rem 1.5rem;
  font-size: 0.9375rem;
  font-weight: 600;
  white-space: nowrap;
}

.btn-upload-bottom:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
}

/* 导航卡片 */
.nav-card {
  padding: 1.25rem;
}

.nav-title {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 1rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.btn-nav {
  width: 100%;
  padding: 0.875rem 1rem;
  justify-content: space-between;
  font-size: 0.9375rem;
}

.btn-nav .icon {
  width: 20px;
  height: 20px;
  color: #6b7280;
}

.btn-nav .arrow-icon {
  width: 16px;
  height: 16px;
  color: #9ca3af;
  margin-left: auto;
}

.btn-nav:hover .arrow-icon {
  color: #667eea;
  transform: translateX(2px);
}

/* 刷新按钮 */
.btn-refresh {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-refresh:hover:not(:disabled) {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.btn-refresh:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-refresh .icon {
  width: 16px;
  height: 16px;
}

/* 头部上传按钮 */
.btn-upload-header {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: white;
  cursor: pointer;
  transition: all 0.2s ease;
  box-shadow: 0 2px 4px rgba(102, 126, 234, 0.2);
}

.btn-upload-header:hover:not(:disabled) {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-upload-header:disabled {
  opacity: 0.7;
  cursor: not-allowed;
}

.btn-upload-header .icon {
  width: 16px;
  height: 16px;
}

/* 筛选卡片 */
.filter-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #e5e7eb;
}

.filter-header h3 {
  margin: 0;
  font-size: 1.125rem;
  color: #1f2937;
}

.btn-clear {
  background: none;
  border: none;
  color: #667eea;
  font-size: 0.75rem;
  cursor: pointer;
  padding: 0;
}

.btn-clear:hover {
  text-decoration: underline;
}

.filter-group {
  margin-bottom: 1.5rem;
}

.filter-group h4 {
  font-size: 0.875rem;
  font-weight: 600;
  color: #374151;
  margin: 0 0 0.75rem 0;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.filter-options {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.filter-option {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  cursor: pointer;
  font-size: 0.875rem;
  color: #4b5563;
}

.filter-option input {
  cursor: pointer;
}

.option-label:hover {
  color: #667eea;
}

.tag-cloud {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
}

.tag-btn {
  padding: 0.375rem 0.75rem;
  background: #f3f4f6;
  border: none;
  border-radius: 20px;
  font-size: 0.75rem;
  color: #4b5563;
  cursor: pointer;
  transition: all 0.2s ease;
}

.tag-btn:hover {
  background: #e5e7eb;
}

.tag-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.format-select {
  width: 100%;
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
}

/* ========== 主内容区 ========== */
.main-content {
  min-width: 0;
}

.content-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 1.5rem;
  gap: 1.5rem;
}

.header-actions {
  display: flex;
  align-items: center;
  gap: 1rem;
  flex: 1;
  justify-content: flex-end;
}

.header-title h2 {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.25rem 0;
}

.subtitle {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0;
}

.search-bar {
  flex: 1;
  max-width: 400px;
  display: flex;
  background: white;
  border-radius: 12px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
}

.search-icon {
  width: 20px;
  height: 20px;
  color: #9ca3af;
  margin: 0.875rem 0 0.875rem 1rem;
  flex-shrink: 0;
}

.search-bar input {
  flex: 1;
  border: none;
  padding: 0.875rem 1rem;
  font-size: 0.9375rem;
  outline: none;
}

.btn-search {
  padding: 0.875rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border: none;
  font-weight: 500;
  cursor: pointer;
  transition: opacity 0.2s ease;
}

.btn-search:hover {
  opacity: 0.9;
}

.active-filters {
  display: flex;
  flex-wrap: wrap;
  gap: 0.5rem;
  margin-bottom: 1.5rem;
}

.filter-tag {
  display: inline-flex;
  align-items: center;
  gap: 0.25rem;
  padding: 0.375rem 0.75rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 20px;
  font-size: 0.75rem;
}

.filter-tag button {
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0;
  font-size: 1rem;
  line-height: 1;
}

/* ========== 图片网格 ========== */
.image-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.image-card {
  background: white;
  border-radius: 16px;
  overflow: hidden;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  cursor: pointer;
  transition: all 0.3s ease;
}

.image-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 12px 24px rgba(0, 0, 0, 0.15);
}

.image-wrapper {
  position: relative;
  aspect-ratio: 4 / 3;
  overflow: hidden;
  background: #f3f4f6;
}

.image-wrapper img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.image-card:hover .image-wrapper img {
  transform: scale(1.05);
}

/* 审核状态标签 */
.review-status-badge {
  position: absolute;
  top: 0.5rem;
  right: 0.5rem;
  padding: 0.375rem 0.75rem;
  border-radius: 6px;
  font-size: 0.75rem;
  font-weight: 500;
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  gap: 0.125rem;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  z-index: 10;
}

.review-status-badge .status-text {
  font-weight: 600;
}

.review-status-badge .status-time {
  font-size: 0.625rem;
  opacity: 0.9;
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

.image-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
}

.image-card:hover .image-overlay {
  opacity: 1;
}

.btn-view {
  padding: 0.75rem 1.5rem;
  background: white;
  color: #1f2937;
  border: none;
  border-radius: 8px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-view:hover {
  transform: scale(1.05);
}

.image-info {
  padding: 1rem;
}

.image-title {
  font-size: 1rem;
  font-weight: 600;
  color: #1f2937;
  margin: 0 0 0.5rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-desc {
  font-size: 0.875rem;
  color: #6b7280;
  margin: 0 0 0.75rem 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.image-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.75rem;
}

.category-badge,
.format-badge {
  padding: 0.25rem 0.5rem;
  background: #f3f4f6;
  border-radius: 4px;
  font-size: 0.75rem;
  color: #6b7280;
}

.image-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 0.75rem;
}

.image-tags .tag {
  padding: 0.125rem 0.5rem;
  background: #ede9fe;
  color: #7c3aed;
  border-radius: 4px;
  font-size: 0.75rem;
}

.image-footer {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding-top: 0.75rem;
  border-top: 1px solid #f3f4f6;
}

.file-size,
.create-time {
  font-size: 0.75rem;
  color: #9ca3af;
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
  width: 64px;
  height: 64px;
  color: #d1d5db;
  margin-bottom: 1rem;
}

.empty-state p {
  color: #6b7280;
  margin-bottom: 0.5rem;
}

.empty-hint {
  font-size: 0.875rem;
  color: #9ca3af;
}

/* 突出的空状态上传提示 */
.empty-upload-prompt {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 3rem 2rem;
  position: relative;
  z-index: 10;
}

.empty-upload-icon-wrapper {
  width: 120px;
  height: 120px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
  animation: pulse-glow 2s ease-in-out infinite;
}

@keyframes pulse-glow {
  0%, 100% {
    box-shadow: 0 8px 32px rgba(102, 126, 234, 0.4);
  }
  50% {
    box-shadow: 0 12px 48px rgba(102, 126, 234, 0.6);
  }
}

.empty-upload-main-icon {
  width: 56px;
  height: 56px;
  color: white;
}

.empty-upload-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1f2937;
  margin: 0 0 0.75rem 0;
}

.empty-upload-desc {
  font-size: 1rem;
  color: #6b7280;
  margin: 0 0 2rem 0;
  max-width: 400px;
  line-height: 1.6;
}

.btn-upload-empty-prominent {
  padding: 1rem 2.5rem;
  font-size: 1.125rem;
  font-weight: 600;
  border-radius: 12px;
  box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
  position: relative;
  overflow: hidden;
  z-index: 11;
}

.btn-upload-empty-prominent::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(
    90deg,
    transparent,
    rgba(255, 255, 255, 0.3),
    transparent
  );
  transition: left 0.5s ease;
}

.btn-upload-empty-prominent:hover::before {
  left: 100%;
}

.btn-upload-empty-prominent:hover {
  transform: translateY(-2px) scale(1.02);
  box-shadow: 0 8px 24px rgba(102, 126, 234, 0.5);
}

.btn-upload-empty-prominent:active {
  transform: translateY(0) scale(0.98);
}

.btn-upload-empty-prominent:disabled {
  opacity: 0.7;
  cursor: not-allowed;
  transform: none !important;
}

.btn-upload-empty-prominent .icon {
  width: 20px;
  height: 20px;
}

/* ========== 分页 ========== */
.pagination {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 12px;
}

.pagination-info {
  font-size: 0.875rem;
  color: #6b7280;
}

.pagination-controls {
  display: flex;
  align-items: center;
  gap: 1rem;
}

.btn-page {
  padding: 0.5rem 1rem;
  background: #f3f4f6;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-page:hover:not(:disabled) {
  background: #e5e7eb;
}

.btn-page:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-number {
  font-weight: 600;
  color: #667eea;
}

.page-size-select {
  padding: 0.5rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.875rem;
  background: white;
  cursor: pointer;
}

/* ========== 响应式设计 ========== */
@media (max-width: 1024px) {
  .page-container {
    grid-template-columns: 260px 1fr;
  }

  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 1rem;
  }

  .page-container {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .sidebar {
    order: 2;
  }

  .content-header {
    flex-direction: column;
    align-items: flex-start;
  }

  .header-actions {
    flex-direction: column;
    width: 100%;
  }

  .empty-actions {
    flex-direction: column;
    width: 100%;
  }

  .btn-upload-empty,
  .btn-upload-header {
    width: 100%;
    justify-content: center;
  }

  .upload-bar-content {
    flex-direction: column;
    text-align: center;
  }

  .upload-bar-info {
    flex-direction: column;
  }

  .btn-upload-bottom {
    width: 100%;
    justify-content: center;
  }

  .search-bar {
    max-width: 100%;
    width: 100%;
  }

  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(160px, 1fr));
    gap: 1rem;
  }

  .image-info {
    padding: 0.75rem;
  }

  .image-title {
    font-size: 0.875rem;
  }

  .image-desc {
    display: none;
  }

  .pagination {
    flex-direction: column;
    gap: 1rem;
  }
}

/* ========== 编辑对话框 ========== */
.edit-dialog-overlay {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 1000;
  padding: 2rem;
}

.edit-dialog {
  background: white;
  border-radius: 16px;
  width: 100%;
  max-width: 600px;
  max-height: 90vh;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
}

.dialog-header {
  padding: 1.5rem;
  border-bottom: 1px solid #e5e7eb;
  position: relative;
}

.dialog-header h3 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
}

.dialog-subtitle {
  margin: 0.25rem 0 0 0;
  font-size: 0.875rem;
  color: #6b7280;
}

.btn-close {
  position: absolute;
  top: 1rem;
  right: 1rem;
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
  color: #374151;
}

.dialog-body {
  padding: 1.5rem;
  overflow-y: auto;
  flex: 1;
}

.preview-section {
  margin-bottom: 1.5rem;
}

.preview-container {
  position: relative;
  display: inline-block;
  width: 100%;
}

.preview-image {
  width: 100%;
  max-height: 200px;
  object-fit: contain;
  border-radius: 8px;
  background: #f3f4f6;
}

.preview-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  border-radius: 8px;
}

.preview-container:hover .preview-overlay {
  opacity: 1;
}

.btn-reupload {
  display: inline-flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1.25rem;
  background: white;
  border: none;
  border-radius: 8px;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn-reupload:hover:not(:disabled) {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
}

.btn-reupload:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-reupload .icon {
  width: 16px;
  height: 16px;
}

.form-group {
  margin-bottom: 1.25rem;
}

.form-label {
  display: block;
  font-size: 0.875rem;
  font-weight: 500;
  color: #374151;
  margin-bottom: 0.5rem;
}

.form-label.required::after {
  content: '*';
  color: #ef4444;
  margin-left: 0.25rem;
}

.form-input,
.form-textarea,
.form-select {
  width: 100%;
  padding: 0.75rem;
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  font-size: 0.9375rem;
  transition: border-color 0.2s;
  box-sizing: border-box;
}

.form-input:focus,
.form-textarea:focus,
.form-select:focus {
  outline: none;
  border-color: #667eea;
}

.error-text {
  font-size: 0.75rem;
  color: #ef4444;
  margin-top: 0.25rem;
  display: block;
}

.tag-input-section {
  border: 1px solid #e5e7eb;
  border-radius: 8px;
  padding: 0.75rem;
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

.dialog-footer {
  padding: 1rem 1.5rem;
  border-top: 1px solid #e5e7eb;
  display: flex;
  justify-content: flex-end;
  gap: 0.75rem;
}

.dialog-footer .btn-secondary {
  background: #f3f4f6;
  color: #374151;
}

.dialog-footer .btn-secondary:hover {
  background: #e5e7eb;
}

.dialog-footer .btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.dialog-footer .btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

@media (max-width: 640px) {
  .edit-dialog-overlay {
    padding: 1rem;
  }

  .edit-dialog {
    max-height: 95vh;
  }

  .dialog-header,
  .dialog-body,
  .dialog-footer {
    padding: 1rem;
  }
}
</style>
