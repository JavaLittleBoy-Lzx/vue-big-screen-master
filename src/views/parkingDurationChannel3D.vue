<template>
  <div class="parking-duration-channel-3d">
    <!-- 标题区域 -->
    <div class="chart-header">
      <div class="title">⏱️🚪 停车时长与通道分析</div>
      <div class="subtitle">3D Parking Duration & Channel Analysis</div>
    </div>

    <!-- 主要内容区域 -->
    <div class="main-content">
      <!-- 左侧：3D热力图 -->
      <div class="heatmap-container">
        <div class="heatmap-title">时空热力分布</div>
        <div ref="heatmapChart" class="heatmap-chart"></div>
        
        <!-- 热力图图例 -->
        <div class="heatmap-legend">
          <div class="legend-title">停车时长分布</div>
          <div class="legend-items">
            <div v-for="(item, index) in durationLegend" :key="index" class="legend-item">
              <div class="legend-color" :style="{ backgroundColor: item.color }"></div>
              <span class="legend-text">{{ item.name }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- 右侧：飞线图和KPI -->
      <div class="right-panel">
        <!-- 飞线图：通道流动 -->
        <div class="flyline-container">
          <div class="flyline-title">通道流动轨迹</div>
          <div ref="flylineChart" class="flyline-chart"></div>
        </div>

        <!-- KPI指标 -->
        <div class="kpi-container">
          <div class="kpi-title">实时指标</div>
          <div class="kpi-grid">
            <div class="kpi-item">
              <div class="kpi-label">总车流量</div>
              <div class="kpi-value">{{ totalFlow }}</div>
            </div>
            <div class="kpi-item">
              <div class="kpi-label">平均停车时长</div>
              <div class="kpi-value">{{ averageDuration }}h</div>
            </div>
            <div class="kpi-item">
              <div class="kpi-label">通道效率</div>
              <div class="kpi-value">{{ channelEfficiency }}%</div>
            </div>
            <div class="kpi-item">
              <div class="kpi-label">利用率峰值</div>
              <div class="kpi-value">{{ peakUtilization }}%</div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 底部：时间轴控制 -->
    <div class="time-control">
      <div class="time-title">时间轴控制</div>
      <div class="time-slider">
        <input 
          type="range" 
          v-model="currentHour" 
          min="0" 
          max="23" 
          class="slider"
          @input="updateHeatmapData"
        />
        <div class="time-labels">
          <span v-for="hour in timeLabels" :key="hour" class="time-label">{{ hour }}:00</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'ParkingDurationChannel3D',
  data() {
    return {
      currentHour: 12,
      heatmapChart: null,
      flylineChart: null,
      
      // 热力图数据
      heatmapData: [],
      
      // 飞线图数据
      flylineData: {
        points: [
          { coordinate: [0.2, 0.3], text: '入口1' },
          { coordinate: [0.8, 0.3], text: '入口2' },
          { coordinate: [0.2, 0.7], text: '出口1' },
          { coordinate: [0.8, 0.7], text: '出口2' },
          { coordinate: [0.5, 0.5], text: '中央区' }
        ],
        lines: [
          { source: '入口1', target: '中央区' },
          { source: '入口2', target: '中央区' },
          { source: '中央区', target: '出口1' },
          { source: '中央区', target: '出口2' }
        ]
      },
      
      // 时长分布图例
      durationLegend: [
        { name: '短停(0-1h)', color: '#00bcd4' },
        { name: '中停(1-4h)', color: '#3f51b5' },
        { name: '长停(4-8h)', color: '#8bc34a' },
        { name: '超长停(>8h)', color: '#ff9800' }
      ],
      
      // 时间标签
      timeLabels: [0, 6, 12, 18, 23]
    }
  },
  
  computed: {
    totalFlow() {
      return this.heatmapData.reduce((sum, item) => sum + item[2], 0)
    },
    
    averageDuration() {
      const weightedSum = this.heatmapData.reduce((sum, item) => {
        const duration = this.getDurationFromHour(item[1])
        return sum + (item[2] * duration)
      }, 0)
      return (weightedSum / this.totalFlow).toFixed(1)
    },
    
    channelEfficiency() {
      const totalCapacity = 1000 // 假设总容量
      return ((this.totalFlow / totalCapacity) * 100).toFixed(1)
    },
    
    peakUtilization() {
      const maxValue = Math.max(...this.heatmapData.map(item => item[2]))
      return ((maxValue / 100) * 100).toFixed(1)
    }
  },
  
  mounted() {
    this.initCharts()
    this.generateHeatmapData()
    this.updateHeatmapData()
  },
  
  methods: {
    // 初始化图表
    initCharts() {
      this.initHeatmapChart()
      this.initFlylineChart()
    },
    
    // 初始化3D热力图
    initHeatmapChart() {
      this.heatmapChart = echarts.init(this.$refs.heatmapChart)
      
      const option = {
        tooltip: {
          position: 'top',
          formatter: (params) => {
            const hour = params.data[0]
            const duration = this.getDurationName(params.data[1])
            const count = params.data[2]
            return `${hour}:00时<br/>${duration}<br/>车辆数: ${count}辆`
          }
        },
        grid: {
          height: '60%',
          top: '10%'
        },
        xAxis: {
          type: 'category',
          data: Array.from({length: 24}, (_, i) => `${i}:00`),
          splitArea: { show: true },
          axisLabel: {
            color: '#00bcd4',
            fontSize: 10,
            interval: 3
          },
          axisLine: {
            lineStyle: { color: '#00bcd4' }
          }
        },
        yAxis: {
          type: 'category',
          data: ['短停(0-1h)', '中停(1-4h)', '长停(4-8h)', '超长停(>8h)'],
          splitArea: { show: true },
          axisLabel: {
            color: '#00bcd4',
            fontSize: 10
          },
          axisLine: {
            lineStyle: { color: '#00bcd4' }
          }
        },
        visualMap: {
          min: 0,
          max: 100,
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '5%',
          inRange: {
            color: [
              '#313695', '#4575b4', '#74add1', '#abd9e9', 
              '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', 
              '#f46d43', '#d73027', '#a50026'
            ]
          },
          textStyle: {
            color: '#00bcd4'
          }
        },
        series: [{
          name: '停车热力',
          type: 'heatmap',
          data: this.heatmapData,
          label: {
            show: true,
            color: '#fff',
            fontSize: 10
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      }
      
      this.heatmapChart.setOption(option)
    },
    
    // 初始化飞线图
    initFlylineChart() {
      this.flylineChart = echarts.init(this.$refs.flylineChart)
      
      const option = {
        backgroundColor: 'transparent',
        series: [{
          type: 'graph',
          layout: 'none',
          coordinateSystem: null,
          symbolSize: 30,
          roam: false,
          label: {
            show: true,
            position: 'bottom',
            color: '#00bcd4',
            fontSize: 10
          },
          edgeSymbol: ['circle', 'arrow'],
          edgeSymbolSize: [4, 8],
          data: this.flylineData.points.map(point => ({
            name: point.text,
            x: point.coordinate[0] * 100,
            y: point.coordinate[1] * 100,
            itemStyle: {
              color: '#00bcd4',
              shadowBlur: 10,
              shadowColor: '#00bcd4'
            }
          })),
          links: this.flylineData.lines.map(line => ({
            source: line.source,
            target: line.target,
            lineStyle: {
              color: '#00bcd4',
              width: 2,
              curveness: 0.3
            }
          })),
          lineStyle: {
            color: '#00bcd4',
            width: 2,
            curveness: 0.3
          }
        }]
      }
      
      this.flylineChart.setOption(option)
    },
    
    // 生成热力图数据
    generateHeatmapData() {
      this.heatmapData = []
      
      // 生成24小时 x 4个时长区间的数据
      for (let hour = 0; hour < 24; hour++) {
        for (let duration = 0; duration < 4; duration++) {
          // 模拟数据：高峰时段(8-18点)车流量较高
          let baseValue = 20
          if (hour >= 8 && hour <= 18) {
            baseValue = 40 + Math.random() * 30
          } else if (hour >= 19 && hour <= 22) {
            baseValue = 30 + Math.random() * 20
          } else {
            baseValue = 10 + Math.random() * 15
          }
          
          // 不同时长区间的权重
          const durationWeights = [0.4, 0.3, 0.2, 0.1]
          const value = Math.round(baseValue * durationWeights[duration])
          
          this.heatmapData.push([hour, duration, value])
        }
      }
    },
    
    // 更新时间轴数据
    updateHeatmapData() {
      // 根据当前时间高亮显示
      const option = this.heatmapChart.getOption()
      option.series[0].data = this.heatmapData.map(item => {
        const isCurrentHour = item[0] === parseInt(this.currentHour)
        return {
          value: item,
          itemStyle: {
            borderColor: isCurrentHour ? '#ff6b6b' : 'transparent',
            borderWidth: isCurrentHour ? 2 : 0
          }
        }
      })
      
      this.heatmapChart.setOption(option)
    },
    
    // 获取时长名称
    getDurationName(durationIndex) {
      const names = ['短停(0-1h)', '中停(1-4h)', '长停(4-8h)', '超长停(>8h)']
      return names[durationIndex] || '未知'
    },
    
    // 获取时长数值
    getDurationFromHour(durationIndex) {
      const durations = [0.5, 2.5, 6, 12]
      return durations[durationIndex] || 0
    },
    
    // 窗口大小改变时重新渲染
    handleResize() {
      if (this.heatmapChart) {
        this.heatmapChart.resize()
      }
      if (this.flylineChart) {
        this.flylineChart.resize()
      }
    }
  },
  
  beforeDestroy() {
    if (this.heatmapChart) {
      this.heatmapChart.dispose()
    }
    if (this.flylineChart) {
      this.flylineChart.dispose()
    }
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>

<style lang="scss" scoped>
.parking-duration-channel-3d {
  width: 100%;
  height: 100%;
  padding: 20px;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 100%);
  color: #e2e8f0;
}

.chart-header {
  text-align: center;
  margin-bottom: 20px;
  
  .title {
    font-size: 20px;
    font-weight: bold;
    color: #00bcd4;
    margin-bottom: 5px;
    text-shadow: 0 0 10px rgba(0, 188, 212, 0.5);
  }
  
  .subtitle {
    font-size: 12px;
    color: #94a3b8;
  }
}

.main-content {
  flex: 1;
  display: flex;
  gap: 20px;
  margin-bottom: 20px;
}

.heatmap-container {
  flex: 2;
  display: flex;
  flex-direction: column;
  
  .heatmap-title {
    font-size: 16px;
    color: #00bcd4;
    margin-bottom: 15px;
    text-align: center;
    font-weight: bold;
  }
  
  .heatmap-chart {
    flex: 1;
    min-height: 300px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    border: 1px solid #00bcd4;
  }
  
  .heatmap-legend {
    margin-top: 15px;
    
    .legend-title {
      font-size: 14px;
      color: #00bcd4;
      margin-bottom: 10px;
      text-align: center;
    }
    
    .legend-items {
      display: flex;
      justify-content: space-around;
      flex-wrap: wrap;
      gap: 10px;
      
      .legend-item {
        display: flex;
        align-items: center;
        gap: 5px;
        
        .legend-color {
          width: 12px;
          height: 12px;
          border-radius: 2px;
        }
        
        .legend-text {
          font-size: 11px;
          color: #e2e8f0;
        }
      }
    }
  }
}

.right-panel {
  flex: 1;
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.flyline-container {
  .flyline-title {
    font-size: 16px;
    color: #00bcd4;
    margin-bottom: 15px;
    text-align: center;
    font-weight: bold;
  }
  
  .flyline-chart {
    height: 200px;
    background: rgba(0, 0, 0, 0.3);
    border-radius: 8px;
    border: 1px solid #00bcd4;
  }
}

.kpi-container {
  .kpi-title {
    font-size: 16px;
    color: #00bcd4;
    margin-bottom: 15px;
    text-align: center;
    font-weight: bold;
  }
  
  .kpi-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 10px;
    
    .kpi-item {
      padding: 15px;
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid #00bcd4;
      border-radius: 8px;
      text-align: center;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(0, 188, 212, 0.1);
        transform: translateY(-2px);
        box-shadow: 0 4px 15px rgba(0, 188, 212, 0.3);
      }
      
      .kpi-label {
        font-size: 11px;
        color: #94a3b8;
        margin-bottom: 8px;
      }
      
      .kpi-value {
        font-size: 18px;
        font-weight: bold;
        color: #00bcd4;
        text-shadow: 0 0 5px rgba(0, 188, 212, 0.5);
      }
    }
  }
}

.time-control {
  .time-title {
    font-size: 14px;
    color: #00bcd4;
    margin-bottom: 10px;
    text-align: center;
    font-weight: bold;
  }
  
  .time-slider {
    .slider {
      width: 100%;
      height: 6px;
      background: rgba(0, 188, 212, 0.2);
      border-radius: 3px;
      outline: none;
      -webkit-appearance: none;
      
      &::-webkit-slider-thumb {
        -webkit-appearance: none;
        width: 20px;
        height: 20px;
        background: #00bcd4;
        border-radius: 50%;
        cursor: pointer;
        box-shadow: 0 0 10px rgba(0, 188, 212, 0.5);
      }
      
      &::-moz-range-thumb {
        width: 20px;
        height: 20px;
        background: #00bcd4;
        border-radius: 50%;
        cursor: pointer;
        border: none;
        box-shadow: 0 0 10px rgba(0, 188, 212, 0.5);
      }
    }
    
    .time-labels {
      display: flex;
      justify-content: space-between;
      margin-top: 10px;
      
      .time-label {
        font-size: 10px;
        color: #94a3b8;
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .main-content {
    flex-direction: column;
  }
  
  .kpi-grid {
    grid-template-columns: 1fr;
  }
}
</style>
