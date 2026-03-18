/**
 * 图片管理页面
 * 包含图片列表、上传图片、编辑图片、删除图片等功能
 */

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import {
  listPictureByPage,
  listPictureByPageForAdmin,
  deletePicture,
  uploadPictureByUrl,
  uploadPictureByFile,
  updatePicture,
  editPicture,
  getPictureTagCategory
} from '@/api/picture'
import type {
  PictureQueryRequest,
  Picture,
  PictureVO,
  PictureEditRequest,
  PictureUpdateRequest
} from '@/types/api'
import { useUserStore } from '@/stores/user'

// ========== 状态 ==========

const userStore = useUserStore()

// 判断当前用户是否为管理员
const isAdmin = computed(() => userStore.user?.role === 'admin')

// 图片列表（支持 Picture 和 PictureVO 两种类型）
const pictures = ref<(Picture | PictureVO)[]>([])
const loading = ref(false)
const total = ref(0)
const current = ref(1)
const pageSize = ref(12) // 图片展示使用更大的页面
const pages = ref(0)

// 查询条件
const queryParams = ref<PictureQueryRequest>({
  pageNum: 1,
  pageSize: 12, 
  queryPrivateSpace: false
})

// 标签和分类选项
const tagCategories = ref<{ tags: string[]; categories: string[] }>({
  tags: [],
  categories: []
})

// 上传对话框
const showUploadDialog = ref(false)
const uploading = ref(false)
const uploadType = ref<'url' | 'file'>('file')

// 上传步骤: 1=选择文件/上传, 2=完善信息
const uploadStep = ref<1 | 2>(1)

// 上传后的图片信息（第一步返回）
const uploadedPictureId = ref<string>('')
const uploadedPictureUrl = ref<string>('')

// 上传表单（第二步使用）
const uploadForm = ref<{
  url: string
  name: string
  introduction: string
  category: string
  tags: string
}>({
  url: '',
  name: '',
  introduction: '',
  category: '',
  tags: ''
})

// 文件上传相关
const selectedFile = ref<File | undefined>(undefined)
const fileInputRef = ref<HTMLInputElement | null>(null)

// 编辑对话框
const showEditDialog = ref(false)
const editing = ref(false)
const editForm = ref<PictureUpdateRequest>({
  id: '',
  url: '',
  name: '',
  introduction: '',
  category: '',
  tags: '',
  viewStatus: 0,
  viewMessage: ''
})

// 图片预览
const previewImage = ref<(Picture | PictureVO) | null>(null)

// ========== 计算属性 ==========

// 格式化文件大小
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

// 格式化图片尺寸
function formatDimensions(width?: number, height?: number): string {
  if (!width || !height) return '-'
  return `${width} × ${height}`
}

// 解析标签
function parseTags(tagsJson?: string): string[] {
  if (!tagsJson) return []
  try {
    return JSON.parse(tagsJson)
  } catch {
    return []
  }
}

// 获取审核状态文本
function getReviewStatusText(status?: number): string {
  switch (status) {
    case 0: return '待审核'
    case 1: return '已通过'
    case 2: return '已拒绝'
    default: return '未知'
  }
}

// 获取审核状态样式
function getReviewStatusClass(status?: number): string {
  switch (status) {
    case 0: return 'pending'
    case 1: return 'approved'
    case 2: return 'rejected'
    default: return ''
  }
}

// ========== 方法定义 ==========

/**
 * 加载标签和分类
 */
async function loadTagCategories() {
  try {
    const response = await getPictureTagCategory()
    if (response.code === 0 && response.data) {
      tagCategories.value = response.data
    }
  } catch (error) {
    console.error('加载标签分类失败:', error)
  }
}

/**
 * 加载图片列表
 * 管理员用户使用 admin 接口，普通用户使用普通接口
 */
