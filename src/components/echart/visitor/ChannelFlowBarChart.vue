<template>
  <div class="channel-flow-bar-chart">
    <div ref="chartContainer" class="chart-container"></div>
  </div>
</template>

<script>
import * as echarts from 'echarts';

export default {
  name: 'ChannelFlowBarChart',
  props: {
    data: {
      type: Object,
      required: true
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
      chart: null
    };
  },
  mounted() {
    this.initChart();
    this.updateChart();
  },
  beforeDestroy() {
    if (this.chart) {
      this.chart.dispose();
    }
  },
  watch: {
    channel() {
      this.updateChart();
    },
    type() {
      this.updateChart();
    },
    data: {
      handler() {
        this.updateChart();
      },
      deep: true
    }
  },
  methods: {
    initChart() {
      this.chart = echarts.init(this.$refs.chartContainer);
      
      // 监听窗口大小变化
      window.addEventListener('resize', () => {
        if (this.chart) {
          this.chart.resize();
        }
      });
    },
    
    updateChart() {
      if (!this.chart || !this.data) return;
      
      const chartData = this.getChartData();
      
      const option = {
        backgroundColor: 'transparent',
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(11, 19, 42, 0.9)',
          borderColor: '#1e3a8a',
          borderWidth: 1,
          textStyle: {
            color: '#ffffff'
          },
          formatter: function(params) {
            let result = `${params[0].axisValue}<br/>`;
            params.forEach(param => {
              result += `${param.seriesName}: ${param.value}人<br/>`;
            });
            return result;
          }
        },
        legend: {
          data: chartData.series.map(s => s.name),
          textStyle: {
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 'bold'
          },
          top: 10,
          itemWidth: 20,
          itemHeight: 15
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '10%',
          top: '15%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: chartData.categories,
          axisLine: {
            lineStyle: {
              color: '#3b82f6',
              width: 3
            }
          },
          axisLabel: {
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 'bold'
          },
          axisTick: {
            lineStyle: {
              color: '#3b82f6',
              width: 2
            }
          }
        },
        yAxis: {
          type: 'value',
          name: '人数',
          nameTextStyle: {
            color: '#ffffff',
            fontSize: 14,
            fontWeight: 'bold'
          },
          axisLine: {
            lineStyle: {
              color: '#3b82f6',
              width: 3
            }
          },
          axisLabel: {
            color: '#ffffff',
            fontSize: 13,
            fontWeight: 'bold'
          },
          splitLine: {
            lineStyle: {
              color: '#1e3a8a',
              type: 'solid',
              width: 2
            }
          }
        },
        series: chartData.series.map((series, index) => ({
          name: series.name,
          type: 'bar',
          data: series.data,
          itemStyle: {
            color: series.color,
            borderRadius: [6, 6, 0, 0],
            borderWidth: 0,
            borderColor: 'transparent',
            shadowBlur: 0,
            shadowColor: 'transparent',
            shadowOffsetY: 0
          },
          emphasis: {
            itemStyle: {
              color: series.color,
              shadowBlur: 0,
              shadowColor: 'transparent',
              shadowOffsetY: 0,
              borderWidth: 0,
              borderColor: 'transparent'
            }
          },
          animationDelay: function (idx) {
            return idx * 50;
          }
        }))
      };
      
      this.chart.setOption(option);
    },
    
    getChartData() {
      // 根据通道类型和流量类型过滤数据
      let filteredData = this.data.today; // 默认使用今日数据
      
      // 根据通道类型过滤
      let channels = filteredData.channels;
      if (this.channel === 'entry') {
        channels = channels.filter(ch => ch.includes('入口'));
      } else if (this.channel === 'exit') {
        channels = channels.filter(ch => ch.includes('出口'));
      }
      
      // 生成系列数据
      const series = channels.map((channel, index) => {
        const colors = ['#3b82f6', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#06b6d4'];
        return {
          name: channel,
          data: filteredData.hourly.map(hour => hour.channels[channel] || 0),
          color: colors[index % colors.length]
        };
      });
      
      return {
        categories: filteredData.hours,
        series: series
      };
    }
  }
};
</script>

<style scoped>
.channel-flow-bar-chart {
  width: 100%;
  height: 270px;
  position: relative;
  background: linear-gradient(135deg, rgba(11, 19, 42, 0.8) 0%, rgba(30, 58, 138, 0.3) 100%);
  border-radius: 8px;
  overflow: hidden;
}

.channel-flow-bar-chart::before {
  content: '';
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: 
    radial-gradient(circle at 20% 20%, rgba(59, 130, 246, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 80% 80%, rgba(16, 185, 129, 0.1) 0%, transparent 50%),
    radial-gradient(circle at 40% 60%, rgba(245, 158, 11, 0.1) 0%, transparent 50%);
  pointer-events: none;
  z-index: 1;
}

.chart-container {
  width: 100%;
  height: 300px;
  min-height: 300px;
  position: relative;
  z-index: 2;
}
</style>
