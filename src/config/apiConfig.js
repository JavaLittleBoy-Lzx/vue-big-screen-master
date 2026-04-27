// API配置文件
export const API_CONFIG = {
  // 后端API基础URL - 使用代理路径避免CORS问题
  BACKEND_URL: process.env.VUE_APP_BACKEND_URL || '/api',
  
  // API前缀
  API_PREFIX: '/parking/nefuData',
  
  // 请求超时时间（毫秒）
  TIMEOUT: 10000,
  
  // 重试配置
  RETRY: {
    MAX_RETRIES: 3,
    RETRY_DELAY: 1000
  },
  
  // 缓存配置
  CACHE: {
    ENABLED: true,
    DURATION: 30000 // 30秒缓存
  }
};

// 根据环境设置不同的API地址
if (process.env.NODE_ENV === 'production') {
  // 生产环境使用完整URL
  API_CONFIG.BACKEND_URL = process.env.VUE_APP_BACKEND_URL || 'http://localhost:8675';
} else if (process.env.NODE_ENV === 'development') {
  // 开发环境使用代理路径，避免CORS问题
  API_CONFIG.BACKEND_URL = process.env.VUE_APP_BACKEND_URL || '/api';
}

export default API_CONFIG;
