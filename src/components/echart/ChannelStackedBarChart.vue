<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>通道对比分析</h3>
      <div class="chart-subtitle">流量与使用率对比</div>
    </div>
    <div ref="chartRef" class="chart-content"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'ChannelStackedBarChart',
  props: {
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
      if (!this.chart || !this.channelsData.length) return
      
      // 取前8个通道进行对比
      const topChannels = [...this.channelsData]
        .sort((a, b) => (b.flow || 0) - (a.flow || 0))
        .slice(0, 8)
      
      const channelNames = topChannels.map(channel => channel.name)
      const flowData = topChannels.map(channel => channel.flow || 0)
      const utilizationData = topChannels.map(channel => channel.utilization || 0)
      const todayTotalData = topChannels.map(channel => Math.round((channel.todayTotal || 0) / 10)) // 缩小数值便于显示
      
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          },
          backgroundColor: 'rgba(11, 19, 42, 0.9)',
          borderColor: '#1e3a8a',
          textStyle: {
            color: '#ffffff'
          },
          formatter: function (params) {
            let result = params[0].name + '<br/>'
            params.forEach(param => {
              if (param.seriesName === '今日累计') {
                result += param.marker + param.seriesName + ': ' + (param.value * 10) + '辆<br/>'
              } else {
                result += param.marker + param.seriesName + ': ' + param.value + (param.seriesName === '使用率' ? '%' : '辆/小时') + '<br/>'
              }
            })
            return result
          }
        },
        legend: {
          data: ['当前流量', '使用率', '今日累计'],
          textStyle: {
            color: '#94a3b8',
            fontSize: 12
          },
          top: 10
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: channelNames,
          axisLine: {
            lineStyle: {
              color: '#1e3a8a'
            }
          },
          axisLabel: {
            color: '#94a3b8',
            fontSize: 10,
            rotate: 45
          },
          axisTick: {
            alignWithLabel: true
          }
        },
        yAxis: [
          {
            type: 'value',
            name: '流量(辆/小时)/使用率(%)',
            position: 'left',
            axisLine: {
              lineStyle: {
                color: '#3b82f6'
              }
            },
            axisLabel: {
              color: '#94a3b8',
              formatter: '{value}'
            },
            splitLine: {
              lineStyle: {
                color: 'rgba(30, 58, 138, 0.2)'
              }
            }
          },
          {
            type: 'value',
            name: '累计(×10)',
            position: 'right',
            axisLine: {
              lineStyle: {
                color: '#10b981'
              }
            },
            axisLabel: {
              color: '#94a3b8',
              formatter: '{value}'
            }
          }
        ],
        series: [
          {
            name: '当前流量',
            type: 'bar',
            yAxisIndex: 0,
            data: flowData,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#3b82f6' },
                  { offset: 1, color: '#1d4ed8' }
                ]
              },
              borderRadius: [4, 4, 0, 0]
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(59, 130, 246, 0.5)'
              }
            }
          },
          {
            name: '使用率',
            type: 'bar',
            yAxisIndex: 0,
            data: utilizationData,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: '#f59e0b' },
                  { offset: 1, color: '#d97706' }
                ]
              },
              borderRadius: [4, 4, 0, 0]
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(245, 158, 11, 0.5)'
              }
            }
          },
          {
            name: '今日累计',
            type: 'line',
            yAxisIndex: 1,
            data: todayTotalData,
            lineStyle: {
              color: '#10b981',
              width: 3
            },
            itemStyle: {
              color: '#10b981',
              borderWidth: 2,
              borderColor: '#ffffff'
            },
            symbol: 'circle',
            symbolSize: 6,
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(16, 185, 129, 0.5)'
              }
            }
          }
        ],
        animationDuration: 1500,
        animationEasing: 'cubicOut'
      }
      
      this.chart.setOption(option)
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
