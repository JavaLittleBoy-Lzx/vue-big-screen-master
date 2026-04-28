<template>
  <div class="night-alert-panel">
    <div class="modal-overlay" @click="closeModal"></div>

    <div class="night-alert-modal" @click.stop>
      <!-- 头部：标题 + 日期筛选 + 关闭，合并为一行 -->
      <div class="modal-header">
        <div class="header-left">
          <span class="modal-icon">🌙</span>
          <span class="modal-title">夜间学生出校统计</span>
        </div>
        <div class="header-center">
          <input type="date" v-model="startDate" class="date-input" />
          <span class="date-sep">~</span>
          <input type="date" v-model="endDate" class="date-input" />
          <button class="btn-query" @click="onDateChange">查询</button>
        </div>
        <button class="btn-close" @click="closeModal">×</button>
      </div>

      <!-- 配置视图 -->
      <div v-if="viewMode === 'config'" class="config-content">
        <NightAlertConfigModal @close="closeModal" />
      </div>

      <!-- 主内容区域 -->
      <div v-else class="main-content">
        <!-- 汇总卡片 -->
        <div class="summary-cards">
          <div class="summary-card">
            <span class="card-icon total">🌙</span>
            <div class="card-body">
              <div class="card-value">{{ getTotalCount() }}</div>
              <div class="card-label">总出校人次</div>
            </div>
          </div>
          <div class="summary-card">
            <span class="card-icon male">♂</span>
            <div class="card-body">
              <div class="card-value">{{ getMaleCount() }}</div>
              <div class="card-label">男生</div>
            </div>
          </div>
          <div class="summary-card">
            <span class="card-icon female">♀</span>
            <div class="card-body">
              <div class="card-value">{{ getFemaleCount() }}</div>
              <div class="card-label">女生</div>
            </div>
          </div>
          <div class="summary-card">
            <span class="card-icon channels">{{ channelStats.length }}</span>
            <div class="card-body">
              <div class="card-value">{{ channelStats.length }}</div>
              <div class="card-label">涉及通道</div>
            </div>
          </div>
        </div>

        <!-- 图表区域：三行自适应 -->
        <div class="charts-area">
          <!-- 第一行：通道分布 + 性别比例 -->
          <div class="chart-row">
            <div class="chart-card flex-2">
              <div class="chart-title-bar">
                <span class="ct">出口通道分布</span>
                <span class="cs">各通道出校人次统计</span>
              </div>
              <div class="chart-body">
                <div ref="channelChartRef" class="echarts-box" v-if="channelStats.length > 0"></div>
                <div v-else class="chart-empty">暂无数据</div>
              </div>
            </div>
            <div class="chart-card flex-1">
              <div class="chart-title-bar">
                <span class="ct">性别比例</span>
                <span class="cs">男女占比</span>
              </div>
              <div class="chart-body">
                <div ref="genderChartRef" class="echarts-box" v-if="genderStats.length > 0"></div>
                <div v-else class="chart-empty">暂无数据</div>
              </div>
            </div>
          </div>

          <!-- 第二行：学院分布 + 时段分布 -->
          <div class="chart-row">
            <div class="chart-card flex-2">
              <div class="chart-title-bar">
                <span class="ct">学院分布</span>
                <span class="cs">各学院出校人次 TOP10</span>
              </div>
              <div class="chart-body">
                <div ref="collegeChartRef" class="echarts-box" v-if="collegeStats.length > 0"></div>
                <div v-else class="chart-empty">暂无数据</div>
              </div>
            </div>
            <div class="chart-card flex-1">
              <div class="chart-title-bar">
                <span class="ct">时段分布</span>
                <span class="cs">24小时出校趋势</span>
              </div>
              <div class="chart-body">
                <div ref="hourlyChartRef" class="echarts-box" v-if="hourlyStats.length > 0"></div>
                <div v-else class="chart-empty">暂无数据</div>
              </div>
            </div>
          </div>

          <!-- 第三行：日出校趋势（满宽） -->
          <div class="chart-row">
            <div class="chart-card flex-1">
              <div class="chart-title-bar">
                <span class="ct">日出校趋势</span>
                <span class="cs">每日出校人次</span>
              </div>
              <div class="chart-body">
                <div ref="dailyTrendChartRef" class="echarts-box" v-if="dailyTrendStats.length > 0"></div>
                <div v-else class="chart-empty">暂无数据</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <NightAlertConfigModal
      v-if="showConfigModal"
      @close="showConfigModal = false"
      @updated="handleConfigUpdated"
    />
  </div>
