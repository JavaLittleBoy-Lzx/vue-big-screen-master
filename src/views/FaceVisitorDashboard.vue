<template>
  <div id="face-visitor-dashboard">
    <FullScreenContainerFix class="bg">
      <div class="host-body">
        <!-- 顶部标题与时间范围选择 -->
        <div class="header-section">
          <div class="header-center">
            <div class="main-title">人脸访客态势大屏</div>
          </div>
          <div class="header-right">
            <!-- 访问模式切换：全部 / 直刷身份证 / 预约通道 -->
            <div class="mode-selector">
              <select v-model="accessMode" @change="onAccessModeChange" class="time-select">
                <option value="all">全部通道</option>
                <option value="direct">直刷身份证</option>
                <option value="reserved">预约通道</option>
              </select>
            </div>
            <div class="time-selector">
              <select v-model="selectedTimeRange" @change="onTimeRangeChange" class="time-select">
                <option value="today">今日</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
                <option value="year">本年度</option>
              </select>
            </div>
            <div class="datetime-info">
              <span class="datetime-text">{{ currentDateTime }}</span>
            </div>
          </div>
        </div>

        <!-- KPI 区域 -->
        <div class="kpi-section">
          <div class="kpi-card">
            <div class="kpi-header"><span class="kpi-title">今日进场(人)</span></div>
            <div class="kpi-value">{{ formatNumber(currentData.face.entry) }}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-header"><span class="kpi-title">今日出场(人)</span></div>
            <div class="kpi-value">{{ formatNumber(currentData.face.exit) }}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-header"><span class="kpi-title">在场人数</span></div>
            <div class="kpi-value">{{ formatNumber(currentData.face.current) }}</div>
          </div>
          <div class="kpi-card">
            <div class="kpi-header"><span class="kpi-title">识别成功率</span></div>
            <div class="kpi-value">{{ currentData.face.accuracy }}%</div>
          </div>
        </div>

        <!-- 主体三列布局：左-中-右 -->
        <div class="main-content-grid">
          <!-- 左列：分时趋势 + 通道占比 -->
          <div class="content-column">
            <div class="module-container compact">
              <dv-border-box-12>
                <HourlyFlowStackedChart />
              </dv-border-box-12>
            </div>
            <div class="module-container channel-pie-container">
              <dv-border-box-12>
                <ChannelFlowPieChart 
                  :channelsData="filteredChannels" 
                  :selectedTimeRange="selectedTimeRange"
                  @channelClick="openChannelCompare"
                />
              </dv-border-box-12>
            </div>
          </div>

          <!-- 中列：路径/趋势组合（复用现有中心面板）-->
          <div class="content-column">
            <div class="module-container main-chart">
              <center 
                :yearlyEntry="filteredKpis.entry"
                :monthlyEntry="filteredKpisMonthly.entry"
                :dailyEntry="filteredKpisDaily.entry"
                :currentVehicles="filteredKpis.current"
                :dailyRevenue="0"
                :channels="filteredChannels"
              />
            </div>
          </div>

          <!-- 右列：对比与运维 -->
          <div class="content-column">
            <div class="module-container">
              <dv-border-box-12>
                <ChannelComparisonLineChart 
                  :channelsData="filteredChannels"
                  :selectedTimeRange="selectedTimeRange"
                />
              </dv-border-box-12>
            </div>
            <div class="module-container">
              <dv-border-box-13>
                <centreRight2 :revenueData="mockOpsData" />
              </dv-border-box-13>
            </div>
          </div>
        </div>

        <!-- 通道对比弹窗（简化版，占位）-->
        <div v-if="showChannelModal" class="modal-overlay" @click="closeChannelModal">
          <div class="modal-content" @click.stop>
            <div class="modal-header">
              <h3>通道人流对比</h3>
              <button class="close-btn" @click="closeChannelModal">×</button>
            </div>
            <div class="modal-body">
              <div class="charts-container">
                <div class="chart-section" style="width: 700px;">
                  <ModalChannelPieChart 
                    :channelsData="modalChannelData.selectedChannels"
                    :selectedTimeRange="selectedTimeRange"
                    channelType="entry"
                  />
                </div>
                <div class="chart-section" style="width: 1060px; margin-left: 2px;">
                  <ChannelUtilizationChart 
                    :channelsData="modalChannelData.selectedChannels"
                    :selectedTimeRange="selectedTimeRange"
                    channelType="entry"
                  />
                </div>
                <div class="chart-section" style="width: 885px;">
                  <ChannelComparisonLineChart 
                    :channelsData="modalChannelData.selectedChannels"
                    :selectedTimeRange="selectedTimeRange"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </FullScreenContainerFix>
  </div>
