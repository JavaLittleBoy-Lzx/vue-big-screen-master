<template>
  <div class="chart-wrapper">
    <div id="centreRight2Chart1" ref="chartContainer"></div>
  </div>
</template>

<script>
const echarts = require("echarts");
export default {
  props: {
    revenueData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {};
  },
  mounted() {
    this.drawChart();
    
    // 监听容器尺寸变化
    if (this.$refs.chartContainer) {
      this.resizeObserver = new ResizeObserver(() => {
        this.handleResize();
      });
      this.resizeObserver.observe(this.$refs.chartContainer);
    }
  },
  watch: {
    revenueData: {
      handler() {
        this.drawChart();
      },
      deep: true
    }
  },
  methods: {
    handleResize() {
      if (this.myChart) {
        this.myChart.resize();
      }
    },
    drawChart() {
      console.log('💰 [图表渲染] 开始绘制收费分析图表');
      console.log('💰 [图表渲染] revenueData:', this.revenueData);
      console.log('💰 [图表渲染] revenueByDuration:', this.revenueData?.revenueByDuration);
      
      // 检查DOM元素是否存在
      const chartDom = document.getElementById("centreRight2Chart1");
      if (!chartDom) {
        console.error('❌ [图表渲染] 找不到图表容器 #centreRight2Chart1');
        return;
      }
      
      // 基于准备好的dom，初始化echarts实例
      if (this.myChart) {
        this.myChart.dispose();
      }
      this.myChart = echarts.init(chartDom);
      console.log('✅ [图表渲染] ECharts实例创建成功');
      
      const data = this.revenueData.revenueByDuration || [];
      console.log('💰 [图表渲染] 处理后的data数组:', data);
      
      // 如果没有数据，使用空数组但不返回，让图表显示空状态
      if (!data || data.length === 0) {
        console.warn('⚠️ [图表渲染] 没有收费数据，将显示空图表');
      }
      
      const categories = data.map(item => item.name);
      const revenues = data.map(item => parseFloat(item.avgRevenue) || 0);
      const counts = data.map(item => item.count || 0);
      
      console.log('💰 [图表渲染] categories:', categories);
      console.log('💰 [图表渲染] revenues:', revenues);
      console.log('💰 [图表渲染] counts:', counts);

      let option = {
        // title: {
        //   text: "收费分析",
        //   left: "center",
        //   top: 10,
        //   textStyle: {
        //     color: "#B4B4B4",
        //     fontSize: 14,
        //     fontWeight: "normal"
        //   }
        // },
        tooltip: {
          trigger: "axis",
          backgroundColor: "rgba(255,255,255,0.1)",
          axisPointer: {
            type: "shadow"
          },
          formatter: function(params) {
            let result = params[0].name + '<br/>';
            params.forEach(function(item) {
              if (item.seriesName === '平均收费') {
                result += item.seriesName + ': ¥' + item.value + '<br/>';
              } else {
                result += item.seriesName + ': ' + item.value + '辆<br/>';
              }
            });
            return result;
          }
        },
        legend: {
          data: ["平均收费", "车辆数量"],
          textStyle: {
            color: "#B4B4B4",
            fontSize: 12  // 增加图例字体大小
          },
          top: 2,
          left: "center"
        },
        grid: {
          left: "6%",
          right: "10%",
          top: "14%",
          bottom: "18%",
          containLabel: true
        },
        xAxis: {
          type: "category",
          data: categories,
          axisLine: {
            lineStyle: {
              color: "#B4B4B4"
            }
          },
          axisTick: {
            show: false
          },
          axisLabel: {
            color: "#B4B4B4",
            fontSize: 10,  // 从8增加到10
            interval: 0,
            rotate: 45,
            margin: 10,
            width: 60,
            overflow: 'truncate'
          }
        },
        yAxis: [
          {
            type: "value",
            name: "收费(元)",
            nameTextStyle: {
              color: "#B4B4B4",
              fontSize: 11
            },
            splitLine: { 
              show: true,
              lineStyle: {
                color: "rgba(180,180,180,0.1)"
              }
            },
            axisLine: {
              lineStyle: {
                color: "#B4B4B4"
              }
            },
            axisLabel: {
              formatter: "¥{value}",
              color: "#B4B4B4",
              fontSize: 11  // 从10增加到11
            }
          },
          {
            type: "value",
            name: "车辆数",
            nameTextStyle: {
              color: "#B4B4B4",
              fontSize: 11
            },
            splitLine: { show: false },
            axisLine: {
              lineStyle: {
                color: "#B4B4B4"
              }
            },
            axisLabel: {
              formatter: "{value}辆",
              color: "#B4B4B4",
              fontSize: 11  // 从10增加到11
            }
          }
        ],
        series: [
          {
            name: "平均收费",
            type: "bar",
            yAxisIndex: 0,
            barWidth: 24, // 增加柱子宽度到24，使柱状图更醒目
            itemStyle: {
              normal: {
                barBorderRadius: 5,
                color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
                  { offset: 0, color: "#3b82f6" },
                  { offset: 1, color: "#60a5fa" }
                ])
              }
            },
            data: revenues
          },
          {
            name: "车辆数量",
            type: "line",
            yAxisIndex: 1,
            smooth: true,
            symbol: "circle",
            symbolSize: 8, // 增加点的大小
            itemStyle: {
              normal: {
                color: "#10b981"
              }
            },
            lineStyle: {
              normal: {
                color: "#10b981",
                width: 5 // 增加线条粗细
              }
            },
            data: counts
          }
        ]
      };
      
      console.log('💰 [图表渲染] 设置图表配置:', option);
      this.myChart.setOption(option);
      console.log('✅ [图表渲染] 图表渲染完成');
    }
  },
  destroyed() {
    if (this.resizeObserver) {
      this.resizeObserver.disconnect();
    }
    if (this.myChart) {
      this.myChart.dispose();
    }
  }
};
</script>

<style lang="scss" scoped>
.chart-wrapper {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
}

#centreRight2Chart1 {
  width: 100%;
  height: 100%;
  min-height: 240px;
}
</style>