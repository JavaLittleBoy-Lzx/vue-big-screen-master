<template>
  <div>
    <div id="bottomLeftChart" style="width:900px;height:320px;"></div>
  </div>
</template>

<script>
const echarts = require("echarts");
export default {
  props: {
    // 兼容旧结构，接收 { channels: Array<{name, entryCount|entry, exitCount|exit}>, statistics: {...} }
    flowCompareData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {};
  },
  mounted() {
    this.drawChart();
  },
  watch: {
    flowCompareData: {
      handler() {
        this.drawChart();
      },
      deep: true
    }
  },
  methods: {
    drawChart() {
      // 检查DOM元素是否存在
      const chartDom = document.getElementById("bottomLeftChart");
      if (!chartDom) {
        console.warn("Chart DOM element not found");
        return;
      }

      // 初始化图表实例
      let chart = echarts.init(chartDom);

      // 规范化数据：兼容 entry/exit 与 entryCount/exitCount
      const allChannels = (this.flowCompareData.channels || []).map(ch => ({
        name: ch.name,
        entry: ch.entry != null ? ch.entry : (ch.entryCount || 0),
        exit: ch.exit != null ? ch.exit : (ch.exitCount || 0)
      }));

      // 按指定清单严格映射通道，避免误分类与数量不一致
      const specifiedEntryNames = [
        '1号门入口','3号门入口','5号门入口','7号门入口','8号门入口',
        '林科门入口','兴安门入口','银行门入口',
        '体育馆桥旁虚拟入口','校区桥旁虚拟入口',
        '体育馆校内虚拟入口1','体育馆校内虚拟入口2'
      ];
      const specifiedExitNames = [
        '1号门出口','1号门潮汐出口','3号门出口','3号门潮汐出口',
        '5号门出口','7号门出口','8号门出口',
        '林科门出口','兴安门出口','银行门出口',
        '体育馆桥旁出口','校区桥旁出口',
        '体育馆校内出口1','体育馆校内出口2'
      ];

      const nameToChannel = new Map(allChannels.map(c => [c.name, c]));
      const entrySeriesData = specifiedEntryNames.map(name => ({
        name,
        value: (nameToChannel.get(name) && nameToChannel.get(name).entry) || 0
      }));
      const exitSeriesData = specifiedExitNames.map(name => ({
        name,
        value: (nameToChannel.get(name) && nameToChannel.get(name).exit) || 0
      }));

      const option = {
        backgroundColor: "transparent",
        tooltip: {
          trigger: "item",
          formatter: params => `${params.seriesName}<br/>${params.name}: ${params.value} 辆 (${params.percent}%)`
        },
        legend: [
          {
            type: 'scroll',
            orient: 'vertical',
            right: '2%',
            top: '8%',
            bottom: '52%',
            itemWidth: 12,
            itemHeight: 12,
            textStyle: { color: '#B4B4B4', fontSize: 11 },
            data: entrySeriesData.map(d => d.name),
            tooltip: { show: true },
          },
          {
            type: 'scroll',
            orient: 'vertical',
            right: '2%',
            top: '52%',
            bottom: '8%',
            itemWidth: 12,
            itemHeight: 12,
            textStyle: { color: '#B4B4B4', fontSize: 11 },
            data: exitSeriesData.map(d => d.name),
            tooltip: { show: true },
          }
        ],
        series: [
          {
            name: "入口通道进场",
            type: "pie",
            roseType: "radius",
            radius: [30, 120],
            center: ["28%", "55%"],
            itemStyle: {
              shadowBlur: 8,
              shadowColor: "rgba(0, 0, 0, 0.3)"
            },
            label: {
              color: "#B4B4B4",
              fontSize: 11,
              formatter: p => `${p.name}\n${p.value}`
            },
            labelLine: {
              length: 8,
              length2: 6
            },
            data: entrySeriesData,
            // 入口使用暖色系，亮度更高
            color: [
              "#ff6b6b","#ff8f50","#ffb74d","#ffd43b","#fadb5f","#ffa94d",
              "#f783ac","#faa2c1","#ff8787","#ff9f7f","#ffc078","#ffd8a8",
              "#fab005","#f76707","#f59f00","#e67700"
            ]
          },
          {
            name: "出口通道离场",
            type: "pie",
            roseType: "radius",
            radius: [30, 120],
            center: ["72%", "55%"],
            itemStyle: {
              shadowBlur: 8,
              shadowColor: "rgba(0, 0, 0, 0.3)"
            },
            label: {
              color: "#B4B4B4",
              fontSize: 11,
              formatter: p => `${p.name}\n${p.value}`
            },
            labelLine: {
              length: 8,
              length2: 6
            },
            data: exitSeriesData,
            // 出口使用冷色系，区分于入口
            color: [
              "#4dd4ac","#63e6be","#66d9e8","#74c0fc","#4dabf7","#228be6",
              "#748ffc","#91a7ff","#b197fc","#9775fa","#845ef7","#5c7cfa",
              "#2b8a3e","#38d9a9","#20c997","#12b886"
            ]
          }
        ]
      };

      chart.setOption(option, true);

      // 响应式变化
      window.addEventListener("resize", () => chart.resize(), false);
    }
  },
  destroyed() {
    window.onresize = null;
  }
};
</script>

<style lang="scss" scoped>
</style>