</template>

<script>
import FullScreenContainerFix from "@/components/FullScreenContainerFix.vue";
import HourlyFlowStackedChart from "@/components/echart/HourlyFlowStackedChart.vue";
import ChannelFlowPieChart from "@/components/echart/ChannelFlowPieChart.vue";
import ChannelComparisonLineChart from "@/components/echart/ChannelComparisonLineChart.vue";
import ChannelUtilizationChart from "@/components/echart/ChannelUtilizationChart.vue";
import ModalChannelPieChart from "@/components/echart/ModalChannelPieChart.vue";
import centreRight2 from "./centreRight2";
import center from "./center";

export default {
  components: {
    FullScreenContainerFix,
    HourlyFlowStackedChart,
    ChannelFlowPieChart,
    ChannelComparisonLineChart,
    ChannelUtilizationChart,
    ModalChannelPieChart,
    centreRight2,
    center
  },
  data() {
    return {
      accessMode: "all", // all | direct | reserved
      selectedTimeRange: "today",
      currentDateTime: "",
      showChannelModal: false,
      modalChannelData: { selectedChannels: [] },
      channelStatsData: [
        { name: '东门入口', type: '进口', utilization: 83, accessMode: 'direct' },
        { name: '东门出口', type: '出口', utilization: 79, accessMode: 'direct' },
        { name: '西门入口', type: '进口', utilization: 88, accessMode: 'reserved' },
        { name: '西门出口', type: '出口', utilization: 74, accessMode: 'reserved' },
        { name: '南门入口', type: '进口', utilization: 81, accessMode: 'reserved' },
        { name: '北门入口', type: '进口', utilization: 76, accessMode: 'direct' }
      ],
      timeRangeData: {
        today: { face: { entry: 320, exit: 298, current: 746, accuracy: 98.5 } },
        week: { face: { entry: 2210, exit: 2096, current: 802, accuracy: 98.2 } },
        month: { face: { entry: 9360, exit: 9025, current: 690, accuracy: 97.9 } },
        year: { face: { entry: 112340, exit: 109876, current: 720, accuracy: 98.1 } }
      },
      mockOpsData: {}
    };
  },
  computed: {
    currentData() {
      return this.timeRangeData[this.selectedTimeRange] || this.timeRangeData.today;
    },
    filteredChannels() {
      if (this.accessMode === 'all') return this.channelStatsData;
      return this.channelStatsData.filter(c => c.accessMode === this.accessMode);
    },
    // 基于当前模式的KPI（简单按通道数量比例缩放模拟）
    filteredKpis() {
      const base = this.currentData.face;
      const ratio = this.filteredChannels.length / Math.max(1, this.channelStatsData.length);
      return {
        entry: Math.round(base.entry * ratio),
        exit: Math.round(base.exit * ratio),
        current: Math.round(base.current * ratio),
        accuracy: base.accuracy
      };
    },
    filteredKpisDaily() {
      const base = this.timeRangeData.today.face;
      const ratio = this.filteredChannels.length / Math.max(1, this.channelStatsData.length);
      return { entry: Math.round(base.entry * ratio) };
    },
    filteredKpisMonthly() {
      const base = this.timeRangeData.month.face;
      const ratio = this.filteredChannels.length / Math.max(1, this.channelStatsData.length);
      return { entry: Math.round(base.entry * ratio) };
    }
  },
  mounted() {
    this.updateDateTime();
    this.timeTimer = setInterval(() => this.updateDateTime(), 1000);
  },
  beforeDestroy() {
    if (this.timeTimer) clearInterval(this.timeTimer);
  },
  methods: {
    onTimeRangeChange() {},
    onAccessModeChange() {
      // 当访问模式切换时，关闭弹窗并刷新图表所用数据
      if (this.showChannelModal) this.closeChannelModal();
    },
    updateDateTime() {
      const now = new Date();
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      const y = now.getFullYear();
      const m = String(now.getMonth() + 1).padStart(2, '0');
      const d = String(now.getDate()).padStart(2, '0');
      const wd = weekdays[now.getDay()];
      const hh = String(now.getHours()).padStart(2, '0');
      const mm = String(now.getMinutes()).padStart(2, '0');
      const ss = String(now.getSeconds()).padStart(2, '0');
      this.currentDateTime = `${y}年${m}月${d}日 ${wd} ${hh}:${mm}:${ss}`;
    },
    openChannelCompare() {
      // 仅从当前访问模式下的通道中选择
      const source = this.filteredChannels;
      const picked = source.slice(0, 4).map((c) => ({ ...c, flow: Math.floor(Math.random()*200)+80 }));
      this.modalChannelData = { selectedChannels: picked };
      this.showChannelModal = true;
    },
    closeChannelModal() {
      this.showChannelModal = false;
      this.modalChannelData = { selectedChannels: [] };
    },
    formatNumber(n) {
      return Number(n || 0).toLocaleString();
    }
  }
};
</script>

