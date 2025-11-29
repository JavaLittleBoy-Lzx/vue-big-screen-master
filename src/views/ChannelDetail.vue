<template>
  <div id="channel-detail">
    <FullScreenContainerFix class="bg">
      <div class="channel-detail-container">
        <!-- 标题区域 -->
        <div class="header-section">
          <div class="header-left">
            <button class="back-button" @click="goBack">
              <i class="icon-back">←</i>
              <span>返回</span>
            </button>
          </div>
          
          <div class="header-center">
            <div class="main-title">
              {{ channelType === 'entry' ? '进场通道详细信息' : '出场通道详细信息' }}
            </div>
            <div class="sub-title">
              共{{ filteredChannels.length }}个{{ channelType === 'entry' ? '进口' : '出口' }}通道
            </div>
          </div>
          
          <div class="header-right">
            <div class="datetime-info">
              <span class="datetime-text">{{ currentDateTime }}</span>
            </div>
          </div>
        </div>
        
        <!-- 主要内容区域 -->
        <div class="content-section">
          <!-- 统计概览 -->
          <div class="stats-overview">
            <div class="stat-card">
              <div class="stat-icon entry-icon">📊</div>
              <div class="stat-content">
                <div class="stat-value">{{ totalFlow }}</div>
                <div class="stat-label">总流量</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon avg-icon">⏱️</div>
              <div class="stat-content">
                <div class="stat-value">{{ avgFlow }}</div>
                <div class="stat-label">平均流量</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon peak-icon">📈</div>
              <div class="stat-content">
                <div class="stat-value">{{ peakFlow }}</div>
                <div class="stat-label">峰值流量</div>
              </div>
            </div>
          </div>
          
          <!-- 图表区域 -->
          <div class="charts-section">
            
            <!-- 第二行：饼图 -->
            <div class="chart-row">
              <div class="chart-item">
                <ChannelFlowPieChart 
                  :channelsData="allChannels" 
                  :showDetail="true"
                  :channelType="channelType"
                />
              </div>
            </div>
            
            <!-- 第三行：通道对比分析 -->
            <div class="chart-row">
              <div class="chart-item full-width">
                <ChannelComparisonLineChart 
                  :channelData="selectedChannel || { flow: 30 }" 
                  :channelsData="filteredChannels" 
                />
              </div>
            </div>
            
            <!-- 第四行：使用率对比图 -->
            <div class="chart-row">
              <div class="chart-item full-width">
                <ChannelUtilizationChart :channelsData="filteredChannels" />
              </div>
            </div>
            
          </div>
          
          <!-- 通道列表 -->
          <div class="channels-grid">
            <div 
              v-for="channel in filteredChannels" 
              :key="channel.name"
              class="channel-card"
              @click="selectChannel(channel)"
              :class="{ active: selectedChannel?.name === channel.name }"
            >
              <div class="channel-header">
                <div class="channel-name">{{ channel.name }}</div>
                <div class="channel-status" :class="getChannelStatusClass(channel.flow)">
                  {{ getChannelStatusText(channel.flow) }}
                </div>
              </div>
              
              <div class="channel-metrics">
                <div class="metric-item">
                  <div class="metric-label">当前流量</div>
                  <div class="metric-value">{{ channel.flow || 0 }}</div>
                </div>
                <div class="metric-item">
                  <div class="metric-label">今日累计</div>
                  <div class="metric-value">{{ channel.todayTotal || 0 }}</div>
                </div>
                <div class="metric-item">
                  <div class="metric-label">使用率</div>
                  <div class="metric-value">{{ channel.utilization || 0 }}%</div>
                </div>
              </div>
              
              <div class="channel-chart">
                <div class="mini-chart">
                  <div class="chart-bars">
                    <div 
                      v-for="i in 7" 
                      :key="i" 
                      class="chart-bar"
                      :style="{ 
                        height: Math.random() * 100 + '%',
                        backgroundColor: channel.flow > 40 ? '#ef4444' : channel.flow > 25 ? '#f59e0b' : '#10b981'
                      }"
                    ></div>
                  </div>
                  <div class="chart-label">流量趋势</div>
                </div>
              </div>
            </div>
          </div>
          
          <!-- 详细信息面板 -->
          <div v-if="selectedChannel" class="detail-panel">
            <div class="panel-header">
              <h3>{{ selectedChannel.name }} - 详细信息</h3>
              <button class="close-button" @click="selectedChannel = null">×</button>
            </div>
            
            <div class="panel-content">
              <div class="detail-grid">
                <div class="detail-section">
                  <h4>实时数据</h4>
                  <div class="detail-item">
                    <span class="detail-label">当前流量:</span>
                    <span class="detail-value">{{ selectedChannel.flow || 0 }} 辆/小时</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">今日累计:</span>
                    <span class="detail-value">{{ selectedChannel.todayTotal || 0 }} 辆</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">使用率:</span>
                    <span class="detail-value">{{ selectedChannel.utilization || 0 }}%</span>
                  </div>
                </div>
                
                <div class="detail-section">
                  <h4>历史数据</h4>
                  <div class="detail-item">
                    <span class="detail-label">昨日流量:</span>
                    <span class="detail-value">{{ selectedChannel.yesterdayTotal || 0 }} 辆</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">本周累计:</span>
                    <span class="detail-value">{{ selectedChannel.weekTotal || 0 }} 辆</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">本月累计:</span>
                    <span class="detail-value">{{ selectedChannel.monthTotal || 0 }} 辆</span>
                  </div>
                </div>
                
                <div class="detail-section">
                  <h4>设备状态</h4>
                  <div class="detail-item">
                    <span class="detail-label">摄像头:</span>
                    <span class="detail-value status-normal">正常</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">道闸:</span>
                    <span class="detail-value status-normal">正常</span>
                  </div>
                  <div class="detail-item">
                    <span class="detail-label">传感器:</span>
                    <span class="detail-value status-normal">正常</span>
                  </div>
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
import ChannelUtilizationChart from "@/components/echart/ChannelUtilizationChart.vue";
import ChannelFlowPieChart from "@/components/echart/ChannelFlowPieChart.vue";
import ChannelComparisonLineChart from "@/components/echart/ChannelComparisonLineChart.vue";

