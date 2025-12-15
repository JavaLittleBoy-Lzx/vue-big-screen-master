<template>
  <div class="centre-right1">
    <div class="chart-header">
      <div class="title">🗺️ 区域车位状态分布</div>
      <div class="subtitle">Area Space Distribution</div>
    </div>
    
    <!-- 热力图区域 -->
    <div class="heatmap-container">
      <div class="heatmap-title">车位利用率热力图</div>
      <div class="heatmap-grid">
        <div 
          v-for="(area, index) in spaceData.heatmapData" 
          :key="index"
          class="heatmap-cell"
          :style="{ 
            backgroundColor: getHeatmapColor(area.value),
            gridColumn: area.x + 1,
            gridRow: area.y + 1
          }"
          :title="`${area.name}: ${area.occupied}/${area.total} (${area.value}%)`"
        >
          <div class="cell-content">
            <div class="cell-name">{{area.name}}</div>
            <div class="cell-value">{{area.value}}%</div>
            <div class="cell-count">{{area.occupied}}/{{area.total}}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 整体利用率进度环 -->
    <div class="utilization-ring">
      <div class="ring-title">整体利用率</div>
      <div class="ring-container">
        <div class="ring-progress" :style="{ '--progress': spaceData.summary?.totalUtilization || 78.5 }">
          <div class="ring-text">
            <div class="ring-value">{{spaceData.summary?.totalUtilization || 78.5}}%</div>
            <div class="ring-desc">已占用 {{spaceData.summary?.occupiedSpaces || 785}}/{{spaceData.summary?.totalSpaces || 1000}}</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 区域状态列表 -->
    <div class="area-list">
      <div class="list-title">区域状态</div>
      <div class="area-items">
        <div 
          v-for="area in spaceData.areaData" 
          :key="area.name"
          class="area-item"
          :class="getAreaStatusClass(area.utilization)"
        >
          <div class="area-info">
            <div class="area-name">{{area.name}}</div>
            <div class="area-utilization">{{area.utilization}}%</div>
          </div>
          <div class="area-details">
            <div class="area-occupied">{{area.occupied}}/{{area.total}}</div>
            <div class="area-status">{{getAreaStatusText(area.utilization)}}</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'centreRight1',
  props: {
    spaceData: {
      type: Object,
      default: () => ({
        areaData: [
          { name: 'A1区', total: 120, occupied: 95, available: 25, utilization: 79, status: 'normal' },
          { name: 'A2区', total: 150, occupied: 135, available: 15, utilization: 90, status: 'high' },
          { name: 'A3区', total: 100, occupied: 60, available: 40, utilization: 60, status: 'low' },
          { name: 'A4区', total: 130, occupied: 110, available: 20, utilization: 85, status: 'normal' },
          { name: 'A5区', total: 140, occupied: 140, available: 0, utilization: 100, status: 'critical' }
        ],
        heatmapData: [
          { x: 0, y: 0, value: 79, name: 'A1区', occupied: 95, total: 120 },
          { x: 1, y: 0, value: 90, name: 'A2区', occupied: 135, total: 150 },
          { x: 2, y: 0, value: 60, name: 'A3区', occupied: 60, total: 100 },
          { x: 0, y: 1, value: 85, name: 'A4区', occupied: 110, total: 130 },
          { x: 1, y: 1, value: 100, name: 'A5区', occupied: 140, total: 140 }
        ],
        summary: {
          totalSpaces: 1000,
          occupiedSpaces: 785,
          availableSpaces: 215,
          totalUtilization: 78.5,
          nearFullAreas: ['A2区', 'A5区']
        }
      })
    }
  },
  methods: {
    getHeatmapColor(value) {
      if (value >= 95) return '#ef4444'; // 红色 - 临界
      if (value >= 85) return '#f59e0b'; // 黄色 - 高负荷
      if (value >= 70) return '#10b981'; // 绿色 - 正常
      return '#3b82f6'; // 蓝色 - 低负荷
    },
    
    getAreaStatusClass(utilization) {
      if (utilization >= 95) return 'critical';
      if (utilization >= 85) return 'high';
      if (utilization >= 70) return 'normal';
      return 'low';
    },
    
    getAreaStatusText(utilization) {
      if (utilization >= 95) return '饱和';
      if (utilization >= 85) return '紧张';
      if (utilization >= 70) return '正常';
      return '空闲';
    }
  }
};
</script>

