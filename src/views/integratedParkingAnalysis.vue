<template>
  <div class="integrated-view">
    <div class="row">
      <dv-border-box-12>
        <div class="module">
          <div class="module-title">通道进出流量 - 双向条形图</div>
          <div id="biBar" class="chart"></div>
        </div>
      </dv-border-box-12>
    </div>
    <div class="row">
      <dv-border-box-12>
        <div class="module">
          <div class="module-title">通道进出流量 - 分组条形图</div>
          <div id="groupBar" class="chart"></div>
        </div>
      </dv-border-box-12>
    </div>
    <div class="row">
      <dv-border-box-12>
        <div class="module">
          <div class="module-title">入口/出口占比（总览）</div>
          <div id="directionPie" class="chart"></div>
        </div>
      </dv-border-box-12>
    </div>
    <div class="row">
      <dv-border-box-12>
        <div class="module">
          <div class="module-title">净流入排名 Top10</div>
          <div id="netRankBar" class="chart"></div>
        </div>
      </dv-border-box-12>
    </div>
    <div class="row">
      <dv-border-box-12>
        <div class="module">
          <div class="module-title">各通道进出占比（100%堆叠）</div>
          <div id="percentageBar" class="chart"></div>
        </div>
      </dv-border-box-12>
    </div>
    <div class="row">
      <dv-border-box-12>
        <div class="module">
          <div class="module-title">各通道进出汇总表（点击表头排序）</div>
          <div class="table-wrap">
            <table class="channel-table">
              <thead>
                <tr>
                  <th @click="setSort('channel')">通道</th>
                  <th @click="setSort('in')">入口</th>
                  <th @click="setSort('out')">出口</th>
                  <th @click="setSort('total')">合计</th>
                  <th @click="setSort('net')">净流入</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="row in sortedChannelStats" :key="row.channel">
                  <td>{{ row.channel }}</td>
                  <td>{{ row.in }}</td>
                  <td>{{ row.out }}</td>
                  <td>{{ row.total }}</td>
                  <td :class="{ positive: row.net > 0, negative: row.net < 0 }">{{ row.net }}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </dv-border-box-12>
    </div>
    <div class="row">
      <dv-border-box-12>
        <div class="module">
          <div class="module-title">通道×时间 热力图（示例：24小时）</div>
          <div id="heatmap" class="chart"></div>
        </div>
      </dv-border-box-12>
    </div>
  </div>
</template>

<script>
const echarts = require('echarts');

