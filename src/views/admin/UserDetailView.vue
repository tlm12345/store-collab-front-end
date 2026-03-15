/**
 * 用户详情页面
 * 显示用户详细信息，支持更新用户
 */

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  getUserById,
  updateUser
} from '@/api/user'
import type {
  UserVO,
  UserUpdateRequest
} from '@/types/api'

const route = useRoute()
const router = useRouter()

// ========== 状态 ==========

const userId = computed(() => route.params.id as string)
const user = ref<UserVO | null>(null)
const loading = ref(false)
const saving = ref(false)

// 编辑模式
const isEditing = ref(false)
const editForm = ref<UserUpdateRequest>({
  id: '',
  userName: '',
  userAvatar: '',
  userProfile: '',
  userRole: ''
})

// ========== 方法定义 ==========

/**
 * 加载用户详情
 */
async function loadUserDetail() {
  try {
    loading.value = true
    const response = await getUserById(userId.value)
    if (response.code === 0 && response.data) {
      user.value = response.data
      // 初始化编辑表单
      editForm.value = {
        id: response.data.id,
        userName: response.data.userName,
        userAvatar: response.data.userAvatar || '',
        userProfile: response.data.userProfile || '',
        userRole: response.data.userRole
      }
    } else {
      alert('加载用户详情失败')
    }
  } catch (error) {
    console.error('加载用户详情失败:', error)
    alert('加载用户详情失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

/**
 * 进入编辑模式
 */
function enterEditMode() {
  isEditing.value = true
}

/**
 * 取消编辑
 */
function cancelEdit() {
  isEditing.value = false
  // 重置表单
  if (user.value) {
    editForm.value = {
      id: user.value.id,
      userName: user.value.userName,
      userAvatar: user.value.userAvatar || '',
      userProfile: user.value.userProfile || '',
      userRole: user.value.userRole
    }
  }
}

/**
 * 保存更新
 */
async function saveUpdate() {
  try {
    saving.value = true
    const response = await updateUser(editForm.value)
    if (response.code === 0) {
      alert('更新成功')
      isEditing.value = false
      await loadUserDetail()
    } else {
      alert(response.description || response.message || '更新失败')
    }
  } catch (error) {
    console.error('更新用户失败:', error)
    alert('更新失败，请稍后重试')
  } finally {
    saving.value = false
  }
}

/**
 * 返回列表
 */
function goBack() {
  router.push('/admin/users')
}

// ========== 初始化 ==========

onMounted(() => {
  loadUserDetail()
})
</script>

<template>
  <div class="user-detail">
    <!-- 页面标题 -->
    <div class="page-header">
      <button class="btn-back" @click="goBack">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5"></path>
          <polyline points="12 19 5 12 12 5"></polyline>
        </svg>
        返回列表
      </button>
      <h1>用户详情</h1>
    </div>

    <!-- 加载状态 -->
    <div v-if="loading" class="loading">
      加载中...
    </div>

    <!-- 用户信息 -->
    <div v-else-if="user" class="user-info-card">
      <!-- 卡片头部：包含编辑按钮 -->
      <div class="card-header">
        <h2>基本信息</h2>
        <button v-if="!isEditing" class="btn-edit" @click="enterEditMode">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"></path>
            <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"></path>
          </svg>
          编辑用户
        </button>
      </div>

      <!-- 查看模式 -->
      <div v-if="!isEditing" class="view-mode">
        <div class="avatar-section">
          <img v-if="user.userAvatar" :src="user.userAvatar" :alt="user.userName" />
          <div v-else class="avatar-placeholder">{{ user.userName.charAt(0) }}</div>
        </div>

        <div class="info-section">
          <div class="info-item">
            <label>用户名</label>
            <span>{{ user.userName }}</span>
          </div>
          <div class="info-item">
            <label>账号</label>
            <span>{{ user.userAccount }}</span>
          </div>
          <div class="info-item">
            <label>角色</label>
            <span class="role-badge" :class="user.userRole">
              {{ user.userRole === 'admin' ? '管理员' : '普通用户' }}
            </span>
          </div>
          <div class="info-item">
            <label>简介</label>
            <span>{{ user.userProfile || '暂无简介' }}</span>
          </div>
          <div class="info-item">
            <label>创建时间</label>
            <span>{{ user.createTime || '未知' }}</span>
          </div>
          <div class="info-item">
            <label>更新时间</label>
            <span>{{ user.updateTime || '未知' }}</span>
          </div>
        </div>
      </div>

      <!-- 编辑模式 -->
      <div v-else class="edit-mode">
        <div class="avatar-section">
          <img v-if="editForm.userAvatar" :src="editForm.userAvatar" :alt="editForm.userName || ''" />
          <div v-else class="avatar-placeholder">{{ editForm.userName?.charAt(0) || '' }}</div>
        </div>

        <div class="form-section">
          <div class="form-group">
            <label>用户名</label>
            <input
              v-model="editForm.userName"
              type="text"
              placeholder="请输入用户名"
            />
          </div>
          <div class="form-group">
            <label>账号</label>
            <input
              :value="user.userAccount"
              type="text"
              disabled
            />
          </div>
          <div class="form-group">
            <label>角色</label>
            <select v-model="editForm.userRole">
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div class="form-group">
            <label>头像 URL</label>
            <input
              v-model="editForm.userAvatar"
              type="text"
              placeholder="请输入头像 URL"
            />
          </div>
          <div class="form-group">
            <label>简介</label>
            <textarea
              v-model="editForm.userProfile"
              rows="4"
              placeholder="请输入用户简介"
            ></textarea>
          </div>
        </div>

        <div class="form-actions">
          <button class="btn-secondary" @click="cancelEdit" :disabled="saving">
            取消
          </button>
          <button class="btn-primary" @click="saveUpdate" :disabled="saving">
            {{ saving ? '保存中...' : '保存' }}
          </button>
        </div>
      </div>
    </div>

    <!-- 加载失败 -->
    <div v-else class="error">
      加载失败
    </div>
  </div>
</template>

<style scoped>
/* ========== 页面布局 ========== */
.user-detail {
  max-width: 800px;
  margin: 0 auto;
}

/* ========== 页面标题 ========== */
.page-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  gap: 1rem;
}

.page-header h1 {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  color: #1a1a1a;
}

/* ========== 用户信息卡片 ========== */
.user-info-card {
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  overflow: hidden;
}

/* ========== 卡片头部 ========== */
.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 1.5rem 2rem;
  border-bottom: 1px solid #f0f0f0;
  background: #fafafa;
}

.card-header h2 {
  margin: 0;
  font-size: 1.25rem;
  font-weight: 600;
  color: #1a1a1a;
}

/* ========== 编辑按钮 ========== */
.btn-edit {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(102, 126, 234, 0.3);
}

.btn-edit:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.5);
}

