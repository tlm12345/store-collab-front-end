<script setup lang="ts">
/**
 * 用户图库页面
 * 展示公共图片列表，支持搜索、筛选和分页
 */

import { ref, computed, onMounted, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'
import { listPictureByPage, getPictureTagCategory } from '@/api/picture'
import type { PictureVO, PictureQueryRequest, PictureTagCategory } from '@/types/api'

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

// ========== 计算属性 ==========

const isAdmin = computed(() => userStore.user?.role === 'admin')

const hasActiveFilters = computed(() => {
  return selectedCategory.value || selectedTags.value.length > 0 || selectedFormat.value
})

// ========== 方法定义 ==========

/**
 * 获取图片列表
 */
async function fetchPictures() {
  try {
    loading.value = true

    const query: PictureQueryRequest = {
      searchText: searchText.value || undefined,
      category: selectedCategory.value || undefined,
      tags: selectedTags.value.length > 0 ? selectedTags.value : undefined,
      picFormat: selectedFormat.value || undefined,
      queryPrivateSpace: false,
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
 * 查看图片详情
 */
function viewImageDetail(id: string) {
  router.push(`/gallery/${id}`)
}

/**
 * 跳转到管理员页面
 */
function goToAdmin() {
  router.push('/admin')
}

/**
 * 跳转到我的空间
 */
function goToMySpace() {
  router.push('/my-space')
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

// ========== 生命周期 ==========

onMounted(() => {
  fetchPictures()
  fetchTagCategory()
})

// 监听筛选条件变化
watch([selectedCategory, selectedFormat], () => {
  currentPage.value = 1
  fetchPictures()
})
</script>

<template>
  <div class="gallery-page">
    <!-- 顶部导航栏 -->
    <header class="gallery-header">
      <div class="header-content">
        <div class="logo-section">
          <h1 class="logo">Cloud Collab</h1>
          <span class="logo-subtitle">图库</span>
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

    <div class="gallery-container">
      <!-- 筛选侧边栏 -->
      <aside class="filter-sidebar" :class="{ 'show-mobile': showFilters }">
        <div class="filter-section">
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
        <!-- 搜索栏 -->
        <div class="search-section">
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
          <button v-if="!isAdmin" class="btn btn-primary btn-spaces" @click="goToMySpace">我的空间</button>
          <button class="btn-filter-toggle" @click="showFilters = !showFilters">
            <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polygon points="22 3 2 3 10 12.46 10 19 14 21 14 12.46 22 3"></polygon>
            </svg>
            筛选
            <span v-if="hasActiveFilters" class="filter-badge"></span>
          </button>
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
          <svg class="empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
          <p>暂无图片</p>
          <button v-if="hasActiveFilters" class="btn btn-primary" @click="clearFilters">
            清除筛选条件
          </button>
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
                <div class="creator">
                  <img
                    v-if="picture.userVO?.userAvatar"
                    :src="picture.userVO.userAvatar"
                    class="creator-avatar"
                    alt=""
                  />
                  <div v-else class="creator-avatar-placeholder">
                    {{ picture.userVO?.userName?.charAt(0) || '?' }}
                  </div>
                  <span class="creator-name">{{ picture.userVO?.userName || '未知用户' }}</span>
                </div>
                <span class="file-size">{{ formatFileSize(picture.picSize) }}</span>
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
  </div>
</template>

<style scoped>
/* ========== 页面布局 ========== */
.gallery-page {
  min-height: 100vh;
  background: #f5f7fa;
}

/* ========== 顶部导航 ========== */
.gallery-header {
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
  align-items: baseline;
  gap: 0.75rem;
}

.logo {
  font-size: 1.5rem;
  font-weight: 800;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
  margin: 0;
}

.logo-subtitle {
  font-size: 0.875rem;
  color: #6b7280;
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

.btn-large {
  font-size: 1.25rem;
  padding: 0.75rem 1.5rem;
  font-weight: 600;
}

.btn-spaces {
  padding: 0.875rem 2rem;
  font-size: 1rem;
  font-weight: 600;
  border-radius: 12px;
  white-space: nowrap;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.icon {
  width: 18px;
  height: 18px;
}

/* ========== 主体布局 ========== */
.gallery-container {
  max-width: 1400px;
  margin: 0 auto;
  padding: 2rem;
  display: grid;
  grid-template-columns: 240px 1fr;
  gap: 2rem;
}

/* ========== 筛选侧边栏 ========== */
.filter-sidebar {
  background: white;
  border-radius: 16px;
  padding: 1.5rem;
  height: fit-content;
  position: sticky;
  top: 88px;
}

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

.search-section {
  display: flex;
  gap: 1rem;
  margin-bottom: 1.5rem;
}

.search-bar {
  flex: 1;
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

.btn-filter-toggle {
  display: none;
  align-items: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  background: white;
  border: none;
  border-radius: 12px;
  font-size: 0.875rem;
  color: #4b5563;
  cursor: pointer;
  box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  position: relative;
}

.filter-badge {
  position: absolute;
  top: 8px;
  right: 8px;
  width: 8px;
  height: 8px;
  background: #ef4444;
  border-radius: 50%;
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

.creator {
  display: flex;
  align-items: center;
  gap: 0.5rem;
}

.creator-avatar {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  object-fit: cover;
}

.creator-avatar-placeholder {
  width: 24px;
  height: 24px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 0.75rem;
  font-weight: 600;
}

.creator-name {
  font-size: 0.75rem;
  color: #6b7280;
}

.file-size {
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
  margin-bottom: 1.5rem;
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
  .gallery-container {
    grid-template-columns: 200px 1fr;
  }

  .image-grid {
    grid-template-columns: repeat(auto-fill, minmax(240px, 1fr));
  }
}

@media (max-width: 768px) {
  .header-content {
    padding: 1rem;
  }

  .logo-subtitle {
    display: none;
  }

  .gallery-container {
    grid-template-columns: 1fr;
    padding: 1rem;
  }

  .filter-sidebar {
    display: none;
    position: fixed;
    inset: 0;
    z-index: 200;
    border-radius: 0;
  }

  .filter-sidebar.show-mobile {
    display: block;
  }

  .btn-filter-toggle {
    display: flex;
  }

  .search-section {
    flex-wrap: wrap;
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
</style>
