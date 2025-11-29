<template>
  <div class="parking-duration">
    <div class="chart-header">
      <div class="title">⏱️ 停车时长分析</div>
      <div class="subtitle">Parking Duration Analysis</div>
    </div>
    
    <!-- 饼状图容器 -->
    <div class="pie-chart-container">
      <div class="pie-chart">
        <svg :width="chartSize" :height="chartSize" class="pie-svg">
          <g :transform="`translate(${chartSize/2}, ${chartSize/2})`">
            <path
              v-for="(segment, index) in pieSegments"
              :key="index"
              :d="segment.path"
              :fill="segment.color"
              stroke="#0f1325"
              stroke-width="2"
              class="pie-segment"
              :style="{ animationDelay: `${index * 0.1}s` }"
            />
          </g>
        </svg>
        
        <!-- 中心文字 -->
        <div class="pie-center">
          <div class="center-value">{{totalCount}}</div>
          <div class="center-label">总停车次数</div>
        </div>
      </div>
    </div>

    <!-- 图例 -->
    <div class="legend-container">
      <div class="legend-title">时长分布</div>
      <div class="legend-items">
        <div
          v-for="(item, index) in processedDurationData"
          :key="index"
          class="legend-item"
        >
          <div 
            class="legend-color" 
            :style="{ backgroundColor: item.color }"
          ></div>
          <div class="legend-info">
            <div class="legend-name">{{item.name}}</div>
            <div class="legend-stats">
              <span class="legend-count">{{item.value}}次</span>
              <span class="legend-percentage">{{item.percentage}}%</span>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats-container">
      <div class="stats-title">关键指标</div>
      <div class="stats-grid">
        <div class="stat-item">
          <div class="stat-label">平均时长</div>
          <div class="stat-value">{{averageDuration}}h</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">最长时长</div>
          <div class="stat-value">{{maxDuration}}h</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">超时车辆</div>
          <div class="stat-value alert">{{overtimeCount}}辆</div>
        </div>
        <div class="stat-item">
          <div class="stat-label">周转率</div>
          <div class="stat-value">{{turnoverRate}}%</div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'parkingDuration',
  props: {
    durationData: {
      type: [Array, Object],
      default: () => [
        { name: '短停(0-1h)', value: 320, rate: 32, color: '#3b82f6' },
        { name: '中停(1-4h)', value: 280, rate: 28, color: '#10b981' },
        { name: '长停(4-8h)', value: 200, rate: 20, color: '#f59e0b' },
        { name: '超长停(>8h)', value: 80, rate: 8, color: '#ef4444' }
      ]
    }
  },
  data() {
    return {
      chartSize: 150
    }
  },
  computed: {
    // 处理数据，确保是数组格式
    processedDurationData() {
      let data = [];
      if (Array.isArray(this.durationData)) {
        data = this.durationData;
      } else if (this.durationData && this.durationData.distribution) {
        data = this.durationData.distribution;
      }
      
      // 为数据项添加颜色和百分比
      const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444'];
      return data.map((item, index) => ({
        ...item,
        color: item.color || colors[index % colors.length],
        percentage: item.rate || item.percentage || 0
      }));
    },
    
    totalCount() {
      return this.processedDurationData.reduce((sum, item) => sum + item.value, 0);
    },
    
    pieSegments() {
      const radius = this.chartSize / 2 - 10;
      let currentAngle = 0;
      
      return this.processedDurationData.map(item => {
        const angle = (item.percentage / 100) * 2 * Math.PI;
        const startAngle = currentAngle;
        const endAngle = currentAngle + angle;
        
        const x1 = Math.cos(startAngle) * radius;
        const y1 = Math.sin(startAngle) * radius;
        const x2 = Math.cos(endAngle) * radius;
        const y2 = Math.sin(endAngle) * radius;
        
        const largeArcFlag = angle > Math.PI ? 1 : 0;
        
        const path = [
          `M 0 0`,
          `L ${x1} ${y1}`,
          `A ${radius} ${radius} 0 ${largeArcFlag} 1 ${x2} ${y2}`,
          'Z'
        ].join(' ');
        
        currentAngle += angle;
        
        return {
          path,
          color: item.color
        };
      });
    },
    
    averageDuration() {
      const weightedSum = this.processedDurationData.reduce((sum, item) => {
        const midPoint = this.getDurationMidPoint(item.name);
        return sum + (item.value * midPoint);
      }, 0);
      return (weightedSum / this.totalCount).toFixed(1);
    },
    
    maxDuration() {
      return this.processedDurationData.reduce((max, item) => {
        const maxPoint = this.getDurationMaxPoint(item.name);
        return Math.max(max, maxPoint);
      }, 0);
    },
    
    overtimeCount() {
      return this.processedDurationData
        .filter(item => item.name.includes('超长停'))
        .reduce((sum, item) => sum + item.value, 0);
    },
    
    turnoverRate() {
      const shortTerm = this.processedDurationData
        .filter(item => !item.name.includes('超长停'))
        .reduce((sum, item) => sum + item.value, 0);
      return ((shortTerm / this.totalCount) * 100).toFixed(1);
    }
  },
  
  methods: {
    getDurationMidPoint(name) {
      if (name.includes('短停(0-1h)')) return 0.5;
      if (name.includes('中停(1-4h)')) return 2.5;
      if (name.includes('长停(4-8h)')) return 6;
      if (name.includes('超长停(>8h)')) return 12;
      return 0;
    },
    
    getDurationMaxPoint(name) {
      if (name.includes('短停(0-1h)')) return 1;
      if (name.includes('中停(1-4h)')) return 4;
      if (name.includes('长停(4-8h)')) return 8;
      if (name.includes('超长停(>8h)')) return 24;
      return 0;
    }
  }
};
</script>

