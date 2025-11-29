<template>
  <div id="index">
    <FullScreenContainerFix class="bg">
      <dv-loading v-if="loading">正在加载停车场数据...</dv-loading>
      <div v-else class="host-body">
        <!-- 标题区域 -->
        <div class="header-section">
          <div class="header-center">
            <div class="main-title">东北林业大学智慧车行数据可视化平台</div>
            <!-- 🔔 喇叭提醒按钮 -->
            <div class="notification-bell" @click="toggleReservationAlerts" :title="'预约进场提醒 (' + reservationAlerts.length + '条)'">
              <span class="bell-icon" :class="{ 'has-alerts': reservationAlerts.length > 0 }">🔔</span>
              <span v-if="reservationAlerts.length > 0" class="alert-badge">{{ reservationAlerts.length }}</span>
            </div>
          </div>
          
          <div class="header-right">
            <!-- 时间选择器 -->
            <div class="time-selector">
              <select v-model="selectedTimeRange" @change="onTimeRangeChange" class="time-select">
                <option value="today">今日</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
                <option value="year">本年度</option>
              </select>
            </div>
            
            <div class="datetime-info">
              <span class="datetime-text">{{currentDateTime}}</span>
            </div>
          </div>
        </div>
        <div class="body-box">
          <!-- 主页面内容 -->
          <div class="page-content">
            <!-- 主要内容区域 - 三列布局 -->
            <div class="main-content-grid">
              <!-- 左列 -->
              <div class="content-column">
                <!-- 本日车流量分析 (堆积柱状图) -->
                <div class="module-container compact">
                  <dv-border-box-12>
                    <VisitorVipStackedChart @chart-click="handleChartClick" />
                  </dv-border-box-12>
                </div>
                <!-- 通道流量饼状图 -->
                <div class="module-container channel-pie-container">
                  <dv-border-box-12>
                    <ChannelFlowPieChart 
                      :channelsData="channelStatsData" 
                      :selectedTimeRange="selectedTimeRange"
                      @channelClick="handleChannelClick"
                      @timeRangeChange="handlePieChartTimeRangeChange"
                    />
                  </dv-border-box-12>
                </div>
                <!-- 收费分析 (centreRight2) -->
                <div class="module-container revenue-analysis">
                  <dv-border-box-12>
                    <centreRight2 :revenueData="revenueAnalysisData" />
                  </dv-border-box-12>
                </div>
              </div>
              
              <!-- 中列 -->
              <div class="content-column">
                <!-- 通道照片监控 -->
                <div class="main-chart">
                  <center 
                    :yearlyEntry="yearlyEntry"
                    :monthlyEntry="monthlyEntry"
                    :dailyEntry="dailyEntry"
                    :currentVehicles="currentVehicles"
                    :dailyRevenue="dailyRevenue"
                    :channels="channelStatsData"
                    :vehicleHeatmapData="vehicleHeatmapData"
                    :heatmapHourLabels="heatmapHourLabels"
                    :heatmapMinHour="heatmapMinHour"
                    :heatmapMaxHour="heatmapMaxHour"
                  />
                </div>
                
              </div>
              
              <!-- 右列 -->
              <div class="content-column">
                <!-- 访客计划看板 -->
                <div class="module-container visitor-plan">
                  <dv-border-box-12>
                    <VisitorPlanDashboard :timeRange="selectedTimeRange" />
                  </dv-border-box-12>
                </div>
                <!-- 通道时段流量分析 -->
                <div class="module-container flow-analysis" style="margin-top: -18px; height: 390px;">
                  <dv-border-box-12>
                    <ChannelFlowAnalysis :timeRange="selectedTimeRange" />
                  </dv-border-box-12>
                </div>
                <!-- 访客预约分类（饼图 + 3D词云） -->
                <div class="module-container anomaly-monitor" style="margin-top: -20px; height: 330px;">
                  <dv-border-box-12>
                    <VisitorReservationPanel :timeRange="selectedTimeRange" :categories="visitorReservationCategories" />
                  </dv-border-box-12>
                </div>
              </div>
            </div>
            
          </div>
        </div>
      </div>
      
      <!-- 通道选择弹窗 -->
      <div v-if="showChannelSelection" class="modal-overlay" @click="cancelChannelSelection">
        <div class="modal-content channel-selection-modal" @click.stop>
          <div class="modal-header">
            <h3>选择{{ selectedChannelType === 'entry' ? '进口' : '出口' }}通道</h3>
            <button class="close-btn" @click="cancelChannelSelection">×</button>
          </div>
          
          <div class="modal-body">
            <div class="selection-instructions">
              <p>请选择2-5个{{ selectedChannelType === 'entry' ? '进口' : '出口' }}通道进行对比分析：</p>
              <div class="selection-status">
                已选择：<span class="selected-count">{{ selectedChannels.length }}</span> 个通道
                <span v-if="selectionError" class="error-message">{{ selectionError }}</span>
              </div>
            </div>
            
            <div class="channels-grid">
              <div 
                v-for="channel in availableChannels" 
                :key="channel.name"
                class="channel-item"
                :class="{ 'selected': selectedChannels.some(c => c.name === channel.name) }"
                @click="toggleChannelSelection(channel)"
              >
                <div class="channel-checkbox">
                  <span v-if="selectedChannels.some(c => c.name === channel.name)" class="checkmark">✓</span>
                </div>
                <div class="channel-name">{{ channel.name }}</div>
              </div>
            </div>
            
            <div class="modal-actions">
              <button class="btn-cancel" @click="cancelChannelSelection">取消</button>
              <button 
                class="btn-confirm" 
                :disabled="selectedChannels.length < 2 || selectedChannels.length > 5"
                @click="confirmChannelSelection"
              >
                确认选择 ({{ selectedChannels.length }})
              </button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 通道详情弹窗 -->
      <div v-if="showChannelModal" class="modal-overlay" @click="closeChannelModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <div class="modal-title-section">
              <h3>{{ selectedChannelType === 'entry' ? '进口通道详细分析' : '出口通道详细分析' }}</h3>
              <p class="modal-subtitle">
                各{{ selectedChannelType === 'entry' ? '进口' : '出口' }}通道的车辆流量、利用率等详细数据
                <span v-if="selectedChannels.length > 0" class="selected-channels-info">
                  （已选择 {{ selectedChannels.length }} 个通道）
                </span>
              </p>
            </div>
            <button class="close-btn" @click="closeChannelModal">×</button>
          </div>
          
          <div class="modal-body">
            
            <!-- 图表区域 -->
            <div class="charts-container">
              <!-- 通道车辆数量分布 -->
              <div class="chart-section" style="width: 700px;">
                <ModalChannelPieChart 
                  :channelsData="modalChannelData.selectedChannels"
                  :selectedTimeRange="modalChannelData.timeRange"
                  :channelType="selectedChannelType"
                />
              </div>
              
              <!-- 车辆数量对比 -->
              <div class="chart-section" style="width: 1060px; margin-left: 2px;">
                <ChannelUtilizationChart 
                  :channelsData="modalChannelData.selectedChannels"
                  :selectedTimeRange="modalChannelData.timeRange"
                  :channelType="selectedChannelType"
                />
              </div>
              
              <!-- 通道对比分析 -->
              <div class="chart-section" style="width: 885px;">
                <ChannelComparisonLineChart 
                  :channelsData="modalChannelData.selectedChannels"
                  :selectedTimeRange="modalChannelData.timeRange"
                  :channelType="selectedChannelType"
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </FullScreenContainerFix>
    
    <!-- 访客VIP分析弹窗 -->
    <VisitorVipAnalysisModal 
      :visible="showVisitorVipModal"
      :chartData="visitorVipChartData"
      @close="closeVisitorVipModal"
    />
    
    <!-- 🔔 预约进场提醒弹窗 - 折叠展开样式 -->
    <transition name="modal-fade">
      <div v-if="showReservationAlerts" 
           class="reservation-alert-modal-compact">
        
        <!-- 头部 -->
        <div class="alert-header">
          <div class="alert-title">
            <span class="title-icon">🔔</span>
            <span class="title-text">预约进场提醒</span>
            <span class="alert-count">{{ reservationAlerts.length }}条</span>
          </div>
          <div class="alert-actions">
            <button class="btn-sound" 
                    @click="toggleSound" 
                    :class="{ active: soundSettings.enabled }"
                    :title="soundSettings.enabled ? '关闭音效提示' : '开启音效提示'">
              <span v-if="soundSettings.enabled">🔊</span>
              <span v-else>🔇</span>
            </button>
            <button class="btn-history" @click="toggleHistoryView" title="查看历史记录">
              <span>📋</span>
              <span v-if="reservationAlertsHistory.length > 0" class="history-count">{{ reservationAlertsHistory.length }}</span>
            </button>
            <button class="btn-clear-all" @click="clearAllAlerts" title="全部清除">清空</button>
            <button class="btn-close" @click="closeAlerts" title="关闭">×</button>
          </div>
        </div>
        
        <!-- 主体内容 - 折叠展开列表 -->
        <div class="alert-body">
          <!-- Tab切换 -->
          <div class="alert-tabs">
            <div class="tab" :class="{ active: !showHistory }" @click="showHistory = false">
              <span>未确认 ({{ reservationAlerts.length }})</span>
            </div>
            <div class="tab" :class="{ active: showHistory }" @click="showHistory = true">
              <span>历史记录 ({{ reservationAlertsHistory.length }})</span>
            </div>
          </div>
          
          <!-- 未确认提醒列表 -->
          <div v-if="!showHistory" class="alert-list">
            <div v-if="reservationAlerts.length === 0" class="empty-history">
              <span class="empty-icon">🔔</span>
              <p>暂无未确认提醒</p>
            </div>
          <div v-for="(alert, index) in reservationAlerts" 
               :key="alert.timestamp + '_' + index" 
               class="alert-item-compact"
               :class="{ 'expanded': alert.isExpanded }">
            
            <!-- 紧凑的一行显示 -->
            <div class="compact-row" @click="toggleAlertExpand(index)">
              <div class="main-info">
                <!-- 类型图标 -->
                <span class="type-badge" :class="alert.type">
                  {{ alert.type === 'vehicle' ? '🚗' : '👤' }}
                </span>
                <!-- 车牌号或人名 -->
                <span v-if="alert.type === 'vehicle'" 
                      class="plate-number"
                      :class="getPlateType(alert.plateNumber, alert)">
                  {{ alert.plateNumber || '未知车牌' }}
                </span>
                <span v-else class="person-name">
                  {{ alert.visitorName || '未知访客' }}
                </span>
                <!-- 通道名称 -->
                <span class="channel-name">{{ alert.channel || '未知通道' }}</span>
                <!-- 时间 -->
                <span class="time-display">{{ getTimeAgo(alert.timestamp) }}</span>
              </div>
              <!-- 展开图标 -->
              <div class="expand-icon">
                <span>{{ alert.isExpanded ? '▲' : '▼' }}</span>
              </div>
            </div>
            
            <!-- 展开后的详细内容 -->
            <div class="detail-content" v-if="alert.isExpanded">
              
              <!-- 进场照片 -->
              <div class="photo-section">
                <div class="photo-wrapper" @click="previewImage(alert.imageUrl)">
                  <img v-if="alert.imageUrl" 
                       :src="alert.imageUrl" 
                       :alt="alert.type === 'vehicle' ? '进场照片' : '人脸照片'"
                       @error="handleImageError">
                  <div v-else class="no-photo">
                    <span>📷</span>
                    <span>暂无照片</span>
                  </div>
                </div>
              </div>
              
              <!-- 详细信息 -->
              <div class="info-grid">
                <!-- 预约信息 -->
                <div class="info-block">
                  <div class="block-title">预约信息</div>
                  <div class="info-row">
                    <span class="label">预约人：</span>
                    <span class="value">{{ alert.visitorName || '未知' }}</span>
                  </div>
                  <div class="info-row" v-if="alert.visitorPhone">
                    <span class="label">联系电话：</span>
                    <span class="value">{{ formatPhone(alert.visitorPhone) }}</span>
                  </div>
                  <div class="info-row" v-if="alert.purpose">
                    <span class="label">预约事由：</span>
                    <span class="value">{{ alert.purpose }}</span>
                  </div>
                  <div class="info-row" v-if="alert.reservationStartTime">
                    <span class="label">预约时段：</span>
                    <span class="value">{{ formatTimeRange(alert.reservationStartTime, alert.reservationEndTime) }}</span>
                  </div>
                </div>
                
                <!-- 被访信息 -->
                <div class="info-block" v-if="alert.visitedPerson || alert.visitedDepartment">
                  <div class="block-title">被访信息</div>
                  <div class="info-row" v-if="alert.visitedPerson">
                    <span class="label">被访人：</span>
                    <span class="value">{{ alert.visitedPerson }}</span>
                  </div>
                  <div class="info-row" v-if="alert.visitedDepartment">
                    <span class="label">所属部门：</span>
                    <span class="value">{{ alert.visitedDepartment }}</span>
                  </div>
                </div>
                
                <!-- 进场信息 -->
                <div class="info-block">
                  <div class="block-title">进场信息</div>
                  <div class="info-row">
                    <span class="label">进场通道：</span>
                    <span class="value">{{ alert.channel || '未知通道' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">进场时间：</span>
                    <span class="value">{{ formatEntryTime(alert.time) }}</span>
                  </div>
                  <div class="info-row" v-if="alert.type === 'vehicle' && alert.plateNumber">
                    <span class="label">车牌号码：</span>
                    <span class="value plate">{{ alert.plateNumber }}</span>
                  </div>
                </div>
              </div>
              
              <!-- 操作按钮 -->
              <div class="action-buttons">
                <button class="btn-dismiss" @click="dismissAlert(index, $event)">确认</button>
              </div>
            </div>
            
          </div>
          </div>
          
          <!-- 历史记录列表 -->
          <div v-if="showHistory" class="alert-list history-list">
            <div v-if="reservationAlertsHistory.length === 0" class="empty-history">
              <span class="empty-icon">📭</span>
              <p>暂无历史记录</p>
            </div>
            <div v-for="(alert, index) in reservationAlertsHistory" 
                 :key="alert.timestamp + '_history_' + index" 
                 class="alert-item-compact history-item"
                 :class="{ 'expanded': alert.isExpanded }">
              
              <!-- 紧凑的一行显示 -->
              <div class="compact-row" @click="toggleHistoryAlertExpand(index)">
                <div class="main-info">
                  <!-- 类型图标 -->
                  <span class="type-badge" :class="alert.type">
                    {{ alert.type === 'vehicle' ? '🚗' : '👤' }}
                  </span>
                  <!-- 车牌号或人名 -->
                  <span v-if="alert.type === 'vehicle'" 
                        class="plate-number"
                        :class="getPlateType(alert.plateNumber, alert)">
                    {{ alert.plateNumber || '未知车牌' }}
                  </span>
                  <span v-else class="person-name">
                    {{ alert.visitorName || '未知访客' }}
                  </span>
                  <!-- 通道名称 -->
                  <span class="channel-name">{{ alert.channel || '未知通道' }}</span>
                  <!-- 时间 -->
                  <span class="time-display">{{ getTimeAgo(alert.timestamp) }}</span>
                  <!-- 已确认标记 -->
                  <span class="confirmed-badge">✓已确认</span>
                </div>
                <!-- 展开图标 -->
                <div class="expand-icon">
                  <span>{{ alert.isExpanded ? '▲' : '▼' }}</span>
                </div>
              </div>
              
              <!-- 展开后的详细内容（同未确认提醒，但没有确认按钮） -->
              <div class="detail-content" v-if="alert.isExpanded">
                
                <!-- 进场照片 -->
                <div class="photo-section">
                  <div class="photo-wrapper" @click="previewImage(alert.imageUrl)">
                    <img v-if="alert.imageUrl" 
                         :src="alert.imageUrl" 
                         :alt="alert.type === 'vehicle' ? '进场照片' : '人脸照片'"
                         @error="handleImageError">
                    <div v-else class="no-photo">
                      <span>📷</span>
                      <span>暂无照片</span>
                    </div>
                  </div>
                </div>
                
                <!-- 详细信息 -->
                <div class="info-grid">
                  <!-- 预约信息 -->
                  <div class="info-block">
                    <div class="block-title">预约信息</div>
                    <div class="info-row">
                      <span class="label">预约人：</span>
                      <span class="value">{{ alert.visitorName || '未知' }}</span>
                    </div>
                    <div class="info-row" v-if="alert.visitorPhone">
                      <span class="label">联系电话：</span>
                      <span class="value">{{ formatPhone(alert.visitorPhone) }}</span>
                    </div>
                    <div class="info-row" v-if="alert.purpose">
                      <span class="label">预约事由：</span>
                      <span class="value">{{ alert.purpose }}</span>
                    </div>
                    <div class="info-row" v-if="alert.reservationStartTime">
                      <span class="label">预约时段：</span>
                      <span class="value">{{ formatTimeRange(alert.reservationStartTime, alert.reservationEndTime) }}</span>
                    </div>
                  </div>
                  
                  <!-- 被访信息 -->
                  <div class="info-block" v-if="alert.visitedPerson || alert.visitedDepartment">
                    <div class="block-title">被访信息</div>
                    <div class="info-row" v-if="alert.visitedPerson">
                      <span class="label">被访人：</span>
                      <span class="value">{{ alert.visitedPerson }}</span>
                    </div>
                    <div class="info-row" v-if="alert.visitedDepartment">
                      <span class="label">所属部门：</span>
                      <span class="value">{{ alert.visitedDepartment }}</span>
                    </div>
                  </div>
                  
                  <!-- 进场信息 -->
                  <div class="info-block">
                    <div class="block-title">进场信息</div>
                    <div class="info-row">
                      <span class="label">进场通道：</span>
                      <span class="value">{{ alert.channel || '未知通道' }}</span>
                    </div>
                    <div class="info-row">
                      <span class="label">进场时间：</span>
                      <span class="value">{{ formatEntryTime(alert.time) }}</span>
                    </div>
                    <div class="info-row" v-if="alert.type === 'vehicle' && alert.plateNumber">
                      <span class="label">车牌号码：</span>
                      <span class="value plate">{{ alert.plateNumber }}</span>
                    </div>
                    <div class="info-row" v-if="alert.confirmedAt">
                      <span class="label">确认时间：</span>
                      <span class="value">{{ formatEntryTime(alert.confirmedAt) }}</span>
                    </div>
                  </div>
                </div>
                
              </div>
              
            </div>
          </div>
        </div>
        
      </div>
    </transition>
    
    <!-- � 图片预览弹窗 -->
    <transition name="fade">
      <div v-if="showImagePreview" class="image-preview-modal" @click="closeImagePreview">
        <div class="preview-container" @click.stop>
          <img :src="previewImageUrl" alt="预览图片">
          <button class="btn-close-preview" @click="closeImagePreview">×</button>
        </div>
      </div>
    </transition>
    
    <!-- 🔔 最小化角标 -->
    <transition name="bounce">
      <div v-if="isMinimized && reservationAlerts.length > 0" 
           class="minimized-badge"
           @click="restoreAlerts">
        <span class="badge-icon">🔔</span>
        <span class="badge-count">{{ reservationAlerts.length }}</span>
      </div>
    </transition>
    
  </div>
</template>

<script>
import VisitorVipStackedChart from "@/components/echart/VisitorVipStackedChart.vue";
import ChannelFlowPieChart from "@/components/echart/ChannelFlowPieChart.vue";
import ChannelComparisonLineChart from "@/components/echart/ChannelComparisonLineChart.vue";
import ChannelUtilizationChart from "@/components/echart/ChannelUtilizationChart.vue";
import ModalChannelPieChart from "@/components/echart/ModalChannelPieChart.vue";
import VisitorVipAnalysisModal from "@/components/VisitorVipAnalysisModal.vue";
import centreLeft2 from "./centreLeft2";
import centreRight2 from "./centreRight2";
import center from "./center";
import bottomLeft from "./bottomLeft";
import bottomRight from "./bottomRight";
import VisitorReservationPanel from "@/components/VisitorReservationPanel.vue";
import channelStats from "./channelStats";
import parkingDuration from "./parkingDuration";
import Heatmap3D from "./Heatmap3D.vue";
import ChannelFlyline from "./ChannelFlyline.vue";
import CombinedFlowPanel from "./CombinedFlowPanel.vue";
import ChannelStackedBar from "./ChannelStackedBar.vue";
import VisitorPlanDashboard from "./VisitorPlanDashboard.vue";
import ChannelFlowAnalysis from "@/components/echart/ChannelFlowAnalysis.vue";
import FullScreenContainerFix from "@/components/FullScreenContainerFix.vue";
import { parkingDataService } from "@/services/parkingDataService";
import { vehicleFlowDataService } from "@/services/vehicleFlowDataService.js";
import { vehicleDataService } from "@/services/vehicleDataService.js";

export default {
  data() {
    return {
      loading: true,
      
      // 基础信息
      parkingLotName: "XX智慧停车场",
      currentDateTime: "",
      weather: "晴天",
      temperature: 22,
      alertCount: 0,
      
      // 时间选择器
      selectedTimeRange: "today",
      
      // 通道选择器
      selectedChannelForAnalysis: "all",
      
      // 核心数据指标
      yearlyEntry: 12856,
      monthlyEntry: 1245,
      dailyEntry: 156,
      currentVehicles: 423,
      totalExit: 12634,
      avgParkingTime: "2.3",
      spaceUtilization: 78.5,
      dailyRevenue: 25600,
      
      // 图表数据
      realTimeFlowData: {},
      vehicleTrajectoryData: {},
      hourlyTrendData: {},
      parkingDurationData: {},
      areaSpaceData: {},
      revenueAnalysisData: { data: {} },  // 初始化为包含 data 属性的对象
      flowComparisonData: {},
      anomalyMonitorData: {},
      vehicleFlowData: {},
      vehicleHeatmapData: [],  // 车辆热力图数据
      heatmapHourLabels: null,  // 热力图小时标签
      heatmapMinHour: 0,  // 热力图最小小时
      heatmapMaxHour: 23,  // 热力图最大小时
      faceAnomalyData: {
        alertStats: {
          emergency: 3,    // 紧急：黑名单人员
          warning: 8,      // 警告：陌生人闯入
          info: 12,        // 信息：识别失败
          processed: 42,   // 已处理
          processing: 6    // 处理中
        },
        anomalyDistribution: [
          { name: '识别失败', value: 12 },
          { name: '陌生人闯入', value: 8 },
          { name: '黑名单人员', value: 3 },
          { name: '异常停留', value: 5 },
          { name: '重复进入', value: 4 },
          { name: '未授权访问', value: 2 },
          { name: '人脸遮挡', value: 3 },
          { name: '光线异常', value: 2 }
        ],
        riskPersons: [
          { personId: 'P001', name: '张三', type: '黑名单', riskLevel: '🔴高', status: '已处理' },
          { personId: 'P002', name: '李四', type: '陌生人', riskLevel: '🟡中', status: '处理中' },
          { personId: 'P003', name: '王五', type: '异常停留', riskLevel: '🟡中', status: '处理中' },
          { personId: 'P004', name: '赵六', type: '重复进入', riskLevel: '🟢低', status: '已处理' },
          { personId: 'P005', name: '钱七', type: '人脸遮挡', riskLevel: '🟡中', status: '处理中' }
        ],
        totalAlerts: 39,
        processingEfficiency: '82',
        avgResponseTime: '2.5分钟',
        weeklyImprovement: -8,
        bestProcessor: '李老师(45件)'
      },
      // 访客预约分类（用于饼图与词云）
      visitorReservationCategories: [
        { name: '体育馆访客补录', value: 56 },
        { name: '基建处车辆', value: 34 },
        { name: '走读学生', value: 28 },
        { name: '非经营活动车辆', value: 22 },
        { name: '兴林宾馆访客', value: 26 },
        { name: '博物馆访客', value: 18 },
        { name: '校友会议车', value: 20 },
        { name: '体育馆部门访客', value: 24 },
        { name: '经营性公务车辆', value: 12 },
        { name: '个人访客车辆', value: 30 },
        { name: '公务访客车辆', value: 16 },
        { name: '体育馆访客专车', value: 14 }
      ],
      channelStatsData: [], // 将从后端数据动态更新
      
      // 时间段数据
      timeRangeData: {
        today: {
          vehicle: { entry: 156, exit: 142, current: 423, revenue: 25600 },
          face: { entry: 134, exit: 128, current: 298, accuracy: 98.5 }
        },
        week: {
          vehicle: { entry: 1089, exit: 1023, current: 423, revenue: 178400 },
          face: { entry: 945, exit: 892, current: 298, accuracy: 98.2 }
        },
        month: {
          vehicle: { entry: 1245, exit: 1167, current: 423, revenue: 456800 },
          face: { entry: 1089, exit: 1034, current: 298, accuracy: 97.8 }
        },
        year: {
          vehicle: { entry: 12856, exit: 12433, current: 423, revenue: 5234000 },
          face: { entry: 11234, exit: 10876, current: 298, accuracy: 98.1 }
        }
      },
      
      
      // 定时器
      dataTimer: null,
      timeTimer: null,
      
      // 弹窗相关
      showChannelModal: false,
      selectedChannelType: '',
      modalChannelData: {},
      
      // 通道选择相关
      showChannelSelection: false,
      availableChannels: [],
      selectedChannels: [],
      selectionError: '',
      
      // 弹窗数据刷新定时器
      modalDataRefreshTimer: null,
      modalDataRefreshInterval: 2000, // 5秒刷新一次
      
      // 访客VIP分析弹窗相关
      showVisitorVipModal: false,
      visitorVipChartData: {
        hour: null,
        entry: null,
        type: null
      },
      
      // 🔔 预约提醒相关
      showReservationAlerts: false,
      reservationAlerts: [],        // 提醒队列
      reservationAlertsHistory: [], // 历史提醒（已确认的）
      showHistory: false,            // 是否显示历史记录
      isMinimized: false,            // 是否最小化
      maxHistorySize: 1000,            // 最大历史记录数
     
      // WebSocket连接
      websocket: null,
      wsReconnectTimer: null,
      wsReconnectAttempts: 0,
      
      // 图片预览
      showImagePreview: false,
      previewImageUrl: '',
      
      // 🔊 音效提示设置
      soundSettings: {
        enabled: true,               // 是否启用音效提示
        volume: 0.6,                 // 音效音量 (0 - 1)
        vehicleSound: true,          // 车辆进场音效
        personSound: true            // 人员进场音效
      },
      
      // 音频上下文
      audioContext: null
    };
  },
  components: {
    VisitorVipStackedChart,
    ChannelFlowPieChart,
    ChannelComparisonLineChart,
    ChannelUtilizationChart,
    ModalChannelPieChart,
    VisitorVipAnalysisModal,
    centreLeft2,
    centreRight2,
    center,
    bottomLeft,
    bottomRight,
    VisitorReservationPanel,
    channelStats,
    parkingDuration,
    Heatmap3D,
    ChannelFlyline,
    CombinedFlowPanel,
    ChannelStackedBar,
    VisitorPlanDashboard,
    ChannelFlowAnalysis,
    FullScreenContainerFix
  },
  computed: {
    // 当前时间段的数据
    currentData() {
      return this.timeRangeData[this.selectedTimeRange] || this.timeRangeData.today;
    }
  },
  mounted() {
    // 原有初始化
    this.initData();
    this.startDataRefresh();
    this.startTimeUpdate();
    
    // 🔔 新增：从本地存储恢复提醒数据
    this.loadAlertsFromLocalStorage();
    
    // 🔔 新增：初始化WebSocket
    this.initWebSocket();
    
    // 🔔 新增：初始化音频上下文（用户交互后）
    this.initAudioContext();
  },
  beforeDestroy() {
    // 原有清理
    if (this.dataTimer) clearInterval(this.dataTimer);
    if (this.timeTimer) clearInterval(this.timeTimer);
    if (this.modalDataRefreshTimer) clearInterval(this.modalDataRefreshTimer);
    
    // 🔔 新增：清理WebSocket
    if (this.websocket) {
      this.websocket.close();
    }
    if (this.wsReconnectTimer) {
      clearTimeout(this.wsReconnectTimer);
    }
  },
  methods: {
    // 时间范围变化处理
    onTimeRangeChange() {
      console.log('时间范围切换为:', this.selectedTimeRange);
      // 这里可以添加数据刷新逻辑
      this.refreshDataByTimeRange();
    },
    
    // 通道选择变化处理
    onChannelChange() {
      console.log('通道选择切换为:', this.selectedChannelForAnalysis);
      // 这里可以添加通道数据刷新逻辑
      this.refreshChannelAnalysisData();
    },
    
    // 刷新通道分析数据
    refreshChannelAnalysisData() {
      // 根据选择的通道刷新分析数据
      console.log(`刷新通道 ${this.selectedChannelForAnalysis} 的分析数据`);
    },
    
    // 根据时间范围刷新数据
    async refreshDataByTimeRange() {
      try {
        // 根据选择的时间范围加载对应的数据
        await this.loadDataByTimeRange(this.selectedTimeRange);
      } catch (error) {
        console.error('数据刷新失败:', error);
      }
    },
    
    // 根据时间范围加载数据
    async loadDataByTimeRange(timeRange) {
      try {
        // 加载车辆流量数据
        const vehicleFlow = await vehicleFlowDataService.getVehicleFlowData(timeRange);
        this.vehicleFlowData = vehicleFlow;
        console.log(`加载${timeRange}车辆流量数据完成`);
        
        // 更新核心指标，包括通道数据
        this.updateCoreMetrics();
      } catch (error) {
        console.error(`加载${timeRange}数据失败:`, error);
      }
    },
    
    async initData() {
      try {
        await this.loadAllData();
        this.loading = false;
      } catch (error) {
        console.error("数据加载失败:", error);
        this.loading = false;
      }
    },
    
    async loadAllData() {
      // 并行加载所有数据
      const [
        realTimeFlow,
        trajectory,
        hourlyTrend,
        duration,
        areaSpace,
        revenue,
        flowComparison,
        // anomaly, // 已注释掉对应的接口调用
        vehicleFlow,
        heatmapData
      ] = await Promise.all([
        parkingDataService.getRealTimeFlow(),
        parkingDataService.getVehicleTrajectory(), 
        parkingDataService.getHourlyTrend(),
        parkingDataService.getParkingDuration(),
        parkingDataService.getAreaSpaceData(),
        vehicleDataService.getRevenueAnalysis(this.selectedTimeRange),  // 使用真实的后端接口
        parkingDataService.getFlowComparison(),
        // parkingDataService.getAnomalyMonitor(),
        vehicleFlowDataService.getVehicleFlowData(this.selectedTimeRange),
        vehicleDataService.getHeatmapData(this.selectedTimeRange)  // 使用真实的后端接口
      ]);
      
      this.realTimeFlowData = realTimeFlow;
      this.vehicleTrajectoryData = trajectory;
      this.hourlyTrendData = hourlyTrend;
      this.parkingDurationData = duration;
      this.areaSpaceData = areaSpace;
      this.revenueAnalysisData = revenue;
      this.flowComparisonData = flowComparison;
      // this.anomalyMonitorData = anomaly; // 已注释掉对应的接口
      this.vehicleFlowData = vehicleFlow;
      
      console.log('🔥 [热力图] 后端返回的完整数据:', heatmapData);
      
      // 从响应的 data 属性中提取实际数据
      const heatmapActualData = heatmapData.data || heatmapData;
      
      this.vehicleHeatmapData = heatmapActualData.vehicleHeatmapData || [];
      this.heatmapHourLabels = heatmapActualData.hourLabels || null;
      this.heatmapMinHour = heatmapActualData.minHour || 0;
      this.heatmapMaxHour = heatmapActualData.maxHour || 23;
      
      console.log('🔥 [热力图] 数据加载完成:', {
        dataCount: this.vehicleHeatmapData.length,
        hourLabels: this.heatmapHourLabels,
        timeRange: `${this.heatmapMinHour}:00 ~ ${this.heatmapMaxHour}:00`,
        sampleData: this.vehicleHeatmapData.slice(0, 5)
      });
      
      console.log('📊 [数据加载] 收费分析响应:', this.revenueAnalysisData);
      console.log('📊 [数据加载] 收费分析数据对象:', this.revenueAnalysisData);
      console.log('📊 [数据加载] revenueByDuration:', this.revenueAnalysisData?.revenueByDuration);
      console.log('📊 [数据加载] dataSource:', this.revenueAnalysisData?.dataSource);
      console.log('🔥 [数据加载] 热力图数据:', this.vehicleHeatmapData.length, '个数据点');
      
      // 更新核心指标
      this.updateCoreMetrics();
    },
    
    startDataRefresh() {
      // 每30秒刷新实时数据
      this.dataTimer = setInterval(async () => {
        await this.loadAllData();
      }, 30000);
    },
    
    startTimeUpdate() {
      this.updateDateTime();
      this.timeTimer = setInterval(() => {
        this.updateDateTime();
      }, 1000);
    },
    
    updateDateTime() {
      const now = new Date();
      const weekdays = ['星期日', '星期一', '星期二', '星期三', '星期四', '星期五', '星期六'];
      const year = now.getFullYear();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      const weekday = weekdays[now.getDay()];
      const hours = String(now.getHours()).padStart(2, '0');
      const minutes = String(now.getMinutes()).padStart(2, '0');
      const seconds = String(now.getSeconds()).padStart(2, '0');
      
      this.currentDateTime = `${year}年${month}月${day}日 ${weekday} ${hours}:${minutes}:${seconds}`;
    },
    
    updateCoreMetrics() {
      // 根据实时数据更新核心指标
      if (this.realTimeFlowData) {
        this.dailyEntry = this.realTimeFlowData.todayEntry || 0;
        this.currentVehicles = this.realTimeFlowData.currentVehicles || 0;
      }
      if (this.areaSpaceData) {
        this.spaceUtilization = this.areaSpaceData.totalUtilization || 0;
      }
      if (this.anomalyMonitorData) {
        this.alertCount = this.anomalyMonitorData.totalAlerts || 0;
      }
      
      // 更新通道统计数据，使用后端真实数据
      if (this.vehicleFlowData && this.vehicleFlowData.channelStats) {
        this.channelStatsData = this.vehicleFlowData.channelStats.map(stat => ({
          name: stat.name,
          type: stat.name.includes('入口') ? '进口' : '出口',
          utilization: Math.round((stat.total / Math.max(stat.total, 100)) * 100), // 计算利用率
          flow: stat.total,
          entry: stat.entry,
          exit: stat.exit
        }));
        console.log('更新通道统计数据:', this.channelStatsData);
      }
    },
    
    formatNumber(num) {
      return num.toLocaleString();
    },
    
    formatCurrency(amount) {
      return (amount / 1000).toFixed(1) + 'k';
    },
    
    getUtilizationClass(rate) {
      if (rate > 90) return 'danger';
      if (rate > 70) return 'warning';
      return 'success';
    },
    
    // 处理通道点击事件
    handleChannelClick(channelType) {
      console.log('=== 通道点击事件开始 ===');
      console.log('接收到的channelType:', channelType);
      
      this.selectedChannelType = channelType;
      
      // 无论是进口还是出口通道，都需要用户选择具体的通道
      this.showChannelSelection = true;
      this.availableChannels = this.channelStatsData.filter(channel => 
        channelType === 'entry' ? channel.type === '进口' : channel.type === '出口'
      );
      this.selectedChannels = [];
      this.selectionError = '';
      console.log(`显示${channelType === 'entry' ? '进口' : '出口'}通道选择界面，可用通道:`, this.availableChannels);
      
      console.log('=== 通道点击事件结束 ===');
    },
    
    // 生成弹窗数据
    async generateModalData() {
      const timeRange = this.selectedTimeRange;
      const channelType = this.selectedChannelType;
      
      try {
        // 调用后端接口获取真实的通道详情数据
        const channelDetailData = await vehicleFlowDataService.getChannelDetailStatistics(
          channelType, 
          '东北林业大学', 
          timeRange
        );
        
        console.log('获取到的通道详情数据:', channelDetailData);
        
        // 过滤出选中的通道数据
        const selectedChannelNames = this.selectedChannels.map(ch => ch.name);
        const filteredChannelStats = (channelDetailData.channelStats || []).filter(stat => 
          selectedChannelNames.includes(stat.name)
        );
        
        // 将后端数据转换为弹窗需要的格式
        this.modalChannelData = {
          timeRange: timeRange,
          channelType: channelType,
          selectedChannels: filteredChannelStats,
          hourlyData: channelDetailData.hourlyData || [],
          vehicleTypes: channelDetailData.vehicleTypes || [],
          summary: channelDetailData.summary || {},
          dataSource: channelDetailData.dataSource || 'UNKNOWN'
        };
        
        console.log('生成的弹窗数据（仅选中通道）:', this.modalChannelData);
        
      } catch (error) {
        console.error('获取通道详情数据失败，使用模拟数据:', error);
        
        // 如果后端接口调用失败，使用模拟数据
        this.generateMockModalDataForSelectedChannels(timeRange, channelType);
      }
    },
    
    // 生成模拟弹窗数据（备用方法）
    generateMockModalData(timeRange, channelType) {
      // 根据时间范围和通道类型生成进车数量数据
      let baseData = {
        totalFlow: 0, // 保持字段名兼容性
        avgFlow: 0,
        peakFlow: 0,
        totalVehicleCount: 0, // 新增进车数量字段
        avgVehicleCount: 0,
        peakVehicleCount: 0
      };
      
      // 根据时间范围调整进车数量数据
      switch (timeRange) {
        case 'today':
          baseData = { 
            totalFlow: 478, avgFlow: 40, peakFlow: 52,
            totalVehicleCount: 478, avgVehicleCount: 40, peakVehicleCount: 52
          };
          break;
        case 'week':
          baseData = { 
            totalFlow: 3346, avgFlow: 35, peakFlow: 48,
            totalVehicleCount: 3346, avgVehicleCount: 35, peakVehicleCount: 48
          };
          break;
        case 'month':
          baseData = { 
            totalFlow: 14320, avgFlow: 38, peakFlow: 55,
            totalVehicleCount: 14320, avgVehicleCount: 38, peakVehicleCount: 55
          };
          break;
        case 'year':
          baseData = { 
            totalFlow: 171840, avgFlow: 42, peakFlow: 58,
            totalVehicleCount: 171840, avgVehicleCount: 42, peakVehicleCount: 58
          };
          break;
      }
      
      // 根据通道类型调整数据（出口通道数量稍少）
      if (channelType === 'exit') {
        baseData.totalFlow = Math.round(baseData.totalFlow * 0.9);
        baseData.avgFlow = Math.round(baseData.avgFlow * 0.9);
        baseData.peakFlow = Math.round(baseData.peakFlow * 0.9);
        baseData.totalVehicleCount = Math.round(baseData.totalVehicleCount * 0.9);
        baseData.avgVehicleCount = Math.round(baseData.avgVehicleCount * 0.9);
        baseData.peakVehicleCount = Math.round(baseData.peakVehicleCount * 0.9);
      }
      
      this.modalChannelData = {
        ...baseData,
        timeRange: timeRange,
        channelType: channelType,
        channels: this.channelStatsData.filter(channel => 
          channelType === 'entry' ? channel.type === '进口' : channel.type === '出口'
        )
      };
    },
    
    // 关闭弹窗
    closeChannelModal() {
      this.showChannelModal = false;
      this.selectedChannelType = '';
      this.modalChannelData = {};
      
      // 停止弹窗数据定时刷新
      this.stopModalDataRefresh();
    },
    
    // 处理饼图时间范围变化
    handlePieChartTimeRangeChange(timeRange) {
      console.log('饼图时间范围变化:', timeRange);
      // 可以选择是否同步更新全局时间范围
      // this.selectedTimeRange = timeRange;
      // this.onTimeRangeChange();
    },
    
    // 切换通道选择状态
    toggleChannelSelection(channel) {
      const index = this.selectedChannels.findIndex(c => c.name === channel.name);
      if (index > -1) {
        this.selectedChannels.splice(index, 1);
      } else {
        this.selectedChannels.push(channel);
      }
      this.validateSelection();
    },
    
    // 验证选择数量
    validateSelection() {
      const count = this.selectedChannels.length;
      if (count < 2) {
        this.selectionError = '请至少选择2个通道';
      } else if (count > 5) {
        this.selectionError = '最多只能选择5个通道，请取消一些选择';
      } else {
        this.selectionError = '';
      }
    },
    
    // 确认选择并显示详情
    async confirmChannelSelection() {
      if (this.selectedChannels.length < 2) {
        this.selectionError = '请至少选择2个通道';
        return;
      }
      if (this.selectedChannels.length > 5) {
        this.selectionError = '最多只能选择5个通道';
        return;
      }
      
      // 生成基于选中通道的弹窗数据（调用后端接口获取真实数据）
      await this.generateModalData();
      this.showChannelSelection = false;
      this.showChannelModal = true;
      
      // 启动弹窗数据定时刷新
      this.startModalDataRefresh();
    },
    
    // 为选中的通道生成弹窗数据
    generateMockModalDataForSelectedChannels(timeRange, channelType) {
      const channels = this.selectedChannels;
      
      // 为每个选中的通道生成车辆数量数据
      const selectedChannelsWithData = channels.map((channel, index) => {
        // 根据时间范围生成不同的基础车辆数量
        let baseVehicleCount = 0;
        switch (timeRange) {
          case 'today':
            baseVehicleCount = Math.floor(Math.random() * 100) + 50; // 50-150辆/日
            break;
          case 'week':
            baseVehicleCount = Math.floor(Math.random() * 500) + 200; // 200-700辆/周
            break;
          case 'month':
            baseVehicleCount = Math.floor(Math.random() * 2000) + 1000; // 1000-3000辆/月
            break;
          case 'year':
            baseVehicleCount = Math.floor(Math.random() * 20000) + 10000; // 10000-30000辆/年
            break;
        }
        
        // 根据通道位置调整车辆数量（1号门通常车辆数量最高）
        if (channel.name.includes('1号门')) {
          baseVehicleCount = Math.floor(baseVehicleCount * 1.5);
        } else if (channel.name.includes('林科门') || channel.name.includes('兴安门')) {
          baseVehicleCount = Math.floor(baseVehicleCount * 0.8);
        }
        
        return {
          ...channel,
          flow: baseVehicleCount, // 保持flow字段名以兼容现有代码
          vehicleCount: baseVehicleCount, // 新增vehicleCount字段
          utilization: Math.floor(Math.random() * 40) + 60 // 60-100%使用率
        };
      });
      
      // 计算统计数据
      const totalFlow = selectedChannelsWithData.reduce((sum, channel) => sum + channel.flow, 0);
      const avgFlow = Math.floor(totalFlow / channels.length);
      const peakFlow = Math.max(...selectedChannelsWithData.map(c => c.flow));
      
      this.modalChannelData = {
        selectedChannels: selectedChannelsWithData,
        totalFlow: totalFlow, // 保持字段名兼容性
        avgFlow: avgFlow,
        peakFlow: peakFlow,
        totalVehicleCount: totalFlow, // 新增车辆数量字段
        avgVehicleCount: avgFlow,
        peakVehicleCount: peakFlow,
        timeRange: timeRange,
        channelType: this.selectedChannelType
      };
    },
    
    // 取消通道选择
    cancelChannelSelection() {
      this.showChannelSelection = false;
      this.selectedChannels = [];
      this.selectionError = '';
    },
    
    // 处理图表点击事件
    handleChartClick(chartData) {
      console.log('收到图表点击事件:', chartData);
      this.visitorVipChartData = {
        hour: chartData.hour,
        entry: chartData.entry,
        type: chartData.type
      };
      this.showVisitorVipModal = true;
    },
    
    // 关闭访客VIP分析弹窗
    closeVisitorVipModal() {
      this.showVisitorVipModal = false;
      this.visitorVipChartData = {
        hour: null,
        entry: null,
        type: null
      };
    },
    
    // 启动弹窗数据定时刷新
    startModalDataRefresh() {
      // 清除已存在的定时器
      this.stopModalDataRefresh();
      
      console.log('启动弹窗数据定时刷新，间隔:', this.modalDataRefreshInterval, 'ms');
      
      // 启动新的定时器
      this.modalDataRefreshTimer = setInterval(async () => {
        console.log('定时刷新弹窗数据...');
        await this.generateModalData();
      }, this.modalDataRefreshInterval);
    },
    
    // 停止弹窗数据定时刷新
    stopModalDataRefresh() {
      if (this.modalDataRefreshTimer) {
        console.log('停止弹窗数据定时刷新');
        clearInterval(this.modalDataRefreshTimer);
        this.modalDataRefreshTimer = null;
      }
    },
    
    // ==================== 🔔 预约提醒相关方法 ====================
    
    /**
     * 初始化WebSocket连接
     */
    initWebSocket() {
      try {
        const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
        // 修复：直接连接到后端服务器的地址和端口
        const wsUrl = `${protocol}//localhost:8675/websocket/vehicle`;
        
        console.log('🔌 正在连接WebSocket:', wsUrl);
        
        this.websocket = new WebSocket(wsUrl);
        
        this.websocket.onopen = () => {
          console.log('✅ WebSocket连接成功');
          this.wsReconnectAttempts = 0;
        };
        
        this.websocket.onmessage = (event) => {
          try {
            const data = JSON.parse(event.data);
            console.log('📨 收到WebSocket消息:', data);
            
            // 处理预约进场提醒
            if (data.alertType === 'reservation_entry') {
              this.handleReservationAlert(data);
            }
          } catch (e) {
            console.error('❌ WebSocket消息解析失败:', e);
          }
        };
        
        this.websocket.onerror = (error) => {
          console.error('❌ WebSocket连接错误:', error);
          this.reconnectWebSocket();
        };
        
        this.websocket.onclose = () => {
          console.log('🔌 WebSocket连接关闭');
          this.reconnectWebSocket();
        };
        
      } catch (e) {
        console.error('❌ WebSocket初始化失败:', e);
        this.reconnectWebSocket();
      }
    },
    
    /**
     * WebSocket重连
     */
    reconnectWebSocket() {
      if (this.wsReconnectAttempts >= 10) {
        console.error('❌ WebSocket重连次数过多，停止重连');
        return;
      }
      
      const delay = Math.min(1000 * Math.pow(2, this.wsReconnectAttempts), 30000);
      this.wsReconnectAttempts++;
      
      console.log(`🔄 ${delay}ms 后尝试第 ${this.wsReconnectAttempts} 次重连...`);
      
      this.wsReconnectTimer = setTimeout(() => {
        this.initWebSocket();
      }, delay);
    },
    
    /**
     * 处理预约进场提醒
     * 后端已经做了重复过滤，只会推送保存成功的记录，前端直接显示即可
     */
    handleReservationAlert(alert) {
      
      // 确保有时间戳
      if (!alert.timestamp) {
        alert.timestamp = Date.now();
      }
      
      console.log('✅ 准备添加新提醒到队列');
      
      // 添加isExpanded属性，默认为未展开
      alert.isExpanded = false;
      
      // 添加到队列（最新的在前面）
      this.reservationAlerts.unshift(alert);
      // 限制队列长度（最多保留1000条，避免内存占用过多）
      if (this.reservationAlerts.length > 1000) {
        this.reservationAlerts = this.reservationAlerts.slice(0, 1000);
        console.log('⚠️ 队列超过1000条，已截断');
      }
      // 💾 保存到本地存储
      this.saveAlertsToLocalStorage();
      // 🔔 音效提示
      console.log('🔊 准备播放音效提示...');
      this.playSoundAlert(alert);
      console.log('✅ handleReservationAlert 方法执行完成');
    },
    
    /**
     * 初始化音频上下文
     */
    initAudioContext() {
      // 监听用户首次点击，初始化音频上下文
      const initAudio = async () => {
        try {
          if (!this.audioContext) {
            this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
            console.log('🔊 音频上下文初始化成功');
          }
          
          if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
            console.log('🔊 音频上下文已恢复');
          }
          
          // 移除监听器
          document.removeEventListener('click', initAudio);
          document.removeEventListener('touchstart', initAudio);
        } catch (error) {
          console.error('❌ 音频上下文初始化失败:', error);
        }
      };
      
      // 添加监听器
      document.addEventListener('click', initAudio);
      document.addEventListener('touchstart', initAudio);
    },
    
    /**
     * 🔔 播放进场提醒音效
     */
    async playSoundAlert(alert) {
      if (!this.soundSettings.enabled) {
        console.log('🔕 音效已禁用');
        return;
      }
      
      try {
        // 初始化AudioContext（如果还没有）
        if (!this.audioContext) {
          this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
          
          // 如果AudioContext被暂停，需要恢复
          if (this.audioContext.state === 'suspended') {
            await this.audioContext.resume();
          }
        }
        
        if (alert.type === 'vehicle') {
          // 🚗 车辆进场音效：响亮的四声提示音，更容易引起注意
          console.log('🚗 播放车辆进场音效');
          await this.playTone(800, 0.15, Math.min(this.soundSettings.volume * 1.3, 1)); // 第一声 - 更高频率更响亮
          await this.delay(100); // 间隔
          await this.playTone(1000, 0.15, Math.min(this.soundSettings.volume * 1.3, 1)); // 第二声
          await this.delay(100);
          await this.playTone(800, 0.15, Math.min(this.soundSettings.volume * 1.3, 1)); // 第三声
          await this.delay(100);
          await this.playTone(1000, 0.2, Math.min(this.soundSettings.volume * 1.3, 1)); // 第四声 - 持续更久
          
        } else if (alert.type === 'person') {
          // 👤 人员进场音效：清脆的四声"叮叮叮叮"
          console.log('👤 播放人员进场音效');
          await this.playTone(1200, 0.12, Math.min(this.soundSettings.volume * 1.2, 1)); // 第一声
          await this.delay(80);
          await this.playTone(1400, 0.12, Math.min(this.soundSettings.volume * 1.2, 1)); // 第二声
          await this.delay(80);
          await this.playTone(1200, 0.12, Math.min(this.soundSettings.volume * 1.2, 1)); // 第三声
          await this.delay(80);
          await this.playTone(1400, 0.18, Math.min(this.soundSettings.volume * 1.2, 1)); // 第四声
        }
        
      } catch (error) {
        console.error('❌ 音效播放失败:', error);
        // 降级方案：使用系统提示音
        this.playSystemBeep();
      }
    },
    
    /**
     * 播放单个音调
     */
    playTone(frequency, duration, volume) {
      return new Promise((resolve) => {
        const oscillator = this.audioContext.createOscillator();
        const gainNode = this.audioContext.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(this.audioContext.destination);
        
        oscillator.frequency.value = frequency;
        oscillator.type = 'triangle'; // 使用三角波，声音更清脆明亮，比正弦波更容易听到
        
        gainNode.gain.setValueAtTime(0, this.audioContext.currentTime);
        gainNode.gain.linearRampToValueAtTime(volume, this.audioContext.currentTime + 0.02); // 稍微延长攻击时间
        gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);
        
        oscillator.start(this.audioContext.currentTime);
        oscillator.stop(this.audioContext.currentTime + duration);
        
        oscillator.onended = resolve;
      });
    },
    
    /**
     * 延迟函数
     */
    delay(ms) {
      return new Promise(resolve => setTimeout(resolve, ms));
    },
    
    /**
     * 系统提示音降级方案
     */
    playSystemBeep() {
      try {
        // 创建一个很短的音频作为提示
        const context = new (window.AudioContext || window.webkitAudioContext)();
        const oscillator = context.createOscillator();
        const gainNode = context.createGain();
        
        oscillator.connect(gainNode);
        gainNode.connect(context.destination);
        
        oscillator.frequency.value = 800;
        gainNode.gain.setValueAtTime(0.3, context.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, context.currentTime + 0.1);
        
        oscillator.start(context.currentTime);
        oscillator.stop(context.currentTime + 0.1);
        
        console.log('🔔 播放系统提示音');
      } catch (e) {
        console.log('🔔 无法播放音效，但提醒已收到');
      }
    },
    
    
    /**
     * 切换音效开关
     */
    toggleSound() {
      this.soundSettings.enabled = !this.soundSettings.enabled;
      console.log(this.soundSettings.enabled ? '🔔 音效提示已开启' : '🔕 音效提示已关闭');
    },
    
    /**
     * 格式化手机号
     */
    formatPhone(phone) {
      if (!phone) return '未填写';
      if (phone.length === 11) {
        return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3');
      }
      return phone;
    },
    
    /**
     * 格式化预约时间段
     */
    formatTimeRange(startTime, endTime) {
      if (!startTime || !endTime) return '未指定时间段';
      
      const formatTime = (time) => {
        const date = new Date(time);
        return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      };
      
      return `${formatTime(startTime)} - ${formatTime(endTime)}`;
    },
    
    /**
     * 格式化进场时间
     */
    formatEntryTime(time) {
      if (!time) return '未知时间';
      const date = new Date(time);
      return `${date.getMonth() + 1}月${date.getDate()}日 ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}:${String(date.getSeconds()).padStart(2, '0')}`;
    },
    
    /**
     * 获取相对时间
     */
    getTimeAgo(timestamp) {
      const now = Date.now();
      const diff = now - timestamp;
      
      if (diff < 10000) return '刚刚';
      if (diff < 60000) return `${Math.floor(diff / 1000)}秒前`;
      if (diff < 3600000) return `${Math.floor(diff / 60000)}分钟前`;
      if (diff < 86400000) return `${Math.floor(diff / 3600000)}小时前`;
      return '很久之前';
    },
    
    /**
     * 预览图片
     */
    previewImage(imageUrl) {
      if (imageUrl) {
        this.previewImageUrl = imageUrl;
        this.showImagePreview = true;
      }
    },
    
    /**
     * 关闭图片预览
     */
    closeImagePreview() {
      this.showImagePreview = false;
      this.previewImageUrl = '';
    },
    
    /**
     * 图片加载失败处理
     */
    handleImageError(e) {
      console.warn('❌ 预约提醒图片加载失败:', e.target.src);
      // 使用UTF-8编码的SVG（直接内联，避免base64编码问题）
      const svg = `<svg width="200" height="150" xmlns="http://www.w3.org/2000/svg">
        <rect width="200" height="150" fill="#2a2a2a"/>
        <text x="50%" y="50%" fill="#999" font-size="16" text-anchor="middle" dominant-baseline="middle">📷 无法加载照片</text>
      </svg>`;
      e.target.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg);
    },
    
    /**
     * 查看预约详情
     */
    viewReservationDetail(alert) {
      console.log('查看预约详情:', alert);
      // 可扩展：跳转详情页或弹出详情弹窗
    },
    
    /**
     * 忽略单条提醒（移到历史记录）
     */
    dismissAlert(index, event) {
      console.log('📝 确认提醒 - 索引:', index);
      
      // 获取要确认的提醒
      const alert = this.reservationAlerts[index];
      if (alert) {
        // 标记为已确认
        alert.isConfirmed = true;
        alert.confirmedAt = Date.now();
        
        // 移到历史记录
        this.reservationAlertsHistory.unshift(alert);
        
        // 限制历史记录数量
        if (this.reservationAlertsHistory.length > this.maxHistorySize) {
          this.reservationAlertsHistory = this.reservationAlertsHistory.slice(0, this.maxHistorySize);
        }
      }
      
      // 从当前队列中删除
      this.reservationAlerts.splice(index, 1);
      console.log('📊 剩余提醒数量:', this.reservationAlerts.length);
      
      // 如果没有提醒了，自动切换到历史记录视图
      if (this.reservationAlerts.length === 0 && this.reservationAlertsHistory.length > 0) {
        this.showHistory = true;
      }
      
      // 💾 保存到本地存储
      this.saveAlertsToLocalStorage();
      
      // 阻止事件冒泡
      if (event) {
        event.stopPropagation();
      }
    },
    
    /**
     * 全部确认
     */
    confirmAllAlerts() {
      this.reservationAlerts = [];
      this.showReservationAlerts = false;
      this.isMinimized = false;
    },
    
    /**
     * 清除所有提醒（移到历史记录）
     */
    clearAllAlerts() {
      // 将所有提醒移到历史记录
      const now = Date.now();
      this.reservationAlerts.forEach(alert => {
        alert.isConfirmed = true;
        alert.confirmedAt = now;
        this.reservationAlertsHistory.unshift(alert);
      });
      
      // 限制历史记录数量
      if (this.reservationAlertsHistory.length > this.maxHistorySize) {
        this.reservationAlertsHistory = this.reservationAlertsHistory.slice(0, this.maxHistorySize);
      }
      
      // 清空当前队列
      this.reservationAlerts = [];
      this.showReservationAlerts = false;
      this.isMinimized = false;
      
      // 💾 保存到本地存储
      this.saveAlertsToLocalStorage();
    },
    
    /**
     * 关闭提醒
     */
    closeAlerts() {
      this.showReservationAlerts = false;
    },
    
    /**
     * 最小化提醒
     */
    minimizeAlerts() {
      this.showReservationAlerts = false;
      this.isMinimized = true;
    },
    
    /**
     * 恢复提醒
     */
    restoreAlerts() {
      this.showReservationAlerts = true;
      this.isMinimized = false;
    },
    
    /**
     * 切换预约提醒弹窗显示/隐藏
     */
    toggleReservationAlerts() {
      this.showReservationAlerts = !this.showReservationAlerts;
      if (this.showReservationAlerts) {
        this.isMinimized = false;
      }
    },
    
    /**
     * 切换提醒项的展开/折叠状态
     */
    toggleAlertExpand(index) {
      if (this.reservationAlerts[index]) {
        this.$set(this.reservationAlerts[index], 'isExpanded', !this.reservationAlerts[index].isExpanded);
      }
    },
    
    /**
     * 切换历史提醒项的展开/折叠状态
     */
    toggleHistoryAlertExpand(index) {
      if (this.reservationAlertsHistory[index]) {
        this.$set(this.reservationAlertsHistory[index], 'isExpanded', !this.reservationAlertsHistory[index].isExpanded);
      }
    },
    
    /**
     * 切换历史记录视图
     */
    toggleHistoryView() {
      this.showHistory = !this.showHistory;
    },
    
    /**
     * 获取车牌类型（用于样式）
     * 参考 center.vue 的实现
     */
    getPlateType(plateNumber, record = {}) {
      if (!plateNumber) return 'traditional';
      const plate = plateNumber.trim().toUpperCase();

      // 8位车牌 = 新能源车（绿牌）
      if (plate.length === 8) {
        return 'new-energy';
      }

      // 7位车牌需要根据颜色判断
      if (plate.length === 7) {
        // 获取后端数据库中的车牌颜色字段
        let licenseColor = (record.enter_car_license_color || record.exit_car_license_color || record.enterCarLicenseColor || record.leaveCarLicenseColor || '').toString().toLowerCase();

        // 兼容颜色数字编码
        if (/^\d+$/.test(licenseColor)) {
          switch (licenseColor) {
            case '1': licenseColor = '蓝色'; break;
            case '2': licenseColor = '黄色'; break;
            case '3': licenseColor = '白色'; break;
            case '4': licenseColor = '绿色'; break;
            default: break;
          }
        }

        // 颜色归一化处理
        if (licenseColor.includes('蓝')) licenseColor = '蓝色';
        else if (licenseColor.includes('黄')) licenseColor = '黄色';
        else if (licenseColor.includes('绿')) licenseColor = '绿色';
        else if (licenseColor.includes('白')) licenseColor = '白色';
        else if (licenseColor.includes('灰')) licenseColor = '灰色';
        else if (licenseColor.includes('黑')) licenseColor = '黑色';

        // 根据颜色返回对应样式
        if (licenseColor) {
          let result;
          switch (licenseColor) {
            case '蓝色':
              result = 'traditional'; break;  // 蓝底白字
            case '黄色':
              result = 'yellow'; break;       // 黄底黑字
            case '白色':
              result = 'police'; break;       // 白底黑字
            case '绿色':
              result = 'new-energy'; break;   // 绿底黑字（少见的7位绿牌）
            default:
              result = 'traditional';
              break;
          }
          return result;
        }

        // 降级逻辑：判断警车
        if (/警$/.test(plate)) {
          return 'police';
        }
        
        // 按 enter_car_type 2 返回黄牌
        if (record && String(record.enter_car_type) === '2') {
          return 'yellow';
        }

        // 默认7位车牌当作蓝牌
        return 'traditional';
      }

      // 其他长度车牌默认处理
      return 'traditional';
    },
    
    /**
     * 切换音效开关
     */
    toggleSound() {
      this.soundSettings.enabled = !this.soundSettings.enabled;
      console.log('🔊 音效已', this.soundSettings.enabled ? '开启' : '关闭');
    },
    
    /**
     * 💾 保存提醒数据到本地存储
     */
    saveAlertsToLocalStorage() {
      try {
        const data = {
          alerts: this.reservationAlerts,
          history: this.reservationAlertsHistory,
          savedAt: Date.now()
        };
        localStorage.setItem('parking_reservation_alerts', JSON.stringify(data));
        console.log('💾 提醒数据已保存到本地存储');
      } catch (error) {
        console.error('❌ 保存提醒数据失败:', error);
      }
    },
    
    /**
     * 📂 从本地存储加载提醒数据
     */
    loadAlertsFromLocalStorage() {
      try {
        const stored = localStorage.getItem('parking_reservation_alerts');
        if (stored) {
          const data = JSON.parse(stored);
          
          // 只加载24小时内的提醒
          const now = Date.now();
          const oneDayAgo = now - 24 * 60 * 60 * 1000;
          
          // 恢复未确认的提醒
          this.reservationAlerts = (data.alerts || []).filter(alert => {
            return alert.timestamp > oneDayAgo;
          });
          
          // 恢复历史记录（保留7天内的）
          const sevenDaysAgo = now - 7 * 24 * 60 * 60 * 1000;
          this.reservationAlertsHistory = (data.history || []).filter(alert => {
            return alert.confirmedAt > sevenDaysAgo;
          });
          
          console.log('📂 从本地存储恢复提醒数据:', {
            alerts: this.reservationAlerts.length,
            history: this.reservationAlertsHistory.length
          });
        }
      } catch (error) {
        console.error('❌ 加载提醒数据失败:', error);
      }
    },
    
    /**
     * 🗑️ 清除本地存储的提醒数据
     */
    clearLocalStorageAlerts() {
      try {
        localStorage.removeItem('parking_reservation_alerts');
        console.log('🗑️ 已清除本地存储的提醒数据');
      } catch (error) {
        console.error('❌ 清除提醒数据失败:', error);
      }
    }
  }
};
</script>

