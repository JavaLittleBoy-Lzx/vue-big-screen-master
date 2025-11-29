<template>
  <div class="centre-left1">
    <div class="chart-header">
      <div class="title">🚗 车流量实时监控</div>
    </div>
    <!-- 车辆信息表格 -->
    <div class="vehicle-table-container">
      <div class="vehicle-table">
        <div class="table-header">
          <div class="header-cell">车牌号码</div>
          <div class="header-cell">通道名称</div>
          <div class="header-cell">VIP类型</div>
          <div class="header-cell">时间</div>
        </div>
        <div 
          class="table-body" 
          ref="tableBody"
          @mouseenter="stopAutoScroll"
          @mouseleave="startAutoScroll"
        >
          <div class="table-content">
            <div 
              v-for="(vehicle, index) in vehicleRecords" 
              :key="index"
              class="table-row"
              :class="{ 'new-record': vehicle.isNew }"
            >
              <div class="table-cell license">{{ vehicle.license }}</div>
              <div class="table-cell channel" :class="vehicle.channelType">{{ vehicle.channel }}</div>
              <div class="table-cell vip-type">{{ vehicle.vipName || '普通用户' }}</div>
              <div class="table-cell time" :class="vehicle.action === '进场' ? 'entry' : 'exit'">{{ vehicle.time }}</div>
            </div>
            <!-- 复制一份用于无缝循环滚动 -->
            <div 
              v-for="(vehicle, index) in vehicleRecords" 
              :key="'dup-' + index"
              class="table-row"
            >
              <div class="table-cell license">{{ vehicle.license }}</div>
              <div class="table-cell channel" :class="vehicle.channelType">{{ vehicle.channel }}</div>
              <div class="table-cell vip-type">{{ vehicle.vipName || '普通用户' }}</div>
              <div class="table-cell time" :class="vehicle.action === '进场' ? 'entry' : 'exit'">{{ vehicle.time }}</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { vehicleDataService } from '@/services/vehicleDataService';

