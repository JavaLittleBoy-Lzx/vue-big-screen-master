<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>{{ channelType === 'entry' ? '进口通道进车数量' : '出口通道出车数量' }}</h3>
      <p class="chart-subtitle">{{ channelType === 'entry' ? '各进口通道进车数量详情' : '各出口通道出车数量详情' }}</p>
    </div>
    
    <div class="chart-content">
      <div ref="pieChart" class="pie-chart"></div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'ModalChannelPieChart',
  props: {
    channelsData: {
      type: Array,
      default: () => []
    },
    selectedTimeRange: {
      type: String,
      default: 'today'
    },
    channelType: {
      type: String,
      default: 'entry'
    }
  },
  data() {
    return {
      chart: null,
      chartData: []
    }
  },
  watch: {
    channelsData: {
      handler() {
        this.updateChartData()
      },
      deep: true
    },
    selectedTimeRange() {
      this.updateChartData()
    }
  },
  mounted() {
    this.initChart()
    this.updateChartData()
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose()
    }
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$refs.pieChart)
      
      // 监听窗口大小变化
      window.addEventListener('resize', () => {
        if (this.chart) {
          this.chart.resize()
        }
      })
    },
    
    updateChartData() {
      if (!this.chart || !this.channelsData.length) return
      
      // 处理真实数据或生成模拟数据
      this.chartData = this.channelsData.map((channel, index) => {
        let vehicleCount = 0
        
        // 如果通道数据包含真实的车辆数量，使用真实数据
        if (channel.entry !== undefined || channel.exit !== undefined) {
          // 根据通道类型选择使用entry或exit数据
          if (this.channelType === 'entry') {
            vehicleCount = channel.entry || 0;
          } else if (this.channelType === 'exit') {
            vehicleCount = channel.exit || 0;
          } else {
            // 如果通道类型不明确，使用总数
            vehicleCount = channel.total || (channel.entry || 0) + (channel.exit || 0);
          }
        } else {
          // 如果没有真实数据，生成模拟数据
          switch (this.selectedTimeRange) {
            case 'today':
              vehicleCount = Math.floor(Math.random() * 100) + 50 // 50-150辆/日
              break
            case 'week':
              vehicleCount = Math.floor(Math.random() * 500) + 200 // 200-700辆/周
              break
            case 'month':
              vehicleCount = Math.floor(Math.random() * 2000) + 1000 // 1000-3000辆/月
              break
            case 'year':
              vehicleCount = Math.floor(Math.random() * 20000) + 10000 // 10000-30000辆/年
              break
          }
          
          // 根据通道位置调整车辆数量
          if (channel.name.includes('1号门')) {
            vehicleCount = Math.floor(vehicleCount * 1.5)
          } else if (channel.name.includes('林科门') || channel.name.includes('兴安门')) {
            vehicleCount = Math.floor(vehicleCount * 0.8)
          }
        }
        
        return {
          name: channel.name,
          value: vehicleCount,
          itemStyle: {
            color: this.getChannelColor(index)
          }
        }
      })
      
      this.renderChart()
    },
    
    getChannelColor(index) {
      const colors = [
        '#00d4aa', // 绿色
        '#ff6b6b', // 红色
        '#4ecdc4', // 青色
        '#45b7d1', // 蓝色
        '#96ceb4', // 浅绿色
        '#feca57', // 黄色
        '#ff9ff3', // 粉色
        '#54a0ff'  // 蓝色
      ]
      return colors[index % colors.length]
    },
    
    renderChart() {
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(11, 19, 42, 0.9)',
          borderColor: '#1e3a8a',
          borderWidth: 1,
          textStyle: {
            color: '#ffffff',
            fontSize: 12
          },
          formatter: (params) => {
            const timeRangeText = this.getTimeRangeText()
            return `${params.name}<br/>${timeRangeText}：${params.value}辆<br/>占比：${params.percent}%`
          }
        },
        legend: {
          orient: 'vertical',
          left: 'left',
          top: 'middle',
          textStyle: {
            color: '#ffffff',
            fontSize: 12
          },
          itemGap: 15,
          itemWidth: 20,
          itemHeight: 14,
          formatter: (name) => {
            const data = this.chartData.find(item => item.name === name)
            return `${name} (${data ? data.value : 0}辆)`
          }
        },
        series: [
          {
            name: this.channelType === 'entry' ? '进车数量' : '出车数量',
            type: 'pie',
            radius: ['40%', '70%'],
            center: ['65%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 8,
              borderColor: '#0b132a',
              borderWidth: 2
            },
            label: {
              show: false,
              position: 'center'
            },
            emphasis: {
              scale: true,
              focus: 'self',
              label: {
                show: false
              },
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            },
            labelLine: {
              show: false
            },
            data: this.chartData
          }
        ]
      }
      
      this.chart.setOption(option)
    },
    
    getTimeRangeText() {
      const timeRangeMap = {
        'today': '今日',
        'week': '本周',
        'month': '本月',
        'year': '本年度'
      }
      return timeRangeMap[this.selectedTimeRange] || '今日'
    }
  }
}
</script>

<style lang="scss" scoped>
.chart-container {
  width: 100%;
  height: 100%;
  background: rgba(11, 19, 42, 0.6);
  border: 1px solid #1e3a8a;
  border-radius: 8px;
  padding: 15px;
  display: flex;
  flex-direction: column;
}

.chart-header {
  margin-bottom: 15px;
  
  h3 {
    margin: 0 0 5px 0;
    font-size: 16px;
    color: #ffffff;
    font-weight: bold;
  }
  
  .chart-subtitle {
    margin: 0;
    font-size: 12px;
    color: #94a3b8;
  }
}

.chart-content {
  flex: 1;
  width: 100%;
  height: calc(100% - 50px);
}

.pie-chart {
  width: 100%;
  height: 100%;
}
</style>
