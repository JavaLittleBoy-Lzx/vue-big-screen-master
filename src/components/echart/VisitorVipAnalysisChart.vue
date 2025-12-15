<template>
  <div class="visitor-vip-analysis">
    <!-- 整体统计区域 -->
    <div class="overview-section">
      <div class="chart-header">
        <h3 class="chart-title">
          <span class="title-icon">📊</span>
          访客与校内车辆车辆进出统计
        </h3>
        <div class="time-selector">
          <button 
            v-for="option in timeOptions" 
            :key="option.value" 
            @click="selectedTimeRange = option.value"
            :class="['time-btn', { active: selectedTimeRange === option.value }]"
          >
            {{ option.label }}
          </button>
        </div>
      </div>
      
      <!-- 整体堆积柱状图 -->
      <div class="main-chart-container">
        <div ref="mainChart" class="chart"></div>
      </div>
      
      <!-- 统计卡片 -->
      <div class="unified-kpi-section">
        <div class="vehicle-kpi-card visitor-entry">
          <div class="kpi-header">
            <span class="kpi-icon">🚗</span>
            <span class="kpi-title">访客进场</span>
          </div>
          <div class="kpi-value">{{ formatNumber(overviewStats.visitorEntry) }}</div>
          <div class="kpi-unit">车次</div>
        </div>
        
        <div class="vehicle-kpi-card visitor-exit">
          <div class="kpi-header">
            <span class="kpi-icon">🚙</span>
            <span class="kpi-title">访客出场</span>
          </div>
          <div class="kpi-value">{{ formatNumber(overviewStats.visitorExit) }}</div>
          <div class="kpi-unit">车次</div>
        </div>
        
        <div class="vehicle-kpi-card vip-entry">
          <div class="kpi-header">
            <span class="kpi-icon">⭐</span>
            <span class="kpi-title">校内车辆进场</span>
          </div>
          <div class="kpi-value">{{ formatNumber(overviewStats.vipEntry) }}</div>
          <div class="kpi-unit">车次</div>
        </div>
        
        <div class="vehicle-kpi-card vip-exit">
          <div class="kpi-header">
            <span class="kpi-icon">💎</span>
            <span class="kpi-title">校内车辆出场</span>
          </div>
          <div class="kpi-value">{{ formatNumber(overviewStats.vipExit) }}</div>
          <div class="kpi-unit">车次</div>
        </div>
      </div>
    </div>

    <!-- 详细分析区域 -->
    <div class="detail-section" v-if="showDetail">
      <div class="detail-header">
        <h4 class="detail-title">详细类型分析</h4>
        <button @click="showDetail = false" class="close-btn">×</button>
      </div>
      
      <div class="detail-charts">
        <!-- 校内车辆类型分析 -->
        <div class="chart-group">
          <div class="group-title">校内车辆类型分布</div>
          <div class="charts-row">
            <div class="chart-item">
              <div ref="vipPieChart" class="chart"></div>
            </div>
            <div class="chart-item">
              <div ref="vipBarChart" class="chart"></div>
            </div>
          </div>
        </div>
        
        <!-- 访客类型分析 -->
        <div class="chart-group">
          <div class="group-title">访客类型分布</div>
          <div class="charts-row">
            <div class="chart-item">
              <div ref="visitorPieChart" class="chart"></div>
            </div>
            <div class="chart-item">
              <div ref="visitorBarChart" class="chart"></div>
            </div>
          </div>
        </div>
        
        <!-- 进出对比分析 -->
        <div class="chart-group">
          <div class="group-title">进出对比分析</div>
          <div class="charts-row">
            <div class="chart-item full-width">
              <div ref="comparisonChart" class="chart"></div>
            </div>
          </div>
        </div>
        
        <!-- 趋势分析 -->
        <div class="chart-group">
          <div class="group-title">趋势分析</div>
          <div class="charts-row">
            <div class="chart-item full-width">
              <div ref="trendChart" class="chart"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'
import { visitorVipDataService } from '@/services/visitorVipDataService'

