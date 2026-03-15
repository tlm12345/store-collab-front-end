<script setup lang="ts">
/**
 * 应用根组件
 * 极简主义风格，悬浮式导航栏
 */

import { RouterLink, RouterView, useRouter } from 'vue-router'
import { computed, ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores/user'

const router = useRouter()
const userStore = useUserStore()

// ========== 状态 ==========

const isLoggedIn = computed(() => userStore.isLoggedIn)
const currentUser = computed(() => userStore.user)
const isMenuOpen = ref(false)
const isScrolled = ref(false)

// 滚动相关
let lastScrollY = 0

// ========== 方法定义 ==========

async function handleLogout() {
  await userStore.logout()
  isMenuOpen.value = false
  // 跳转到主页面
  await router.push('/')
}

function toggleMenu() {
  isMenuOpen.value = !isMenuOpen.value
}

function closeMenu() {
  isMenuOpen.value = false
}

// 滚动时自动关闭菜单和更新滚动状态
function handleScroll() {
  isScrolled.value = window.scrollY > 50
  const currentScrollY = window.scrollY
  if (currentScrollY > lastScrollY && isMenuOpen.value) {
    closeMenu()
  }
  lastScrollY = currentScrollY
}

onMounted(() => {
  window.addEventListener('scroll', handleScroll)
})

onUnmounted(() => {
  window.removeEventListener('scroll', handleScroll)
})
</script>

<template>
  <div class="app">
    <!-- 悬浮式导航栏 -->
    <nav class="navbar" :class="{ 'scrolled': isScrolled }">
      <div class="nav-container">
        <!-- Logo -->
        <RouterLink to="/" class="nav-logo">
          <svg class="logo-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <path d="M21 12V7a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-5"></path>
            <line x1="12" y1="12" x2="12" y2="16"></line>
            <line x1="8" y1="8" x2="8" y2="8"></line>
            <line x1="16" y1="8" x2="16" y2="8"></line>
          </svg>
          <span>Cloud Collab</span>
        </RouterLink>

        <!-- 桌面端导航 -->
        <div class="nav-links desktop-nav">
          <RouterLink to="/" class="nav-link">首页</RouterLink>
          <template v-if="!isLoggedIn">
            <RouterLink to="/login" class="nav-link">登录</RouterLink>
            <RouterLink to="/register" class="nav-link nav-link-cta">注册</RouterLink>
          </template>
          <template v-else>
            <RouterLink v-if="currentUser?.role === 'admin'" to="/admin" class="nav-link nav-link-admin">
              <svg class="admin-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"></path>
              </svg>
              管理控制台
            </RouterLink>
            <RouterLink to="/profile" class="nav-link">
              <span class="nav-user">{{ currentUser?.displayName }}</span>
            </RouterLink>
            <a class="nav-link nav-link-logout" @click="handleLogout">退出</a>
          </template>
        </div>

        <!-- 移动端菜单按钮 -->
        <button class="menu-toggle" @click="toggleMenu" :class="{ 'active': isMenuOpen }">
          <span></span>
          <span></span>
          <span></span>
        </button>
      </div>

      <!-- 移动端导航 -->
      <div class="mobile-nav" :class="{ 'open': isMenuOpen }">
        <RouterLink to="/" class="mobile-nav-link" @click="closeMenu">首页</RouterLink>
        <template v-if="!isLoggedIn">
          <RouterLink to="/login" class="mobile-nav-link" @click="closeMenu">登录</RouterLink>
          <RouterLink to="/register" class="mobile-nav-link mobile-nav-cta" @click="closeMenu">注册</RouterLink>
        </template>
        <template v-else>
          <RouterLink v-if="currentUser?.role === 'admin'" to="/admin" class="mobile-nav-link" @click="closeMenu">
            管理控制台
          </RouterLink>
          <RouterLink to="/profile" class="mobile-nav-link" @click="closeMenu">
            个人信息
          </RouterLink>
          <a class="mobile-nav-link mobile-nav-logout" @click="handleLogout">退出登录</a>
        </template>
      </div>
    </nav>

    <!-- 路由视图出口 -->
    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
/* ========== 全局样式 ========== */
.app {
  min-height: 100vh;
}

.main-content {
  min-height: calc(100vh - 70px);
}

/* ========== 导航栏 ========== */
.navbar {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  z-index: 1000;
  background: rgba(255, 255, 255, 0.95);
  backdrop-filter: blur(10px);
  border-bottom: 1px solid rgba(0, 0, 0, 0.05);
  transition: all 0.3s ease;
}

.navbar.scrolled {
  box-shadow: 0 2px 20px rgba(0, 0, 0, 0.1);
}

.nav-container {
  max-width: 1200px;
  margin: 0 auto;
  padding: 1rem 1.5rem;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

/* Logo */
.nav-logo {
  display: flex;
  align-items: center;
  gap: 0.75rem;
  text-decoration: none;
  font-weight: 700;
  font-size: 1.25rem;
  color: #1a1a1a;
  letter-spacing: -0.02em;
  transition: transform 0.3s ease;
}

.nav-logo:hover {
  transform: scale(1.05);
}

.logo-icon {
  width: 32px;
  height: 32px;
  color: #667eea;
}

/* 桌面端导航 */
.nav-links {
  display: flex;
  align-items: center;
  gap: 2rem;
}

.nav-link {
  text-decoration: none;
  color: #666;
  font-weight: 500;
  font-size: 0.9375rem;
  transition: all 0.3s ease;
  position: relative;
}

.nav-link::after {
  content: '';
  position: absolute;
  bottom: -4px;
  left: 0;
  width: 0;
  height: 2px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  transition: width 0.3s ease;
}

.nav-link:hover::after,
.nav-link.router-link-active::after {
  width: 100%;
}

.nav-link:hover,
.nav-link.router-link-active {
  color: #667eea;
}

.nav-link-cta {
  padding: 0.625rem 1.5rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.nav-link-cta::after {
  display: none;
}

.nav-link-admin {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  border-radius: 10px;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
  transition: all 0.3s ease;
}

.nav-link-admin::after {
  display: none;
}

.nav-link-admin:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.admin-icon {
  width: 18px;
  height: 18px;
}

.nav-link-cta:hover {
  transform: translateY(-2px);
  box-shadow: 0 6px 16px rgba(102, 126, 234, 0.5);
}

.nav-user {
  display: flex;
  align-items: center;
  gap: 0.5rem;
  padding: 0.5rem 1rem;
  background: #f5f5f5;
  border-radius: 10px;
}

.nav-link-logout {
  cursor: pointer;
  color: #ef4444;
}

.nav-link-logout:hover {
  color: #dc2626;
}

/* 移动端菜单按钮 */
.menu-toggle {
  display: none;
  flex-direction: column;
  gap: 5px;
  background: none;
  border: none;
  cursor: pointer;
  padding: 5px;
  z-index: 1001;
}

.menu-toggle span {
  width: 25px;
  height: 2px;
  background: #1a1a1a;
  transition: all 0.3s ease;
}

.menu-toggle.active span:nth-child(1) {
  transform: rotate(45deg) translate(5px, 5px);
}

.menu-toggle.active span:nth-child(2) {
  opacity: 0;
}

.menu-toggle.active span:nth-child(3) {
  transform: rotate(-45deg) translate(7px, -6px);
}

/* 移动端导航 */
.mobile-nav {
  display: none;
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(255, 255, 255, 0.98);
  backdrop-filter: blur(10px);
  padding: 6rem 2rem 2rem;
  flex-direction: column;
  gap: 1rem;
  transform: translateX(100%);
  transition: transform 0.3s ease;
  z-index: 999;
}

.mobile-nav.open {
  display: flex;
  transform: translateX(0);
}

.mobile-nav-link {
  text-decoration: none;
  color: #1a1a1a;
  font-weight: 600;
  font-size: 1.125rem;
  padding: 1rem;
  border-radius: 12px;
  transition: all 0.3s ease;
}

.mobile-nav-link:hover {
  background: #f5f5f5;
  color: #667eea;
}

.mobile-nav-link.router-link-active {
  color: #667eea;
  background: #f5f5f5;
}

.mobile-nav-cta {
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  color: white;
  text-align: center;
  box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
}

.mobile-nav-cta:hover {
  transform: translateY(-2px);
  background: #f5f5f5;
  color: #667eea;
}

.mobile-nav-logout {
  color: #ef4444;
}

.mobile-nav-logout:hover {
  color: #dc2626;
}

/* ========== 响应式设计 ========== */
@media (max-width: 768px) {
  .desktop-nav {
    display: none;
  }

  .menu-toggle {
    display: flex;
  }

  .nav-logo span {
    font-size: 1rem;
  }

  .logo-icon {
    width: 28px;
    height: 28px;
  }
}

@media (min-width: 769px) {
  .mobile-nav {
    display: none !important;
  }
}
</style>
