<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>通道性能雷达图</h3>
      <div class="chart-subtitle">多维度性能对比</div>
    </div>
    <div ref="chartRef" class="chart-content"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'ChannelPerformanceRadarChart',
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
      
      // 获取前5个通道的数据进行对比
      const topChannels = [...this.channelsData]
        .sort((a, b) => (b.flow || 0) - (a.flow || 0))
        .slice(0, 5)
      
      const indicators = [
        { name: '流量', max: 100 },
        { name: '使用率', max: 100 },
        { name: '效率', max: 100 },
        { name: '稳定性', max: 100 },
        { name: '负载', max: 100 }
      ]
      
      const seriesData = topChannels.map((channel, index) => ({
        name: channel.name,
        value: [
          Math.min((channel.flow || 0) * 2, 100), // 流量
          channel.utilization || 0, // 使用率
          this.calculateEfficiency(channel), // 效率
          this.calculateStability(channel), // 稳定性
          this.calculateLoad(channel) // 负载
        ],
        itemStyle: {
          color: this.getChannelColor(index)
        },
        areaStyle: {
          color: this.getChannelColor(index),
          opacity: 0.1
        }
      }))
      
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(11, 19, 42, 0.9)',
          borderColor: '#1e3a8a',
          textStyle: {
            color: '#ffffff'
          }
        },
        legend: {
          orient: 'vertical',
          right: 10,
          top: 'center',
          textStyle: {
            color: '#94a3b8',
            fontSize: 11
          },
          itemWidth: 10,
          itemHeight: 6
        },
        radar: {
          indicator: indicators,
          center: ['40%', '50%'],
          radius: '60%',
          name: {
            textStyle: {
              color: '#94a3b8',
              fontSize: 12
            }
          },
          splitArea: {
            areaStyle: {
              color: ['rgba(59, 130, 246, 0.1)', 'rgba(59, 130, 246, 0.05)']
            }
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(59, 130, 246, 0.3)'
            }
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(59, 130, 246, 0.2)'
            }
          }
        },
        series: [
          {
            type: 'radar',
            data: seriesData,
            symbol: 'circle',
            symbolSize: 4,
            lineStyle: {
              width: 2
            },
            animationDuration: 2000,
            animationEasing: 'cubicOut'
          }
        ]
      }
      
      this.chart.setOption(option)
    },
    
    calculateEfficiency(channel) {
      // 基于流量和使用率计算效率
      const flow = channel.flow || 0
      const utilization = channel.utilization || 0
      return Math.min((flow * utilization) / 10, 100)
    },
    
    calculateStability(channel) {
      // 模拟稳定性计算
      const base = 70
      const variation = Math.random() * 20
      return Math.min(base + variation, 100)
    },
    
    calculateLoad(channel) {
      // 基于使用率计算负载
      const utilization = channel.utilization || 0
      return Math.min(utilization * 1.2, 100)
    },
    
    getChannelColor(index) {
      const colors = [
        '#3b82f6', '#ef4444', '#10b981', '#f59e0b', '#8b5cf6'
      ]
      return colors[index % colors.length]
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