export default {
  name: 'IntegratedParkingAnalysis',
  data() {
    return {
      channels: [
        '1号门入口','1号门出口','1号门潮汐出口',
        '3号门入口','3号门出口','3号门潮汐出口',
        '5号门入口','5号门出口',
        '7号门入口','7号门出口',
        '8号门入口','8号门出口',
        '林科门入口','林科门出口',
        '兴安门入口','兴安门出口',
        '银行门入口','银行门出口',
        '体育馆桥旁出口','校区桥旁出口',
        '体育馆校内出口1','体育馆校内出口2',
        '体育馆桥旁虚拟入口','校区桥旁虚拟入口',
        '体育馆校内虚拟入口1','体育馆校内虚拟入口2'
      ],
      resizeHandler: null,
      inCounts: [],
      outCounts: [],
      sortKey: 'total',
      sortOrder: 'desc'
    };
  },
  computed: {
    sortedChannelStats() {
      const rows = this.channels.map((channel, index) => {
        const inVal = this.inCounts[index] || 0;
        const outVal = this.outCounts[index] || 0;
        const total = inVal + outVal;
        const net = inVal - outVal;
        return { channel, in: inVal, out: outVal, total, net };
      });
      const key = this.sortKey;
      const order = this.sortOrder === 'asc' ? 1 : -1;
      return rows.sort((a, b) => {
        const av = a[key];
        const bv = b[key];
        if (typeof av === 'number' && typeof bv === 'number') {
          return (av - bv) * order;
        }
        // string compare for channel name
        return String(av).localeCompare(String(bv)) * order;
      });
    }
  },
  mounted() {
    this.$nextTick(() => {
      this.initCharts();
      this.bindResize();
    });
  },
  beforeDestroy() {
    if (this.resizeHandler) window.removeEventListener('resize', this.resizeHandler);
  },
  methods: {
    initCharts() {
      const { inCounts, outCounts } = this.generateMockInOut();
      this.inCounts = inCounts;
      this.outCounts = outCounts;
      this.renderBiDirectionalBar();
      this.renderGroupedBar();
      this.renderDirectionPie();
      this.renderNetInflowRank();
      this.renderPercentageBar();
      this.renderHeatmap();
    },

    generateMockInOut() {
      // 生成示例数据，后续可替换为真实接口聚合
      const inCounts = [];
      const outCounts = [];
      for (let i = 0; i < this.channels.length; i++) {
        const base = 20 + Math.floor(Math.random() * 120);
        const channelName = this.channels[i];
        let inVal = base + Math.floor(Math.random() * 40) - 20;
        let outVal = base + Math.floor(Math.random() * 40) - 20;
        // 规则：入口类只进不出，出口类只出不进
        if (channelName.includes('入口')) {
          outVal = 0;
        } else if (channelName.includes('出口')) {
          inVal = 0;
        }
        inCounts.push(Math.max(0, inVal));
        outCounts.push(Math.max(0, outVal));
      }
      return { inCounts, outCounts };
    },

    renderBiDirectionalBar() {
      const el = document.getElementById('biBar');
      const chart = echarts.init(el);
      const inCounts = this.inCounts;
      const outCounts = this.outCounts;

      const option = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['入口', '出口'], textStyle: { color: '#B4B4B4' } },
        grid: { left: 80, right: 80, top: 40, bottom: 20 },
        xAxis: [{ type: 'value', axisLabel: { color: '#94a3b8' } }],
        yAxis: [{ type: 'category', inverse: true, data: this.channels, axisLabel: { color: '#e2e8f0' } }],
        series: [
          {
            name: '出口',
            type: 'bar',
            stack: 'total',
            label: { show: false },
            itemStyle: { color: '#10b981' },
            data: outCounts.map(v => -v)
          },
          {
            name: '入口',
            type: 'bar',
            stack: 'total',
            label: { show: false },
            itemStyle: { color: '#3b82f6' },
            data: inCounts
          }
        ]
      };
      chart.setOption(option);
      el.__chart__ = chart;
    },

    renderGroupedBar() {
      const el = document.getElementById('groupBar');
      const chart = echarts.init(el);
      const inCounts = this.inCounts;
      const outCounts = this.outCounts;

      const option = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' } },
        legend: { data: ['入口', '出口'], textStyle: { color: '#B4B4B4' } },
        grid: { left: 60, right: 20, top: 40, bottom: 80 },
        xAxis: [{ type: 'category', data: this.channels, axisLabel: { color: '#e2e8f0', interval: 0, rotate: 35 } }],
        yAxis: [{ type: 'value', axisLabel: { color: '#94a3b8' } }],
        series: [
          { name: '入口', type: 'bar', data: inCounts, itemStyle: { color: '#60a5fa' } },
          { name: '出口', type: 'bar', data: outCounts, itemStyle: { color: '#34d399' } }
        ]
      };
      chart.setOption(option);
      el.__chart__ = chart;
    },

    renderDirectionPie() {
      const el = document.getElementById('directionPie');
      const chart = echarts.init(el);
      const totalIn = this.inCounts.reduce((sum, v) => sum + v, 0);
      const totalOut = this.outCounts.reduce((sum, v) => sum + v, 0);
      const option = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'item', formatter: '{b}: {c} ({d}%)' },
        legend: { bottom: 10, textStyle: { color: '#B4B4B4' } },
        series: [
          {
            name: '方向占比',
            type: 'pie',
            radius: ['40%', '65%'],
            avoidLabelOverlap: true,
            label: { color: '#e2e8f0' },
            labelLine: { length: 10, length2: 8 },
            data: [
              { value: totalIn, name: '入口', itemStyle: { color: '#3b82f6' } },
              { value: totalOut, name: '出口', itemStyle: { color: '#10b981' } }
            ]
          }
        ]
      };
      chart.setOption(option);
      el.__chart__ = chart;
    },

    renderNetInflowRank() {
      const el = document.getElementById('netRankBar');
      const chart = echarts.init(el);
      const rows = this.channels.map((c, i) => ({
        channel: c,
        net: (this.inCounts[i] || 0) - (this.outCounts[i] || 0)
      }));
      const top = rows.sort((a, b) => b.net - a.net).slice(0, 10).reverse();
      const option = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: params => {
          const p = params[0];
          return `${p.name}<br/>净流入：${p.value}`;
        } },
        grid: { left: 120, right: 40, top: 20, bottom: 20 },
        xAxis: { type: 'value', axisLabel: { color: '#94a3b8' } },
        yAxis: { type: 'category', data: top.map(r => r.channel), axisLabel: { color: '#e2e8f0' } },
        series: [{
          name: '净流入', type: 'bar', data: top.map(r => r.net),
          itemStyle: { color: '#f59e0b' }
        }]
      };
      chart.setOption(option);
      el.__chart__ = chart;
    },

    renderPercentageBar() {
      const el = document.getElementById('percentageBar');
      const chart = echarts.init(el);
      const percIn = [];
      const percOut = [];
      for (let i = 0; i < this.channels.length; i++) {
        const inn = this.inCounts[i] || 0;
        const out = this.outCounts[i] || 0;
        const sum = inn + out;
        if (sum === 0) {
          percIn.push(0);
          percOut.push(0);
        } else {
          percIn.push((inn / sum * 100).toFixed(2));
          percOut.push((out / sum * 100).toFixed(2));
        }
      }
      const option = {
        backgroundColor: 'transparent',
        tooltip: { trigger: 'axis', axisPointer: { type: 'shadow' }, formatter: params => {
          const name = params[0].axisValue;
          const inP = params.find(p => p.seriesName === '入口');
          const outP = params.find(p => p.seriesName === '出口');
          return `${name}<br/>入口：${inP ? inP.value : 0}%<br/>出口：${outP ? outP.value : 0}%`;
        } },
        legend: { data: ['入口','出口'], textStyle: { color: '#B4B4B4' } },
        grid: { left: 60, right: 20, top: 40, bottom: 80 },
        xAxis: [{ type: 'category', data: this.channels, axisLabel: { color: '#e2e8f0', interval: 0, rotate: 35 } }],
        yAxis: [{ type: 'value', max: 100, axisLabel: { color: '#94a3b8', formatter: '{value}%' } }],
        series: [
          { name: '入口', type: 'bar', stack: 'percent', data: percIn, itemStyle: { color: '#60a5fa' } },
          { name: '出口', type: 'bar', stack: 'percent', data: percOut, itemStyle: { color: '#34d399' } }
        ]
      };
      chart.setOption(option);
      el.__chart__ = chart;
    },

    renderHeatmap() {
      const el = document.getElementById('heatmap');
      const chart = echarts.init(el);
      const hours = Array.from({ length: 24 }, (_, h) => `${h}:00`);
      const data = [];
      for (let i = 0; i < this.channels.length; i++) {
        for (let h = 0; h < 24; h++) {
          data.push([h, i, Math.floor(Math.random() * 180)]);
        }
      }
      const option = {
        tooltip: { position: 'top' },
        grid: { left: 100, right: 40, bottom: 60, top: 30 },
        xAxis: { type: 'category', data: hours, splitArea: { show: true }, axisLabel: { color: '#94a3b8' } },
        yAxis: { type: 'category', data: this.channels, splitArea: { show: true }, axisLabel: { color: '#e2e8f0' } },
        visualMap: {
          min: 0, max: 200, calculable: true, orient: 'horizontal', left: 'center', bottom: 10,
          inRange: { color: ['#0ea5e9', '#22d3ee', '#a7f3d0'] }
        },
        series: [{ name: '流量', type: 'heatmap', data, label: { show: false } }]
      };
      chart.setOption(option);
      el.__chart__ = chart;
    },

    bindResize() {
      this.resizeHandler = () => {
        ['biBar','groupBar','directionPie','netRankBar','percentageBar','heatmap'].forEach(id => {
          const el = document.getElementById(id);
          if (el && el.__chart__) el.__chart__.resize();
        });
      };
      window.addEventListener('resize', this.resizeHandler);
    },

    setSort(key) {
      if (this.sortKey === key) {
        this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
      } else {
        this.sortKey = key;
        this.sortOrder = 'desc';
      }
    }
  }
};

// computed placed after export default in Options API is not standard; define via Vue option
</script>

<style lang="scss" scoped>
.integrated-view {
  background-color: #000000;
  background-image: url("../assets/pageBg.png");
  background-size: cover;
  background-repeat: no-repeat;
  background-position: center center;
  min-height: 100vh;
  padding: 10px;
  .row { margin-bottom: 10px; }
  .module { padding: 10px; }
  .module-title { color: #c3cbde; margin: 5px 0 10px; font-weight: 600; }
  .chart { width: 100%; height: 360px; }
  .table-wrap { max-height: 420px; overflow: auto; }
  .channel-table {
    width: 100%;
    border-collapse: collapse;
    color: #e2e8f0;
    th, td { padding: 8px 10px; border-bottom: 1px solid rgba(226,232,240,0.12); }
    thead th { position: sticky; top: 0; background: rgba(15,23,42,0.6); cursor: pointer; }
    tbody tr:hover { background: rgba(148,163,184,0.08); }
  }
  .positive { color: #22c55e; }
  .negative { color: #ef4444; }
}
</style>