<style lang="scss" scoped>
@import "../assets/scss/index.scss";

// 顶部标题区域样式
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
    padding-left: 650px; // 向右偏移100px
    display: flex;
    align-items: center;
    gap: 20px;
    
    .main-title {
      font-size: 28px;
      font-weight: bold;
      color: #ffffff;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
    }
    
    // 🔔 喇叭提醒按钮
    .notification-bell {
      position: relative;
      cursor: pointer;
      padding: 8px 12px;
      background: rgba(255, 193, 7, 0.1);
      border: 1px solid rgba(255, 193, 7, 0.3);
      border-radius: 8px;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: 8px;
      
      &:hover {
        background: rgba(255, 193, 7, 0.2);
        border-color: rgba(255, 193, 7, 0.5);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
      }
      
      .bell-icon {
        font-size: 22px;
        transition: all 0.3s ease;
        
        &.has-alerts {
          animation: ring 2.5s ease-in-out infinite;
        }
      }
      
      .alert-badge {
        min-width: 20px;
        height: 20px;
        background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
        color: #fff;
        border-radius: 10px;
        font-size: 12px;
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 6px;
        box-shadow: 0 2px 8px rgba(255, 77, 79, 0.4);
        animation: badgePulse 2s ease-in-out infinite;
      }
    }
  }
  
  .header-right {
    display: flex;
    gap: 20px;
    align-items: center;
    
    .time-selector, .channel-selector {
      .time-select, .channel-select {
        background: rgba(11, 19, 42, 0.9);
        border: 1px solid #1e3a8a;
        border-radius: 6px;
        color: #ffffff;
        padding: 8px 15px;
        font-size: 14px;
        cursor: pointer;
        transition: all 0.3s ease;
        
        &:hover {
          border-color: #3b82f6;
          box-shadow: 0 0 10px rgba(59, 130, 246, 0.3);
        }
        
        &:focus {
          outline: none;
          border-color: #3b82f6;
          box-shadow: 0 0 15px rgba(59, 130, 246, 0.4);
        }
        
        option {
          background: #0b132a;
          color: #ffffff;
        }
      }
    }
  }
  
  .location-info, .alert-info, .weather-info, .datetime-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 15px;
    background: rgba(11, 19, 42, 0.8);
    border: 1px solid #1e3a8a;
    border-radius: 6px;
    
    .location-icon, .alert-icon, .weather-icon {
      font-size: 16px;
    }
    
    .location-text, .alert-text, .weather-text, .datetime-text {
      font-size: 14px;
      color: #e2e8f0;
      font-weight: 500;
    }
    
    .alert-text {
      color: #f59e0b;
    }
    
    .weather-text {
      color: #10b981;
    }
  }
}