<style lang="scss" scoped>
@import "../assets/scss/index.scss";

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 15px 30px;
  background: rgba(11, 19, 42, 0.9);
  border-bottom: 1px solid #1e3a8a;

  .header-center {
    flex: 1;
    text-align: left;
    padding-left: 650px;

    .main-title {
      font-size: 28px;
      font-weight: bold;
      color: #ffffff;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }
  }

  .header-right {
    display: flex;
    gap: 20px;
    align-items: center;

    .time-selector {
      .time-select {
        background: rgba(11, 19, 42, 0.9);
        border: 1px solid #1e3a8a;
        border-radius: 6px;
        color: #ffffff;
        padding: 8px 15px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;

        &:hover { border-color: #3b82f6; box-shadow: 0 0 10px rgba(59, 130, 246, 0.3); }
        &:focus { outline: none; border-color: #3b82f6; box-shadow: 0 0 15px rgba(59, 130, 246, 0.4); }

        option { background: #0b132a; color: #ffffff; }
      }
    }
  }

  .datetime-info { color: #e2e8f0; }
}

.kpi-section {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 20px 30px;
  background: rgba(11, 19, 42, 0.6);

  .kpi-card {
    flex: 1;
    max-width: 200px;
    background: rgba(11, 19, 42, 0.9);
    border: 1px solid #1e3a8a;
    border-radius: 8px;
    padding: 20px 15px;
    text-align: center;
    transition: all 0.3s ease;
    &:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2); border-color: #3b82f6; }
    .kpi-value { font-size: 32px; font-weight: bold; color: #3b82f6; margin-bottom: 8px; }
  }
}

.main-content-grid {
  display: grid;
  grid-template-columns: 25% 50% 25%;
  padding-right: 10px;
  padding: 2px 15px 15px 16px;
  margin-left: -19px;
  margin-top: -5px;

  .content-column { width: 100%; display: flex; flex-direction: column; gap: 15px; }
  .module-container { flex: 1; min-height: 50px; }
  .module-container.compact { flex: none; height: 380px; min-height: 0; }
  .module-container.main-chart { flex: 2; min-height: 520px; }
  .channel-pie-container { flex: none; height: 300px; min-height: 0; margin-top: -20px; }
}

.modal-overlay { position: fixed; inset: 0; background: rgba(0,0,0,0.8); display: flex; align-items: center; justify-content: center; z-index: 9999; backdrop-filter: blur(5px); }
.modal-content { background: rgba(11,19,42,0.95); border: 1px solid #1e3a8a; border-radius: 12px; width: 90%; max-width: 1600px; max-height: 90vh; overflow: hidden; box-shadow: 0 20px 60px rgba(0,0,0,0.5); }
.modal-header { display: flex; justify-content: space-between; align-items: center; padding: 15px 20px; border-bottom: 1px solid #1e3a8a; background: rgba(11,19,42,0.9); }
.modal-header h3 { margin: 0; font-size: 20px; color: #fff; font-weight: bold; }
.close-btn { background: none; border: none; color: #94a3b8; font-size: 24px; cursor: pointer; width: 30px; height: 30px; display: flex; align-items: center; justify-content: center; border-radius: 50%; }
.modal-body { padding: 15px; max-height: calc(90vh - 80px); overflow-y: auto; }
.charts-container { display: grid; grid-template-columns: 0.6fr 0.4fr; grid-template-rows: 250px 1fr; gap: 2px; width: 100%; }
.charts-container .chart-section { background: none; border: none; border-radius: 0; padding: 2px; width: 100%; min-height: 250px; }
.charts-container .chart-section:nth-child(1),
.charts-container .chart-section:nth-child(2) { height: 250px; min-height: 250px; }
.charts-container .chart-section:nth-child(3) { height: 100%; min-height: 450px; grid-column: 1 / -1; grid-row: 2; }
</style>


