<template>
  <div class="channel-stacked-bar">
    <div class="chart-title">各通道进出流量对比（堆积）</div>
    <div ref="chartRef" class="chart"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts'

export default {
  name: 'ChannelStackedBar',
  props: {
    channels: {
      type: Array,
      default: () => ([
        { name: '1号门', entry: 45, exit: 32 },
        { name: '2号门', entry: 38, exit: 41 },
        { name: '3号门', entry: 52, exit: 28 },
        { name: '4号门', entry: 29, exit: 35 },
        { name: '5号门', entry: 41, exit: 33 }
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
      const names = this.channels.map(c => c.name)
      const entry = this.channels.map(c => c.entry)
      const exit = this.channels.map(c => c.exit)
      this.chart = echarts.init(this.$refs.chartRef)
      const option = {
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        grid: { top: 20, bottom: 30, left: 40, right: 10 },
        legend: { data: ['入口', '出口'], textStyle: { color: '#93c5fd' } },
        xAxis: {
          type: 'category',
          data: names,
          axisLabel: { color: '#93c5fd' },
          axisLine: { lineStyle: { color: '#1e3a8a' } }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#93c5fd' },
          splitLine: { lineStyle: { color: 'rgba(30,58,138,0.3)' } },
          axisLine: { lineStyle: { color: '#1e3a8a' } }
        },
        series: [
          { name: '入口', type: 'bar', stack: 'flow', data: entry, itemStyle: { color: '#3b82f6' } },
          { name: '出口', type: 'bar', stack: 'flow', data: exit, itemStyle: { color: '#60a5fa' } }
        ]
      }
      this.chart.setOption(option)
    }
  },
  watch: {
    channels: { deep: true, handler() { this.init() } }
  }
}
</script>

<style lang="scss" scoped>
.channel-stacked-bar {
  width: 100%; height: 100%;
  .chart-title { text-align: center; color: #60a5fa; font-weight: bold; margin-bottom: 8px; font-size: 14px; }
  .chart { height: 300px; background: rgba(11, 19, 42, 0.6); border: 1px solid #1e3a8a; border-radius: 6px; }
}
</style>


