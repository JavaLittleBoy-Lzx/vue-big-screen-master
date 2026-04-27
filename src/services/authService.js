/**
 * 认证服务模块
 * 处理登录、登出、Token刷新等认证相关API
 */

import axios from 'axios'
import { getToken } from '@/utils/auth'

// 创建axios实例
const authRequest = axios.create({
  baseURL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:8675',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加Token
authRequest.interceptors.request.use(
  config => {
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  },
  error => {
    console.error('请求错误:', error)
    return Promise.reject(error)
  }
)

// 响应拦截器 - 处理错误
authRequest.interceptors.response.use(
  response => {
    const data = response.data
    // 检查后端返回的 code，如果是错误码则抛出异常
    if (data.code && data.code !== '0' && data.code !== 0) {
      const error = new Error(data.msg || '请求失败')
      error.response = response
      error.response.data = data
      return Promise.reject(error)
    }
    return data
  },
  error => {
    console.error('响应错误:', error)

    // 处理不同的错误状态码
    if (error.response) {
      switch (error.response.status) {
        case 401:
          console.warn('⚠️ 未授权，Token可能已过期')
          // 这里可以触发重新登录
          break
        case 403:
          console.warn('⚠️ 禁止访问，权限不足')
          break
        case 500:
          console.error('❌ 服务器错误')
          break
        default:
          console.error('❌ 请求失败:', error.response.status)
      }
    }

    return Promise.reject(error)
  }
)

/**
 * 登录API
 * @param {Object} credentials - 登录凭据
 * @param {string} credentials.username - 用户名
 * @param {string} credentials.password - 密码
 * @returns {Promise} 返回登录响应
 */
export async function loginAPI(credentials) {
  try {
    console.log('📝 发送登录请求:', credentials.username)
    console.log('📡 后端地址:', authRequest.defaults.baseURL)
    
    // 调用真实的后端API
    const response = await authRequest.post('/api/auth/login', credentials)
    
    console.log('✅ 登录响应:', response)
    return response
  } catch (error) {
    console.error('❌ 登录失败:', error)
    
    // 返回更友好的错误信息
    if (error.response) {
      return {
        code: error.response.status,
        msg: error.response.data?.msg || error.response.data?.message || '登录失败'
      }
    } else if (error.request) {
      return {
        code: -1,
        msg: '无法连接到服务器，请检查网络或后端是否启动'
      }
    } else {
      return {
        code: -1,
        msg: error.message || '登录请求失败'
      }
    }
  }
}


/**
 * 登出API
 * @returns {Promise} 返回登出响应
 */
export async function logoutAPI() {
  try {
    console.log('📝 发送登出请求')
    
    // 实际应用中应该调用后端API
    // const response = await authRequest.post('/api/auth/logout')
    
    // 临时模拟登出
    const response = await simulateLogout()
    
    console.log('✅ 登出成功')
    return response
  } catch (error) {
    console.error('❌ 登出失败:', error)
    throw error
  }
}

/**
 * 模拟登出
 */
async function simulateLogout() {
  return new Promise((resolve) => {
    setTimeout(() => {
      resolve({
        code: 0,
        msg: '登出成功'
      })
    }, 300)
  })
}

/**
 * 刷新Token API
 * @returns {Promise} 返回新的Token
 */
export async function refreshTokenAPI() {
  try {
    console.log('📝 刷新Token')
    
    // 实际应用中应该调用后端API
    // const response = await authRequest.post('/api/auth/refresh')
    
    console.log('✅ Token刷新成功')
    return {
      code: 0,
      msg: 'Token刷新成功',
      data: {
        token: 'new_mock_token_' + Date.now()
      }
    }
  } catch (error) {
    console.error('❌ Token刷新失败:', error)
    throw error
  }
}

/**
 * 获取用户信息API
 * @returns {Promise} 返回用户信息
 */
export async function getUserInfoAPI() {
  try {
    console.log('📝 获取用户信息')
    
    // 实际应用中应该调用后端API
    // const response = await authRequest.get('/api/auth/userinfo')
    
    console.log('✅ 获取用户信息成功')
    return {
      code: 0,
      msg: '获取成功',
      data: {
        id: 1,
        username: 'admin',
        name: '管理员',
        role: 'admin',
        permissions: ['*']
      }
    }
  } catch (error) {
    console.error('❌ 获取用户信息失败:', error)
    throw error
  }
}

/**
 * 修改密码API
 * @param {Object} data - 密码数据
 * @param {string} data.oldPassword - 旧密码
 * @param {string} data.newPassword - 新密码
 * @returns {Promise} 返回修改结果
 */
export async function changePasswordAPI(data) {
  try {
    console.log('📝 修改密码')

    // 获取当前登录用户的token
    const token = getToken()
    if (!token) {
      throw new Error('请先登录')
    }

    // 调用后端API验证旧密码并修改密码
    const response = await authRequest.post('/api/auth/change-password', {
      oldPassword: data.oldPassword,
      newPassword: data.newPassword
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    console.log('✅ 密码修改成功:', response)
    return response
  } catch (error) {
    console.error('❌ 密码修改失败:', error)

    // 处理网络错误
    if (!error.response) {
      throw new Error('网络错误，请检查网络连接')
    }

    // 处理后端返回的错误信息
    const status = error.response.status
    const message = error.response.data?.message

    if (status === 400) {
      throw new Error(message || '请求参数错误')
    } else if (status === 401) {
      throw new Error(message || '旧密码错误')
    } else if (status === 403) {
      throw new Error(message || '没有权限执行此操作')
    } else if (status === 404) {
      throw new Error('修改密码接口不存在，请联系管理员')
    } else if (status === 500) {
      throw new Error('服务器错误，请稍后重试')
    } else {
      throw new Error(message || '修改密码失败，请稍后重试')
    }
  }
}

/**
 * 验证旧密码API
 * @param {string} oldPassword - 旧密码
 * @returns {Promise<boolean>} 返回验证结果
 */
export async function verifyOldPasswordAPI(oldPassword) {
  try {
    console.log('📝 验证旧密码')

    // 获取当前登录用户的token
    const token = getToken()
    if (!token) {
      throw new Error('请先登录')
    }

    // 调用后端API验证旧密码
    const response = await authRequest.post('/api/auth/verify-old-password', {
      oldPassword: oldPassword
    }, {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })

    console.log('✅ 旧密码验证成功:', response)
    return true
  } catch (error) {
    console.error('❌ 旧密码验证失败:', error)

    // 处理网络错误
    if (!error.response) {
      throw new Error('网络错误，请检查网络连接')
    }

    // 处理后端返回的错误信息
    const status = error.response.status
    const message = error.response.data?.message || error.response.data?.msg

    if (status === 401) {
      throw new Error(message || '旧密码错误')
    } else {
      throw new Error(message || '验证失败，请稍后重试')
    }
  }
}

export default {
  loginAPI,
  logoutAPI,
  refreshTokenAPI,
  getUserInfoAPI,
  changePasswordAPI,
  verifyOldPasswordAPI
}