export default {
  name: 'ChannelDetail',
  components: {
    FullScreenContainerFix,
    ChannelUtilizationChart,
    ChannelFlowPieChart,
    ChannelComparisonLineChart
  },
  data() {
    return {
      currentDateTime: '',
      selectedChannel: null,
      timeTimer: null,
      
      // 所有通道数据
      allChannels: [
        { name: '1号门入口', type: '进口', flow: 45, todayTotal: 156, utilization: 85, yesterdayTotal: 142, weekTotal: 1089, monthTotal: 1245 },
        { name: '1号门出口', type: '出口', flow: 32, todayTotal: 142, utilization: 78, yesterdayTotal: 138, weekTotal: 1023, monthTotal: 1167 },
        { name: '1号门潮汐出口', type: '出口', flow: 18, todayTotal: 89, utilization: 65, yesterdayTotal: 85, weekTotal: 623, monthTotal: 712 },
        { name: '3号门入口', type: '进口', flow: 52, todayTotal: 189, utilization: 92, yesterdayTotal: 175, weekTotal: 1321, monthTotal: 1508 },
        { name: '3号门出口', type: '出口', flow: 28, todayTotal: 165, utilization: 72, yesterdayTotal: 158, weekTotal: 1156, monthTotal: 1320 },
        { name: '3号门潮汐出口', type: '出口', flow: 15, todayTotal: 78, utilization: 58, yesterdayTotal: 72, weekTotal: 546, monthTotal: 623 },
        { name: '5号门入口', type: '进口', flow: 41, todayTotal: 148, utilization: 88, yesterdayTotal: 135, weekTotal: 1036, monthTotal: 1182 },
        { name: '5号门出口', type: '出口', flow: 33, todayTotal: 139, utilization: 75, yesterdayTotal: 132, weekTotal: 973, monthTotal: 1110 },
        { name: '7号门入口', type: '进口', flow: 38, todayTotal: 136, utilization: 82, yesterdayTotal: 125, weekTotal: 952, monthTotal: 1086 },
        { name: '7号门出口', type: '出口', flow: 41, todayTotal: 152, utilization: 79, yesterdayTotal: 145, weekTotal: 1064, monthTotal: 1214 },
        { name: '8号门入口', type: '进口', flow: 29, todayTotal: 104, utilization: 71, yesterdayTotal: 98, weekTotal: 728, monthTotal: 831 },
        { name: '8号门出口', type: '出口', flow: 35, todayTotal: 126, utilization: 76, yesterdayTotal: 118, weekTotal: 882, monthTotal: 1007 },
        { name: '林科门入口', type: '进口', flow: 35, todayTotal: 125, utilization: 80, yesterdayTotal: 115, weekTotal: 875, monthTotal: 998 },
        { name: '林科门出口', type: '出口', flow: 31, todayTotal: 111, utilization: 73, yesterdayTotal: 105, weekTotal: 777, monthTotal: 887 },
        { name: '兴安门入口', type: '进口', flow: 42, todayTotal: 151, utilization: 86, yesterdayTotal: 138, weekTotal: 1057, monthTotal: 1206 },
        { name: '兴安门出口', type: '出口', flow: 39, todayTotal: 140, utilization: 81, yesterdayTotal: 132, weekTotal: 980, monthTotal: 1119 },
        { name: '银行门入口', type: '进口', flow: 33, todayTotal: 118, utilization: 77, yesterdayTotal: 108, weekTotal: 826, monthTotal: 943 },
        { name: '银行门出口', type: '出口', flow: 36, todayTotal: 129, utilization: 78, yesterdayTotal: 121, weekTotal: 903, monthTotal: 1031 },
        { name: '体育馆桥旁入口', type: '进口', flow: 48, todayTotal: 172, utilization: 90, yesterdayTotal: 158, weekTotal: 1204, monthTotal: 1374 },
        { name: '校区桥旁入口', type: '进口', flow: 44, todayTotal: 158, utilization: 87, yesterdayTotal: 145, weekTotal: 1106, monthTotal: 1262 },
        { name: '体育馆校内入口1', type: '进口', flow: 37, todayTotal: 133, utilization: 83, yesterdayTotal: 122, weekTotal: 931, monthTotal: 1062 },
        { name: '体育馆校内入口2', type: '进口', flow: 34, todayTotal: 122, utilization: 79, yesterdayTotal: 112, weekTotal: 854, monthTotal: 975 }
      ]
    }
  },
  computed: {
    channelType() {
      return this.$route.query.type || 'entry'
    },
    
    filteredChannels() {
      return this.allChannels.filter(channel => 
        channel.type === (this.channelType === 'entry' ? '进口' : '出口')
      )
    },
    
    totalFlow() {
      return this.filteredChannels.reduce((sum, channel) => sum + (channel.flow || 0), 0)
    },
    
    avgFlow() {
      return this.filteredChannels.length > 0 
        ? Math.round(this.totalFlow / this.filteredChannels.length) 
        : 0
    },
    
    peakFlow() {
      return Math.max(...this.filteredChannels.map(channel => channel.flow || 0))
    }
  },
  mounted() {
    this.startTimeUpdate()
  },
  beforeDestroy() {
    if (this.timeTimer) {
      clearInterval(this.timeTimer)
    }
  },
  methods: {
    goBack() {
      this.$router.go(-1)
    },
    
    selectChannel(channel) {
      this.selectedChannel = channel
    },
    
    getChannelStatusClass(flow) {
      if (flow > 50) return 'status-high'
      if (flow > 30) return 'status-medium'
      return 'status-low'
    },
    
    getChannelStatusText(flow) {
      if (flow > 50) return '繁忙'
      if (flow > 30) return '正常'
      return '空闲'
    },
    
    startTimeUpdate() {
      this.updateDateTime()
      this.timeTimer = setInterval(() => {
        this.updateDateTime()
      }, 1000)
    },
    
    updateDateTime() {
      const now = new Date()
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六']
      const year = now.getFullYear()
      const month = String(now.getMonth() + 1).padStart(2, '0')
      const day = String(now.getDate()).padStart(2, '0')
      const weekday = weekdays[now.getDay()]
      const hours = String(now.getHours()).padStart(2, '0')
      const minutes = String(now.getMinutes()).padStart(2, '0')
      const seconds = String(now.getSeconds()).padStart(2, '0')
      
      this.currentDateTime = `${year}年${month}月${day}日 ${weekday} ${hours}:${minutes}:${seconds}`
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../assets/scss/index.scss";

.channel-detail-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background: linear-gradient(135deg, #0b132a 0%, #1e3a8a 100%);
}

.header-section {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 30px;
  background: rgba(11, 19, 42, 0.9);
  border-bottom: 1px solid #1e3a8a;
  
  .header-left {
    .back-button {
      display: flex;
      align-items: center;
      gap: 8px;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid #3b82f6;
      border-radius: 6px;
      color: #3b82f6;
      padding: 10px 15px;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 14px;
      
      &:hover {
        background: rgba(59, 130, 246, 0.2);
        transform: translateY(-1px);
      }
      
      .icon-back {
        font-size: 16px;
      }
    }
  }
  
  .header-center {
    text-align: center;
    
    .main-title {
      font-size: 24px;
      font-weight: bold;
      color: #ffffff;
      margin-bottom: 5px;
    }
    
    .sub-title {
      font-size: 14px;
      color: #94a3b8;
    }
  }
  
  .header-right {
    .datetime-info {
      .datetime-text {
        font-size: 14px;
        color: #e2e8f0;
        font-weight: 500;
      }
    }
  }
}

.content-section {
  flex: 1;
  padding: 20px;
  overflow-y: auto;
}

.stats-overview {
  display: flex;
  gap: 20px;
  margin-bottom: 30px;
  
  .stat-card {
    flex: 1;
    background: rgba(11, 19, 42, 0.8);
    border: 1px solid #1e3a8a;
    border-radius: 12px;
    padding: 20px;
    display: flex;
    align-items: center;
    gap: 15px;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
      border-color: #3b82f6;
    }
    
    .stat-icon {
      font-size: 24px;
      width: 50px;
      height: 50px;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 50%;
      
      &.entry-icon {
        background: rgba(59, 130, 246, 0.2);
      }
      
      &.avg-icon {
        background: rgba(16, 185, 129, 0.2);
      }
      
      &.peak-icon {
        background: rgba(245, 158, 11, 0.2);
      }
    }
    
    .stat-content {
      .stat-value {
        font-size: 28px;
        font-weight: bold;
        color: #3b82f6;
        margin-bottom: 5px;
      }
      
      .stat-label {
        font-size: 14px;
        color: #94a3b8;
      }
    }
  }
}

.charts-section {
  margin-bottom: 30px;
  
  .chart-row {
    display: flex;
    gap: 20px;
    margin-bottom: 20px;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .chart-item {
    flex: 1;
    height: 280px;
    
    &.full-width {
      flex: 1;
    }
  }
}

.channels-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(300px, 1fr));
  gap: 20px;
  margin-bottom: 30px;
  
  .channel-card {
    background: rgba(11, 19, 42, 0.8);
    border: 1px solid #1e3a8a;
    border-radius: 12px;
    padding: 20px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
      border-color: #3b82f6;
    }
    
    &.active {
      border-color: #3b82f6;
      background: rgba(59, 130, 246, 0.1);
    }
    
    .channel-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 15px;
      
      .channel-name {
        font-size: 16px;
        font-weight: bold;
        color: #ffffff;
      }
      
      .channel-status {
        padding: 4px 8px;
        border-radius: 4px;
        font-size: 12px;
        font-weight: 500;
        
        &.status-high {
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
        }
        
        &.status-medium {
          background: rgba(245, 158, 11, 0.2);
          color: #f59e0b;
        }
        
        &.status-low {
          background: rgba(16, 185, 129, 0.2);
          color: #10b981;
        }
      }
    }
    
    .channel-metrics {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 10px;
      margin-bottom: 15px;
      
      .metric-item {
        text-align: center;
        
        .metric-label {
          font-size: 12px;
          color: #94a3b8;
          margin-bottom: 5px;
        }
        
        .metric-value {
          font-size: 16px;
          font-weight: bold;
          color: #3b82f6;
        }
      }
    }
    
    .channel-chart {
      height: 80px;
      background: rgba(11, 19, 42, 0.5);
      border-radius: 6px;
      padding: 10px;
      
      .mini-chart {
        height: 100%;
        display: flex;
        flex-direction: column;
        
        .chart-bars {
          flex: 1;
          display: flex;
          align-items: end;
          gap: 2px;
          margin-bottom: 5px;
          
          .chart-bar {
            flex: 1;
            min-height: 2px;
            border-radius: 1px;
            transition: all 0.3s ease;
          }
        }
        
        .chart-label {
          font-size: 10px;
          color: #94a3b8;
          text-align: center;
        }
      }
    }
  }
}

