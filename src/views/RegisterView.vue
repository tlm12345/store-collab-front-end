<script setup lang="ts">
/**
 * 注册页面组件
 * 极简主义风格，沉浸式视觉体验
 */

import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore, type RegisterData } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// ========== 响应式数据 ==========

const account = ref('')
const displayName = ref('')
const password = ref('')
const confirmPassword = ref('')
const avatar = ref('')
const bio = ref('')
const errorMessage = ref('')
const successMessage = ref('')

// ========== 计算属性 ==========

const isLoading = computed(() => userStore.isLoading)
const serverError = computed(() => userStore.error)
const displayError = computed(() => serverError.value || errorMessage.value)

// ========== 方法定义 ==========

async function handleRegister() {
  errorMessage.value = ''
  successMessage.value = ''
  userStore.clearError()

  if (!account.value || !displayName.value || !password.value) {
    errorMessage.value = '请填写所有必填字段'
    return
  }

  if (account.value.length < 3) {
    errorMessage.value = '账户至少需要3个字符'
    return
  }

  if (password.value.length < 6) {
    errorMessage.value = '密码至少需要6个字符'
    return
  }

  if (password.value !== confirmPassword.value) {
    errorMessage.value = '两次输入的密码不一致'
    return
  }

  const registerData: RegisterData = {
    account: account.value,
    displayName: displayName.value,
    password: password.value,
    confirmPassword: confirmPassword.value,
    avatar: avatar.value || undefined,
    bio: bio.value || undefined
  }

  const success = await userStore.register(registerData)

  if (success) {
    successMessage.value = '注册成功！正在跳转到登录页...'
    setTimeout(() => {
      router.push('/login')
    }, 1500)
  }
}

function handleFileChange(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]

  if (file) {
    const reader = new FileReader()
    reader.onload = (e) => {
      avatar.value = e.target?.result as string
    }
    reader.readAsDataURL(file)
  }
}

function goToLogin() {
  router.push('/login')
}
</script>

<template>
  <div class="register-page">
    <div class="register-container">
      <!-- 左侧品牌区域 -->
      <div class="brand-section">
        <div class="brand-content">
          <h1 class="brand-title">Cloud Collab</h1>
          <p class="brand-subtitle">开启您的协作之旅</p>
          <div class="brand-features">
            <div class="feature-item">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"></path>
              </svg>
              <span>实时沟通</span>
            </div>
            <div class="feature-item">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M20.24 12.24a6 6 0 0 0-8.49-8.49L5 10.5V19h8.5z"></path>
                <line x1="16" y1="8" x2="2" y2="22"></line>
                <line x1="17.5" y1="15" x2="9" y2="15"></line>
              </svg>
              <span>创意分享</span>
            </div>
            <div class="feature-item">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <line x1="2" y1="12" x2="22" y2="12"></line>
                <path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"></path>
              </svg>
              <span>全球协作</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧注册表单 -->
      <div class="form-section">
        <div class="form-container">
          <h2 class="form-title">创建账户</h2>
          <p class="form-subtitle">填写信息开始您的协作之旅</p>

          <form class="register-form" @submit.prevent="handleRegister">
            <!-- 头像上传 -->
            <div class="avatar-upload">
              <div class="avatar-preview" :style="{ backgroundImage: avatar ? `url(${avatar})` : 'none' }">
                <span v-if="!avatar" class="avatar-placeholder">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"></path>
                    <circle cx="12" cy="7" r="4"></circle>
                  </svg>
                </span>
              </div>
              <label for="avatar-upload" class="upload-label">上传头像</label>
              <input
                id="avatar-upload"
                type="file"
                accept="image/*"
                @change="handleFileChange"
                class="file-input"
              />
            </div>

            <div class="form-group">
              <label for="account">账户 *</label>
              <input
                id="account"
                v-model="account"
                type="text"
                placeholder="至少3个字符"
                autocomplete="username"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="displayName">显示名称 *</label>
              <input
                id="displayName"
                v-model="displayName"
                type="text"
                placeholder="您的昵称"
                autocomplete="nickname"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="password">密码 *</label>
              <input
                id="password"
                v-model="password"
                type="password"
                placeholder="至少6个字符"
                autocomplete="new-password"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="confirmPassword">确认密码 *</label>
              <input
                id="confirmPassword"
                v-model="confirmPassword"
                type="password"
                placeholder="再次输入密码"
                autocomplete="new-password"
                class="form-input"
              />
            </div>

            <div class="form-group">
              <label for="bio">个人简介</label>
              <textarea
                id="bio"
                v-model="bio"
                placeholder="介绍一下你自己..."
                rows="3"
                maxlength="200"
                class="form-textarea"
              />
              <span class="char-count">{{ bio.length }}/200</span>
            </div>

            <p v-if="displayError" class="error-message">{{ displayError }}</p>
            <p v-if="successMessage" class="success-message">{{ successMessage }}</p>

            <button type="submit" class="btn btn-primary" :disabled="isLoading">
              {{ isLoading ? '注册中...' : '注册' }}
            </button>
          </form>

          <p class="switch-link">
            已有账号？
            <span class="link-text" @click="goToLogin">立即登录</span>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>

<style scoped>
/* ========== 全局样式 ========== */
.register-page {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 1rem;
}

.register-container {
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
  overflow-y: auto;
}

.form-container {
  width: 100%;
  max-width: 400px;
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

.register-form {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
}

/* 头像上传 */
.avatar-upload {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.75rem;
  margin-bottom: 0.5rem;
}

.avatar-preview {
  width: 80px;
  height: 80px;
  border-radius: 50%;
  background: #f5f5f5;
  border: 2px dashed #d1d5db;
  display: flex;
  align-items: center;
  justify-content: center;
  background-size: cover;
  background-position: center;
  transition: all 0.3s ease;
  cursor: pointer;
}

.avatar-preview:hover {
  border-color: #667eea;
  transform: scale(1.05);
}

.avatar-placeholder {
  color: #9ca3af;
}

.avatar-placeholder svg {
  width: 32px;
  height: 32px;
}

.upload-label {
  font-size: 0.875rem;
  color: #667eea;
  font-weight: 600;
  cursor: pointer;
  transition: color 0.2s ease;
}

.upload-label:hover {
  color: #764ba2;
}

.file-input {
  display: none;
}

/* 表单输入 */
.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.5rem;
  position: relative;
}

.form-group label {
  font-size: 0.875rem;
  font-weight: 500;
  color: #333;
}

.form-input,
.form-textarea {
  width: 100%;
  padding: 0.875rem 1rem;
  font-size: 1rem;
  border: 2px solid #e5e7eb;
  border-radius: 12px;
  background: #fafafa;
  color: #1a1a1a;
  transition: all 0.3s ease;
  font-family: inherit;
}

.form-input:focus,
.form-textarea:focus {
  outline: none;
  border-color: #667eea;
  background: white;
  box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.1);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: #999;
}

.form-textarea {
  resize: none;
  min-height: 80px;
}

.char-count {
  position: absolute;
  right: 0;
  top: 0;
  font-size: 0.75rem;
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

.success-message {
  color: #22c55e;
  font-size: 0.875rem;
  text-align: center;
  padding: 0.5rem;
  background: #f0fdf4;
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
  margin-top: 0.5rem;
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
  .register-container {
    grid-template-columns: 1fr;
    min-height: auto;
  }

  .brand-section {
    display: none;
  }

  .form-section {
    padding: 2rem;
  }

  .form-container {
    max-width: 100%;
  }
}
</style>
