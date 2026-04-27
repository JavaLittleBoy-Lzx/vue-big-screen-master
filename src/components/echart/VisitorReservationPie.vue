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
    
    // 监听容器尺寸变化
    if (this.$refs.chart) {
      const resizeObserver = new ResizeObserver(() => {
        this.resize();
      });
      resizeObserver.observe(this.$refs.chart);
      this._resizeObserver = resizeObserver;
    }
  },
  beforeDestroy() {
    window.removeEventListener("resize", this.resize);
    if (this._resizeObserver) {
      this._resizeObserver.disconnect();
    }
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
      if (this.chart) {
        this.chart.resize();
        // 重新渲染以应用响应式配置
        this.render();
      }
    },
    getResponsiveConfig() {
      // 获取容器尺寸
      const containerWidth = this.$refs.chart?.offsetWidth || 300;
      const containerHeight = this.$refs.chart?.offsetHeight || 300;
      
      // 根据容器大小动态调整配置
      let radius, center, legendRight, fontSize;
      
      if (containerWidth < 300 || containerHeight < 250) {
        // 超小容器
        radius = ["15%", "52%"];
        center = ["30%", "50%"];
        legendRight = 8;
        fontSize = 14;
      } else if (containerWidth < 400 || containerHeight < 300) {
        // 小容器
        radius = ["16%", "58%"];
        center = ["31%", "50%"];
        legendRight = 10;
        fontSize = 14;
      } else if (containerWidth >= 500 || containerHeight >= 400) {
        // 超大容器（2560×1600等）
        radius = ["18%", "65%"];
        center = ["34%", "50%"];
        legendRight = 15;
        fontSize = 16;
      } else {
        // 标准容器
        radius = ["18%", "62%"];
        center = ["33%", "50%"];
        legendRight = 12;
        fontSize = 15;
      }
      
      return { radius, center, legendRight, fontSize };
    },
    render() {
      if (!this.chart) return;
      const { radius, center, legendRight, fontSize } = this.getResponsiveConfig();
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
        tooltip: { 
          trigger: "item",
          formatter: '{b}: {c} ({d}%)',
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: '#3b82f6',
          borderWidth: 1,
          textStyle: { color: '#fff', fontSize: 12 }
        },
        legend: {
          type: "scroll",
          orient: "vertical",
          right: legendRight,
          top: "center",
          icon: "circle",
          itemWidth: 10,
          itemHeight: 10,
          itemGap: 10,
          textStyle: { 
            color: "#cbd5e1", 
            fontSize: fontSize,
            lineHeight: 16,
            fontWeight: 500
          },
          formatter: (name) => {
            const item = this.data.find(d => d.name === name);
            if (!item) return name;
            // 简化名称显示
            let shortName = name;
            if (name.length > 8) {
              shortName = name.substring(0, 7) + '...';
            }
            return `${shortName}: ${item.value}`;
          }
        },
        series: [
          {
            name: "访客预约分类",
            type: "pie",
            radius: radius,
            center: center,
            roseType: "radius",
            selectedMode: 'single',
            selectedOffset: 12,
            label: { show: false },
            labelLine: { show: false },
            emphasis: {
              scale: true,
              scaleSize: 10,
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


