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
            <!-- 添加关注对象按钮 -->
            <div class="add-watch-btn" @click="showAddWatchForm = true" title="添加关注对象">
              <span class="add-icon">➕</span>
            </div>
            <!-- 🌙 夜间学生出校提醒按钮 -->
            <div class="night-alert-btn" @click="toggleNightAlertList" title="夜间学生出校提醒">
              <span class="night-alert-icon">🌙</span>
              <span v-if="nightAlertUnreadCount > 0" class="night-alert-badge">{{ nightAlertUnreadCount > 99 ? '99+' : nightAlertUnreadCount }}</span>
            </div>
          </div>
          
          <div class="header-right">
            <!-- 用户信息 -->
            <div class="user-info" @click.stop="toggleUserMenu" v-if="userInfo">
              <span class="user-avatar">👤</span>
              <span class="user-name">{{ userInfo.name || userInfo.username }}</span>
              <span class="user-role-badge">{{ getUserRoleName(userInfo.role) }}</span>
              
              <!-- 用户菜单 -->
              <transition name="fade">
                <div v-if="showUserMenu" class="user-menu" @click.stop>
                  <div class="menu-item" @click="handleChangePassword">
                    <span class="menu-icon">🔒</span>
                    <span>修改密码</span>
                  </div>
                  <div class="menu-divider"></div>
                  <div class="menu-item logout" @click="handleLogout">
                    <span class="menu-icon">🚪</span>
                    <span>退出登录</span>
                  </div>
                </div>
              </transition>
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
                    @time-range-change="handleTimeRangeChange"
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
                <div class="module-container flow-analysis">
                  <dv-border-box-12>
                    <ChannelFlowAnalysis :timeRange="selectedTimeRange" />
                  </dv-border-box-12>
                </div>
                <!-- 访客预约分类（饼图 + 3D词云） -->
                <div class="module-container anomaly-monitor">
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
            <span class="title-text">预约进出场提醒</span>
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
            <div class="tab" :class="{ active: currentAlertTab === 'pending' }" @click="switchAlertTab('pending')">
              <span>未确认 ({{ reservationAlerts.length }})</span>
            </div>
            <div class="tab" :class="{ active: currentAlertTab === 'history' }" @click="switchAlertTab('history')">
              <span>历史记录 ({{ reservationAlertsHistory.length }})</span>
            </div>
            <div class="tab" :class="{ active: currentAlertTab === 'focus' }" @click="switchAlertTab('focus')">
              <span>👁️ 关注管理 ({{ focusPendingCount }})</span>
            </div>
          </div>
          
          <!-- 未确认提醒列表 -->
          <div v-if="currentAlertTab === 'pending'" class="alert-list">
            <!-- 类型筛选器 -->
            <div class="alert-filter">
              <button class="filter-btn" :class="{ active: pendingFilter === 'all' }" @click="pendingFilter = 'all'">
                全部 ({{ reservationAlerts.length }})
              </button>
              <button class="filter-btn" :class="{ active: pendingFilter === 'vehicle' }" @click="pendingFilter = 'vehicle'">
                🚗 车辆 ({{ filteredPendingVehicles.length }})
              </button>
              <button class="filter-btn" :class="{ active: pendingFilter === 'person' }" @click="pendingFilter = 'person'">
                👤 人脸 ({{ filteredPendingPersons.length }})
              </button>
            </div>
            
            <div v-if="filteredPendingAlerts.length === 0" class="empty-history">
              <span class="empty-icon">🔔</span>
              <p>暂无未确认提醒</p>
            </div>
          <div v-for="(alert, index) in filteredPendingAlerts" 
               :key="alert.timestamp + '_' + index" 
               class="alert-item-compact"
               :class="{ 'expanded': alert.isExpanded }">
            
            <!-- 紧凑的一行显示 -->
            <div class="compact-row" @click="toggleAlertExpand(alert)">
              <div class="main-info">
                <!-- 类型图标 -->
                <span class="type-badge" :class="alert.type">
                  {{ alert.type === 'vehicle' ? '🚗' : (alert.type === 'night_student' ? '🌙' : '👤') }}
                </span>
                <!-- 车牌号或人名 -->
                <span v-if="alert.type === 'vehicle'"
                      class="plate-number"
                      :class="getPlateType(alert.plateNumber, alert)">
                  {{ alert.plateNumber || '未知车牌' }}
                </span>
                <span v-else-if="alert.type === 'night_student'" class="person-name night-student">
                  {{ alert.personName || '未知学生' }}
                </span>
                <span v-else class="person-name">
                  {{ alert.visitorName || '未知访客' }}
                </span>
                <!-- 通道名称 -->
                <span class="channel-name">{{ alert.channelName || alert.channel || '未知通道' }}</span>
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
                <div class="photo-wrapper" @click="previewImage(alert.imageUrl || alert.photoUrl)">
                  <img v-if="alert.imageUrl || alert.photoUrl"
                       :src="alert.imageUrl || alert.photoUrl"
                       :alt="alert.type === 'vehicle' ? '进场照片' : (alert.type === 'night_student' ? '学生照片' : '人脸照片')"
                       @error="handleImageError">
                  <div v-else class="no-photo">
                    <span>📷</span>
                    <span>暂无照片</span>
                  </div>
                </div>
              </div>

              <!-- 详细信息 -->
              <div class="info-grid">
                <!-- 夜间学生提醒信息 -->
                <div class="info-block" v-if="alert.type === 'night_student'">
                  <div class="block-title">🌙 夜间出校信息</div>
                  <div class="info-row">
                    <span class="label">学生姓名：</span>
                    <span class="value">{{ alert.personName || '未知' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">性别：</span>
                    <span class="value">{{ alert.gender || '未知' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">学院：</span>
                    <span class="value">{{ alert.college || '未知' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">出口通道：</span>
                    <span class="value">{{ alert.channelName || '未知' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">出校时间：</span>
                    <span class="value">{{ alert.eventTime || '未知' }}</span>
                  </div>
                </div>

                <!-- 预约信息 -->
                <div class="info-block" v-else>
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
                  <div class="info-row" v-if="alert.vipType">
                    <span class="label">VIP类型：</span>
                    <span class="value vip-type">{{ alert.vipType }}</span>
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
          <div v-if="currentAlertTab === 'history'" class="alert-list history-list">
            <!-- 类型筛选器 -->
            <div class="alert-filter">
              <button class="filter-btn" :class="{ active: historyFilter === 'all' }" @click="historyFilter = 'all'">
                全部 ({{ reservationAlertsHistory.length }})
              </button>
              <button class="filter-btn" :class="{ active: historyFilter === 'vehicle' }" @click="historyFilter = 'vehicle'">
                🚗 车辆 ({{ filteredHistoryVehicles.length }})
              </button>
              <button class="filter-btn" :class="{ active: historyFilter === 'person' }" @click="historyFilter = 'person'">
                👤 人脸 ({{ filteredHistoryPersons.length }})
              </button>
            </div>
            
            <div v-if="filteredHistoryAlerts.length === 0" class="empty-history">
              <span class="empty-icon">📭</span>
              <p>暂无历史记录</p>
            </div>
            <div v-for="(alert, index) in filteredHistoryAlerts" 
                 :key="alert.timestamp + '_history_' + index" 
                 class="alert-item-compact history-item"
                 :class="{ 'expanded': alert.isExpanded }">
              
              <!-- 紧凑的一行显示 -->
              <div class="compact-row" @click="toggleHistoryAlertExpand(alert)">
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
                    <div class="info-row" v-if="alert.vipType">
                      <span class="label">VIP类型：</span>
                      <span class="value vip-type">{{ alert.vipType }}</span>
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
          
          <!-- 关注管理内容 -->
          <div v-if="currentAlertTab === 'focus'" class="focus-management-content">
            <FocusTrackingPanel 
              :isEmbedded="true"
              @update-count="updateFocusPendingCount" />
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
    
    <!-- 添加关注对象表单弹窗 -->
    <AddWatchForm
      v-if="showAddWatchForm"
      @close="showAddWatchForm = false"
    />

    <!-- 🌙 夜间学生出校提醒面板 -->
    <NightAlertPanel
      v-if="showNightAlertPanel"
      :viewMode="nightAlertViewMode"
      @close="showNightAlertPanel = false"
      @update-count="nightAlertUnreadCount = $event"
    />

    <!-- 🌙 夜间学生出校提醒列表小弹窗 -->
    <transition name="modal-fade">
      <div v-if="showNightAlertList" class="night-alert-list-popup">
        <!-- 头部 -->
        <div class="night-alert-header">
          <div class="header-left">
            <span class="header-icon">🌙</span>
            <span class="header-title">夜间学生出校提醒</span>
            <span class="alert-count" v-if="nightAlertUnreadCount > 0">{{ nightAlertUnreadCount }}</span>
          </div>
          <div class="header-actions">
            <button class="btn-action" @click="openNightAlertConfig" title="设置">
              <span>⚙️</span>
            </button>
            <button class="btn-action" @click="openNightAlertStats" title="统计">
              <span>📊</span>
            </button>
            <button class="btn-close" @click="closeNightAlertList">×</button>
          </div>
        </div>

        <!-- Tab切换 -->
        <div class="night-alert-tabs">
          <div class="tab" :class="{ active: currentNightAlertTab === 'pending' }" @click="switchNightAlertTab('pending')">
            <span>未确认 ({{ nightAlertUnreadCount }})</span>
          </div>
          <div class="tab" :class="{ active: currentNightAlertTab === 'history' }" @click="switchNightAlertTab('history')">
            <span>历史记录 ({{ nightAlertsHistory.length }})</span>
          </div>
        </div>

        <!-- 筛选栏 -->
        <div class="night-alert-filters">
          <div class="filter-item search-filter">
            <label>通道</label>
            <div class="searchable-select" :class="{ open: nightChannelSelectOpen }">
              <div class="select-trigger" @click="toggleNightChannelSelect">
                <input
                  type="text"
                  v-model="activeNightChannelInput"
                  @focus="openNightChannelSelect"
                  @blur="closeNightChannelSelect"
                  @input="filterNightChannelOptions"
                  placeholder="全部通道"
                  class="filter-input"
                />
                <span v-if="activeNightFilterChannel" class="select-clear" @mousedown.prevent="clearNightChannel" title="清空通道">×</span>
                <span v-else class="select-arrow">&#9662;</span>
              </div>
              <div v-show="nightChannelSelectOpen" class="select-dropdown">
                <div class="select-option default-option" :class="{ selected: !activeNightFilterChannel }" @mousedown.prevent="selectNightChannel('')">全部</div>
                <div
                  v-for="ch in filteredNightChannelOptions"
                  :key="ch"
                  class="select-option"
                  :class="{ selected: activeNightFilterChannel === ch }"
                  @mousedown.prevent="selectNightChannel(ch)"
                >
                  {{ ch }}
                </div>
                <div v-if="filteredNightChannelOptions.length === 0 && nightChannelOptions.length > 0" class="no-options">无匹配项</div>
              </div>
            </div>
          </div>
          <div class="filter-item">
            <label>性别</label>
            <select v-model="activeNightFilterGender" class="filter-select">
              <option value="">全部</option>
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </div>
          <div class="filter-item search-filter">
            <label>学院</label>
            <div class="searchable-select" :class="{ open: nightCollegeSelectOpen }">
              <div class="select-trigger" @click="toggleNightCollegeSelect">
                <input
                  type="text"
                  v-model="activeNightCollegeInput"
                  @focus="openNightCollegeSelect"
                  @blur="closeNightCollegeSelect"
                  @input="filterNightCollegeOptions"
                  placeholder="全部学院"
                  class="filter-input"
                />
                <span v-if="activeNightFilterCollege" class="select-clear" @mousedown.prevent="clearNightCollege" title="清空学院">×</span>
                <span v-else class="select-arrow">&#9662;</span>
              </div>
              <div v-show="nightCollegeSelectOpen" class="select-dropdown">
                <div class="select-option default-option" :class="{ selected: !activeNightFilterCollege }" @mousedown.prevent="selectNightCollege('')">全部</div>
                <div
                  v-for="c in filteredNightCollegeOptions"
                  :key="c"
                  class="select-option"
                  :class="{ selected: activeNightFilterCollege === c }"
                  @mousedown.prevent="selectNightCollege(c)"
                >
                  {{ c }}
                </div>
                <div v-if="filteredNightCollegeOptions.length === 0 && nightCollegeOptions.length > 0" class="no-options">无匹配项</div>
              </div>
            </div>
          </div>
          <button class="btn-query" @click="queryNightAlerts">查询</button>
          <button v-if="hasActiveNightFilters" class="btn-clear-filter" @click="clearNightFilters" title="清除筛选">
            <span>重置</span>
          </button>
        </div>

        <!-- 提醒列表 -->
        <div class="night-alert-list" v-if="currentNightAlertTab === 'pending'">
          <div v-if="nightAlerts.length === 0" class="empty-state">
            <span class="empty-icon">📭</span>
            <p>暂无未确认记录</p>
          </div>
          <div
            v-else
            v-for="alert in nightAlerts"
            :key="alert.id"
            class="night-alert-item"
            :class="{ unread: !alert.isRead, expanded: nightAlertExpandedId === alert.id }"
            @click="toggleNightAlertExpand(alert.id)"
          >
            <!-- 折叠状态 -->
            <div class="item-compact" v-if="nightAlertExpandedId !== alert.id">
              <span class="item-icon">🌙</span>
              <span class="person-name">{{ alert.personName }}</span>
              <span class="college">{{ alert.college }}</span>
              <span class="channel">{{ alert.channelName }}</span>
              <span class="time">{{ formatNightAlertTime(alert.eventTime) }}</span>
              <span class="expand-icon">▼</span>
            </div>
            <!-- 展开状态 -->
            <div class="item-expanded" v-else>
              <div class="item-main">
                <div class="item-photo face-capture">
                  <img v-if="alert.faceCaptureUrl || alert.photoUrl" :src="alert.faceCaptureUrl || alert.photoUrl" alt="人脸抓拍" />
                  <div v-else class="photo-placeholder">
                    <span>{{ alert.personName?.charAt(0) || '?' }}</span>
                  </div>
                  <span v-if="alert.faceCaptureUrl" class="photo-tag">抓拍</span>
                </div>
                <div class="item-info">
                  <div class="info-row info-name">
                    <span class="label"><span class="label-icon">👤</span>姓名</span>
                    <span class="value">{{ alert.personName }}</span>
                  </div>
                  <div class="info-row info-gender">
                    <span class="label"><span class="label-icon">⚥</span>性别</span>
                    <span class="value">{{ alert.gender }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label"><span class="label-icon">🏛️</span>学院</span>
                    <span class="value">{{ alert.college }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label"><span class="label-icon">🚪</span>通道</span>
                    <span class="value">{{ alert.channelName }}</span>
                  </div>
                  <div class="info-row info-time">
                    <span class="label"><span class="label-icon">🕐</span>时间</span>
                    <span class="value">{{ formatNightAlertDateTime(alert.eventTime) }}</span>
                  </div>
                </div>
              </div>
              <div class="item-actions">
                <button class="btn-confirm" @click.stop="confirmNightAlert(alert.id)">
                  ✓ 确认
                </button>
                <button class="btn-confirm-all" @click.stop="confirmAllNightAlerts">
                  全部已读
                </button>
              </div>
              <span class="collapse-icon" @click.stop="nightAlertExpandedId = null">▲</span>
            </div>
          </div>
        </div>

        <!-- 历史记录列表 -->
        <div class="night-alert-list" v-if="currentNightAlertTab === 'history'">
          <div v-if="nightAlertsHistory.length === 0" class="empty-state">
            <span class="empty-icon">📭</span>
            <p>暂无历史记录</p>
          </div>
          <div
            v-else
            v-for="alert in nightAlertsHistory"
            :key="alert.id"
            class="night-alert-item history"
            :class="{ expanded: nightAlertExpandedId === alert.id }"
            @click="toggleNightAlertExpand(alert.id)"
          >
            <div class="item-compact">
              <span class="item-icon">🌙</span>
              <span class="person-name">{{ alert.personName }}</span>
              <span class="college">{{ alert.college }}</span>
              <span class="channel">{{ alert.channelName }}</span>
              <span class="time">{{ formatNightAlertTime(alert.eventTime) }}</span>
              <span class="status-badge read">已读</span>
              <span class="expand-icon">▼</span>
            </div>
            <div v-if="nightAlertExpandedId === alert.id" class="item-expanded">
              <div class="item-main">
                <div class="item-photo face-capture">
                  <img v-if="alert.faceCaptureUrl || alert.photoUrl" :src="alert.faceCaptureUrl || alert.photoUrl" alt="人脸抓拍" />
                  <div v-else class="photo-placeholder">{{ alert.personName?.charAt(0) || '?' }}</div>
                  <span v-if="alert.faceCaptureUrl" class="photo-tag">抓拍</span>
                </div>
                <div class="item-info">
                  <div class="info-row">
                    <span class="label">姓名</span>
                    <span class="value">{{ alert.personName }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">学院</span>
                    <span class="value">{{ alert.college }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">性别</span>
                    <span class="value">{{ alert.gender }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">通道</span>
                    <span class="value">{{ alert.channelName }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">时间</span>
                    <span class="value">{{ formatNightAlertDateTime(alert.eventTime) }}</span>
                  </div>
                </div>
              </div>
              <span class="collapse-icon" @click.stop="toggleNightAlertExpand(alert.id)">▲</span>
            </div>
          </div>
        </div>

        <!-- 底部 -->
        <div class="night-alert-footer" v-if="currentNightAlertTab === 'pending' && nightAlerts.length > 0">
          <span class="record-count">共 {{ nightAlerts.length }} 条记录</span>
          <button class="btn-confirm-all-bottom" @click="confirmAllNightAlerts">全部已读</button>
        </div>
      </div>
    </transition>

    <!-- 修改密码弹窗 -->
    <transition name="fade">
      <div v-if="showPasswordModal" class="modal-overlay" @click="closePasswordModal">
        <div class="modal-content password-modal" @click.stop>
          <div class="modal-header">
            <h3>修改密码</h3>
            <button class="close-btn" @click="closePasswordModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>旧密码</label>
              <div class="password-input-wrapper">
                <input
                  :type="showOldPassword ? 'text' : 'password'"
                  v-model="passwordForm.oldPassword"
                  placeholder="请输入旧密码"
                  @blur="validateOldPassword"
                  :class="{ 'error': passwordErrors.oldPassword }"
                />
                <button 
                  type="button"
                  class="toggle-password-btn" 
                  @click="showOldPassword = !showOldPassword"
                  :title="showOldPassword ? '隐藏密码' : '显示密码'"
                >
                  <span v-if="showOldPassword">👁️</span>
                  <span v-else>👁️‍🗨️</span>
                </button>
              </div>
              <span v-if="passwordErrors.oldPassword" class="error-text">{{ passwordErrors.oldPassword }}</span>
            </div>
            <div class="form-group">
              <label>新密码</label>
              <div class="password-input-wrapper">
                <input
                  :type="showNewPassword ? 'text' : 'password'"
                  v-model="passwordForm.newPassword"
                  placeholder="至少6个字符"
                  @blur="validateNewPassword"
                  :class="{ 'error': passwordErrors.newPassword }"
                />
                <button 
                  type="button"
                  class="toggle-password-btn" 
                  @click="showNewPassword = !showNewPassword"
                  :title="showNewPassword ? '隐藏密码' : '显示密码'"
                >
                  <span v-if="showNewPassword">👁️</span>
                  <span v-else>👁️‍🗨️</span>
                </button>
              </div>
              <span v-if="passwordErrors.newPassword" class="error-text">{{ passwordErrors.newPassword }}</span>
            </div>
            <div class="form-group">
              <label>确认密码</label>
              <div class="password-input-wrapper">
                <input
                  :type="showConfirmPassword ? 'text' : 'password'"
                  v-model="passwordForm.confirmPassword"
                  placeholder="再次输入新密码"
                  @blur="validateConfirmPassword"
                  :class="{ 'error': passwordErrors.confirmPassword }"
                />
                <button 
                  type="button"
                  class="toggle-password-btn" 
                  @click="showConfirmPassword = !showConfirmPassword"
                  :title="showConfirmPassword ? '隐藏密码' : '显示密码'"
                >
                  <span v-if="showConfirmPassword">👁️</span>
                  <span v-else>👁️‍🗨️</span>
                </button>
              </div>
              <span v-if="passwordErrors.confirmPassword" class="error-text">{{ passwordErrors.confirmPassword }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-success" @click="submitPasswordChange" :disabled="isPasswordSubmitting">
              {{ isPasswordSubmitting ? '提交中...' : '确认修改' }}
            </button>
            <button class="btn btn-cancel" @click="closePasswordModal">取消</button>
          </div>
        </div>
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
import FocusTrackingPanel from "@/components/FocusTrackingPanel.vue";
import AddWatchForm from "@/components/AddWatchForm.vue";
import NightAlertPanel from "@/components/NightAlertPanel.vue";
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
import { getUserInfo, clearAuth } from "@/utils/auth";
import { logoutAPI, changePasswordAPI, verifyOldPasswordAPI } from "@/services/authService";
import { focusAlertService } from "@/services/focusAlertService";
import nightAlertService from "@/services/nightAlertService";

export default {
  data() {
    return {
      loading: true,
      
      // 用户信息
      userInfo: null,
      showUserMenu: false,

      // 修改密码弹窗
      showPasswordModal: false,
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      passwordErrors: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      isPasswordSubmitting: false,
      // 控制密码显示/隐藏
      showOldPassword: false,
      showNewPassword: false,
      showConfirmPassword: false,
      
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
      currentAlertTab: 'pending',    // 当前Tab: pending-未确认, history-历史记录, focus-关注管理
      pendingFilter: 'all',          // 未确认提醒筛选: all-全部, vehicle-车辆, person-人脸
      historyFilter: 'all',          // 历史记录筛选: all-全部, vehicle-车辆, person-人脸
      focusPendingCount: 0,          // 关注对象的未确认提醒数量
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
      audioContext: null,
      
      // 添加关注表单
      showAddWatchForm: false,

      // 🌙 夜间学生出校提醒相关
      showNightAlertPanel: false,       // 控制统计/配置全屏弹窗
      showNightAlertList: false,         // 控制列表小弹窗
      nightAlertUnreadCount: 0,          // 未读计数
      nightAlerts: [],                   // 夜间提醒列表（筛选后）
      nightAlertsAllRecords: [],         // 所有原始记录
      nightAlertsHistory: [],            // 历史记录
      currentNightAlertTab: 'pending',   // 当前Tab: pending/history
      nightAlertFilter: 'all',            // 筛选: all/male/female
      nightAlertViewMode: 'stats',       // stats-统计面板 / config-配置面板

      // 夜间提醒筛选条件 - 分离未确认和历史记录
      pendingFilters: {
        channel: '',
        gender: '',
        college: ''
      },
      historyFilters: {
        channel: '',
        gender: '',
        college: ''
      },
      nightStartDate: '',
      nightEndDate: '',
      nightChannelOptions: [],
      nightCollegeOptions: [],
      nightAlertExpandedId: null,         // 当前展开的提醒ID

      // 夜间提醒可搜索下拉 - 分离未确认和历史记录
      pendingChannelInput: '',
      pendingCollegeInput: '',
      nightChannelSelectOpen: false,
      filteredNightChannelOptions: [],
      nightCollegeSelectOpen: false,
      filteredNightCollegeOptions: [],
      historyChannelInput: '',
      historyCollegeInput: '',
    };
  },
  components: {
    VisitorVipStackedChart,
    ChannelFlowPieChart,
    ChannelComparisonLineChart,
    ChannelUtilizationChart,
    ModalChannelPieChart,
    VisitorVipAnalysisModal,
    FocusTrackingPanel,
    AddWatchForm,
    NightAlertPanel,
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
    },
    
    // 未确认提醒 - 车辆列表
    filteredPendingVehicles() {
      return this.reservationAlerts.filter(alert => alert.type === 'vehicle');
    },
    
    // 未确认提醒 - 人脸列表
    filteredPendingPersons() {
      return this.reservationAlerts.filter(alert => alert.type === 'person');
    },
    
    // 未确认提醒 - 根据筛选器过滤
    filteredPendingAlerts() {
      if (this.pendingFilter === 'vehicle') {
        return this.filteredPendingVehicles;
      } else if (this.pendingFilter === 'person') {
        return this.filteredPendingPersons;
      }
      return this.reservationAlerts;
    },
    
    // 历史记录 - 车辆列表
    filteredHistoryVehicles() {
      return this.reservationAlertsHistory.filter(alert => alert.type === 'vehicle');
    },
    
    // 历史记录 - 人脸列表
    filteredHistoryPersons() {
      return this.reservationAlertsHistory.filter(alert => alert.type === 'person');
    },
    
    // 历史记录 - 根据筛选器过滤
    filteredHistoryAlerts() {
      if (this.historyFilter === 'vehicle') {
        return this.filteredHistoryVehicles;
      } else if (this.historyFilter === 'person') {
        return this.filteredHistoryPersons;
      }
      return this.reservationAlertsHistory;
    },

    // 夜间提醒 - 当前Tab激活的筛选条件
    activeNightFilterChannel: {
      get() {
        return this.currentNightAlertTab === 'pending' ? this.pendingFilters.channel : this.historyFilters.channel;
      },
      set(value) {
        if (this.currentNightAlertTab === 'pending') {
          this.pendingFilters.channel = value;
        } else {
          this.historyFilters.channel = value;
        }
      }
    },
    activeNightFilterGender: {
      get() {
        return this.currentNightAlertTab === 'pending' ? this.pendingFilters.gender : this.historyFilters.gender;
      },
      set(value) {
        if (this.currentNightAlertTab === 'pending') {
          this.pendingFilters.gender = value;
        } else {
          this.historyFilters.gender = value;
        }
      }
    },
    activeNightFilterCollege: {
      get() {
        return this.currentNightAlertTab === 'pending' ? this.pendingFilters.college : this.historyFilters.college;
      },
      set(value) {
        if (this.currentNightAlertTab === 'pending') {
          this.pendingFilters.college = value;
        } else {
          this.historyFilters.college = value;
        }
      }
    },
    activeNightChannelInput: {
      get() {
        return this.currentNightAlertTab === 'pending' ? this.pendingChannelInput : this.historyChannelInput;
      },
      set(value) {
        if (this.currentNightAlertTab === 'pending') {
          this.pendingChannelInput = value;
        } else {
          this.historyChannelInput = value;
        }
      }
    },
    activeNightCollegeInput: {
      get() {
        return this.currentNightAlertTab === 'pending' ? this.pendingCollegeInput : this.historyCollegeInput;
      },
      set(value) {
        if (this.currentNightAlertTab === 'pending') {
          this.pendingCollegeInput = value;
        } else {
          this.historyCollegeInput = value;
        }
      }
    },
    // 判断当前Tab是否有激活的筛选条件
    hasActiveNightFilters() {
      const filters = this.currentNightAlertTab === 'pending' ? this.pendingFilters : this.historyFilters;
      return !!(filters.channel || filters.gender || filters.college);
    }
  },
  mounted() {
    // 加载用户信息
    this.loadUserInfo();

    // 原有初始化
    this.initData();
    this.startDataRefresh();
    this.startTimeUpdate();

    // 🌙 从本地存储恢复夜间提醒未读数（优先恢复，防止WebSocket消息覆盖）
    this.loadNightAlertUnreadCountFromLocalStorage();

    // 🌙 从本地存储恢复夜间提醒数据
    this.loadNightAlertsFromLocalStorage();

    // 🌙 从API获取夜间提醒未读数（确保badge显示最新值）
    this.loadNightAlertUnreadCountFromAPI();

    // 🔔 新增：从数据库加载提醒数据
    this.loadAlertsFromDatabase();

    // 🔔 新增：初始化WebSocket
    this.initWebSocket();

    // 🔔 新增：初始化音频上下文（用户交互后）
    this.initAudioContext();

    // 点击外部关闭用户菜单
    document.addEventListener('click', this.closeUserMenu);
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
    
    // 移除事件监听
    document.removeEventListener('click', this.closeUserMenu);
  },
  methods: {
    // === 用户认证相关方法 ===
    // 加载用户信息
    loadUserInfo() {
      this.userInfo = getUserInfo();
      if (this.userInfo) {
        console.log('✅ 用户信息已加载:', this.userInfo.username);
      }
    },
    
    // 切换用户菜单
    toggleUserMenu() {
      this.showUserMenu = !this.showUserMenu;
    },
    
    // 关闭用户菜单
    closeUserMenu() {
      this.showUserMenu = false;
    },
    
    // 获取角色名称
    getUserRoleName(role) {
      const roleMap = {
        'admin': '管理员',
        'super_admin': '超级管理员',
        'user': '用户',
        'guest': '访客'
      };
      return roleMap[role] || '用户';
    },
    
    // 个人信息
    handleUserProfile() {
      this.showUserMenu = false;
      this.showPasswordModal = true;
    },

    // 修改密码
    handleChangePassword() {
      this.showUserMenu = false;
      this.showPasswordModal = true;
    },

    // 关闭修改密码弹窗
    closePasswordModal() {
      this.showPasswordModal = false;
      this.passwordForm = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      this.passwordErrors = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      };
      // 重置密码显示状态
      this.showOldPassword = false;
      this.showNewPassword = false;
      this.showConfirmPassword = false;
    },

    // 验证旧密码
    async validateOldPassword() {
      if (!this.passwordForm.oldPassword) {
        this.passwordErrors.oldPassword = '请输入旧密码';
        return false;
      }
      
      // 实时验证旧密码是否正确
      try {
        await verifyOldPasswordAPI(this.passwordForm.oldPassword);
        this.passwordErrors.oldPassword = '';
        return true;
      } catch (error) {
        this.passwordErrors.oldPassword = error.message || '旧密码错误';
        return false;
      }
    },

    // 验证新密码
    validateNewPassword() {
      if (!this.passwordForm.newPassword) {
        this.passwordErrors.newPassword = '请输入新密码';
        return false;
      }
      if (this.passwordForm.newPassword.length < 6) {
        this.passwordErrors.newPassword = '新密码至少6个字符';
        return false;
      }
      this.passwordErrors.newPassword = '';
      return true;
    },

    // 验证确认密码
    validateConfirmPassword() {
      if (!this.passwordForm.confirmPassword) {
        this.passwordErrors.confirmPassword = '请再次输入新密码';
        return false;
      }
      if (this.passwordForm.confirmPassword !== this.passwordForm.newPassword) {
        this.passwordErrors.confirmPassword = '两次密码输入不一致';
        return false;
      }
      this.passwordErrors.confirmPassword = '';
      return true;
    },

    // 提交密码修改
    async submitPasswordChange() {
      const v1 = await this.validateOldPassword();
      const v2 = this.validateNewPassword();
      const v3 = this.validateConfirmPassword();

      if (!v1 || !v2 || !v3) {
        return;
      }

      // 使用 Element UI 的 MessageBox 确认
      try {
        await this.$confirm('确定要修改密码吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning',
          customClass: 'password-confirm-dialog',
          zIndex: 10000  // 设置更高的z-index，确保在密码弹窗之上
        });
      } catch {
        return; // 用户取消
      }

      this.isPasswordSubmitting = true;
      try {
        await changePasswordAPI({
          oldPassword: this.passwordForm.oldPassword,
          newPassword: this.passwordForm.newPassword
        });

        // 先关闭弹窗再显示消息
        this.closePasswordModal();
        this.$message.success('密码修改成功，请重新登录');
        this.handleLogout();
      } catch (error) {
        console.error('修改密码失败:', error);
        // 优先使用后端返回的 msg 字段
        let errorMsg = error.message;
        if (!errorMsg && error.response?.data) {
          errorMsg = error.response.data.msg || error.response.data.message || '修改密码失败，请稍后重试';
        }
        if (!errorMsg) {
          errorMsg = '修改密码失败，请稍后重试';
        }
        this.$message.error(errorMsg);
      } finally {
        this.isPasswordSubmitting = false;
      }
    },
    
    // 退出登录
    async handleLogout() {
      this.showUserMenu = false;

      try {
        await this.$confirm('确定要退出登录吗？', '提示', {
          confirmButtonText: '确定',
          cancelButtonText: '取消',
          type: 'warning'
        });
      } catch {
        return; // 用户取消
      }

      try {
        // 调用登出API
        await logoutAPI();
        
        // 清除本地认证信息
        clearAuth();
        
        console.log('✅ 已退出登录');
        
        // 跳转到登录页
        this.$router.push('/login');
      } catch (error) {
        console.error('❌ 退出登录失败:', error);
        // 即使API失败，也清除本地信息并跳转
        clearAuth();
        this.$router.push('/login');
      }
    },
    
    // 处理来自center组件的时间范围变化
    handleTimeRangeChange(timeRange) {
      // center组件的下拉选择器已经使用正确的格式 (today/week/month/year)
      // 直接赋值即可
      this.selectedTimeRange = timeRange;
      console.log('接收到center组件时间范围变化:', timeRange);
      // 刷新数据
      this.refreshDataByTimeRange();
    },
    
    // 时间范围变化处理（保留用于其他可能的调用）
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
        // const wsUrl = `${protocol}//localhost:8675/websocket/vehicle`;
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
              // 🔍 调试图片字段
              console.log('🖼️ [预约提醒] 图片字段检查:', {
                type: data.type,
                plateNumber: data.plateNumber,
                imageUrl: data.imageUrl,
                hasImage: !!data.imageUrl,
                imageUrlLength: data.imageUrl ? data.imageUrl.length : 0,
                allKeys: Object.keys(data)
              });
              this.handleReservationAlert(data);
            }
            
            // 🔔 处理关注提醒
            if (data.type === 'focusAlert') {
              console.log('🔔 [关注提醒] 收到提醒:', {
                alertType: data.alertType,
                eventType: data.eventType,
                watchValue: data.watchValue,
                channelName: data.channelName
              });
              this.handleFocusAlert(data);
            }

            // 🌙 处理夜间学生出校提醒 - 添加到夜间提醒列表
            if (data.type === 'nightStudentAlert') {
              console.log('🌙 [夜间提醒] 收到提醒:', data);
              const alert = {
                id: data.id,
                type: 'night_student',
                personName: data.personName || '未知学生',
                gender: data.gender || '',
                college: data.college || '',
                channelName: data.channelName || '未知通道',
                eventTime: data.eventTime,
                photoUrl: data.photoUrl || '',
                faceCaptureUrl: data.faceCaptureUrl || '',
                timestamp: Date.now(),
                isRead: false
              };
              // 添加到列表
              this.nightAlerts.unshift(alert);
              this.nightAlertsAllRecords.unshift(alert);
              this.nightAlertUnreadCount++;
              this.saveNightAlertUnreadCountToLocalStorage();
              this.playSoundAlert({ type: 'night_student' });
              console.log('🌙 [夜间提醒] 添加成功，当前未读:', this.nightAlertUnreadCount);
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
      console.log('🖼️ [handleReservationAlert] 收到的alert对象:', {
        type: alert.type,
        plateNumber: alert.plateNumber,
        visitorName: alert.visitorName,
        imageUrl: alert.imageUrl,
        hasImage: !!alert.imageUrl
      });
      
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
     * 处理关注提醒
     */
    handleFocusAlert(data) {
      console.log('🔔 [关注提醒] 开始处理提醒:', data);
      
      // 转换为统一的提醒格式
      const alert = {
        type: data.alertType === 'vehicle' ? 'vehicle' : 'person',
        alertType: 'focus_alert',
        timestamp: data.timestamp || Date.now(),
        eventType: data.eventType, // entry 或 exit
        
        // 车辆信息
        plateNumber: data.alertType === 'vehicle' ? data.watchValue : null,
        
        // 人员信息（访客基本信息）
        personName: data.personName || null,
        idCard: data.alertType === 'person' ? data.watchValue : null,
        department: data.department || null,
        phoneNo: data.phoneNo || null,
        
        // 进出场信息
        channelName: data.channelName,
        eventTime: data.eventTime,
        photoUrl: data.photoUrl,
        
        // 预约信息
        reservation_person: data.reservationPerson,
        reservation_phone: data.reservationPhone,
        reservation_reason: data.reservationReason,
        reservation_time_range: data.reservationTimeRange,
        
        // 访客详细信息
        visitor_pass_name: data.visitorPassName,
        visitor_vip_type: data.visitorVipType,
        visitor_park_name: data.visitorParkName,
        visitor_reservation_time_range: data.visitorReservationTimeRange,
        
        // 备注
        remark: data.remark,
        
        // 提醒ID
        alertId: data.alertId,
        
        // UI状态
        isExpanded: false
      };
      
      console.log('✅ 转换后的提醒对象:', alert);
      console.log('📋 预约信息:', {
        person: alert.reservation_person,
        phone: alert.reservation_phone,
        reason: alert.reservation_reason,
        timeRange: alert.reservation_time_range
      });
      
      // 添加到队列
      this.reservationAlerts.unshift(alert);
      if (this.reservationAlerts.length > 1000) {
        this.reservationAlerts = this.reservationAlerts.slice(0, 1000);
      }
      
      // 保存到本地
      this.saveAlertsToLocalStorage();
      
      // 🔊 播放声音提醒
      this.playSoundAlert(alert);
      
      console.log('✅ 关注提醒处理完成');
    },

    /**
     * 🌙 判断事件是否属于"今天夜间"（昨晚22:00到今早06:00）
     * 夜间时间定义：22:00 - 06:00（次日）
     * 注意：eventTime 是 ISO 格式字符串，需要直接解析避免时区偏移
     */
    isTodayNightEvent(eventTime) {
      if (!eventTime) return false;

      // 直接解析日期时间字符串，避免时区偏移问题（兼容 T 和空格分隔）
      const match = eventTime.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
      if (!match) return false;

      const [, year, month, day, hour, minute, second] = match;
      const eventDate = new Date(parseInt(year), parseInt(month) - 1, parseInt(day), parseInt(hour), parseInt(minute), parseInt(second));

      const now = new Date();
      const currentHour = now.getHours();

      // 计算昨天的日期（用于夜间的开始）
      const yesterday = new Date(now);
      yesterday.setDate(yesterday.getDate() - 1);

      // 今天夜间的开始：昨晚22:00
      const nightStart = new Date(yesterday);
      nightStart.setHours(22, 0, 0, 0);

      // 今天夜间的结束：今早06:00
      const nightEnd = new Date(now);
      nightEnd.setHours(6, 0, 0, 0);

      // 如果当前时间是22:00之后，今晚的夜间的开始是今天22:00，结束是明天06:00
      if (currentHour >= 22) {
        nightStart.setDate(now.getDate());
        nightStart.setHours(22, 0, 0, 0);
        nightEnd.setDate(now.getDate() + 1);
        nightEnd.setHours(6, 0, 0, 0);
      }

      return eventDate >= nightStart && eventDate <= nightEnd;
    },

    // ==================== 🌙 夜间学生出校提醒相关方法 ====================

    /**
     * 🌙 切换夜间提醒列表弹窗
     */
    toggleNightAlertList() {
      console.log('🌙 toggleNightAlertList 被点击, 当前showNightAlertList=', this.showNightAlertList);
      if (this.showNightAlertList) {
        this.showNightAlertList = false;
        console.log('🌙 关闭小弹窗');
      } else {
        this.showNightAlertPanel = false;
        this.showNightAlertList = true;
        this.currentNightAlertTab = 'pending';
        console.log('🌙 打开小弹窗, showNightAlertList=', this.showNightAlertList);
        this.loadNightAlertRecords();
        this.loadNightAlertFilters();
      }
    },

    /**
     * 🌙 关闭夜间提醒列表弹窗
     */
    closeNightAlertList() {
      this.showNightAlertList = false;
    },

    /**
     * 🌙 打开统计全屏弹窗
     */
    openNightAlertStats() {
      this.showNightAlertList = false;
      this.showNightAlertPanel = true;
      this.nightAlertViewMode = 'stats';
    },

    /**
     * 🌙 打开配置面板
     */
    openNightAlertConfig() {
      this.showNightAlertList = false;
      this.showNightAlertPanel = true;
      this.nightAlertViewMode = 'config';
    },

    /**
     * 🌙 关闭所有夜间提醒弹窗
     */
    closeNightAlertAll() {
      this.showNightAlertList = false;
      this.showNightAlertPanel = false;
    },

    /**
     * 🌙 切换Tab
     */
    switchNightAlertTab(tab) {
      this.currentNightAlertTab = tab;
      this.nightAlertExpandedId = null;
    },

    /**
     * 🌙 展开/收起提醒
     */
    toggleNightAlertExpand(alertId) {
      if (this.nightAlertExpandedId === alertId) {
        this.nightAlertExpandedId = null;
      } else {
        this.nightAlertExpandedId = alertId;
      }
    },

    /**
     * 🌙 加载夜间提醒记录（未确认和历史记录分别独立查询）
     */
    async loadNightAlertRecords() {
      try {
        const pendingParams = { pageNum: 1, pageSize: 200 };
        if (this.pendingFilters.channel) pendingParams.channelName = this.pendingFilters.channel;
        if (this.pendingFilters.gender) pendingParams.gender = this.pendingFilters.gender;
        if (this.pendingFilters.college) pendingParams.college = this.pendingFilters.college;

        const historyParams = { pageNum: 1, pageSize: 200 };
        if (this.historyFilters.channel) historyParams.channelName = this.historyFilters.channel;
        if (this.historyFilters.gender) historyParams.gender = this.historyFilters.gender;
        if (this.historyFilters.college) historyParams.college = this.historyFilters.college;

        const [pendingRes, historyRes] = await Promise.all([
          nightAlertService.getRecords(pendingParams),
          nightAlertService.getRecords(historyParams)
        ]);

        const pendingResult = pendingRes.data;
        if (pendingResult.code === 200 || pendingResult.code === '0') {
          const records = ((pendingResult.data || {}).records || []).map(r => ({
            ...r,
            isRead: r.isRead === 1 || r.isRead === true
          }));
          this.nightAlerts = records.filter(r => !r.isRead);
          this.nightAlertUnreadCount = this.nightAlerts.length;
          this.saveNightAlertUnreadCountToLocalStorage();
        }

        const historyResult = historyRes.data;
        if (historyResult.code === 200 || historyResult.code === '0') {
          const records = ((historyResult.data || {}).records || []).map(r => ({
            ...r,
            isRead: r.isRead === 1 || r.isRead === true
          }));
          this.nightAlertsHistory = records.filter(r => r.isRead);
        }

        this.saveNightAlertsToLocalStorage();
        console.log('🌙 [夜间提醒] 记录加载成功, 未读:', this.nightAlerts.length, '已读:', this.nightAlertsHistory.length);
      } catch (error) {
        console.error('❌ [夜间提醒] 加载记录失败', error);
      }
    },

    /**
     * 🌙 加载筛选选项
     */
    async loadNightAlertFilters() {
      try {
        const [channelsRes, collegesRes] = await Promise.all([
          nightAlertService.getChannels(),
          nightAlertService.getColleges()
        ]);

        if (channelsRes.data.code === 200 || channelsRes.data.code === '0') {
          this.nightChannelOptions = channelsRes.data.data?.channels || [];
        }
        if (collegesRes.data.code === 200 || collegesRes.data.code === '0') {
          this.nightCollegeOptions = collegesRes.data.data?.colleges || [];
        }
      } catch (error) {
        console.error('❌ [夜间提醒] 加载筛选选项失败', error);
      }
    },

    /**
     * 🌙 查询按钮点击
     */
    queryNightAlerts() {
      this.loadNightAlertRecords();
    },

    /**
     * 🌙 清除筛选条件
     */
    clearNightFilters() {
      if (this.currentNightAlertTab === 'pending') {
        this.pendingFilters.channel = '';
        this.pendingFilters.gender = '';
        this.pendingFilters.college = '';
        this.pendingChannelInput = '';
        this.pendingCollegeInput = '';
      } else {
        this.historyFilters.channel = '';
        this.historyFilters.gender = '';
        this.historyFilters.college = '';
        this.historyChannelInput = '';
        this.historyCollegeInput = '';
      }
      this.loadNightAlertRecords();
    },

    clearNightChannel() {
      this.activeNightFilterChannel = '';
      this.activeNightChannelInput = '';
      this.nightChannelSelectOpen = false;
      this.loadNightAlertRecords();
    },

    clearNightCollege() {
      this.activeNightFilterCollege = '';
      this.activeNightCollegeInput = '';
      this.nightCollegeSelectOpen = false;
      this.loadNightAlertRecords();
    },

    toggleNightChannelSelect() {
      if (this.nightChannelSelectOpen) {
        this.nightChannelSelectOpen = false;
      } else {
        this.openNightChannelSelect();
      }
    },

    openNightChannelSelect() {
      this.nightChannelSelectOpen = true;
      this.filteredNightChannelOptions = [...this.nightChannelOptions];
    },

    closeNightChannelSelect() {
      setTimeout(() => {
        this.nightChannelSelectOpen = false;
      }, 200);
    },

    filterNightChannelOptions() {
      const keyword = this.activeNightChannelInput.toLowerCase();
      this.filteredNightChannelOptions = this.nightChannelOptions.filter(ch =>
        ch.toLowerCase().includes(keyword)
      );
    },

    selectNightChannel(ch) {
      this.activeNightFilterChannel = ch;
      this.activeNightChannelInput = ch;
      this.nightChannelSelectOpen = false;
    },

    toggleNightCollegeSelect() {
      if (this.nightCollegeSelectOpen) {
        this.nightCollegeSelectOpen = false;
      } else {
        this.openNightCollegeSelect();
      }
    },

    openNightCollegeSelect() {
      this.nightCollegeSelectOpen = true;
      this.filteredNightCollegeOptions = [...this.nightCollegeOptions];
    },

    closeNightCollegeSelect() {
      setTimeout(() => {
        this.nightCollegeSelectOpen = false;
      }, 200);
    },

    filterNightCollegeOptions() {
      const keyword = this.activeNightCollegeInput.toLowerCase();
      this.filteredNightCollegeOptions = this.nightCollegeOptions.filter(c =>
        c.toLowerCase().includes(keyword)
      );
    },

    selectNightCollege(c) {
      this.activeNightFilterCollege = c;
      this.activeNightCollegeInput = c;
      this.nightCollegeSelectOpen = false;
    },

    /**
     * 🌙 确认单条提醒
     */
    async confirmNightAlert(alertId) {
      try {
        await nightAlertService.markAsRead(alertId);
        const index = this.nightAlerts.findIndex(a => a.id === alertId);
        if (index !== -1) {
          const alert = this.nightAlerts[index];
          alert.isRead = true;
          // 移到历史记录
          this.nightAlertsHistory.unshift({
            ...alert,
            confirmedAt: new Date()
          });
          this.nightAlerts.splice(index, 1);
          this.nightAlertUnreadCount = Math.max(0, this.nightAlertUnreadCount - 1);
          this.saveNightAlertUnreadCountToLocalStorage();
          this.saveNightAlertsToLocalStorage();
        }
        this.nightAlertExpandedId = null;
        console.log('✅ [夜间提醒] 已确认:', alertId);
      } catch (error) {
        console.error('❌ [夜间提醒] 确认失败', error);
      }
    },

    /**
     * 🌙 全部标记已读
     */
    async confirmAllNightAlerts() {
      try {
        await nightAlertService.markAllAsRead();
        this.nightAlerts.forEach(alert => {
          alert.isRead = true;
          this.nightAlertsHistory.unshift({
            ...alert,
            confirmedAt: new Date()
          });
        });
        this.nightAlerts = [];
        this.nightAlertUnreadCount = 0;
        this.saveNightAlertUnreadCountToLocalStorage();
        this.saveNightAlertsToLocalStorage();
        this.nightAlertExpandedId = null;
        console.log('✅ [夜间提醒] 全部已读');
      } catch (error) {
        console.error('❌ [夜间提醒] 全部已读失败', error);
      }
    },

    /**
     * 🌙 格式化时间（只显示时间部分）
     */
    formatNightAlertTime(time) {
      if (!time) return '';
      const match = time.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
      if (match) {
        return `${match[4]}:${match[5]}:${match[6]}`;
      }
      return '';
    },

    /**
     * 🌙 格式化日期时间
     */
    formatNightAlertDateTime(time) {
      if (!time) return '';
      const match = time.match(/(\d{4})-(\d{2})-(\d{2})[T ](\d{2}):(\d{2}):(\d{2})/);
      if (match) {
        return `${parseInt(match[1])}-${match[2]}-${match[3]} ${match[4]}:${match[5]}:${match[6]}`;
      }
      return '';
    },

    /**
     * 🌙 处理夜间学生出校提醒
     */
    handleNightStudentAlert(data) {
      console.log('🌙 [夜间提醒] 收到提醒:', data);

      // 构造夜间提醒对象
      const alert = {
        id: data.id,
        type: 'night_student',
        alertType: 'night_student_exit',
        timestamp: data.timestamp || Date.now(),
        eventTime: data.eventTime,

        // 人员信息
        personName: data.personName,
        gender: data.gender,
        college: data.college,
        channelName: data.channelName,
        photoUrl: data.photoUrl,
        faceCaptureUrl: data.faceCaptureUrl,

        // 标记未展开
        isExpanded: false
      };

      // 添加到提醒队列
      this.reservationAlerts.unshift(alert);

      // 限制队列长度
      if (this.reservationAlerts.length > 1000) {
        this.reservationAlerts = this.reservationAlerts.slice(0, 1000);
      }

      // 播放音效
      this.playSoundAlert(alert);

      // 更新未读数量
      this.nightAlertUnreadCount++;
      this.saveNightAlertUnreadCountToLocalStorage();

      console.log('🌙 [夜间提醒] 添加到队列成功，当前未读:', this.nightAlertUnreadCount);
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
      
      if (!startTime || !endTime) {
        console.log('❌ 预约时间段为空，返回"未指定时间段"');
        return '未指定时间段';
      }
      
      const formatTime = (time) => {
        const date = new Date(time);
        return `${date.getMonth() + 1}/${date.getDate()} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
      };
      
      const result = `${formatTime(startTime)} - ${formatTime(endTime)}`;
      console.log('✅ 格式化预约时间段结果:', result);
      return result;
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
     * 确认单条提醒
     */
    async dismissAlert(index, event) {
      console.log('📝 确认提醒 - 索引:', index);
      
      // 获取要确认的提醒
      const alert = this.reservationAlerts[index];
      if (!alert) {
        console.warn('⚠️ 提醒不存在');
        return;
      }
      
      try {
        // 如果有数据库ID，调用后端API确认
        if (alert.id) {
          await focusAlertService.confirmAlert(alert.id);
          console.log('✅ 已调用后端API确认提醒:', alert.id);
        }
        
        // 标记为已确认
        alert.isConfirmed = true;
        alert.confirmedAt = Date.now();
        
        // 移到历史记录
        this.reservationAlertsHistory.unshift(alert);
        
        // 限制历史记录数量
        if (this.reservationAlertsHistory.length > this.maxHistorySize) {
          this.reservationAlertsHistory = this.reservationAlertsHistory.slice(0, this.maxHistorySize);
        }
        
        // 从当前队列中删除
        this.reservationAlerts.splice(index, 1);
        console.log('📊 剩余提醒数量:', this.reservationAlerts.length);
        
        // 如果没有提醒了，自动切换到历史记录tab
        if (this.reservationAlerts.length === 0 && this.reservationAlertsHistory.length > 0) {
          this.currentAlertTab = 'history';
        }
        
        // 💾 保存到本地存储（作为备份）
        this.saveAlertsToLocalStorage();
        
      } catch (error) {
        console.error('❌ 确认提醒失败:', error);
        alert('确认提醒失败，请重试');
      }
      
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
    async clearAllAlerts() {
      if (this.reservationAlerts.length === 0) {
        return;
      }
      
      try {
        // 收集所有有数据库ID的提醒
        const alertIds = this.reservationAlerts
          .filter(alert => alert.id)
          .map(alert => alert.id);
        
        // 如果有数据库记录，批量确认
        if (alertIds.length > 0) {
          await focusAlertService.confirmBatchAlerts(alertIds);
          console.log('✅ 已批量确认', alertIds.length, '条提醒');
        }
        
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
        
        // 💾 保存到本地存储（作为备份）
        this.saveAlertsToLocalStorage();
        
      } catch (error) {
        console.error('❌ 批量确认提醒失败:', error);
        alert('批量确认失败，请重试');
      }
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
    toggleAlertExpand(alert) {
      if (alert) {
        this.$set(alert, 'isExpanded', !alert.isExpanded);
      }
    },
    
    /**
     * 切换历史提醒项的展开/折叠状态
     */
    toggleHistoryAlertExpand(alert) {
      if (alert) {
        this.$set(alert, 'isExpanded', !alert.isExpanded);
      }
    },
    
    /**
     * 切换历史记录视图
     */
    toggleHistoryView() {
      this.showHistory = !this.showHistory;
    },
    
    /**
     * 切换提醒Tab
     */
    switchAlertTab(tab) {
      this.currentAlertTab = tab;
    },
    
    /**
     * 更新关注对象的未确认提醒数量
     */
    updateFocusPendingCount(count) {
      this.focusPendingCount = count;
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
     * 💾 保存夜间提醒未读数到本地存储
     */
    saveNightAlertUnreadCountToLocalStorage() {
      try {
        localStorage.setItem('nightAlertUnreadCount', String(this.nightAlertUnreadCount));
      } catch (error) {
        console.error('❌ 保存夜间提醒未读数失败:', error);
      }
    },

    /**
     * 📂 从本地存储加载夜间提醒未读数
     */
    loadNightAlertUnreadCountFromLocalStorage() {
      try {
        const stored = localStorage.getItem('nightAlertUnreadCount');
        if (stored !== null) {
          this.nightAlertUnreadCount = parseInt(stored, 10) || 0;
          console.log('📂 夜间提醒未读数已从本地存储恢复:', this.nightAlertUnreadCount);
        }
      } catch (error) {
        console.error('❌ 加载夜间提醒未读数失败:', error);
      }
    },

    /**
     * 💾 保存夜间提醒数据到本地存储
     */
    saveNightAlertsToLocalStorage() {
      try {
        const data = {
          alerts: this.nightAlerts,
          history: this.nightAlertsHistory,
          savedAt: Date.now()
        };
        localStorage.setItem('night_alerts', JSON.stringify(data));
        console.log('💾 夜间提醒数据已保存到本地存储');
      } catch (error) {
        console.error('❌ 保存夜间提醒数据失败:', error);
      }
    },

    /**
     * 📂 从本地存储加载夜间提醒数据
     */
    loadNightAlertsFromLocalStorage() {
      try {
        const stored = localStorage.getItem('night_alerts');
        if (stored) {
          const data = JSON.parse(stored);
          this.nightAlerts = data.alerts || [];
          this.nightAlertsHistory = data.history || [];
          console.log('📂 夜间提醒数据已从本地存储恢复:', this.nightAlerts.length, '未读,', this.nightAlertsHistory.length, '历史');
        }
      } catch (error) {
        console.error('❌ 加载夜间提醒数据失败:', error);
      }
    },

    /**
     * 🌙 从API获取夜间提醒未读数
     */
    async loadNightAlertUnreadCountFromAPI() {
      try {
        const response = await nightAlertService.getUnreadCount();
        const result = response.data;
        if (result.code === 200 || result.code === '0') {
          this.nightAlertUnreadCount = result.data?.unreadCount || 0;
          this.saveNightAlertUnreadCountToLocalStorage();
          console.log('🌙 夜间提醒未读数已从API获取:', this.nightAlertUnreadCount);
        }
      } catch (error) {
        console.error('❌ 获取夜间提醒未读数失败:', error);
      }
    },

    /**
     * 📂 从数据库加载提醒数据
     */
    async loadAlertsFromDatabase() {
      try {
        console.log('📂 开始从数据库加载提醒数据...');
        
        // 并行加载未确认提醒和历史记录
        const [pendingData, historyData] = await Promise.all([
          focusAlertService.getPendingAlerts(null, 1, 100),
          focusAlertService.getHistoryAlerts(null, 1, 100)
        ]);
        
        console.log('📊 API返回的原始数据:', {
          pendingData,
          historyData
        });
        
        // 转换未确认提醒格式 (后端返回的字段是list而不是records)
        const pendingList = pendingData.list || pendingData.records || [];
        const historyList = historyData.list || historyData.records || [];
        
        console.log('📋 提取的数据列表:', {
          pendingList: pendingList.length,
          historyList: historyList.length,
          pendingFirst: pendingList[0],
          historyFirst: historyList[0]
        });
        
        this.reservationAlerts = pendingList.map(record => this.convertAlertRecord(record));
        this.reservationAlertsHistory = historyList.map(record => this.convertAlertRecord(record));
        
        console.log('✅ 从数据库加载提醒数据完成:', {
          pending: this.reservationAlerts.length,
          history: this.reservationAlertsHistory.length
        });
        
      } catch (error) {
        console.error('❌ 从数据库加载提醒数据失败:', error);
        // 降级到本地存储
        this.loadAlertsFromLocalStorage();
      }
    },
    
    /**
     * 转换数据库记录为前端显示格式
     */
    convertAlertRecord(record) {
      return {
        id: record.id,
        type: record.alertType,
        alertType: 'focus_alert',
        timestamp: new Date(record.eventTime).getTime(),
        
        // 车辆信息
        plateNumber: record.alertType === 'vehicle' ? record.watchValue : null,
        
        // 人员信息
        personName: record.personName,
        idCard: record.alertType === 'person' ? record.watchValue : null,
        department: record.department,
        phoneNo: record.phoneNo,
        
        // 被访信息（映射到前端模板使用的字段名）
        visitedPerson: record.reservationPerson,  // 预约人即被访人
        visitedDepartment: record.department,     // 部门信息
        
        // 进出场信息
        eventType: record.eventType,
        channel: record.channelName,
        channelName: record.channelName,
        time: record.eventTime,
        eventTime: record.eventTime,
        imageUrl: record.photoUrl,
        photoUrl: record.photoUrl,
        
        // 预约信息
        visitorName: record.visitorName || record.personName || record.reservationPerson,  // 优先使用访客姓名
        visitorPhone: record.reservationPhone,
        purpose: record.reservationReason,
        // 修复：使用visitor_reservation_time_range作为预约时间段，支持多种分隔符
        reservationStartTime: record.visitorReservationTimeRange ? 
          (record.visitorReservationTimeRange.includes(' ~ ') ? 
            record.visitorReservationTimeRange.split(' ~ ')[0] : 
            record.visitorReservationTimeRange.split(' - ')[0]) : null,
        reservationEndTime: record.visitorReservationTimeRange ? 
          (record.visitorReservationTimeRange.includes(' ~ ') ? 
            record.visitorReservationTimeRange.split(' ~ ')[1] : 
            record.visitorReservationTimeRange.split(' - ')[1]) : null,
        
        // 🔍 调试日志：检查预约时间段相关字段
        ...(function() {
          console.log('🕐 预约时间段调试信息:', {
            recordId: record.id,
            reservationTimeRange: record.reservationTimeRange,
            visitorReservationTimeRange: record.visitorReservationTimeRange,
            visitor_reservation_time_range: record.visitor_reservation_time_range,
            allTimeFields: Object.keys(record).filter(key => key.toLowerCase().includes('time'))
          });
          return {};
        })(),
        reservation_person: record.reservationPerson,
        reservation_phone: record.reservationPhone,
        reservation_reason: record.reservationReason,
        reservation_time_range: record.visitorReservationTimeRange,
        
        // 访客信息
        visitor_pass_name: record.visitorPassName,
        visitor_vip_type: record.visitorVipType,
        visitor_park_name: record.visitorParkName,
        visitor_reservation_time_range: record.visitorReservationTimeRange,
        
        // VIP类型（映射到前端显示）
        vipType: record.visitorVipType,
        
        // 备注
        remark: record.remark,
        
        // 确认状态
        isConfirmed: record.isConfirmed === 1,
        confirmedAt: record.confirmedAt ? new Date(record.confirmedAt).getTime() : null,
        
        // UI状态
        isExpanded: false
      };
    },
    
    /**
     * 📂 从本地存储加载提醒数据（降级方案）
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
  padding: clamp(8px, 1vh, 15px) clamp(10px, 1.5vw, 30px);
  background: rgba(11, 19, 42, 0.9);
  border-bottom: 1px solid #1e3a8a;
  box-sizing: border-box;
  gap: clamp(8px, 1vw, 20px);
  flex-wrap: wrap;
  min-height: 60px;
  
  .header-center {
    flex: 1 1 auto;
    min-width: min(300px, 40vw);
    text-align: center;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: clamp(8px, 1.5vw, 20px);
    
    .main-title {
      font-size: clamp(14px, 2vw, 28px);
      font-weight: bold;
      color: #ffffff;
      text-shadow: 0 2px 4px rgba(0,0,0,0.5);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      max-width: 100%;
      line-height: 1.2;
    }
    
    // 🔔 喇叭提醒按钮
    .notification-bell {
      position: relative;
      cursor: pointer;
      padding: clamp(6px, 0.8vh, 8px) clamp(8px, 1vw, 12px);
      background: rgba(255, 193, 7, 0.1);
      border: 1px solid rgba(255, 193, 7, 0.3);
      border-radius: clamp(6px, 0.8vw, 8px);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      gap: clamp(6px, 0.8vw, 8px);
      flex-shrink: 0;
      
      &:hover {
        background: rgba(255, 193, 7, 0.2);
        border-color: rgba(255, 193, 7, 0.5);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(255, 193, 7, 0.3);
      }
      
      .bell-icon {
        font-size: clamp(18px, 2vw, 22px);
        transition: all 0.3s ease;
        line-height: 1;
        
        &.has-alerts {
          animation: ring 2.5s ease-in-out infinite;
        }
      }
      
      .alert-badge {
        min-width: clamp(18px, 2vw, 20px);
        height: clamp(18px, 2vw, 20px);
        background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
        color: #fff;
        border-radius: 50%;
        font-size: clamp(10px, 1.2vw, 12px);
        font-weight: 600;
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 0 clamp(4px, 0.5vw, 6px);
        box-shadow: 0 2px 8px rgba(255, 77, 79, 0.4);
        animation: badgePulse 2s ease-in-out infinite;
      }
    }
    
    // 添加关注对象按钮
    .add-watch-btn {
      position: relative;
      cursor: pointer;
      padding: clamp(6px, 0.8vh, 8px) clamp(8px, 1vw, 12px);
      background: rgba(59, 130, 246, 0.15);
      border: 1px solid rgba(59, 130, 246, 0.4);
      border-radius: clamp(6px, 0.8vw, 8px);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      min-width: clamp(36px, 4vw, 44px);
      
      &:hover {
        background: rgba(59, 130, 246, 0.3);
        border-color: rgba(59, 130, 246, 0.6);
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 4px 16px rgba(59, 130, 246, 0.4);
      }
      
      &:active {
        transform: translateY(0) scale(0.98);
      }
      
      .add-icon {
        font-size: clamp(18px, 2vw, 22px);
        line-height: 1;
        transition: all 0.3s ease;
      }
      
      &:hover .add-icon {
        transform: rotate(90deg);
      }
    }

    // 🌙 夜间学生出校提醒按钮
    .night-alert-btn {
      position: relative;
      cursor: pointer;
      padding: clamp(6px, 0.8vh, 8px) clamp(8px, 1vw, 12px);
      background: rgba(139, 92, 246, 0.15);
      border: 1px solid rgba(139, 92, 246, 0.4);
      border-radius: clamp(6px, 0.8vw, 8px);
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
      min-width: clamp(36px, 4vw, 44px);

      &:hover {
        background: rgba(139, 92, 246, 0.3);
        border-color: rgba(139, 92, 246, 0.6);
        transform: translateY(-2px) scale(1.05);
        box-shadow: 0 4px 16px rgba(139, 92, 246, 0.4);
      }

      &:active {
        transform: translateY(0) scale(0.98);
      }

      .night-alert-icon {
        font-size: clamp(18px, 2vw, 22px);
        line-height: 1;
        transition: all 0.3s ease;
      }

      // 数字角标
      .night-alert-badge {
        position: absolute;
        top: clamp(-4px, -0.5vh, -6px);
        right: clamp(-6px, -0.6vw, -8px);
        min-width: clamp(16px, 1.8vw, 22px);
        height: clamp(16px, 1.8vw, 22px);
        padding: 0 clamp(4px, 0.4vw, 6px);
        background: linear-gradient(135deg, #ff4d4d 0%, #ff0000 100%);
        border-radius: 20px;
        box-shadow: 0 0 8px rgba(255, 0, 0, 0.6);
        animation: nightBadgePulse 2s ease-in-out infinite;
        font-size: clamp(9px, 0.9vw, 11px);
        font-weight: bold;
        color: #fff;
        display: flex;
        align-items: center;
        justify-content: center;
        line-height: 1;
      }
    }

    @keyframes nightBadgePulse {
      0%, 100% {
        opacity: 1;
        transform: scale(1);
      }
      50% {
        opacity: 0.7;
        transform: scale(1.1);
      }
    }
  }
}

// 🌙 夜间学生出校提醒列表小弹窗（独立于 .header-section，因为 DOM 中弹窗不在 header 内）
.night-alert-list-popup {
  position: fixed;
  top: 65px;
  right: 15px;
  width: 560px;
  max-height: calc(100vh - 100px);
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%);
  border: 1px solid rgba(139, 92, 246, 0.3);
  border-radius: 16px;
  overflow: hidden;
  z-index: 9999;
  box-shadow: 0 16px 64px rgba(0, 0, 0, 0.5);
  backdrop-filter: blur(20px);
  display: flex;
  flex-direction: column;
  box-sizing: border-box;

    .night-alert-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: clamp(12px, 1.5vh, 16px) clamp(15px, 2vw, 20px);
      background: linear-gradient(90deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
      border-bottom: 1px solid rgba(139, 92, 246, 0.3);

      .header-left {
        display: flex;
        align-items: center;
        gap: 8px;

        .header-icon {
          font-size: 20px;
        }

        .header-title {
          font-size: 16px;
          font-weight: bold;
          color: #fff;
        }

        .alert-count {
          background: linear-gradient(135deg, #ff4d4d 0%, #ff0000 100%);
          color: #fff;
          font-size: 11px;
          font-weight: bold;
          padding: 2px 8px;
          border-radius: 10px;
          min-width: 20px;
          text-align: center;
        }
      }

      .header-actions {
        display: flex;
        gap: 8px;

        .btn-action {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          transition: all 0.2s;
          background: rgba(59, 130, 246, 0.2);
          color: #3b82f6;

          &:hover {
            background: rgba(59, 130, 246, 0.4);
          }
        }

        .btn-close {
          width: 32px;
          height: 32px;
          border: none;
          border-radius: 6px;
          cursor: pointer;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 18px;
          background: rgba(239, 68, 68, 0.2);
          color: #ef4444;
          transition: all 0.2s;

          &:hover {
            background: rgba(239, 68, 68, 0.4);
          }
        }
      }
    }

    .night-alert-tabs {
      display: flex;
      gap: 8px;
      padding: clamp(10px, 1.2vh, 14px) clamp(12px, 1.5vw, 16px);
      border-bottom: 1px solid rgba(139, 92, 246, 0.2);

      .tab {
        padding: 6px 14px;
        border-radius: 6px;
        cursor: pointer;
        font-size: 13px;
        color: #94a3b8;
        transition: all 0.2s;

        &.active {
          background: rgba(139, 92, 246, 0.3);
          color: #fff;
        }

        &:hover:not(.active) {
          background: rgba(59, 130, 246, 0.1);
        }
      }
    }

    .night-alert-filters {
      display: flex;
      gap: 8px;
      padding: 8px 16px;
      border-bottom: 1px solid rgba(139, 92, 246, 0.2);
      align-items: center;
      flex-wrap: nowrap;

      .filter-item {
        display: flex;
        align-items: center;
        gap: 4px;
        flex-shrink: 0;

        label {
          font-size: 12px;
          color: #94a3b8;
          white-space: nowrap;
        }

        .filter-input {
          width: 110px;
          background: rgba(11, 19, 42, 0.9);
          border: 1px solid rgba(59, 130, 246, 0.25);
          border-radius: 6px;
          color: #fff;
          padding: 5px 24px 5px 8px;
          font-size: 12px;
          cursor: pointer;

          &::placeholder {
            color: #64748b;
          }

          &:focus {
            outline: none;
            border-color: #3b82f6;
          }
        }

        .filter-select {
          background: rgba(11, 19, 42, 0.9);
          border: 1px solid rgba(59, 130, 246, 0.25);
          border-radius: 6px;
          color: #fff;
          padding: 5px 8px;
          font-size: 12px;
          cursor: pointer;

          &:focus {
            outline: none;
            border-color: #3b82f6;
          }

          option {
            background: rgba(11, 19, 42, 0.98);
          }
        }

        &.search-filter {
          .searchable-select {
            position: relative;

            .select-trigger {
              position: relative;
              display: flex;
              align-items: center;

              .select-arrow {
                position: absolute;
                right: 6px;
                top: 50%;
                transform: translateY(-50%);
                color: #64748b;
                font-size: 10px;
                pointer-events: none;
                transition: transform 0.2s;
              }

              .select-clear {
                position: absolute;
                right: 6px;
                top: 50%;
                transform: translateY(-50%);
                color: #94a3b8;
                font-size: 14px;
                cursor: pointer;
                width: 16px;
                height: 16px;
                display: flex;
                align-items: center;
                justify-content: center;
                border-radius: 50%;
                transition: all 0.2s;
                &:hover {
                  color: #f87171;
                  background: rgba(248, 113, 113, 0.15);
                }
              }
            }

            &.open .select-trigger .select-arrow {
              transform: translateY(-50%) rotate(180deg);
            }

            .select-dropdown {
              position: absolute;
              top: calc(100% + 4px);
              left: 0;
              width: 180px;
              max-height: 200px;
              overflow-y: auto;
              background: rgba(11, 19, 42, 0.98);
              border: 1px solid rgba(59, 130, 246, 0.4);
              border-radius: 6px;
              z-index: 10001;
              box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);

              &::-webkit-scrollbar {
                width: 4px;
              }
              &::-webkit-scrollbar-thumb {
                background: rgba(139, 92, 246, 0.3);
                border-radius: 2px;
              }

              .select-option {
                padding: 6px 10px;
                font-size: 12px;
                color: #e2e8f0;
                cursor: pointer;
                transition: background 0.15s;
                white-space: nowrap;
                overflow: hidden;
                text-overflow: ellipsis;

                &:hover {
                  background: rgba(59, 130, 246, 0.2);
                }

                &.selected {
                  background: rgba(139, 92, 246, 0.25);
                  color: #a78bfa;
                }

                &.default-option {
                  color: #94a3b8;
                  border-bottom: 1px solid rgba(59, 130, 246, 0.15);
                }
              }

              .no-options {
                padding: 8px 10px;
                font-size: 12px;
                color: #64748b;
                text-align: center;
              }
            }
          }
        }
      }

      .btn-query {
        background: linear-gradient(135deg, rgba(59, 130, 246, 0.25) 0%, rgba(59, 130, 246, 0.15) 100%);
        border: 1px solid rgba(59, 130, 246, 0.4);
        border-radius: 6px;
        color: #60a5fa;
        padding: 5px 14px;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        margin-left: auto;
        transition: all 0.2s;
        white-space: nowrap;

        &:hover {
          background: linear-gradient(135deg, rgba(59, 130, 246, 0.4) 0%, rgba(59, 130, 246, 0.25) 100%);
          border-color: #3b82f6;
        }
      }

      .btn-clear-filter {
        background: rgba(239, 68, 68, 0.1);
        border: 1px solid rgba(239, 68, 68, 0.3);
        border-radius: 6px;
        color: #f87171;
        padding: 5px 10px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;
        white-space: nowrap;

        &:hover {
          background: rgba(239, 68, 68, 0.25);
          border-color: #ef4444;
        }
      }
    }

    .night-alert-list {
      flex: 1;
      overflow-y: auto;
      padding: clamp(8px, 1vh, 12px);

      .empty-state {
        text-align: center;
        color: #64748b;
        padding: 40px 20px;

        .empty-icon {
          font-size: 48px;
          display: block;
          margin-bottom: 10px;
        }

        p {
          font-size: 14px;
        }
      }

      .night-alert-item {
        background: linear-gradient(135deg, rgba(20, 30, 60, 0.9) 0%, rgba(30, 41, 59, 0.7) 100%);
        border: 1px solid rgba(139, 92, 246, 0.2);
        border-radius: 12px;
        margin-bottom: 10px;
        cursor: pointer;
        transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        overflow: hidden;

        &:hover {
          border-color: rgba(139, 92, 246, 0.5);
          background: linear-gradient(135deg, rgba(30, 50, 90, 0.9) 0%, rgba(50, 70, 100, 0.7) 100%);
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(0, 0, 0, 0.3);
        }

        &.unread {
          border-left: 4px solid #8b5cf6;
          background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(30, 41, 59, 0.7) 100%);
        }

        &.expanded {
          border-color: rgba(139, 92, 246, 0.7);
          box-shadow: 0 10px 35px rgba(139, 92, 246, 0.2);
        }

        .item-compact {
          display: flex;
          align-items: center;
          gap: 12px;
          padding: 12px 14px;

          .item-icon {
            font-size: 18px;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(139, 92, 246, 0.2);
            border-radius: 6px;
          }

          .person-name {
            font-size: 14px;
            font-weight: 600;
            color: #f1f5f9;
            min-width: 70px;
          }

          .college {
            font-size: 12px;
            color: #94a3b8;
            flex: 1;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;
          }

          .channel {
            font-size: 12px;
            color: #64748b;
            min-width: 80px;
          }

          .time {
            font-size: 12px;
            color: #60a5fa;
            font-family: 'SF Mono', monospace;
            min-width: 65px;
          }

          .expand-icon {
            font-size: 12px;
            color: #64748b;
            transition: transform 0.3s ease;
          }
        }

        &.expanded .expand-icon {
          transform: rotate(180deg);
        }

        .item-expanded {
          padding: 16px;
          position: relative;
          border-top: 1px solid rgba(139, 92, 246, 0.2);
          background: linear-gradient(145deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.85) 100%);
          animation: slideDown 0.3s ease;
          border-radius: 0 0 12px 12px;

          @keyframes slideDown {
            from {
              opacity: 0;
              transform: translateY(-10px);
            }
            to {
              opacity: 1;
              transform: translateY(0);
            }
          }

          .item-main {
            display: flex;
            gap: 18px;
            align-items: flex-start;

            .item-photo {
              width: 72px;
              height: 72px;
              border-radius: 50%;
              overflow: hidden;
              flex-shrink: 0;
              box-shadow: 0 6px 20px rgba(139, 92, 246, 0.3), 0 0 0 3px rgba(139, 92, 246, 0.2);
              background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);

              img {
                width: 100%;
                height: 100%;
                object-fit: cover;
              }

              .photo-placeholder {
                width: 100%;
                height: 100%;
                display: flex;
                align-items: center;
                justify-content: center;
                background: linear-gradient(135deg, #1e3a8a 0%, #1e40af 100%);
                font-size: 28px;
                font-weight: bold;
                color: #fff;
              }
            }

            .item-info {
              flex: 1;
              display: grid;
              grid-template-columns: repeat(2, 1fr);
              gap: 10px 20px;

              .info-row {
                display: flex;
                align-items: center;
                gap: 8px;
                padding: 8px 12px;
                background: rgba(139, 92, 246, 0.08);
                border-radius: 8px;
                border: 1px solid rgba(139, 92, 246, 0.15);
                transition: all 0.25s ease;

                &:hover {
                  background: rgba(139, 92, 246, 0.15);
                  border-color: rgba(139, 92, 246, 0.3);
                  transform: translateX(3px);
                }

                .label {
                  display: flex;
                  align-items: center;
                  gap: 5px;
                  color: #a78bfa;
                  font-size: 11px;
                  font-weight: 600;
                  text-transform: uppercase;
                  letter-spacing: 0.8px;
                  white-space: nowrap;

                  .label-icon {
                    font-size: 12px;
                    opacity: 0.8;
                  }

                  &::after {
                    content: ':';
                    color: #6366f1;
                    margin-left: 2px;
                  }
                }

                .value {
                  color: #f1f5f9;
                  font-weight: 500;
                  font-size: 13px;
                  overflow: hidden;
                  text-overflow: ellipsis;
                  white-space: nowrap;
                }

                &.info-name {
                  grid-column: 1 / -1;
                  background: linear-gradient(90deg, rgba(139, 92, 246, 0.2) 0%, rgba(139, 92, 246, 0.05) 100%);
                  border-color: rgba(139, 92, 246, 0.3);

                  .label {
                    color: #c4b5fd;
                  }

                  .value {
                    font-size: 15px;
                    font-weight: 700;
                    color: #fff;
                    letter-spacing: 1px;
                  }
                }

                &.info-gender {
                  .value {
                    color: #fb7185;
                  }
                }

                &.info-time {
                  grid-column: 1 / -1;
                  background: rgba(59, 130, 246, 0.1);
                  border-color: rgba(59, 130, 246, 0.2);

                  .label {
                    color: #60a5fa;
                  }

                  .value {
                    font-family: 'SF Mono', 'JetBrains Mono', monospace;
                    font-size: 12px;
                    color: #93c5fd;
                    letter-spacing: 0.5px;
                  }
                }
              }
            }
          }

          .item-actions {
            display: flex;
            gap: 12px;
            margin-top: 14px;
            padding-top: 14px;
            border-top: 1px solid rgba(139, 92, 246, 0.15);

            .btn-confirm {
              flex: 1;
              background: linear-gradient(135deg, #22c55e 0%, #16a34a 100%);
              border: none;
              border-radius: 8px;
              color: #fff;
              padding: 10px 20px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.25s ease;
              box-shadow: 0 4px 12px rgba(34, 197, 94, 0.3);

              &:hover {
                background: linear-gradient(135deg, #16a34a 0%, #15803d 100%);
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(34, 197, 94, 0.4);
              }

              &:active {
                transform: translateY(0);
              }
            }

            .btn-confirm-all {
              flex: 1;
              background: linear-gradient(135deg, #8b5cf6 0%, #7c3aed 100%);
              border: none;
              border-radius: 8px;
              color: #fff;
              padding: 10px 20px;
              font-size: 13px;
              font-weight: 600;
              cursor: pointer;
              transition: all 0.25s ease;
              box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);

              &:hover {
                background: linear-gradient(135deg, #7c3aed 0%, #6d28d9 100%);
                transform: translateY(-2px);
                box-shadow: 0 6px 16px rgba(139, 92, 246, 0.4);
              }

              &:active {
                transform: translateY(0);
              }
            }
          }

          .collapse-icon {
            position: absolute;
            top: 12px;
            right: 12px;
            font-size: 14px;
            color: #64748b;
            cursor: pointer;
            transition: all 0.2s;
            width: 28px;
            height: 28px;
            display: flex;
            align-items: center;
            justify-content: center;
            background: rgba(100, 116, 139, 0.2);
            border-radius: 50%;

            &:hover {
              color: #fff;
              background: rgba(139, 92, 246, 0.4);
            }
          }
        }

        .status-badge {
          font-size: 10px;
          padding: 2px 6px;
          border-radius: 4px;

          &.read {
            background: rgba(34, 197, 94, 0.2);
            color: #22c55e;
          }
        }
      }
    }

    .night-alert-footer {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: clamp(10px, 1.2vh, 14px) clamp(12px, 1.5vw, 16px);
      border-top: 1px solid rgba(139, 92, 246, 0.2);
      background: linear-gradient(90deg, rgba(139, 92, 246, 0.1) 0%, rgba(139, 92, 246, 0.05) 100%);

      .record-count {
        font-size: 12px;
        color: #94a3b8;
      }

      .btn-confirm-all-bottom {
        background: rgba(34, 197, 94, 0.2);
        border: 1px solid #22c55e;
        border-radius: 4px;
        color: #22c55e;
        padding: 4px 12px;
        font-size: 12px;
        cursor: pointer;
        transition: all 0.2s;

        &:hover {
          background: rgba(34, 197, 94, 0.4);
        }
      }
    }
}

.header-section {
  .header-right {
    display: flex;
    gap: clamp(8px, 1.2vw, 20px);
    align-items: center;
    flex-wrap: wrap;
    flex-shrink: 0;
    min-width: min-content;
    
    // 用户信息样式
    .user-info {
      position: relative;
      display: flex;
      align-items: center;
      gap: 8px;
      padding: 8px 16px;
      background: rgba(30, 58, 138, 0.2);
      border: 1px solid rgba(30, 58, 138, 0.5);
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(30, 58, 138, 0.4);
        border-color: rgba(0, 247, 255, 0.5);
        box-shadow: 0 0 15px rgba(0, 247, 255, 0.2);
      }
      
      .user-avatar {
        font-size: 18px;
        width: 32px;
        height: 32px;
        display: flex;
        align-items: center;
        justify-content: center;
        background: linear-gradient(135deg, #00f7ff, #00ff88);
        border-radius: 50%;
        box-shadow: 0 2px 8px rgba(0, 247, 255, 0.3);
      }
      
      .user-name {
        font-size: 14px;
        color: #ffffff;
        font-weight: 500;
        max-width: 100px;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      
      .user-role-badge {
        font-size: 11px;
        padding: 2px 8px;
        background: linear-gradient(135deg, #00f7ff, #00ff88);
        color: #0a0e27;
        border-radius: 4px;
        font-weight: 600;
      }
      
      // 用户菜单
      .user-menu {
        position: absolute;
        top: calc(100% + 8px);
        right: 0;
        background: rgba(11, 19, 42, 0.95);
        border: 1px solid rgba(0, 247, 255, 0.3);
        border-radius: 8px;
        padding: 8px 0;
        min-width: 160px;
        box-shadow: 0 8px 24px rgba(0, 0, 0, 0.5);
        z-index: 1000;
        backdrop-filter: blur(10px);
        
        .menu-item {
          display: flex;
          align-items: center;
          gap: 10px;
          padding: 10px 16px;
          color: #ffffff;
          cursor: pointer;
          transition: all 0.3s ease;
          
          .menu-icon {
            font-size: 16px;
          }
          
          &:hover {
            background: rgba(0, 247, 255, 0.1);
            color: #00f7ff;
          }
          
          &.logout {
            color: #ff4444;
            
            &:hover {
              background: rgba(255, 68, 68, 0.1);
            }
          }
        }
        
        .menu-divider {
          height: 1px;
          background: rgba(255, 255, 255, 0.1);
          margin: 4px 0;
        }
      }
    }
    
    .time-selector, .channel-selector {
      .time-select, .channel-select {
        background: rgba(11, 19, 42, 0.9);
        border: 1px solid #1e3a8a;
        border-radius: clamp(4px, 0.6vw, 6px);
        color: #ffffff;
        padding: clamp(6px, 0.8vh, 8px) clamp(10px, 1.2vw, 15px);
        font-size: clamp(12px, 1.4vw, 14px);
        cursor: pointer;
        transition: all 0.3s ease;
        white-space: nowrap;
        
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
    gap: clamp(6px, 0.8vw, 8px);
    padding: clamp(6px, 0.8vh, 8px) clamp(10px, 1.2vw, 15px);
    background: rgba(11, 19, 42, 0.8);
    border: 1px solid #1e3a8a;
    border-radius: clamp(4px, 0.6vw, 6px);
    white-space: nowrap;
    
    .location-icon, .alert-icon, .weather-icon {
      font-size: 16px;
    }
    
    .location-text, .alert-text, .weather-text, .datetime-text {
      font-size: clamp(11px, 1.3vw, 14px);
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
  flex: 1;
  min-height: 0;
  height: 100%;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 0;
  box-sizing: border-box;
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
  grid-template-columns: minmax(280px, 0.95fr) minmax(400px, 1.8fr) minmax(300px, 1.05fr);
  gap: clamp(8px, 1vw, 15px);
  padding: clamp(5px, 0.5vh, 15px) clamp(5px, 0.5vw, 15px);
  flex: 1;
  min-height: 0;
  height: 100%;
  width: 100%;
  box-sizing: border-box;
  
  .content-column {
    width: 100%;
    height: 100%;
    display: flex;
    flex-direction: column;
    gap: clamp(8px, 1vh, 15px);
    min-width: 0;
    min-height: 0;
    overflow: hidden;
  }
  .module-container {
      flex: 1;
      min-height: 0;
      width: 100%;
      box-sizing: border-box;
      overflow: hidden;
      
      &.compact {
        flex: 1.5;
        min-height: 0;
      }
      
      &.main-chart {
        flex: 2;
        min-height: 0;
      }
      
      &.revenue-analysis {
        flex: 1.6;
        min-height: 0;
        margin-top: clamp(-12px, -0.8vh, -6px);
      }
      
      &.flow-analysis {
        flex: 1.3;
        min-height: 0;
        margin-top: 0;
      }
      
      &.channel-stats-container {
        flex: 1.2;
        min-height: 0;
      }
      
      &.channel-pie-container {
        flex: 1.2;
        min-height: 0;
        margin-top: clamp(-12px, -0.8vh, -6px);
      }
      
      &.anomaly-monitor {
        flex: 1.4;
        min-height: 0;
      }
      
      &.visitor-plan {
        flex: 1.2;
        min-height: clamp(250px, 20vh, 300px);
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
  .main-content-grid {
    grid-template-columns: minmax(260px, 0.88fr) minmax(350px, 1.8fr) minmax(270px, 0.92fr);
    gap: clamp(6px, 0.8vw, 12px);
  }
  
  .kpi-section {
    .kpi-card {
      max-width: 180px;
      padding: 15px 10px;
      
      .kpi-value {
        font-size: clamp(24px, 2.2vw, 28px);
      }
    }
  }
}

@media (min-width: 2048px) {
  .main-content-grid .module-container {
    &.visitor-plan {
      flex: 1.4;
      min-height: clamp(300px, 24vh, 380px);
    }
    
    &.flow-analysis {
      flex: 1.4;
      margin-top: 0;
    }
    
    &.anomaly-monitor {
      flex: 1.6;
    }
    
    &.compact {
      flex: 1.6;
    }
    
    &.channel-pie-container {
      flex: 1.3;
    }
    
    &.revenue-analysis {
      flex: 1.4;
    }
  }
  
  .content-column {
    gap: clamp(10px, 1.2vh, 15px);
  }
}

@media (max-width: 1440px) {
  .header-section {
    .header-center {
      min-width: min(280px, 38vw);
      
      .main-title {
        font-size: clamp(14px, 1.8vw, 24px);
      }
      
      .notification-bell {
        padding: clamp(5px, 0.7vh, 7px) clamp(7px, 0.9vw, 10px);
        
        .bell-icon {
          font-size: clamp(16px, 1.8vw, 20px);
        }
      }
    }
    
    .header-right {
      gap: clamp(6px, 1vw, 15px);
    }
  }
  
  .main-content-grid .module-container {
    &.compact {
      flex: 1.6;
    }
    
    &.channel-pie-container {
      flex: 1.3;
      margin-top: clamp(-8px, -0.5vh, -4px);
    }
    
    &.revenue-analysis {
      flex: 2.5;  // 从2.0进一步增加到2.5，使图表更大
      margin-top: clamp(-8px, -0.5vh, -4px);
      min-height: clamp(280px, 24vh, 350px);  // 增加最小高度，使图表更高
    }
    
    &.visitor-plan {
      flex: 1.2;
      min-height: clamp(260px, 21vh, 320px);
    }
    
    &.anomaly-monitor {
      flex: 1.5;
    }
    
    &.flow-analysis {
      flex: 1.4;
      margin-top: 0;
    }
  }
}

@media (max-width: 1366px) {
  .main-content-grid {
    grid-template-columns: minmax(240px, 0.83fr) minmax(320px, 1.9fr) minmax(250px, 0.87fr);
    gap: clamp(5px, 0.6vw, 10px);
    padding: clamp(3px, 0.3vh, 10px) clamp(3px, 0.3vw, 10px);
    
    .module-container {
      &.compact {
        flex: 1.7;
      }
      
      &.channel-pie-container {
        flex: 1.4;
        margin-top: clamp(-6px, -0.4vh, -3px);
      }
      
      &.revenue-analysis {
        flex: 2.6;  // 从2.1进一步增加到2.6
        margin-top: clamp(-6px, -0.4vh, -3px);
        min-height: clamp(290px, 24vh, 360px);  // 增加最小高度
      }
      
      &.visitor-plan {
        flex: 1.3;
        min-height: clamp(270px, 22vh, 330px);
      }
      
      &.anomaly-monitor {
        flex: 1.6;
      }
      
      &.flow-analysis {
        flex: 1.5;
        margin-top: 0;
      }
    }
  }
  
  .header-section {
    padding: clamp(6px, 0.8vh, 12px) clamp(8px, 1.2vw, 20px);
    gap: clamp(6px, 0.8vw, 15px);
    
    .header-center {
      min-width: min(250px, 35vw);
      gap: clamp(6px, 1vw, 15px);
      
      .main-title {
        font-size: clamp(13px, 1.6vw, 22px);
      }
      
      .notification-bell {
        padding: 5px 8px;
        
        .bell-icon {
          font-size: 18px;
        }
        
        .alert-badge {
          min-width: 16px;
          height: 16px;
          font-size: 10px;
        }
      }
    }
    
    .header-right {
      gap: 8px;
      
      .time-select {
        padding: 6px 10px;
        font-size: 12px;
      }
      
      .datetime-text {
        font-size: 12px;
      }
    }
  }
}

@media (max-width: 1200px) {
  .header-section {
    padding: 8px 15px;
    gap: 10px;
    
    .header-center {
      min-width: min(240px, 35vw);
      gap: 10px;
      
      .main-title {
        font-size: clamp(12px, 1.8vw, 20px);
      }
      
      .notification-bell {
        padding: 5px 8px;
        
        .bell-icon {
          font-size: 16px;
        }
      }
    }
    
    .header-right {
      gap: 8px;
    }
  }
  
  .main-content-grid .module-container {
    &.compact {
      min-height: clamp(180px, 18vh, 250px);
      max-height: clamp(220px, 22vh, 280px);
    }
    
    &.channel-pie-container {
      min-height: clamp(160px, 15vh, 220px);
      max-height: clamp(200px, 19vh, 240px);
    }
    
    &.revenue-analysis {
      min-height: clamp(200px, 18vh, 260px);
      max-height: clamp(240px, 22vh, 280px);
    }
  }
  
  .main-content-grid {
    grid-template-columns: 1fr;
    grid-template-rows: auto auto auto;
    gap: clamp(10px, 1.5vh, 20px);
    
    .content-column {
      flex-direction: row;
      flex-wrap: wrap;
      
      .module-container {
        flex: 1;
        min-height: clamp(250px, 30vh, 300px);
        min-width: 300px;
        
        &.main-chart {
          flex: 2;
          min-width: 100%;
        }
      }
    }
  }
}

@media (max-width: 1024px) {
  .header-section {
    flex-direction: column;
    align-items: stretch;
    gap: 10px;
    padding: 10px 15px;
    
    .header-center {
      min-width: 100%;
      justify-content: center;
      order: 1;
      
      .main-title {
        font-size: clamp(14px, 2.5vw, 18px);
        text-align: center;
      }
      
      .notification-bell {
        position: absolute;
        top: 10px;
        right: 10px;
      }
    }
    
    .header-right {
      min-width: 100%;
      justify-content: center;
      order: 2;
      gap: 10px;
    }
  }
}

@media (max-width: 1024px) {
  .main-content-grid {
    .content-column {
      height: auto;
      min-height: 100%;
    }
  }
}

@media (max-width: 768px) {
  .header-section {
    flex-direction: column;
    gap: 8px;
    padding: 8px 10px;
    min-height: auto;
    
    .header-center {
      width: 100%;
      min-width: 100%;
      justify-content: space-between;
      padding-right: 50px;
      position: relative;
      
      .main-title {
        font-size: 14px;
        max-width: calc(100% - 60px);
      }
      
      .notification-bell {
        position: absolute;
        right: 0;
        padding: 5px 8px;
        
        .bell-icon {
          font-size: 16px;
        }
        
        .alert-badge {
          min-width: 16px;
          height: 16px;
          font-size: 9px;
        }
      }
    }
    
    .header-right {
      width: 100%;
      min-width: 100%;
      justify-content: space-between;
      gap: 8px;
      
      .time-selector {
        flex: 1;
        
        .time-select {
          width: 100%;
          padding: 6px 10px;
          font-size: 12px;
        }
      }
      
      .datetime-info {
        flex: 1;
        justify-content: center;
        padding: 6px 10px;
        
        .datetime-text {
          font-size: 11px;
        }
      }
    }
  }
  
  .main-content-grid {
    grid-template-columns: 1fr;
    padding: 8px;
    height: auto;
    
    .content-column {
      flex-direction: column;
      height: auto;
      
      .module-container {
        min-width: 100%;
        
        &.compact {
          min-height: 200px;
          flex: none;
          height: 200px;
        }
        
        &.channel-pie-container {
          min-height: 180px;
          flex: none;
          height: 180px;
        }
        
        &.revenue-analysis {
          min-height: 220px;
          flex: none;
          height: 220px;
        }
      }
    }
  }
}

@media (max-width: 480px) {
  .header-section {
    padding: 6px 8px;
    
    .header-center {
      .main-title {
        font-size: 12px;
      }
      
      .notification-bell {
        padding: 4px 6px;
        
        .bell-icon {
          font-size: 14px;
        }
        
        .alert-badge {
          min-width: 14px;
          height: 14px;
          font-size: 8px;
        }
      }
    }
    
    .header-right {
      gap: 6px;
      
      .time-select {
        padding: 5px 8px;
        font-size: 11px;
      }
      
      .datetime-text {
        font-size: 10px;
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
  width: clamp(320px, 90vw, 1600px);
  max-width: 95vw;
  max-height: 90vh;
  overflow: hidden;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  box-sizing: border-box;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  padding: clamp(10px, 1.5vh, 15px) clamp(15px, 2vw, 20px);
  border-bottom: 1px solid #1e3a8a;
  background: rgba(11, 19, 42, 0.9);
  box-sizing: border-box;
  
  .modal-title-section {
    flex: 1;
    
    h3 {
      margin: 0 0 8px 0;
      font-size: clamp(16px, 2vw, 20px);
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
  padding: clamp(10px, 1.5vh, 15px);
  max-height: calc(90vh - 80px);
  overflow-y: auto;
  box-sizing: border-box;
  
  &::-webkit-scrollbar {
    width: 6px;
  }
  
  &::-webkit-scrollbar-track {
    background: rgba(11, 19, 42, 0.5);
  }
  
  &::-webkit-scrollbar-thumb {
    background: rgba(59, 130, 246, 0.5);
    border-radius: 3px;
    
    &:hover {
      background: rgba(59, 130, 246, 0.7);
    }
  }
}


.charts-container {
  display: grid;
  grid-template-columns: minmax(200px, 0.6fr) minmax(150px, 0.4fr);
  grid-template-rows: clamp(200px, 20vh, 250px) 1fr;
  gap: clamp(2px, 0.3vw, 5px);
  width: 100%;
  box-sizing: border-box;
  
  .chart-section {
    background: none;
    border: none;
    border-radius: 0;
    padding: clamp(2px, 0.2vh, 5px);
    width: 100%;
    min-height: clamp(200px, 20vh, 250px);
    box-sizing: border-box;
    
    // 上方两个图表使用固定高度
    &:nth-child(1),
    &:nth-child(2) {
      height: clamp(200px, 20vh, 250px);
      min-height: clamp(200px, 20vh, 250px);
    }
    
    // 下方图表使用剩余空间
    &:nth-child(3) {
      height: 100%;
      min-height: clamp(350px, 35vh, 450px);
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
  max-width: min(800px, 90vw);
  
  .modal-body {
    padding: clamp(15px, 2.5vw, 30px);
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
      
      .plate {
        color: #4caf50;
        font-weight: bold;
        font-family: 'Courier New', monospace;
        background: rgba(76, 175, 80, 0.1);
        padding: 2px 6px;
        border-radius: 4px;
        border: 1px solid rgba(76, 175, 80, 0.3);
      }
      
      .vip-type {
        color: #ff9800;
        font-weight: bold;
        background: rgba(255, 152, 0, 0.1);
        padding: 2px 8px;
        border-radius: 4px;
        border: 1px solid rgba(255, 152, 0, 0.3);
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
  top: clamp(60px, 8vh, 70px);
  right: clamp(10px, 1.5vw, 20px);
  width: clamp(320px, 35vw, 560px);
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
  box-sizing: border-box;
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
  padding: clamp(12px, 1.5vh, 16px) clamp(15px, 2vw, 20px);
  background: linear-gradient(90deg, rgba(100, 149, 237, 0.15) 0%, rgba(72, 118, 255, 0.1) 100%);
  border-bottom: 1px solid rgba(100, 149, 237, 0.3);
  box-sizing: border-box;
}

.alert-title {
  display: flex;
  align-items: center;
  gap: 12px;
  
  .title-icon {
    font-size: 20px;
  }
  
  .title-text {
    font-size: clamp(14px, 1.6vw, 17px);
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
  padding: clamp(8px, 1vh, 12px);
  max-height: calc(100vh - 180px);
  box-sizing: border-box;
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

/* 类型筛选器样式 */
.alert-filter {
  display: flex;
  gap: 8px;
  margin-bottom: 12px;
  padding: 8px;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 8px;
  
  .filter-btn {
    flex: 1;
    padding: 8px 12px;
    font-size: 13px;
    color: rgba(255, 255, 255, 0.6);
    background: rgba(255, 255, 255, 0.03);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 6px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      color: rgba(255, 255, 255, 0.8);
      background: rgba(255, 255, 255, 0.06);
      border-color: rgba(255, 255, 255, 0.2);
    }
    
    &.active {
      color: #fff;
      background: linear-gradient(135deg, rgba(72, 118, 255, 0.4) 0%, rgba(100, 149, 237, 0.3) 100%);
      border-color: rgba(100, 149, 237, 0.5);
      font-weight: 600;
      box-shadow: 0 2px 6px rgba(72, 118, 255, 0.3);
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

      &.night_student {
        filter: drop-shadow(0 0 4px rgba(139, 92, 246, 0.8));
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

      &.night-student {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.4) 0%, rgba(109, 40, 217, 0.4) 100%);
        border: 1px solid rgba(139, 92, 246, 0.6);
      }
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
  bottom: clamp(20px, 3vh, 30px);
  right: clamp(20px, 3vw, 30px);
  width: clamp(50px, 6vw, 60px);
  height: clamp(50px, 6vw, 60px);
  background: linear-gradient(135deg, #4876ff 0%, #6495ed 100%);
  border-radius: 50%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  box-shadow: 0 8px 24px rgba(72, 118, 255, 0.5);
  z-index: 9998;
  animation: pulse-badge 2s infinite;
  transition: all 0.3s ease;
  
  &:hover {
    transform: scale(1.1);
    box-shadow: 0 12px 32px rgba(72, 118, 255, 0.7);
  }
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
  font-size: clamp(20px, 2.5vw, 24px);
  color: #fff;
  animation: ring 2s ease-in-out infinite;
}

.minimized-badge .badge-count {
  position: absolute;
  top: clamp(-8px, -1vh, -5px);
  right: clamp(-8px, -1vw, -5px);
  background: linear-gradient(135deg, #ff4d4f 0%, #ff7875 100%);
  color: #fff;
  min-width: clamp(20px, 2.5vw, 24px);
  height: clamp(20px, 2.5vw, 24px);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: clamp(10px, 1.2vw, 12px);
  font-weight: 700;
  border: 2px solid #fff;
  padding: 0 4px;
  box-shadow: 0 2px 8px rgba(255, 77, 79, 0.5);
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
    max-height: calc(100vh - 80px);
  }
  
  .compact-row .main-info {
    flex-wrap: wrap;
    gap: 6px;
  }
  
  .photo-wrapper {
    max-width: 100% !important;
  }
  
  .info-grid {
    grid-template-columns: 1fr !important;
  }
}

/* 针对超小屏幕优化 */
@media (max-width: 480px) {
  .reservation-alert-modal-compact {
    width: calc(100vw - 20px);
    left: 10px;
    right: 10px;
    top: 10px;
    max-height: calc(100vh - 20px);
  }
  
  .alert-header {
    padding: 10px 12px;
  }
  
  .alert-title .title-text {
    font-size: 14px;
  }
  
  .alert-body {
    padding: 8px;
  }
  
  .minimized-badge {
    width: 50px;
    height: 50px;
    bottom: 15px;
    right: 15px;
  }
}

@media (max-width: 360px) {
  .header-section {
    .header-center {
      .main-title {
        font-size: 11px;
      }
    }
  }
}

// 修改密码弹窗样式
.password-modal {
  width: clamp(300px, 90vw, 420px);
  max-width: 95vw;

  .modal-body {
    padding: 20px;
  }

  .form-group {
    margin-bottom: 16px;

    label {
      display: block;
      margin-bottom: 8px;
      color: #e2e8f0;
      font-size: 14px;
      font-weight: 500;
    }

    .password-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;

      input {
        flex: 1;
        width: 100%;
        padding: 10px 45px 10px 14px;
        font-size: 14px;
        color: #fff;
        background: rgba(255, 255, 255, 0.05);
        border: 1px solid rgba(255, 255, 255, 0.15);
        border-radius: 8px;
        box-sizing: border-box;
        transition: all 0.3s ease;

        &::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }

        &:focus {
          outline: none;
          border-color: #3b82f6;
          background: rgba(255, 255, 255, 0.08);
          box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
        }

        &.error {
          border-color: #ef4444;
          box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
        }
      }

      .toggle-password-btn {
        position: absolute;
        right: 10px;
        background: transparent;
        border: none;
        color: rgba(255, 255, 255, 0.6);
        font-size: 18px;
        cursor: pointer;
        padding: 5px;
        display: flex;
        align-items: center;
        justify-content: center;
        transition: all 0.3s ease;
        z-index: 1;

        &:hover {
          color: rgba(255, 255, 255, 0.9);
          transform: scale(1.1);
        }

        &:active {
          transform: scale(0.95);
        }

        span {
          display: block;
          line-height: 1;
        }
      }
    }

    input {
      width: 100%;
      padding: 10px 14px;
      font-size: 14px;
      color: #fff;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);
      border-radius: 8px;
      box-sizing: border-box;
      transition: all 0.3s ease;

      &::placeholder {
        color: rgba(255, 255, 255, 0.4);
      }

      &:focus {
        outline: none;
        border-color: #3b82f6;
        background: rgba(255, 255, 255, 0.08);
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
      }

      &.error {
        border-color: #ef4444;
        box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.2);
      }
    }

    .error-text {
      display: block;
      margin-top: 6px;
      color: #ef4444;
      font-size: 12px;
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 16px 20px;
    border-top: 1px solid rgba(255, 255, 255, 0.1);
    background: rgba(0, 0, 0, 0.2);

    .btn {
      padding: 10px 20px;
      font-size: 14px;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      border: none;

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }

    .btn-success {
      color: #fff;
      background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #2563eb 0%, #1e40af 100%);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
      }
    }

    .btn-cancel {
      color: #94a3b8;
      background: rgba(255, 255, 255, 0.05);
      border: 1px solid rgba(255, 255, 255, 0.15);

      &:hover {
        color: #fff;
        background: rgba(255, 255, 255, 0.1);
        border-color: rgba(255, 255, 255, 0.25);
      }
    }
  }
}

// 密码确认对话框样式 - 确保在最上层
::v-deep .password-confirm-dialog {
  z-index: 10001 !important;
}

::v-deep .v-modal {
  z-index: 10000 !important;
}
</style>