// 页面内容区域样式
.page-content {
  height: auto;
  // height: calc(100vh - 200px);
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 15px;
}

// 分析区域样式
.analysis-section {
  padding: 15px;
  
  .analysis-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    grid-template-rows: 1fr 1fr;
    gap: 15px;
    height: 500px; // 增加整体高度，为底部图表提供更多空间
  }
  
  .analysis-module {
    height: 100%;
    
    .analysis-header {
      padding: 15px 20px;
      border-bottom: 1px solid #1e3a8a;
      
      h3 {
        margin: 0;
        font-size: 16px;
        color: #ffffff;
        font-weight: bold;
      }
    }
    
    .analysis-body {
      padding: 20px;
      height: calc(100% - 60px);
      overflow-y: auto;
    }
  }
  
  .vehicle-stats, .face-stats, .revenue-stats {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 20px;
    height: 100%;
  }
  
  .stat-item {
    display: flex;
    flex-direction: column;
    justify-content: center;
    align-items: center;
    background: rgba(11, 19, 42, 0.6);
    border: 1px solid #1e3a8a;
    border-radius: 8px;
    padding: 20px;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
      border-color: #3b82f6;
    }
  }
  
  .stat-label {
    font-size: 12px;
    color: #94a3b8;
    margin-bottom: 8px;
    text-align: center;
  }
  
  .stat-value {
    font-size: 24px;
    font-weight: bold;
    color: #3b82f6;
    text-align: center;
  }
  
  .trend-chart {
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .chart-placeholder {
      text-align: center;
      color: #94a3b8;
      
      p {
        margin: 10px 0;
        font-size: 14px;
      }
    }
  }
}