<style lang="scss" scoped>
.parking-duration {
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

.pie-chart-container {
  flex: 0 0 auto;
  display: flex;
  justify-content: center;
  align-items: center;
  margin-bottom: 15px;
  height: 180px;
  
  .pie-chart {
    position: relative;
    
    .pie-svg {
      animation: rotate 20s linear infinite;
    }
    
    .pie-segment {
      animation: fadeInScale 0.8s ease-out forwards;
      opacity: 0;
      transform-origin: center;
    }
    
    .pie-center {
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      text-align: center;
      
      .center-value {
        font-size: 24px;
        font-weight: bold;
        color: #3b82f6;
        margin-bottom: 5px;
      }
      
      .center-label {
        font-size: 12px;
        color: #94a3b8;
      }
    }
  }
}

.legend-container {
  margin-bottom: 15px;
  
  .legend-title {
    font-size: 14px;
    color: #3b82f6;
    text-align: center;
    margin-bottom: 15px;
  }
  
  .legend-items {
    display: flex;
    flex-direction: column;
    gap: 6px;
    max-height: 80px;
    overflow-y: auto;
    
    .legend-item {
      display: flex;
      align-items: center;
      gap: 10px;
      padding: 6px 10px;
      background: rgba(11, 19, 42, 0.6);
      border: 1px solid #1e40af;
      border-radius: 6px;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(59, 130, 246, 0.1);
        border-color: #3b82f6;
        transform: translateX(5px);
      }
      
      .legend-color {
        width: 12px;
        height: 12px;
        border-radius: 50%;
        flex-shrink: 0;
      }
      
      .legend-info {
        flex: 1;
        
        .legend-name {
          font-size: 12px;
          color: #e2e8f0;
          font-weight: 500;
          margin-bottom: 2px;
        }
        
        .legend-stats {
          display: flex;
          justify-content: space-between;
          font-size: 10px;
          
          .legend-count {
            color: #10b981;
            font-weight: bold;
          }
          
          .legend-percentage {
            color: #f59e0b;
            font-weight: bold;
          }
        }
      }
    }
  }
}

.stats-container {
  .stats-title {
    font-size: 14px;
    color: #3b82f6;
    text-align: center;
    margin-bottom: 15px;
  }
  
  .stats-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    
    .stat-item {
      padding: 8px 10px;
      background: rgba(11, 19, 42, 0.6);
      border: 1px solid #1e40af;
      border-radius: 6px;
      text-align: center;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(59, 130, 246, 0.1);
        border-color: #3b82f6;
        transform: translateY(-2px);
      }
      
      .stat-label {
        font-size: 10px;
        color: #94a3b8;
        margin-bottom: 4px;
      }
      
      .stat-value {
        font-size: 14px;
        font-weight: bold;
        color: #3b82f6;
        
        &.alert {
          color: #ef4444;
          animation: pulse 2s infinite;
        }
      }
    }
  }
}

@keyframes rotate {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

@keyframes fadeInScale {
  from {
    opacity: 0;
    transform: scale(0.8);
  }
  to {
    opacity: 1;
    transform: scale(1);
  }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.7; }
}
</style>