async function loadPictures() {
  try {
    loading.value = true

    // 构建查询参数，确保使用最新的分页状态
    const params: PictureQueryRequest = {
      ...queryParams.value,
      pageNum: current.value,
      pageSize: pageSize.value
    }

    console.log('分页查询请求:', { current: current.value, pageSize: pageSize.value, isAdmin: isAdmin.value })

    let response
    if (isAdmin.value) {
      // 管理员使用专用接口
      response = await listPictureByPageForAdmin(params)
    } else {
      // 普通用户使用普通接口
      response = await listPictureByPage(params)
    }

    console.log('分页查询响应:', response)

    if (response.code === 0 && response.data) {
      pictures.value = response.data.records
      total.value = Number(response.data.total) || 0

      // 只有响应中包含有效的分页信息时才更新，避免覆盖用户的分页操作
      if (response.data.size !== undefined && response.data.size !== null) {
        pageSize.value = Number(response.data.size)
      }
      if (response.data.current !== undefined && response.data.current !== null) {
        current.value = Number(response.data.current)
      }
      if (response.data.pages !== undefined && response.data.pages !== null) {
        pages.value = Number(response.data.pages)
      }
    }
  } catch (error) {
    console.error('加载图片列表失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 搜索图片
 */
function handleSearch() {
  current.value = 1
  queryParams.value.pageNum = 1
  loadPictures()
}

/**
 * 重置搜索条件
 */
function handleReset() {
  // 重置所有查询条件（保留对象引用，避免破坏 v-model 绑定）
  queryParams.value.searchText = undefined
  queryParams.value.name = undefined
  queryParams.value.category = undefined
  queryParams.value.picFormat = undefined
  queryParams.value.picWidth = undefined
  queryParams.value.picHeight = undefined
  queryParams.value.minPicSize = undefined
  queryParams.value.maxPicSize = undefined
  queryParams.value.tags = undefined
  queryParams.value.userId = undefined
  queryParams.value.spaceId = undefined
  queryParams.value.queryPrivateSpace = false
  queryParams.value.pageNum = 1
  queryParams.value.pageSize = 12

  current.value = 1
  pageSize.value = 12
  loadPictures()
}

/**
 * 分页切换
 */
function handlePageChange(page: number) {
  current.value = page
  queryParams.value.pageNum = page
  loadPictures()
}

/**
 * 每页数量变化
 */
function handlePageSizeChange(size: number) {
  pageSize.value = size
  current.value = 1
  queryParams.value.pageNum = 1
  queryParams.value.pageSize = size
  loadPictures()
}

/**
 * 格式化日期时间
 */
function formatDateTime(dateStr: string | null | undefined): string {
  if (!dateStr) return '-'
  try {
    const date = new Date(dateStr)
    const year = date.getFullYear()
    const month = String(date.getMonth() + 1).padStart(2, '0')
    const day = String(date.getDate()).padStart(2, '0')
    const hours = String(date.getHours()).padStart(2, '0')
    const minutes = String(date.getMinutes()).padStart(2, '0')
    return `${year}-${month}-${day} ${hours}:${minutes}`
  } catch (error) {
    console.error('日期格式化失败:', error)
    return '-'
  }
}

/**
 * 打开上传对话框
 */
function openUploadDialog() {
  uploadType.value = 'file'
  uploadStep.value = 1
  uploadedPictureId.value = ''
  uploadedPictureUrl.value = ''
  uploadForm.value = {
    url: '',
    name: '',
    introduction: '',
    category: '',
    tags: ''
  }
  selectedFile.value = undefined
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
  showUploadDialog.value = true
}

/**
 * 关闭上传对话框
 */
function closeUploadDialog() {
  showUploadDialog.value = false
  uploadStep.value = 1
  uploadedPictureId.value = ''
  uploadedPictureUrl.value = ''
  uploadForm.value = {
    url: '',
    name: '',
    introduction: '',
    category: '',
    tags: ''
  }
  selectedFile.value = undefined
  if (fileInputRef.value) {
    fileInputRef.value.value = ''
  }
}

/**
 * 处理文件选择并立即上传（第一步）
 */
async function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const files = target.files
  if (!files || files.length === 0) return

  const file = files[0]
  if (!file) return

  selectedFile.value = file
  // 自动填充文件名
  const defaultName = file.name.replace(/\.[^/.]+$/, '')
  uploadForm.value.name = defaultName

  // 第一步：上传文件
  try {
    uploading.value = true
    console.log('开始上传文件:', file.name)

    // 只传文件，不传其他参数
    const response = await uploadPictureByFile(file)
    console.log('上传响应:', response)

    if (response.code === 0 && response.data) {
      // 保存返回的图片信息
      uploadedPictureId.value = String(response.data.id)
      uploadedPictureUrl.value = response.data.url
      uploadForm.value.url = response.data.url

      // 进入第二步：完善信息
      uploadStep.value = 2
      alert('图片上传成功，请完善图片信息')
    } else {
      alert(response.description || response.message || '上传失败')
      // 清空文件选择
      selectedFile.value = undefined
      if (fileInputRef.value) {
        fileInputRef.value.value = ''
      }
    }
  } catch (error: any) {
    console.error('上传文件失败:', error)
    alert('上传失败: ' + (error.message || '请稍后重试'))
    // 清空文件选择
    selectedFile.value = undefined
    if (fileInputRef.value) {
      fileInputRef.value.value = ''
    }
  } finally {
    uploading.value = false
  }
}

/**
 * 保存图片信息（第二步）
 * 调用 edit 接口更新图片信息
 */
async function handleUpload() {
  // 检查是否有上传的图片 ID
  if (!uploadedPictureId.value) {
    alert('请先上传图片文件')
    return
  }

  if (!uploadForm.value.name?.trim()) {
    alert('请输入图片名称')
    return
  }

  try {
    uploading.value = true

    // 处理标签：将逗号分隔的字符串转为 JSON 数组字符串
    let tagsValue: string | undefined
    if (uploadForm.value.tags?.trim()) {
      const tagArray = uploadForm.value.tags.split(',').map(t => t.trim()).filter(t => t)
      tagsValue = JSON.stringify(tagArray)
      console.log('标签处理:', { raw: uploadForm.value.tags, array: tagArray, json: tagsValue })
    }

    // 第二步：调用 edit 接口更新图片信息
    const editData: PictureEditRequest = {
      id: uploadedPictureId.value,
      name: uploadForm.value.name.trim(),
      introduction: uploadForm.value.introduction?.trim() || undefined,
      category: uploadForm.value.category || undefined,
      tags: tagsValue
    }

    console.log('更新图片信息:', editData)
    const response = await editPicture(editData)

    if (response.code === 0) {
      alert('图片信息保存成功')
      closeUploadDialog()
      await loadPictures()
    } else {
      alert(response.description || response.message || '保存失败')
    }
  } catch (error) {
    console.error('保存图片信息失败:', error)
    alert('保存失败，请稍后重试')
  } finally {
    uploading.value = false
  }
}

/**
 * 打开编辑对话框
 */
function openEditDialog(picture: Picture | PictureVO) {
  editForm.value = {
    id: picture.id,
    url: picture.url,
    name: picture.name,
    introduction: picture.introduction || '',
    category: picture.category || '',
    tags: picture.tags || '[]',
    viewStatus: picture.viewStatus || 0,
    viewMessage: picture.viewMessage || ''
  }
  showEditDialog.value = true
}

/**
 * 关闭编辑对话框
 */
function closeEditDialog() {
  showEditDialog.value = false
  editForm.value = {
    id: '',
    url: '',
    name: '',
    introduction: '',
    category: '',
    tags: '',
    viewStatus: 0,
    viewMessage: ''
  }
}

/**
 * 保存编辑
 */
async function handleEditSave() {
  if (!editForm.value.name?.trim()) {
    alert('请输入图片名称')
    return
  }

  try {
    editing.value = true
    const response = await updatePicture(editForm.value)
    if (response.code === 0) {
      alert('保存成功')
      closeEditDialog()
      await loadPictures()
    } else {
      alert(response.description || response.message || '保存失败')
    }
  } catch (error) {
    console.error('保存图片失败:', error)
    alert('保存失败，请稍后重试')
  } finally {
    editing.value = false
  }
}

/**
 * 删除图片
 */
async function handleDelete(id: string, name: string) {
  if (!confirm(`确定要删除图片"${name}"吗？此操作不可撤销。`)) {
    return
  }

  try {
    loading.value = true
    const response = await deletePicture(id)
    if (response.code === 0) {
      alert('删除成功')
      await loadPictures()
    } else {
      alert(response.description || response.message || '删除失败')
    }
  } catch (error) {
    console.error('删除图片失败:', error)
    alert('删除失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

/**
 * 打开图片预览
 */
function openPreview(picture: Picture | PictureVO) {
  previewImage.value = picture
}

/**
 * 关闭图片预览
 */
function closePreview() {
  previewImage.value = null
}

// ========== 初始化 ==========

onMounted(() => {
  loadPictures()
  loadTagCategories()
})
</script>

<template>
  <div class="picture-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>图片管理</h1>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <button class="btn-primary btn-upload" @click="openUploadDialog">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        上传图片
      </button>
    </div>

    <!-- 搜索表单 -->
    <div class="search-form">
      <div class="form-row">
        <div class="form-group">
          <label>关键词</label>
          <input
            v-model="queryParams.searchText"
            type="text"
            placeholder="搜索名称或描述"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="form-group">
          <label>图片名称</label>
          <input
            v-model="queryParams.name"
            type="text"
            placeholder="请输入图片名称"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="form-group">
          <label>分类</label>
          <select v-model="queryParams.category">
            <option value="">全部</option>
            <option v-for="cat in tagCategories.categories" :key="cat" :value="cat">{{ cat }}</option>
          </select>
        </div>
        <div class="form-group">
          <label>格式</label>
          <select v-model="queryParams.picFormat">
            <option value="">全部</option>
            <option value="jpg">JPG</option>
            <option value="jpeg">JPEG</option>
            <option value="png">PNG</option>
            <option value="gif">GIF</option>
            <option value="webp">WebP</option>
          </select>
        </div>
      </div>
      <div class="form-row">
        <div class="form-group">
          <label>宽度</label>
          <input
            v-model.number="queryParams.picWidth"
            type="number"
            placeholder="精确宽度"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="form-group">
          <label>高度</label>
          <input
            v-model.number="queryParams.picHeight"
            type="number"
            placeholder="精确高度"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="form-group">
          <label>最小大小(B)</label>
          <input
            v-model.number="queryParams.minPicSize"
            type="number"
            placeholder="最小文件大小"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="form-group">
          <label>最大大小(B)</label>
          <input
            v-model.number="queryParams.maxPicSize"
            type="number"
            placeholder="最大文件大小"
            @keyup.enter="handleSearch"
          />
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" @click="handleSearch">搜索</button>
        <button class="btn-secondary" @click="handleReset">重置</button>
      </div>
    </div>

    <!-- 图片列表 -->
    <div class="picture-list">
      <div v-if="loading" class="loading">
        加载中...
      </div>
      <div v-else-if="pictures.length === 0" class="empty">
        暂无数据
      </div>
      <div v-else class="picture-grid">
        <div
          v-for="picture in pictures"
          :key="picture.id"
          class="picture-card"
        >
          <!-- 图片缩略图 -->
          <div class="picture-thumbnail" @click="openPreview(picture)">
            <img :src="picture.url" :alt="picture.name" loading="lazy" />
            <div class="picture-overlay">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"></circle>
                <line x1="21" y1="21" x2="16.65" y2="16.65"></line>
                <line x1="11" y1="8" x2="11" y2="14"></line>
                <line x1="8" y1="11" x2="14" y2="11"></line>
              </svg>
              <span>点击查看</span>
            </div>
            <!-- 审核状态标签 -->
            <div class="review-badge" :class="getReviewStatusClass(picture.viewStatus)">
              {{ getReviewStatusText(picture.viewStatus) }}
            </div>
          </div>

          <!-- 图片信息 -->
          <div class="picture-info">
            <h3 class="picture-name" :title="picture.name">{{ picture.name }}</h3>
            <p v-if="picture.introduction" class="picture-intro" :title="picture.introduction">
              {{ picture.introduction }}
            </p>
            <div class="picture-meta">
              <span v-if="picture.category" class="category-badge">{{ picture.category }}</span>
            </div>
            <div v-if="parseTags(picture.tags).length > 0" class="picture-tags">
              <span
                v-for="tag in parseTags(picture.tags).slice(0, 3)"
                :key="tag"
                class="tag"
              >{{ tag }}</span>
              <span v-if="parseTags(picture.tags).length > 3" class="tag-more">
                +{{ parseTags(picture.tags).length - 3 }}
              </span>
            </div>
            <div class="picture-details">
              <span class="detail-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                </svg>
                {{ formatDimensions(picture.picWidth, picture.picHeight) }}
              </span>
              <span class="detail-item">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
                  <polyline points="7 10 12 15 17 10"></polyline>
                  <line x1="12" y1="15" x2="12" y2="3"></line>
                </svg>
                {{ formatFileSize(picture.picSize) }}
              </span>
            </div>
            <div class="picture-footer">
              <span class="picture-time">{{ formatDateTime(picture.createTime) }}</span>
              <div class="picture-actions">
                <button class="btn-action btn-edit" @click="openEditDialog(picture)" title="编辑">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
                    <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
                  </svg>
                </button>
                <button
                  class="btn-action btn-delete"
                  @click="handleDelete(picture.id, picture.name)"
                  title="删除"
                >
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <polyline points="3 6 5 6 21 6"></polyline>
                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                  </svg>
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 分页 -->
    <div v-if="total > 0" class="pagination">
      <button
        :disabled="current === 1"
        class="page-btn"
        @click="handlePageChange(current - 1)"
      >
        上一页
      </button>
      <span class="page-info">
        第 {{ current }} 页 / 共 {{ pages || Math.ceil(total / pageSize) }} 页
        <span class="total-info">（共 {{ total }} 条记录）</span>
      </span>
      <button
        :disabled="current >= (pages || Math.ceil(total / pageSize))"
        class="page-btn"
        @click="handlePageChange(current + 1)"
      >
        下一页
      </button>
      <div class="page-size-selector">
        <span>每页</span>
        <select :value="pageSize" @change="handlePageSizeChange(Number(($event.target as HTMLSelectElement).value))">
          <option :value="12">12</option>
          <option :value="24">24</option>
          <option :value="48">48</option>
        </select>
        <span>条</span>
      </div>
    </div>

    <!-- 上传图片对话框 -->
    <div v-if="showUploadDialog" class="dialog-overlay" @click="closeUploadDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h2>{{ uploadStep === 1 ? '上传图片' : '完善图片信息' }}</h2>
          <button class="dialog-close" @click="closeUploadDialog">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="dialog-body">
          <!-- 步骤指示器 -->
          <div class="step-indicator">
            <div class="step" :class="{ active: uploadStep === 1, completed: uploadStep > 1 }">
              <span class="step-number">1</span>
              <span class="step-label">上传文件</span>
            </div>
            <div class="step-line"></div>
            <div class="step" :class="{ active: uploadStep === 2 }">
              <span class="step-number">2</span>
              <span class="step-label">完善信息</span>
            </div>
          </div>

          <!-- 第一步：选择并上传文件 -->
          <div v-if="uploadStep === 1" class="upload-step-1">
            <div class="form-group">
              <label>选择图片文件 *</label>
              <input
                ref="fileInputRef"
                type="file"
                accept="image/*"
                @change="handleFileChange"
                :disabled="uploading"
              />
              <p v-if="uploading" class="upload-status">
                <span class="loading-spinner"></span>
                正在上传文件，请稍候...
              </p>
              <p class="upload-hint">支持 JPG、PNG、GIF、WebP 格式，文件大小建议不超过 10MB</p>
            </div>
          </div>

          <!-- 第二步：完善图片信息 -->
          <div v-else class="upload-step-2">
            <!-- 图片预览 -->
            <div class="upload-preview">
              <img :src="uploadedPictureUrl" alt="上传预览" />
            </div>

            <div class="form-group">
              <label>图片名称 *</label>
              <input
                v-model="uploadForm.name"
                type="text"
                placeholder="请输入图片名称"
              />
            </div>
            <div class="form-group">
              <label>图片描述</label>
              <textarea
                v-model="uploadForm.introduction"
                rows="3"
                placeholder="请输入图片描述"
              ></textarea>
            </div>
            <div class="form-group">
              <label>分类</label>
              <select v-model="uploadForm.category">
                <option value="">请选择分类</option>
                <option v-for="cat in tagCategories.categories" :key="cat" :value="cat">{{ cat }}</option>
              </select>
            </div>
            <div class="form-group">
              <label>标签（用逗号分隔）</label>
              <input
                v-model="uploadForm.tags"
                type="text"
                placeholder="例如: 风景, 自然, 旅游"
              />
            </div>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary" @click="closeUploadDialog" :disabled="uploading">
            取消
          </button>
          <button
            v-if="uploadStep === 2"
            class="btn-secondary"
            @click="uploadStep = 1; uploadedPictureId = ''; uploadedPictureUrl = ''"
            :disabled="uploading"
          >
            重新选择
          </button>
          <button
            v-if="uploadStep === 2"
            class="btn-primary"
            @click="handleUpload"
            :disabled="uploading"
          >
            {{ uploading ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 编辑图片对话框 -->
    <div v-if="showEditDialog" class="dialog-overlay" @click="closeEditDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h2>编辑图片</h2>
          <button class="dialog-close" @click="closeEditDialog">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="dialog-body">
          <!-- 图片预览 -->
          <div class="edit-preview">
            <img :src="editForm.url" :alt="editForm.name" />
          </div>
          <div class="form-group">
            <label>图片名称 *</label>
            <input
              v-model="editForm.name"
              type="text"
              placeholder="请输入图片名称"
            />
          </div>
          <div class="form-group">
            <label>图片描述</label>
            <textarea
              v-model="editForm.introduction"
              rows="3"
              placeholder="请输入图片描述"
            ></textarea>
          </div>
          <div class="form-group">
            <label>分类</label>
            <select v-model="editForm.category">
              <option value="">请选择分类</option>
              <option v-for="cat in tagCategories.categories" :key="cat" :value="cat">{{ cat }}</option>
            </select>
          </div>
          <div class="form-group">
            <label>标签（JSON 数组格式）</label>
            <input
              v-model="editForm.tags"
              type="text"
              placeholder='例如: ["风景", "自然"]'
            />
          </div>
          <div class="form-group">
            <label>审核状态</label>
            <select v-model.number="editForm.viewStatus">
              <option :value="0">待审核</option>
              <option :value="1">已通过</option>
              <option :value="2">已拒绝</option>
            </select>
          </div>
          <div class="form-group">
            <label>审核信息</label>
            <input
              v-model="editForm.viewMessage"
              type="text"
              placeholder="请输入审核信息"
            />
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary" @click="closeEditDialog" :disabled="editing">
            取消
          </button>
          <button class="btn-primary" @click="handleEditSave" :disabled="editing">
            {{ editing ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 图片预览对话框 -->
    <div v-if="previewImage" class="dialog-overlay preview-overlay" @click="closePreview">
      <div class="preview-content" @click.stop>
        <button class="preview-close" @click="closePreview">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <line x1="18" y1="6" x2="6" y2="18"></line>
            <line x1="6" y1="6" x2="18" y2="18"></line>
          </svg>
        </button>
        <img :src="previewImage.url" :alt="previewImage.name" />
        <div class="preview-info">
          <h3>{{ previewImage.name }}</h3>
          <p v-if="previewImage.introduction">{{ previewImage.introduction }}</p>
          <div class="preview-meta">
            <span>{{ formatDimensions(previewImage.picWidth, previewImage.picHeight) }}</span>
            <span>{{ formatFileSize(previewImage.picSize) }}</span>
            <span>{{ previewImage.picFormat?.toUpperCase() }}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== 页面布局 ========== */
.picture-management {
  max-width: 1400px;
  margin: 0 auto;
  padding-top: 1rem;
}

/* ========== 页面标题 ========== */
.page-header {
  margin-bottom: 1.5rem;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: #1a1a1a;
}

/* ========== 操作栏 ========== */
.action-bar {
  background: white;
  border-radius: 16px;
  padding: 1.25rem 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
}

.btn-upload {
  min-width: 140px;
}

.btn-icon {
  width: 18px;
  height: 18px;
  margin-right: 0.5rem;
}

/* ========== 搜索表单 ========== */
.search-form {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.form-row {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 1rem;
  margin-bottom: 1rem;
}

.form-row:last-child {
  margin-bottom: 0;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-weight: 500;
  font-size: 0.875rem;
  color: #666;
}

.form-group input,
.form-group select {
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9375rem;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
}

/* ========== 图片列表 ========== */
.picture-list {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  margin-bottom: 1.5rem;
}

.loading,
.empty {
  text-align: center;
  padding: 3rem;
  color: #999;
}

.picture-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(280px, 1fr));
  gap: 1.5rem;
}

.picture-card {
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  overflow: hidden;
  transition: all 0.3s ease;
  background: white;
}

.picture-card:hover {
  border-color: #667eea;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
  transform: translateY(-4px);
}

/* 图片缩略图 */
.picture-thumbnail {
  position: relative;
  aspect-ratio: 4/3;
  overflow: hidden;
  cursor: pointer;
  background: #f5f5f5;
}

.picture-thumbnail img {
  width: 100%;
  height: 100%;
  object-fit: cover;
  transition: transform 0.3s ease;
}

.picture-card:hover .picture-thumbnail img {
  transform: scale(1.05);
}

.picture-overlay {
  position: absolute;
  inset: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s ease;
  color: white;
  gap: 0.5rem;
}

.picture-card:hover .picture-overlay {
  opacity: 1;
}

.picture-overlay svg {
  width: 32px;
  height: 32px;
}

.review-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  padding: 0.25rem 0.5rem;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 600;
}

.review-badge.pending {
  background: #fff3e0;
  color: #f57c00;
}

.review-badge.approved {
  background: #e8f5e9;
  color: #388e3c;
}

.review-badge.rejected {
  background: #ffebee;
  color: #d32f2f;
}

/* 图片信息 */
.picture-info {
  padding: 1rem;
}

.picture-name {
  margin: 0 0 0.5rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picture-intro {
  margin: 0 0 0.75rem 0;
  font-size: 0.875rem;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.picture-meta {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.category-badge {
  padding: 0.25rem 0.5rem;
  background: #e3f2fd;
  color: #1976d2;
  border-radius: 4px;
  font-size: 0.75rem;
  font-weight: 500;
}

.picture-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 0.375rem;
  margin-bottom: 0.75rem;
}

.tag {
  padding: 0.125rem 0.375rem;
  background: #f5f5f5;
  color: #666;
  border-radius: 4px;
  font-size: 0.75rem;
}

.tag-more {
  padding: 0.125rem 0.375rem;
  color: #999;
  font-size: 0.75rem;
}

.picture-details {
  display: flex;
  gap: 1rem;
  margin-bottom: 0.75rem;
}

.detail-item {
  display: flex;
  align-items: center;
  gap: 0.25rem;
  font-size: 0.8125rem;
  color: #999;
}

.detail-item svg {
  width: 14px;
  height: 14px;
}

.picture-footer {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding-top: 0.75rem;
  border-top: 1px solid #f0f0f0;
}

.picture-time {
  font-size: 0.75rem;
  color: #999;
}

.picture-actions {
  display: flex;
  gap: 0.5rem;
}

.btn-action {
  padding: 0.5rem;
  background: none;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-action svg {
  width: 16px;
  height: 16px;
}

.btn-edit {
  color: #667eea;
  background: #f0f4ff;
}

.btn-edit:hover {
  background: #e0e7ff;
}

.btn-delete {
  color: #dc2626;
  background: #fef2f2;
}

.btn-delete:hover {
  background: #fee2e2;
}

/* ========== 分页 ========== */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
  flex-wrap: wrap;
}

.page-btn {
  padding: 0.625rem 1.25rem;
  background: white;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9375rem;
  font-weight: 500;
  transition: all 0.3s ease;
}

.page-btn:hover:not(:disabled) {
  background: #f5f5f5;
  border-color: #667eea;
  color: #667eea;
}

.page-btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  font-size: 0.9375rem;
  color: #666;
}

.total-info {
  color: #999;
  font-size: 0.875rem;
}

.page-size-selector {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  font-size: 0.9375rem;
  color: #666;
}

.page-size-selector select {
  padding: 0.375rem 0.5rem;
  border: 1px solid #e0e0e0;
  border-radius: 6px;
  font-size: 0.9375rem;
}

/* ========== 对话框样式 ========== */
.dialog-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  padding: 1rem;
}

.dialog-content {
  background: white;
  border-radius: 16px;
  max-width: 500px;
  width: 100%;
  max-height: 90vh;
  overflow-y: auto;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
  animation: slideIn 0.3s ease;
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

.dialog-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 1.5rem;
  border-bottom: 1px solid #f0f0f0;
}

.dialog-header h2 {
  margin: 0;
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
}

.dialog-close {
  background: none;
  border: none;
  cursor: pointer;
  padding: 0.5rem;
  color: #999;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.dialog-close:hover {
  color: #1a1a1a;
  background: #f5f5f5;
  border-radius: 8px;
}

.dialog-close svg {
  width: 20px;
  height: 20px;
}

.dialog-body {
  padding: 1.5rem;
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.dialog-body .form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.dialog-body .form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
}

.dialog-body .form-group input,
.dialog-body .form-group select,
.dialog-body .form-group textarea {
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-family: inherit;
  transition: all 0.3s ease;
}

.dialog-body .form-group input:focus,
.dialog-body .form-group select:focus,
.dialog-body .form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.dialog-body .form-group textarea {
  resize: vertical;
  min-height: 80px;
}

.dialog-footer {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding: 1.5rem;
  border-top: 1px solid #f0f0f0;
}

.dialog-footer .btn-primary,
.dialog-footer .btn-secondary {
  padding: 0.625rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
}

.dialog-footer .btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.dialog-footer .btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.dialog-footer .btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.dialog-footer .btn-secondary {
  background: #f5f5f5;
  color: #666;
}

.dialog-footer .btn-secondary:hover:not(:disabled) {
  background: #e8e8e8;
}

.dialog-footer .btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ========== 上传对话框特殊样式 ========== */
.upload-type-tabs {
  display: flex;
  gap: 0.5rem;
  margin-bottom: 0.5rem;
}

.tab-btn {
  flex: 1;
  padding: 0.75rem;
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #666;
  cursor: pointer;
  transition: all 0.3s ease;
}

.tab-btn.active {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.file-selected {
  font-size: 0.875rem;
  color: #667eea;
  margin-top: 0.5rem;
}

/* ========== 编辑预览 ========== */
.edit-preview {
  width: 100%;
  aspect-ratio: 16/9;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
}

.edit-preview img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

/* ========== 步骤指示器 ========== */
.step-indicator {
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
  padding: 0 1rem;
}

.step {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: #e0e0e0;
  color: #666;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 600;
  font-size: 0.875rem;
  transition: all 0.3s ease;
}

.step.active .step-number {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.step.completed .step-number {
  background: #4caf50;
  color: white;
}

.step-label {
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
}

.step.active .step-label {
  color: #667eea;
  font-weight: 600;
}

.step-line {
  flex: 1;
  height: 2px;
  background: #e0e0e0;
  margin: 0 1rem;
  margin-bottom: 1.5rem;
  max-width: 100px;
}

/* ========== 上传步骤样式 ========== */
.upload-step-1,
.upload-step-2 {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

.upload-status {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  color: #667eea;
  font-size: 0.9375rem;
  margin-top: 0.75rem;
}

.loading-spinner {
  width: 16px;
  height: 16px;
  border: 2px solid #e0e0e0;
  border-top-color: #667eea;
  border-radius: 50%;
  animation: spin 0.8s linear infinite;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.upload-hint {
  font-size: 0.8125rem;
  color: #999;
  margin-top: 0.5rem;
}

.upload-preview {
  width: 100%;
  max-height: 200px;
  border-radius: 8px;
  overflow: hidden;
  background: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.upload-preview img {
  max-width: 100%;
  max-height: 200px;
  object-fit: contain;
}

/* ========== 预览对话框 ========== */
.preview-overlay {
  background: rgba(0, 0, 0, 0.9);
}

.preview-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.preview-content img {
  max-width: 100%;
  max-height: 70vh;
  object-fit: contain;
  border-radius: 8px;
}

.preview-close {
  position: absolute;
  top: -40px;
  right: 0;
  background: none;
  border: none;
  color: white;
  cursor: pointer;
  padding: 0.5rem;
}

.preview-close svg {
  width: 24px;
  height: 24px;
}

.preview-info {
  text-align: center;
  color: white;
  margin-top: 1rem;
}

.preview-info h3 {
  margin: 0 0 0.5rem 0;
  font-size: 1.25rem;
}

.preview-info p {
  margin: 0 0 0.5rem 0;
  font-size: 0.9375rem;
  opacity: 0.8;
}

.preview-meta {
  display: flex;
  gap: 1rem;
  justify-content: center;
  font-size: 0.875rem;
  opacity: 0.6;
}

/* ========== 按钮样式 ========== */
.btn-primary,
.btn-secondary {
  padding: 0.625rem 1.5rem;
  border: none;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
}

.btn-secondary:hover {
  background: #e8e8e8;
}

/* ========== 响应式设计 ========== */
@media (max-width: 768px) {
  .action-bar {
    justify-content: center;
  }

  .form-row {
    grid-template-columns: 1fr;
  }

  .form-actions {
    flex-direction: column;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
    justify-content: center;
  }

  .picture-grid {
    grid-template-columns: 1fr;
  }

  .pagination {
    flex-direction: column;
    gap: 0.75rem;
  }
}
</style>
