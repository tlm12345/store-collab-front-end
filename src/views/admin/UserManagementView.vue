/**
 * 用户管理页面
 * 包含用户列表、创建用户、更新用户等功能
 */

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import {
  listUserByPage,
  deleteUser,
  addUser
} from '@/api/user'
import type {
  UserQueryRequest,
  UserVO,
  UserAddRequest
} from '@/types/api'

const router = useRouter()

// ========== 状态 ==========

const users = ref<UserVO[]>([])
const loading = ref(false)
const total = ref(0)
const current = ref(1)
const pageSize = ref(10)
const pages = ref(0) // 总页数

// 查询条件
const queryParams = ref<UserQueryRequest>({
  current: 1,
  pageSize: 10
})

// 创建用户对话框
const showCreateDialog = ref(false)
const creating = ref(false)

// 创建用户表单
const createForm = ref<UserAddRequest>({
  userName: '',
  userAccount: '',
  userPassword: '',
  userAvatar: '',
  userProfile: '',
  userRole: 'user'
})

// ========== 方法定义 ==========

/**
 * 加载用户列表
 */
async function loadUsers() {
  try {
    loading.value = true
    queryParams.value.current = current.value
    queryParams.value.pageSize = pageSize.value

    const response = await listUserByPage(queryParams.value)
    console.log('分页查询响应:', response)
    if (response.code === 0 && response.data) {
      users.value = response.data.records
      // 响应中的字段可能是字符串类型，需要转换为数字
      total.value = Number(response.data.total) || 0
      pageSize.value = Number(response.data.size) || 10
      current.value = Number(response.data.current) || 1
      pages.value = Number(response.data.pages) || 0
      console.log('分页信息:', {
        total: total.value,
        pageSize: pageSize.value,
        current: current.value,
        pages: pages.value
      })
    }
  } catch (error) {
    console.error('加载用户列表失败:', error)
  } finally {
    loading.value = false
  }
}

/**
 * 搜索用户
 */
function handleSearch() {
  current.value = 1
  loadUsers()
}

/**
 * 重置搜索条件
 */
function handleReset() {
  queryParams.value = {
    current: 1,
    pageSize: 10
  }
  current.value = 1
  loadUsers()
}

/**
 * 查看用户详情
 */
function viewUserDetail(id: string) {
  router.push(`/admin/users/${id}`)
}

/**
 * 删除用户
 */
async function handleDelete(id: string, userName: string) {
  if (!confirm(`确定要删除用户"${userName}"吗？此操作不可撤销。`)) {
    return
  }

  try {
    loading.value = true
    const response = await deleteUser(id)
    if (response.code === 0) {
      alert('删除成功')
      await loadUsers()
    } else {
      alert(response.description || response.message || '删除失败')
    }
  } catch (error) {
    console.error('删除用户失败:', error)
    alert('删除失败，请稍后重试')
  } finally {
    loading.value = false
  }
}

/**
 * 分页切换
 */