.btn-edit svg {
  width: 16px;
  height: 16px;
}

/* ========== 返回按钮 ========== */
.btn-back {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.625rem 1.25rem;
  background: #f5f5f5;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  font-size: 0.9375rem;
  font-weight: 500;
  color: #666;
  transition: all 0.3s ease;
}

.btn-back:hover {
  background: #e8e8e8;
  color: #1a1a1a;
}

.btn-back svg {
  width: 18px;
  height: 18px;
}

/* ========== 加载和错误状态 ========== */
.loading,
.error {
  text-align: center;
  padding: 3rem;
  color: #999;
  font-size: 1.125rem;
}

/* ========== 查看模式 ========== */
.view-mode {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
}

.avatar-section {
  display: flex;
  justify-content: center;
  margin-bottom: 1rem;
}

.avatar-section img {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  object-fit: cover;
  border: 4px solid #f0f0f0;
}

.avatar-placeholder {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-weight: 700;
  font-size: 3rem;
  border: 4px solid #f0f0f0;
}

.info-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.info-item {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  padding-bottom: 1rem;
  border-bottom: 1px solid #f0f0f0;
}

.info-item:last-child {
  border-bottom: none;
}

.info-item label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
}

.info-item span {
  font-size: 1rem;
  color: #1a1a1a;
}

.role-badge {
  display: inline-block;
  padding: 0.375rem 0.875rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-badge.user {
  background: #e3f2fd;
  color: #1976d2;
}

.role-badge.admin {
  background: #fff3e0;
  color: #f57c00;
}

/* ========== 编辑模式 ========== */
.edit-mode {
  display: flex;
  flex-direction: column;
  gap: 2rem;
  padding: 2rem;
}

.form-section {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #666;
}

.form-group input,
.form-group select,
.form-group textarea {
  padding: 0.75rem 1rem;
  border: 1px solid #e0e0e0;
  border-radius: 8px;
  font-size: 0.9375rem;
  font-family: inherit;
  transition: all 0.3s ease;
}

.form-group input:focus,
.form-group select:focus,
.form-group textarea:focus {
  outline: none;
  border-color: #667eea;
  box-shadow: 0 0 0 3px rgba(102, 126, 234, 0.1);
}

.form-group input:disabled {
  background: #f5f5f5;
  cursor: not-allowed;
}

.form-group textarea {
  resize: vertical;
  min-height: 100px;
}

/* ========== 表单操作按钮 ========== */
.form-actions {
  display: flex;
  gap: 0.75rem;
  justify-content: flex-end;
  padding-top: 1rem;
  border-top: 1px solid #f0f0f0;
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
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-secondary {
  background: #f5f5f5;
  color: #666;
}

.btn-secondary:hover:not(:disabled) {
  background: #e8e8e8;
}

.btn-secondary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

/* ========== 响应式设计 ========== */
@media (max-width: 768px) {
  .page-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
  }

  .card-header {
    flex-direction: column;
    align-items: stretch;
    gap: 1rem;
    padding: 1.25rem 1.5rem;
  }

  .btn-edit {
    width: 100%;
    justify-content: center;
  }

  .view-mode,
  .edit-mode {
    padding: 1.5rem;
  }

  .btn-primary,
  .btn-secondary {
    width: 100%;
  }

  .form-actions {
    flex-direction: column;
  }
}
</style>
