// WebSocket连接测试工具
export class WebSocketTest {
  constructor() {
    this.testResults = [];
  }

  /**
   * 测试WebSocket连接
   * @param {string} url WebSocket URL
   * @returns {Promise<Object>} 测试结果
   */
  async testConnection(url) {
    return new Promise((resolve) => {
      const startTime = Date.now();
      const ws = new WebSocket(url);
      
      const result = {
        url,
        success: false,
        duration: 0,
        error: null,
        readyState: null
      };

      const timeout = setTimeout(() => {
        ws.close();
        result.error = '连接超时';
        result.duration = Date.now() - startTime;
        resolve(result);
      }, 5000);

      ws.onopen = () => {
        clearTimeout(timeout);
        result.success = true;
        result.duration = Date.now() - startTime;
        result.readyState = ws.readyState;
        ws.close();
        resolve(result);
      };

      ws.onerror = (error) => {
        clearTimeout(timeout);
        result.error = error.message || '连接失败';
        result.duration = Date.now() - startTime;
        result.readyState = ws.readyState;
        resolve(result);
      };

      ws.onclose = (event) => {
        clearTimeout(timeout);
        if (!result.success) {
          result.error = `连接关闭: ${event.code} ${event.reason}`;
          result.duration = Date.now() - startTime;
        }
        result.readyState = ws.readyState;
        resolve(result);
      };
    });
  }

  /**
   * 测试多个WebSocket地址
   * @param {Array<string>} urls 要测试的URL列表
   * @returns {Promise<Array>} 所有测试结果
   */
  async testMultipleConnections(urls) {
    console.log('🧪 开始测试WebSocket连接...');
    
    const results = [];
    for (const url of urls) {
      console.log(`🔍 测试连接: ${url}`);
      const result = await this.testConnection(url);
      results.push(result);
      
      if (result.success) {
        console.log(`✅ 连接成功: ${url} (${result.duration}ms)`);
      } else {
        console.log(`❌ 连接失败: ${url} - ${result.error}`);
      }
    }
    
    return results;
  }

  /**
   * 获取推荐的WebSocket地址
   * @returns {Array<string>} 推荐的URL列表
   */
  getRecommendedUrls() {
    const urls = [];
    
    // 生产环境地址
    urls.push('ws://localhost:8675/websocket/vehicle');
    
    // 本地开发环境
    urls.push('ws://localhost:8675/websocket/vehicle');
    urls.push('ws://127.0.0.1:8675/websocket/vehicle');
    
    // 如果配置了其他地址
    if (process.env.VUE_APP_WEBSOCKET_HOST) {
      urls.push(`ws://${process.env.VUE_APP_WEBSOCKET_HOST}/websocket/vehicle`);
    }
    
    // 从当前页面获取主机信息
    const currentHost = window.location.hostname;
    const currentPort = window.location.port || '8675';
    urls.push(`ws://${currentHost}:${currentPort}/websocket/vehicle`);
    
    return urls;
  }

  /**
   * 运行完整的连接测试
   * @returns {Promise<Object>} 测试报告
   */
  async runFullTest() {
    console.log('🚀 开始WebSocket连接诊断...');
    
    const urls = this.getRecommendedUrls();
    const results = await this.testMultipleConnections(urls);
    
    const successful = results.filter(r => r.success);
    const failed = results.filter(r => !r.success);
    
    const report = {
      total: results.length,
      successful: successful.length,
      failed: failed.length,
      results,
      recommendations: []
    };
    
    if (successful.length > 0) {
      report.recommendations.push(`✅ 找到可用的WebSocket地址: ${successful[0].url}`);
    } else {
      report.recommendations.push('❌ 所有WebSocket地址都无法连接');
      report.recommendations.push('💡 请检查后端服务是否启动在8675端口');
      report.recommendations.push('💡 请检查WebSocket端点是否正确配置');
    }
    
    console.log('📊 测试报告:', report);
    return report;
  }
}

// 导出单例实例
export const websocketTest = new WebSocketTest();

// 在浏览器控制台中可用的全局方法
if (typeof window !== 'undefined') {
  window.testWebSocket = () => websocketTest.runFullTest();
  window.testWebSocketConnection = (url) => websocketTest.testConnection(url);
}
