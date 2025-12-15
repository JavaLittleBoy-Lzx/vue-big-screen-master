<template>
  <div class="channel-flow-trend-chart">
    <div class="chart-header">
      <h3 class="chart-title">流量趋势</h3>
      <div class="chart-subtitle">近24小时流量变化</div>
    </div>
    <div class="chart-container" ref="chartContainer"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'ChannelFlowTrendChart',
  props: {
    channelData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      chart: null
    }
  },
  computed: {
    chartData() {
      // 生成24小时的模拟数据
      const hours = []
      const flowData = []
      const now = new Date()
      
      for (let i = 23; i >= 0; i--) {
        const hour = new Date(now.getTime() - i * 60 * 60 * 1000)
        hours.push(hour.getHours() + ':00')
        
        // 模拟流量数据，根据时间有规律变化
        const baseFlow = this.channelData.flow || 30
        const hourVariation = Math.sin((23 - i) * Math.PI / 12) * 20
        const randomVariation = (Math.random() - 0.5) * 10
        const flow = Math.max(0, Math.round(baseFlow + hourVariation + randomVariation))
        
        flowData.push(flow)
      }
      
      return { hours, flowData }
    }
  },
  mounted() {
    this.initChart()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose()
    }
    window.removeEventListener('resize', this.handleResize)
  },
  methods: {
    initChart() {
      if (!this.$refs.chartContainer) return
      
      this.chart = echarts.init(this.$refs.chartContainer)
      
      const option = {
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(11, 19, 42, 0.9)',
          borderColor: '#1e3a8a',
          textStyle: {
            color: '#ffffff'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          boundaryGap: false,
          data: this.chartData.hours,
          axisLine: {
            lineStyle: {
              color: '#1e3a8a'
            }
          },
          axisLabel: {
            color: '#94a3b8',
            fontSize: 12
          }
        },
        yAxis: {
          type: 'value',
          axisLine: {
            lineStyle: {
              color: '#1e3a8a'
            }
          },
          axisLabel: {
            color: '#94a3b8',
            fontSize: 12
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(30, 58, 138, 0.3)'
            }
          }
        },
        series: [
          {
            name: '流量',
            type: 'line',
            smooth: true,
            lineStyle: {
              color: '#3b82f6',
              width: 3
            },
            areaStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: 'rgba(59, 130, 246, 0.3)'
                  },
                  {
                    offset: 1,
                    color: 'rgba(59, 130, 246, 0.05)'
                  }
                ]
              }
            },
            data: this.chartData.flowData,
            symbol: 'circle',
            symbolSize: 6,
            emphasis: {
              focus: 'series'
            }
          }
        ]
      }
      
      this.chart.setOption(option)
    },
    
    handleResize() {
      if (this.chart) {
        this.chart.resize()
      }
    }
  },
  watch: {
    channelData: {
      handler() {
        if (this.chart) {
          this.chart.setOption({
            series: [{
              data: this.chartData.flowData
            }]
          })
        }
      },
      deep: true
    }
  }
}
</script>

<style lang="scss" scoped>
.channel-flow-trend-chart {
  height: 100%;
  display: flex;
  flex-direction: column;
  background: rgba(11, 19, 42, 0.8);
  border: 1px solid #1e3a8a;
  border-radius: 12px;
  padding: 20px;
  
  .chart-header {
    margin-bottom: 20px;
    
    .chart-title {
      margin: 0 0 5px 0;
      font-size: 16px;
      font-weight: bold;
      color: #ffffff;
    }
    
    .chart-subtitle {
      font-size: 12px;
      color: #94a3b8;
    }
  }
  
  .chart-container {
    flex: 1;
    min-height: 200px;
  }
}
</style>
