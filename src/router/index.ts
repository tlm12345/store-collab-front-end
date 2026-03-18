import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'
import HomeView from '../views/HomeView.vue'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
    },
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('../views/RegisterView.vue'),
    },
    {
      path: '/about',
      name: 'about',
      // route level code-splitting
      // this generates a separate chunk (About.[hash].js) for this route
      // which is lazy-loaded when the route is visited.
      component: () => import('../views/AboutView.vue'),
    },
    {
      path: '/profile',
      name: 'profile',
      component: () => import('../views/ProfileView.vue'),
      meta: { requiresAuth: true }
    },
    // User gallery routes
    {
      path: '/gallery',
      name: 'gallery',
      component: () => import('../views/user/UserGalleryView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/gallery/:id',
      name: 'image-detail',
      component: () => import('../views/user/ImageDetailView.vue'),
      meta: { requiresAuth: true }
    },
    // Space management routes
    {
      path: '/spaces',
      name: 'spaces',
      component: () => import('../views/space/SpaceListView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/space/:id',
      name: 'space-detail',
      component: () => import('../views/space/SpaceDetailView.vue'),
      meta: { requiresAuth: true }
    },
    // New space management routes
    {
      path: '/my-space',
      name: 'my-space',
      component: () => import('../views/user/MySpaceView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/space-management',
      name: 'space-management',
      component: () => import('../views/space/SpaceManagementView.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/admin',
      name: 'admin',
      component: () => import('../views/admin/AdminView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/users',
      name: 'admin-users',
      component: () => import('../views/admin/UserManagementView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/users/:id',
      name: 'user-detail',
      component: () => import('../views/admin/UserDetailView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
    {
      path: '/admin/pictures',
      name: 'admin-pictures',
      component: () => import('../views/admin/PictureManagementView.vue'),
      meta: { requiresAuth: true, requiresAdmin: true }
    },
  ],
})

// 路由守卫
router.beforeEach((to, _from, next) => {
  const userStore = useUserStore()

  // 需要认证的路由
  if (to.meta.requiresAuth) {
    if (!userStore.isLoggedIn) {
      // 未登录，跳转到登录页
      next('/login')
      return
    }

    // 需要管理员权限的路由
    if (to.meta.requiresAdmin && userStore.user?.role !== 'admin') {
      // 不是管理员，跳转到图库页面
      next('/gallery')
      return
    }
  }

  next()
})

export default router
