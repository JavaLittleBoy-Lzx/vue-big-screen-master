// WebSocket服务 - 接收后端的reportCarIn和reportCarOut事件
import { API_CONFIG } from '@/config/apiConfig';
import { websocketTest } from '@/utils/websocketTest';

class WebSocketService {
  constructor() {
    this.ws = null;
    this.isConnected = false;
    this.reconnectAttempts = 0;
    this.maxReconnectAttempts = 5;
    this.reconnectInterval = 3000; // 3秒
    this.vehicleRecords = []; // 存储进出场记录
    this.listeners = new Map(); // 事件监听器
    this.baseUrl = API_CONFIG.BACKEND_URL.replace('http', 'ws');
  }

  /**
   * 连接WebSocket
   */
  async connect() {
    try {
      console.log('🔌 正在连接WebSocket...');
      
      // 构建WebSocket URL
      const wsUrl = this.buildWebSocketUrl();
      console.log('🌐 WebSocket URL:', wsUrl);
      
      // 先测试连接是否可用
      const testResult = await websocketTest.testConnection(wsUrl);
      if (!testResult.success) {
        console.warn('⚠️ WebSocket连接测试失败:', testResult.error);
        console.log('💡 尝试其他可能的地址...');
        
        // 尝试其他可能的地址
        const alternativeUrls = this.getAlternativeUrls();
        for (const altUrl of alternativeUrls) {
          console.log(`🔄 尝试连接: ${altUrl}`);
          const altTestResult = await websocketTest.testConnection(altUrl);
          if (altTestResult.success) {
            console.log(`✅ 找到可用地址: ${altUrl}`);
            this.ws = new WebSocket(altUrl);
            break;
          }
        }
        
        if (!this.ws) {
          throw new Error(`所有WebSocket地址都无法连接。请检查后端服务是否启动。`);
        }
      } else {
        this.ws = new WebSocket(wsUrl);
      }
      
      this.ws.onopen = (event) => {
        console.log('✅ WebSocket连接成功');
        this.isConnected = true;
        this.reconnectAttempts = 0;
        this.emit('connected', event);
      };
      
      this.ws.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          // console.log('📨 收到WebSocket消息:', data);
          this.handleMessage(data);
        } catch (error) {
          console.error('❌ 解析WebSocket消息失败:', error);
        }
      };
      
      this.ws.onclose = (event) => {
        console.log('🔌 WebSocket连接关闭:', event.code, event.reason);
        this.isConnected = false;
        this.emit('disconnected', event);
        
        // 自动重连
        if (this.reconnectAttempts < this.maxReconnectAttempts) {
          this.scheduleReconnect();
        }
      };
      
