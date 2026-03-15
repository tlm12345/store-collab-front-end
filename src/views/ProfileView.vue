<script setup lang="ts">
/**
 * 用户个人信息页面组件
 * 极简主义风格，沉浸式视觉体验
 */

import { computed, onMounted } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// ========== 计算属性 ==========

const user = computed(() => userStore.user)
const isLoggedIn = computed(() => userStore.isLoggedIn)

const avatar = computed(() => user.value?.avatar || '')
const userName = computed(() => user.value?.displayName || '')
const userAccount = computed(() => user.value?.account || '')
const userRole = computed(() => user.value?.role || '普通用户')
const userProfile = computed(() => user.value?.bio || '暂无简介')
const userId = computed(() => user.value?.id || '')

// ========== 方法定义 ==========

async function handleLogout() {
  await userStore.logout()
  // 退出登录后跳转到主页面
  await router.push('/')
}

function goBack() {
  router.push('/')
}

onMounted(() => {
  if (!isLoggedIn.value) {
    router.push('/login')
  }
})
</script>

<template>
  <div class="profile-page">
    <div class="profile-container">
      <!-- 顶部导航 -->
      <div class="profile-header">
        <button class="back-btn" @click="goBack">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M19 12H5M12 19l-7-7 7-7"/>
          </svg>
          返回
        </button>
        <h1 class="page-title">个人信息</h1>
        <button class="logout-btn" @click="handleLogout">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"></path>
            <polyline points="16 17 21 12 16 7"></polyline>
            <line x1="21" y1="12" x2="9" y2="12"></line>
          </svg>
          退出
        </button>
      </div>

      <!-- 用户信息卡片 -->
      <div class="profile-content">
        <div class="avatar-section">
          <div v-if="avatar" class="avatar-large" :style="{ backgroundImage: `url(${avatar})` }"></div>
          <div v-else class="avatar-large avatar-placeholder">
            {{ userName.charAt(0).toUpperCase() }}
          </div>
          <h2 class="user-name">{{ userName }}</h2>
          <p class="user-account">@{{ userAccount }}</p>
        </div>

        <div class="info-grid">
          <div class="info-card">
            <div class="info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                <circle cx="12" cy="7" r="4"></circle>
              </svg>
            </div>
            <div class="info-content">
              <span class="info-label">用户 ID</span>
              <span class="info-value">{{ userId }}</span>
            </div>
          </div>

          <div class="info-card">
            <div class="info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <div class="info-content">
              <span class="info-label">角色</span>
              <span class="info-value">{{ userRole }}</span>
            </div>
          </div>

          <div class="info-card info-card-full">
            <div class="info-icon">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
            </div>
            <div class="info-content">
              <span class="info-label">个人简介</span>
              <span class="info-value">{{ userProfile }}</span>
            </div>
          </div>
        </div>

        <!-- 统计数据 -->
        <div class="stats-grid">
          <div class="stat-card">
            <span class="stat-value">0</span>
            <span class="stat-label">图片</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">0</span>
            <span class="stat-label">收藏</span>
          </div>
          <div class="stat-card">
            <span class="stat-value">0</span>
            <span class="stat-label">协作</span>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== 全局样式 ========== */
.profile-page {
  min-height: 100vh;
  background: #f5f7fa;
  padding: 2rem 1rem;
}

.profile-container {
  max-width: 800px;
  margin: 0 auto;
}

/* ========== 顶部导航 ========== */
.profile-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 2rem;
  padding: 1rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.back-btn,
.logout-btn {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.75rem 1rem;
  background: #f5f5f5;
  border: none;
  border-radius: 10px;
  color: #666;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

.back-btn:hover,
.logout-btn:hover {
  background: #e5e7eb;
  transform: translateY(-1px);
}

.back-btn svg,
.logout-btn svg {
  width: 20px;
  height: 20px;
}

.page-title {
  font-size: 1.5rem;
  font-weight: 700;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  margin: 0;
}

/* ========== 个人信息内容 ========== */
.profile-content {
  display: flex;
  flex-direction: column;
  gap: 2rem;
}

/* 头像区域 */
.avatar-section {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 1rem;
  padding: 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 20px;
  color: white;
  position: relative;
  overflow: hidden;
}

.avatar-section::before {
  content: '';
  position: absolute;
  top: -50%;
  left: -50%;
  width: 200%;
  height: 200%;
  background: radial-gradient(circle, rgba(255,255,255,0.1) 1px, transparent 1px);
  background-size: 30px 30px;
  animation: float 20s linear infinite;
}

@keyframes float {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

.avatar-large {
  width: 120px;
  height: 120px;
  border-radius: 50%;
  background-size: cover;
  background-position: center;
  border: 4px solid rgba(255, 255, 255, 0.3);
  box-shadow: 0 8px 24px rgba(0, 0, 0, 0.2);
  position: relative;
  z-index: 1;
}

.avatar-large.avatar-placeholder {
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 3rem;
  font-weight: 700;
  background: rgba(255, 255, 255, 0.2);
  backdrop-filter: blur(10px);
}

.user-name {
  font-size: 2rem;
  font-weight: 700;
  margin: 0;
  letter-spacing: -0.02em;
  position: relative;
  z-index: 1;
}

.user-account {
  font-size: 1rem;
  opacity: 0.9;
  margin: 0;
  position: relative;
  z-index: 1;
}

/* 信息网格 */
.info-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 1rem;
}

.info-card {
  display: flex;
  align-items: center;
  gap: 1rem;
  padding: 1.5rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.info-card:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.info-card-full {
  grid-column: span 2;
  flex-direction: column;
  align-items: flex-start;
  gap: 0.75rem;
}

.info-icon {
  width: 48px;
  height: 48px;
  border-radius: 12px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.info-icon svg {
  width: 24px;
  height: 24px;
}

.info-content {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.info-label {
  font-size: 0.75rem;
  font-weight: 600;
  color: #999;
  text-transform: uppercase;
  letter-spacing: 0.05em;
}

.info-value {
  font-size: 1rem;
  font-weight: 500;
  color: #1a1a1a;
  word-break: break-all;
}

/* 统计数据 */
.stats-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 1rem;
}

.stat-card {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.5rem;
  padding: 2rem;
  background: white;
  border-radius: 16px;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.stat-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
}

.stat-value {
  font-size: 2.5rem;
  font-weight: 700;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.stat-label {
  font-size: 0.875rem;
  color: #666;
  font-weight: 500;
}

/* ========== 响应式设计 ========== */
@media (max-width: 640px) {
  .profile-header {
    flex-direction: column;
    gap: 1rem;
  }

  .page-title {
    font-size: 1.25rem;
  }

  .info-grid {
    grid-template-columns: 1fr;
  }

  .info-card-full {
    grid-column: span 1;
  }

  .stats-grid {
    grid-template-columns: 1fr;
  }

  .avatar-large {
    width: 100px;
    height: 100px;
  }

  .user-name {
    font-size: 1.5rem;
  }
}
</style>
