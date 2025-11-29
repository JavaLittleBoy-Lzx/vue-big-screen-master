<template>
  <div class="heatmap-container">
    <div id="channelFlowHeatmap" style="width: 100%; height: 250px;"></div>
  </div>
</template>

<script>
const echarts = require("echarts");

export default {
  name: "ChannelFlowHeatmap",
  props: {
    data: {
      type: Object,
      required: true
    },
    timeRange: {
      type: String,
      default: 'today'
    },
    channel: {
      type: String,
      default: 'all'
    },
    type: {
      type: String,
      default: 'entry'
    }
  },
  data() {
    return {
      chartTimer: null
    };
  },
  mounted() {
    this.drawHeatmap();
    this.startChartRefresh();
  },
  watch: {
    data: {
      handler() {
        this.drawHeatmap();
      },
      deep: true
    },
    timeRange() {
      this.drawHeatmap();
    },
    channel() {
      this.drawHeatmap();
    },
    type() {
      this.drawHeatmap();
    }
  },
  beforeDestroy() {
    if (this.chartTimer) {
      clearInterval(this.chartTimer);
    }
  },
  methods: {
    startChartRefresh() {
      this.chartTimer = setInterval(() => {
        this.drawHeatmap();
      }, 10000);
    },
    
    drawHeatmap() {
      const chartDom = document.getElementById('channelFlowHeatmap');
      if (!chartDom) {
        console.warn("Heatmap DOM element not found");
        return;
      }
      
      const myChart = echarts.init(chartDom);
      
      const timeData = this.data[this.timeRange];
      const heatmapData = this.generateHeatmapData(timeData);
      
      const option = {
        title: {
          text: `${this.getTimeRangeText()} ${this.type === 'entry' ? '进入' : '离开'}人数分布`,
          textStyle: { 
            color: '#fff', 
            fontSize: 16,
            fontWeight: 'normal'
          },
          left: 'center',
          top: 10
        },
        tooltip: {
          position: 'top',
          formatter: function(params) {
            return `${params.data[1]}: ${params.data[2]}人`;
          },
          backgroundColor: 'rgba(0, 0, 0, 0.8)',
          borderColor: '#1e3a8a',
          textStyle: {
            color: '#fff'
          }
        },
        grid: {
          height: '70%',
          top: '15%',
          left: '10%',
          right: '10%',
          bottom: '10%'
        },
        xAxis: {
          type: 'category',
          data: timeData.hours,
          splitArea: { 
            show: true,
            areaStyle: {
              color: 'rgba(255, 255, 255, 0.05)'
            }
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.3)'
            }
          },
          axisLabel: {
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: 11
          }
        },
        yAxis: {
          type: 'category',
          data: timeData.channels,
          splitArea: { 
            show: true,
            areaStyle: {
              color: 'rgba(255, 255, 255, 0.05)'
            }
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(255, 255, 255, 0.3)'
            }
          },
          axisLabel: {
            color: 'rgba(255, 255, 255, 0.8)',
            fontSize: 11
          }
        },
        visualMap: {
          min: 0,
          max: this.getMaxValue(timeData),
          calculable: true,
          orient: 'horizontal',
          left: 'center',
          bottom: '5%',
          textStyle: {
            color: '#fff'
          },
          inRange: {
            color: [
              '#313695', '#4575b4', '#74add1', '#abd9e9', 
              '#e0f3f8', '#ffffcc', '#fee090', '#fdae61', 
              '#f46d43', '#d73027', '#a50026'
            ]
          }
        },
        series: [{
          name: '流量',
          type: 'heatmap',
          data: heatmapData,
          label: {
            show: true,
            color: '#fff',
            fontSize: 10
          },
          emphasis: {
            itemStyle: {
              shadowBlur: 10,
              shadowColor: 'rgba(0, 0, 0, 0.5)'
            }
          }
        }]
      };
      
      myChart.setOption(option);
      
      // 响应式变化
      window.addEventListener("resize", () => myChart.resize(), false);
    },
    
    generateHeatmapData(timeData) {
      const data = [];
      
      timeData.hourly.forEach((hourData, hourIndex) => {
        timeData.channels.forEach((channel, channelIndex) => {
          // 根据通道类型过滤
          if (this.channel === 'entry' && !channel.includes('入口')) {
            return;
          }
          if (this.channel === 'exit' && !channel.includes('出口')) {
            return;
          }
          
          const value = hourData.channels[channel] || 0;
          data.push([hourIndex, channelIndex, value]);
        });
      });
      
      return data;
    },
    
    getMaxValue(timeData) {
      let max = 0;
      timeData.hourly.forEach(hourData => {
        Object.values(hourData.channels).forEach(value => {
          if (value > max) {
            max = value;
          }
        });
      });
      return Math.ceil(max / 10) * 10; // 向上取整到10的倍数
    },
    
    getTimeRangeText() {
      const timeRangeMap = {
        'today': '今日',
        'week': '本周',
        'month': '本月'
      };
      return timeRangeMap[this.timeRange] || '今日';
    }
  }
};
</script>

<style lang="scss" scoped>
.heatmap-container {
  width: 100%;
  height: 100%;
  
  #channelFlowHeatmap {
    width: 100%;
    height: 100%;
  }
}
</style>
