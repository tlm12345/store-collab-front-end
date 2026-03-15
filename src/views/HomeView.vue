<script setup lang="ts">
/**
 * 首页组件
 * 极简主义风格，展示平台特性
 */

import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// ========== 计算属性 ==========

const isLoggedIn = computed(() => userStore.isLoggedIn)

// ========== 方法定义 ==========

function goToLogin() {
  router.push('/login')
}

function goToRegister() {
  router.push('/register')
}
</script>

<template>
  <div class="home-page">
    <!-- 英雄区域 -->
    <section class="hero-section">
      <div class="hero-content">
        <h1 class="hero-title">Cloud Collab</h1>
        <p class="hero-subtitle">云端协作，无限创意</p>
        <p class="hero-description">
          一个现代化的云端图片协作平台，支持团队共享、实时编辑和无缝协作，
          让创意在全球范围内自由流动。
        </p>
        <div v-if="!isLoggedIn" class="hero-actions">
          <button class="btn btn-primary" @click="goToRegister">开始使用</button>
          <button class="btn btn-secondary" @click="goToLogin">登录账户</button>
        </div>
        <div v-else class="hero-actions">
          <button class="btn btn-primary" @click="router.push('/profile')">
            查看个人资料
          </button>
        </div>
      </div>
      <div class="hero-visual">
        <div class="floating-card card-1">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"></path>
            <polyline points="7 10 12 15 17 10"></polyline>
            <line x1="12" y1="15" x2="12" y2="3"></line>
          </svg>
        </div>
        <div class="floating-card card-2">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
            <circle cx="8.5" cy="8.5" r="1.5"></circle>
            <polyline points="21 15 16 10 5 21"></polyline>
          </svg>
        </div>
        <div class="floating-card card-3">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
            <circle cx="9" cy="7" r="4"></circle>
          </svg>
        </div>
      </div>
    </section>

    <!-- 特性展示 -->
    <section class="features-section">
      <div class="features-container">
        <h2 class="section-title">核心功能</h2>
        <p class="section-subtitle">为团队协作而设计的强大功能</p>

        <div class="features-grid">
          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"></path>
                <circle cx="9" cy="7" r="4"></circle>
                <path d="M23 21v-2a4 4 0 0 0-3-3.87"></path>
                <path d="M16 3.13a4 4 0 0 1 0 7.75"></path>
              </svg>
            </div>
            <h3 class="feature-title">团队协作</h3>
            <p class="feature-description">
              邀请团队成员共同编辑和协作，实时同步所有人的更改，让协作更加高效。
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="3" y="3" width="18" height="18" rx="2" ry="2"></rect>
                <circle cx="8.5" cy="8.5" r="1.5"></circle>
                <polyline points="21 15 16 10 5 21"></polyline>
              </svg>
            </div>
            <h3 class="feature-title">云端存储</h3>
            <p class="feature-description">
              安全可靠的云端存储，支持多种图片格式，随时随地访问您的图片资源。
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="12" cy="12" r="10"></circle>
                <polyline points="12 6 12 12 16 14"></polyline>
              </svg>
            </div>
            <h3 class="feature-title">实时同步</h3>
            <p class="feature-description">
              所有更改实时同步到云端，确保团队成员始终看到最新的内容版本。
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
            </div>
            <h3 class="feature-title">安全可靠</h3>
            <p class="feature-description">
              采用企业级安全标准，数据加密存储，保护您的图片和隐私安全。
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"></polygon>
              </svg>
            </div>
            <h3 class="feature-title">智能搜索</h3>
            <p class="feature-description">
              强大的搜索功能，支持关键词、标签和图片内容识别，快速找到所需资源。
            </p>
          </div>

          <div class="feature-card">
            <div class="feature-icon-wrapper">
              <svg class="feature-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <rect x="2" y="3" width="20" height="14" rx="2" ry="2"></rect>
                <line x1="8" y1="21" x2="16" y2="21"></line>
                <line x1="12" y1="17" x2="12" y2="21"></line>
              </svg>
            </div>
            <h3 class="feature-title">响应式设计</h3>
            <p class="feature-description">
              完美适配各种设备，从桌面到移动端，提供一致的用户体验。
            </p>
          </div>
        </div>
      </div>
    </section>

    <!-- CTA 区域 -->
    <section class="cta-section">
      <div class="cta-content">
        <h2 class="cta-title">准备好开始了吗？</h2>
        <p class="cta-description">
          加入我们的平台，体验前所未有的云端协作体验
        </p>
        <button v-if="!isLoggedIn" class="btn btn-primary btn-large" @click="goToRegister">
          免费注册
        </button>
        <button v-else class="btn btn-primary btn-large" @click="router.push('/profile')">
          查看个人资料
        </button>
      </div>
    </section>
  </div>
</template>

<style scoped>
/* ========== 全局样式 ========== */
.home-page {
  min-height: 100vh;
  background: #f5f7fa;
}

/* ========== 英雄区域 ========== */
.hero-section {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 4rem;
  padding: 8rem 2rem 4rem;
  max-width: 1200px;
  margin: 0 auto;
  align-items: center;
  position: relative;
  overflow: hidden;
}

