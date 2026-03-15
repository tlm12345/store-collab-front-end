/**
 * 用户状态管理 Store
 * 负责管理用户登录、注册、退出登录等用户相关功能
 *
 * 更新说明：
 * - 集成后端 API，实现真正的用户认证
 * - 使用 Session 进行身份验证
 * - 支持用户信息持久化
 * - 提供完整的错误处理
 *
 * 注意：后端使用 Session 认证，不使用 JWT Token
 * 认证信息由浏览器通过 Cookie 自动管理
 */

import { ref, computed } from 'vue'
import { defineStore } from 'pinia'
import {
  loginUser,
  registerUser,
  logoutUser as apiLogoutUser
} from '@/api/auth'
import type {
  UserRegisterRequest,
  UserLoginRequest,
  LoginUserVO
} from '@/types/api'

/**
 * 用户数据接口
 * 定义用户的基本信息结构
 *
 * @property id - 用户唯一标识符
 * @property account - 用户登录账户（登录时使用的唯一标识）
 * @property displayName - 用户显示名称（用于在界面中展示的名称，即用户昵称）
 * @property avatar - 用户头像 URL（可选）
 * @property bio - 用户个人简介（可选）
 * @property role - 用户角色（可选）
 */
export interface User {
  id: string
  account: string
  displayName: string
  avatar?: string
  bio?: string
  role?: string
}

/**
 * 用户注册数据接口
 * 定义注册时需要提交的用户信息
 *
 * @property account - 登录账户（用于登录的唯一标识）
 * @property displayName - 显示名称（昵称，用于界面展示）
 * @property password - 登录密码
 * @param avatar - 头像图片（可选）
 * @param bio - 个人简介（可选）
 */
export interface RegisterData {
  account: string
  displayName: string
  password: string
  confirmPassword: string
  avatar?: string
  bio?: string
}

/**
 * 用户登录数据接口
 * 定义登录时需要提交的信息
 *
 * @property account - 登录账户
 * @property password - 登录密码
 */
export interface LoginData {
  account: string
  password: string
}

