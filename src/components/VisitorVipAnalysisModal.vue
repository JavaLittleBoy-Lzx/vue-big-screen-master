<template>
  <div v-if="visible" class="visitor-vip-modal-mask" @click.self="closeModal">
    <div class="visitor-vip-modal">
      <div class="modal-header">
        <div class="modal-title">
          <span class="title-icon">📊</span>
          <span class="title-text" style="margin-left: 15px;">访客与VIP车辆进出统计分析</span>
        </div>
        <div class="modal-close" @click="closeModal">✖</div>
      </div>
      
      <div class="modal-body">

          <!-- 详细分析区域 - 直接显示 -->
          <div class="detail-section">
            
            <div class="detail-charts">
            <!-- VIP类型分析 -->
            <div class="chart-group">
              <div class="group-title">VIP类型分布</div>
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
            
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'VisitorVipAnalysisModal',
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    chartData: {
      type: Object,
      default: () => ({
        hour: null,
        entry: null,
        type: null
      })
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
      overviewStats: {
        visitorEntry: 0,
        visitorExit: 0,
        vipEntry: 0,
        vipExit: 0
      },
      charts: {
        vipPie: null,
        vipBar: null,
        visitorPie: null,
        visitorBar: null
      },
        autoRefreshTimer: null,
        // 图表数据存储
        vipChartData: [],
        visitorChartData: []
    }
  },
  watch: {
    visible(newVal) {
      if (newVal) {
        this.$nextTick(() => {
          this.initCharts()
          this.handleChartData()
          this.loadData()
          this.startAutoRefresh()
        })
      } else {
        this.stopAutoRefresh()
        this.disposeCharts()
      }
    },
    selectedTimeRange() {
      this.loadData()
    }
  },
  methods: {
    closeModal() {
      this.$emit('close')
    },

    handleChartData() {
      // 处理从主页传递的点击数据
      if (this.chartData && this.chartData.hour) {
        console.log('接收到点击参数:', this.chartData)
        
        // 根据点击的时间设置对应的时间范围
        if (this.chartData.hour.includes(':')) {
          // 如果是具体时间（如 08:00），设置为今日
          this.selectedTimeRange = 'daily'
        } else if (this.chartData.hour.includes('周')) {
          // 如果是周几，设置为本周
          this.selectedTimeRange = 'weekly'
        } else if (this.chartData.hour.includes('日')) {
          // 如果是几号，设置为本月
          this.selectedTimeRange = 'monthly'
        } else if (this.chartData.hour.includes('月')) {
          // 如果是几月，设置为本年
          this.selectedTimeRange = 'yearly'
        }
      }
    },

    initCharts() {
      this.$nextTick(() => {
        this.initDetailCharts()
      })
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
    },

    disposeCharts() {
      Object.values(this.charts).forEach(chart => {
        if (chart) chart.dispose()
      })
      this.charts = {
        vipPie: null,
        vipBar: null,
        visitorPie: null,
        visitorBar: null
      }
    },

    async loadData() {
      try {
        const data = await this.fetchVisitorVipData()
        this.updateOverviewStats(data)
        this.updateDetailCharts(data)
      } catch (error) {
        console.error('加载数据失败:', error)
        this.loadMockData()
      }
    },

    async fetchVisitorVipData() {
      try {
        // 调用真实的后端接口获取详细统计数据
        const { visitorVipDataService } = await import('@/services/visitorVipDataService')
        
        // 获取详细统计数据
        const detailData = await visitorVipDataService.getDetailStatistics(
          this.chartData.hour || '08:00',
          '东北林业大学',
          this.selectedTimeRange
        )
        console.log('detailData', detailData);
        return detailData
      } catch (error) {
        console.error('获取详细统计数据失败，使用模拟数据:', error)
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
      if (this.chartData && this.chartData.hour) {
        highlightedIndex = timeLabels.findIndex(label => label === this.chartData.hour)
      }
      
      return {
        hourlyData: hours.map((_, index) => {
          // 如果是点击的时间段，使用传入的数据或增加数据量
          let visitorEntry, visitorExit, vipEntry, vipExit
          
          if (index === highlightedIndex && this.chartData && this.chartData.entry) {
            // 使用传入的数据
            if (this.chartData.type === '进场') {
              visitorEntry = this.chartData.entry
              visitorExit = Math.floor(Math.random() * 45) + 8
              vipEntry = Math.floor(Math.random() * 20) + 5
              vipExit = Math.floor(Math.random() * 18) + 3
            } else if (this.chartData.type === '离场') {
              visitorEntry = Math.floor(Math.random() * 50) + 10
              visitorExit = this.chartData.entry
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
          { name: '保障车辆(不值班24小时全部门)', value: Math.floor(Math.random() * 50) + 20, entry: Math.floor(Math.random() * 25) + 10, exit: Math.floor(Math.random() * 25) + 10 },
          { name: '二道岗可通行车辆', value: Math.floor(Math.random() * 40) + 15, entry: Math.floor(Math.random() * 20) + 8, exit: Math.floor(Math.random() * 20) + 8 },
          { name: '教职工(地库车辆)', value: Math.floor(Math.random() * 35) + 12, entry: Math.floor(Math.random() * 18) + 6, exit: Math.floor(Math.random() * 18) + 6 },
          { name: '保障车辆(值班48小时全部门)', value: Math.floor(Math.random() * 30) + 10, entry: Math.floor(Math.random() * 15) + 5, exit: Math.floor(Math.random() * 15) + 5 },
          { name: '外聘私车值班(48小时)', value: Math.floor(Math.random() * 28) + 8, entry: Math.floor(Math.random() * 14) + 4, exit: Math.floor(Math.random() * 14) + 4 },
          { name: '教职工离退37号楼居民', value: Math.floor(Math.random() * 25) + 6, entry: Math.floor(Math.random() * 12) + 3, exit: Math.floor(Math.random() * 12) + 3 },
          { name: '超级VIP', value: Math.floor(Math.random() * 22) + 5, entry: Math.floor(Math.random() * 11) + 2, exit: Math.floor(Math.random() * 11) + 2 },
          { name: '外聘教师(校内)', value: Math.floor(Math.random() * 20) + 4, entry: Math.floor(Math.random() * 10) + 2, exit: Math.floor(Math.random() * 10) + 2 },
          { name: 'I公务车辆', value: Math.floor(Math.random() * 18) + 3, entry: Math.floor(Math.random() * 9) + 1, exit: Math.floor(Math.random() * 9) + 1 },
          { name: '优秀校友', value: Math.floor(Math.random() * 16) + 2, entry: Math.floor(Math.random() * 8) + 1, exit: Math.floor(Math.random() * 8) + 1 },
          { name: 'IV施工车辆(小)', value: Math.floor(Math.random() * 15) + 3, entry: Math.floor(Math.random() * 7) + 1, exit: Math.floor(Math.random() * 7) + 1 },
          { name: 'IV施工车辆(大)', value: Math.floor(Math.random() * 12) + 2, entry: Math.floor(Math.random() * 6) + 1, exit: Math.floor(Math.random() * 6) + 1 },
          { name: 'Ⅱ类保障车辆(小)', value: Math.floor(Math.random() * 14) + 3, entry: Math.floor(Math.random() * 7) + 1, exit: Math.floor(Math.random() * 7) + 1 },
          { name: 'Ⅲ类居民车辆', value: Math.floor(Math.random() * 18) + 4, entry: Math.floor(Math.random() * 9) + 2, exit: Math.floor(Math.random() * 9) + 2 },
          { name: 'Ⅲ类居民车辆(租)', value: Math.floor(Math.random() * 16) + 3, entry: Math.floor(Math.random() * 8) + 1, exit: Math.floor(Math.random() * 8) + 1 },
          { name: 'Ⅱ类保障车辆(大)', value: Math.floor(Math.random() * 13) + 2, entry: Math.floor(Math.random() * 6) + 1, exit: Math.floor(Math.random() * 6) + 1 },
          { name: 'D类离退私车', value: Math.floor(Math.random() * 11) + 2, entry: Math.floor(Math.random() * 5) + 1, exit: Math.floor(Math.random() * 5) + 1 },
          { name: 'C类外聘私车', value: Math.floor(Math.random() * 10) + 2, entry: Math.floor(Math.random() * 5) + 1, exit: Math.floor(Math.random() * 5) + 1 },
          { name: 'F类合作车辆', value: Math.floor(Math.random() * 9) + 1, entry: Math.floor(Math.random() * 4) + 1, exit: Math.floor(Math.random() * 4) + 1 },
          { name: 'B2类教工私车', value: Math.floor(Math.random() * 8) + 1, entry: Math.floor(Math.random() * 4) + 1, exit: Math.floor(Math.random() * 4) + 1 },
          { name: 'B1类专任教师私车', value: Math.floor(Math.random() * 7) + 1, entry: Math.floor(Math.random() * 3) + 1, exit: Math.floor(Math.random() * 3) + 1 },
          { name: 'A类公车', value: Math.floor(Math.random() * 6) + 1, entry: Math.floor(Math.random() * 3) + 1, exit: Math.floor(Math.random() * 3) + 1 },
          { name: '设备巡检', value: Math.floor(Math.random() * 5) + 1, entry: Math.floor(Math.random() * 2) + 1, exit: Math.floor(Math.random() * 2) + 1 }
        ],
        visitorTypes: [
          { name: '基建处车辆', value: Math.floor(Math.random() * 150) + 50, entry: Math.floor(Math.random() * 75) + 25, exit: Math.floor(Math.random() * 75) + 25 },
          { name: '走读学生', value: Math.floor(Math.random() * 120) + 40, entry: Math.floor(Math.random() * 60) + 20, exit: Math.floor(Math.random() * 60) + 20 },
          { name: '非经营活动车辆', value: Math.floor(Math.random() * 100) + 30, entry: Math.floor(Math.random() * 50) + 15, exit: Math.floor(Math.random() * 50) + 15 },
          { name: '兴林宾馆访客', value: Math.floor(Math.random() * 80) + 25, entry: Math.floor(Math.random() * 40) + 12, exit: Math.floor(Math.random() * 40) + 12 },
          { name: '博物馆访客', value: Math.floor(Math.random() * 60) + 20, entry: Math.floor(Math.random() * 30) + 10, exit: Math.floor(Math.random() * 30) + 10 },
          { name: '校友会访客', value: Math.floor(Math.random() * 50) + 15, entry: Math.floor(Math.random() * 25) + 8, exit: Math.floor(Math.random() * 25) + 8 },
          { name: '体育馆自助访客', value: Math.floor(Math.random() * 45) + 12, entry: Math.floor(Math.random() * 22) + 6, exit: Math.floor(Math.random() * 22) + 6 },
          { name: '经营性会议车辆', value: Math.floor(Math.random() * 40) + 10, entry: Math.floor(Math.random() * 20) + 5, exit: Math.floor(Math.random() * 20) + 5 },
          { name: '个人访客车辆', value: Math.floor(Math.random() * 35) + 8, entry: Math.floor(Math.random() * 17) + 4, exit: Math.floor(Math.random() * 17) + 4 },
          { name: '公务车访客车辆', value: Math.floor(Math.random() * 30) + 6, entry: Math.floor(Math.random() * 15) + 3, exit: Math.floor(Math.random() * 15) + 3 },
          { name: '体育馆访客车辆', value: Math.floor(Math.random() * 25) + 5, entry: Math.floor(Math.random() * 12) + 2, exit: Math.floor(Math.random() * 12) + 2 }
        ]
      }
    },

    updateOverviewStats(data) {
      const hourlyData = Array.isArray(data && data.hourlyData) ? data.hourlyData : []
      this.overviewStats = {
        visitorEntry: hourlyData.reduce((sum, item) => sum + item.visitorEntry, 0),
        visitorExit: hourlyData.reduce((sum, item) => sum + item.visitorExit, 0),
        vipEntry: hourlyData.reduce((sum, item) => sum + item.vipEntry, 0),
        vipExit: hourlyData.reduce((sum, item) => sum + item.vipExit, 0)
      }
    },


    updateDetailCharts(data) {
      // 保存数据用于联动
      this.vipChartData = data.vipTypes
      this.visitorChartData = data.visitorTypes
      
      this.updateVipPieChart(data.vipTypes)
      this.updateVipBarChart(data.vipTypes)
      this.updateVisitorPieChart(data.visitorTypes)
      this.updateVisitorBarChart(data.visitorTypes)
    },

    updateVipPieChart(vipTypes) {
      if (!this.charts.vipPie) return

      // 过滤掉进场为0的数据
      const filteredVipTypes = vipTypes.filter(item => item.entry > 0)

      // 清晰对比配色方案
      const techColors = [
        '#1890ff', '#ff4d4f', '#52c41a', '#faad14', '#722ed1', '#13c2c2',
        '#eb2f96', '#fa8c16', '#2f54eb', '#52c41a', '#fa541c', '#531dab'
      ]

      const option = {
        backgroundColor: 'transparent',
        title: {
          text: 'VIP进场数量统计',
          left: 'center',
          top: '2%',
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
        legend: {
          orient: 'vertical',
          right: '-4%',
          top: 'center',
          textStyle: {
            color: '#e2e8f0',
            fontSize: 10
          },
          itemGap: 8
        },
        series: [{
          name: 'VIP进场',
          type: 'pie',
          radius: ['35%', '65%'],
          center: ['40%', '55%'],
          data: filteredVipTypes.map((item, index) => ({
            value: item.entry,
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

      // 过滤掉离场为0的数据
      const filteredVipTypes = vipTypes.filter(item => item.exit > 0)

      const option = {
        backgroundColor: 'transparent',
        title: {
          text: 'VIP离场趋势分析',
          left: 'center',
          top: '2%',
          textStyle: { color: '#e2e8f0', fontSize: 14 }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        legend: {
          data: ['离场数量'],
          textStyle: { color: '#e2e8f0' },
          top: 15,
          left: 400,
          itemGap: 15
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
            name: '离场数量',
            type: 'line',
            smooth: true,
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(239, 68, 68, 0.6)' },
                  { offset: 1, color: 'rgba(239, 68, 68, 0.1)' }
                ]
              }
            },
            lineStyle: {
              color: '#ef4444',
              width: 3
            },
            itemStyle: {
              color: '#ef4444',
              borderColor: '#fff',
              borderWidth: 2
            },
            data: filteredVipTypes.map(item => item.exit)
          }
        ]
      }

      this.charts.vipBar.setOption(option)
    },

    updateVisitorPieChart(visitorTypes) {
      if (!this.charts.visitorPie) return

      // 过滤掉进场为0的数据
      const filteredVisitorTypes = visitorTypes.filter(item => item.entry > 0)

      // 清晰对比配色方案
      const techColors = [
        '#1890ff', '#ff4d4f', '#52c41a', '#faad14', '#722ed1', '#13c2c2',
        '#eb2f96', '#fa8c16', '#2f54eb', '#52c41a', '#fa541c', '#531dab'
      ]

      const option = {
        backgroundColor: 'transparent',
        title: {
          text: '访客进场数量统计',
          left: 'center',
          top: '2%',
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
        legend: {
          orient: 'vertical',
          right: '5%',
          top: 'center',
          textStyle: {
            color: '#e2e8f0',
            fontSize: 10
          },
          itemGap: 8
        },
        series: [{
          name: '访客进场',
          type: 'pie',
          radius: ['35%', '65%'],
          center: ['40%', '55%'],
          data: filteredVisitorTypes.map((item, index) => ({
            value: item.entry,
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

      // 过滤掉离场为0的数据
      const filteredVisitorTypes = visitorTypes.filter(item => item.exit > 0)

      const option = {
        backgroundColor: 'transparent',
        title: {
          text: '访客离场趋势分析',
          left: 'center',
          top: '1%',
          textStyle: { color: '#e2e8f0', fontSize: 14 }
        },
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' }
        },
        legend: {
          data: ['离场数量'],
          textStyle: { color: '#e2e8f0' },
          top: 25,
          left: 400,
          itemGap: 15
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
            name: '离场数量',
            type: 'line',
            smooth: true,
            areaStyle: {
              color: {
                type: 'linear',
                x: 0, y: 0, x2: 0, y2: 1,
                colorStops: [
                  { offset: 0, color: 'rgba(24, 144, 255, 0.6)' },
                  { offset: 1, color: 'rgba(24, 144, 255, 0.1)' }
                ]
              }
            },
            lineStyle: {
              color: '#1890ff',
              width: 3
            },
            itemStyle: {
              color: '#1890ff',
              borderColor: '#fff',
              borderWidth: 2
            },
            data: filteredVisitorTypes.map(item => item.exit)
          }
        ]
      }

      this.charts.visitorBar.setOption(option)
    },

    loadMockData() {
      const mockData = this.getMockData()
      this.updateOverviewStats(mockData)
      this.updateDetailCharts(mockData)
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
.visitor-vip-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  backdrop-filter: blur(5px);
}

.visitor-vip-modal {
  width: 95vw;
  height: 90vh;
  max-width: 1400px;
  max-height: 900px;
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  border: 1px solid #1e40af;
  border-radius: 12px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 15px 20px;
  border-bottom: 1px solid rgba(30, 64, 175, 0.5);
  background: rgba(11, 19, 42, 0.9);
}

.modal-title {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 18px;
  font-weight: bold;
  color: #e2e8f0;
}

.title-icon {
  margin-left: 15px;
  font-size: 20px;
}

.modal-close {
  color: #94a3b8;
  cursor: pointer;
  font-size: 20px;
  padding: 5px;
  border-radius: 4px;
  transition: all 0.3s ease;

  &:hover {
    color: #ef4444;
    background: rgba(239, 68, 68, 0.1);
  }
}

.modal-body {
  flex: 1;
  padding: 15px;
  overflow: hidden;
  color: #e2e8f0;
  font-family: 'Microsoft YaHei', sans-serif;
  display: flex;
  flex-direction: column;
}

.time-selector-section {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  margin-bottom: 10px;
  flex-shrink: 0;
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
  padding: 6px 10px;
  background: transparent;
  border: none;
  color: #94a3b8;
  font-size: 11px;
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

.chart {
  width: 100%;
  flex: 1;
}

// 统一KPI区域样式
.unified-kpi-section {
  display: flex;
  gap: 4px;
  margin-bottom: 10px;
  flex-wrap: nowrap;
  justify-content: space-between;
  flex-shrink: 0;

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

    &:hover {
      transform: translateY(-2px) scale(1.01);
      box-shadow:
        0 8px 25px rgba(59, 130, 246, 0.2),
        0 0 20px rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.6);
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
  padding: 15px;
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
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
  gap: 15px;
  flex: 1;
  overflow: hidden;
}

.chart-group {
  flex: 1;
  display: flex;
  flex-direction: column;
  
  .group-title {
    font-size: 14px;
    font-weight: bold;
    color: #3b82f6;
    margin-bottom: 8px;
    padding-bottom: 5px;
    border-bottom: 1px solid rgba(59, 130, 246, 0.3);
    flex-shrink: 0;
  }
}

.charts-row {
  display: flex;
  gap: 15px;
  flex: 1;
}

.chart-item {
  flex: 1;
  background: rgba(11, 19, 42, 0.6);
  border: 1px solid #1e40af;
  border-radius: 8px;
  padding: 10px;
  display: flex;
  flex-direction: column;

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
