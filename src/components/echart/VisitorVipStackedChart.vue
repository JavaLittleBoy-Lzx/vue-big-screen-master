<template>
  <div class="visitor-vip-stacked-chart">
    <div class="chart-header">
      <div class="title">📊 访客与VIP车辆进出统计分析</div>
    </div>
    
     <!-- 图例 -->
     <div class="chart-legend">
       <div class="legend-item" :class="{ disabled: !seriesVisibility.visitorEntry }" @click="toggleSeries('visitorEntry')">
         <div class="legend-color visitor-entry"></div>
         <span class="legend-text">访客进场</span>
       </div>
       <div class="legend-item" :class="{ disabled: !seriesVisibility.visitorExit }" @click="toggleSeries('visitorExit')">
         <div class="legend-color visitor-exit"></div>
         <span class="legend-text">访客出场</span>
       </div>
       <div class="legend-item" :class="{ disabled: !seriesVisibility.vipEntry }" @click="toggleSeries('vipEntry')">
         <div class="legend-color vip-entry"></div>
         <span class="legend-text">VIP进场</span>
       </div>
       <div class="legend-item" :class="{ disabled: !seriesVisibility.vipExit }" @click="toggleSeries('vipExit')">
         <div class="legend-color vip-exit"></div>
         <span class="legend-text">VIP出场</span>
       </div>
     </div>
    
    <div class="chart-container" ref="chartContainer">
      <div id="visitorVipChart" class="chart"></div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { visitorVipDataService } from '@/services/visitorVipDataService'

