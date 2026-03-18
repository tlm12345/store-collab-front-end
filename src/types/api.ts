/**
 * API 相关类型定义
 * 定义请求和响应的数据结构
 */

/**
 * 通用响应结构
 * 后端统一返回的数据结构
 *
 * @template T - 响应数据的类型
 */
export interface ApiResponse<T = any> {
  /**
   * 响应状态码
   * 0 表示成功，其他值表示失败
   * 示例：0 (成功), 40000 (请求参数错误), 50000 (服务器内部错误)
   */
  code: number

  /**
   * 响应数据
   * 成功时包含具体数据，失败时可能为 null
   */
  data: T | null

  /**
   * 响应消息
   * 成功或失败的简要提示信息
   * 示例："请求参数错误"、"操作成功" 等
   */
  message: string

  /**
   * 响应描述
   * 详细的错误描述或信息
   * 示例："用户不存在"、"密码错误" 等
   */
  description: string
}

/**
 * 用户注册请求体
 * 对应后端 UserRegisterRequest
 */
export interface UserRegisterRequest {
  /**
   * 用户账号
   * 登录时使用的唯一标识（如：用户名、邮箱、手机号等）
   */
  userAccount: string

  /**
   * 用户密码
   * 登录密码
   */
  userPassword: string

  /**
   * 用户确认密码
   * 用于验证密码一致性
   */
  confirmPassword: string
}

/**
 * 用户登录请求体
 * 对应后端 UserLoginRequest
 */
export interface UserLoginRequest {
  /**
   * 用户账号
   * 登录时使用的唯一标识
   */
  userAccount: string

  /**
   * 用户密码
   * 登录密码
   */
  userPassword: string
}

/**
 * 登录用户信息 VO（View Object）
 * 对应后端 LoginUserVO 类，用于接收登录成功后的用户信息
 *
 * 注意：忽略后端的 serialVersionUID 字段
 */
export interface LoginUserVO {
  /**
   * 用户 ID（对应后端的 Long 类型）
   */
  id: string

  /**
   * 用户名（userName，即昵称或显示名称）
   */
  userName: string

  /**
   * 用户角色
   */
  userRole: string

  /**
   * 用户简介（userProfile，个人简介）
   */
  userProfile: string

  /**
   * 账号（userAccount，登录时使用的唯一标识）
   */
  userAccount: string

  /**
   * 用户头像 URL
   */
  userAvatar: string
}

/**
 * 用户信息响应
 * 登录成功后返回的用户信息（兼容旧版本）
 * @deprecated 使用 LoginUserVO 替代
 */
export interface UserInfo {
  /**
   * 用户唯一标识符
   */
  id: string

  /**
   * 用户账号
   */
  userAccount: string

  /**
   * 用户昵称（显示名称）
   */
  userNickname?: string

  /**
   * 用户头像 URL
   */
  userAvatar?: string

  /**
   * 个人简介
   */
  userBio?: string

  /**
   * 用户角色
   */
  userRole?: string

  /**
   * 创建时间
   */
  createTime?: string

  /**
   * 更新时间
   */
  updateTime?: string
}

/**
 * 登录响应数据
 * 登录成功后返回的数据
 *
 * 注意：后端使用 Session 认证，不返回 Token
 * 认证信息由浏览器通过 Cookie 自动管理
 *
 * data 字段可能是以下两种格式之一：
 * 1. { user: LoginUserVO } - 用户信息包裹在 user 字段中
 * 2. LoginUserVO - 直接返回用户信息
 */
export interface LoginResponseData {
  /**
   * 登录用户信息（对应后端 LoginUserVO）
   * 可能是 LoginUserVO 对象或 { user: LoginUserVO }
   */
  user?: LoginUserVO
  [key: string]: any // 允许其他字段，支持直接返回 LoginUserVO 的情况
}

/**
 * 注册响应数据
 * 注册成功后返回的数据
 *
 * 注意：注册成功后返回的用户信息格式与登录接口相同
 * user 字段的类型为 LoginUserVO
 */
export interface RegisterResponseData {
  /**
   * 注册成功的用户信息（对应后端 LoginUserVO）
   */
  user: LoginUserVO

  /**
   * 用户 ID
   */
  userId: string
}

/**
 * 请求错误
 * 网络请求失败或服务器错误时的错误信息
 */
export interface RequestError {
  /**
   * 错误消息
   */
  message: string

  /**
   * 错误状态码
   */
  code?: number

  /**
   * 错误详细信息
   */
  details?: any
}