.hero-section::before {
  content: '';
  position: absolute;
  top: -10%;
  right: -10%;
  width: 600px;
  height: 600px;
  background: radial-gradient(circle, rgba(102, 126, 234, 0.1) 1px, transparent 1px);
  background-size: 30px 30px;
  animation: float 20s linear infinite;
}

@keyframes float {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

.hero-content {
  position: relative;
  z-index: 1;
}

.hero-title {
  font-size: 4rem;
  font-weight: 800;
  color: #1a1a1a;
  margin-bottom: 1rem;
  letter-spacing: -0.03em;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  -webkit-background-clip: text;
  -webkit-text-fill-color: transparent;
  background-clip: text;
}

.hero-subtitle {
  font-size: 1.5rem;
  color: #666;
  margin-bottom: 1.5rem;
  font-weight: 500;
}

.hero-description {
  font-size: 1.125rem;
  color: #999;
  margin-bottom: 2.5rem;
  line-height: 1.8;
  max-width: 500px;
}

.hero-actions {
  display: flex;
  gap: 1rem;
  flex-wrap: wrap;
}

.hero-visual {
  position: relative;
  height: 400px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.floating-card {
  position: absolute;
  width: 100px;
  height: 100px;
  background: white;
  border-radius: 20px;
  box-shadow: 0 10px 40px rgba(0, 0, 0, 0.1);
  display: flex;
  align-items: center;
  justify-content: center;
  animation: floatCard 6s ease-in-out infinite;
}

.floating-card svg {
  width: 48px;
  height: 48px;
  color: #667eea;
}

.card-1 {
  top: 0;
  left: 20%;
  animation-delay: 0s;
}

.card-2 {
  top: 50%;
  right: 10%;
  animation-delay: 2s;
}

.card-3 {
  bottom: 20%;
  left: 10%;
  animation-delay: 4s;
}

@keyframes floatCard {
  0%, 100% {
    transform: translateY(0);
  }
  50% {
    transform: translateY(-20px);
  }
}

/* ========== 特性区域 ========== */
.features-section {
  padding: 6rem 2rem;
  background: white;
}

.features-container {
  max-width: 1200px;
  margin: 0 auto;
}

.section-title {
  font-size: 2.5rem;
  font-weight: 700;
  color: #1a1a1a;
  text-align: center;
  margin-bottom: 0.5rem;
  letter-spacing: -0.02em;
}

.section-subtitle {
  font-size: 1.125rem;
  color: #666;
  text-align: center;
  margin-bottom: 4rem;
}

.features-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 2rem;
}

.feature-card {
  padding: 2rem;
  background: #f5f7fa;
  border-radius: 20px;
  transition: all 0.3s ease;
}

.feature-card:hover {
  transform: translateY(-8px);
  box-shadow: 0 20px 40px rgba(0, 0, 0, 0.1);
}

.feature-icon-wrapper {
  width: 64px;
  height: 64px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 1.5rem;
}

.feature-icon {
  width: 32px;
  height: 32px;
  color: white;
}

.feature-title {
  font-size: 1.25rem;
  font-weight: 700;
  color: #1a1a1a;
  margin-bottom: 0.75rem;
}

.feature-description {
  font-size: 1rem;
  color: #666;
  line-height: 1.8;
}

/* ========== CTA 区域 ========== */
.cta-section {
  padding: 6rem 2rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  text-align: center;
  position: relative;
  overflow: hidden;
}

.cta-section::before {
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

.cta-content {
  position: relative;
  z-index: 1;
  max-width: 600px;
  margin: 0 auto;
}

.cta-title {
  font-size: 3rem;
  font-weight: 800;
  color: white;
  margin-bottom: 1rem;
  letter-spacing: -0.02em;
}

.cta-description {
  font-size: 1.25rem;
  color: rgba(255, 255, 255, 0.9);
  margin-bottom: 2.5rem;
}

/* ========== 按钮样式 ========== */
.btn {
  padding: 0.875rem 2rem;
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

.btn-primary:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.btn-secondary {
  background: white;
  color: #667eea;
  border: 2px solid #667eea;
}

.btn-secondary:hover {
  background: #f5f5f5;
  transform: translateY(-2px);
}

.btn-large {
  padding: 1rem 3rem;
  font-size: 1.125rem;
}

/* ========== 响应式设计 ========== */
@media (max-width: 968px) {
  .hero-section {
    grid-template-columns: 1fr;
    text-align: center;
    padding: 4rem 2rem;
  }

  .hero-visual {
    display: none;
  }

  .hero-actions {
    justify-content: center;
  }

  .hero-description {
    margin-left: auto;
    margin-right: auto;
  }

  .hero-title {
    font-size: 3rem;
  }
}

@media (max-width: 640px) {
  .hero-title {
    font-size: 2.5rem;
  }

  .cta-title {
    font-size: 2rem;
  }

  .section-title {
    font-size: 2rem;
  }

  .features-grid {
    grid-template-columns: 1fr;
  }
}
</style>
