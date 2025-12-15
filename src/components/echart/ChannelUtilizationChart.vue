<template>
  <div class="channel-utilization-chart">
    <div class="chart-header">
      <h3 class="chart-title">{{ channelType === 'entry' ? '进车数量对比' : '出车数量对比' }}</h3>
      <div class="chart-subtitle">{{ channelType === 'entry' ? '各通道进车数量排名' : '各通道出车数量排名' }}</div>
    </div>
    <div class="chart-container" ref="chartContainer"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'ChannelUtilizationChart',
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
      updateTimer: null,
      // 为每个通道定义不同的颜色 - 使用率对比使用温暖色调
      channelColors: [
        '#ff6b6b', // 珊瑚红
        '#ffa726', // 橙色
        '#ffeb3b', // 黄色
        '#66bb6a', // 绿色
        '#42a5f5', // 蓝色
        '#ab47bc', // 紫色
        '#26a69a', // 青绿色
        '#ef5350', // 红色
        '#ff7043', // 深橙色
        '#8d6e63', // 棕色
        '#78909c', // 蓝灰色
        '#f06292'  // 粉色
      ]
    }
  },
  computed: {
    chartData() {
      // 为每个通道生成车辆数量数据
      const channelsWithVehicleCount = this.channelsData.map((channel, index) => {
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
          ...channel,
          vehicleCount: vehicleCount
        }
      })
      
      // 按车辆数量排序，然后反转顺序让高的在上方
      const sortedChannels = channelsWithVehicleCount
        .sort((a, b) => b.vehicleCount - a.vehicleCount)
        .reverse() // 反转顺序，让数量高的在上方
      
      return {
        names: sortedChannels.map(channel => channel.name),
        vehicleCounts: sortedChannels.map(channel => channel.vehicleCount)
      }
    }
  },
  mounted() {
    this.initChart()
    // 移除定时更新，使用真实数据
    // this.startDynamicUpdate()
    window.addEventListener('resize', this.handleResize)
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose()
    }
    if (this.updateTimer) {
      clearInterval(this.updateTimer)
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
          axisPointer: {
            type: 'shadow'
          },
          backgroundColor: 'rgba(11, 19, 42, 0.9)',
          borderColor: '#1e3a8a',
          textStyle: {
            color: '#ffffff'
          },
          formatter: (params) => {
            const data = params[0]
            const timeRangeText = this.getTimeRangeText()
            return `${data.name}<br/>${timeRangeText}：${data.value}辆`
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '10%',
          containLabel: true
        },
        xAxis: {
          type: 'value',
          axisLine: {
            lineStyle: {
              color: '#1e3a8a'
            }
          },
          axisLabel: {
            color: '#94a3b8',
            fontSize: 12,
            formatter: '{value}辆'
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(30, 58, 138, 0.3)'
            }
          }
        },
        yAxis: {
          type: 'category',
          data: this.chartData.names,
          axisLine: {
            lineStyle: {
              color: '#1e3a8a'
            }
          },
          axisLabel: {
            color: '#94a3b8',
            fontSize: 11,
            formatter: (value) => {
              // 截断过长的通道名称
              return value.length > 8 ? value.substring(0, 8) + '...' : value
            }
          }
        },
        series: [
          {
            name: this.channelType === 'entry' ? '进车数量' : '出车数量',
            type: 'bar',
            data: this.chartData.vehicleCounts.map((value, index) => ({
              value,
              itemStyle: {
                color: this.getBarColor(index)
              }
            })),
            barWidth: '60%',
            label: {
              show: true,
              position: 'right',
              color: '#ffffff',
              fontSize: 12,
              formatter: '{c}辆'
            }
          }
        ]
      }
      
      this.chart.setOption(option)
    },
    
    getBarColor(index) {
      // 根据通道索引返回不同颜色，循环使用颜色数组
      return this.channelColors[index % this.channelColors.length]
    },
    
    handleResize() {
      if (this.chart) {
        this.chart.resize()
      }
    },
    
    startDynamicUpdate() {
      // 每3秒更新一次使用率数据
      this.updateTimer = setInterval(() => {
        this.updateDynamicData()
      }, 3000)
    },
    
    updateDynamicData() {
      if (!this.chart) return
      
      // 生成动态的车辆数量数据，并保持排序
      const dynamicData = this.chartData.names.map((name, index) => {
        const originalVehicleCount = this.chartData.vehicleCounts[index]
        // 在原有基础上增加随机变化，变化幅度为±5%
        const variation = (Math.random() - 0.5) * 0.1 // -5% 到 +5%
        const newValue = Math.max(0, Math.round(originalVehicleCount * (1 + variation)))
        return {
          name,
          vehicleCount: newValue
        }
      })
      
      // 按车辆数量从高到低重新排序，然后反转让高的在上方
      const sortedData = dynamicData.sort((a, b) => b.vehicleCount - a.vehicleCount).reverse()
      
      // 更新图表数据
      this.chart.setOption({
        yAxis: {
          data: sortedData.map(item => item.name)
        },
        series: [{
          data: sortedData.map((item, index) => ({
            value: item.vehicleCount,
            itemStyle: {
              color: this.getBarColor(index)
            }
          }))
        }]
      })
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
  },
  watch: {
    channelsData: {
      handler() {
        if (this.chart) {
          this.chart.setOption({
            yAxis: {
              data: this.chartData.names
            },
            series: [{
              data: this.chartData.vehicleCounts.map((value, index) => ({
                value,
                itemStyle: {
                  color: this.getBarColor(index)
                }
              }))
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
.channel-utilization-chart {
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
    margin-top: -15px;
    width: 100%;
    flex: 1;
    min-height: 150px;
  }
}
</style>
