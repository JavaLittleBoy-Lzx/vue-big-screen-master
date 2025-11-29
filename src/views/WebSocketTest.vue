<template>
  <div class="websocket-test">
    <div class="test-container">
      <h2>🔌 WebSocket连接测试</h2>
      
      <div class="status-panel">
        <div class="status-item">
          <span class="label">连接状态:</span>
          <span :class="['status', connectionStatus.isConnected ? 'connected' : 'disconnected']">
            {{ connectionStatus.isConnected ? '✅ 已连接' : '❌ 未连接' }}
          </span>
        </div>
        
        <div class="status-item">
          <span class="label">重连次数:</span>
          <span class="value">{{ connectionStatus.reconnectAttempts }}</span>
        </div>
        
        <div class="status-item">
          <span class="label">记录数量:</span>
          <span class="value">{{ connectionStatus.recordCount }}</span>
        </div>
      </div>
      
      <div class="action-buttons">
        <button @click="connect" :disabled="connectionStatus.isConnected" class="btn btn-primary">
          🔌 连接WebSocket
        </button>
        
        <button @click="disconnect" :disabled="!connectionStatus.isConnected" class="btn btn-secondary">
          🔌 断开连接
        </button>
        
        <button @click="runDiagnostics" class="btn btn-info">
          🔍 运行诊断
        </button>
        
        <button @click="clearRecords" class="btn btn-warning">
          🗑️ 清空记录
        </button>
      </div>
      
      <div class="url-info">
        <h3>🌐 当前WebSocket地址</h3>
        <div class="url-display">{{ currentWebSocketUrl }}</div>
      </div>
      
      <div class="records-panel">
        <h3>📝 车辆进出场记录 ({{ records.length }}条)</h3>
        <div class="records-list">
          <div v-for="record in records" :key="record.id" class="record-item">
            <div class="record-header">
              <span class="plate-number">{{ record.plateNumber }}</span>
              <span :class="['status-badge', record.eventType]">
                {{ record.status }}
              </span>
              <span class="time">{{ formatTime(record.time) }}</span>
            </div>
            <div class="record-details">
              <span class="channel">通道: {{ record.channel }}</span>
              <span class="type">类型: {{ record.type }}</span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="log-panel">
        <h3>📋 连接日志</h3>
        <div class="log-content">
          <div v-for="(log, index) in logs" :key="index" class="log-item">
            {{ log }}
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { websocketService } from '@/services/websocketService';

export default {
  name: 'WebSocketTest',
  data() {
    return {
      connectionStatus: {
        isConnected: false,
        reconnectAttempts: 0,
        recordCount: 0
      },
      records: [],
      logs: [],
      currentWebSocketUrl: ''
    };
  },
  
  mounted() {
    this.updateStatus();
    this.setupEventListeners();
    this.currentWebSocketUrl = this.getWebSocketUrl();
    
    // 添加日志
    this.addLog('🚀 WebSocket测试页面已加载');
  },
  
  methods: {
    getWebSocketUrl() {
      // 获取当前WebSocket URL
      if (typeof window !== 'undefined') {
        const host = window.location.hostname;
        if (host === 'localhost' || host === '127.0.0.1') {
          return 'ws://localhost:8675/websocket/vehicle';
        } else {
          return `ws://${host}:8675/websocket/vehicle`;
        }
      }
      return 'ws://localhost:8675/websocket/vehicle';
    },
    
    setupEventListeners() {
      // 监听连接事件
      websocketService.on('connected', () => {
        this.addLog('✅ WebSocket连接成功');
        this.updateStatus();
      });
      
      // 监听断开事件
      websocketService.on('disconnected', () => {
        this.addLog('❌ WebSocket连接断开');
        this.updateStatus();
      });
      
      // 监听错误事件
      websocketService.on('error', (error) => {
        this.addLog(`❌ WebSocket错误: ${error.message || error}`);
        this.updateStatus();
      });
      
      // 监听车辆进场事件
      websocketService.on('carIn', (record) => {
        this.addLog(`🚗 车辆进场: ${record.plateNumber}`);
        this.updateRecords();
      });
      
      // 监听车辆离场事件
      websocketService.on('carOut', (record) => {
        this.addLog(`🚗 车辆离场: ${record.plateNumber}`);
        this.updateRecords();
      });
      
      // 监听记录添加事件
      websocketService.on('recordAdded', (record) => {
        this.addLog(`📝 新增记录: ${record.plateNumber} - ${record.status}`);
        this.updateRecords();
      });
    },
    
    async connect() {
      this.addLog('🔄 正在连接WebSocket...');
      try {
        await websocketService.connect();
      } catch (error) {
        this.addLog(`❌ 连接失败: ${error.message}`);
      }
    },
    
    disconnect() {
      this.addLog('🔌 正在断开WebSocket连接...');
      websocketService.disconnect();
    },
    
    async runDiagnostics() {
      this.addLog('🔍 开始运行WebSocket诊断...');
      try {
        const report = await websocketService.runDiagnostics();
        this.addLog(`📊 诊断完成: 成功${report.successful}个，失败${report.failed}个`);
        
        if (report.successful > 0) {
          const workingUrl = report.results.find(r => r.success);
          this.addLog(`✅ 推荐使用: ${workingUrl.url}`);
        } else {
          this.addLog('❌ 所有地址都无法连接');
        }
      } catch (error) {
        this.addLog(`❌ 诊断失败: ${error.message}`);
      }
    },
    
    clearRecords() {
      websocketService.clearRecords();
      this.records = [];
      this.addLog('🗑️ 已清空所有记录');
    },
    
    updateStatus() {
      this.connectionStatus = websocketService.getConnectionStatus();
    },
    
    updateRecords() {
      this.records = websocketService.getLatestRecords(20);
      this.updateStatus();
    },
    
    addLog(message) {
      const timestamp = new Date().toLocaleTimeString();
      this.logs.unshift(`[${timestamp}] ${message}`);
      
      // 限制日志数量
      if (this.logs.length > 100) {
        this.logs = this.logs.slice(0, 100);
      }
    },
    
    formatTime(timeString) {
      return new Date(timeString).toLocaleString();
    }
  }
};
</script>

