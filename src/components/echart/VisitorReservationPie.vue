<template>
  <div ref="chart" class="pie-chart"></div>
</template>

<script>
import * as echarts from "echarts";

export default {
  name: "VisitorReservationPie",
  props: {
    data: {
      type: Array,
      default: () => []
    },
    activeName: {
      type: String,
      default: null
    }
  },
  data() {
    return { chart: null };
  },
  mounted() {
    this.init();
    window.addEventListener("resize", this.resize);
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.resize);
    if (this.chart) this.chart.dispose();
  },
  watch: {
    data: {
      handler() {
        this.render();
      },
      deep: true
    }
  },
  methods: {
    init() {
      this.chart = echarts.init(this.$refs.chart);
      this.render();
    },
    resize() {
      if (this.chart) this.chart.resize();
    },
    render() {
      if (!this.chart) return;
      const colors = [
        "#39c1cf",
        "#4269f5",
        "#b86bd7",
        "#f35453",
        "#FA7414",
        "#FFAB1E",
        "#8868D9",
        "#2AB8E6",
        "#7585A2",
        "#10b981",
        "#f59e0b",
        "#ef4444"
      ];

      const option = {
        tooltip: { trigger: "item" },
        legend: {
          type: "scroll",
          orient: "vertical",
          right: 20,
          top: "center",
          icon: "circle",
          itemWidth: 8,
          itemHeight: 8,
          textStyle: { color: "#cbd5e1", fontSize: 12 },
          formatter: (name) => {
            const item = this.data.find(d => d.name === name);
            return item ? `${name}: ${item.value}` : name;
          }
        },
        series: [
          {
            name: "访客预约分类",
            type: "pie",
            radius: ["20%", "70%"],
            center: ["35%", "50%"],
            roseType: "radius",
            selectedMode: 'single',
            selectedOffset: 8,
            label: { show: false },
            labelLine: { show: false },
            emphasis: {
              scale: true,
              scaleSize: 8,
              itemStyle: {
                shadowBlur: 25,
                shadowColor: 'rgba(255,255,255,0.45)'
              }
            },
            itemStyle: {
              color: (params) => colors[params.dataIndex % colors.length],
              borderColor: "rgba(15,23,42,0.8)",
              borderWidth: 2
            },
            data: this.data
          }
        ]
      };
      this.chart.setOption(option);
      // 高亮选中项
      this.chart.dispatchAction({ type: 'downplay', seriesIndex: 0 });
      this.chart.dispatchAction({ type: 'unselect', seriesIndex: 0 });
      if (this.activeName) {
        const idx = this.data.findIndex(d => d.name === this.activeName);
        if (idx !== -1) {
          this.chart.dispatchAction({ type: 'highlight', seriesIndex: 0, dataIndex: idx });
          this.chart.dispatchAction({ type: 'select', seriesIndex: 0, dataIndex: idx });
        }
      }
      this.chart.off("click");
      this.chart.off("mouseover");
      this.chart.off("mouseout");
      this.chart.on("click", (params) => {
        this.$emit("slice-click", params);
      });
      this.chart.on("mouseover", (params) => {
        this.$emit("slice-hover", params);
      });
      this.chart.on("mouseout", () => {
        this.$emit("slice-hover", null);
      });
    }
  }
};
</script>

<style scoped>
.pie-chart { width: 100%; height: 100%; }
</style>


