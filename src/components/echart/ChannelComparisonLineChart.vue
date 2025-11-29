<template>
  <div class="chart-container">
    <div class="chart-header">
      <h3>{{ channelType === 'entry' ? '进口通道进车数量' : '出口通道出车数量' }}</h3>
      <div class="chart-subtitle">各通道流量趋势对比</div>
    </div>
    <div ref="chartRef" class="chart-content"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'ChannelComparisonLineChart',
  props: {
    channelData: {
      type: Object,
      default: () => ({})
    },
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
      activeTab: 'combined'
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
    },
    activeTab: {
      handler() {
        this.updateChart()
      }
    }
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$refs.chartRef)
    },
    
    getYAxisName() {
      // 根据时间范围返回不同的Y轴单位
      switch (this.selectedTimeRange) {
        case 'today':
          return '车辆数量 (辆/小时)'
        case 'week':
          return '车辆数量 (辆/天)'
        case 'month':
          return '车辆数量 (辆/天)'
        case 'year':
          return '车辆数量 (辆/月)'
        default:
          return '车辆数量 (辆/小时)'
      }
    },
    
    updateChart() {
      if (!this.chart) return
      
      // 根据时间范围生成不同的时间数据
      let timeLabels = []
      let timeCount = 0
      
      switch (this.selectedTimeRange) {
        case 'today':
          timeLabels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)
          timeCount = 24
          break
        case 'week':
          timeLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
          timeCount = 7
          break
        case 'month':
          timeLabels = Array.from({ length: 30 }, (_, i) => `${i + 1}日`)
          timeCount = 30
          break
        case 'year':
          timeLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
          timeCount = 12
          break
        default:
          timeLabels = Array.from({ length: 24 }, (_, i) => `${i.toString().padStart(2, '0')}:00`)
          timeCount = 24
      }
      
      // 获取所有通道的数据，按流量排序
      const topChannels = [...this.channelsData]
        .sort((a, b) => {
          // 优先使用真实数据排序
          const aTotal = (a.entry || 0) + (a.exit || 0) || (a.flow || 0)
          const bTotal = (b.entry || 0) + (b.exit || 0) || (b.flow || 0)
          return bTotal - aTotal
        })
      
      // 生成流量数据（仅使用真实数据）
      const generateFlowData = (channel) => {
        // 使用真实的每小时数据
        if (channel.hourlyData && Array.isArray(channel.hourlyData) && channel.hourlyData.length > 0) {
          return timeLabels.map((timeLabel, index) => {
            // hourlyData 是按小时排序的数组，直接通过索引访问
            const hourlyData = channel.hourlyData[index]
            if (hourlyData) {
              // 根据通道类型选择使用entry或exit数据
              let value = 0;
              if (this.channelType === 'entry') {
                value = hourlyData.entry || 0
              } else if (this.channelType === 'exit') {
                value = hourlyData.exit || 0
              } else {
                value = (hourlyData.entry || 0) + (hourlyData.exit || 0)
              }
              return value
            }
            return 0
          })
        }
        
        // 如果没有 hourlyData，返回全0数据
        return timeLabels.map(() => 0)
      }
      
      // 生成使用率趋势数据（基于真实流量数据计算）
      const generateUtilizationData = (channel) => {
        // 如果有真实的 hourlyData，基于真实数据计算使用率趋势
        if (channel.hourlyData && Array.isArray(channel.hourlyData) && channel.hourlyData.length > 0) {
          // 找出最大流量值，用于计算百分比
          const maxFlow = Math.max(...channel.hourlyData.map(h => {
            if (this.channelType === 'entry') {
              return h.entry || 0
            } else if (this.channelType === 'exit') {
              return h.exit || 0
            } else {
              return (h.entry || 0) + (h.exit || 0)
            }
          }))
          
          // 如果最大流量为0，返回全0数据
          if (maxFlow === 0) {
            return timeLabels.map(() => 0)
          }
          
          // 计算每个时间点的使用率百分比（相对于最大值）
          return timeLabels.map((_, index) => {
            const hourlyData = channel.hourlyData[index]
            if (hourlyData) {
              let value = 0;
              if (this.channelType === 'entry') {
                value = hourlyData.entry || 0
              } else if (this.channelType === 'exit') {
                value = hourlyData.exit || 0
              } else {
                value = (hourlyData.entry || 0) + (hourlyData.exit || 0)
              }
              return Math.round((value / maxFlow) * 100)
            }
            return 0
          })
        }
        
        // 如果没有 hourlyData，返回全0数据
        return timeLabels.map(() => 0)
      }
      
      const series = []
      // 优化后的高对比度颜色方案
      const colors = [
        '#00f5ff', // 亮青色 - 高亮度
        '#ff6b35', // 橙红色 - 暖色调
        '#00ff88', // 亮绿色 - 高饱和度
        '#ffd700', // 金黄色 - 明亮
        '#ff1493', // 深粉色 - 高对比
        '#00bfff', // 深天蓝 - 与青色区分
        '#ff4500', // 橙红色 - 与第一个橙红区分
        '#32cd32', // 酸橙绿 - 与绿色区分
        '#ff69b4', // 热粉色 - 高亮度
        '#1e90ff', // 道奇蓝 - 与天蓝区分
        '#ffa500', // 橙色 - 明亮
        '#da70d6'  // 兰花紫 - 与粉色区分
      ]
      
      // 组合模式：同时显示柱状图和折线图
      // 添加流量柱状图
      const dataTypeName = this.channelType === 'entry' ? '进场数量' : '出场数量'
      topChannels.forEach((channel, index) => {
        series.push({
          name: `${channel.name}-${dataTypeName}`,
          type: 'bar',
          yAxisIndex: 0,
          data: generateFlowData(channel),
          itemStyle: {
            color: colors[index] + 'B0', // 提高透明度从80到B0，让颜色更亮
            borderRadius: [2, 2, 0, 0]
          },
          emphasis: {
            itemStyle: {
              color: colors[index],
              shadowBlur: 15,
              shadowColor: colors[index] + '80' // 增强阴影效果
            }
          }
        })
      })
      
      // 添加流量折线图
      topChannels.forEach((channel, index) => {
        series.push({
          name: `${channel.name}-流量趋势`,
          type: 'line',
          yAxisIndex: 1,
          data: generateUtilizationData(channel),
          smooth: true,
          lineStyle: {
            color: colors[index],
            width: 4 // 增加线条宽度，提高可见性
          },
          itemStyle: {
            color: colors[index],
            borderColor: '#ffffff', // 添加白色边框，提高对比度
            borderWidth: 2
          },
          symbol: 'circle',
          symbolSize: 8, // 增大符号尺寸
          emphasis: {
            focus: 'series'
          }
        })
      })
      
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'cross',
            crossStyle: {
              color: '#999'
            }
          },
          backgroundColor: 'rgba(11, 19, 42, 0.9)',
          borderColor: '#1e3a8a',
          textStyle: {
            color: '#ffffff'
          }
        },
        legend: {
          data: series.map(s => s.name),
          textStyle: {
            color: '#e2e8f0', // 更亮的文字颜色
            fontSize: 12, // 稍微增大字体
            fontWeight: 'bold' // 加粗字体
          },
          top: 10,
          type: 'scroll',
          pageButtonItemGap: 5,
          pageButtonPosition: 'end',
          pageFormatter: '{current}/{total}',
          pageIcons: {
            horizontal: ['M0,0L12,0L6,6z', 'M0,6L12,6L6,0z']
          },
          itemGap: 15, // 增加图例项之间的间距
          itemWidth: 20, // 增加图例标记的宽度
          itemHeight: 14 // 增加图例标记的高度
        },
        grid: {
          left: '3%',
          right: '1%', // 增加右侧间距，为右侧Y轴和数据显示留出更多空间
          bottom: '3%',
          top: '20%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: timeLabels,
          axisLine: {
            lineStyle: {
              color: '#1e3a8a'
            }
          },
          axisLabel: {
            color: '#94a3b8',
            fontSize: 10
          },
          axisTick: {
            alignWithLabel: true
          }
        },
        yAxis: [
          {
            type: 'value',
            name: this.getYAxisName(),
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
            name: '流量趋势 (%)',
            position: 'right',
            axisLine: {
              lineStyle: {
                color: '#10b981'
              }
            },
            axisLabel: {
              color: '#94a3b8',
              formatter: '{value}%'
            },
            splitLine: {
              show: false
            }
          }
        ],
        series: series,
        animationDuration: 2000,
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
  width: 1765px;
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
    // width: 1800px;
    height: calc(100% - 50px); // 减去标题高度
  }
}
</style>