export default {
  name: 'VisitorVipStackedChart',
   data() {
     return {
       chart: null,
       chartData: {
         hours: [],
         visitorEntry: [],
         visitorExit: [],
         vipEntry: [],
         vipExit: []
       },
       seriesVisibility: {
         visitorEntry: true,
         visitorExit: true,
         vipEntry: true,
         vipExit: true
       }
     }
   },
  mounted() {
    this.initChart()
    this.loadData()
    this.startDataUpdate()
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose()
    }
  },
  methods: {
    initChart() {
      this.chart = echarts.init(document.getElementById('visitorVipChart'))
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
    
    // 加载数据
    async loadData() {
      try {
        // console.log('🔄 [堆叠图表] 开始加载数据...')
        const data = await visitorVipDataService.getVisitorVipData('daily', '东北林业大学')
        // console.log('📊 [堆叠图表] 获取到数据:', data)
        
        if (data && data.hourlyData) {
          this.processData(data.hourlyData)
        } else {
          // console.warn('⚠️ [堆叠图表] 数据格式异常，使用模拟数据')
          // this.generateHourlyData()
        }
      } catch (error) {
        console.error('❌ [堆叠图表] 数据加载失败:', error)
        console.log('🔄 [堆叠图表] 降级到模拟数据')
        // this.generateHourlyData()
      }
    },
    
    // 处理从后端获取的数据
    processData(hourlyData) {
      const hours = []
      const visitorEntry = []
      const visitorExit = []
      const vipEntry = []
      const vipExit = []
      
      hourlyData.forEach(item => {
        hours.push(item.hour)
        visitorEntry.push(item.visitorEntry || 0)
        visitorExit.push(item.visitorExit || 0)
        vipEntry.push(item.vipEntry || 0)
        vipExit.push(item.vipExit || 0)
      })
      
      this.chartData = {
        hours,
        visitorEntry,
        visitorExit,
        vipEntry,
        vipExit
      }
      
      console.log('✅ [堆叠图表] 数据处理完成:', this.chartData)
      this.updateChart()
    },
    
    updateChart() {
      if (!this.chart) return
      
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: '#3b82f6',
          borderWidth: 1,
          textStyle: { color: '#fff' },
          formatter: (params) => {
            let result = `${params[0].axisValue}<br/>`
            params.forEach(param => {
              result += `${param.marker} ${param.seriesName}: ${param.value}<br/>`
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
          axisLine: { lineStyle: { color: '#64748b' } },
          axisLabel: { 
            color: '#94a3b8', 
            fontSize: 10,
            interval: 1  // 调整为每隔1个标签显示，让5:00-24:00的标签更清晰
          },
          axisTick: { show: false }
        },
        yAxis: {
          type: 'value',
          axisLine: { lineStyle: { color: '#64748b' } },
          axisLabel: { color: '#94a3b8', fontSize: 10 },
          splitLine: { lineStyle: { color: 'rgba(100, 116, 139, 0.2)' } }
        },
         series: [
           {
             name: '访客进场',
             type: 'bar',
             stack: 'total',
             barWidth: '55%', // 增加柱子宽度到55%，减少间距
             data: this.seriesVisibility.visitorEntry ? this.chartData.visitorEntry : [],
             itemStyle: { 
               color: '#00d4aa',
               barBorderRadius: [0, 0, 0, 0]
             }
           },
           {
             name: 'VIP进场',
             type: 'bar',
             stack: 'total',
             barWidth: '55%', // 增加柱子宽度到55%，减少间距
             data: this.seriesVisibility.vipEntry ? this.chartData.vipEntry : [],
             itemStyle: { 
               color: '#3b82f6',
               barBorderRadius: [0, 0, 0, 0]
             }
           },
           {
             name: '访客出场',
             type: 'bar',
             stack: 'total',
             barWidth: '55%', // 增加柱子宽度到55%，减少间距
             data: this.seriesVisibility.visitorExit ? this.chartData.visitorExit : [],
             itemStyle: { 
               color: '#f59e0b',
               barBorderRadius: [0, 0, 0, 0]
             }
           },
           {
             name: 'VIP出场',
             type: 'bar',
             stack: 'total',
             barWidth: '55%', // 增加柱子宽度到55%，减少间距
             data: this.seriesVisibility.vipExit ? this.chartData.vipExit : [],
             itemStyle: { 
               color: '#ef4444',
               barBorderRadius: [4, 4, 0, 0]
             }
           }
         ]
      }
      
      this.chart.setOption(option)
    },
    
    handleChartClick(params) {
      // 点击图表时触发父组件弹窗显示
      console.log('点击了图表数据:', params)
      
      // 根据点击的系列确定类型
      let type = '进场'
      if (params.seriesName.includes('出场')) {
        type = '离场'
      }
      
      this.$emit('chart-click', {
        hour: params.name,
        entry: Math.abs(params.value), // 确保传递正值
        type: type
      })
     },
     
     toggleSeries(seriesName) {
       this.seriesVisibility[seriesName] = !this.seriesVisibility[seriesName]
       this.updateChart()
     },
     
     startDataUpdate() {
       // 每30秒更新一次数据
       setInterval(() => {
         this.loadData()
       }, 30000)
     }
  }
}
</script>

<style lang="scss" scoped>
.visitor-vip-stacked-chart {
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
    margin-left: -200px;
    font-size: 16px;
    font-weight: bold;
    margin-bottom: 5px;
  }
}

.chart-container {
  flex: 1;
  position: relative;
  
  .chart {
    margin-left: -40px;
    margin-top: -45px;
    width: 480px; // 减小宽度从540px到480px
    height: 340px;
    min-height: 100px;
  }
}

.chart-legend {
  display: flex;
  justify-content: center;
  gap: 15px;
  margin-bottom: 10px;
  margin-top: -5px;
  flex-wrap: wrap;
  
   .legend-item {
     display: flex;
     align-items: center;
     gap: 6px;
     cursor: pointer;
     transition: opacity 0.3s ease;
     
     &:hover {
       opacity: 0.8;
     }
     
     &.disabled {
       opacity: 0.3;
       
       .legend-text {
         text-decoration: line-through;
       }
     }
     
     .legend-color {
       width: 12px;
       height: 12px;
       border-radius: 2px;
       
       &.visitor-entry {
         background: #00d4aa;
       }
       
       &.visitor-exit {
         background: #f59e0b;
       }
       
       &.vip-entry {
         background: #3b82f6;
       }
       
       &.vip-exit {
         background: #ef4444;
       }
     }
     
     .legend-text {
       font-size: 11px;
       color: #B4B4B4;
     }
   }
}
</style>

