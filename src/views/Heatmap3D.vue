<template>
  <div class="heatmap3d">
    <div ref="chartRef" class="chart"></div>
    <!-- 人脸热力图分页控制 -->
    <div v-if="showPagination" class="pagination-controls">
      <button class="page-btn" :disabled="currentPage === 0" @click="prevPage">◀</button>
      <span class="page-info">{{ currentPage + 1 }}/{{ totalPages }}</span>
      <button class="page-btn" :disabled="currentPage >= totalPages - 1" @click="nextPage">▶</button>
    </div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'Heatmap3D',
  props: {
    heatmapData: {
      type: Array,
      default: () => []
    },
    vehicleHeatmapData: {
      type: Array,
      default: () => []
    },
    personHeatmapData: {
      type: Array,
      default: () => []
    },
    hourLabels: {
      type: Array,
      default: () => null
    },
    minHour: {
      type: Number,
      default: 0
    },
    maxHour: {
      type: Number,
      default: 23
    },
    faceHeatmapLocations: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      chart: null,
      internalVehicleData: [],
      internalPersonData: [],
      currentPage: 0,
      pageSize: 18 // 每页显示18个通道
    }
  },
  computed: {
    // 是否显示分页控制（只有人脸热力图且通道超过pageSize时显示）
    showPagination() {
      const hasPersonData = this.personHeatmapData && this.personHeatmapData.length > 0;
      const hasVehicleData = this.vehicleHeatmapData && this.vehicleHeatmapData.length > 0;
      if (hasVehicleData) return false;
      const locations = this.faceHeatmapLocations && this.faceHeatmapLocations.length > 0 
        ? this.faceHeatmapLocations 
        : [];
      return hasPersonData && locations.length > this.pageSize;
    },
    totalPages() {
      const locations = this.faceHeatmapLocations && this.faceHeatmapLocations.length > 0 
        ? this.faceHeatmapLocations 
        : [];
      return Math.ceil(locations.length / this.pageSize) || 1;
    }
  },
  mounted() {
    this.initChart()
    this.generateDataIfEmpty()
    this.render()
    window.addEventListener('resize', this.onResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize)
    if (this.chart) this.chart.dispose()
  },
  methods: {
    getResponsiveBottom(isVehicleData) {
      const width = window.innerWidth;
      if (width >= 2048) {
        return isVehicleData ? 60 : 70;
      } else if (width >= 1920) {
        return isVehicleData ? 55 : 65;
      } else if (width >= 1440) {
        return isVehicleData ? 60 : 70;
      } else {
        return isVehicleData ? 65 : 75;
      }
    },
    getResponsiveFontSize(isVehicleData) {
      const width = window.innerWidth;
      if (width >= 2048) {
        return isVehicleData ? 10 : 9;
      } else if (width >= 1920) {
        return isVehicleData ? 9 : 8;
      } else {
        return isVehicleData ? 8 : 7;
      }
    },
    onResize() {
      if (this.chart) {
        this.chart.resize();
        this.render();
      }
    },
    prevPage() {
      if (this.currentPage > 0) {
        this.currentPage--;
        this.render();
      }
    },
    nextPage() {
      if (this.currentPage < this.totalPages - 1) {
        this.currentPage++;
        this.render();
      }
    },
    generateDataIfEmpty() {
      // 检查是否有车辆数据（包括标识数据）
      const hasVehicleData = this.vehicleHeatmapData && this.vehicleHeatmapData.length > 0
      const hasPersonData = this.personHeatmapData && this.personHeatmapData.length > 0

      // 生成车辆数据 - 按停车时长统计
      if (hasVehicleData) {
        const vehicleRows = []
        for (let h = 0; h < 24; h++) {
          for (let d = 0; d < 9; d++) { // 9个停车时长段
            let base = 100
            if (h >= 0 && h <= 5) base = 180 + Math.random() * 120  // 深夜到凌晨：180-300 (增加夜间数据)
            else if (h >= 6 && h <= 12) base = 250 + Math.random() * 150  // 上午高峰：250-400
            else if (h >= 8 && h <= 18) base = 200 + Math.random() * 120  // 工作时间：200-320
            else if (h >= 19 && h <= 22) base = 160 + Math.random() * 100  // 晚间：160-260
            else if (h >= 7 && h <= 9) base = 220 + Math.random() * 140  // 早高峰：220-360
            else if (h >= 17 && h <= 19) base = 180 + Math.random() * 120  // 晚高峰：180-300
            else if (h >= 13 && h <= 15) base = 140 + Math.random() * 80  // 午休：140-220
            else if (h >= 20 && h <= 24) base = 150 + Math.random() * 80  // 深夜：150-230
            const weights = [0.22, 0.18, 0.16, 0.14, 0.12, 0.08, 0.05, 0.03, 0.02] // 停车时长权重分布 - 最后两个区间为 12-18h 和 18-24h
            vehicleRows.push([h, d, Math.round(base * weights[d])])
          }
        }
        this.internalVehicleData = vehicleRows
      }

      // 生成人脸数据 - 按进入人数统计（从6点开始，交换轴：X轴为通道，Y轴为时间）
      if (hasPersonData) {
        const personRows = []
        for (let h = 6; h < 24; h++) { // 从6点开始
          for (let d = 0; d < 6; d++) { // 6个区域：入口、大厅、电梯、走廊、会议室、其他
            let base = 80
            if (h >= 6 && h <= 12) base = 200 + Math.random() * 160  // 上午高峰：200-360
            else if (h >= 7 && h <= 9) base = 180 + Math.random() * 140  // 早高峰：180-320
            else if (h >= 17 && h <= 19) base = 160 + Math.random() * 120  // 晚高峰：160-280
            else if (h >= 12 && h <= 14) base = 140 + Math.random() * 100  // 午休时间：140-240
            else if (h >= 9 && h <= 17) base = 120 + Math.random() * 80  // 工作时间：120-200
            else if (h >= 19 && h <= 22) base = 100 + Math.random() * 60  // 晚间：100-160
            else if (h >= 20 && h <= 24) base = 80 + Math.random() * 60  // 深夜：80-140
            const weights = [0.3, 0.25, 0.2, 0.15, 0.08, 0.02] // 区域权重分布
            // 交换轴：[通道索引, 小时索引(从6点开始所以减6), 数值]
            personRows.push([d, h - 6, Math.round(base * weights[d])])
          }
        }
        this.internalPersonData = personRows
      }

      // 如果没有数据，生成默认车辆数据
      if (!hasVehicleData && !hasPersonData) {
        const vehicleRows = []
        for (let h = 0; h < 24; h++) {
          for (let d = 0; d < 9; d++) {
            let base = 100
            if (h >= 0 && h <= 5) base = 180 + Math.random() * 120  // 深夜到凌晨：180-300 (增加夜间数据)
            else if (h >= 6 && h <= 12) base = 250 + Math.random() * 150  // 上午高峰：250-400
            else if (h >= 8 && h <= 18) base = 200 + Math.random() * 120  // 工作时间：200-320
            else if (h >= 19 && h <= 22) base = 160 + Math.random() * 100  // 晚间：160-260
            else if (h >= 7 && h <= 9) base = 220 + Math.random() * 140  // 早高峰：220-360
            else if (h >= 17 && h <= 19) base = 180 + Math.random() * 120  // 晚高峰：180-300
            else if (h >= 13 && h <= 15) base = 140 + Math.random() * 80  // 午休：140-220
            else if (h >= 20 && h <= 24) base = 150 + Math.random() * 80  // 深夜：150-230
            const weights = [0.22, 0.18, 0.16, 0.14, 0.12, 0.08, 0.05, 0.03, 0.02] // 停车时长权重分布 - 最后两个区间为 12-18h 和 18-24h
            vehicleRows.push([h, d, Math.round(base * weights[d])])
          }
        }
        this.internalVehicleData = vehicleRows
      }
    },
    initChart() {
      this.chart = echarts.init(this.$refs.chartRef)
    },
    render() {
      // 根据传入的数据类型决定显示哪种数据
      const hasVehicleData = this.vehicleHeatmapData && this.vehicleHeatmapData.length > 0
      const hasPersonData = this.personHeatmapData && this.personHeatmapData.length > 0

      let data, seriesName, color, isVehicleData

      if (hasVehicleData) {
        // 检查是否是标识数据，如果是则使用内部生成的数据
        if (this.vehicleHeatmapData[0] && this.vehicleHeatmapData[0].type === 'vehicle') {
          // console.log('🔥 [Heatmap3D] 使用内部生成的假数据')
          data = this.internalVehicleData
        } else {
          data = this.vehicleHeatmapData
        }
        seriesName = '车辆热力'
        color = '#3b82f6'
        isVehicleData = true
      } else if (hasPersonData) {
        // 检查是否是标识数据，如果是则使用内部生成的数据
        if (this.personHeatmapData[0] && this.personHeatmapData[0].type === 'person') {
          data = this.internalPersonData
        } else {
          // 真实数据也需要过滤和交换轴
          data = this.personHeatmapData
            .filter(item => item[0] >= 6) // 过滤掉0-5点的数据
            .map(item => [item[1], item[0] - 6, item[2]]) // 交换轴并调整小时索引
        }
        seriesName = '行人热力'
        color = '#f97316'
        isVehicleData = false
      } else {
        // 默认显示车辆数据
        data = this.internalVehicleData
        seriesName = '车辆热力'
        color = '#3b82f6'
        isVehicleData = true
      }

      // 获取通道列表
      const allFaceLocations = this.faceHeatmapLocations && this.faceHeatmapLocations.length > 0 
        ? this.faceHeatmapLocations 
        : ['入口区域', '大厅区域', '电梯区域', '走廊区域', '会议室', '其他区域'];
      
      // 分页处理：只显示当前页的通道
      const startIdx = this.currentPage * this.pageSize;
      const endIdx = Math.min(startIdx + this.pageSize, allFaceLocations.length);
      const faceLocations = allFaceLocations.length > this.pageSize 
        ? allFaceLocations.slice(startIdx, endIdx)
        : allFaceLocations;
      
      // 如果是分页模式，需要过滤数据只保留当前页的通道
      if (!isVehicleData && allFaceLocations.length > this.pageSize) {
        data = data.filter(item => item[0] >= startIdx && item[0] < endIdx)
                   .map(item => [item[0] - startIdx, item[1], item[2]]);
      }

      const option = {
        tooltip: {
          position: 'top',
          backgroundColor: 'rgba(11, 19, 42, 0.95)',
          borderColor: '#1e3a8a',
          textStyle: { color: '#cbd5e1' },
          formatter: (p) => {
            if (isVehicleData) {
              // 🔥 当使用动态小时标签时，hour 是数据中的实际小时值
              // 当使用固定24小时时，hour 是索引
              const hourIndex = p.data[0]
              const actualHour = this.hourLabels ? (this.minHour + hourIndex) : hourIndex
              const durations = ['极短停(0-15min)', '短停(15-30min)', '短停(30min-1h)', '中停(1-2h)', '长停(2-4h)', '超长停(4-8h)', '超长停(8-12h)', '超长停(12-18h)', '超长停(18-24h)']
              return `${actualHour}:00<br/>${durations[p.data[1]]}<br/>车辆数：${p.data[2]}`
            } else {
              // 人脸热力图：X轴为通道，Y轴为时间
              const areaName = faceLocations[p.data[0]] || '未知区域';
              const actualHour = p.data[1] + 6; // 从6点开始
              // 根据通道名称判断是入口还是出口
              const isExit = areaName.includes('出口') || areaName.includes('出场');
              const actionText = isExit ? '离开人数' : '进入人数';
              return `${actualHour}:00<br/>${areaName}<br/>${actionText}：${p.data[2]}`
            }
          }
        },
        grid: { 
          top: 8, 
          bottom: this.getResponsiveBottom(isVehicleData), 
          left: isVehicleData ? 25 : 35, 
          right: isVehicleData ? 5 : 10,
          containLabel: true 
        },
        xAxis: {
          type: 'category',
          data: isVehicleData 
            ? (this.hourLabels || Array.from({ length: 24 }, (_, i) => `${i}:00`))
            : faceLocations,
          axisLabel: { 
            color: '#7dd3fc', 
            interval: 0,
            fontSize: this.getResponsiveFontSize(isVehicleData),
            rotate: isVehicleData ? 40 : 45,
            fontWeight: 'bold',
            margin: 6,
            formatter: isVehicleData ? null : (value) => {
              return value.length > 6 ? value.substring(0, 6) + '..' : value;
            }
          },
          axisLine: { lineStyle: { color: '#1e3a8a' } },
          splitLine: { show: false },
          splitArea: { show: false } // 去掉网格背景色
        },
        yAxis: {
          type: 'category',
          data: isVehicleData 
            ? ['0-15min', '15-30min', '30min-1h', '1-2h', '2-4h', '4-8h', '8-12h', '12-18h', '18-24h']
            : Array.from({ length: 18 }, (_, i) => `${i + 6}:00`), // 6:00-23:00
          axisLabel: { color: '#93c5fd', fontSize: 7 },
          axisLine: { lineStyle: { color: '#1e3a8a' } },
          splitArea: { show: false } // 去掉网格背景色
        },
        visualMap: [
          {
            type: 'continuous',
            min: 0,
            max: 100,
            calculable: true,
            orient: 'horizontal',
            left: 'center',
            bottom: 30,
            width: isVehicleData ? 200 : 160,
            height: 8,
            textStyle: { color: '#93c5fd', fontSize: 8 },
            range:[0,100],
            show: true,
             inRange: {
               color: isVehicleData ?
                 ['#fef9c3', '#fde047', '#facc15', '#dc2626'] : // 车辆用温暖黄色渐变，最高值用深红色
                 ['#e0f2fe', '#7dd3fc', '#0ea5e9', '#1e40af'] // 人脸用清新蓝色渐变，最高值用深蓝色
             },
            seriesIndex: 0
          }
        ],
        series: [
          {
            name: seriesName,
            type: 'heatmap',
            data: data,
            label: { show: false }, // 隐藏数值标签，更紧凑
            emphasis: { itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0,0,0,0.5)' } },
            itemStyle: {
              borderColor: 'transparent', // 去掉边框
              borderWidth: 0
            }
          }
        ]
      }
      this.chart.setOption(option, true)  // 强制重新渲染
    }
  },
  watch: {
    vehicleHeatmapData: {
      deep: true,
      handler() {
        this.render()
      }
    },
    personHeatmapData: {
      deep: true,
      handler() {
        this.render()
      }
    },
    faceHeatmapLocations: {
      deep: true,
      handler() {
        this.render()
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.heatmap3d {
  width: 100%;
  height: 100%;
  position: relative;

  .chart {
    width: 100%;
    height: calc(100% - 20px);
    min-height: 220px;
    background: transparent;
    border: none;
    border-radius: 0;
  }

  .pagination-controls {
    position: absolute;
    bottom: 2px;
    left: 50%;
    transform: translateX(-50%);
    display: flex;
    align-items: center;
    gap: 8px;
    z-index: 10;

    .page-btn {
      width: 22px;
      height: 22px;
      border: 1px solid #4fd2dd;
      background: rgba(79, 210, 221, 0.15);
      color: #4fd2dd;
      border-radius: 4px;
      cursor: pointer;
      font-size: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.2s;

      &:hover:not(:disabled) {
        background: rgba(79, 210, 221, 0.3);
      }

      &:disabled {
        opacity: 0.4;
        cursor: not-allowed;
      }
    }

    .page-info {
      color: #7dd3fc;
      font-size: 11px;
      font-weight: bold;
      min-width: 40px;
      text-align: center;
    }
  }
}
</style>
