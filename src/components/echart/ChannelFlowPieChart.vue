<template>
  <div class="chart-container">
    <div class="chart-header">
      <div class="header-left">
        <h3>📊 {{ showDetail ? (channelType === 'entry' ? '进口通道进车数量' : '出口通道出车数量') : '进出口车辆统计' }}</h3>
        <div class="chart-subtitle" v-if="showDetail">
          {{ channelType === 'entry' ? '各进口通道进车数量详情' : '各出口通道出车数量详情' }}
        </div>
      </div>
    </div>
    <div ref="chartRef" class="chart-content"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { vehicleFlowDataService } from "@/services/vehicleFlowDataService.js";

export default {
  name: 'ChannelFlowPieChart',
  props: {
    channelsData: {
      type: Array,
      default: () => []
    },
    channelData: {
      type: Object,
      default: () => ({})
    },
    showDetail: {
      type: Boolean,
      default: false
    },
    channelType: {
      type: String,
      default: 'entry'
    },
    selectedTimeRange: {
      type: String,
      default: 'daily'
    }
  },
  data() {
    return {
      chart: null,
      localTimeRange: this.selectedTimeRange,
      vehicleFlowData: null,
      loading: false,
      refreshTimer: null
    }
  },
  async mounted() {
    await this.loadData();
    this.$nextTick(() => {
      this.initChart()
      this.updateChart()
    })
    window.addEventListener('resize', this.handleResize)
    // 设置定时刷新，每5秒刷新一次数据
    this.refreshTimer = setInterval(async () => {
      await this.loadData();
      this.updateChart();
    }, 1000);
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose()
    }
    window.removeEventListener('resize', this.handleResize)
    // 清除定时器
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
      this.refreshTimer = null;
    }
  },
  watch: {
    channelsData: {
      handler() {
        this.updateChart()
      },
      deep: true
    },
    channelData: {
      handler() {
        this.updateChart()
      },
      deep: true
    }
  },
  methods: {
    async loadData() {
      this.loading = true;
      try {
        this.vehicleFlowData = await vehicleFlowDataService.getVehicleFlowData(this.localTimeRange);
      } catch (error) {
        console.error('加载车辆流量数据失败:', error);
      } finally {
        this.loading = false;
      }
    },

    async onTimeRangeChange() {
      this.localTimeRange = this.selectedTimeRange;
      await this.loadData();
      this.updateChart();
      this.$emit('timeRangeChange', this.localTimeRange);
    },

    initChart() {
      this.chart = echarts.init(this.$refs.chartRef)
    },
    
    updateChart() {
      if (!this.chart) return
      
      // 优先使用车辆流量数据
      let dataSource = null;
      
      if (this.vehicleFlowData && this.vehicleFlowData.channelStats) {
        // 使用新的车辆流量数据
        dataSource = this.vehicleFlowData.channelStats.map(stat => ({
          name: stat.name,
          type: stat.name.includes('入口') ? '进口' : '出口',
          flow: stat.total || (stat.entry + stat.exit),  // 使用 total 或计算值
          entry: stat.entry,
          exit: stat.exit
        }));
      } else if (this.channelsData && this.channelsData.length) {
        // 使用传入的channelsData
        dataSource = this.channelsData;
      } else if (this.channelData) {
        // 如果channelData是数组，直接使用
        if (Array.isArray(this.channelData)) {
          dataSource = this.channelData;
        }
        // 如果channelData是对象且有channels属性，使用channels
        else if (this.channelData.channels) {
          dataSource = this.channelData.channels;
        }
      }
      
      // 如果仍然没有数据，显示空状态
      if (!dataSource || !dataSource.length) {
        this.showEmptyState()
        return
      }
      
      // 处理数据，确保 entry 和 exit 字段存在
      const processedData = dataSource.map((channel, index) => {
        // 确保 entry 和 exit 字段存在，如果没有则使用默认值0
        const entry = channel.entry !== undefined ? channel.entry : 0;
        const exit = channel.exit !== undefined ? channel.exit : 0;
        
        // 计算 flow，优先使用已有的值，否则使用 entry + exit
        let vehicleCount = channel.flow || channel.vehicleCount || (entry + exit);
        
        // 如果仍然没有值，使用基于索引的确定性值（而不是随机值）
        if (!vehicleCount || vehicleCount === 0) {
          const timeMultiplier = this.getTimeMultiplier();
          const baseCount = channel.type === '进口' ? 120 : 100;
          // 使用索引而不是随机数，确保每次刷新数据一致
          const variation = (index % 50) + 20; // 20-69的确定性变化
          vehicleCount = Math.floor((baseCount + variation) * timeMultiplier);
        }
        
        return {
          ...channel,
          entry: entry,
          exit: exit,
          flow: vehicleCount,
          vehicleCount: vehicleCount
        }
      })
      
      let data = []
      
      if (this.showDetail) {
        // 详细模式：显示指定类型通道的各个通道占比
        const targetType = this.channelType === 'entry' ? '进口' : '出口'
        const targetChannels = processedData.filter(channel => channel.type === targetType)
        
        // 按流量排序，显示所有通道
        const sortedChannels = targetChannels
          .sort((a, b) => (b.flow || 0) - (a.flow || 0))
        
        const colors = [
          '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4',
          '#f97316', '#84cc16', '#ec4899', '#14b8a6',
          '#6366f1', '#22c55e', '#ef4444', '#3b82f6',
          '#fbbf24', '#34d399'
        ]
        
        data = sortedChannels.map((channel, index) => ({
          name: channel.name,
          value: channel.flow || 0,
          itemStyle: {
            color: colors[index % colors.length]
          },
          channelType: this.channelType,
          channelName: channel.name
        }))
      } else {
        // 总览模式：显示进口和出口的总流量对比
        // 正确的统计方式：所有通道的entry之和作为进口流量，所有通道的exit之和作为出口流量
        // 不能按通道名称分类，因为一个通道可能既有进又有出
        
        // 计算进口和出口的总流量，确保使用正确的字段
        const entryTotalFlow = processedData.reduce((sum, channel) => {
          const entry = channel.entry !== undefined ? channel.entry : 0;
          return sum + entry;
        }, 0);
        
        const exitTotalFlow = processedData.reduce((sum, channel) => {
          const exit = channel.exit !== undefined ? channel.exit : 0;
          return sum + exit;
        }, 0);
        
        // 添加调试日志
        console.log('📊 [进出口统计] 数据源:', {
          dataSourceLength: dataSource.length,
          processedDataLength: processedData.length,
          entryTotalFlow,
          exitTotalFlow,
          sampleChannel: processedData[0]
        });
        
        // 统计实际有数据的通道数量
        const entryChannelCount = processedData.filter(ch => ch.entry > 0).length
        const exitChannelCount = processedData.filter(ch => ch.exit > 0).length
        
        if (entryTotalFlow > 0) {
          data.push({
            name: '进口通道',
            value: entryTotalFlow,
            itemStyle: {
              color: '#10b981' // 绿色表示进口
            },
            channelType: 'entry',
            channelCount: entryChannelCount
          })
        }
        
        if (exitTotalFlow > 0) {
          data.push({
            name: '出口通道',
            value: exitTotalFlow,
            itemStyle: {
              color: '#f59e0b' // 橙色表示出口
            },
            channelType: 'exit',
            channelCount: exitChannelCount
          })
        }
      }
      
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(11, 19, 42, 0.9)',
          borderColor: '#1e3a8a',
          textStyle: {
            color: '#ffffff'
          },
          formatter: (params) => {
            if (this.showDetail) {
              const timeRange = this.selectedTimeRange || this.localTimeRange
              const timeUnit = this.getTimeUnit(timeRange)
              return `${params.name}<br/>进车数量: ${params.value}辆${timeUnit}<br/>占比: ${params.percent}%`
            } else {
              const timeRange = this.selectedTimeRange || this.localTimeRange
              const timeUnit = this.getTimeUnit(timeRange)
              return `${params.name}<br/>总车辆数: ${params.value}辆${timeUnit}<br/>通道数量: ${params.data.channelCount}个<br/>占比: ${params.percent}%`
            }
          }
        },
        legend: {
          orient: 'vertical',
          left: 10,
          top: 'center',
          textStyle: {
            color: '#94a3b8',
            fontSize: 11
          },
          itemWidth: 10,
          itemHeight: 6
        },
        series: [
          {
            type: 'pie',
            radius: '70%',
            center: ['55%', '50%'],
            avoidLabelOverlap: false,
            itemStyle: {
              borderRadius: 8,
              borderColor: 'rgba(11, 19, 42, 0.8)',
              borderWidth: 2
            },
            label: {
              show: true,
              position: 'inside',
              color: '#ffffff',
              fontSize: 14,
              fontWeight: 'bold',
              lineHeight: 24,
              textShadowColor: 'rgba(0,0,0,0.5)',
              textShadowBlur: 6,
              formatter: (params) => {
                const timeRange = this.selectedTimeRange || this.localTimeRange
                const unit = this.getTimeUnit(timeRange)
                if (this.showDetail) {
                  // 详细模式：仅显示数量与占比（去除第一行名称）
                  return `${params.value} 辆\n ${params.percent}%`
                } else {
                  // 总览模式：仅显示数量与占比（去除标题）
                  return `${params.value} 辆\n ${params.percent}%`
                }
              }
            },
            emphasis: {
              label: {
                show: true,
                fontSize: 16,
                fontWeight: 'bold',
                color: '#ffffff'
              },
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)',
                borderColor: '#ffffff',
                borderWidth: 2
              }
            },
            labelLine: {
              show: false
            },
            data: data,
            animationType: 'scale',
            animationEasing: 'elasticOut',
            animationDelay: (idx) => Math.random() * 200
          }
        ]
      }
      
      this.chart.setOption(option)
      
      // 添加点击事件监听（仅在总览模式下）
      this.chart.off('click')
      if (!this.showDetail) {
        this.chart.on('click', this.handleChartClick)
      }
    },
    
    showEmptyState() {
      const option = {
        backgroundColor: 'transparent',
        graphic: {
          type: 'text',
          left: 'center',
          top: 'middle',
          style: {
            text: '暂无数据',
            fontSize: 16,
            fill: '#94a3b8'
          }
        }
      }
      this.chart.setOption(option)
      
      // 添加点击事件监听（仅在总览模式下）
      this.chart.off('click')
      if (!this.showDetail) {
        this.chart.on('click', this.handleChartClick)
      }
    },
    
    handleResize() {
      if (this.chart) {
        this.chart.resize()
      }
    },
    
    getChannelColor(index) {
      const colors = [
        '#10b981', '#f59e0b', '#8b5cf6', '#06b6d4',
        '#f97316', '#84cc16', '#ec4899', '#14b8a6'
      ]
      return colors[index % colors.length]
    },
    
    handleChartClick(params) {
      // 点击饼图时触发父组件事件
      console.log('点击了饼图数据:', params)
      console.log('showDetail状态:', this.showDetail)
      console.log('params.data:', params.data)
      
      // 从点击的数据中获取通道类型
      const channelType = params.data.channelType
      console.log('获取到的channelType:', channelType)
      
      // 触发父组件事件
      console.log('准备触发channelClick事件')
      this.$emit('channelClick', channelType)
      console.log('channelClick事件已触发')
    },
    
    // 时间范围变化处理
    onTimeRangeChange() {
      console.log('饼图时间范围切换为:', this.localTimeRange)
      // 通知父组件时间范围变化
      this.$emit('timeRangeChange', this.localTimeRange)
      // 更新图表数据
      this.updateChart()
    },
    
    // 根据时间维度获取数量倍数
    getTimeMultiplier() {
      const timeRange = this.selectedTimeRange || this.localTimeRange
      switch (timeRange) {
        case 'today':
          return 1 // 今日：基础数量
        case 'week':
          return 7 // 本周：7倍
        case 'month':
          return 30 // 本月：30倍
        case 'year':
          return 365 // 本年：365倍
        default:
          return 1
      }
    },
    
    // 根据时间维度获取时间单位
    getTimeUnit(timeRange) {
      switch (timeRange) {
        case 'today':
          return '/日'
        case 'week':
          return '/周'
        case 'month':
          return '/月'
        case 'year':
          return '/年'
        default:
          return '/日'
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.chart-container {
  height: 100%;
  // background: rgba(11, 19, 42, 0.6);
  border-radius: 8px;
  padding: 15px;
  border: 1px solid #1e3a8a;
  
  .chart-header {
    margin-bottom: 15px;
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    
    .header-left {
      flex: 1;
      
      h3 {
        margin: 0 0 5px 0;
        font-size: 16px;
        color: #ffffff;
        font-weight: bold;
      }
      
      .chart-subtitle {
        font-size: 12px;
        color: #94a3b8;
        
        .click-hint {
          color: #3b82f6;
          font-size: 11px;
          opacity: 0.8;
        }
      }
    }
    
    .header-right {
      display: flex;
      align-items: center;
      
      .time-selector {
        .time-select {
          background: rgba(11, 19, 42, 0.9);
          border: 1px solid #1e3a8a;
          border-radius: 6px;
          color: #ffffff;
          padding: 6px 12px;
          font-size: 12px;
          cursor: pointer;
          transition: all 0.3s ease;
          min-width: 80px;
          
          &:hover {
            border-color: #3b82f6;
            box-shadow: 0 0 8px rgba(59, 130, 246, 0.3);
          }
          
          &:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 12px rgba(59, 130, 246, 0.4);
          }
          
          option {
            background: #0b132a;
            color: #ffffff;
          }
        }
      }
    }
  }
  
  .chart-content {
    height: calc(100% - 50px);
    overflow: hidden; // 去除滚动条
  }
}
</style>