</template>

<script>
import * as echarts from 'echarts';
import nightAlertService from '@/services/nightAlertService';
import NightAlertConfigModal from './NightAlertConfigModal.vue';

export default {
  name: 'NightAlertPanel',
  components: {
    NightAlertConfigModal
  },
  props: {
    viewMode: {
      type: String,
      default: 'stats'
    }
  },
  data() {
    return {
      statsLoading: false,
      channelStats: [],
      genderStats: [],
      collegeStats: [],
      hourlyStats: [],
      dailyTrendStats: [],

      startDate: (() => {
        const d = new Date();
        d.setDate(d.getDate() - 30);
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })(),
      endDate: (() => {
        const d = new Date();
        return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
      })(),

      showConfigModal: false,

      channelChart: null,
      genderChart: null,
      collegeChart: null,
      hourlyChart: null,
      dailyTrendChart: null
    };
  },
  mounted() {
    this.loadStatistics();
    window.addEventListener('resize', this.handleResize);
  },
  beforeDestroy() {
    this.disposeCharts();
    window.removeEventListener('resize', this.handleResize);
  },
  methods: {
    closeModal() {
      this.$emit('close');
    },

    handleResize() {
      ['channelChart', 'genderChart', 'collegeChart', 'hourlyChart', 'dailyTrendChart'].forEach(name => {
        if (this[name]) this[name].resize();
      });
    },

    disposeCharts() {
      ['channelChart', 'genderChart', 'collegeChart', 'hourlyChart', 'dailyTrendChart'].forEach(name => {
        if (this[name]) {
          this[name].dispose();
          this[name] = null;
        }
      });
    },

    async loadStatistics() {
      this.statsLoading = true;
      try {
        const params = {};
        if (this.startDate) params.startTime = this.startDate;
        if (this.endDate) params.endTime = this.endDate;

        const response = await nightAlertService.getStatistics(params);
        const result = response.data;

        if (result.code === 200 || result.code === '0') {
          const data = result.data || {};

          this.channelStats = data.channelStats || [];
          this.genderStats = data.genderStats || [];
          this.collegeStats = data.collegeStats || [];
          this.hourlyStats = data.hourlyStats || [];
          this.dailyTrendStats = data.dailyTrendStats || [];

          this.$nextTick(() => {
            setTimeout(() => {
              this.initChannelChart();
              this.initGenderChart();
              this.initCollegeChart();
              this.initHourlyChart();
              this.initDailyTrendChart();
            }, 100);
          });
        }
      } catch (error) {
        console.error('[夜间提醒] 加载统计数据失败', error);
      } finally {
        this.statsLoading = false;
      }
    },

    getTotalCount() {
      return this.channelStats.reduce((sum, item) => sum + (item.count || 0), 0);
    },

    getMaleCount() {
      const male = this.genderStats.find(g => g.gender === '男');
      return male ? male.count : 0;
    },

    getFemaleCount() {
      const female = this.genderStats.find(g => g.gender === '女');
      return female ? female.count : 0;
    },

    onDateChange() {
      this.loadStatistics();
    },

    initChannelChart() {
      if (!this.$refs.channelChartRef || this.channelStats.length === 0) return;
      if (this.channelChart) this.channelChart.dispose();

      this.channelChart = echarts.init(this.$refs.channelChartRef);
      this.channelChart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: 'rgba(11, 19, 42, 0.95)',
          borderColor: '#3b82f6',
          textStyle: { color: '#fff' },
          formatter: '{b}: {c} 人次'
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '10px', containLabel: true },
        xAxis: {
          type: 'category',
          data: this.channelStats.map(item => item.channelName),
          axisLabel: { color: '#94a3b8', fontSize: 10, rotate: 30, interval: 0 },
          axisLine: { lineStyle: { color: '#1e3a8a' } }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#94a3b8', fontSize: 10 },
          splitLine: { lineStyle: { color: 'rgba(30, 58, 138, 0.3)' } }
        },
        series: [{
          type: 'bar',
          data: this.channelStats.map(item => item.count),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: '#60a5fa' },
              { offset: 1, color: '#3b82f6' }
            ]),
            borderRadius: [4, 4, 0, 0]
          },
          barWidth: '50%',
          label: { show: true, position: 'top', color: '#fff', fontSize: 10 }
        }]
      });
    },

    initGenderChart() {
      if (!this.$refs.genderChartRef || this.genderStats.length === 0) return;
      if (this.genderChart) this.genderChart.dispose();

      this.genderChart = echarts.init(this.$refs.genderChartRef);
      this.genderChart.setOption({
        tooltip: {
          trigger: 'item',
          backgroundColor: 'rgba(11, 19, 42, 0.95)',
          borderColor: '#3b82f6',
          textStyle: { color: '#fff' },
          formatter: '{b}: {c}人 ({d}%)'
        },
        legend: {
          orient: 'vertical',
          right: '5%',
          top: 'center',
          textStyle: { color: '#94a3b8', fontSize: 11 },
          itemWidth: 12,
          itemHeight: 12
        },
        series: [{
          type: 'pie',
          radius: ['40%', '70%'],
          center: ['35%', '50%'],
          itemStyle: {
            borderRadius: 6,
            borderColor: 'rgba(11, 19, 42, 0.8)',
            borderWidth: 2
          },
          label: { show: true, color: '#e2e8f0', fontSize: 11, formatter: '{b}\n{c}人' },
          data: this.genderStats.map((item, index) => ({
            value: item.count,
            name: item.gender,
            itemStyle: {
              color: index === 0
                ? new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#3b82f6' }, { offset: 1, color: '#60a5fa' }])
                : new echarts.graphic.LinearGradient(0, 0, 1, 0, [{ offset: 0, color: '#ec4899' }, { offset: 1, color: '#f472b6' }])
            }
          }))
        }]
      });
    },

    initCollegeChart() {
      if (!this.$refs.collegeChartRef || this.collegeStats.length === 0) return;
      if (this.collegeChart) this.collegeChart.dispose();

      this.collegeChart = echarts.init(this.$refs.collegeChartRef);
      const topColleges = this.collegeStats.slice(0, 10);
      this.collegeChart.setOption({
        tooltip: {
          trigger: 'axis',
          axisPointer: { type: 'shadow' },
          backgroundColor: 'rgba(11, 19, 42, 0.95)',
          borderColor: '#3b82f6',
          textStyle: { color: '#fff' },
          formatter: '{b}: {c}人'
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '10px', containLabel: true },
        xAxis: {
          type: 'value',
          axisLabel: { color: '#94a3b8', fontSize: 10 },
          splitLine: { lineStyle: { color: 'rgba(30, 58, 138, 0.3)' } }
        },
        yAxis: {
          type: 'category',
          data: topColleges.map(item => item.college && item.college.length > 6 ? item.college.substring(0, 6) + '..' : item.college).reverse(),
          axisLabel: { color: '#e2e8f0', fontSize: 10 },
          axisLine: { lineStyle: { color: '#1e3a8a' } }
        },
        series: [{
          type: 'bar',
          data: topColleges.map(item => item.count).reverse(),
          itemStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 1, 0, [
              { offset: 0, color: '#8b5cf6' },
              { offset: 1, color: '#a78bfa' }
            ]),
            borderRadius: [0, 4, 4, 0]
          },
          barWidth: '50%',
          label: { show: true, position: 'right', color: '#fff', fontSize: 10 }
        }]
      });
    },

    initHourlyChart() {
      if (!this.$refs.hourlyChartRef || this.hourlyStats.length === 0) return;
      if (this.hourlyChart) this.hourlyChart.dispose();

      this.hourlyChart = echarts.init(this.$refs.hourlyChartRef);
      this.hourlyChart.setOption({
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(11, 19, 42, 0.95)',
          borderColor: '#3b82f6',
          textStyle: { color: '#fff' },
          formatter: '{b}: {c}人次'
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '10px', containLabel: true },
        xAxis: {
          type: 'category',
          data: this.hourlyStats.map(item => item.hour + ':00'),
          axisLabel: { color: '#94a3b8', fontSize: 9, interval: 2 },
          axisLine: { lineStyle: { color: '#1e3a8a' } }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#94a3b8', fontSize: 9 },
          splitLine: { lineStyle: { color: 'rgba(30, 58, 138, 0.3)' } }
        },
        series: [{
          type: 'line',
          data: this.hourlyStats.map(item => item.count),
          smooth: true,
          symbol: 'circle',
          symbolSize: 5,
          lineStyle: { color: '#8b5cf6', width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(139, 92, 246, 0.4)' },
              { offset: 1, color: 'rgba(139, 92, 246, 0.05)' }
            ])
          },
          itemStyle: { color: '#8b5cf6' }
        }]
      });
    },

    initDailyTrendChart() {
      if (!this.$refs.dailyTrendChartRef || this.dailyTrendStats.length === 0) return;
      if (this.dailyTrendChart) this.dailyTrendChart.dispose();

      this.dailyTrendChart = echarts.init(this.$refs.dailyTrendChartRef);
      this.dailyTrendChart.setOption({
        tooltip: {
          trigger: 'axis',
          backgroundColor: 'rgba(11, 19, 42, 0.95)',
          borderColor: '#3b82f6',
          textStyle: { color: '#fff' },
          formatter: '{b}\n{c}人次'
        },
        grid: { left: '3%', right: '4%', bottom: '3%', top: '10px', containLabel: true },
        xAxis: {
          type: 'category',
          data: this.dailyTrendStats.map(item => item.date),
          axisLabel: { color: '#94a3b8', fontSize: 9, rotate: 30, interval: Math.floor(this.dailyTrendStats.length / 7) },
          axisLine: { lineStyle: { color: '#1e3a8a' } }
        },
        yAxis: {
          type: 'value',
          axisLabel: { color: '#94a3b8', fontSize: 9 },
          splitLine: { lineStyle: { color: 'rgba(30, 58, 138, 0.3)' } }
        },
        series: [{
          type: 'line',
          data: this.dailyTrendStats.map(item => item.count),
          smooth: true,
          symbol: 'circle',
          symbolSize: 4,
          lineStyle: { color: '#3b82f6', width: 2 },
          areaStyle: {
            color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
              { offset: 0, color: 'rgba(59, 130, 246, 0.4)' },
              { offset: 1, color: 'rgba(59, 130, 246, 0.05)' }
            ])
          },
          itemStyle: { color: '#3b82f6' }
        }]
      });
    },

    handleConfigUpdated() {
      this.showConfigModal = false;
      this.loadStatistics();
    }
  }
};
</script>

