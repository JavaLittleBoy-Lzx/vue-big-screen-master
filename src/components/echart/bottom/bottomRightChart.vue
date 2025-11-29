<template>
  <div>
    <div id="bottomRightChart" style="width:600px;height:380px;margin-left:-40px;margin-top:-50px;"></div>
  </div>
</template>

<script>
const echarts = require("echarts");
export default {
  props: {
    anomalyData: {
      type: Object,
      default: () => ({})
    }
  },
  data() {
    return {
      chartTimer: null
    };
  },
  mounted() {
    this.drawChart();
    this.charTimg();
  },
  watch: {
    anomalyData: {
      handler() {
        this.drawChart();
      },
      deep: true
    }
  },
  methods: {
    charTimg() {
      this.chartTimer = setInterval(() => {
        this.drawChart();
      }, 6000);
    },
    drawChart() {
      // 检查DOM元素是否存在
      const chartDom = document.getElementById("bottomRightChart");
      if (!chartDom) {
        console.warn("Chart DOM element not found");
        return;
      }
      
      // 基于准备好的dom，初始化echarts实例
      let myChartPieLeft = echarts.init(chartDom);
      
      const data = this.anomalyData;
      const currentDate = new Date();
      const year = currentDate.getFullYear();
      const month = currentDate.getMonth() + 1;
      const day = currentDate.getDate();
      
      // 生成最近7天的数据
      let weekCategory = [];
      let weekAlertData = [];
      let weekProcessedData = [];
      
      for (let i = 6; i >= 0; i--) {
        const date = new Date(currentDate.getTime() - i * 24 * 60 * 60 * 1000);
        weekCategory.push([date.getMonth() + 1, date.getDate()].join("/"));
        
        // 模拟告警数据
        weekAlertData.push(Math.floor(Math.random() * 20) + 10);
        weekProcessedData.push(Math.floor(Math.random() * 15) + 5);
      }

      // 异常类型分布数据
      const anomalyDistribution = data.anomalyDistribution || [
        { name: '黑名单', value: 3 },
        { name: '欠费', value: 8 },
        { name: '超时', value: 5 },
        { name: '频繁', value: 7 },
        { name: '其他', value: 2 }
      ];

      // 颜色设置
      let color = {
        linearYtoG: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 1,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: "#ef4444"
            },
            {
              offset: 1,
              color: "#fca5a5"
            }
          ]
        },
        linearGtoB: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [
            {
              offset: 0,
              color: "#f59e0b"
            },
            {
              offset: 1,
              color: "#fbbf24"
            }
          ]
        },
        linearBtoG: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 1,
          y2: 0,
          colorStops: [
            {
              offset: 0,
              color: "#3b82f6"
            },
            {
              offset: 1,
              color: "#60a5fa"
            }
          ]
        },
        areaBtoG: {
          type: "linear",
          x: 0,
          y: 0,
          x2: 0,
          y2: 1,
          colorStops: [
            {
              offset: 0,
              color: "rgba(59,130,246,0.3)"
            },
            {
              offset: 1,
              color: "rgba(59,130,246,0.05)"
            }
          ]
        }
      };

      let option = {
        // title: {
        //   text: "人脸访客异常监控",
        //   textStyle: {
        //     color: "#D3D6DD",
        //     fontSize: 18,
        //     fontWeight: "normal"
        //   },
        //   subtext: year + "/" + month + "/" + day,
        //   subtextStyle: {
        //     color: "#fff",
        //     fontSize: 14
        //   },
        //   top: 20,
        //   left: 80
        // },
        legend: {
          top: 60,
          left: 80,
          orient: "vertical",
          itemGap: 15,
          itemWidth: 12,
          itemHeight: 12,
          data: ["异常告警", "已识别"],
          textStyle: {
            color: "#fff",
            fontSize: 12
          }
        },
        tooltip: {
          trigger: "item"
        },
        radar: {
          center: ["68%", "35%"],
          radius: "35%",
          name: {
            color: "#fff",
            fontSize: 12
          },
          splitNumber: 6,
          axisLine: {
            lineStyle: {
              color: color.linearYtoG,
              opacity: 0.6
            }
          },
          splitLine: {
            lineStyle: {
              color: color.linearYtoG,
              opacity: 0.6
            }
          },
          splitArea: {
            areaStyle: {
              color: "#fff",
              opacity: 0.1,
              shadowBlur: 25,
              shadowColor: "#000",
              shadowOffsetX: 0,
              shadowOffsetY: 5
            }
          },
          indicator: [
            {
              name: "识别失败",
              max: 15
            },
            {
              name: "陌生人闯入",
              max: 10
            },
            {
              name: "黑名单人员",
              max: 8
            },
            {
              name: "异常停留",
              max: 12
            },
            {
              name: "设备故障",
              max: 10
            }
          ]
        },
        grid: {
          left: 90,
          right: 80,
          bottom: 20,
          top: "60%"
        },
        xAxis: {
          type: "category",
          position: "bottom",
          axisLine: true,
          axisLabel: {
            color: "rgba(255,255,255,.8)",
            fontSize: 10
          },
          data: weekCategory
        },
        yAxis: {
          name: "告警数量",
          nameLocation: "end",
          nameGap: 24,
          nameTextStyle: {
            color: "rgba(255,255,255,.5)",
            fontSize: 12
          },
          max: 30,
          splitNumber: 4,
          axisLine: {
            lineStyle: {
              opacity: 0
            }
          },
          splitLine: {
            show: true,
            lineStyle: {
              color: "#fff",
              opacity: 0.1
            }
          },
          axisLabel: {
            color: "rgba(255,255,255,.8)",
            fontSize: 10
          }
        },
        series: [
          {
            name: "",
            type: "radar",
            symbolSize: 0,
            data: [
              {
                value: [
                  anomalyDistribution.find(d => d.name === '识别失败')?.value || 10,
                  anomalyDistribution.find(d => d.name === '陌生人闯入')?.value || 6,
                  anomalyDistribution.find(d => d.name === '黑名单人员')?.value || 2,
                  anomalyDistribution.find(d => d.name === '异常停留')?.value || 4,
                  anomalyDistribution.find(d => d.name === '设备故障')?.value || 3
                ],
                name: "当前异常",
                itemStyle: {
                  normal: {
                    color: "#ef4444"
                  }
                },
                lineStyle: {
                  normal: {
                    opacity: 0
                  }
                },
                areaStyle: {
                  normal: {
                    color: "#ef4444",
                    shadowBlur: 25,
                    shadowColor: "rgba(239,68,68,.3)",
                    shadowOffsetX: 0,
                    shadowOffsetY: -10,
                    opacity: 0.6
                  }
                }
              }
            ]
          },
          {
            name: "异常告警",
            type: "line",
            smooth: true,
            symbol: "emptyCircle",
            symbolSize: 6,
            itemStyle: {
              normal: {
                color: "#ef4444"
              }
            },
            lineStyle: {
              normal: {
                color: color.linearYtoG,
                width: 3
              }
            },
            areaStyle: {
              normal: {
                color: color.areaBtoG
              }
            },
            data: weekAlertData,
            lineSmooth: true,
            markLine: {
              silent: true,
              data: [
                {
                  type: "average",
                  name: "平均值"
                }
              ],
              precision: 0,
              label: {
                normal: {
                  formatter: "平均值: \n {c}"
                }
              },
              lineStyle: {
                normal: {
                  color: "rgba(239,68,68,.7)"
                }
              }
            },
            tooltip: {
              position: "top",
              formatter: "{c} 件",
              backgroundColor: "rgba(239,68,68,.2)",
              padding: 6
            }
          },
          {
            name: "已识别",
            type: "line",
            smooth: true,
            symbol: "emptyCircle",
            symbolSize: 6,
            itemStyle: {
              normal: {
                color: "#10b981"
              }
            },
            lineStyle: {
              normal: {
                color: "#10b981",
                width: 3
              }
            },
            data: weekProcessedData,
            tooltip: {
              position: "top",
              formatter: "{c} 件",
              backgroundColor: "rgba(16,185,129,.2)",
              padding: 6
            }
          }
        ]
      };

      myChartPieLeft.setOption(option);
      
      // 响应式变化
      window.addEventListener("resize", () => myChartPieLeft.resize(), false);
    }
  },
  beforeDestroy() {
    // 清理定时器
    if (this.chartTimer) {
      clearInterval(this.chartTimer);
      this.chartTimer = null;
    }
    window.onresize = null;
  },
  destroyed() {
    // 确保清理
    if (this.chartTimer) {
      clearInterval(this.chartTimer);
    }
  }
};
</script>

<style lang="scss" scoped>
</style>