/**
 * 创建用户请求体
 * 对应后端 UserAddRequest
 */
export interface UserAddRequest {
  /**
   * 用户昵称
   */
  userName: string

  /**
   * 账号
   */
  userAccount: string

  /**
   * 用户密码
   */
  userPassword: string

  /**
   * 用户确认密码
   */
  confirmPassword: string

  /**
   * 用户头像
   */
  userAvatar?: string

  /**
   * 用户简介
   */
  userProfile?: string

  /**
   * 用户角色: user, admin
   */
  userRole: string
}

/**
 * 更新用户请求体
 * 对应后端 UserUpdateRequest
 */
export interface UserUpdateRequest {
  /**
   * 用户 ID
   */
  id: string

  /**
   * 用户昵称
   */
  userName?: string

  /**
   * 用户头像
   */
  userAvatar?: string

  /**
   * 简介
   */
  userProfile?: string

  /**
   * 用户角色：user/admin
   */
  userRole?: string
}

/**
 * 分页查询用户请求体
 * 对应后端 UserQueryRequest
 */
export interface UserQueryRequest {
  /**
   * 用户 ID
   */
  id?: string

  /**
   * 用户昵称
   */
  userName?: string

  /**
   * 账号
   */
  userAccount?: string

  /**
   * 简介
   */
  userProfile?: string

  /**
   * 用户角色：user/admin/ban
   */
  userRole?: string

  /**
   * 当前页码
   */
  current?: number

  /**
   * 每页数量
   */
  pageSize?: number
}

/**
 * 分页响应
 * 通用分页数据结构
 */
export interface PageResponse<T> {
  /**
   * 数据列表
   */
  records: T[]

  /**
   * 总记录数
   */
  total: number

  /**
   * 当前页码
   */
  current: number

  /**
   * 每页数量
   */
  size: number

  /**
   * 总页数
   */
  pages: number
}

/**
 * 用户 VO（View Object）
 * 用户信息展示对象
 */
export interface UserVO {
  /**
   * 用户 ID
   */
  id: string

  /**
   * 用户昵称
   */
  userName: string

  /**
   * 账号
   */
  userAccount: string

  /**
   * 用户头像
   */
  userAvatar?: string

  /**
   * 用户简介
   */
  userProfile?: string

  /**
   * 用户角色
   */
  userRole: string

  /**
   * 创建时间
   */
  createTime?: string

  /**
   * 更新时间
   */
  updateTime?: string
}

// ==================== 图片管理相关类型 ====================

/**
 * 图片信息（原始实体）
 * 对应后端 Picture 实体类
 * 用于管理员接口返回的完整图片数据
 */
export interface Picture {
  /**
   * 图片 ID
   */
  id: string

  /**
   * 图片 URL
   */
  url: string

  /**
   * 图片名称
   */
  name: string

  /**
   * 图片描述
   */
  introduction?: string

  /**
   * 图片分类
   */
  category?: string

  /**
   * 图片标签（JSON 数组字符串）
   */
  tags?: string

  /**
   * 文件大小（字节）
   */
  picSize?: number

  /**
   * 图片宽度
   */
  picWidth?: number

  /**
   * 图片高度
   */
  picHeight?: number

  /**
   * 图片宽高比
   */
  picScale?: number

  /**
   * 图片格式（jpg/png/gif 等）
   */
  picFormat?: string

  /**
   * 图片主色调
   */
  picAve?: string

  /**
   * 创建者 ID
   */
  userId?: string

  /**
   * 空间 ID
   */
  spaceId?: string

  /**
   * 审核状态（0=待审核, 1=通过, 2=拒绝）
   */
  viewStatus?: number

  /**
   * 审核信息
   */
  viewMessage?: string

  /**
   * 创建时间
   */
  createTime?: string

  /**
   * 更新时间
   */
  updateTime?: string

  /**
   * 是否删除（逻辑删除标志）
   */
  isDelete?: number
}

/**
 * 图片信息 VO（View Object）
 * 对应后端 PictureVO
 */
export interface PictureVO {
  /**
   * 图片 ID
   */
  id: string

  /**
   * 图片 URL
   */
  url: string

  /**
   * 图片名称
   */
  name: string

  /**
   * 图片描述
   */
  introduction?: string

  /**
   * 图片分类
   */
  category?: string

  /**
   * 图片标签（JSON 数组字符串）
   */
  tags?: string

  /**
   * 文件大小（字节）
   */
  picSize?: number

