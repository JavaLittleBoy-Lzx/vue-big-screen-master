<template>
  <div class="channel-hourly-flow-chart">
    <div class="chart-header">
      <h3 class="chart-title">小时流量分布</h3>
      <div class="chart-subtitle">今日各时段流量统计</div>
    </div>
    <div class="chart-container" ref="chartContainer"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'ChannelHourlyFlowChart',
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
      // 生成24小时流量分布数据
      const hours = []
      const flowData = []
      
      for (let i = 0; i < 24; i++) {
        hours.push(i + ':00')
        
        // 模拟一天中的流量变化模式
        let flow = 0
        if (i >= 6 && i <= 8) {
          // 早高峰
          flow = 40 + Math.random() * 20
        } else if (i >= 17 && i <= 19) {
          // 晚高峰
          flow = 45 + Math.random() * 25
        } else if (i >= 9 && i <= 16) {
          // 白天正常时段
          flow = 25 + Math.random() * 15
        } else if (i >= 20 && i <= 22) {
          // 晚间
          flow = 15 + Math.random() * 10
        } else {
          // 深夜和凌晨
          flow = 5 + Math.random() * 8
        }
        
        flowData.push(Math.round(flow))
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
          data: this.chartData.hours,
          axisLine: {
            lineStyle: {
              color: '#1e3a8a'
            }
          },
          axisLabel: {
            color: '#94a3b8',
            fontSize: 11,
            interval: 2 // 每隔2小时显示一个标签
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
            type: 'bar',
            data: this.chartData.flowData,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  {
                    offset: 0,
                    color: '#3b82f6'
                  },
                  {
                    offset: 1,
                    color: '#1d4ed8'
                  }
                ]
              }
            },
            barWidth: '70%',
            emphasis: {
              itemStyle: {
                color: '#60a5fa'
              }
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
.channel-hourly-flow-chart {
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