<style scoped>
.websocket-test {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
  font-family: 'Microsoft YaHei', sans-serif;
}

.test-container {
  background: #fff;
  border-radius: 8px;
  padding: 20px;
  box-shadow: 0 2px 10px rgba(0,0,0,0.1);
}

h2 {
  color: #333;
  margin-bottom: 20px;
  text-align: center;
}

.status-panel {
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
  padding: 15px;
  background: #f8f9fa;
  border-radius: 6px;
}

.status-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.label {
  font-size: 12px;
  color: #666;
  margin-bottom: 5px;
}

.status {
  font-weight: bold;
  padding: 4px 8px;
  border-radius: 4px;
}

.status.connected {
  background: #d4edda;
  color: #155724;
}

.status.disconnected {
  background: #f8d7da;
  color: #721c24;
}

.value {
  font-weight: bold;
  color: #333;
}

.action-buttons {
  display: flex;
  gap: 10px;
  margin-bottom: 20px;
  flex-wrap: wrap;
}

.btn {
  padding: 8px 16px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.btn-primary {
  background: #007bff;
  color: white;
}

.btn-secondary {
  background: #6c757d;
  color: white;
}

.btn-info {
  background: #17a2b8;
  color: white;
}

.btn-warning {
  background: #ffc107;
  color: #212529;
}

.url-info {
  margin-bottom: 20px;
  padding: 15px;
  background: #e9ecef;
  border-radius: 6px;
}

.url-display {
  font-family: monospace;
  background: #fff;
  padding: 8px;
  border-radius: 4px;
  border: 1px solid #ddd;
  word-break: break-all;
}

.records-panel, .log-panel {
  margin-bottom: 20px;
}

.records-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid #ddd;
  border-radius: 4px;
}

.record-item {
  padding: 10px;
  border-bottom: 1px solid #eee;
}

.record-item:last-child {
  border-bottom: none;
}

.record-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 5px;
}

.plate-number {
  font-weight: bold;
  font-size: 16px;
  color: #333;
}

.status-badge {
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
}

.status-badge.in {
  background: #d4edda;
  color: #155724;
}

.status-badge.out {
  background: #f8d7da;
  color: #721c24;
}

.time {
  font-size: 12px;
  color: #666;
}

.record-details {
  display: flex;
  gap: 15px;
  font-size: 12px;
  color: #666;
}

.log-content {
  max-height: 200px;
  overflow-y: auto;
  background: #f8f9fa;
  border: 1px solid #ddd;
  border-radius: 4px;
  padding: 10px;
}

.log-item {
  font-family: monospace;
  font-size: 12px;
  margin-bottom: 2px;
  word-break: break-all;
}
</style>