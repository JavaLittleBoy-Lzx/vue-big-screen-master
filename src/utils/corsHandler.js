/**
 * CORS处理工具
 * 解决跨域请求问题
 */

// 禁用Google翻译等扩展的自动翻译
export const disableAutoTranslation = () => {
  // 添加meta标签禁用翻译
  const meta = document.createElement('meta');
  meta.name = 'google';
  meta.content = 'notranslate';
  document.head.appendChild(meta);
  
  // 添加translate属性到html标签
  document.documentElement.setAttribute('translate', 'no');
  
  // 禁用特定元素的翻译
  const elements = document.querySelectorAll('*');
  elements.forEach(el => {
    el.setAttribute('translate', 'no');
  });
};

// 处理CORS错误
export const handleCORSError = (error) => {
  console.warn('CORS Error detected:', error);
  
  // 如果是Google翻译相关的错误，忽略它
  if (error.message && error.message.includes('translate-pa.googleapis.com')) {
    console.log('Google Translate CORS error ignored');
    return true;
  }
  
  return false;
};

// 设置全局错误处理
export const setupGlobalErrorHandling = () => {
  // 捕获未处理的Promise错误
  window.addEventListener('unhandledrejection', (event) => {
    if (handleCORSError(event.reason)) {
      event.preventDefault();
    }
  });
  
  // 捕获全局错误
  window.addEventListener('error', (event) => {
    if (handleCORSError(event.error)) {
      event.preventDefault();
    }
  });
};

// 初始化CORS处理
export const initCORSHandling = () => {
  // 禁用自动翻译
  disableAutoTranslation();
  
  // 设置全局错误处理
  setupGlobalErrorHandling();
  
  console.log('CORS handling initialized');
};