export default {
  name: 'centreLeft1',
  props: {
    realTimeData: {
      type: Object,
      default: () => ({
        realtimeEntry: 156,
        realtimeExit: 142,
        netFlow: 14,
        utilization: 78.5,
        prediction: '+28'
      })
    }
  },
  computed: {
    realtimeData() {
      return { ...this.defaultData, ...this.realTimeData };
    },
    
    netFlowText() {
      const flow = this.realtimeData.netFlow;
      return flow > 0 ? `+${flow}` : `${flow}`;
    },
    
    netFlowClass() {
      const flow = this.realtimeData.netFlow;
      if (flow > 20) return 'danger';
      if (flow > 10) return 'warning';
      return 'normal';
    },
    
    waterLevelStyle() {
      const utilization = this.realtimeData.utilization;
      return {
        height: `${utilization}%`,
        background: this.getUtilizationColor(utilization)
      };
    },
    
    entryTrendClass() {
      return this.entryTrend > 0 ? 'up' : 'down';
    },
    
    entryTrendIcon() {
      return this.entryTrend > 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
    },
    
    entryTrendText() {
      return `${Math.abs(this.entryTrend)}%`;
    },
    
    exitTrendClass() {
      return this.exitTrend > 0 ? 'up' : 'down';
    },
    
    exitTrendIcon() {
      return this.exitTrend > 0 ? 'fas fa-arrow-up' : 'fas fa-arrow-down';
    },
    
    exitTrendText() {
      return `${Math.abs(this.exitTrend)}%`;
    }
  },
  data() {
    return {
      defaultData: {
        realtimeEntry: 0,
        realtimeExit: 0,
        netFlow: 0,
        utilization: 0,
        prediction: '+0'
      },
      flowStream: [],
      entryTrend: 5.2,
      exitTrend: -2.1,
      streamTimer: null,
      vehicleRecords: [],
      vehicleTimer: null,
      autoScrollTimer: null,
      contentHeight: 0,
      lastQueryTime: null,  // 记录上次查询的时间，用于增量查询
      pollingInterval: 5000  // 轮询间隔（毫秒），默认5秒
    };
  },
  async mounted() {
    this.initFlowStream();
    this.startStreamUpdate();
    await this.initVehicleRecords();
    this.startVehiclePolling();  // 改用轮询方式
    this.$nextTick(() => {
      this.measureContentHeight();
      this.startAutoScroll();
    });
  },
  beforeDestroy() {
    if (this.streamTimer) {
      clearInterval(this.streamTimer);
    }
    if (this.vehicleTimer) {
      clearInterval(this.vehicleTimer);
    }
    if (this.autoScrollTimer) {
      clearInterval(this.autoScrollTimer);
    }
  },
  methods: {
    measureContentHeight() {
      const body = this.$refs.tableBody;
      if (!body) return;
      // 内容高度为单份内容的高度（table-content 的一半）
      const content = body.querySelector('.table-content');
      if (content) {
        // 单份高度等于总高度的一半（因为我们复制了一份）
        this.contentHeight = content.scrollHeight / 2;
      }
    },
    getUtilizationColor(rate) {
      if (rate > 90) return 'linear-gradient(to top, #ef4444, #fca5a5)';
      if (rate > 70) return 'linear-gradient(to top, #f59e0b, #fcd34d)';
      return 'linear-gradient(to top, #10b981, #6ee7b7)';
    },
    
    initFlowStream() {
      // 初始化数据流
      this.flowStream = [];
      for (let i = 0; i < 8; i++) {
        this.addStreamItem();
      }
    },
    
    addStreamItem() {
      const now = new Date();
      const time = `${now.getHours().toString().padStart(2, '0')}:${now.getMinutes().toString().padStart(2, '0')}:${now.getSeconds().toString().padStart(2, '0')}`;
      
      const types = ['entry', 'exit', 'net'];
      const type = types[Math.floor(Math.random() * types.length)];
      
      let label, value;
      switch(type) {
        case 'entry':
          label = '车辆进场';
          value = `${Math.floor(Math.random() * 20) + 10}辆`;
          break;
        case 'exit':
          label = '车辆离场';
          value = `${Math.floor(Math.random() * 18) + 8}辆`;
          break;
        case 'net': {
          label = '净流量';
          const net = Math.floor(Math.random() * 10) - 5;
          value = net > 0 ? `+${net}辆` : `${net}辆`;
          break;
        }
      }
      
      this.flowStream.unshift({
        time,
        type,
        label,
        value
      });
      
      // 保持最多8条记录
      if (this.flowStream.length > 8) {
        this.flowStream.pop();
      }
    },
    
    startStreamUpdate() {
      this.streamTimer = setInterval(() => {
        this.addStreamItem();
      }, 2000);
    },
    
    async initVehicleRecords() {
      try {
        console.log('🚗 初始化车辆记录...');
        // 从后端API获取最新记录
        const records = await vehicleDataService.getVehicleRecords(50);  // 初始加载50条
        console.log("📊 初始记录数据：", records);
        
        if (records && records.length > 0) {
          // 转换数据格式以适配表格显示
          this.vehicleRecords = records.map(record => ({
            license: record.plateNumber,
            channel: record.channel,
            vipName: record.vipName || '普通用户',
            channelType: record.eventType === 'in' ? 'entry' : 'exit',
            action: record.status === '进场' ? '进场' : '离场',
            time: this.formatTime(record.time),
            isNew: false
          }));
          
          // 记录最后查询时间为最新记录的时间
          const latestRecord = records[0];
          if (latestRecord.createTime) {
            this.lastQueryTime = latestRecord.createTime;
            console.log(`📅 初始化lastQueryTime: ${this.lastQueryTime}`);
          }
          
          console.log(`✅ 车辆记录初始化完成: ${this.vehicleRecords.length} 条`);
        } else {
          console.warn('⚠️ 初始化时未获取到记录');
          this.vehicleRecords = [];
        }
      } catch (error) {
        console.error('❌ 初始化车辆记录失败:', error);
        this.vehicleRecords = [];
      }
    },
    
    /**
     * 添加车辆记录（已弃用）
     * @deprecated 现在使用轮询方式从后端获取真实数据，通过 addPolledRecord() 方法处理
     */
    addVehicleRecord() {
      console.warn('⚠️ addVehicleRecord 方法已弃用，请使用 addPolledRecord() 方法');
    },
    
    /**
     * 开始车辆记录轮询
     */
    startVehiclePolling() {
      console.log(`🔄 [轮询] 开始轮询车辆记录，间隔: ${this.pollingInterval}ms`);
      
      // 设置定时器，定期查询最新记录
      this.vehicleTimer = setInterval(async () => {
        await this.pollLatestRecords();
      }, this.pollingInterval);
    },

    /**
     * 轮询查询最新记录
     */
    async pollLatestRecords() {
      try {
        // 使用增量查询，只获取上次查询时间之后的新记录
        const newRecords = await vehicleDataService.getIncrementalVehicleRecords(
          this.lastQueryTime,
          20  // 每次最多查询20条新记录
        );

        if (newRecords && newRecords.length > 0) {
          console.log(`✅ [轮询] 查询到 ${newRecords.length} 条新记录`);
          
          // 处理新记录
          newRecords.forEach(record => {
            this.addPolledRecord(record);
          });

          // 更新最后查询时间为最新记录的时间
          const latestRecord = newRecords[0];
          if (latestRecord.createTime) {
            this.lastQueryTime = latestRecord.createTime;
            console.log(`📅 [轮询] 更新lastQueryTime: ${this.lastQueryTime}`);
          }
        }
      } catch (error) {
        console.error('❌ [轮询] 查询新记录失败:', error);
      }
    },

    /**
     * 添加轮询获取到的记录
     */
    addPolledRecord(record) {
      const formattedRecord = {
        license: record.plateNumber,
        channel: record.channel,
        vipName: record.vipName || '普通用户',
        channelType: record.eventType === 'in' ? 'entry' : 'exit',
        action: record.status === '进场' ? '进场' : '离场',
        time: this.formatTime(record.time),
        isNew: true  // 标记为新记录，会有高亮效果
      };
      
      // 添加到记录列表开头
      this.vehicleRecords.unshift(formattedRecord);
      
      // 保持最多50条记录
      if (this.vehicleRecords.length > 50) {
        this.vehicleRecords = this.vehicleRecords.slice(0, 50);
      }
      
      // 新数据插入后，保持无缝滚动
      this.$nextTick(() => {
        const body = this.$refs.tableBody;
        if (body && this.contentHeight > 0) {
          this.measureContentHeight();
        }
      });

      // 3秒后移除新记录标记
      setTimeout(() => {
        formattedRecord.isNew = false;
      }, 3000);
    },

    // 开启列表自动向下无缝滚动（到底后无感回绕）
    startAutoScroll() {
      const body = this.$refs.tableBody;
      if (!body || this.autoScrollTimer) return;
      const stepPx = 1; // 每次滚动的像素
      const intervalMs = 40; // 滚动频率
      this.autoScrollTimer = setInterval(() => {
        if (!body) return;
        body.scrollTop += stepPx;
        // 当滚动位置超过单份内容高度时，减去单份高度，实现无缝衔接
        if (this.contentHeight > 0 && body.scrollTop >= this.contentHeight) {
          body.scrollTop -= this.contentHeight;
        }
      }, intervalMs);
    },

    // 停止自动滚动（悬停时暂停）
    stopAutoScroll() {
      if (this.autoScrollTimer) {
        clearInterval(this.autoScrollTimer);
        this.autoScrollTimer = null;
      }
    },

    // WebSocket方法已移除，改用轮询方式获取最新记录
    // 参见 startVehiclePolling() 和 pollLatestRecords() 方法

    // 格式化时间
    formatTime(timeString) {
      if (!timeString) return '--:--:--';
      
      const date = new Date(timeString);
      if (isNaN(date.getTime())) return '--:--:--';
      
      // 返回完整的日期时间格式 YYYY-MM-DD HH:MM:SS
      const year = date.getFullYear();
      const month = (date.getMonth() + 1).toString().padStart(2, '0');
      const day = date.getDate().toString().padStart(2, '0');
      const hours = date.getHours().toString().padStart(2, '0');
      const minutes = date.getMinutes().toString().padStart(2, '0');
      const seconds = date.getSeconds().toString().padStart(2, '0');
      
      return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
    }
  }
};
</script>