// KPI卡片区域样式
.kpi-section {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 20px 30px;
  // background: rgba(11, 19, 42, 0.6);
  
  .kpi-card {
    flex: 1;
    max-width: 200px;
    // background: rgba(11, 19, 42, 0.9);
    border: 1px solid #1e3a8a;
    border-radius: 8px;
    padding: 20px 15px;
    text-align: center;
    transition: all 0.3s ease;
    
    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 25px rgba(59, 130, 246, 0.2);
      border-color: #3b82f6;
    }
    
    .kpi-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 15px;
      
      .kpi-icon {
        font-size: 18px;
      }
      
      .kpi-title {
        font-size: 13px;
        color: #94a3b8;
        font-weight: 500;
      }
    }
    
    .kpi-value {
      font-size: 32px;
      font-weight: bold;
      color: #3b82f6;
      margin-bottom: 8px;
      text-shadow: 0 2px 4px rgba(0,0,0,0.3);
    }
    
    .kpi-unit {
      font-size: 12px;
      color: #64748b;
      font-weight: 500;
    }
  }
}

// 主要内容区域样式
.main-content-grid {
  display: grid;
  grid-template-columns: 26% 46% 27%; // 进一步增加右侧宽度到32%
  padding-right: 0px; // 改为0，让右侧与屏幕对齐
  // gap: 10px;
  padding: 2px 0px 15px 10px; // 减少左侧padding，让整体更靠右
  margin-left: -15px;
  margin-right: -10px; // 添加负右边距，让右侧更靠右
  margin-top: -5px;
  height: auto; // 由父级grid行高控制
  
  .content-column {
    width: 100%;
    display: flex;
    flex-direction: column;
    gap: 15px;
    
    // 右侧列向右移动
    &:last-child {
      margin-left: 12.3px;
    }
  }
  .module-container {
      flex: 1;
      min-height: 50px;
      &.compact {
        flex: none;
        height: 380px; // 增加高度从280px到380px
        min-height: 0;
      }
      
      &.main-chart {
        flex: 2;
        min-height: 520px;
      }
      
      &.revenue-analysis {
        flex: none;
        height: 320px;
        min-height: 0;
        width: 100%; // 改为自适应宽度
        margin-top: -17px;
      }
      
      &.flow-analysis {
        flex: none;
        height: 399px;
        width: 100%; // 改为自适应宽度
        min-height: 0;
      }
      
      &.channel-stats-container {
        flex: none;
        height: 380px;
        min-height: 0;
        width: 100%; // 改为自适应宽度
      }
      
      &.channel-pie-container {
        flex: none;
        height: 300px;
        min-height: 0;
        width: 100%; // 改为自适应宽度
        margin-top: -20px;
      }
      
      &.anomaly-monitor {
        flex: none;
        height: 330px;
        width: 100%; // 改为自适应宽度
        min-height: 0;
      }
      
      &.visitor-plan {
        flex: none;
        height: 270px;
        width: 100%; // 改为自适应宽度
        min-height: 0;
      }
    }
}

