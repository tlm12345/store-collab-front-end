/**
 * 管理员主页面
 * 包含侧边栏导航和主内容区域
 */

<script setup lang="ts">
import { ref } from 'vue'
import { RouterView, useRouter } from 'vue-router'
import { getCurrentUser } from '@/api/user'
import type { UserVO } from '@/types/api'

const router = useRouter()

// ========== 状态 ==========

const activeTab = ref('users')
const currentUser = ref<UserVO | null>(null)
const checkingUser = ref(false)

// ========== 方法定义 ==========

async function checkCurrentUser() {
  try {
    checkingUser.value = true
    const response = await getCurrentUser()
    if (response.code === 0 && response.data) {
      currentUser.value = response.data
      alert('获取当前用户信息成功！\n用户名: ' + response.data.userName)
    } else {
      alert('获取用户信息失败: ' + (response.description || response.message || '未知错误'))
    }
  } catch (error) {
    console.error('获取当前用户信息失败:', error)
    alert('获取用户信息失败，请稍后重试')
  } finally {
    checkingUser.value = false
  }
}

function navigateTo(path: string, tab: string) {
  activeTab.value = tab
  router.push(path)
}
</script>

<template>
  <div class="admin-layout">
    <!-- 侧边栏 -->
    <aside class="sidebar">
      <div class="sidebar-header">
        <h2>管理控制台</h2>
      </div>

      <!-- 当前用户信息检查 -->
      <div class="user-check-section">
        <button
          class="check-user-btn"
          @click="checkCurrentUser"
          :disabled="checkingUser"
        >
          <svg
            v-if="!checkingUser"
            class="check-icon"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
          >
            <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
            <circle cx="12" cy="7" r="4"></circle>
          </svg>
          <span v-if="!checkingUser">检查登录状态</span>
          <span v-else>检查中...</span>
        </button>

        <!-- 显示当前用户信息 -->
        <div v-if="currentUser" class="current-user-info">
          <div class="user-info-item">
            <span class="label">用户名:</span>
            <span class="value">{{ currentUser.userName }}</span>
          </div>
          <div class="user-info-item">
            <span class="label">账号:</span>
            <span class="value">{{ currentUser.userAccount }}</span>
          </div>
          <div class="user-info-item">
            <span class="label">角色:</span>
            <span class="value role-badge" :class="currentUser.userRole">
              {{ currentUser.userRole === 'admin' ? '管理员' : '普通用户' }}
            </span>
          </div>
        </div>
      </div>

      <nav class="sidebar-nav">
        <div
          class="nav-item"
          :class="{ active: activeTab === 'users' }"
          @click="navigateTo('/admin/users', 'users')"
        >
          <svg class="nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
          </svg>
          <span>用户管理</span>
        </div>
      </nav>
    </aside>

    <!-- 主内容区域 -->
    <main class="main-content">
      <div class="content-wrapper">
        <RouterView />
      </div>
    </main>
  </div>
</template>

<style scoped>
/* ========== 布局 ========== */
.admin-layout {
  display: flex;
  min-height: 100vh;
  background: #f5f7fa;
}

/* ========== 侧边栏 ========== */
.sidebar {
  width: 260px;
  background: linear-gradient(180deg, #667eea 0%, #764ba2 100%);
  color: white;
  padding: 2rem 1.5rem;
  position: fixed;
  left: 0;
  top: 0;
  bottom: 0;
  overflow-y: auto;
}

.sidebar-header {
  margin-bottom: 3rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.sidebar-header h2 {
  font-size: 1.5rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.02em;
}

/* ========== 用户检查区域 ========== */
.user-check-section {
  margin-bottom: 2rem;
  padding-bottom: 1.5rem;
  border-bottom: 1px solid rgba(255, 255, 255, 0.2);
}

.check-user-btn {
  width: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 0.5rem;
  padding: 0.875rem 1rem;
  background: rgba(255, 255, 255, 0.15);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 12px;
  color: white;
  font-size: 0.9375rem;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.check-user-btn:hover:not(:disabled) {
  background: rgba(255, 255, 255, 0.25);
  border-color: rgba(255, 255, 255, 0.5);
  transform: translateY(-2px);
}

.check-user-btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.check-icon {
  width: 18px;
  height: 18px;
}

.current-user-info {
  margin-top: 1rem;
  padding: 1rem;
  background: rgba(255, 255, 255, 0.1);
  border-radius: 12px;
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.user-info-item {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.1);
}

.user-info-item:last-child {
  border-bottom: none;
}

.user-info-item .label {
  font-size: 0.875rem;
  color: rgba(255, 255, 255, 0.8);
}

.user-info-item .value {
  font-size: 0.9375rem;
  font-weight: 600;
}

.role-badge {
  padding: 0.25rem 0.625rem;
  border-radius: 12px;
  font-size: 0.75rem;
  font-weight: 600;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.role-badge.admin {
  background: #fff3e0;
  color: #f57c00;
}

.role-badge.user {
  background: #e3f2fd;
  color: #1976d2;
}

.sidebar-nav {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
}

.nav-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  padding: 1rem 1.25rem;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  font-size: 0.9375rem;
}

.nav-item:hover {
  background: rgba(255, 255, 255, 0.15);
  transform: translateX(4px);
}

.nav-item.active {
  background: white;
  color: #667eea;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.nav-icon {
  width: 20px;
  height: 20px;
  flex-shrink: 0;
}

/* ========== 主内容区域 ========== */
.main-content {
  flex: 1;
  margin-left: 260px;
  padding: 2rem;
}

.content-wrapper {
  max-width: 1200px;
  margin: 0 auto;
}

/* ========== 响应式设计 ========== */
@media (max-width: 768px) {
  .sidebar {
    width: 100%;
    position: relative;
    padding: 1rem;
  }

  .main-content {
    margin-left: 0;
    padding: 1rem;
  }

  .sidebar-header {
    margin-bottom: 1.5rem;
    padding-bottom: 1rem;
  }
}
</style>