export const useUserStore = defineStore('user', () => {
  // ========== 状态定义 ==========

  /**
   * 当前登录用户信息
   * null 表示用户未登录
   */
  const user = ref<User | null>(null)

  /**
   * 加载状态
   * true 表示正在执行异步操作（登录、注册等）
   */
  const loading = ref(false)

  /**
   * 错误信息
   * 存储最后一次操作的错误信息
   */
  const error = ref<string | null>(null)

  // ========== 计算属性 ==========

  /**
   * 用户登录状态
   * @returns {boolean} true 表示已登录，false 表示未登录
   */
  const isLoggedIn = computed(() => user.value !== null)

  /**
   * 是否正在加载
   * @returns {boolean} true 表示正在加载
   */
  const isLoading = computed(() => loading.value)

  /**
   * 是否有错误
   * @returns {boolean} true 表示存在错误
   */
  const hasError = computed(() => error.value !== null)

  // ========== 方法定义 ==========

  /**
   * 初始化用户状态
   * 从 localStorage 中恢复用户信息
   * 应用启动时调用，实现用户状态的持久化
   *
   * 注意：后端使用 Session 认证，无需检查 Token
   * 如果用户信息存在，说明用户之前登录过
   */
  function initializeUser() {
    try {
      // 获取存储的用户信息
      const storedUser = localStorage.getItem('user_info')
      if (storedUser) {
        user.value = JSON.parse(storedUser)
      }
      // 注意：不检查 Token，因为后端使用 Session 认证
      // 如果 Session 过期，后续请求会返回 401，前端需要处理
    } catch (err) {
      console.error('初始化用户状态失败:', err)
      user.value = null
      localStorage.removeItem('user_info')
    }
  }

  /**
   * 用户登录
   * 验证用户账户和密码，成功则设置当前用户
   *
   * @param data - 登录数据（包含账户和密码）
   * @returns {Promise<boolean>} 登录成功返回 true，失败返回 false
   *
   * @example
   * const userStore = useUserStore()
   * const success = await userStore.login({
   *   account: 'user@example.com',
   *   password: 'password123'
   * })
   * if (success) {
   *   console.log('登录成功')
   * }
   *
   * 注意：后端使用 Session 认证，不返回 Token
   * Session 信息由浏览器通过 Cookie 自动管理
   */
  async function login(data: LoginData): Promise<boolean> {
    try {
      // 开始加载
      loading.value = true
      error.value = null

      // 构造登录请求
      const loginRequest: UserLoginRequest = {
        userAccount: data.account,
        userPassword: data.password
      }

      // 调用登录 API
      const response = await loginUser(loginRequest)

      // 检查响应
      // 后端业务状态码：0 表示成功
      if (response.code === 0 && response.data) {
        // 调试日志：打印响应数据结构
        console.log('登录响应数据:', response.data)

        // 判断数据结构：可能直接是 LoginUserVO 或包含 user 字段
        let loginUserData: LoginUserVO

        if ('user' in response.data && response.data.user) {
          // 数据结构为 { user: LoginUserVO }
          loginUserData = response.data.user as LoginUserVO
        } else {
          // 数据结构直接是 LoginUserVO
          loginUserData = response.data as LoginUserVO
        }

        // 验证用户数据是否存在
        if (!loginUserData || !loginUserData.id) {
          error.value = '服务器返回的用户数据格式不正确'
          console.error('用户数据无效:', loginUserData)
          return false
        }

        // 将后端 LoginUserVO 转换为前端 User 格式
        const userData: User = {
          id: String(loginUserData.id),
          account: loginUserData.userAccount,
          displayName: loginUserData.userName,
          avatar: loginUserData.userAvatar,
          bio: loginUserData.userProfile,
          role: loginUserData.userRole
        }

        // 存储用户信息
        user.value = userData

        // 存储到 localStorage 实现持久化
        localStorage.setItem('user_info', JSON.stringify(userData))

        // 注意：不存储 Token，因为后端使用 Session 认证
        // Session 信息由浏览器通过 Cookie 自动管理

        return true
      } else {
        // 登录失败
        error.value = response.description || response.message || '登录失败'
        return false
      }
    } catch (err: any) {
      // 处理错误
      error.value = err.message || '登录失败，请稍后重试'
      console.error('登录错误:', err)
      return false
    } finally {
      // 结束加载
      loading.value = false
    }
  }

  /**
   * 用户退出登录
   * 清除当前登录用户信息，并调用后端接口清除服务端 Session
   *
   * 注意：后端使用 Session 认证，退出登录时需要调用后端接口
   * 后端会清除服务器端的 Session
   * 浏览器的 Cookie 会自动失效
   *
   * @example
   * const userStore = useUserStore()
   * await userStore.logout()
   */
  async function logout() {
    try {
      // 调用后端退出登录接口，清除服务端 Session
      await apiLogoutUser()
    } catch (error) {
      console.error('退出登录失败:', error)
      // 即使接口调用失败，也继续清除本地状态
    }

    // 清除用户信息
    user.value = null

    // 注意：不清除 Token，因为后端使用 Session 认证
    // Session 由后端管理，前端无需手动清除

    // 清除 localStorage 中的用户信息
    localStorage.removeItem('user_info')

    // 清除错误信息
    error.value = null
  }

  /**
   * 用户注册
   * 创建新用户账户
   *
   * @param data - 注册信息
   * @returns {Promise<boolean>} 注册成功返回 true，失败返回 false
   *
   * @example
   * const userStore = useUserStore()
   * const success = await userStore.register({
   *   account: 'user@example.com',
   *   displayName: '张三',
   *   password: 'password123',
   *   confirmPassword: 'password123',
   *   bio: '这是我的个人简介'
   * })
   */
  async function register(data: RegisterData): Promise<boolean> {
    try {
      // 开始加载
      loading.value = true
      error.value = null

      // 构造注册请求
      const registerRequest: UserRegisterRequest = {
        userAccount: data.account,
        userPassword: data.password,
        confirmPassword: data.confirmPassword
      }

      // 调用注册 API
      const response = await registerUser(registerRequest)

      // 检查响应
      // 后端业务状态码：0 表示成功
      if (response.code === 0) {
        // 注册成功
        return true
      } else {
        // 注册失败
        error.value = response.description || response.message || '注册失败'
        return false
      }
    } catch (err: any) {
      // 处理错误
      error.value = err.message || '注册失败，请稍后重试'
      console.error('注册错误:', err)
      return false
    } finally {
      // 结束加载
      loading.value = false
    }
  }

  /**
   * 清除错误信息
   * 在用户进行新的操作前调用
   */
  function clearError() {
    error.value = null
  }

  // ========== 初始化 ==========

  // 应用启动时初始化用户状态
  initializeUser()

  // ========== 导出 ==========

  /**
   * Store 导出对象
   * 包含所有状态、计算属性和方法
   */
  return {
    user,              // 当前登录用户
    isLoggedIn,        // 登录状态
    isLoading,         // 加载状态
    hasError,          // 是否有错误
    error,             // 错误信息
    login,             // 登录方法
    logout,            // 退出登录方法
    register,          // 注册方法
    clearError,        // 清除错误信息
    initializeUser     // 初始化用户状态
  }
})