<style lang="scss" scoped>
.centre-left1 {
  width: 100%;
  height: 100%;
  padding: 15px;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.chart-header {
  text-align: center;
  margin-bottom: 15px;
  
  .title {
    font-size: 16px;
    font-weight: bold;
    color: #3b82f6;
    margin-bottom: 5px;
  }
  
  .subtitle {
    font-size: 11px;
    color: #94a3b8;
  }
}

// 实时数据流样式
.flow-stream {
  margin-bottom: 15px;
  
  .stream-title {
    font-size: 12px;
    color: #3b82f6;
    margin-bottom: 8px;
    text-align: center;
  }
  
  .stream-container {
    height: 120px;
    overflow-y: auto;
    background: rgba(11, 19, 42, 0.6);
    border: 1px solid #1e40af;
    border-radius: 6px;
    padding: 8px;
    
    &::-webkit-scrollbar {
      width: 4px;
    }
    
    &::-webkit-scrollbar-track {
      background: rgba(0,0,0,0.1);
    }
    
    &::-webkit-scrollbar-thumb {
      background: #3b82f6;
      border-radius: 2px;
    }
  }
  
  .stream-item {
    display: flex;
    align-items: center;
    padding: 4px 8px;
    margin-bottom: 4px;
    border-radius: 4px;
    animation: slideIn 0.5s ease-out;
    
    &.entry {
      background: rgba(16, 185, 129, 0.1);
      border-left: 3px solid #10b981;
    }
    
    &.exit {
      background: rgba(245, 158, 11, 0.1);
      border-left: 3px solid #f59e0b;
    }
    
    &.net {
      background: rgba(139, 92, 246, 0.1);
      border-left: 3px solid #8b5cf6;
    }
    
    .stream-time {
      font-size: 10px;
      color: #64748b;
      margin-right: 8px;
      min-width: 50px;
    }
    
    .stream-data {
      flex: 1;
      display: flex;
      justify-content: space-between;
      align-items: center;
      
      .stream-label {
        font-size: 11px;
        color: #cbd5e1;
      }
      
      .stream-value {
        font-size: 11px;
        font-weight: bold;
        color: #fff;
      }
    }
  }
}

// 实时数据卡片样式
.realtime-cards {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.card-row {
  display: flex;
  gap: 8px;
}

.data-card {
  flex: 1;
  background: rgba(11, 19, 42, 0.8);
  border: 1px solid #1e40af;
  border-radius: 8px;
  padding: 12px;
  position: relative;
  transition: all 0.3s ease;
  
  &:hover {
    transform: translateY(-2px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
  }
  
  .card-icon {
    font-size: 16px;
    margin-bottom: 8px;
  }
  
  .card-content {
    .card-label {
      font-size: 10px;
      color: #64748b;
      margin-bottom: 4px;
    }
    
    .card-value {
      font-size: 18px;
      font-weight: bold;
      margin-bottom: 2px;
      
      &.normal {
        color: #10b981;
      }
      
      &.warning {
        color: #f59e0b;
      }
      
      &.danger {
        color: #ef4444;
        animation: pulse 1s infinite;
      }
    }
    
    .card-unit {
      font-size: 9px;
      color: #94a3b8;
    }
  }
  
  .card-trend {
    position: absolute;
    top: 8px;
    right: 8px;
    font-size: 10px;
    padding: 2px 6px;
    border-radius: 4px;
    
    &.up {
      background: rgba(16, 185, 129, 0.2);
      color: #10b981;
    }
    
    &.down {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }
    
    i {
      margin-right: 2px;
    }
  }
  
  &.entry .card-value {
    color: #10b981;
  }
  
  &.exit .card-value {
    color: #f59e0b;
  }
  
  &.net .card-value {
    color: #8b5cf6;
  }
  
  &.prediction .card-value {
    color: #f59e0b;
  }
}

.utilization-container {
  margin-top: 10px;
  
  .utilization-title {
    font-size: 12px;
    color: #3b82f6;
    text-align: center;
    margin-bottom: 8px;
  }
}

.water-container {
  position: relative;
  width: 180px;
  height: 80px;
  margin: 0 auto;
  border: 2px solid #1e40af;
  border-radius: 6px;
  background: rgba(11, 19, 42, 0.8);
  overflow: hidden;
}

.water-level {
  position: absolute;
  bottom: 0;
  left: 0;
  right: 0;
  transition: height 1s ease-in-out;
  
  .water-wave {
    position: absolute;
    top: -8px;
    left: -100%;
    width: 300%;
    height: 16px;
    background: repeating-linear-gradient(
      90deg,
      transparent,
      transparent 8px,
      rgba(255,255,255,0.1) 8px,
      rgba(255,255,255,0.1) 16px
    );
    animation: wave 3s linear infinite;
  }
  
  .utilization-text {
    position: absolute;
    top: 50%;
    left: 50%;
    transform: translate(-50%, -50%);
    font-size: 14px;
    font-weight: bold;
    color: white;
    text-shadow: 2px 2px 4px rgba(0,0,0,0.5);
  }
}

@keyframes slideIn {
  from {
    opacity: 0;
    transform: translateX(-20px);
  }
  to {
    opacity: 1;
    transform: translateX(0);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}

@keyframes wave {
  0% { transform: translateX(0); }
  100% { transform: translateX(33.33%);   }
}

.vehicle-table-container {
  margin-top: -2px;
  flex: 1;
  display: flex;
  flex-direction: column;
  height: auto;
  .table-title {
    font-size: 14px;
    color: #3b82f6;
    margin-bottom: 10px;
    text-align: center;
    font-weight: bold;
  }
  
  .vehicle-table {
    margin-top: -5px;
    margin-left: -7px;
    width: 459px;
    height: 220px;
    display: flex;
    flex-direction: column;
    background: rgba(11, 19, 42, 0.6);
    border-radius: 8px;
    overflow: hidden;
    border: 1px solid #1e40af;
    
    .table-header {
      display: flex;
      background: rgba(59, 130, 246, 0.2);
      border-bottom: 1px solid #3b82f6;
      
      .header-cell {
        flex: 1;
        padding: 10px 8px;
        font-size: 14px;
        color: #ffffff;
        text-align: center;
        font-weight: bold;
        border-right: 1px solid rgba(59, 130, 246, 0.3);
        
        &:last-child {
          border-right: none;
        }
      }
    }
    
    .table-body {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow-y: auto;
      overflow-x: hidden;
      scrollbar-gutter: stable;
      // 隐藏滚动条（保留滚动功能）
      -ms-overflow-style: none; // IE/Edge
      scrollbar-width: none; // Firefox
      &::-webkit-scrollbar { // Chrome/Safari
        width: 0;
        height: 0;
      }
      
      .table-row {
        display: flex;
        border-bottom: 1px solid rgba(100, 116, 139, 0.2);
        transition: all 0.3s ease;
        
        &:hover {
          background: rgba(59, 130, 246, 0.1);
        }
        
        &.new-record {
          background: rgba(16, 185, 129, 0.1);
          animation: highlight 2s ease-out;
        }
        
        .table-cell {
          flex: 1;
          padding: 8px 6px;
          font-size: 16px;
          color: #e2e8f0;
          text-align: center;
          border-right: 1px solid rgba(100, 116, 139, 0.1);
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
          
          &:last-child {
            border-right: none;
          }
          
          &.license {
            color: #fbbf24;
            font-weight: bold;
          }
          
          &.channel {
            &.entry { color: #10b981; }
            &.exit { color: #f59e0b; }
          }
          
          &.vip-type {
            color: #8b5cf6;
            font-weight: 500;
          }
          
          &.time {
            &.entry {
              color: #10b981;
            }
            &.exit {
              color: #f59e0b;
            }
          }
        }
        
        .status .badge {
          display: inline-block;
          padding: 3px 8px;
          border-radius: 12px;
          font-size: 12px;
          font-weight: bold;
        }
        .status .badge.entry {
          background: rgba(16,185,129,0.15);
          color: #10b981;
          border: 1px solid rgba(16,185,129,0.4);
        }
        .status .badge.exit {
          background: rgba(245,158,11,0.15);
          color: #f59e0b;
          border: 1px solid rgba(245,158,11,0.4);
        }
      }
    }
  }
}

@keyframes highlight {
  0% {
    background: rgba(16, 185, 129, 0.3);
  }
  100% {
    background: rgba(16, 185, 129, 0.1);
  }
}
</style>