<style lang="scss" scoped>
.centre-right1 {
  width: 100%;
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
}

.chart-header {
  text-align: center;
  margin-bottom: 15px;
  
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

.heatmap-container {
  flex: 1;
  margin-bottom: 15px;
  
  .heatmap-title {
    font-size: 14px;
    color: #3b82f6;
    text-align: center;
    margin-bottom: 10px;
  }
  
  .heatmap-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
    gap: 5px;
    height: 120px;
    
    .heatmap-cell {
      border: 1px solid #1e40af;
      border-radius: 4px;
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      cursor: pointer;
      transition: transform 0.2s;
      
      &:hover {
        transform: scale(1.05);
      }
      
      .cell-content {
        text-align: center;
        
        .cell-name {
          font-size: 10px;
          color: #e2e8f0;
          font-weight: bold;
          margin-bottom: 2px;
        }
        
        .cell-value {
          font-size: 12px;
          color: #ffffff;
          font-weight: bold;
          margin-bottom: 2px;
        }
        
        .cell-count {
          font-size: 8px;
          color: #cbd5e1;
        }
      }
    }
  }
}

.utilization-ring {
  margin-bottom: 15px;
  
  .ring-title {
    font-size: 14px;
    color: #3b82f6;
    text-align: center;
    margin-bottom: 10px;
  }
  
  .ring-container {
    display: flex;
    justify-content: center;
    
    .ring-progress {
      width: 80px;
      height: 80px;
      border-radius: 50%;
      background: conic-gradient(
        #10b981 0deg,
        #10b981 calc(var(--progress) * 3.6deg),
        #1e40af calc(var(--progress) * 3.6deg),
        #1e40af 360deg
      );
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      
      &::before {
        content: '';
        position: absolute;
        width: 60px;
        height: 60px;
        background: #0f1325;
        border-radius: 50%;
      }
      
      .ring-text {
        position: relative;
        z-index: 1;
        text-align: center;
        
        .ring-value {
          font-size: 16px;
          font-weight: bold;
          color: #10b981;
        }
        
        .ring-desc {
          font-size: 8px;
          color: #94a3b8;
        }
      }
    }
  }
}

.area-list {
  .list-title {
    font-size: 14px;
    color: #3b82f6;
    text-align: center;
    margin-bottom: 10px;
  }
  
  .area-items {
    display: flex;
    flex-direction: column;
    gap: 5px;
    max-height: 120px;
    overflow-y: auto;
    
    .area-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 5px 8px;
      border-radius: 4px;
      border: 1px solid #1e40af;
      
      &.low {
        background: rgba(59, 130, 246, 0.1);
        border-color: #3b82f6;
      }
      
      &.normal {
        background: rgba(16, 185, 129, 0.1);
        border-color: #10b981;
      }
      
      &.high {
        background: rgba(245, 158, 11, 0.1);
        border-color: #f59e0b;
      }
      
      &.critical {
        background: rgba(239, 68, 68, 0.1);
        border-color: #ef4444;
        animation: pulse 2s infinite;
      }
      
      .area-info {
        .area-name {
          font-size: 12px;
          color: #e2e8f0;
          font-weight: bold;
        }
        
        .area-utilization {
          font-size: 10px;
          color: #94a3b8;
        }
      }
      
      .area-details {
        text-align: right;
        
        .area-occupied {
          font-size: 10px;
          color: #cbd5e1;
        }
        
        .area-status {
          font-size: 8px;
          color: #64748b;
        }
      }
    }
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>