  /**
   * 图片宽度
   */
  picWidth?: number

  /**
   * 图片高度
   */
  picHeight?: number

  /**
   * 图片宽高比
   */
  picScale?: number

  /**
   * 图片格式（jpg/png/gif 等）
   */
  picFormat?: string

  /**
   * 图片主色调
   */
  picAve?: string

  /**
   * 创建者 ID
   */
  userId?: string

  /**
   * 空间 ID
   */
  spaceId?: string

  /**
   * 创建者信息
   */
  userVO?: UserVO

  /**
   * 创建时间
   */
  createTime?: string

  /**
   * 更新时间
   */
  updateTime?: string

  /**
   * 权限列表
   */
  permissionList?: string[]

  /**
   * 审核状态（0=待审核, 1=通过, 2=拒绝）
   */
  viewStatus?: number

  /**
   * 审核信息
   */
  viewMessage?: string

  /**
   * 审核时间
   */
  viewTime?: string
}

/**
 * 添加图片请求体
 * 对应后端 PictureAddRequest
 */
export interface PictureAddRequest {
  /**
   * 图片 URL（必填）
   */
  url: string

  /**
   * 图片名称（必填）
   */
  name: string

  /**
   * 图片描述
   */
  introduction?: string

  /**
   * 图片分类
   */
  category?: string

  /**
   * 图片标签（JSON 数组字符串）
   */
  tags?: string
}

/**
 * 更新图片请求体（管理员）
 * 对应后端 PictureUpdateRequest
 */
export interface PictureUpdateRequest {
  /**
   * 图片 ID（必填）
   */
  id: string

  /**
   * 图片 URL
   */
  url?: string

  /**
   * 图片名称
   */
  name?: string

  /**
   * 图片描述
   */
  introduction?: string

  /**
   * 图片分类
   */
  category?: string

  /**
   * 图片标签（JSON 数组字符串）
   */
  tags?: string

  /**
   * 审核状态（0=待审核, 1=通过, 2=拒绝）
   */
  viewStatus?: number

  /**
   * 审核信息
   */
  viewMessage?: string
}

/**
 * 编辑图片请求体（所有者或管理员）
 * 对应后端 PictureEditRequest
 */
export interface PictureEditRequest {
  /**
   * 图片 ID（必填）
   */
  id: string

  /**
   * 图片名称
   */
  name?: string

  /**
   * 图片描述
   */
  introduction?: string

  /**
   * 图片分类
   */
  category?: string

  /**
   * 图片标签（JSON 数组字符串）
   */
  tags?: string
}

/**
 * 查询图片请求体
 * 对应后端 PictureQueryRequest
 */
export interface PictureQueryRequest {
  /**
   * 搜索关键词（搜索名称和描述）
   */
  searchText?: string

  /**
   * 图片名称
   */
  name?: string

  /**
   * 图片描述
   */
  introduction?: string

  /**
   * 图片分类
   */
  category?: string

  /**
   * 图片标签列表
   */
  tags?: string[]

  /**
   * 最小文件大小
   */
  minPicSize?: number

  /**
   * 最大文件大小
   */
  maxPicSize?: number

  /**
   * 图片宽度
   */
  picWidth?: number

  /**
   * 图片高度
   */
  picHeight?: number

  /**
   * 图片宽高比
   */
  picScale?: number

  /**
   * 图片格式
   */
  picFormat?: string

  /**
   * 图片主色调
   */
  picAve?: string

  /**
   * 创建者 ID
   */
  userId?: string

  /**
   * 空间 ID
   */
  spaceId?: string

  /**
   * 创建时间
   */
  createTime?: string

  /**
   * 编辑时间下限
   */
  startEditTime?: string

  /**
   * 编辑时间上限
   */
  endEditTime?: string

  /**
   * 是否查询私有空间
   */
  queryPrivateSpace?: boolean

  /**
   * 当前页码
   */
  pageNum?: number

  /**
   * 每页数量
   */
  pageSize?: number
}

/**
   * 通过 URL 上传图片请求体
   * 对应后端 UploadPictureRequest
   */
export interface UploadPictureRequest {
  /**
   * 图片 ID（编辑时使用）
   */
  id?: string

  /**
   * 图片 URL
   */
  url?: string

  /**
   * 图片名称
   */
  name?: string

  /**
   * 图片描述
   */
  introduction?: string

  /**
   * 图片分类
   */
  category?: string

  /**
   * 图片标签列表
   */
  tags?: string[]

  /**
   * 空间 ID
   */
  spaceId?: string
}