export default {
  name: 'VisitorVipAnalysisChart',
  props: {
    selectedHour: {
      type: String,
      default: null
    },
    selectedEntry: {
      type: Number,
      default: null
    },
    selectedType: {
      type: String,
      default: null
    }
  },
  data() {
    return {
      selectedTimeRange: 'daily',
      timeOptions: [
        { label: '今日', value: 'daily' },
        { label: '本周', value: 'weekly' },
        { label: '本月', value: 'monthly' },
        { label: '今年', value: 'yearly' }
      ],
      showDetail: false,
      overviewStats: {
        visitorEntry: 0,
        visitorExit: 0,
        vipEntry: 0,
        vipExit: 0
      },
      charts: {
        main: null,
        vipPie: null,
        vipBar: null,
        visitorPie: null,
        visitorBar: null,
        comparison: null,
        trend: null
      },
      autoRefreshTimer: null
    }
  },
  mounted() {
    this.initCharts()
    this.handleUrlParams()
    this.loadData()
    this.startAutoRefresh()
  },
  beforeDestroy() {
    this.stopAutoRefresh()
    Object.values(this.charts).forEach(chart => {
      if (chart) chart.dispose()
    })
  },
  watch: {
    selectedTimeRange() {
      this.loadData()
    }
  },
  methods: {
    handleUrlParams() {
      // 处理从主页传递的参数
      if (this.selectedHour) {
        console.log('接收到点击参数:', {
          hour: this.selectedHour,
          entry: this.selectedEntry,
          type: this.selectedType
        })
        
        // 根据点击的时间设置对应的时间范围
        if (this.selectedHour.includes(':')) {
          // 如果是具体时间（如 08:00），设置为今日
          this.selectedTimeRange = 'daily'
        } else if (this.selectedHour.includes('周')) {
          // 如果是周几，设置为本周
          this.selectedTimeRange = 'weekly'
        } else if (this.selectedHour.includes('日')) {
          // 如果是几号，设置为本月
          this.selectedTimeRange = 'monthly'
        } else if (this.selectedHour.includes('月')) {
          // 如果是几月，设置为本年
          this.selectedTimeRange = 'yearly'
        }
      }
    },

    initCharts() {
      this.$nextTick(() => {
        this.initMainChart()
        this.initDetailCharts()
      })
    },

    initMainChart() {
      if (this.$refs.mainChart) {
        this.charts.main = echarts.init(this.$refs.mainChart)
        this.charts.main.on('click', this.onMainChartClick)
      }
    },

    initDetailCharts() {
      if (this.$refs.vipPieChart) {
        this.charts.vipPie = echarts.init(this.$refs.vipPieChart)
      }
      if (this.$refs.vipBarChart) {
        this.charts.vipBar = echarts.init(this.$refs.vipBarChart)
      }
      if (this.$refs.visitorPieChart) {
        this.charts.visitorPie = echarts.init(this.$refs.visitorPieChart)
      }
      if (this.$refs.visitorBarChart) {
        this.charts.visitorBar = echarts.init(this.$refs.visitorBarChart)
      }
      if (this.$refs.comparisonChart) {
        this.charts.comparison = echarts.init(this.$refs.comparisonChart)
      }
      if (this.$refs.trendChart) {
        this.charts.trend = echarts.init(this.$refs.trendChart)
      }
    },

    async loadData() {
      try {
        const data = await this.fetchVisitorVipData()
        this.updateOverviewStats(data)
        this.updateMainChart(data)
        this.updateDetailCharts(data)
      } catch (error) {
        console.error('加载数据失败:', error)
        this.loadMockData()
      }
    },

    async fetchVisitorVipData() {
      try {
        // 调用真实的后端接口
        return await visitorVipDataService.getVisitorVipData(this.selectedTimeRange, '东北林业大学')
      } catch (error) {
        console.error('获取数据失败，使用模拟数据:', error)
        return this.getMockData()
      }
    },

    getMockData() {
      // 根据选择的时间范围生成不同的数据
      let hours, timeLabels
      
      switch (this.selectedTimeRange) {
        case 'daily':
          hours = Array.from({ length: 24 }, (_, i) => i)
          timeLabels = hours.map(hour => `${hour}:00`)
          break
        case 'weekly':
          hours = Array.from({ length: 7 }, (_, i) => i)
          timeLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日']
          break
        case 'monthly':
          // 获取当前月份的天数
          const now = new Date()
          const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate()
          hours = Array.from({ length: daysInMonth }, (_, i) => i)
          timeLabels = hours.map(day => `${day + 1}日`)
          break
        case 'yearly':
          hours = Array.from({ length: 12 }, (_, i) => i)
          timeLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月']
          break
        default:
          hours = Array.from({ length: 24 }, (_, i) => i)
          timeLabels = hours.map(hour => `${hour}:00`)
      }
      
      // 如果有传入的点击参数，调整数据以突出显示点击的时间段
      let highlightedIndex = -1
      if (this.selectedHour) {
        highlightedIndex = timeLabels.findIndex(label => label === this.selectedHour)
      }
      
      return {
        hourlyData: hours.map((_, index) => {
          // 如果是点击的时间段，使用传入的数据或增加数据量
          let visitorEntry, visitorExit, vipEntry, vipExit
          
          if (index === highlightedIndex && this.selectedEntry) {
            // 使用传入的数据
            if (this.selectedType === '进场') {
              visitorEntry = this.selectedEntry
              visitorExit = Math.floor(Math.random() * 45) + 8
              vipEntry = Math.floor(Math.random() * 20) + 5
              vipExit = Math.floor(Math.random() * 18) + 3
            } else if (this.selectedType === '离场') {
              visitorEntry = Math.floor(Math.random() * 50) + 10
              visitorExit = this.selectedEntry
              vipEntry = Math.floor(Math.random() * 20) + 5
              vipExit = Math.floor(Math.random() * 18) + 3
            } else {
              // 默认增加数据量
              visitorEntry = Math.floor(Math.random() * 50) + 30
              visitorExit = Math.floor(Math.random() * 45) + 25
              vipEntry = Math.floor(Math.random() * 20) + 15
              vipExit = Math.floor(Math.random() * 18) + 12
            }
          } else {
            // 正常数据
            visitorEntry = Math.floor(Math.random() * 50) + 10
            visitorExit = Math.floor(Math.random() * 45) + 8
            vipEntry = Math.floor(Math.random() * 20) + 5
            vipExit = Math.floor(Math.random() * 18) + 3
          }
          
          return {
            hour: timeLabels[index],
            visitorEntry,
            visitorExit,
            vipEntry,
            vipExit
          }
        }),
        vipTypes: [
          { name: '企业VIP', value: Math.floor(Math.random() * 50) + 20, entry: Math.floor(Math.random() * 25) + 10, exit: Math.floor(Math.random() * 25) + 10 },
          { name: '政府VIP', value: Math.floor(Math.random() * 40) + 15, entry: Math.floor(Math.random() * 20) + 8, exit: Math.floor(Math.random() * 20) + 8 },
          { name: '酒店VIP', value: Math.floor(Math.random() * 35) + 12, entry: Math.floor(Math.random() * 18) + 6, exit: Math.floor(Math.random() * 18) + 6 },
          { name: '商场VIP', value: Math.floor(Math.random() * 30) + 10, entry: Math.floor(Math.random() * 15) + 5, exit: Math.floor(Math.random() * 15) + 5 },
          { name: '医院VIP', value: Math.floor(Math.random() * 28) + 8, entry: Math.floor(Math.random() * 14) + 4, exit: Math.floor(Math.random() * 14) + 4 },
          { name: '学校VIP', value: Math.floor(Math.random() * 25) + 6, entry: Math.floor(Math.random() * 12) + 3, exit: Math.floor(Math.random() * 12) + 3 },
          { name: '银行VIP', value: Math.floor(Math.random() * 22) + 5, entry: Math.floor(Math.random() * 11) + 2, exit: Math.floor(Math.random() * 11) + 2 },
          { name: '其他VIP', value: Math.floor(Math.random() * 18) + 3, entry: Math.floor(Math.random() * 9) + 1, exit: Math.floor(Math.random() * 9) + 1 }
        ],
        visitorTypes: [
          { name: '临时访客', value: Math.floor(Math.random() * 150) + 50, entry: Math.floor(Math.random() * 75) + 25, exit: Math.floor(Math.random() * 75) + 25 },
          { name: '预约访客', value: Math.floor(Math.random() * 120) + 40, entry: Math.floor(Math.random() * 60) + 20, exit: Math.floor(Math.random() * 60) + 20 },
          { name: '商务访客', value: Math.floor(Math.random() * 100) + 30, entry: Math.floor(Math.random() * 50) + 15, exit: Math.floor(Math.random() * 50) + 15 },
          { name: '家庭访客', value: Math.floor(Math.random() * 80) + 25, entry: Math.floor(Math.random() * 40) + 12, exit: Math.floor(Math.random() * 40) + 12 },
          { name: '维修访客', value: Math.floor(Math.random() * 60) + 20, entry: Math.floor(Math.random() * 30) + 10, exit: Math.floor(Math.random() * 30) + 10 },
          { name: '配送访客', value: Math.floor(Math.random() * 50) + 15, entry: Math.floor(Math.random() * 25) + 8, exit: Math.floor(Math.random() * 25) + 8 },
          { name: '其他访客', value: Math.floor(Math.random() * 40) + 10, entry: Math.floor(Math.random() * 20) + 5, exit: Math.floor(Math.random() * 20) + 5 }
        ]
      }
    },

    updateOverviewStats(data) {
      const hourlyData = data.hourlyData
      this.overviewStats = {
        visitorEntry: hourlyData.reduce((sum, item) => sum + item.visitorEntry, 0),
        visitorExit: hourlyData.reduce((sum, item) => sum + item.visitorExit, 0),
        vipEntry: hourlyData.reduce((sum, item) => sum + item.vipEntry, 0),
        vipExit: hourlyData.reduce((sum, item) => sum + item.vipExit, 0)
      }
    },

    updateMainChart(data) {
      if (!this.charts.main) return

      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: '#3b82f6',
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
          data: ['访客进场', '访客出场', '校内车辆进场', '校内车辆出场'],
          textStyle: { color: '#e2e8f0' },
          top: 10
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: data.hourlyData.map(item => item.hour),
          axisLine: { lineStyle: { color: '#64748b' } },
          axisLabel: { 
            color: '#94a3b8', 
            fontSize: 10,
            rotate: this.selectedTimeRange === 'monthly' ? 45 : 0
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
            stack: 'visitor',
            data: data.hourlyData.map(item => item.visitorEntry),
            itemStyle: { color: '#3b82f6' }
          },
          {
            name: '访客出场',
            type: 'bar',
            stack: 'visitor',
            data: data.hourlyData.map(item => -item.visitorExit),
            itemStyle: { color: '#1d4ed8' }
          },
          {
            name: '校内车辆进场',
            type: 'bar',
            stack: 'vip',
            data: data.hourlyData.map(item => item.vipEntry),
            itemStyle: { color: '#f59e0b' }
          },
          {
            name: '校内车辆出场',
            type: 'bar',
            stack: 'vip',
            data: data.hourlyData.map(item => -item.vipExit),
            itemStyle: { color: '#d97706' }
          }
        ]
      }

      this.charts.main.setOption(option)
    },

    updateDetailCharts(data) {
      this.updateVipPieChart(data.vipTypes)
      this.updateVipBarChart(data.vipTypes)
      this.updateVisitorPieChart(data.visitorTypes)
      this.updateVisitorBarChart(data.visitorTypes)
      this.updateComparisonChart(data)
      this.updateTrendChart(data)
    },

    updateVipPieChart(vipTypes) {
      if (!this.charts.vipPie) return

      // 过滤掉为0的数据
      const filteredVipTypes = vipTypes.filter(item => item.value > 0)

      // 科技感配色方案
      const techColors = [
        '#00d4ff', // 科技蓝
        '#ff6b6b', // 珊瑚红
        '#4ecdc4', // 青绿色
        '#45b7d1', // 天蓝色
        '#96ceb4', // 薄荷绿
        '#feca57', // 琥珀黄
        '#ff9ff3', // 粉紫色
        '#54a0ff', // 亮蓝色
        '#5f27cd', // 紫色
        '#00d2d3', // 青色
        '#ff9f43', // 橙色
        '#10ac84'  // 深绿色
      ]

      const option = {
        backgroundColor: 'transparent',
        title: {
          text: '校内车辆类型分布',
          left: 'center',
          top: '5%',
          textStyle: { 
            color: '#e2e8f0', 
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: '#00d4ff',
          borderWidth: 1,
          textStyle: { color: '#fff' },
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        series: [{
          name: '校内车辆类型',
          type: 'pie',
          radius: ['35%', '65%'],
          center: ['50%', '55%'],
          data: filteredVipTypes.map((item, index) => ({
            value: item.value,
            name: item.name,
            itemStyle: {
              color: techColors[index % techColors.length],
              borderRadius: 8,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              shadowBlur: 10,
              shadowColor: techColors[index % techColors.length]
            }
          })),
          label: {
            show: true,
            fontSize: 10,
            color: '#e2e8f0',
            fontWeight: 'bold'
          },
          labelLine: {
            show: true,
            lineStyle: {
              color: '#64748b'
            }
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 20,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      }

      this.charts.vipPie.setOption(option)
    },

    updateVipBarChart(vipTypes) {
      if (!this.charts.vipBar) return

      // 过滤掉进场和出场都为0的数据
      const filteredVipTypes = vipTypes.filter(item => item.entry > 0 || item.exit > 0)

      const option = {
        backgroundColor: 'transparent',
        title: {
          text: '校内车辆进出对比',
          left: 'center',
          textStyle: { color: '#e2e8f0', fontSize: 14 }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        legend: {
          data: ['进场', '出场'],
          textStyle: { color: '#e2e8f0' }
        },
        xAxis: {
          type: 'category',
          data: filteredVipTypes.map(item => item.name),
          axisLabel: { 
            color: '#94a3b8', 
            fontSize: 9,
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#94a3b8', fontSize: 10 }
        },
        series: [
          {
            name: '进场',
            type: 'bar',
            data: filteredVipTypes.map(item => item.entry),
            itemStyle: { color: '#10b981' }
          },
          {
            name: '出场',
            type: 'bar',
            data: filteredVipTypes.map(item => item.exit),
            itemStyle: { color: '#ef4444' }
          }
        ]
      }

      this.charts.vipBar.setOption(option)
    },

    updateVisitorPieChart(visitorTypes) {
      if (!this.charts.visitorPie) return

      // 过滤掉为0的数据
      const filteredVisitorTypes = visitorTypes.filter(item => item.value > 0)

      // 科技感配色方案
      const techColors = [
        '#00d4ff', // 科技蓝
        '#ff6b6b', // 珊瑚红
        '#4ecdc4', // 青绿色
        '#45b7d1', // 天蓝色
        '#96ceb4', // 薄荷绿
        '#feca57', // 琥珀黄
        '#ff9ff3', // 粉紫色
        '#54a0ff', // 亮蓝色
        '#5f27cd', // 紫色
        '#00d2d3', // 青色
        '#ff9f43', // 橙色
        '#10ac84'  // 深绿色
      ]

      const option = {
        backgroundColor: 'transparent',
        title: {
          text: '访客类型分布',
          left: 'center',
          top: '5%',
          textStyle: { 
            color: '#e2e8f0', 
            fontSize: 14,
            fontWeight: 'bold'
          }
        },
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: '#00d4ff',
          borderWidth: 1,
          textStyle: { color: '#fff' },
          formatter: '{a} <br/>{b}: {c} ({d}%)'
        },
        series: [{
          name: '访客类型',
          type: 'pie',
          radius: ['35%', '65%'],
          center: ['50%', '55%'],
          data: filteredVisitorTypes.map((item, index) => ({
            value: item.value,
            name: item.name,
            itemStyle: {
              color: techColors[index % techColors.length],
              borderRadius: 8,
              borderColor: 'rgba(255, 255, 255, 0.1)',
              borderWidth: 1,
              shadowBlur: 10,
              shadowColor: techColors[index % techColors.length]
            }
          })),
          label: {
            show: true,
            fontSize: 10,
            color: '#e2e8f0',
            fontWeight: 'bold'
          },
          labelLine: {
            show: true,
            lineStyle: {
              color: '#64748b'
            }
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 20,
              shadowOffsetX: 0,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      }

      this.charts.visitorPie.setOption(option)
    },

    updateVisitorBarChart(visitorTypes) {
      if (!this.charts.visitorBar) return

      // 过滤掉进场和出场都为0的数据
      const filteredVisitorTypes = visitorTypes.filter(item => item.entry > 0 || item.exit > 0)

      const option = {
        backgroundColor: 'transparent',
        title: {
          text: '访客进出对比',
          left: 'center',
          textStyle: { color: '#e2e8f0', fontSize: 14 }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        legend: {
          data: ['进场', '出场'],
          textStyle: { color: '#e2e8f0' }
        },
        xAxis: {
          type: 'category',
          data: filteredVisitorTypes.map(item => item.name),
          axisLabel: { 
            color: '#94a3b8', 
            fontSize: 9,
            rotate: 45
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#94a3b8', fontSize: 10 }
        },
        series: [
          {
            name: '进场',
            type: 'bar',
            data: filteredVisitorTypes.map(item => item.entry),
            itemStyle: { color: '#3b82f6' }
          },
          {
            name: '出场',
            type: 'bar',
            data: filteredVisitorTypes.map(item => item.exit),
            itemStyle: { color: '#1d4ed8' }
          }
        ]
      }

      this.charts.visitorBar.setOption(option)
    },

    updateComparisonChart(data) {
      if (!this.charts.comparison) return

      const option = {
        backgroundColor: 'transparent',
        title: {
          text: '访客与校内车辆进出对比',
          left: 'center',
          textStyle: { color: '#e2e8f0', fontSize: 16 }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        legend: {
          data: ['访客进场', '访客出场', '校内车辆进场', '校内车辆出场'],
          textStyle: { color: '#e2e8f0' }
        },
        xAxis: {
          type: 'category',
          data: data.hourlyData.map(item => item.hour),
          axisLabel: { 
            color: '#94a3b8', 
            fontSize: 10,
            rotate: this.selectedTimeRange === 'monthly' ? 45 : 0
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#94a3b8', fontSize: 10 }
        },
        series: [
          {
            name: '访客进场',
            type: 'bar',
            data: data.hourlyData.map(item => item.visitorEntry),
            itemStyle: { color: '#3b82f6' }
          },
          {
            name: '访客出场',
            type: 'bar',
            data: data.hourlyData.map(item => item.visitorExit),
            itemStyle: { color: '#1d4ed8' }
          },
          {
            name: '校内车辆进场',
            type: 'bar',
            data: data.hourlyData.map(item => item.vipEntry),
            itemStyle: { color: '#f59e0b' }
          },
          {
            name: '校内车辆出场',
            type: 'bar',
            data: data.hourlyData.map(item => item.vipExit),
            itemStyle: { color: '#d97706' }
          }
        ]
      }

      this.charts.comparison.setOption(option)
    },

    updateTrendChart(data) {
      if (!this.charts.trend) return

      const option = {
        backgroundColor: 'transparent',
        title: {
          text: '进出趋势分析',
          left: 'center',
          textStyle: { color: '#e2e8f0', fontSize: 16 }
        },
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: '#3b82f6',
          textStyle: { color: '#fff' }
        },
        legend: {
          data: ['访客净流量', '校内车辆净流量', '总净流量'],
          textStyle: { color: '#e2e8f0' }
        },
        xAxis: {
          type: 'category',
          data: data.hourlyData.map(item => item.hour),
          axisLabel: { 
            color: '#94a3b8', 
            fontSize: 10,
            rotate: this.selectedTimeRange === 'monthly' ? 45 : 0
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#94a3b8', fontSize: 10 }
        },
        series: [
          {
            name: '访客净流量',
            type: 'line',
            data: data.hourlyData.map(item => item.visitorEntry - item.visitorExit),
            smooth: true,
            itemStyle: { color: '#3b82f6' },
            areaStyle: { color: 'rgba(59, 130, 246, 0.2)' }
          },
          {
            name: '校内车辆净流量',
            type: 'line',
            data: data.hourlyData.map(item => item.vipEntry - item.vipExit),
            smooth: true,
            itemStyle: { color: '#f59e0b' },
            areaStyle: { color: 'rgba(245, 158, 11, 0.2)' }
          },
          {
            name: '总净流量',
            type: 'line',
            data: data.hourlyData.map(item => 
              (item.visitorEntry - item.visitorExit) + (item.vipEntry - item.vipExit)
            ),
            smooth: true,
            itemStyle: { color: '#10b981' },
            lineStyle: { width: 3 }
          }
        ]
      }

      this.charts.trend.setOption(option)
    },

    onMainChartClick(params) {
      this.showDetail = true
      this.$nextTick(() => {
        this.initDetailCharts()
        this.loadData()
      })
    },

    loadMockData() {
      const mockData = this.getMockData()
      this.updateOverviewStats(mockData)
      this.updateMainChart(mockData)
      if (this.showDetail) {
        this.updateDetailCharts(mockData)
      }
    },

    formatNumber(num) {
      return Number(num).toLocaleString()
    },

    // 自动刷新功能
    startAutoRefresh() {
      // 每30秒自动刷新数据
      this.autoRefreshTimer = setInterval(() => {
        this.loadData()
      }, 30000)
    },

    stopAutoRefresh() {
      if (this.autoRefreshTimer) {
        clearInterval(this.autoRefreshTimer)
        this.autoRefreshTimer = null
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.visitor-vip-analysis {
  width: 100%;
  height: 100%;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #e2e8f0;
  font-family: 'Microsoft YaHei', sans-serif;
  padding: 20px;
  box-sizing: border-box;
}

.overview-section {
  margin-bottom: 30px;
}

.chart-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.chart-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: bold;
  color: #e2e8f0;
  margin: 0;
}

.title-icon {
  font-size: 20px;
}

.time-selector {
  display: flex;
  gap: 5px;
  background: rgba(15, 23, 42, 0.8);
  padding: 5px;
  border-radius: 8px;
  border: 1px solid rgba(59, 130, 246, 0.3);
}

.time-btn {
  padding: 8px 12px;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  border-radius: 4px;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.15);
  }

  &.active {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
  }
}

.main-chart-container {
  height: 400px;
  background: rgba(11, 19, 42, 0.6);
  border: 1px solid #1e40af;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
}

.chart {
  width: 100%;
  height: 100%;
}

// 统一KPI区域样式 - 与center.vue保持一致
.unified-kpi-section {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: nowrap;
  justify-content: space-between;

  .vehicle-kpi-card {
    flex: 1;
    min-width: 80px;
    max-width: 120px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 8px;
    padding: 8px 4px;
    text-align: center;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6);
      background-size: 200% 100%;
      animation: shimmer 2s infinite;
    }

    &::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      transform: translateY(-2px) scale(1.01);
      box-shadow:
        0 8px 25px rgba(59, 130, 246, 0.2),
        0 0 20px rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.6);

      &::after {
        opacity: 1;
      }
    }

    .kpi-header {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 6px;
      gap: 4px;

      .kpi-icon {
        font-size: 14px;
        filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.6));
        animation: pulse 2s infinite;
      }

      .kpi-title {
        font-size: 10px;
        font-weight: 700;
        color: #3b82f6;
        text-shadow: 0 0 6px rgba(59, 130, 246, 0.4);
        letter-spacing: 0.1px;
        line-height: 1.0;
      }
    }

    .kpi-value {
      font-size: 18px;
      font-weight: 900;
      color: #3b82f6;
      margin-bottom: 3px;
      text-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
      background: linear-gradient(135deg, #3b82f6, #60a5fa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1.0;
      letter-spacing: -0.5px;
    }

    .kpi-unit {
      font-size: 8px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
  }

  /* 特定颜色样式 */
  .visitor-entry .kpi-value {
    color: #3b82f6 !important;
    background: linear-gradient(135deg, #3b82f6, #60a5fa) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
  }

  .visitor-exit .kpi-value {
    color: #10b981 !important;
    background: linear-gradient(135deg, #10b981, #34d399) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
  }

  .vip-entry .kpi-value {
    color: #f59e0b !important;
    background: linear-gradient(135deg, #f59e0b, #fbbf24) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
  }

  .vip-exit .kpi-value {
    color: #8b5cf6 !important;
    background: linear-gradient(135deg, #8b5cf6, #a78bfa) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }
  100% {
    background-position: 200% 0;
  }
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.detail-section {
  background: rgba(11, 19, 42, 0.8);
  border: 1px solid #1e40af;
  border-radius: 12px;
  padding: 20px;
  margin-top: 20px;
}

.detail-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.detail-title {
  font-size: 16px;
  font-weight: bold;
  color: #e2e8f0;
  margin: 0;
}

.close-btn {
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid #ef4444;
  color: #ef4444;
  width: 30px;
  height: 30px;
  border-radius: 50%;
  cursor: pointer;
  font-size: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(239, 68, 68, 0.3);
    transform: scale(1.1);
  }
}

.detail-charts {
  display: flex;
  flex-direction: column;
  gap: 30px;
}

.chart-group {
  .group-title {
    font-size: 14px;
    font-weight: bold;
    color: #3b82f6;
    margin-bottom: 15px;
    padding-bottom: 8px;
    border-bottom: 1px solid rgba(59, 130, 246, 0.3);
  }
}

.charts-row {
  display: flex;
  gap: 20px;
}

.chart-item {
  flex: 1;
  height: 300px;
  background: rgba(11, 19, 42, 0.6);
  border: 1px solid #1e40af;
  border-radius: 8px;
  padding: 15px;

  &.full-width {
    flex: 2;
  }
}

@media (max-width: 1200px) {
  .charts-row {
    flex-direction: column;
  }
  
  .chart-item {
    &.full-width {
      flex: 1;
    }
  }
}
</style>