<style lang="scss" scoped>
.night-alert-panel {
  position: fixed;
  inset: 0;
  z-index: 9999;
  display: flex;
  align-items: center;
  justify-content: center;

  .modal-overlay {
    position: absolute;
    inset: 0;
    z-index: 9998;
    background: rgba(0, 0, 0, 0.85);
    backdrop-filter: blur(8px);
  }

  .night-alert-modal {
    position: relative;
    z-index: 10000;
    width: 95%;
    max-width: 1400px;
    height: 85vh;
    min-height: 600px;
    background: linear-gradient(135deg, rgba(11, 19, 42, 0.98) 0%, rgba(15, 23, 42, 0.95) 100%);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 16px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    box-shadow: 0 25px 80px rgba(0, 0, 0, 0.6), 0 0 40px rgba(59, 130, 246, 0.1);
  }

  /* 头部：标题+日期+关闭 一行 */
  .modal-header {
    display: flex;
    align-items: center;
    padding: 10px 20px;
    border-bottom: 1px solid rgba(59, 130, 246, 0.2);
    background: linear-gradient(90deg, rgba(59, 130, 246, 0.08) 0%, transparent 50%);
    flex-shrink: 0;
    gap: 16px;
    min-height: 50px;
    height: 50px;
    box-sizing: border-box;

    .header-left {
      display: flex;
      align-items: center;
      gap: 8px;
      flex-shrink: 0;
      .modal-icon { font-size: 20px; }
      .modal-title {
        font-size: 17px;
        font-weight: 700;
        color: #fff;
      }
    }

    .header-center {
      display: flex;
      align-items: center;
      gap: 8px;
      margin-left: auto;
      flex-wrap: nowrap;

      .date-input {
        background: rgba(11, 19, 42, 0.9);
        border: 1px solid rgba(59, 130, 246, 0.3);
        border-radius: 6px;
        color: #fff;
        padding: 4px 8px;
        font-size: 12px;
        min-width: 120px;
        cursor: pointer;
        &:focus { outline: none; border-color: #3b82f6; }
        &::-webkit-calendar-picker-indicator { filter: invert(1); cursor: pointer; }
      }

      .date-sep {
        color: #64748b;
        font-size: 12px;
      }

      .btn-query {
        background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
        border: none;
        border-radius: 6px;
        color: #fff;
        padding: 5px 14px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.2s;
        &:hover { background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%); }
      }
    }

    .btn-close {
      width: 32px;
      height: 32px;
      border: 1px solid rgba(239, 68, 68, 0.3);
      border-radius: 8px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 18px;
      background: rgba(239, 68, 68, 0.15);
      color: #ef4444;
      flex-shrink: 0;
      margin-left: 8px;
      &:hover { background: rgba(239, 68, 68, 0.3); }
    }
  }

  .config-content {
    flex: 1;
    overflow-y: auto;
    padding: 20px;
  }

  /* 主内容：汇总卡片 + 三行图表，全部用flex自适应 */
  .main-content {
    flex: 1;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    padding: 12px 16px;
    gap: 10px;
    min-height: 0;
  }

  /* 汇总卡片 */
  .summary-cards {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 10px;
    flex-shrink: 0;
    min-height: 60px;

    .summary-card {
      display: flex;
      align-items: center;
      gap: 10px;
      background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%);
      border: 1px solid rgba(59, 130, 246, 0.2);
      border-radius: 10px;
      padding: 10px 14px;

      .card-icon {
        width: 38px;
        height: 38px;
        border-radius: 8px;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 17px;
        font-weight: bold;
        flex-shrink: 0;
        &.total { background: linear-gradient(135deg, rgba(139, 92, 246, 0.3), rgba(139, 92, 246, 0.1)); color: #a78bfa; }
        &.male { background: linear-gradient(135deg, rgba(59, 130, 246, 0.3), rgba(59, 130, 246, 0.1)); color: #60a5fa; }
        &.female { background: linear-gradient(135deg, rgba(236, 72, 153, 0.3), rgba(236, 72, 153, 0.1)); color: #f472b6; }
        &.channels { background: linear-gradient(135deg, rgba(34, 197, 94, 0.3), rgba(34, 197, 94, 0.1)); color: #4ade80; font-size: 15px; }
      }
      .card-body {
        .card-value { font-size: 20px; font-weight: 700; color: #fff; line-height: 1; }
        .card-label { font-size: 10px; color: #64748b; margin-top: 2px; letter-spacing: 0.5px; }
      }
    }
  }

  /* 图表区域：三行弹性分配 */
  .charts-area {
    flex: 1;
    display: flex;
    flex-direction: column;
    gap: 10px;
    overflow: hidden;
    min-height: 0;
    height: calc(85vh - 180px);
  }

  .chart-row {
    display: flex;
    gap: 10px;
    flex-shrink: 0;
    height: calc((100% - 20px) / 3);

    &:first-child { margin-top: 0; }
    &:last-child { margin-bottom: 0; }
  }

  .chart-card {
    background: linear-gradient(135deg, rgba(30, 41, 59, 0.9) 0%, rgba(15, 23, 42, 0.9) 100%);
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 10px;
    padding: 10px 12px;
    display: flex;
    flex-direction: column;
    overflow: hidden;
    min-height: 0;
    flex-shrink: 0;

    &.flex-1 { flex: 1; }
    &.flex-2 { flex: 2; }

    .chart-title-bar {
      display: flex;
      justify-content: space-between;
      align-items: baseline;
      margin-bottom: 6px;
      padding-bottom: 6px;
      border-bottom: 1px solid rgba(59, 130, 246, 0.15);
      flex-shrink: 0;

      .ct { font-size: 13px; font-weight: 600; color: #fff; }
      .cs { font-size: 10px; color: #64748b; }
    }

    .chart-body {
      flex: 1;
      min-height: 80px;
      position: relative;
    }

    .echarts-box {
      width: 100%;
      height: 100%;
    }

    .chart-empty {
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      font-size: 13px;
    }
  }
}
</style>
