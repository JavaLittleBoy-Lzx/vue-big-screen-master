<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>通道使用率仪表盘</h3>
      <div class="chart-subtitle">实时使用率监控</div>
    </div>
    <div ref="chartRef" class="chart-content"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'ChannelUtilizationGaugeChart',
  props: {
    channelData: {
      type: Object,
      default: () => ({})
    },
    channelsData: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      chart: null
    }
  },
  mounted() {
    this.initChart()
    this.updateChart()
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose()
    }
  },
  watch: {
    channelData: {
      handler() {
        this.updateChart()
      },
      deep: true
    },
    channelsData: {
      handler() {
        this.updateChart()
      },
      deep: true
    }
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$refs.chartRef)
    },
    
    updateChart() {
      if (!this.chart) return
      
      // 计算平均使用率
      const avgUtilization = this.channelsData.length > 0 
        ? this.channelsData.reduce((sum, channel) => sum + (channel.utilization || 0), 0) / this.channelsData.length
        : 0
      
      // 当前选中通道的使用率
      const currentUtilization = this.channelData.utilization || 0
      
      const option = {
        backgroundColor: 'transparent',
        series: [
          {
            type: 'gauge',
            center: ['50%', '60%'],
            radius: '80%',
            startAngle: 200,
            endAngle: -20,
            min: 0,
            max: 100,
            splitNumber: 10,
            itemStyle: {
              color: this.getGaugeColor(currentUtilization),
              shadowColor: 'rgba(0,0,0,0.45)',
              shadowBlur: 10,
              shadowOffsetX: 2,
              shadowOffsetY: 2
            },
            progress: {
              show: true,
              width: 18,
              itemStyle: {
                color: {
                  type: 'linear',
                  x: 0,
                  y: 0,
                  x2: 1,
                  y2: 0,
                  colorStops: [
                    { offset: 0, color: '#10b981' },
                    { offset: 0.5, color: '#f59e0b' },
                    { offset: 1, color: '#ef4444' }
                  ]
                }
              }
            },
            pointer: {
              show: true,
              length: '60%',
              width: 6,
              itemStyle: {
                color: '#ffffff',
                shadowColor: 'rgba(0,0,0,0.3)',
                shadowBlur: 5
              }
            },
            axisLine: {
              lineStyle: {
                width: 18,
                color: [
                  [0.3, '#10b981'],
                  [0.7, '#f59e0b'],
                  [1, '#ef4444']
                ]
              }
            },
            axisTick: {
              distance: -30,
              splitNumber: 5,
              lineStyle: {
                width: 2,
                color: '#999'
              }
            },
            splitLine: {
              distance: -30,
              length: 30,
              lineStyle: {
                width: 4,
                color: '#999'
              }
            },
            axisLabel: {
              color: '#94a3b8',
              distance: 40,
              fontSize: 12,
              formatter: function (value) {
                if (value === 100) {
                  return '100%'
                } else if (value === 75) {
                  return '75%'
                } else if (value === 50) {
                  return '50%'
                } else if (value === 25) {
                  return '25%'
                } else if (value === 0) {
                  return '0%'
                }
                return ''
              }
            },
            detail: {
              valueAnimation: true,
              formatter: '{value}%',
              color: '#ffffff',
              fontSize: 20,
              fontWeight: 'bold',
              offsetCenter: [0, '70%']
            },
            data: [
              {
                value: currentUtilization,
                name: '使用率'
              }
            ]
          },
          // 平均使用率环形图
          {
            type: 'gauge',
            center: ['50%', '60%'],
            radius: '50%',
            startAngle: 200,
            endAngle: -20,
            min: 0,
            max: 100,
            splitNumber: 0,
            axisLine: {
              lineStyle: {
                width: 8,
                color: [
                  [1, 'rgba(59, 130, 246, 0.3)']
                ]
              }
            },
            pointer: {
              show: false
            },
            axisTick: {
              show: false
            },
            splitLine: {
              show: false
            },
            axisLabel: {
              show: false
            },
            detail: {
              show: false
            },
            data: [
              {
                value: avgUtilization,
                name: '平均使用率'
              }
            ]
          }
        ]
      }
      
      this.chart.setOption(option)
    },
    
    getGaugeColor(utilization) {
      if (utilization >= 80) return '#ef4444'
      if (utilization >= 60) return '#f59e0b'
      return '#10b981'
    }
  }
}
</script>

<style lang="scss" scoped>
.chart-container {
  height: 100%;
  background: rgba(11, 19, 42, 0.6);
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #1e3a8a;
  
  .chart-header {
    margin-bottom: 15px;
    
    h3 {
      margin: 0 0 5px 0;
      font-size: 16px;
      color: #ffffff;
      font-weight: bold;
    }
    
    .chart-subtitle {
      font-size: 12px;
      color: #94a3b8;
    }
  }
  
  .chart-content {
    height: calc(100% - 50px);
  }
}
</style>