function handlePageChange(page: number) {
  current.value = page
  loadUsers()
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
 * 打开创建用户对话框
 */
function openCreateDialog() {
  createForm.value = {
    userName: '',
    userAccount: '',
    userPassword: '',
    userAvatar: '',
    userProfile: '',
    userRole: 'user'
  }
  showCreateDialog.value = true
}

/**
 * 关闭创建用户对话框
 */
function closeCreateDialog() {
  showCreateDialog.value = false
  createForm.value = {
    userName: '',
    userAccount: '',
    userPassword: '',
    userAvatar: '',
    userProfile: '',
    userRole: 'user'
  }
}

/**
 * 创建用户
 */
async function handleCreateUser() {
  // 表单验证
  if (!createForm.value.userName.trim()) {
    alert('请输入用户名')
    return
  }
  if (!createForm.value.userAccount.trim()) {
    alert('请输入账号')
    return
  }
  if (!createForm.value.userPassword.trim()) {
    alert('请输入密码')
    return
  }
  if (createForm.value.userPassword.length < 6) {
    alert('密码长度至少为 6 位')
    return
  }

  try {
    creating.value = true
    const response = await addUser(createForm.value)
    if (response.code === 0) {
      alert('创建成功')
      closeCreateDialog()
      await loadUsers()
    } else {
      alert(response.description || response.message || '创建失败')
    }
  } catch (error) {
    console.error('创建用户失败:', error)
    alert('创建失败，请稍后重试')
  } finally {
    creating.value = false
  }
}

// ========== 初始化 ==========

onMounted(() => {
  loadUsers()
})
</script>

<template>
  <div class="user-management">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>用户管理</h1>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <button class="btn-primary btn-create" @click="openCreateDialog">
        <svg class="btn-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <line x1="12" y1="5" x2="12" y2="19"></line>
          <line x1="5" y1="12" x2="19" y2="12"></line>
        </svg>
        创建用户
      </button>
    </div>

    <!-- 搜索表单 -->
    <div class="search-form">
      <div class="form-row">
        <div class="form-group">
          <label>用户名</label>
          <input
            v-model="queryParams.userName"
            type="text"
            placeholder="请输入用户名"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="form-group">
          <label>账号</label>
          <input
            v-model="queryParams.userAccount"
            type="text"
            placeholder="请输入账号"
            @keyup.enter="handleSearch"
          />
        </div>
        <div class="form-group">
          <label>角色</label>
          <select v-model="queryParams.userRole">
            <option value="">全部</option>
            <option value="user">普通用户</option>
            <option value="admin">管理员</option>
          </select>
        </div>
      </div>
      <div class="form-actions">
        <button class="btn-primary" @click="handleSearch">搜索</button>
        <button class="btn-secondary" @click="handleReset">重置</button>
      </div>
    </div>

    <!-- 用户列表 -->
    <div class="user-list">
      <div v-if="loading" class="loading">
        加载中...
      </div>
      <div v-else-if="users.length === 0" class="empty">
        暂无数据
      </div>
      <div v-else class="list-container">
        <div
          v-for="user in users"
          :key="user.id"
          class="user-card"
          @click="viewUserDetail(user.id)"
        >
          <div class="user-avatar">
            <img v-if="user.userAvatar" :src="user.userAvatar" :alt="user.userName || user.userAccount" />
            <div v-else class="avatar-placeholder">
              {{ (user.userName || user.userAccount).charAt(0).toUpperCase() }}
            </div>
          </div>
          <div class="user-info">
            <h3>{{ user.userName || user.userAccount }}</h3>
            <p class="account">账号: {{ user.userAccount }}</p>
            <p v-if="user.userProfile" class="profile">{{ user.userProfile }}</p>
            <p v-else class="no-profile">暂无简介</p>
          </div>
          <div class="user-role" :class="user.userRole">
            {{ user.userRole === 'admin' ? '管理员' : '普通用户' }}
          </div>
          <div class="user-time">
            {{ formatDateTime(user.createTime) }}
          </div>
          <button
            class="btn-delete"
            @click.stop="handleDelete(user.id, user.userName || user.userAccount)"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <polyline points="3 6 5 6 21 6"></polyline>
              <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
            </svg>
          </button>
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
    </div>

    <!-- 创建用户对话框 -->
    <div v-if="showCreateDialog" class="dialog-overlay" @click="closeCreateDialog">
      <div class="dialog-content" @click.stop>
        <div class="dialog-header">
          <h2>创建用户</h2>
          <button class="dialog-close" @click="closeCreateDialog">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <line x1="18" y1="6" x2="6" y2="18"></line>
              <line x1="6" y1="6" x2="18" y2="18"></line>
            </svg>
          </button>
        </div>
        <div class="dialog-body">
          <div class="form-group">
            <label>用户名 *</label>
            <input
              v-model="createForm.userName"
              type="text"
              placeholder="请输入用户名"
            />
          </div>
          <div class="form-group">
            <label>账号 *</label>
            <input
              v-model="createForm.userAccount"
              type="text"
              placeholder="请输入账号"
            />
          </div>
          <div class="form-group">
            <label>密码 *</label>
            <input
              v-model="createForm.userPassword"
              type="password"
              placeholder="请输入密码（至少6位）"
            />
          </div>
          <div class="form-group">
            <label>角色 *</label>
            <select v-model="createForm.userRole">
              <option value="user">普通用户</option>
              <option value="admin">管理员</option>
            </select>
          </div>
          <div class="form-group">
            <label>头像 URL</label>
            <input
              v-model="createForm.userAvatar"
              type="text"
              placeholder="请输入头像 URL"
            />
          </div>
          <div class="form-group">
            <label>简介</label>
            <textarea
              v-model="createForm.userProfile"
              rows="3"
              placeholder="请输入用户简介"
            ></textarea>
          </div>
        </div>
        <div class="dialog-footer">
          <button class="btn-secondary" @click="closeCreateDialog" :disabled="creating">
            取消
          </button>
          <button class="btn-primary" @click="handleCreateUser" :disabled="creating">
            {{ creating ? '创建中...' : '创建' }}
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== 页面布局 ========== */
.user-management {
  max-width: 1200px;
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

.btn-create {
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
}

/* ========== 用户列表 ========== */
.user-list {
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

.list-container {
  display: grid;
  gap: 1rem;
}

.user-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1rem;
  border-radius: 12px;
  border: 1px solid #f0f0f0;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.user-card:hover {
  background: #f8f9fa;
  border-color: #667eea;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
}

.user-avatar {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  overflow: hidden;
  flex-shrink: 0;
}

.user-avatar img {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.avatar-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  font-weight: 600;
  font-size: 1.25rem;
}

.user-info {
  flex: 1;
  min-width: 0;
}

.user-info h3 {
  margin: 0 0 0.25rem 0;
  font-size: 1rem;
  font-weight: 600;
  color: #1a1a1a;
}

.user-info .account {
  margin: 0 0 0.25rem 0;
  font-size: 0.875rem;
  color: #999;
}

.user-info .profile {
  margin: 0;
  font-size: 0.8125rem;
  color: #666;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.user-info .no-profile {
  margin: 0;
  font-size: 0.8125rem;
  color: #ccc;
  font-style: italic;
}

.user-role {
  padding: 0.375rem 0.875rem;
  border-radius: 20px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.user-role.user {
  background: #e3f2fd;
  color: #1976d2;
}

.user-role.admin {
  background: #fff3e0;
  color: #f57c00;
}

.user-time {
  font-size: 0.75rem;
  color: #999;
  white-space: nowrap;
}

.btn-delete {
  padding: 0.5rem;
  background: #fee;
  border: none;
  border-radius: 8px;
  cursor: pointer;
  color: #dc2626;
  transition: all 0.3s ease;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-delete:hover {
  background: #fee2e2;
  transform: scale(1.1);
}

.btn-delete svg {
  width: 18px;
  height: 18px;
}

/* ========== 分页 ========== */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 1rem;
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
}
</style>
