/**
 * 认证工具模块
 * 管理Token、用户信息和权限
 */

const TOKEN_KEY = 'parking_token'
const USER_INFO_KEY = 'parking_user_info'
const TOKEN_EXPIRES_KEY = 'parking_token_expires'

/**
 * 获取Token
 * @returns {string|null} Token字符串或null
 */
export function getToken() {
  const token = localStorage.getItem(TOKEN_KEY)
  
  // 检查Token是否过期
  if (token) {
    const expires = localStorage.getItem(TOKEN_EXPIRES_KEY)
    if (expires && Date.now() > parseInt(expires)) {
      // Token已过期，清除数据
      removeToken()
      return null
    }
  }
  
  return token
}

/**
 * 设置Token
 * @param {string} token - Token字符串
 * @param {number} expiresIn - 过期时间（秒），默认2小时
 */
export function setToken(token, expiresIn = 2 * 60 * 60) {
  localStorage.setItem(TOKEN_KEY, token)
  
  // 设置过期时间
  const expiresAt = Date.now() + expiresIn * 1000
  localStorage.setItem(TOKEN_EXPIRES_KEY, expiresAt.toString())
  
  console.log('✅ Token已保存，过期时间:', new Date(expiresAt).toLocaleString())
}

/**
 * 移除Token
 */
export function removeToken() {
  localStorage.removeItem(TOKEN_KEY)
  localStorage.removeItem(TOKEN_EXPIRES_KEY)
  console.log('🗑️ Token已清除')
}

/**
 * 获取用户信息
 * @returns {Object|null} 用户信息对象或null
 */
export function getUserInfo() {
  const userInfoStr = localStorage.getItem(USER_INFO_KEY)
  if (userInfoStr) {
    try {
      return JSON.parse(userInfoStr)
    } catch (e) {
      console.error('解析用户信息失败:', e)
      return null
    }
  }
  return null
}

/**
 * 设置用户信息
 * @param {Object} userInfo - 用户信息对象
 */
export function setUserInfo(userInfo) {
  if (userInfo && typeof userInfo === 'object') {
    localStorage.setItem(USER_INFO_KEY, JSON.stringify(userInfo))
    console.log('✅ 用户信息已保存:', userInfo.username || userInfo.name)
  }
}

/**
 * 移除用户信息
 */
export function removeUserInfo() {
  localStorage.removeItem(USER_INFO_KEY)
  console.log('🗑️ 用户信息已清除')
}

/**
 * 检查是否已登录
 * @returns {boolean} 是否已登录
 */
export function isLoggedIn() {
  const token = getToken()
  return !!token
}

/**
 * 清除所有认证信息
 */
export function clearAuth() {
  removeToken()
  removeUserInfo()
  console.log('🔒 所有认证信息已清除')
}

/**
 * 检查Token是否即将过期（小于1小时）
 * @returns {boolean} 是否即将过期
 */
export function isTokenExpiringSoon() {
  const expires = localStorage.getItem(TOKEN_EXPIRES_KEY)
  if (!expires) return false
  
  const expiresAt = parseInt(expires)
  const oneHour = 60 * 60 * 1000
  
  return (expiresAt - Date.now()) < oneHour
}

/**
 * 刷新Token（如果后端支持）
 * @returns {Promise<boolean>} 是否刷新成功
 */
export async function refreshToken() {
  try {
    // 这里应该调用后端的刷新Token接口
    // const response = await axios.post('/api/auth/refresh')
    // if (response.data.token) {
    //   setToken(response.data.token)
    //   return true
    // }
    console.warn('⚠️ Token刷新功能未实现')
    return false
  } catch (error) {
    console.error('刷新Token失败:', error)
    return false
  }
}

/**
 * 获取用户权限列表
 * @returns {Array<string>} 权限列表
 */
export function getUserPermissions() {
  const userInfo = getUserInfo()
  return userInfo?.permissions || []
}

/**
 * 检查用户是否有指定权限
 * @param {string} permission - 权限标识
 * @returns {boolean} 是否有权限
 */
export function hasPermission(permission) {
  const permissions = getUserPermissions()
  return permissions.includes(permission) || permissions.includes('*')
}

/**
 * 检查用户是否有任一权限
 * @param {Array<string>} permissionList - 权限列表
 * @returns {boolean} 是否有任一权限
 */
export function hasAnyPermission(permissionList) {
  return permissionList.some(permission => hasPermission(permission))
}

/**
 * 检查用户是否有所有权限
 * @param {Array<string>} permissionList - 权限列表
 * @returns {boolean} 是否有所有权限
 */
export function hasAllPermissions(permissionList) {
  return permissionList.every(permission => hasPermission(permission))
}

/**
 * 获取用户角色
 * @returns {string} 用户角色
 */
export function getUserRole() {
  const userInfo = getUserInfo()
  return userInfo?.role || 'guest'
}

/**
 * 检查用户是否是管理员
 * @returns {boolean} 是否是管理员
 */
export function isAdmin() {
  const role = getUserRole()
  return role === 'admin' || role === 'super_admin'
}

export default {
  getToken,
  setToken,
  removeToken,
  getUserInfo,
  setUserInfo,
  removeUserInfo,
  isLoggedIn,
  clearAuth,
  isTokenExpiringSoon,
  refreshToken,
  getUserPermissions,
  hasPermission,
  hasAnyPermission,
  hasAllPermissions,
  getUserRole,
  isAdmin
}
