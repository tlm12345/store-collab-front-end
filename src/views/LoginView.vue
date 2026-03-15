<script setup lang="ts">
/**
 * 登录页面组件
 * 极简主义风格，沉浸式视觉体验
 */

import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// ========== 响应式数据 ==========

const account = ref('')
const password = ref('')
const errorMessage = ref('')

// ========== 计算属性 ==========

const isLoading = computed(() => userStore.isLoading)
const serverError = computed(() => userStore.error)
const displayError = computed(() => serverError.value || errorMessage.value)

// ========== 方法定义 ==========

async function handleLogin() {
  errorMessage.value = ''
  userStore.clearError()

  if (!account.value || !password.value) {
    errorMessage.value = '请输入账户和密码'
    return
  }

  const success = await userStore.login({
    account: account.value,
    password: password.value
  })

  if (success) {
    console.log('登录成功，根据用户角色跳转')

    // 根据用户角色跳转到不同页面
    if (userStore.user?.role === 'admin') {
      // 管理员跳转到管理页面
      await router.push('/admin')
    } else {
      // 普通用户跳转到个人主页
      await router.push('/profile')
    }
  }
}

function goToRegister() {
  router.push('/register')
}
</script>

<template>
  <div class="login-page">
    <div class="login-container">
      <!-- 左侧品牌区域 -->
      <div class="brand-section">
        <div class="brand-content">
          <h1 class="brand-title">Cloud Collab</h1>
          <p class="brand-subtitle">云端协作，无限创意</p>
          <div class="brand-features">
            <div class="feature-item">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
              <span>团队协作</span>
            </div>
            <div class="feature-item">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
              <span>云端存储</span>
            </div>
            <div class="feature-item">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 2v20M2 12h20"></path>
              </svg>
              <span>实时同步</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="form-section">
        <div class="form-container">
          <h2 class="form-title">欢迎回来</h2>
          <p class="form-subtitle">登录您的账户开始协作</p>

          <form class="login-form" @submit.prevent="handleLogin">
            <div class="form-group">
              <label for="account">账户</label>
              <input
                id="account"
                v-model="account"
                type="text"
                placeholder="输入您的账户"
                autocomplete="username"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="password">密码</label>
              <input
                id="password"
                v-model="password"
                type="password"
                placeholder="输入您的密码"
                autocomplete="current-password"
                class="form-input"
              />
            </div>

            <p v-if="displayError" class="error-message">{{ displayError }}</p>

            <button type="submit" class="btn btn-primary" :disabled="isLoading">
              {{ isLoading ? '登录中...' : '登录' }}
            </button>
          </form>

          <p class="switch-link">
            还没有账号？
            <span class="link-text" @click="goToRegister">立即注册</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== 全局样式 ========== */
.login-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.login-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  width: 100%;
  max-width: 1000px;
  min-height: 600px;
  background: #ffffff;
  border-radius: 24px;
  box-shadow: 0 25px 50px -12px rgba(0, 0, 0, 0.25);
  overflow: hidden;
}

/* ========== 品牌区域 ========== */
.brand-section {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
  position: relative;
  overflow: hidden;
}

.brand-section::before {
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

.brand-content {
  z-index: 1;
  text-align: center;
  color: white;
}

.brand-title {
  font-size: 3rem;
  font-weight: 700;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.brand-subtitle {
  font-size: 1.125rem;
  opacity: 0.9;
  margin-bottom: 3rem;
}

.brand-features {
  display: flex;
  flex-direction: column;
  gap: 1.5rem;
  align-items: flex-start;
}

.feature-item {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  font-size: 1rem;
}

.feature-icon {
  width: 24px;
  height: 24px;
  flex-shrink: 0;
}

/* ========== 表单区域 ========== */
.form-section {
  padding: 3rem;
  display: flex;
  align-items: center;
  justify-content: center;
}

.form-container {
  width: 100%;
  max-width: 360px;
}

.form-title {
  font-size: 2rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.form-subtitle {
  font-size: 0.875rem;
  color: #666;
  margin-bottom: 2rem;
}

.login-form {
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
  color: #333;
}

.form-input {
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #fafafa;
  color: #1a1a1a;
  transition: all 0.3s ease;
}

.form-input:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.form-input::placeholder {
  color: #999;
}

.error-message {
  color: #ef4444;
  font-size: 0.875rem;
  text-align: center;
  padding: 0.5rem;
  background: #fef2f2;
  border-radius: 8px;
}

.btn {
  width: 100%;
  padding: 0.875rem 1.5rem;
  font-size: 1rem;
  font-weight: 600;
  border: none;
  border-radius: 12px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.btn-primary {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.btn-primary:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.btn-primary:active:not(:disabled) {
  transform: translateY(0);
}

.btn-primary:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.switch-link {
  text-align: center;
  margin-top: 1.5rem;
  font-size: 0.875rem;
  color: #666;
}

.link-text {
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
}

.link-text:hover {
  color: #764ba2;
  text-decoration: underline;
}

/* ========== 响应式设计 ========== */
@media (max-width: 768px) {
  .login-container {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .brand-section {
    display: none;
  }

  .form-section {
    padding: 2rem;
  }

  .brand-title {
    font-size: 1.75rem;
  }
}
</style>
