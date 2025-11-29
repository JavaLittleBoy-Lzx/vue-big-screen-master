<template>
  <div class="hourly-flow-chart">
    <div class="chart-header">
      <div class="title">📊 今日车流量分析</div>
    </div>
    
    <!-- 图例移动到图表上方 -->
    <div class="chart-legend">
      <div class="legend-item">
        <div class="legend-color entry"></div>
        <span class="legend-text">进场</span>
      </div>
      <div class="legend-item">
        <div class="legend-color exit"></div>
        <span class="legend-text">离场</span>
      </div>
    </div>
    
    <div class="chart-container" ref="chartContainer">
      <div id="hourlyFlowChart" class="chart"></div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'HourlyFlowStackedChart',
  data() {
    return {
      chart: null,
      chartData: {
        hours: [],
        entryData: [],
        exitData: []
      }
    }
  },
  mounted() {
    this.initChart()
    this.generateHourlyData()
    this.startDataUpdate()
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose()
    }
  },
  methods: {
    initChart() {
      this.chart = echarts.init(document.getElementById('hourlyFlowChart'))
      this.updateChart()
      
      // 添加点击事件
      this.chart.on('click', (params) => {
        this.handleChartClick(params)
      })
      
      // 响应式调整
      window.addEventListener('resize', () => {
        if (this.chart) {
          this.chart.resize()
        }
      })
    },
    
    generateHourlyData() {
      const hours = []
      const entryData = []
      const exitData = []
      
      // 生成24小时数据
      for (let i = 0; i < 24; i++) {
        const hour = `${i.toString().padStart(2, '0')}:00`
        hours.push(hour)
        
        // 模拟真实的车流量数据
        let entryValue, exitValue
        
        if (i >= 7 && i <= 9) {
          // 早高峰
          entryValue = Math.floor(Math.random() * 30) + 40
          exitValue = Math.floor(Math.random() * 20) + 10
        } else if (i >= 17 && i <= 19) {
          // 晚高峰
          entryValue = Math.floor(Math.random() * 25) + 15
          exitValue = Math.floor(Math.random() * 35) + 45
        } else if (i >= 10 && i <= 16) {
          // 白天
          entryValue = Math.floor(Math.random() * 20) + 20
          exitValue = Math.floor(Math.random() * 20) + 20
        } else {
          // 夜间
          entryValue = Math.floor(Math.random() * 10) + 5
          exitValue = Math.floor(Math.random() * 10) + 5
        }
        
        entryData.push(entryValue)
        exitData.push(exitValue)
      }
      
      this.chartData = {
        hours,
        entryData,
        exitData
      }
      
      this.updateChart()
    },
    
    updateChart() {
      if (!this.chart) return
      
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(11, 19, 42, 0.95)',
          borderColor: '#3b82f6',
          borderWidth: 1,
          textStyle: {
            color: '#ffffff',
            fontSize: 12
          },
          formatter: (params) => {
            let result = `<div style="margin-bottom: 8px; font-weight: bold; color: #3b82f6;">${params[0].axisValue}</div>`
            params.forEach(param => {
              const color = param.color
              const value = param.value
              const seriesName = param.seriesName
              result += `<div style="display: flex; align-items: center; margin-bottom: 4px;">
                <span style="display: inline-block; width: 10px; height: 10px; background: ${color}; margin-right: 8px; border-radius: 2px;"></span>
                <span style="color: #e2e8f0;">${seriesName}: </span>
                <span style="color: #ffffff; font-weight: bold; margin-left: 4px;">${value}辆</span>
              </div>`
            })
            return result
          }
        },
        legend: {
          show: false
        },
        grid: {
          left: '8%',
          right: '8%',
          top: '18%',
          bottom: '2%',
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
            fontSize: 10,
            interval: 2 // 每2小时显示一个标签
          },
          axisTick: {
            show: false
          }
        },
        yAxis: {
          type: 'value',
          axisLine: {
            show: false
          },
          axisLabel: {
            color: '#94a3b8',
            fontSize: 10,
            formatter: '{value}辆'
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(30, 58, 138, 0.3)',
              type: 'dashed'
            }
          }
        },
        series: [
          {
            name: '进场',
            type: 'bar',
            stack: 'total',
            data: this.chartData.entryData,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: '#00d4ff' },
                  { offset: 1, color: '#0099cc' }
                ]
              },
              barBorderRadius: [4, 4, 4, 4] // 增加圆角半径
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(0, 212, 255, 0.5)'
              }
            }
          },
          {
            name: '离场',
            type: 'bar',
            stack: 'total',
            data: this.chartData.exitData,
            itemStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: '#ff6b6b' },
                  { offset: 1, color: '#cc5555' }
                ]
              },
              barBorderRadius: [4, 4, 4, 4] // 增加圆角半径
            },
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowColor: 'rgba(255, 107, 107, 0.5)'
              }
            }
          }
        ]
      }
      
      this.chart.setOption(option)
    },
    
    handleChartClick(params) {
      // 点击图表时触发父组件弹窗显示
      console.log('点击了图表数据:', params)
      this.$emit('chart-click', {
        hour: params.name,
        entry: params.value,
        type: params.seriesName
      })
    },
    
    startDataUpdate() {
      // 每5分钟更新一次数据
      setInterval(() => {
        this.generateHourlyData()
      }, 300000)
    }
  }
}
</script>

<style lang="scss" scoped>
.hourly-flow-chart {
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
    margin-left: -255px;
    font-size: 16px;
    font-weight: bold;
    // color: #3b82f6;
    margin-bottom: 5px;
  }
  
  .subtitle {
    font-size: 11px;
    color: #94a3b8;
  }
}

.chart-container {
  flex: 1;
  position: relative;
  
  .chart {
    margin-left: -52px;
    margin-top: -45px;
    width: 540px;
    height: 340px;
    min-height: 100px;
  }
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 20px;
  margin-bottom: 10px;
  margin-top: -5px;
  
  .legend-item {
    display: flex;
    align-items: center;
    gap: 6px;
    
    .legend-color {
      width: 12px;
      height: 12px;
      border-radius: 2px;
      
      &.entry {
        background: linear-gradient(135deg, #00d4ff, #0099cc);
      }
      
      &.exit {
        background: linear-gradient(135deg, #ff6b6b, #cc5555);
      }
    }
    
    .legend-text {
      font-size: 12px;
      color: #B4B4B4;
    }
  }
}
</style>