// 底部区域样式
.bottom-section {
  display: grid;
  grid-template-columns: 0.8fr 1.2fr;
  gap: 15px;
  padding: 15px;
  height: auto; // 由父级grid第二行固定高度控制
  
  .bottom-module {
    height: 100%;
  }
}

// 响应式设计
@media (max-width: 1600px) {
  .kpi-section {
    .kpi-card {
      max-width: 180px;
      padding: 15px 10px;
      
      .kpi-value {
        font-size: 28px;
      }
    }
  }
}

@media (max-width: 1200px) {
  .main-content-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    
    .content-column {
      flex-direction: row;
      
      .module-container {
        flex: 1;
        min-height: 300px;
        
        &.main-chart {
          flex: 2;
        }
      }
    }
  }
}

// 弹窗样式
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
  backdrop-filter: blur(5px);
}

.modal-content {
  background: rgba(11, 19, 42, 0.95);
  border: 1px solid #1e3a8a;
  border-radius: 12px;
  width: 90%; // 增加宽度，更好地利用屏幕空间
  max-width: 1600px; // 增加最大宽度
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: 15px 20px; // 减少头部内边距
  border-bottom: 1px solid #1e3a8a;
  background: rgba(11, 19, 42, 0.9);
  
  .modal-title-section {
    flex: 1;
    
    h3 {
      margin: 0 0 8px 0;
      font-size: 20px;
      color: #ffffff;
      font-weight: bold;
    }
    
    .modal-subtitle {
      margin: 0;
      font-size: 14px;
      color: #94a3b8;
      line-height: 1.4;
      
      .selected-channels-info {
        color: #3b82f6;
        font-weight: 500;
      }
    }
  }
  
  .close-btn {
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
    border-radius: 50%;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
    }
  }
}