      this.ws.onerror = (error) => {
        console.error('❌ WebSocket连接错误:', error);
        this.emit('error', error);
      };
      
    } catch (error) {
      console.error('❌ 创建WebSocket连接失败:', error);
      this.emit('error', error);
    }
  }

  /**
   * 构建WebSocket URL
   */
  buildWebSocketUrl() {
    // 从API配置中获取基础URL
    let baseUrl = API_CONFIG.BACKEND_URL;
    
    // 如果是代理路径，需要转换为实际的WebSocket地址
    if (baseUrl.startsWith('/api')) {
      // 开发环境使用代理，需要指向实际的后端地址
      // 优先使用环境变量，如果没有则使用默认的本地地址
      const backendHost = process.env.VUE_APP_WEBSOCKET_HOST || 'localhost:8675';
      baseUrl = `ws://${backendHost}`;
    } else if (baseUrl.startsWith('http://')) {
      // 生产环境直接替换协议
      baseUrl = baseUrl.replace('http://', 'ws://');
    } else if (baseUrl.startsWith('https://')) {
      // HTTPS环境使用WSS协议
      baseUrl = baseUrl.replace('https://', 'wss://');
    }
    
    // 添加WebSocket路径 - 修复：添加正确的端点路径
    return `${baseUrl}/websocket/vehicle`;
  }

  /**
   * 获取替代的WebSocket URL列表
   */
  getAlternativeUrls() {
    const urls = [];
    
    // 生产环境地址
    urls.push('ws://localhost:8675/websocket/vehicle');
    
    // 本地地址
    urls.push('ws://localhost:8675/websocket/vehicle');
    urls.push('ws://localhost:8675/websocket/vehicle');
    
    // 从当前页面获取主机信息
    const currentHost = window.location.hostname;
    urls.push(`ws://${currentHost}:8675/websocket/vehicle`);
    urls.push(`ws://${currentHost}:8673/websocket/vehicle`);
    
    // 如果配置了其他地址
    if (process.env.VUE_APP_WEBSOCKET_HOST) {
      urls.push(`ws://${process.env.VUE_APP_WEBSOCKET_HOST}/websocket/vehicle`);
    }
    
    return urls;
  }

  /**
   * 运行WebSocket连接诊断
   */
  async runDiagnostics() {
    console.log('🔍 开始WebSocket连接诊断...');
    
    const report = await websocketTest.runFullTest();
    
    if (report.successful > 0) {
      console.log('✅ 找到可用的WebSocket地址');
      const workingUrl = report.results.find(r => r.success);
      console.log(`🎯 推荐使用: ${workingUrl.url}`);
    } else {
      console.log('❌ 所有WebSocket地址都无法连接');
      console.log('💡 请检查以下项目:');
      console.log('   1. 后端服务是否启动');
      console.log('   2. 后端服务是否在8675端口运行');
      console.log('   3. WebSocket端点是否正确配置');
      console.log('   4. 防火墙是否阻止了连接');
    }
    
    return report;
  }

  /**
   * 处理接收到的消息
   */
  handleMessage(data) {
    // console.log('📨 收到WebSocket消息:', data);
    
    // 处理后端推送的消息格式
    if (data.type === 'vehicleEvent') {
      const { eventType, data: eventData } = data;
      
      switch (eventType) {
        case 'carIn':
          // console.log('🚗 收到车辆进场事件:', eventData);
          this.handleCarIn(eventData);
          break;
          
        case 'carOut':
          // console.log('🚗 收到车辆离场事件:', eventData);
          this.handleCarOut(eventData);
          break;
          
        default:
          console.log('📨 收到未知车辆事件:', eventType, eventData);
          this.emit('message', { event: eventType, payload: eventData });
      }
    } else if (data.type === 'heartbeat') {
      console.log('💓 收到心跳包');
      this.emit('heartbeat', data);
    } else if (data.type === 'success') {
      console.log('✅ 连接成功:', data.content);
      this.emit('connected', data);
    } else {
      console.log('📨 收到其他消息:', data);
      this.emit('message', data);
    }
  }

  /**
   * 处理车辆进场事件
   */
  handleCarIn(payload) {
    // console.log('handleCarIn收到车辆进场事件:', payload);
    const record = {
      id: Date.now() + Math.random(),
      plateNumber: payload.plateNumber || payload.carNo,
      type: this.determineVehicleType(payload.plateNumber || payload.carNo),
      channel: payload.channelName || payload.channel || '未知通道',
      vipName: payload.vipName || payload.vipType || '普通用户',
      imageUrl: payload.imageUrl || (payload.rawData && payload.rawData.imageUrl) || '',
      time: payload.enterTime || payload.createTime || payload.time || new Date().toISOString(),
      status: '进场',
      yardName: payload.yardName || '智慧停车场',
      yardCode: payload.yardCode || 'PARK001',
      eventType: 'in',
      rawData: payload
    };
    // console.log('添加的进场记录:', record);
    // 添加到记录列表
    this.vehicleRecords.unshift(record);
    
    // 限制记录数量，保留最近1000条
    if (this.vehicleRecords.length > 1000) {
      this.vehicleRecords = this.vehicleRecords.slice(0, 1000);
    }
    
    // console.log('📝 新增进场记录:', record);
    // console.log('🔌 触发 carIn 事件');
    this.emit('carIn', record);
    this.emit('recordAdded', record);
  }

  /**
   * 处理车辆离场事件
   */
  handleCarOut(payload) {
    const record = {
      id: Date.now() + Math.random(),
      plateNumber: payload.plateNumber || payload.carNo,
      type: this.determineVehicleType(payload.plateNumber || payload.carNo),
      channel: payload.channelName || payload.channel || '未知通道',
      vipName: payload.vipName || payload.vipType || '普通用户',
      imageUrl: payload.imageUrl || (payload.rawData && payload.rawData.imageUrl) || payload.picpath || '',
      time: payload.exitTime || payload.createTime || payload.time || new Date().toISOString(),
      status: '离场',
      yardName: payload.yardName || '智慧停车场',
      yardCode: payload.yardCode || 'PARK001',
      eventType: 'out',
      rawData: payload
    };
    // console.log('添加的离场记录:', record);
    // 添加到记录列表
    this.vehicleRecords.unshift(record);
    
    // 限制记录数量，保留最近1000条
    if (this.vehicleRecords.length > 1000) {
      this.vehicleRecords = this.vehicleRecords.slice(0, 1000);
    }
    
    // console.log('📝 新增离场记录:', record);
    // console.log('🔌 触发 carOut 事件');
    this.emit('carOut', record);
    this.emit('recordAdded', record);
  }

  /**
   * 根据车牌号判断车辆类型
   */
  determineVehicleType(plateNumber) {
    if (!plateNumber) return '未知';
    return plateNumber.length === 7 ? '油车' : '新能源';
  }

  /**
   * 获取进出场记录
   */
  getVehicleRecords(limit = 50) {
    return this.vehicleRecords.slice(0, limit);
  }

  /**
   * 获取最新记录
   */
  getLatestRecords(count = 10) {
    return this.vehicleRecords.slice(0, count);
  }

  /**
   * 清空记录
   */
  clearRecords() {
    this.vehicleRecords = [];
    console.log('🗑️ 已清空进出场记录');
  }

  /**
   * 安排重连
   */
  scheduleReconnect() {
    this.reconnectAttempts++;
    const delay = this.reconnectInterval * this.reconnectAttempts;
    
    console.log(`🔄 ${delay/1000}秒后尝试重连 (第${this.reconnectAttempts}次)`);
    
    setTimeout(() => {
      if (!this.isConnected) {
        console.log('🔄 尝试重连WebSocket...');
        this.connect();
      }
    }, delay);
  }

  /**
   * 添加事件监听器
   */
  on(event, callback) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, []);
    }
    this.listeners.get(event).push(callback);
  }

  /**
   * 移除事件监听器
   */
  off(event, callback) {
    if (this.listeners.has(event)) {
      const callbacks = this.listeners.get(event);
      const index = callbacks.indexOf(callback);
      if (index > -1) {
        callbacks.splice(index, 1);
      }
    }
  }

  /**
   * 触发事件
   */
  emit(event, data) {
    if (this.listeners.has(event)) {
      this.listeners.get(event).forEach(callback => {
        try {
          callback(data);
        } catch (error) {
          console.error('❌ 事件回调执行失败:', error);
        }
      });
    }
  }

  /**
   * 发送消息
   */
  send(data) {
    if (this.ws && this.isConnected) {
      try {
        this.ws.send(JSON.stringify(data));
        console.log('📤 发送WebSocket消息:', data);
      } catch (error) {
        console.error('❌ 发送WebSocket消息失败:', error);
      }
    } else {
      console.warn('⚠️ WebSocket未连接，无法发送消息');
    }
  }

  /**
   * 断开连接
   */
  disconnect() {
    if (this.ws) {
      this.ws.close();
      this.ws = null;
      this.isConnected = false;
      console.log('🔌 WebSocket连接已断开');
    }
  }

  /**
   * 获取连接状态
   */
  getConnectionStatus() {
    return {
      isConnected: this.isConnected,
      reconnectAttempts: this.reconnectAttempts,
      recordCount: this.vehicleRecords.length
    };
  }
}

// 创建单例实例
export const websocketService = new WebSocketService();

// 在浏览器控制台中可用的全局方法
if (typeof window !== 'undefined') {
  window.websocketService = websocketService;
  window.testWebSocketConnection = () => websocketService.runDiagnostics();
}

export default websocketService;