.detail-panel {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 80%;
  max-width: 800px;
  background: rgba(11, 19, 42, 0.95);
  border: 1px solid #1e3a8a;
  border-radius: 12px;
  z-index: 1000;
  
  .panel-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 20px;
    border-bottom: 1px solid #1e3a8a;
    
    h3 {
      margin: 0;
      font-size: 18px;
      color: #ffffff;
    }
    
    .close-button {
      background: none;
      border: none;
      color: #94a3b8;
      font-size: 24px;
      cursor: pointer;
      padding: 0;
      width: 30px;
      height: 30px;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        color: #ffffff;
      }
    }
  }
  
  .panel-content {
    padding: 20px;
    
    .detail-grid {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 30px;
      
      .detail-section {
        h4 {
          margin: 0 0 15px 0;
          font-size: 16px;
          color: #3b82f6;
          font-weight: bold;
        }
        
        .detail-item {
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 8px 0;
          border-bottom: 1px solid rgba(30, 58, 138, 0.3);
          
          &:last-child {
            border-bottom: none;
          }
          
          .detail-label {
            font-size: 14px;
            color: #94a3b8;
          }
          
          .detail-value {
            font-size: 14px;
            color: #ffffff;
            font-weight: 500;
            
            &.status-normal {
              color: #10b981;
            }
          }
        }
      }
    }
  }
}
</style>