.modal-body {
  padding: 15px; // 大幅减少外边框间距
  max-height: calc(90vh - 80px);
  overflow-y: auto;
}


.charts-container {
  display: grid;
  grid-template-columns: 0.6fr 0.4fr; // 给饼状图更多空间，使用率对比图稍小
  grid-template-rows: 250px 1fr; // 增加上方两个图表高度
  gap: 2px; // 进一步减少图表间距
  width: 100%; // 确保容器宽度与弹窗宽度保持一致
  
  .chart-section {
    background: none; // 完全去除背景
    border: none; // 完全去除边框
    border-radius: 0; // 去除圆角
    padding: 2px; // 进一步减少内边距
    width: 100%; // 确保每个图表区域充分利用可用空间
    min-height: 250px; // 降低最小高度
    
    // 上方两个图表使用固定高度
    &:nth-child(1),
    &:nth-child(2) {
      height: 250px;
      min-height: 250px; // 增加高度，让图表显示更清晰
    }
    
    // 下方图表使用剩余空间
    &:nth-child(3) {
      height: 100%;
      min-height: 450px; // 增加最小高度，确保图表内容完整显示
    }
    
    // 网格位置定义
    &:nth-child(1) {
      grid-column: 1;
      grid-row: 1;
    }
    
    &:nth-child(2) {
      grid-column: 2;
      grid-row: 1;
    }
    
    &:nth-child(3) {
      grid-column: 1 / -1;
      grid-row: 2;
    }
  }
}