/**
 * 标签和分类响应
 * 对应后端 PictureTagCategory
 */
export interface PictureTagCategory {
  /**
   * 标签列表
   */
  tags: string[]

  /**
   * 分类列表
   */
  categories: string[]
}

/**
 * 删除请求体
 * 对应后端 DeleteRequest
 */
export interface DeleteRequest {
  /**
   * 要删除的 ID
   */
  id: string
}

// ==================== 空间管理相关类型 ====================

/**
 * 空间信息（实体）
 * 对应后端 Space 实体类
 */
export interface Space {
  /**
   * 空间 ID
   */
  id: string

  /**
   * 空间名称
   */
  spaceName: string

  /**
   * 空间等级：0-普通版, 1-专业版, 2-旗舰版
   */
  spaceLevel: number

  /**
   * 空间类型：0-私有空间, 1-团队空间
   */
  spaceType: number

  /**
   * 空间已使用容量（字节）
   */
  spaceSizeUsed: number

  /**
   * 空间最大容量（字节）
   */
  spaceMaxSize: number

  /**
   * 当前空间下的图片数量
   */
  spaceTotalCount: number

  /**
   * 空间最大图片数量
   */
  spaceMaxCount: number

  /**
   * 创建用户 ID
   */
  userId: string

  /**
   * 创建时间
   */
  createTime?: string

  /**
   * 编辑时间
   */
  editTime?: string

  /**
   * 更新时间
   */
  updateTime?: string
}

/**
 * 空间信息 VO（View Object）
 * 对应后端 SpaceVO
 */
export interface SpaceVO extends Space {
  /**
   * 创建者信息
   */
  userVO?: UserVO

  /**
   * 当前用户的权限列表
   */
  permissionList?: string[]
}

/**
 * 空间成员信息（实体）
 * 对应后端 SpaceUser 实体类
 */
export interface SpaceUser {
  /**
   * 记录 ID
   */
  id: string

  /**
   * 空间 ID
   */
  spaceId: string

  /**
   * 用户 ID
   */
  userId: string

  /**
   * 空间角色：admin-管理员, editor-编辑者, viewer-浏览者
   */
  spaceRole: 'admin' | 'editor' | 'viewer'

  /**
   * 创建时间
   */
  createTime?: string

  /**
   * 更新时间
   */
  updateTime?: string
}

/**
 * 空间成员信息 VO（View Object）
 * 对应后端 SpaceUserVO
 */
export interface SpaceUserVO extends SpaceUser {
  /**
   * 空间信息
   */
  spaceVO?: SpaceVO

  /**
   * 用户信息
   */
  userVO?: UserVO
}

/**
 * 创建空间请求体
 * 对应后端 SpaceCreateRequest
 */
export interface SpaceCreateRequest {
  /**
   * 空间名称
   */
  spaceName: string

  /**
   * 空间等级：0-普通版, 1-专业版, 2-旗舰版
   */
  spaceLevel?: number

  /**
   * 空间类型：0-私有空间, 1-团队空间
   */
  spaceType?: number
}

/**
 * 编辑空间请求体
 * 对应后端 SpaceEditRequest
 */
export interface SpaceEditRequest {
  /**
   * 空间 ID
   */
  id: string

  /**
   * 空间名称
   */
  spaceName: string
}

/**
 * 添加空间成员请求体
 * 对应后端 SpaceUserAddRequest
 */
export interface SpaceAddUserRequest {
  /**
   * 空间 ID
   */
  spaceId: string

  /**
   * 用户 ID
   */
  userId: string

  /**
   * 空间角色：admin, editor, viewer
   */
  spaceRole?: 'admin' | 'editor' | 'viewer'
}

/**
 * 更新空间成员请求体
 * 对应后端 SpaceUserUpdateRequest
 */
export interface SpaceUpdateUserRequest {
  /**
   * 记录 ID
   */
  id: string

  /**
   * 空间角色
   */
  spaceRole: 'admin' | 'editor' | 'viewer'
}

/**
 * 查询空间成员请求体
 * 对应后端 GetSpaceUserRequest
 */
export interface GetSpaceUserRequest {
  /**
   * 空间 ID
   */
  spaceId: string

  /**
   * 用户 ID
   */
  userId: string
}

/**
 * 查询空间所有成员请求体
 * 对应后端 GetAllSpaceUserRequest
 */
export interface GetAllSpaceUserRequest {
  /**
   * 空间 ID
   */
  spaceId: string
}
