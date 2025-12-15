<template>
  <div class="combined-flow-panel">
    <div class="panel-row heatmap-block">
      <div class="block-title">时空热力分布</div>
      <div ref="heatmapRef" class="chart"></div>
    </div>
    <!-- <div class="panel-row flyline-block">
      <div class="block-title">通道流动轨迹</div>
      <div ref="flylineRef" class="chart"></div>
    </div> -->
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'CombinedFlowPanel',
  props: {
    heatmapData: { type: Array, default: () => [] },
    points: {
      type: Array,
      default: () => ([
        { coordinate: [0.2, 0.3], text: '入口1' },
        { coordinate: [0.8, 0.3], text: '入口2' },
        { coordinate: [0.2, 0.75], text: '出口1' },
        { coordinate: [0.8, 0.75], text: '出口2' },
        { coordinate: [0.5, 0.5], text: '中央区' }
      ])
    },
    lines: {
      type: Array,
      default: () => ([
        { source: '入口1', target: '中央区' },
        { source: '入口2', target: '中央区' },
        { source: '中央区', target: '出口1' },
        { source: '中央区', target: '出口2' }
      ])
    }
  },
  data() {
    return { heatmapChart: null, flylineChart: null, internalHeatmap: [] }
  },
  mounted() {
    this.generateIfEmpty()
    this.initHeatmap()
    this.initFlyline()
    window.addEventListener('resize', this.onResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize)
    if (this.heatmapChart) this.heatmapChart.dispose()
    if (this.flylineChart) this.flylineChart.dispose()
  },
  methods: {
    onResize() {
      if (this.heatmapChart) this.heatmapChart.resize()
      if (this.flylineChart) this.flylineChart.resize()
    },
    generateIfEmpty() {
      if (this.heatmapData && this.heatmapData.length) return
      const data = []
      for (let h = 0; h < 24; h++) {
        for (let d = 0; d < 4; d++) {
          let base = 8
          if (h >= 8 && h <= 18) base = 24 + Math.random() * 22
          else if (h >= 19 && h <= 22) base = 16 + Math.random() * 15
          const w = [0.5, 0.28, 0.16, 0.06]
          data.push([h, d, Math.round(base * w[d])])
        }
      }
      this.internalHeatmap = data
    },
    initHeatmap() {
      this.heatmapChart = echarts.init(this.$refs.heatmapRef)
      const values = (this.heatmapData.length ? this.heatmapData : this.internalHeatmap).map(v => v[2])
      const maxVal = Math.max.apply(null, values.concat([50]))
      const option = {
        tooltip: {
          position: 'top',
          backgroundColor: 'rgba(11,19,42,0.95)',
          borderColor: '#1e3a8a',
          textStyle: { color: '#cbd5e1' },
          formatter: (p) => {
            const hour = p.data[0]
            const yNames = ['短停(0-1h)', '中停(1-4h)', '长停(4-8h)', '超长停(>8h)']
            return `${hour}:00<br/>${yNames[p.data[1]]}<br/>车辆数：${p.data[2]}`
          }
        },
        grid: { top: 18, bottom: 55, left: 48, right: 10 },
        xAxis: {
          type: 'category',
          data: Array.from({ length: 24 }, (_, i) => `${i}:00`),
          axisLabel: { color: '#93c5fd', interval: 3, fontSize: 10 },
          axisLine: { lineStyle: { color: '#1e3a8a' } },
          splitArea: { show: true, areaStyle: { color: ['rgba(2,6,23,0)','rgba(30,58,138,0.12)'] } }
        },
        yAxis: {
          type: 'category',
          data: ['短停(0-1h)', '中停(1-4h)', '长停(4-8h)', '超长停(>8h)'],
          axisLabel: { color: '#93c5fd', fontSize: 10 },
          axisLine: { lineStyle: { color: '#1e3a8a' } },
          splitArea: { show: true, areaStyle: { color: ['rgba(30,58,138,0.12)','rgba(2,6,23,0)'] } }
        },
        visualMap: {
          type: 'piecewise',
          orient: 'horizontal',
          bottom: 5,
          left: 'center',
          textStyle: { color: '#93c5fd' },
          pieces: [
            { max: 2, label: '0-2', color: '#0b122a' },
            { min: 3, max: Math.ceil(maxVal * 0.25), label: '低', color: '#1e3a8a' },
            { min: Math.ceil(maxVal * 0.25) + 1, max: Math.ceil(maxVal * 0.5), label: '中', color: '#2563eb' },
            { min: Math.ceil(maxVal * 0.5) + 1, max: Math.ceil(maxVal * 0.75), label: '高', color: '#60a5fa' },
            { min: Math.ceil(maxVal * 0.75) + 1, label: '峰', color: '#e0f2fe' }
          ]
        },
        series: [
          {
            type: 'heatmap',
            data: (this.heatmapData.length ? this.heatmapData : this.internalHeatmap),
            label: { show: true, color: '#e2e8f0', fontSize: 10 }
          }
        ]
      }
      this.heatmapChart.setOption(option)
    },
    initFlyline() {
      this.flylineChart = echarts.init(this.$refs.flylineRef)
      const option = {
        series: [
          {
            type: 'graph',
            layout: 'none',
            symbolSize: 24,
            roam: false,
            label: { show: true, color: '#93c5fd', fontSize: 10, position: 'bottom' },
            data: this.points.map(p => ({
              name: p.text,
              x: p.coordinate[0] * 100,
              y: p.coordinate[1] * 100,
              itemStyle: { color: '#3b82f6', shadowBlur: 8, shadowColor: '#3b82f6' }
            })),
            links: this.lines.map(l => ({
              source: l.source,
              target: l.target,
              lineStyle: { color: '#60a5fa', width: 2, curveness: 0.25 },
              symbol: ['none', 'arrow'],
              symbolSize: 8
            }))
          }
        ]
      }
      this.flylineChart.setOption(option)
    }
  }
}
</script>

<style lang="scss" scoped>
.combined-flow-panel {
  width: 100%;
  height: 100%;
  display: grid;
  grid-template-rows: 58% 42%;
  gap: 10px;
}
.panel-row {
  background: rgba(11, 19, 42, 0.6);
  border: 1px solid #1e3a8a;
  border-radius: 6px;
  padding: 8px 10px 10px 10px;
  display: flex;
  flex-direction: column;
}
.block-title {
  text-align: center;
  color: #60a5fa;
  font-weight: bold;
  margin-bottom: 6px;
  font-size: 14px;
}
.chart { flex: 1; min-height: 120px; }
</style>


