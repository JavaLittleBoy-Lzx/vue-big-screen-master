<template>
  <div class="channel-flyline">
    <div class="chart-title">通道流动轨迹</div>
    <div ref="chartRef" class="chart"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'ChannelFlyline',
  props: {
    // 新增：直接传入通道数据，组件内部根据通道类型推导点位与连线
    channels: {
      type: Array,
      default: () => []
    },
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
    return { chart: null }
  },
  mounted() {
    this.init()
    window.addEventListener('resize', this.onResize)
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.onResize)
    if (this.chart) this.chart.dispose()
  },
  methods: {
    onResize() { if (this.chart) this.chart.resize() },
    init() {
      this.chart = echarts.init(this.$refs.chartRef)
      // 若传入 channels，则根据入口/出口生成点位与连线
      let points = this.points
      let lines = this.lines
      if (this.channels && this.channels.length) {
        const entries = this.channels.filter(c => /入口/.test(c.name) || /进|入口/.test(c.type || ''))
        const exits = this.channels.filter(c => /出口/.test(c.name) || /出|出口/.test(c.type || ''))
        const all = [...entries, ...exits]
        // 均匀布局在画布边界附近
        const makeCoord = (idx, total, y) => [ (idx + 1) / (total + 1), y ]
        const entryPoints = entries.map((c, i) => ({ coordinate: makeCoord(i, entries.length, 0.2), text: c.name }))
        const exitPoints = exits.map((c, i) => ({ coordinate: makeCoord(i, exits.length, 0.8), text: c.name }))
        const center = { coordinate: [0.5, 0.5], text: '主干道' }
        points = [...entryPoints, center, ...exitPoints]
        // 连接：入口 -> 主干道 -> 出口
        lines = [
          ...entryPoints.map(p => ({ source: p.text, target: center.text })),
          ...exitPoints.map(p => ({ source: center.text, target: p.text }))
        ]
      }
      const option = {
        backgroundColor: 'transparent',
        series: [
          {
            type: 'graph',
            layout: 'none',
            symbolSize: 26,
            roam: false,
            label: { show: true, color: '#93c5fd', fontSize: 10, position: 'bottom' },
            data: points.map(p => ({
              name: p.text,
              x: p.coordinate[0] * 100,
              y: p.coordinate[1] * 100,
              itemStyle: { color: '#3b82f6', shadowBlur: 8, shadowColor: '#3b82f6' }
            })),
            links: lines.map(l => ({
              source: l.source,
              target: l.target,
              lineStyle: { color: '#60a5fa', width: 2, curveness: 0.25 },
              symbol: ['none', 'arrow'],
              symbolSize: 8
            })),
            lineStyle: { color: '#60a5fa', width: 2 },
            edgeSymbol: ['circle', 'arrow'],
            edgeSymbolSize: [4, 8]
          }
        ]
      }
      this.chart.setOption(option)
    }
  },
  watch: {
    channels: { deep: true, handler() { this.init() } },
    points: { deep: true, handler() { this.init() } },
    lines: { deep: true, handler() { this.init() } }
  }
}
</script>

<style lang="scss" scoped>
.channel-flyline {
  width: 100%;
  height: 100%;
  .chart-title {
    text-align: center;
    color: #60a5fa;
    font-weight: bold;
    margin-bottom: 10px;
    font-size: 14px;
  }
  .chart {
    height: 220px;
    background: rgba(11, 19, 42, 0.6);
    border: 1px solid #1e3a8a;
    border-radius: 6px;
  }
}
</style>


