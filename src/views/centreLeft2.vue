<template>
  <div class="centre-left2">
    <div class="chart-header">
      <div class="title">🚀 车辆流动轨迹</div>
      <div class="subtitle">Vehicle Flow Trajectory</div>
    </div>
    
    <!-- 转化漏斗图 -->
    <div class="funnel-container">
      <div class="funnel-title">停车流程转化分析</div>
      <div class="funnel-chart">
        <div 
          v-for="(item, index) in trajectoryData.funnelData" 
          :key="index"
          class="funnel-item"
          :style="{ width: getFunnelWidth(item.rate) }"
        >
          <div class="funnel-bar">
            <div class="funnel-label">{{item.name}}</div>
            <div class="funnel-value">{{item.value}}辆</div>
            <div class="funnel-rate">{{item.rate}}%</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 实时流动信息 -->
    <div class="flow-info">
      <div class="info-item">
        <div class="info-label">当前进场率</div>
        <div class="info-value">{{trajectoryData.realTimeFlow?.entryRate || '156辆/h'}}</div>
      </div>
      <div class="info-item">
        <div class="info-label">热门路径</div>
        <div class="info-value">{{trajectoryData.realTimeFlow?.popularPath || '入口A→区域1→出口A'}}</div>
      </div>
      <div class="info-item">
        <div class="info-label">拥堵提醒</div>
        <div class="info-value alert">{{trajectoryData.realTimeFlow?.congestionAlert || '区域1出口轻微拥堵'}}</div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'centreLeft2',
  props: {
    trajectoryData: {
      type: Object,
      default: () => ({
        funnelData: [
          { name: '预约进场', value: 1000, rate: 100 },
          { name: '到达停车场', value: 950, rate: 95 },
          { name: '成功进场', value: 920, rate: 92 },
          { name: '正常停车', value: 890, rate: 89 },
          { name: '正常离场', value: 850, rate: 85 },
          { name: '完成支付', value: 820, rate: 82 }
        ],
        realTimeFlow: {
          entryRate: '156辆/h',
          popularPath: '入口A→区域1→出口A',
          congestionAlert: '区域1出口轻微拥堵'
        }
      })
    }
  },
  methods: {
    getFunnelWidth(rate) {
      return `${rate}%`;
    }
  }
};
</script>

<style lang="scss" scoped>
.centre-left2 {
  width: 100%;
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.chart-header {
  text-align: center;
  margin-bottom: 20px;
  
  .title {
    font-size: 18px;
    font-weight: bold;
    color: #3b82f6;
    margin-bottom: 5px;
  }
  
  .subtitle {
    font-size: 12px;
    color: #94a3b8;
  }
}

.funnel-container {
  flex: 1;
  margin-bottom: 20px;
  
  .funnel-title {
    font-size: 14px;
    color: #3b82f6;
    text-align: center;
    margin-bottom: 15px;
  }
  
  .funnel-chart {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 8px;
  }
  
  .funnel-item {
    transition: width 0.5s ease;
    
    .funnel-bar {
      background: linear-gradient(90deg, #3b82f6, #1d4ed8);
      border: 1px solid #1e40af;
      border-radius: 4px;
      padding: 8px 12px;
      display: flex;
      justify-content: space-between;
      align-items: center;
      min-width: 200px;
      
      .funnel-label {
        font-size: 12px;
        color: #e2e8f0;
        flex: 1;
      }
      
      .funnel-value {
        font-size: 14px;
        font-weight: bold;
        color: #10b981;
        margin: 0 10px;
      }
      
      .funnel-rate {
        font-size: 12px;
        color: #f59e0b;
        font-weight: bold;
      }
    }
  }
}

.flow-info {
  display: flex;
  flex-direction: column;
  gap: 10px;
  
  .info-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 8px 12px;
    background: rgba(11, 19, 42, 0.6);
    border: 1px solid #1e40af;
    border-radius: 6px;
    
    .info-label {
      font-size: 12px;
      color: #64748b;
    }
    
    .info-value {
      font-size: 12px;
      color: #e2e8f0;
      font-weight: bold;
      
      &.alert {
        color: #f59e0b;
        animation: pulse 2s infinite;
      }
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>