// 大屏幕优化
@media (min-width: 1600px) {
  .modal-content {
    width: 98%;
    max-width: 1800px; // 大屏幕上进一步增加最大宽度
  }
}

// 响应式设计
@media (max-width: 1200px) {
  .modal-content {
    width: 98%; // 在小屏幕上使用更多空间
    max-width: none;
  }
  
  
  .charts-container {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    
    .chart-section {
      &:nth-child(1),
      &:nth-child(2),
      &:nth-child(3) {
        grid-column: 1;
        grid-row: auto;
      }
    }
  }
}

// 通道选择弹窗样式
.channel-selection-modal {
  max-width: 800px;
  
  .modal-body {
    padding: 30px;
  }
  
  .selection-instructions {
    margin-bottom: 25px;
    
    p {
      margin: 0 0 15px 0;
      font-size: 16px;
      color: #ffffff;
      font-weight: 500;
    }
    
    .selection-status {
      display: flex;
      align-items: center;
      gap: 15px;
      font-size: 14px;
      color: #94a3b8;
      
      .selected-count {
        color: #3b82f6;
        font-weight: bold;
        font-size: 16px;
      }
      
      .error-message {
        color: #ef4444;
        font-size: 13px;
        background: rgba(239, 68, 68, 0.1);
        padding: 4px 8px;
        border-radius: 4px;
        border: 1px solid rgba(239, 68, 68, 0.3);
      }
    }
  }
  
  .channels-grid {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
    gap: 15px;
    margin-bottom: 30px;
    max-height: 300px;
    overflow-y: auto;
    padding: 5px;
    
    .channel-item {
      display: flex;
      align-items: center;
      padding: 15px;
      background: rgba(11, 19, 42, 0.8); // 提高背景透明度，让颜色更亮
      border: 2px solid #334155; // 使用更亮的边框颜色
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        border-color: #3b82f6;
        background: rgba(59, 130, 246, 0.1);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
      }
      
      &.selected {
        border-color: #3b82f6;
        background: rgba(59, 130, 246, 0.2);
        box-shadow: 0 0 15px rgba(59, 130, 246, 0.3);
        
        .channel-checkbox {
          background: #3b82f6;
          border-color: #3b82f6;
          
          .checkmark {
            color: #ffffff;
          }
        }
        
        .channel-name {
          color: #3b82f6;
          font-weight: 600;
        }
      }
      
      .channel-checkbox {
        width: 20px;
        height: 20px;
        border: 2px solid #94a3b8; // 使用更亮的边框颜色
        border-radius: 4px;
        display: flex;
        align-items: center;
        justify-content: center;
        margin-right: 12px;
        transition: all 0.3s ease;
        
        .checkmark {
          font-size: 14px;
          font-weight: bold;
        }
      }
      
      .channel-name {
        flex: 1;
        font-size: 14px;
        color: #ffffff;
        font-weight: 500;
        transition: all 0.3s ease;
      }
    }
  }
  
  .modal-actions {
    display: flex;
    justify-content: flex-end;
    gap: 15px;
    padding-top: 20px;
    border-top: 1px solid #1e3a8a;
    
    .btn-cancel, .btn-confirm {
      padding: 12px 24px;
      border: none;
      border-radius: 6px;
      font-size: 14px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      min-width: 100px;
    }
    
    .btn-cancel {
      background: rgba(100, 116, 139, 0.2);
      color: #94a3b8;
      border: 1px solid #64748b;
      
      &:hover {
        background: rgba(100, 116, 139, 0.3);
        color: #ffffff;
      }
    }
    
    .btn-confirm {
      background: #3b82f6;
      color: #ffffff;
      border: 1px solid #3b82f6;
      
      &:hover:not(:disabled) {
        background: #2563eb;
        border-color: #2563eb;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }
      
      &:disabled {
        background: rgba(100, 116, 139, 0.3);
        border-color: #64748b;
        color: #64748b;
        cursor: not-allowed;
        opacity: 0.6;
      }
    }
  }
}

/* ======================== 🔔 预约进场提醒弹窗样式 - 紧凑折叠样式 ======================== */

.reservation-alert-modal-compact {
  position: fixed;
  top: 70px;
  right: 20px;
  width: 560px;
  max-height: calc(100vh - 100px);
  background: linear-gradient(135deg, #1e2139 0%, #2d3250 100%);
  border: 1px solid rgba(100, 149, 237, 0.4);
  border-radius: 16px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6);
  z-index: 9999;
  overflow: hidden;
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
}

/* 动画关键帧 */
@keyframes ring {
  0%, 100% { transform: rotate(0deg); }
  5%, 15% { transform: rotate(-15deg); }
  10%, 20% { transform: rotate(15deg); }
  25% { transform: rotate(0deg); }
}

@keyframes badgePulse {
  0%, 100% { 
    transform: scale(1);
    box-shadow: 0 2px 8px rgba(255, 77, 79, 0.4);
  }
  50% { 
    transform: scale(1.1);
    box-shadow: 0 4px 16px rgba(255, 77, 79, 0.6);
  }
}

/* 头部 */
.alert-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 16px 20px;
  background: linear-gradient(90deg, rgba(100, 149, 237, 0.15) 0%, rgba(72, 118, 255, 0.1) 100%);
  border-bottom: 1px solid rgba(100, 149, 237, 0.3);
}

.alert-title {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .title-icon {
    font-size: 20px;
  }
  
  .title-text {
    font-size: 17px;
    font-weight: 600;
    color: #fff;
  }
  
  .alert-count {
    background: linear-gradient(135deg, #4876ff 0%, #6495ed 100%);
    color: #fff;
    padding: 4px 12px;
    border-radius: 12px;
    font-size: 12px;
    font-weight: 600;
  }
}

.alert-actions {
  display: flex;
  align-items: center;
  gap: 10px;
  
  .btn-sound,
  .btn-history,
  .btn-clear-all,
  .btn-close {
    background: rgba(255, 255, 255, 0.08);
    border: none;
    color: #fff;
    font-size: 14px;
    cursor: pointer;
    padding: 6px 12px;
    border-radius: 6px;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.15);
    }
  }
  
  .btn-sound {
    font-size: 18px;
    padding: 6px 10px;
    
    &.active {
      background: rgba(82, 196, 26, 0.2);
      color: #52c41a;
    }
  }
  
  .btn-history {
    position: relative;
    font-size: 18px;
    padding: 6px 10px;
    
    &:hover {
      background: rgba(100, 149, 237, 0.2);
      color: #6495ed;
    }
    
    .history-count {
      position: absolute;
      top: -4px;
      right: -4px;
      min-width: 16px;
      height: 16px;
      background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
      color: #fff;
      border-radius: 8px;
      font-size: 10px;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 0 4px;
      box-shadow: 0 2px 6px rgba(255, 77, 79, 0.4);
    }
  }
  
  .btn-close {
    font-size: 20px;
    width: 30px;
    height: 30px;
    padding: 0;
  }
}

/* 主体内容 - 折叠列表 */
.alert-body {
  flex: 1;
  overflow-y: auto;
  padding: 12px;
  max-height: calc(100vh - 180px);
}

/* Tab切换样式 */
.alert-tabs {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  padding: 4px;
  background: rgba(0, 0, 0, 0.2);
  border-radius: 8px;
  
  .tab {
    flex: 1;
    padding: 10px 16px;
    text-align: center;
    font-size: 14px;
    color: rgba(255, 255, 255, 0.6);
    background: transparent;
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    font-weight: 500;
    
    &:hover {
      color: rgba(255, 255, 255, 0.8);
      background: rgba(255, 255, 255, 0.05);
    }
    
    &.active {
      color: #fff;
      background: linear-gradient(135deg, rgba(72, 118, 255, 0.3) 0%, rgba(100, 149, 237, 0.2) 100%);
      border: 1px solid rgba(100, 149, 237, 0.4);
      font-weight: 600;
      box-shadow: 0 2px 8px rgba(72, 118, 255, 0.2);
    }
  }
}

/* 提醒列表容器 */
.alert-list {
  min-height: 100px;
}

/* 折叠列表项 */
.alert-item-compact {
  background: rgba(255, 255, 255, 0.04);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  margin-bottom: 12px;
  overflow: hidden;
  transition: all 0.3s ease;
  
  &.expanded {
    background: rgba(255, 255, 255, 0.06);
    border-color: rgba(100, 149, 237, 0.4);
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.3);
  }
  
  &:hover {
    border-color: rgba(100, 149, 237, 0.3);
  }
}

/* 紧凑的一行显示 */
.compact-row {
  display: flex;
  align-items: center;
  padding: 14px 16px;
  cursor: pointer;
  transition: background-color 0.2s ease;
  
  &:hover {
    background: rgba(255, 255, 255, 0.03);
  }
  
  .main-info {
    flex: 1;
    display: flex;
    align-items: center;
    gap: 10px;
    overflow: hidden;
    
    .type-badge {
      font-size: 20px;
      flex-shrink: 0;
      
      &.vehicle {
        filter: drop-shadow(0 0 4px rgba(72, 118, 255, 0.5));
      }
      
      &.person {
        filter: drop-shadow(0 0 4px rgba(82, 196, 26, 0.5));
      }
    }
    
    .plate-number {
      font-size: 16px;
      font-weight: 700;
      padding: 4px 12px;
      border-radius: 6px;
      letter-spacing: 1px;
      flex-shrink: 0;
      
      /* 默认样式（蓝牌） */
      &.traditional {
        background: linear-gradient(180deg, #0C4FC5 0%, #216FEF 100%);
        color: #FFFFFF;
        border: 1px solid rgba(33, 111, 239, 0.6);
        box-shadow: 0 2px 6px rgba(12, 79, 197, 0.3);
      }
      
      /* 黄牌 */
      &.yellow {
        background: linear-gradient(180deg, #f8c401 0%, #dba700 100%) !important;
        color: #000000 !important;
        border: 1px solid #a88600 !important;
        box-shadow: 0 2px 4px rgba(248, 196, 1, 0.3) !important;
      }
      
      /* 绿牌（新能源） */
      &.new-energy {
        background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%) !important;
        color: #000000 !important;
        border: 1px solid #6AD390 !important;
        box-shadow: 0 2px 4px rgba(106, 211, 144, 0.3) !important;
      }
      
      /* 白牌（警车等） */
      &.police {
        background: linear-gradient(180deg, #F0F0F0 0%, #FFFFFF 100%) !important;
        color: #000000 !important;
        border: 1px solid rgba(200, 200, 200, 0.6) !important;
        box-shadow: 0 2px 6px rgba(240, 240, 240, 0.3) !important;
      }
    }
    
    .person-name {
      font-size: 16px;
      font-weight: 700;
      color: #fff;
      background: linear-gradient(135deg, rgba(30, 60, 114, 0.6) 0%, rgba(42, 82, 152, 0.6) 100%);
      padding: 4px 12px;
      border-radius: 6px;
      border: 1px solid rgba(72, 118, 255, 0.4);
      letter-spacing: 1px;
      flex-shrink: 0;
    }
    
    .channel-name {
      font-size: 13px;
      color: #73d13d;
      font-weight: 500;
      flex-shrink: 0;
    }
    
    .time-display {
      font-size: 12px;
      color: #999;
      margin-left: auto;
      flex-shrink: 0;
      min-width: 70px;
      text-align: right;
    }
    
    .confirmed-badge {
      font-size: 11px;
      color: #52c41a;
      background: rgba(82, 196, 26, 0.15);
      padding: 2px 8px;
      border-radius: 4px;
      font-weight: 600;
      flex-shrink: 0;
      border: 1px solid rgba(82, 196, 26, 0.3);
    }
  }
  
  .expand-icon {
    margin-left: 12px;
    color: #94a3b8;
    font-size: 12px;
    transition: transform 0.3s ease;
  }
}

.alert-item-compact.expanded .expand-icon {
  transform: rotate(180deg);
}

/* 展开后的详细内容 */
.detail-content {
  padding: 16px;
  background: rgba(0, 0, 0, 0.15);
  border-top: 1px solid rgba(255, 255, 255, 0.08);
  
  .photo-section {
    margin-bottom: 16px;
    
    .photo-wrapper {
      position: relative;
      width: 100%;
      max-width: 400px;
      height: 200px;
      margin: 0 auto;
      border-radius: 8px;
      overflow: hidden;
      background: rgba(0, 0, 0, 0.3);
      cursor: pointer;
      border: 2px solid rgba(255, 255, 255, 0.1);
      
      &:hover {
        border-color: rgba(100, 149, 237, 0.4);
      }
      
      img {
        width: 100%;
        height: 100%;
        object-fit: contain;
      }
      
      .no-photo {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: center;
        height: 100%;
        color: rgba(255, 255, 255, 0.3);
        font-size: 14px;
        gap: 8px;
      }
    }
  }
  
  .info-grid {
    display: grid;
    grid-template-columns: 1fr;
    gap: 12px;
    margin-bottom: 16px;
    
    .info-block {
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(255, 255, 255, 0.08);
      border-radius: 8px;
      padding: 12px;
      
      .block-title {
        font-size: 13px;
        font-weight: 600;
        color: #6495ed;
        margin-bottom: 10px;
        padding-bottom: 8px;
        border-bottom: 1px solid rgba(100, 149, 237, 0.2);
      }
      
      .info-row {
        display: flex;
        align-items: flex-start;
        gap: 8px;
        font-size: 13px;
        margin-bottom: 8px;
        
        &:last-child {
          margin-bottom: 0;
        }
        
        .label {
          color: rgba(255, 255, 255, 0.6);
          min-width: 70px;
          flex-shrink: 0;
        }
        
        .value {
          color: rgba(255, 255, 255, 0.9);
          flex: 1;
          
          &.plate {
            font-weight: 600;
            color: #4876ff;
            font-family: 'Consolas', monospace;
            letter-spacing: 1px;
          }
        }
      }
    }
  }
  
  .action-buttons {
    display: flex;
    justify-content: flex-end;
    gap: 10px;
    
    .btn-dismiss {
      padding: 8px 24px;
      background: linear-gradient(135deg, #4876ff 0%, #6495ed 100%);
      color: #fff;
      border: none;
      border-radius: 6px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 600;
      transition: all 0.3s ease;
      
      &:hover {
        background: linear-gradient(135deg, #3b5bff 0%, #5b8aed 100%);
        box-shadow: 0 4px 12px rgba(72, 118, 255, 0.4);
        transform: translateY(-1px);
      }
    }
  }
}

/* 历史记录项样式 */
.history-item {
  opacity: 0.85;
  
  &:hover {
    opacity: 1;
  }
  
  .compact-row {
    background: rgba(255, 255, 255, 0.02);
  }
}

/* 空历史记录提示 */
.empty-history {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.4);
  
  .empty-icon {
    font-size: 48px;
    margin-bottom: 16px;
    opacity: 0.6;
  }
  
  p {
    font-size: 14px;
    margin: 0;
    font-weight: 500;
  }
}

/* 最小化角标 */
.minimized-badge {
  position: fixed;
  bottom: 30px;
  right: 30px;
  width: 60px;
  height: 60px;
  background: linear-gradient(135deg, #4876ff 0%, #6495ed 100%);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(72, 118, 255, 0.5);
  z-index: 9998;
  animation: pulse-badge 2s infinite;
}

@keyframes pulse-badge {
  0%, 100% { 
    box-shadow: 0 8px 24px rgba(72, 118, 255, 0.5);
    transform: scale(1);
  }
  50% { 
    box-shadow: 0 8px 32px rgba(72, 118, 255, 0.8), 0 0 0 8px rgba(72, 118, 255, 0.2);
    transform: scale(1.05);
  }
}

.minimized-badge .badge-icon {
  font-size: 24px;
  color: #fff;
}

.minimized-badge .badge-count {
  position: absolute;
  top: -5px;
  right: -5px;
  background: #ff4d4f;
  color: #fff;
  width: 24px;
  height: 24px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 12px;
  font-weight: 700;
  border: 2px solid #fff;
}

/* 图片预览弹窗 */
.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-container {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
}

.preview-container img {
  max-width: 100%;
  max-height: 100%;
  border-radius: 8px;
  box-shadow: 0 12px 48px rgba(0, 0, 0, 0.6);
}

.btn-close-preview {
  position: absolute;
  top: -40px;
  right: 0;
  background: rgba(255, 255, 255, 0.2);
  border: none;
  color: #fff;
  font-size: 24px;
  cursor: pointer;
  width: 40px;
  height: 40px;
  border-radius: 50%;
  transition: all 0.3s ease;
}

.btn-close-preview:hover {
  background: rgba(255, 255, 255, 0.3);
}

/* 过渡动画 */
.modal-fade-enter-active {
  animation: modalSlideIn 0.4s cubic-bezier(0.25, 0.46, 0.45, 0.94);
}

.modal-fade-leave-active {
  animation: modalSlideOut 0.3s ease-in;
}

@keyframes modalSlideIn {
  from {
    transform: translateX(100%) scale(0.95);
    opacity: 0;
  }
  to {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
}

@keyframes modalSlideOut {
  from {
    transform: translateX(0) scale(1);
    opacity: 1;
  }
  to {
    transform: translateX(100%) scale(0.95);
    opacity: 0;
  }
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}

.bounce-enter-active {
  animation: bounceIn 0.6s ease-out;
}

.bounce-leave-active {
  animation: bounceOut 0.4s ease-in;
}

@keyframes bounceIn {
  0% {
    transform: scale(0.3) translateY(100px);
    opacity: 0;
  }
  50% {
    transform: scale(1.05);
    opacity: 1;
  }
  70% {
    transform: scale(0.9);
  }
  100% {
    transform: scale(1) translateY(0);
    opacity: 1;
  }
}

@keyframes bounceOut {
  0% {
    transform: scale(1);
    opacity: 1;
  }
  100% {
    transform: scale(0.3) translateY(100px);
    opacity: 0;
  }
}

/* 滚动条美化 */
.alert-body::-webkit-scrollbar {
  width: 8px;
}

.alert-body::-webkit-scrollbar-track {
  background: rgba(255, 255, 255, 0.05);
  border-radius: 4px;
}

.alert-body::-webkit-scrollbar-thumb {
  background: rgba(100, 149, 237, 0.4);
  border-radius: 4px;
}

.alert-body::-webkit-scrollbar-thumb:hover {
  background: rgba(100, 149, 237, 0.6);
}

/* 响应式设计 */
@media (max-width: 600px) {
  .reservation-alert-modal-compact {
    left: 10px;
    right: 10px;
    width: auto;
    top: 60px;
  }
  
  .compact-row .main-info {
    flex-wrap: wrap;
  }
  
  .photo-wrapper {
    max-width: 100% !important;
  }
}
</style>