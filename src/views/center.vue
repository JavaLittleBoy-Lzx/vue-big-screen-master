<template>
  <div class="camera-monitor">
    <!-- 顶部控制栏 -->
    <div class="time-selector">
      <div class="time-options">
        <button v-for="option in timeOptions" :key="option.value" @click="tabTimeRange = option.value"
          :class="['time-btn', { active: tabTimeRange === option.value }]">
          {{ option.label }}
        </button>
      </div>
      
      <!-- 数据分析下拉菜单 -->
      <div class="analysis-menu">
        <button class="analysis-btn" @click="toggleAnalysisMenu">
          <span class="btn-icon">📊</span>
          <span class="btn-text">数据分析</span>
          <span class="arrow" :class="{ 'arrow-up': showAnalysisMenu }">▼</span>
        </button>
        <transition name="dropdown">
          <div v-if="showAnalysisMenu" class="analysis-dropdown">
            <div class="menu-item" @click="openRankingModal('violation')">
              <span class="item-icon">🏆</span>
              <span class="item-text">违规排行榜</span>
            </div>
            <div class="menu-item" @click="openRankingModal('frequency')">
              <span class="item-icon">🔄</span>
              <span class="item-text">进出频次排行</span>
            </div>
          </div>
        </transition>
      </div>
      
      <!-- 时间范围选择器 -->
      <div class="time-range-selector">
        <select v-model="selectedTimeRange" @change="onTimeRangeChange" class="time-select">
          <option value="today">今日</option>
          <option value="week">本周</option>
          <option value="month">本月</option>
          <option value="year">本年度</option>
        </select>
      </div>
    </div>

    <!-- 统一KPI统计区域 -->
    <div class="unified-kpi-section">
      <!-- 车辆相关KPI -->
      <div class="vehicle-kpi-card vehicle-entry" @click="openDetailModal('vehicle-entry')">
        <div class="kpi-header">
          <span class="kpi-icon">🚗</span>
          <span class="kpi-title">{{ currentTimeLabel }}进场</span>
        </div>
        <div class="kpi-value">{{ formatNumber(currentVehicleEntry) }}</div>
        <div class="kpi-unit">辆</div>
      </div>

      <div class="vehicle-kpi-card vehicle-exit" @click="openDetailModal('vehicle-exit')">
        <div class="kpi-header">
          <span class="kpi-icon">🚪</span>
          <span class="kpi-title">{{ currentTimeLabel }}出场</span>
        </div>
        <div class="kpi-value">{{ formatNumber(currentVehicleExit) }}</div>
        <div class="kpi-unit">辆</div>
      </div>

      <div class="vehicle-kpi-card vehicle-on-site" @click="openDetailModal('vehicle-onsite')">
        <div class="kpi-header">
          <span class="kpi-icon">📊</span>
          <span class="kpi-title">{{ currentTimeLabel }}在场</span>
        </div>
        <div class="kpi-value">{{ formatNumber(currentVehicleOnSite) }}</div>
        <div class="kpi-unit">辆</div>
      </div>

      <div class="vehicle-kpi-card vehicle-violation" @click="openDetailModal('violation')">
        <div class="kpi-header">
          <span class="kpi-icon">⚠️</span>
          <span class="kpi-title">{{ currentTimeLabel }}违规</span>
        </div>
        <div class="kpi-value">{{ formatNumber(currentVehicleViolation) }}</div>
        <div class="kpi-unit">起</div>
        <!-- 快捷链接 -->
        <div class="kpi-quick-link" @click.stop="openRankingModal('violation')">
          <span class="link-icon">🏆</span>
          <span class="link-text">查看排行</span>
        </div>
      </div>

      <!-- 人脸识别KPI -->
      <div class="face-kpi-card face-entry" @click="openDetailModal('face-entry')">
        <div class="kpi-header">
          <span class="kpi-icon">👤</span>
          <span class="kpi-title">{{ currentTimeLabel }}人脸进场</span>
        </div>
        <div class="kpi-value">{{ formatNumber(currentFaceEntry) }}</div>
        <div class="kpi-unit">人次</div>
      </div>

      <div class="face-kpi-card face-exit" @click="openDetailModal('face-exit')">
        <div class="kpi-header">
          <span class="kpi-icon">📤</span>
          <span class="kpi-title">{{ currentTimeLabel }}人脸出场</span>
        </div>
        <div class="kpi-value">{{ formatNumber(currentFaceExit) }}</div>
        <div class="kpi-unit">人次</div>
      </div>
    </div>

    <!-- 通道照片监控区域 -->
    <div class="camera-section">
      <dv-border-box-12 class="camera-section" style="height: 310px;" :color="['#4fd2dd', '#235fa7']"
        backgroundColor="rgba(0, 0, 0, 0.3)">
        <!-- 车辆照片区域 -->
        <div class="vehicle-camera-section">
          <div class="section-header">
            <div class="section-title">
              <span class="title-icon">🚗</span>
              <span class="title-text">车辆监控</span>
            </div>
          </div>
          <div class="camera-single">
            <div class="camera-header">
              <div class="channel-info">
                <span
                  :class="['channel-badge', (currentVehicleCamera.channel || '').includes('入口') ? 'entry' : 'exit']">
                  {{ currentVehicleCamera.channel }}
                </span>
              </div>
              <div class="plate-info">
                <span :class="`plate-number ${getPlateType(currentVehicleCamera.plateNumber, currentVehicleCamera)}`">
                  {{ currentVehicleCamera.plateNumber }}
                </span>
              </div>
              <div class="timestamp">{{ currentVehicleCamera.timestamp }}</div>
            </div>
            <div class="camera-image" ref="vehicleCameraImage">
              <img v-if="getVehicleImage(currentVehicleCamera)" :src="getVehicleImage(currentVehicleCamera)" 
                :alt="currentVehicleCamera.plateNumber"
                @error="onVehicleImageError" @load="onVehicleImageLoad" @click="openChannelModal" />
              <div v-else class="vehicle-placeholder" @click="openChannelModal">
                <div class="loading-animation">
                  <div class="vehicle-icon">🚗</div>
                  <span>暂无车辆照片</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </dv-border-box-12>
      <dv-border-box-12 class="camera-section" style="height: 280px;" :color="['#4fd2dd', '#235fa7']"
        backgroundColor="rgba(0, 0, 0, 0.3)">
        <!-- 人脸照片区域 -->
        <div class="face-camera-section">
          <div class="section-header">
            <div class="section-title">
              <span class="title-icon">👤</span>
              <span class="title-text">人脸监控</span>
            </div>
          </div>
          <div class="camera-single face-layout">
            <div class="camera-header">
              <div class="channel-info">
                <span :class="['channel-badge', (currentFaceCamera.channel || '').includes('入口') ? 'entry' : 'exit']">
                  {{ currentFaceCamera.channel }}
                </span>
              </div>
              <div class="timestamp">{{ currentFaceCamera.timestamp }}</div>
            </div>
            <div class="camera-content-wrapper">
              <!-- 左侧图片区域 - 缩小一半 -->
              <div class="camera-image left">
                <img v-if="currentFaceCamera.imageUrl" :src="currentFaceCamera.imageUrl" :alt="currentFaceCamera.personName"
                  @click="openFaceDetailModal" />
                <div v-else class="no-face-placeholder">
                  <div class="no-face-text">
                    <span class="no-face-icon">👤</span>
                    <span>暂无人脸数据</span>
                  </div>
                </div>
              </div>
              <!-- 右侧信息区域 -->
              <div class="face-info-panel">
                <div class="info-item name-time-row">
                  <span class="info-value name-value">{{ currentFaceCamera.personName }}</span>
                  <span class="info-value time-status">{{ currentFaceCamera.timestamp }} | {{ (currentFaceCamera.channel
                    || '').includes('入口') ? '进' : '出' }}</span>
                </div>
                <div class="info-divider"></div>
                <div class="info-item">
                  <span class="info-label">人员类型：</span>
                  <span class="info-value person-type" :class="getPersonTypeClass(currentFaceCamera.personType)">
                    {{ currentFaceCamera.personType || '未知' }}
                  </span>
                </div>
                <div class="info-item">
                  <span class="info-label">{{ currentFaceCamera.personType === '学生' ? '学院：' : '部门：' }}</span>
                  <span class="info-value">{{ currentFaceCamera.department || (currentFaceCamera.personType === '学生' ?
                    '未知学院' : '未知部门') }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">识别方式：</span>
                  <span class="info-value recognition-method"
                    :class="getRecognitionMethodClass(currentFaceCamera.recognitionMethod)">
                    {{ currentFaceCamera.recognitionMethod || '未知' }}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </dv-border-box-12>

    </div>

    <!-- 数据表格区域 - 一行显示 -->
    <div class="tables-container">
      <!-- 车辆实时数据表格 -->
      <div class="vehicle-data-table">
        <div class="table-header">
          <div class="header-cell">车牌号</div>
          <div class="header-cell">通道名称</div>
          <div class="header-cell">校内车辆类型</div>
          <div class="header-cell">时间</div>
        </div>
        <div class="table-body" ref="vehicleTableBody" @mouseenter="stopVehicleAutoScroll"
          @mouseleave="startVehicleAutoScroll">
          <div v-if="vehicleLoading" class="table-loading">
            <div class="skeleton-row" v-for="n in 5" :key="'v-skel-' + n">
              <div class="skeleton-cell w-20"></div>
              <div class="skeleton-cell w-14"></div>
              <div class="skeleton-cell w-18"></div>
              <div class="skeleton-cell w-24"></div>
            </div>
          </div>
          <div class="table-content" v-show="!vehicleLoading && displayedVehicleRecords.length > 0">
            <div v-for="(vehicle, index) in displayedVehicleRecords" :key="index" class="table-row"
              :class="{ 'new-record': vehicle.isNew }">
              <div class="table-cell license">
                <span :class="`plate-number ${getPlateType(vehicle.license, vehicle)}`">
                  {{ vehicle.license }}
                </span>
              </div>
              <div class="table-cell channel" :class="vehicle.channelType">{{ vehicle.channel }}</div>
              <div class="table-cell vip-type">
                <span class="vip-badge" :class="vehicle.vehicleType">{{ vehicle.vehicleType }}</span>
              </div>
              <div class="table-cell time" :class="vehicle.action === '进场' ? 'entry' : 'exit'">
                <div class="time-date">{{ vehicle.time.split(' ')[0] }}</div>
                <div class="time-clock">{{ vehicle.time.split(' ')[1] }}</div>
              </div>
            </div>
            <!-- 复制一份用于无缝循环滚动 -->
            <div v-for="(vehicle, index) in displayedVehicleRecords" :key="'dup-' + index" class="table-row">
              <div class="table-cell license">
                <span :class="`plate-number ${getPlateType(vehicle.license, vehicle)}`">
                  {{ vehicle.license }}
                </span>
              </div>
              <div class="table-cell channel" :class="vehicle.channelType">{{ vehicle.channel }}</div>
              <div class="table-cell vip-type">
                <span class="vip-badge" :class="vehicle.vehicleType">{{ vehicle.vehicleType }}</span>
              </div>
              <div class="table-cell time" :class="vehicle.action === '进场' ? 'entry' : 'exit'">
                <div class="time-date">{{ vehicle.time.split(' ')[0] }}</div>
                <div class="time-clock">{{ vehicle.time.split(' ')[1] }}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- 人脸实时数据表格 -->
      <div class="face-data-table">
        <div class="table-header">
          <div class="header-cell">姓名</div>
          <div class="header-cell">通道名称</div>
          <div class="header-cell">识别状态</div>
          <div class="header-cell">时间</div>
        </div>
        <div class="table-body" ref="faceTableBody" @mouseenter="stopFaceAutoScroll" @mouseleave="startFaceAutoScroll">
          <div v-if="faceLoading" class="table-loading">
            <div class="skeleton-row" v-for="n in 5" :key="'p-skel-' + n">
              <div class="skeleton-cell w-16"></div>
              <div class="skeleton-cell w-14"></div>
              <div class="skeleton-cell w-10"></div>
              <div class="skeleton-cell w-24"></div>
            </div>
          </div>
          <div class="table-content" v-show="!faceLoading && displayedPersonRecords.length > 0">
            <div v-for="(person, index) in displayedPersonRecords" :key="index" class="table-row"
              :class="{ 'new-record': person.isNew }">
              <div class="table-cell name">{{ person.name }}</div>
              <div class="table-cell channel" :class="person.channelType">{{ person.channel }}</div>
              <div class="table-cell status">
                <span class="badge recognition-badge" :class="getRecognitionBadgeClass(person.recognitionMethod)">
                  {{ person.recognitionMethod || person.action }}
                </span>
              </div>
              <div class="table-cell time" :class="person.action === '进场' ? 'entry' : 'exit'">
                {{ person.time }}
              </div>
            </div>
            <!-- 复制一份用于无缝循环滚动 -->
            <div v-for="(person, index) in displayedPersonRecords" :key="'dup-' + index" class="table-row">
              <div class="table-cell name">{{ person.name }}</div>
              <div class="table-cell channel" :class="person.channelType">{{ person.channel }}</div>
              <div class="table-cell status">
                <span class="badge recognition-badge" :class="getRecognitionBadgeClass(person.recognitionMethod)">
                  {{ person.recognitionMethod || person.action }}
                </span>
              </div>
              <div class="table-cell time" :class="person.action === '进场' ? 'entry' : 'exit'">
                {{ person.time }}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 热力图区域 -->
    <div class="heatmap-section">
      <!-- 车辆热力图 -->
      <dv-border-box-8 class="vehicle-heatmap" :color="['#4fd2dd', '#235fa7']" backgroundColor="rgba(0, 0, 0, 0.3)">
        <div class="heatmap-title">
          <span class="title-icon">🚗</span>
          <span class="title-text">车辆热力图</span>
        </div>
        <Heatmap3D :vehicle-heatmap-data="vehicleHeatmapData.length > 0 ? vehicleHeatmapData : [{ type: 'vehicle' }]"
          :person-heatmap-data="[]" :hour-labels="heatmapHourLabels" :min-hour="heatmapMinHour"
          :max-hour="heatmapMaxHour" />
      </dv-border-box-8>

      <!-- 人脸热力图 -->
      <dv-border-box-8 class="face-heatmap" :color="['#4fd2dd', '#235fa7']" backgroundColor="rgba(0, 0, 0, 0.3)">
        <div class="heatmap-title">
          <span class="title-icon">👤</span>
          <span class="title-text">人脸热力图</span>
        </div>
        <Heatmap3D :vehicle-heatmap-data="[]" :person-heatmap-data="personHeatmapData"
          :face-heatmap-locations="faceHeatmapLocations" />
      </dv-border-box-8>
    </div>

    <!-- 人脸详情弹窗 -->
    <div v-if="showFaceDetailModal" class="channel-modal-mask" @click.self="closeFaceDetailModal">
      <div class="face-detail-modal">
        <div class="face-detail-modal__header">
          <div class="face-detail-modal__title">人脸监控详情</div>
          <div class="face-detail-modal__filters">
            <button class="channel-filter-btn" :class="{ active: faceDetailFilter === 'all' }"
              @click="setFaceDetailFilter('all')">全部</button>
            <button class="channel-filter-btn" :class="{ active: faceDetailFilter === 'entry' }"
              @click="setFaceDetailFilter('entry')">进场</button>
            <button class="channel-filter-btn" :class="{ active: faceDetailFilter === 'exit' }"
              @click="setFaceDetailFilter('exit')">出场</button>
          </div>
          <div class="face-detail-modal__close" @click="closeFaceDetailModal">✖</div>
        </div>
        <div class="face-detail-modal__body">
          <!-- 加载动画 -->
          <div v-if="faceChannelLoading" class="face-detail-loading">
            <div class="loading-spinner">
              <div class="spinner-ring"></div>
              <div class="spinner-ring"></div>
              <div class="spinner-ring"></div>
            </div>
            <div class="loading-text">正在加载通道数据...</div>
          </div>
          <!-- 通道数据网格 -->
          <div v-else class="face-detail-grid">
            <div class="face-detail-card" :class="[getCardStatusClass(item), { 'no-data': !item.hasData }]"
              v-for="(item, idx) in faceDetailListByChannel" :key="item.channel">
              <!-- 卡片头部：通道名称 -->
              <div class="face-detail-card__header">
                <span class="face-channel-badge" :class="item.channelType === 'entry' ? 'badge-entry' : 'badge-exit'">
                  {{ item.channel || '未知通道' }}
                </span>
                <span class="face-card-time" :class="item.statusText === '进场' ? 'time-entry' : 'time-exit'">
                  {{ item.timestamp }} | {{ item.statusText }}
                </span>
              </div>
              <!-- 卡片内容 -->
              <div class="face-detail-card__content">
                <div class="face-detail-card__image">
                  <!-- 优先检查照片URL，只要有照片就显示 -->
                  <img v-if="getFaceImage(item)" :src="getFaceImage(item)" :alt="item.personName"
                    @error="onFaceImageError" @load="onFaceImageLoad" />
                  <div v-else class="face-card__placeholder">{{ item.hasData ? '无照片' : '暂无数据' }}</div>
                  <div v-if="getStatusLabel(item)" class="status-label" :class="getStatusLabelClass(item)">
                    {{ getStatusLabel(item) }}
                  </div>
                </div>
                <div class="face-detail-card__info">
                  <div class="name-time-row">
                    <span class="name-value">{{ item.personName }}</span>
                  </div>
                  <div class="info-divider"></div>
                  <div class="info-item">
                    <span class="info-label">人员类型:</span>
                    <span class="info-value person-type" :class="getPersonTypeClass(item.personType)">
                      {{ item.personType || '未知' }}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">{{ item.personType === '学生' ? '学院:' : '部门:' }}</span>
                    <span class="info-value" :class="{ 'no-data': !item.department }">
                      {{ item.department || (item.personType === '学生' ? '未知学院' : '未知部门') }}
                    </span>
                  </div>
                  <div class="info-item">
                    <span class="info-label">识别方式:</span>
                    <span class="info-value recognition-method"
                      :class="getRecognitionMethodClass(item.recognitionMethod)">
                      {{ item.recognitionMethod || '未知' }}
                    </span>
                  </div>
                </div>
              </div>
              <border-box-10>
                <div class="corner-cut"></div>
              </border-box-10>
            </div>
          </div>
        </div>
        <div class="face-detail-modal__footer">
          <div class="pagination">
            <button class="page-btn" :disabled="faceDetailPage <= 1"
              @click="faceDetailPage = Math.max(1, faceDetailPage - 1)">上一页</button>
            <span class="page-info">{{ faceDetailPage }} / {{ faceDetailTotalPages }}</span>
            <button class="page-btn" :disabled="faceDetailPage >= faceDetailTotalPages"
              @click="faceDetailPage = Math.min(faceDetailTotalPages, faceDetailPage + 1)">下一页</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 通道弹窗 -->
    <div v-if="showChannelModal" class="channel-modal-mask" @click.self="closeChannelModal">
      <div class="channel-modal">
        <div class="channel-modal__header">
          <div class="channel-modal__title">通道实时/历史照片（最多9路）</div>
          <div class="channel-modal__filters">
            <button class="channel-filter-btn" :class="{ active: channelModalFilter === 'all' }"
              @click="setChannelModalFilter('all')">全部</button>
            <button class="channel-filter-btn" :class="{ active: channelModalFilter === 'entry' }"
              @click="setChannelModalFilter('entry')">入口</button>
            <button class="channel-filter-btn" :class="{ active: channelModalFilter === 'exit' }"
              @click="setChannelModalFilter('exit')">出口</button>
          </div>
          <div class="channel-modal__close" @click="closeChannelModal">✖</div>
        </div>
        <div class="channel-modal__body">
          <!-- 车辆通道加载动画 -->
          <div v-if="vehicleChannelLoading" class="vehicle-channel-loading">
            <div class="loading-spinner">
              <div class="spinner-ring"></div>
              <div class="spinner-ring"></div>
              <div class="spinner-ring"></div>
            </div>
            <div class="loading-text">正在加载车辆通道数据...</div>
          </div>
          <div v-else class="channel-grid">
            <div class="channel-card" v-for="(card, idx) in modalPagedCards"
              :key="(card.channel || 'ph') + (card.timestamp || idx)">
              <div class="channel-card__header">
                <span class="channel-card__badge">{{ card.channel || '空位' }}</span>
                <span class="channel-card__time">{{ card.timestamp }}</span>
              </div>
              <div class="channel-card__image">
                <img v-if="getChannelImage(card)" :src="getChannelImage(card)" :alt="card.channel"
                  @error="onChannelImageError" @load="onChannelImageLoad" />
                <div v-else class="channel-card__placeholder">无数据</div>
              </div>
              <div class="channel-card__footer">
                <span class="channel-card__plate plate-number" 
                      :class="getPlateType(card.plateNumber, card)">{{ card.plateNumber }}</span>
              </div>
            </div>
          </div>
        </div>
        <div class="channel-modal__footer">
          <div class="pagination">
            <button class="page-btn" :disabled="modalPage <= 1"
              @click="modalPage = Math.max(1, modalPage - 1)">上一页</button>
            <span class="page-info">{{ modalPage }} / {{ modalTotalPages }}</span>
            <button class="page-btn" :disabled="modalPage >= modalTotalPages"
              @click="modalPage = Math.min(modalTotalPages, modalPage + 1)">下一页</button>
          </div>
        </div>
      </div>
    </div>

    <!-- 数据详情弹窗 -->
    <div v-if="showDetailModal" class="detail-modal-mask" @click.self="closeDetailModal">
      <div class="detail-modal">
        <div class="detail-modal__header">
          <div class="detail-modal__title">
            {{ detailModalTitle }}
            <span v-if="lastRefreshTime" class="refresh-time">（更新：{{ lastRefreshTime }}）</span>
          </div>
          <div class="detail-modal__close" @click="closeDetailModal">✖</div>
        </div>
        
        <!-- 🔥 大数据量提示信息 -->
        <div v-if="isLargeDataModal" class="detail-modal__warning">
          <div class="warning-icon">⚠️</div>
          <div class="warning-text">
            <span v-if="detailType.includes('-summary')">
              📊 当前为统计摘要模式，如需查看详细记录请切换到"今日"或"本周"
            </span>
            <span v-else>
              📋 数据量较大，当前仅显示最新 {{ getDisplayedRecordCount() }} 条记录
              <br>
              💡 如需查看完整数据，请使用筛选条件缩小范围或切换到较短时间段
            </span>
          </div>
        </div>

        <!-- 筛选区域 -->
        <div class="detail-modal__filters">
          <!-- 违规相关的筛选条件 -->
          <template v-if="detailType === 'violation'">
            <div class="filter-item">
              <label>车牌号：</label>
              <input v-model="detailFilters.plateNumber" type="text" placeholder="请输入车牌号" @keyup.enter="loadDetailData"
                class="filter-input filter-input-plate" />
            </div>
            <div class="filter-item">
              <label>添加人：</label>
              <select v-model="detailFilters.createBy" class="filter-select filter-select-creator">
                <option value="">全部添加人</option>
                <option v-for="creator in availableCreators" :key="creator" :value="creator">
                  {{ creator }}
                </option>
              </select>
            </div>
          </template>

          <!-- 车辆相关的筛选条件 -->
          <template v-else-if="!detailType.includes('face')">
            <div class="filter-item">
              <label>车牌号：</label>
              <input v-model="detailFilters.plateNumber" type="text" placeholder="请输入车牌号" @keyup.enter="loadDetailData"
                class="filter-input filter-input-plate" />
            </div>
            
            <!-- 🔥 车辆出场特殊处理：显示通道类型选择和通道选择 -->
            <template v-if="detailType === 'vehicle-exit'">
              <div class="filter-item">
                <label>通道类型：</label>
                <select v-model="detailFilters.channelType" class="filter-select filter-select-channel-type">
                  <option value="enter">进场通道</option>
                  <option value="exit">出场通道</option>
                </select>
              </div>
              <div class="filter-item">
                <label>{{ detailFilters.channelType === 'enter' ? '进场通道：' : '出场通道：' }}</label>
                <select v-model="detailFilters.channel" class="filter-select filter-select-channel">
                  <option value="">全部通道</option>
                  <option v-for="channel in availableChannels" :key="channel" :value="channel">
                    {{ channel }}
                  </option>
                </select>
              </div>
            </template>
            <!-- 其他车辆类型：普通通道选择 -->
            <template v-else>
              <div class="filter-item">
                <label>通道：</label>
                <select v-model="detailFilters.channel" class="filter-select filter-select-channel">
                  <option value="">全部通道</option>
                  <option v-for="channel in availableChannels" :key="channel" :value="channel">
                    {{ channel }}
                  </option>
                </select>
              </div>
            </template>
          </template>

          <!-- 人脸相关的筛选条件 -->
          <template v-else>
            <div class="filter-item">
              <label>姓名：</label>
              <input v-model="detailFilters.personName" type="text" placeholder="请输入姓名" @keyup.enter="loadDetailData"
                class="filter-input filter-input-name" />
            </div>
            <div class="filter-item">
              <label>手机号：</label>
              <input v-model="detailFilters.phoneNo" type="text" placeholder="请输入手机号" @keyup.enter="loadDetailData"
                class="filter-input filter-input-phone" />
            </div>
            <div class="filter-item">
              <label>身份证号：</label>
              <input v-model="detailFilters.idNumber" type="text" placeholder="请输入身份证号" @keyup.enter="loadDetailData"
                class="filter-input filter-input-id" />
            </div>
            <div class="filter-item">
              <label>人员类型：</label>
              <select v-model="detailFilters.personType" class="filter-select filter-select-person-type">
                <option value="">全部类型</option>
                <option value="预约访客">预约访客</option>
                <option value="未预约访客">未预约访客</option>
                <option value="教职工">教职工</option>
                <option value="学生">学生</option>
              </select>
            </div>
            <div class="filter-item">
              <label>学院/部门：</label>
              <input v-model="detailFilters.organization" type="text" placeholder="请输入学院或部门"
                @keyup.enter="loadDetailData" class="filter-input filter-input-org" />
            </div>
            <div class="filter-item">
              <label>通道：</label>
              <select v-model="detailFilters.channel" class="filter-select filter-select-channel">
                <option value="">全部通道</option>
                <option v-for="channel in availableChannels" :key="channel" :value="channel">
                  {{ channel }}
                </option>
              </select>
            </div>
          </template>

          <div class="filter-item">
            <label>时间范围：</label>
            <select v-model="detailFilters.timeRange" @change="onDetailTimeRangeChange"
              class="filter-select filter-select-time">
              <option value="today">今日</option>
              <option value="yesterday">昨日</option>
              <option value="week">本周</option>
              <option value="month">本月</option>
              <option value="year">今年</option>
              <option value="custom">自定义</option>
            </select>
          </div>
          <div class="filter-item" v-if="detailFilters.timeRange === 'custom'">
            <label>开始时间：</label>
            <input v-model="detailFilters.startTime" type="datetime-local" class="filter-input" />
          </div>
          <div class="filter-item" v-if="detailFilters.timeRange === 'custom'">
            <label>结束时间：</label>
            <input v-model="detailFilters.endTime" type="datetime-local" class="filter-input" />
          </div>
          <div class="filter-actions">
            <button @click="loadDetailData" class="btn-search">🔍 查询</button>
            <button @click="resetDetailFilters" class="btn-reset">🔄 重置</button>
          </div>
        </div>

        <!-- 数据表格 -->
        <div class="detail-modal__body">
          <div v-if="detailLoading" class="detail-loading">
            <div class="loading-spinner"></div>
            <div>加载中...</div>
          </div>
          <div v-else-if="detailData.length === 0" class="detail-empty">
            <div class="empty-icon">📭</div>
            <div>暂无数据</div>
          </div>
          <table v-else class="detail-table" :class="{ 'violation-table': detailType === 'violation' }">
            <thead>
              <tr>
                <th v-for="col in detailColumns" :key="col.key" :style="col.width ? { width: col.width } : {}">{{
                  col.label }}
                </th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row, index) in paginatedDetailData" :key="index">
                <td v-for="col in detailColumns" :key="col.key">
                  <!-- 车牌号（违规专用） - 使用小程序样式 -->
                  <span v-if="col.key === 'plateNumber' && detailType === 'violation'" class="violation-plate-badge"
                    :class="getPlateType(row[col.key], row)">
                    {{ row[col.key] || '-' }}
                  </span>
                  <!-- 车牌号（其他） - 使用violation.vue样式 -->
                  <span v-else-if="col.key === 'plateNumber'" class="plate-number"
                    :class="getPlateType(row[col.key], row)">
                    {{ row[col.key] || '-' }}
                  </span>
                  <!-- 严重程度 -->
                  <span v-else-if="col.key === 'severity'" class="severity-badge"
                    :class="getSeverityClass(row.severity)">
                    {{ row.severity || '-' }}
                  </span>
                  <!-- 车主信息 -->
                  <div v-else-if="col.key === 'ownerInfo'" class="owner-info-cell">
                    <div class="owner-detail" v-if="row.ownerInfo && (row.ownerInfo.ownerName || row.ownerInfo.ownerPhone || row.ownerInfo.vipTypeName)">
                      <div class="owner-item" v-if="row.ownerInfo.ownerName">
                        <span class="owner-label">👤 姓名</span>
                        <span class="owner-value">{{ row.ownerInfo.ownerName }}</span>
                      </div>
                      <div class="owner-item" v-if="row.ownerInfo.ownerPhone">
                        <span class="owner-label">📱 手机号</span>
                        <span class="owner-value">{{ row.ownerInfo.ownerPhone }}</span>
                      </div>
                      <div class="owner-item" v-if="row.ownerInfo.vipTypeName">
                        <span class="owner-label">🏷️ 月票名称</span>
                        <span class="owner-value">{{ row.ownerInfo.vipTypeName }}</span>
                      </div>
                      <div class="owner-item" v-if="row.ownerInfo.ownerCategory">
                        <span class="owner-label">📂 车主类型</span>
                        <span class="owner-value">{{ row.ownerInfo.ownerCategory }}</span>
                      </div>
                      <div class="owner-item" v-if="row.ownerInfo.ownerAddress">
                        <span class="owner-label">🏢 学院/部门</span>
                        <span class="owner-value">{{ row.ownerInfo.ownerAddress }}</span>
                      </div>
                    </div>
                    <span v-else>-</span>
                  </div>
                  <!-- 违规类型 -->
                  <span v-else-if="col.key === 'violationType'" class="violation-type-badge"
                    :class="getViolationTypeClass(row.violationType)">
                    {{ row.violationType || '-' }}
                  </span>
                  <!-- 违规位置 -->
                  <span v-else-if="col.key === 'location'" class="violation-location-badge">
                    📍 {{ row.location || '-' }}
                  </span>
                  <!-- 违规描述 -->
                  <div v-else-if="col.key === 'description'" class="violation-description-cell">
                    {{ row.description || '-' }}
                  </div>
                  <!-- 违规照片 -->
                  <div v-else-if="col.key === 'photos' && detailType === 'violation'" class="violation-photos-cell">
                    <div v-if="row.photos && row.photos.length > 0" class="photo-gallery">
                      <img v-for="(photo, idx) in row.photos.slice(0, 3)" :key="idx" :src="photo"
                        class="violation-photo-thumb" @click="previewPhoto(photo)" :alt="`违规照片${idx + 1}`">
                      <span v-if="row.photos.length > 3" class="photo-more-badge" @click="showAllPhotos(row.photos)"
                        title="点击查看全部照片">
                        +{{ row.photos.length - 3 }}
                      </span>
                    </div>
                    <span v-else>无照片</span>
                  </div>
                  <!-- 进场照片 -->
                  <div v-else-if="col.key === 'enterPhoto'" class="entry-photos-cell">
                    <div v-if="row.enterPhoto" class="photo-gallery">
                      <img :src="row.enterPhoto" class="entry-photo-thumb" @click="previewPhoto(row.enterPhoto)"
                        alt="进场照片" title="进场照片">
                    </div>
                    <span v-else>无照片</span>
                  </div>
                  <!-- 出场照片 -->
                  <div v-else-if="col.key === 'leavePhoto'" class="entry-photos-cell">
                    <div v-if="row.leavePhoto" class="photo-gallery">
                      <img :src="row.leavePhoto" class="entry-photo-thumb" @click="previewPhoto(row.leavePhoto)"
                        alt="出场照片" title="出场照片">
                    </div>
                    <span v-else>无照片</span>
                  </div>
                  <!-- 人脸照片 -->
                  <div v-else-if="col.key === 'facePhoto'" class="entry-photos-cell">
                    <div v-if="row.facePhoto" class="photo-gallery">
                      <img :src="row.facePhoto" class="entry-photo-thumb" @click="previewPhoto(row.facePhoto)"
                        alt="人脸照片" title="人脸照片">
                    </div>
                    <span v-else>无照片</span>
                  </div>
                  <!-- 时间字段（不包括停车时长，因为停车时长是已格式化的字符串而非时间戳） -->
                  <span
                    v-else-if="col.key === 'createTime' || col.key === 'eventTime' || col.key === 'enterTime' || col.key === 'exitTime' || col.key === 'leaveTime'">
                    {{ formatDetailTime(row[col.key]) }}
                  </span>
                  <!-- 停车时长字段（已经是格式化好的字符串，直接显示） -->
                  <span v-else-if="col.key === 'parkingTime' || col.key === 'stoppingTime' || col.key === 'duration'"
                    class="duration-badge">
                    ⏱️ {{ row[col.key] || '-' }}
                  </span>
                  <!-- 车牌颜色字段 -->
                  <span
                    v-else-if="col.key === 'enterCarLicenseColor' || col.key === 'exitCarLicenseColor' || col.key === 'leaveCarLicenseColor'"
                    class="license-color-badge">
                    <span class="color-dot" :style="{ backgroundColor: getLicenseColorCode(row[col.key]) }"></span>
                    {{ row[col.key] || '-' }}
                  </span>
                  <!-- 车辆类型字段 -->
                  <span
                    v-else-if="col.key === 'enterCarType' || col.key === 'exitCarType' || col.key === 'leaveCarType' || col.key === 'enterType' || col.key === 'leaveType'"
                    class="car-type-badge">
                    🚗 {{ row[col.key] || '-' }}
                  </span>
                  <!-- VIP类型字段 -->
                  <span
                    v-else-if="col.key === 'enterVipType' || col.key === 'exitVipType' || col.key === 'leaveVipType' || col.key === 'enterCustomVipName' || col.key === 'leaveCustomVipName'"
                    class="vip-type-badge">
                    👑 {{ row[col.key] || '-' }}
                  </span>
                  <!-- 金额字段 -->
                  <span v-else-if="col.key === 'amountReceivable'" class="amount-badge">
                    💰 {{ row[col.key] || '0' }}元
                  </span>
                  <!-- 添加人 -->
                  <span v-else-if="col.key === 'createBy'" class="creator-badge">
                    👤 {{ row.createBy }}
                  </span>
                  <!-- 预约信息 -->
                  <div v-else-if="col.key === 'reservationInfo'" class="reservation-info-cell">
                    <!-- 预约访客 -->
                    <div v-if="row[col.key].type === 'reserved'" class="reservation-details">
                      <div class="reservation-item" v-if="row[col.key].timeRange">
                        <span class="reservation-label">⏰ 预约时段</span>
                        <span class="reservation-value time-value-wrapper">
                          {{ row[col.key].timeRange }}
                        </span>
                      </div>
                      <div class="reservation-item" v-if="row[col.key].formName">
                        <span class="reservation-label">📋 表单类型</span>
                        <span class="reservation-value form-value-enhanced"
                          :class="getFormTypeClass(row[col.key].formName)">{{
                          row[col.key].formName }}</span>
                      </div>
                      <div class="reservation-item" v-if="row[col.key].carPlate">
                        <span class="reservation-label">🚗 车牌</span>
                        <span class="plate-number-badge"
                          :class="getPlateType(row[col.key].carPlate, row[col.key])">
                          {{ row[col.key].carPlate }}
                        </span>
                      </div>
                      <div class="reservation-tag reserved-tag">预约访客</div>
                    </div>
                    <!-- 纯访客 -->
                    <div v-else-if="row[col.key].type === 'pure'" class="reservation-pure">
                      <span class="pure-visitor-tag">纯访客（未预约）</span>
                    </div>
                    <!-- 无预约 -->
                    <span v-else class="reservation-none">-</span>
                  </div>
                  <span v-else-if="col.key === 'phoneNo' || col.key === 'idNumber'" class="sensitive-data">
                    {{ row[col.key] || '-' }}
                  </span>
                  <span v-else>{{ row[col.key] || '-' }}</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- 分页 -->
        <div class="detail-modal__footer">
          <div class="pagination">
            <button class="page-btn" :disabled="detailPage <= 1"
              @click="detailPage = Math.max(1, detailPage - 1)">上一页</button>
            <span class="page-info">{{ detailPage }} / {{ detailTotalPages }}</span>
            <button class="page-btn" :disabled="detailPage >= detailTotalPages"
              @click="detailPage = Math.min(detailTotalPages, detailPage + 1)">下一页</button>
            <span class="page-size-selector">
              每页
              <select v-model="detailPageSize" @change="detailPage = 1">
                <option :value="10">10</option>
                <option :value="50">50</option>
                <option :value="100">100</option>
                <option :value="500">500</option>
                <option :value="1000">1000</option>
              </select>
              条
            </span>
            <span class="page-total">共 {{ detailData.length }} 条</span>
          </div>
        </div>
      </div>
    </div>

    <!-- 排行榜弹窗 -->
    <div v-if="showRankingModal" class="ranking-modal-mask" @click.self="closeRankingModal">
      <div class="ranking-modal">
        <div class="ranking-modal__header">
          <div class="ranking-modal__title">
            <span v-if="rankingType === 'violation'">🏆 违规排行榜</span>
            <span v-else>🔄 进出频次排行</span>
          </div>
          <div class="ranking-modal__close" @click="closeRankingModal">✖</div>
        </div>

        <div class="ranking-modal__toolbar">
          <!-- 违规排行榜工具栏 -->
          <template v-if="rankingType === 'violation'">
            <div class="toolbar-item">
              <label>📅 时间范围：</label>
              <select v-model="rankingTimeRange" @change="onRankingTimeRangeChange">
                <option value="today">今日</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            <div v-if="rankingTimeRange === 'custom'" class="toolbar-item toolbar-item-date">
              <label>开始：</label>
              <input v-model="rankingCustomStartDate" type="date" class="date-input" @change="loadRankingData" />
            </div>
            <div v-if="rankingTimeRange === 'custom'" class="toolbar-item toolbar-item-date">
              <label>结束：</label>
              <input v-model="rankingCustomEndDate" type="date" class="date-input" @change="loadRankingData" />
            </div>
            <div class="toolbar-item">
              <label>排序方式：</label>
              <select v-model="rankingSortBy" @change="loadRankingData">
                <option value="count">违规次数</option>
                <option value="time">最近违规时间</option>
              </select>
            </div>
            <div class="toolbar-item">
              <label>显示数量：</label>
              <select v-model="rankingLimit" @change="loadRankingData">
                <option :value="10">前10名</option>
                <option :value="20">前20名</option>
                <option :value="50">前50名</option>
              </select>
            </div>
          </template>

          <!-- 频次排行榜工具栏 -->
          <template v-else>
            <div class="toolbar-item">
              <label>📅 时间范围：</label>
              <select v-model="rankingTimeRange" @change="onRankingTimeRangeChange">
                <option value="today">今日</option>
                <option value="week">本周</option>
                <option value="month">本月</option>
                <option value="custom">自定义</option>
              </select>
            </div>
            <div v-if="rankingTimeRange === 'custom'" class="toolbar-item toolbar-item-date">
              <label>开始：</label>
              <input v-model="rankingCustomStartDate" type="date" class="date-input" @change="loadRankingData" />
            </div>
            <div v-if="rankingTimeRange === 'custom'" class="toolbar-item toolbar-item-date">
              <label>结束：</label>
              <input v-model="rankingCustomEndDate" type="date" class="date-input" @change="loadRankingData" />
            </div>
            <div class="toolbar-tabs">
              <button :class="['tab-btn', { active: frequencyDimension === 'vehicle' }]"
                @click="frequencyDimension = 'vehicle'; loadRankingData()">
                🚗 车辆维度
              </button>
              <button :class="['tab-btn', { active: frequencyDimension === 'channel' }]"
                @click="frequencyDimension = 'channel'; loadRankingData()">
                🚪 通道维度
              </button>
            </div>
            <div class="toolbar-item">
              <label>显示数量：</label>
              <select v-model="rankingLimit" @change="loadRankingData">
                <option :value="10">前10名</option>
                <option :value="20">前20名</option>
                <option :value="50">前50名</option>
              </select>
            </div>
          </template>
        </div>

        <div class="ranking-modal__body">
          <!-- 加载状态 -->
          <div v-if="rankingLoading" class="ranking-loading">
            <div class="loading-spinner">
              <div class="spinner-ring"></div>
              <div class="spinner-ring"></div>
              <div class="spinner-ring"></div>
            </div>
            <div class="loading-text">正在加载排行数据...</div>
          </div>

          <!-- 违规排行榜内容 -->
          <div v-else-if="rankingType === 'violation'" class="ranking-table">
            <div class="ranking-table-header">
              <div class="header-cell rank">排名</div>
              <div class="header-cell plate">车牌号</div>
              <div class="header-cell owner">业主信息</div>
              <div class="header-cell count">违规次数</div>
              <div class="header-cell time">最近违规</div>
              <div class="header-cell action">操作</div>
            </div>
            <div class="ranking-table-body">
              <div v-for="(item, index) in rankingData" :key="index" 
                :class="['ranking-row', { 'top-three': index < 3 }]">
                <div class="cell rank">
                  <span v-if="index === 0" class="medal gold">🥇</span>
                  <span v-else-if="index === 1" class="medal silver">🥈</span>
                  <span v-else-if="index === 2" class="medal bronze">🥉</span>
                  <span v-else class="rank-number">{{ index + 1 }}</span>
                </div>
                <div class="cell plate">
                  <span :class="`plate-number ${getPlateType(item.plateNumber || item.carLicenseNumber, item)}`">
                    {{ item.plateNumber || item.carLicenseNumber }}
                  </span>
                </div>
                <div class="cell owner">
                  <div class="owner-info" v-if="item.ownerInfo">
                    <div class="owner-name" v-if="item.ownerInfo.ownerName">
                      👤 {{ item.ownerInfo.ownerName }}
                    </div>
                    <div class="owner-phone" v-if="item.ownerInfo.ownerPhone">
                      📱 {{ item.ownerInfo.ownerPhone }}
                    </div>
                    <div class="owner-type" v-if="item.ownerInfo.vipTypeName">
                      🏷️ {{ item.ownerInfo.vipTypeName }}
                    </div>
                  </div>
                  <div class="owner-unknown" v-else>
                    <span class="unknown-text">未知业主</span>
                  </div>
                </div>
                <div class="cell count">
                  <span class="count-badge">{{ item.violationCount || item.count }}</span>
                </div>
                <div class="cell time">{{ formatTime(item.lastViolationTime || item.latestTime) }}</div>
                <div class="cell action">
                  <button class="detail-btn" @click="showViolationDetail(item)">查看详情</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 频次排行榜内容 - 车辆维度 -->
          <div v-else-if="frequencyDimension === 'vehicle'" class="ranking-table">
            <div class="ranking-table-header">
              <div class="header-cell rank">排名</div>
              <div class="header-cell plate">车牌号</div>
              <div class="header-cell owner">业主信息</div>
              <div class="header-cell entry">进场次数</div>
              <div class="header-cell exit">出场次数</div>
              <div class="header-cell total">总次数/操作</div>
            </div>
            <div class="ranking-table-body">
              <div v-for="(item, index) in rankingData" :key="index"
                :class="['ranking-row', { 'top-three': index < 3, 'abnormal': item.abnormalFlag }]">
                <div class="cell rank">
                  <span v-if="index === 0" class="medal gold">🥇</span>
                  <span v-else-if="index === 1" class="medal silver">🥈</span>
                  <span v-else-if="index === 2" class="medal bronze">🥉</span>
                  <span v-else class="rank-number">{{ index + 1 }}</span>
                </div>
                <div class="cell plate">
                  <span :class="`plate-number ${getPlateType(item.plateNumber || item.carLicenseNumber, item)}`">
                    {{ item.plateNumber || item.carLicenseNumber }}
                  </span>
                  <span v-if="item.abnormalFlag" class="abnormal-tag">⚠️异常</span>
                </div>
                <div class="cell owner">
                  <div class="owner-info" v-if="item.ownerInfo">
                    <div class="owner-name" v-if="item.ownerInfo.ownerName">
                      👤 {{ item.ownerInfo.ownerName }}
                    </div>
                    <div class="owner-phone" v-if="item.ownerInfo.ownerPhone">
                      📱 {{ item.ownerInfo.ownerPhone }}
                    </div>
                    <div class="owner-type" v-if="item.ownerInfo.vipTypeName">
                      🏷️ {{ item.ownerInfo.vipTypeName }}
                    </div>
                  </div>
                  <div class="owner-unknown" v-else>
                    <span class="unknown-text">未知业主</span>
                  </div>
                </div>
                <div class="cell entry">{{ item.entryCount || 0 }}</div>
                <div class="cell exit">{{ item.exitCount || 0 }}</div>
                <div class="cell total">
                  <span class="total-badge">{{ item.totalCount || (item.entryCount + item.exitCount) }}</span>
                  <button class="detail-btn" @click="showFrequencyDetail(item)">查看详情</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 频次排行榜内容 - 通道维度 -->
          <div v-else class="ranking-table">
            <div class="ranking-table-header">
              <div class="header-cell rank">排名</div>
              <div class="header-cell channel">通道名称</div>
              <div class="header-cell entry">进场次数</div>
              <div class="header-cell exit">出场次数</div>
              <div class="header-cell total">总次数</div>
              <div class="header-cell action">操作</div>
            </div>
            <div class="ranking-table-body">
              <div v-for="(item, index) in rankingData" :key="index"
                :class="['ranking-row', { 'top-three': index < 3 }]">
                <div class="cell rank">
                  <span v-if="index === 0" class="medal gold">🥇</span>
                  <span v-else-if="index === 1" class="medal silver">🥈</span>
                  <span v-else-if="index === 2" class="medal bronze">🥉</span>
                  <span v-else class="rank-number">{{ index + 1 }}</span>
                </div>
                <div class="cell channel">
                  <span class="channel-badge">{{ item.channelName || item.channel }}</span>
                </div>
                <div class="cell entry">{{ item.entryCount || 0 }}</div>
                <div class="cell exit">{{ item.exitCount || 0 }}</div>
                <div class="cell total">
                  <span class="total-badge">{{ item.totalCount || (item.entryCount + item.exitCount) }}</span>
                </div>
                <div class="cell action">
                  <button class="detail-btn" @click="showChannelDetail(item)">查看详情</button>
                </div>
              </div>
            </div>
          </div>

          <!-- 空状态 -->
          <div v-if="!rankingLoading && rankingData.length === 0" class="ranking-empty">
            <div class="empty-icon">📊</div>
            <div class="empty-text">暂无排行数据</div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览弹窗 -->
    <div v-if="photoPreviewVisible" class="photo-preview-modal" @click="closePhotoPreview">
      <div class="photo-preview-content" @click.stop>
        <span class="photo-preview-close" @click="closePhotoPreview">✕</span>
        <img :src="photoPreviewUrl" alt="违规照片" class="photo-preview-image" />
      </div>
    </div>

    <!-- 进出记录类型选择弹窗 -->
    <div v-if="showRecordTypeSelector" class="record-type-selector-mask" @click.self="cancelRecordTypeSelection">
      <div class="record-type-selector">
        <div class="selector-header">
          <h3>🚗 选择查看记录类型</h3>
          <button class="close-btn" @click="cancelRecordTypeSelection">✕</button>
        </div>
        <div class="selector-body">
          <div class="vehicle-info">
            <p class="plate-label">车牌号码</p>
            <p :class="`plate-value ${getPlateType(selectedVehicleForDetail?.plateNumber, selectedVehicleForDetail)}`">
              {{ selectedVehicleForDetail?.plateNumber || selectedVehicleForDetail?.carLicenseNumber }}
            </p>
          </div>
          <div class="record-stats" v-if="selectedVehicleForDetail">
            <div class="stat-item">
              <span class="stat-label">进场次数</span>
              <span class="stat-value entry">{{ selectedVehicleForDetail.entryCount || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">出场次数</span>
              <span class="stat-value exit">{{ selectedVehicleForDetail.exitCount || 0 }}</span>
            </div>
            <div class="stat-item">
              <span class="stat-label">总计次数</span>
              <span class="stat-value total">{{ selectedVehicleForDetail.totalCount || 0 }}</span>
            </div>
          </div>
          <div class="selector-actions">
            <button class="action-btn entry-btn" @click="selectRecordType('entry')">
              <span class="btn-icon">📥</span>
              <span class="btn-text">进场记录</span>
            </button>
            <button class="action-btn exit-btn" @click="selectRecordType('exit')">
              <span class="btn-icon">📤</span>
              <span class="btn-text">出场记录</span>
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 大数据量警告弹窗 -->
    <div v-if="showLargeDataWarning" class="large-data-warning-mask" @click.self="closeLargeDataWarning">
      <div class="large-data-warning-modal">
        <div class="warning-modal__header">
          <div class="warning-icon">⚠️</div>
          <h3 class="warning-title">数据量较大提醒</h3>
          <div class="warning-close" @click="closeLargeDataWarning">✖</div>
        </div>
        
        <div class="warning-modal__body">
          <div class="warning-info">
            <div class="info-row">
              <span class="info-label">时间范围</span>
              <span class="info-value">{{ largeDataWarningInfo.timeRangeText }}</span>
            </div>
            <div class="info-row">
              <span class="info-label">数据类型</span>
              <span class="info-value">{{ largeDataWarningInfo.typeText }}</span>
            </div>
            <div class="info-row highlight">
              <span class="info-label">预估数据量</span>
              <span class="info-value large">约 {{ largeDataWarningInfo.countText }} 条</span>
            </div>
          </div>
          
          <div class="warning-message">
            <p>💡 数据量较大，直接加载全部数据可能需要较长时间</p>
            <p>🚀 建议选择以下方式之一查看数据：</p>
          </div>
        </div>
        
        <div class="warning-modal__footer">
          <button class="warning-btn summary-btn" @click="confirmViewSummary">
            <span class="btn-icon">📊</span>
            <span class="btn-text">查看统计摘要</span>
            <span class="btn-desc">快速查看汇总信息</span>
          </button>
          <button class="warning-btn records-btn" @click="confirmViewRecords">
            <span class="btn-icon">📋</span>
            <span class="btn-text">查看最新1000条</span>
            <span class="btn-desc">查看最新记录详情</span>
          </button>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { vehicleDataService } from '@/services/vehicleDataService';
import { BorderBox10 } from '@jiaminghi/data-view';
import axios from 'axios';

export default {
  name: 'Center',
  props: {
    yearlyEntry: { type: Number, default: 0 },
    monthlyEntry: { type: Number, default: 0 },
    dailyEntry: { type: Number, default: 0 },
    currentVehicles: { type: Number, default: 0 },
    dailyRevenue: { type: Number, default: 0 },
    // 人脸识别数据
    yearlyFaceEntry: { type: Number, default: 0 },
    monthlyFaceEntry: { type: Number, default: 0 },
    dailyFaceEntry: { type: Number, default: 0 },
    currentFaceUsers: { type: Number, default: 0 },
    faceAccuracy: { type: Number, default: 0 },
    // 通道统计，用于飞线图
    channels: { type: Array, default: () => [] },
    // 车辆热力图数据（从父组件传入的真实数据）
    vehicleHeatmapData: { type: Array, default: () => [] },
    heatmapHourLabels: { type: Array, default: () => null },
    heatmapMinHour: { type: Number, default: 0 },
    heatmapMaxHour: { type: Number, default: 23 }
  },
  components: {
    Heatmap3D: () => import('./Heatmap3D.vue'),
    ChannelFlyline: () => import('./ChannelFlyline.vue'),
    BorderBox10
  },
  data() {
    return {
      // Tab时间选择器（左侧按钮）
      tabTimeRange: 'daily',
      timeOptions: [
        { label: '今日', value: 'daily' },
        { label: '本周', value: 'weekly' },
        { label: '本月', value: 'monthly' },
        { label: '今年', value: 'yearly' }
      ],
      // 下拉时间选择器（右侧select）- 用于向父组件emit
      selectedTimeRange: 'today',
      // 通道名称列表（重命名以避免与props中的channels冲突）
      channelNames: ['1号门', '2号门', '3号门', '4号门', '5号门', '6号门'],
      // 车辆照片数据（不设置默认数据，避免显示错误的默认照片）
      vehicleCameras: [],
      // 人脸照片数据
      faceCameras: [
        {
          channel: '1号门入口',
          timestamp: '10:30:15',
          personName: '张三',
          personInfo: '员工',
          imageUrl: require('@/assets/Snipaste_2025-10-27_15-45-59.png'),
          startTime: '10:15:00',
          endTime: '12:00:00',
          visitedPerson: '李经理',
          collegeName: '计算机学院',
          channelType: 'entry',
          statusText: '进场',
          isActive: true
        },
        {
          channel: '2号门出口',
          timestamp: '10:29:08',
          personName: '李四',
          personInfo: '访客',
          imageUrl: require('@/assets/Snipaste_2025-10-27_15-45-59.png'),
          startTime: '09:30:00',
          endTime: '10:29:08',
          visitedPerson: '王主任',
          collegeName: '机械学院',
          channelType: 'exit',
          statusText: '出场',
          isActive: true
        },
        {
          channel: '3号门入口',
          timestamp: '10:28:35',
          personName: '王五',
          personInfo: '员工',
          imageUrl: require('@/assets/Snipaste_2025-10-27_15-45-59.png'),
          startTime: '10:20:00',
          endTime: '11:30:00',
          visitedPerson: '李小双',
          collegeName: '电气学院',
          channelType: 'entry',
          statusText: '进场',
          isActive: true
        },
        {
          channel: '4号门出口',
          timestamp: '10:27:22',
          personName: '赵六',
          personInfo: '访客',
          imageUrl: require('@/assets/Snipaste_2025-10-27_15-45-59.png'),
          startTime: '09:00:00',
          endTime: '10:27:22',
          visitedPerson: '张总',
          collegeName: '管理学院',
          channelType: 'exit',
          statusText: '出场',
          isActive: true
        }
      ],
      // 实时滚动数据
      isScrolling: true,
      mixedRealtimeData: [
        { type: 'vehicle', name: '黑A12345', channel: '1号门入口', status: 'entry', statusText: '进场', time: '10:30:25' },
        { type: 'face', name: '张三', channel: '1号门入口', status: 'entry', statusText: '进场', time: '10:30:15' },
        { type: 'vehicle', name: '黑B67890', channel: '2号门出口', status: 'exit', statusText: '出场', time: '10:29:18' },
        { type: 'face', name: '李四', channel: '2号门出口', status: 'exit', statusText: '出场', time: '10:29:08' },
        { type: 'vehicle', name: '黑C11111', channel: '3号门入口', status: 'entry', statusText: '进场', time: '10:28:45' },
        { type: 'face', name: '王五', channel: '3号门入口', status: 'entry', statusText: '进场', time: '10:28:35' },
        { type: 'vehicle', name: '黑D22222', channel: '4号门出口', status: 'exit', statusText: '出场', time: '10:27:32' },
        { type: 'face', name: '赵六', channel: '4号门出口', status: 'exit', statusText: '出场', time: '10:27:22' },
        { type: 'vehicle', name: '黑E33333', channel: '5号门入口', status: 'entry', statusText: '进场', time: '10:26:15' },
        { type: 'face', name: '孙七', channel: '5号门入口', status: 'entry', statusText: '进场', time: '10:26:05' }
      ],
      // 热力图数据 - 为人脸设置标识
      // vehicleHeatmapData 从父组件传入，不再在这里定义
      personHeatmapData: [{ type: 'person' }], // 人脸热力图标识（总计）
      personEntryHeatmapData: [], // 人脸进场热力图数据
      personExitHeatmapData: [], // 人脸出场热力图数据
      faceHeatmapLocations: [], // 人脸热力图位置列表（从后端获取）
      // 当前显示的相机照片
      currentVehicleCamera: {},
      currentFaceCamera: {},
      // 记录当前人脸监控显示的最新时间
      currentFaceLatestTime: null,
      // 车辆记录数据
      vehicleRecords: [],
      // 人脸记录数据
      personRecords: [],
      // 表格加载状态
      vehicleLoading: true,
      faceLoading: true,
      faceRefreshTimer: null, // 人脸数据刷新定时器
      vehicleRefreshTimer: null, // 车辆数据刷新定时器
      // 数据生成定时器
      dataGenerationTimer: null,
      // 内容高度
      vehicleContentHeight: 0,
      faceContentHeight: 0,
      // 自动滚动定时器
      vehicleAutoScrollTimer: null,
      faceAutoScrollTimer: null,
      // 车行数据（按时间维度）
      vehicleData: {
        daily: { entry: 134, exit: 128, current: 298, expected: 150, revenue: 2680, violation: 3 },
        weekly: { entry: 856, exit: 812, current: 298, expected: 950, revenue: 17120, violation: 18 },
        monthly: { entry: 3245, exit: 3089, current: 298, expected: 3600, revenue: 64900, violation: 72 },
        yearly: { entry: 11234, exit: 10876, current: 298, expected: 12500, revenue: 224680, violation: 285 }
      },
      // 人脸识别数据（默认值）
      faceData: {
        yearly: { entry: 11234, exit: 10876, current: 298, accuracy: 98.1 },
        monthly: { entry: 1089, exit: 1034, current: 298, accuracy: 97.8 },
        daily: { entry: 134, exit: 128, current: 298, accuracy: 98.5 },
        weekly: { entry: 856, exit: 812, current: 298, accuracy: 98.2 }
      },
      // —— 新增：通道弹窗 ——
      showChannelModal: false,
      channelModalFilter: 'all', // all | entry | exit
      channelSnapshots: {}, // { [channel]: { imageUrl, lastImageUrl, plateNumber, timestamp, channelType } }
      modalPage: 1,
      modalPageSize: 9,
      modalRealTimeTimer: null, // 弹窗实时更新定时器
      lastUpdateTime: 0, // 上次更新时间，用于避免重复更新
      faceChannelLoading: false, // 人脸通道数据加载状态
      vehicleChannelLoading: false, // 车辆通道数据加载状态
      // —— 新增：人脸详情弹窗 ——
      showFaceDetailModal: false,
      faceDetailFilter: 'all', // all | entry | exit
      faceDetailList: [
        {
          channel: '1号门入口',
          timestamp: '10:30:15',
          personName: '张三',
          collegeName: '计算机学院',
          imageUrl: require('@/assets/Snipaste_2025-10-27_15-45-59.png'),
          startTime: '10:15:00',
          endTime: '12:00:00',
          visitedPerson: '李经理',
          channelType: 'entry',
          statusText: '进场'
        },
        {
          channel: '2号门出口',
          timestamp: '10:29:08',
          personName: '李四',
          collegeName: '机械工程学院',
          imageUrl: require('@/assets/Snipaste_2025-10-27_15-45-59.png'),
          startTime: '09:30:00',
          endTime: '10:29:08',
          visitedPerson: '王主任',
          channelType: 'exit',
          statusText: '出场'
        },
        {
          channel: '3号门入口',
          timestamp: '10:28:35',
          personName: '王五',
          collegeName: '电气工程学院',
          imageUrl: require('@/assets/Snipaste_2025-10-27_15-45-59.png'),
          startTime: '10:20:00',
          endTime: '11:30:00',
          visitedPerson: '-',
          channelType: 'entry',
          statusText: '进场'
        },
        {
          channel: '4号门出口',
          timestamp: '10:27:22',
          personName: '赵六',
          collegeName: '经济管理学院',
          imageUrl: require('@/assets/Snipaste_2025-10-27_15-45-59.png'),
          startTime: '09:00:00',
          endTime: '10:27:22',
          visitedPerson: '张总',
          channelType: 'exit',
          statusText: '出场'
        },
        {
          channel: '5号门入口',
          timestamp: '10:25:10',
          personName: '孙七',
          collegeName: '外国语学院',
          imageUrl: require('@/assets/Snipaste_2025-10-27_15-45-59.png'),
          startTime: '10:10:00',
          endTime: '11:00:00',
          visitedPerson: '陈经理',
          channelType: 'entry',
          statusText: '进场'
        },
        {
          channel: '6号门出口',
          timestamp: '10:23:45',
          personName: '周八',
          collegeName: '材料科学与工程学院',
          imageUrl: require('@/assets/Snipaste_2025-10-27_15-45-59.png'),
          startTime: '08:30:00',
          endTime: '10:23:45',
          visitedPerson: '刘总',
          channelType: 'exit',
          statusText: '出场'
        },
        {
          channel: '7号门入口',
          timestamp: '10:22:30',
          personName: '吴九',
          collegeName: '化学工程学院',
          imageUrl: require('@/assets/Snipaste_2025-10-27_15-45-59.png'),
          startTime: '10:00:00',
          endTime: '12:30:00',
          visitedPerson: '马主任',
          channelType: 'entry',
          statusText: '进场'
        },
        {
          channel: '8号门出口',
          timestamp: '10:21:15',
          personName: '郑十',
          collegeName: '土木工程学院',
          imageUrl: require('@/assets/Snipaste_2025-10-27_15-45-59.png'),
          startTime: '09:00:00',
          endTime: '10:21:15',
          visitedPerson: '何总',
          channelType: 'exit',
          statusText: '出场'
        },
        {
          channel: '林科门入口',
          timestamp: '10:20:00',
          personName: '冯十一',
          collegeName: '林学院',
          imageUrl: require('@/assets/Snipaste_2025-10-27_15-45-59.png'),
          startTime: '10:15:00',
          endTime: '11:45:00',
          visitedPerson: '宋经理',
          channelType: 'entry',
          statusText: '进场'
        },
        {
          channel: '兴安门出口',
          timestamp: '10:18:45',
          personName: '陈十二',
          collegeName: '文法学院',
          imageUrl: require('@/assets/Snipaste_2025-10-27_15-45-59.png'),
          startTime: '08:45:00',
          endTime: '10:18:45',
          visitedPerson: '林总',
          channelType: 'exit',
          statusText: '出场'
        },
        {
          channel: '银行门入口',
          timestamp: '10:17:20',
          personName: '韩十三',
          collegeName: '理学院',
          imageUrl: require('@/assets/Snipaste_2025-10-27_15-45-59.png'),
          startTime: '10:10:00',
          endTime: '12:00:00',
          visitedPerson: '黄主任',
          channelType: 'entry',
          statusText: '进场'
        },
        {
          channel: '体育馆桥旁入口',
          timestamp: '10:16:10',
          personName: '杨十四',
          collegeName: '体育学院',
          imageUrl: require('@/assets/Snipaste_2025-10-27_15-45-59.png'),
          startTime: '10:05:00',
          endTime: '11:30:00',
          visitedPerson: '徐经理',
          channelType: 'entry',
          statusText: '进场'
        },
        {
          channel: '校区桥旁入口',
          timestamp: '10:15:00',
          personName: '朱十五',
          collegeName: '艺术学院',
          imageUrl: require('@/assets/Snipaste_2025-10-27_15-45-59.png'),
          startTime: '10:00:00',
          endTime: '12:15:00',
          visitedPerson: '秦总',
          channelType: 'entry',
          statusText: '进场'
        }
      ],
      // 人脸详情弹窗分页相关
      faceDetailPage: 1,
      faceDetailPageSize: 9,
      lastVehicleRecordsCount: 0, // 上次车辆记录数量，用于检测新数据
      // —— 入口/出口默认展示的通道白名单（按需求顺序） ——
      entryChannelWhitelist: [
        '1号门入口', '3号门入口', '5号门入口', '7号门入口', '8号门入口',
        '林科门入口', '兴安门入口', '银行门入口', '体育馆桥旁入口', '校区桥旁入口',
        '体育馆校内入口1', '体育馆校内入口2'
      ],
      exitChannelWhitelist: [
        '1号门出口', '1号门潮汐出口', '3号门出口', '3号门潮汐出口', '5号门出口',
        '7号门出口', '8号门出口', '林科门出口', '兴安门出口', '银行门出口'
      ],
      // 轮询相关
      lastQueryTime: null,  // 记录上次查询的时间，用于增量查询（轮询使用）
      lastCarouselQueryTime: null,  // 记录轮播上次查询的时间，用于轮播增量查询
      pollingInterval: 10000,  // 轮询间隔（毫秒），调整为10秒（降低刷新频率）
      pollingTimer: null,  // 轮询定时器
      pollingCount: 0,  // 轮询次数计数器
      // 轮播相关
      carouselQueue: [],  // 待展示的记录队列
      currentCarouselIndex: 0,  // 当前轮播索引
      carouselTimer: null,  // 轮播定时器
      carouselInterval: 5000,  // 每条记录显示5秒（降低轮播频率）
      shownRecordIds: [],  // 已展示的记录ID数组，用于轮播去重
      pollingShownRecordIds: [],  // 轮询已展示的记录ID数组，用于轮询去重
      isFetchingNextBatch: false,  // 是否正在获取下一批数据，防止重复触发
      // 数据详情弹窗相关
      showDetailModal: false,  // 是否显示详情弹窗
      detailType: '',  // 详情类型：vehicle-entry, vehicle-exit, vehicle-onsite, violation, face-entry, face-exit
      detailModalTitle: '',  // 弹窗标题
      detailData: [],  // 详情数据
      detailLoading: false,  // 详情加载状态
      detailDataCache: {},  // 详情数据缓存，提升加载速度
      detailRefreshTimer: null,  // 车辆弹窗数据刷新定时器（实时更新）
      lastRefreshTime: '',  // 最后刷新时间（显示给用户）
      detailPage: 1,  // 当前页
      detailPageSize: 10000,  // 每页条数（增加显示数量）
      detailFilters: {  // 筛选条件
        plateNumber: '',  // 车牌号（车辆用）
        personName: '',  // 姓名（人脸用）
        phoneNo: '',  // 手机号（人脸用）
        idNumber: '',  // 身份证号（人脸用）
        personType: '',  // 人员类型（人脸用）
        organization: '',  // 学院/部门（人脸用）
        channel: '',  // 通道（兼容字段）
        channelType: 'exit',  // 🔥 出场记录的通道类型：enter（进场通道）| exit（出场通道）
        createBy: '',  // 添加人（违规用）
        timeRange: 'today',  // 时间范围：today, yesterday, week, month, custom
        startTime: '',  // 自定义开始时间
        endTime: ''  // 自定义结束时间
      },
      availableChannels: [],  // 可用通道列表
      availableCreators: [],  // 可用添加人列表（违规用）
      detailColumns: [],  // 表格列配置
      // 图片预览相关
      photoPreviewVisible: false,  // 图片预览弹窗显示状态
      photoPreviewUrl: '',  // 当前预览的图片URL
      // 数据分析菜单相关
      showAnalysisMenu: false,  // 是否显示分析菜单
      // 排行榜弹窗相关
      showRankingModal: false,  // 是否显示排行榜弹窗
      rankingType: 'violation',  // 排行榜类型：violation | frequency
      rankingData: [],  // 排行榜数据
      rankingLoading: false,  // 排行榜加载状态
      rankingSortBy: 'count',  // 排序方式：count | time
      rankingLimit: 20,  // 显示数量
      frequencyDimension: 'vehicle',  // 频次维度：vehicle | channel
      rankingTimeRange: 'today',  // 排行榜独立的时间范围：today | week | month | year | custom
      rankingCustomStartDate: '',  // 排行榜自定义开始日期
      rankingCustomEndDate: '',  // 排行榜自定义结束日期
      
      // 进出记录类型选择弹窗
      showRecordTypeSelector: false,  // 是否显示记录类型选择弹窗
      selectedVehicleForDetail: null,  // 选中要查看详情的车辆信息
      
      // 大数据量提示弹窗
      showLargeDataWarning: false,  // 是否显示大数据量警告弹窗
      largeDataWarningInfo: {  // 大数据量警告信息
        timeRangeText: '',
        typeText: '',
        countText: '',
        estimatedCount: 0,
        type: ''
      }
    }
  },
  computed: {
    // 表格显示数据：直接显示最新的前10条记录
    displayedVehicleRecords() {
      const allRecords = this.vehicleRecords || [];
      
      // 按时间倒序排列，取前10条
      const displayData = [...allRecords].sort((a, b) => {
        const timeA = new Date(a.time || a.createTime || 0).getTime();
        const timeB = new Date(b.time || b.createTime || 0).getTime();
        return timeB - timeA;
      }).slice(0, 10);
      
      // 🔥 同时更新车辆监控大图为最新记录（高优先级更新）
      if (displayData.length > 0) {
        const latestRecord = displayData[0]; // 第一条就是最新的
        
        // 检查是否需要更新（避免重复更新）
        const currentDisplayTime = this.currentVehicleCamera.timestamp || '';
        const currentPlateNumber = this.currentVehicleCamera.plateNumber || '';
        const latestTime = this.formatTime(latestRecord.time || latestRecord.createTime);
        const latestPlateNumber = latestRecord.plateNumber || latestRecord.license || latestRecord.carNo || '';
        
        // 如果时间或车牌号有变化，就更新（确保显示最新数据）
        if (currentDisplayTime !== latestTime || currentPlateNumber !== latestPlateNumber) {
          // 使用立即更新，避免被轮播覆盖
          this.currentVehicleCamera = {
            channel: latestRecord.channel || latestRecord.channelName || '未知通道',
            timestamp: latestTime,
            plateNumber: latestPlateNumber,
            vehicleType: latestRecord.vipName || latestRecord.vehicleType || '普通用户',
            imageUrl: latestRecord.imageUrl ? this.getOptimizedImageUrl(latestRecord.imageUrl) : '',
            rawData: latestRecord,
            enter_car_license_color: latestRecord.enter_car_license_color || latestRecord.carColor || '',
            exit_car_license_color: latestRecord.exit_car_license_color || latestRecord.carColor || '',
            enter_car_type: latestRecord.enter_car_type || ''
          };
          console.log('🔄 [表格同步] 车辆监控大图已更新:', latestPlateNumber, '时间:', latestTime);
        }
      }
      
      // 如果没有真实数据，创建占位数据确保滚动
      if (displayData.length === 0) {
        return this.createPlaceholderData();
      }
      
      return displayData;
    },
    // 显示所有人脸记录（不再限制时间）
    displayedPersonRecords() {
      // 返回所有记录，不再做时间过滤
      return this.personRecords || [];
    },
    currentPageCameras() {
      const start = (this.currentPage - 1) * 6;
      const end = start + 6;
      return this.cameras.slice(start, end);
    },
    // 当前选择的时间段标签
    currentTimeLabel() {
      const option = this.timeOptions.find(opt => opt.value === this.tabTimeRange);
      return option ? option.label : '今日';
    },
    // 当前时间段的车行数据
    currentVehicleData() {
      return this.vehicleData[this.tabTimeRange] || this.vehicleData.daily;
    },
    // 动态车行数据计算属性
    currentVehicleEntry() {
      return this.currentVehicleData.entry;
    },
    currentVehicleExit() {
      return this.currentVehicleData.exit;
    },
    currentVehicleCurrent() {
      return this.currentVehicleData.current;
    },
    currentVehicleExpected() {
      return this.currentVehicleData.expected;
    },
    currentVehicleRevenue() {
      return this.currentVehicleData.revenue;
    },
    // 当前时间段的人脸数据
    currentFaceData() {
      return this.faceData[this.tabTimeRange] || this.faceData.daily;
    },
    // 动态人脸数据计算属性
    currentFaceEntry() {
      return this.currentFaceData.entry;
    },
    currentFaceExit() {
      return this.currentFaceData.exit;
    },
    // currentFaceUsers已在props中定义，不需要在computed中重复定义
    // currentFaceUsers() {
    //   return this.currentFaceData.current;
    // },
    currentFaceAccuracy() {
      return this.currentFaceData.accuracy;
    },
    // 新增的车辆数据计算属性
    currentVehicleOnSite() {
      return this.currentVehicleData.current || 0;
    },
    currentVehicleViolation() {
      return this.currentVehicleData.violation || 0;
    },
    // —— 弹窗：数据源、分页与占位 ——
    modalFilteredItems() {
      // 将快照映射为字典，便于按白名单顺序取用
      const snapshotMap = {};
      Object.values(this.channelSnapshots || {}).forEach(s => {
        if (!s || !s.channel) return;
        snapshotMap[s.channel] = s;
      });

      const pickFromList = (names, type) => {
        return names.map(name => {
          const s = snapshotMap[name] || {};
          const result = {
            channel: name,
            channelType: type,
            timestamp: s.timestamp || '',
            plateNumber: s.plateNumber || '',
            imageUrl: s.imageUrl || s.lastImageUrl || '',
          };
          return result;
        });
      };

      if (this.channelModalFilter === 'entry') {
        return pickFromList(this.entryChannelWhitelist, 'entry');
      }
      if (this.channelModalFilter === 'exit') {
        return pickFromList(this.exitChannelWhitelist, 'exit');
      }
      // all：入口在前，出口在后
      return [
        ...pickFromList(this.entryChannelWhitelist, 'entry'),
        ...pickFromList(this.exitChannelWhitelist, 'exit')
      ];
    },
    modalTotal() {
      return this.modalFilteredItems.length;
    },
    modalTotalPages() {
      return Math.max(1, Math.ceil(this.modalTotal / this.modalPageSize));
    },
    // 人脸详情过滤列表
    // 过滤后的人脸详情列表（不分页）
    filteredFaceDetailListAll() {
      if (this.faceDetailFilter === 'all') {
        return this.faceDetailList;
      } else if (this.faceDetailFilter === 'entry') {
        return this.faceDetailList.filter(item => item.channelType === 'entry');
      } else if (this.faceDetailFilter === 'exit') {
        return this.faceDetailList.filter(item => item.channelType === 'exit');
      }
      return this.faceDetailList;
    },
    // 分页后的人脸详情列表（已被 faceDetailListByChannel 替代）
    // filteredFaceDetailList() {
    //   const filtered = this.filteredFaceDetailListAll;
    //   const start = (this.faceDetailPage - 1) * this.faceDetailPageSize;
    //   return filtered.slice(start, start + this.faceDetailPageSize);
    // },
    // 人脸详情总页数（被新的faceDetailTotalPages替代）
    // faceDetailTotalPages() {
    //   return Math.max(1, Math.ceil(this.filteredFaceDetailListAll.length / this.faceDetailPageSize));
    // },
    modalPagedCards() {
      const start = (this.modalPage - 1) * this.modalPageSize;
      const sorted = this.modalFilteredItems
        .slice()
        .sort((a, b) => (b.timestamp || '').localeCompare(a.timestamp || ''));

      const result = sorted.slice(start, start + this.modalPageSize);

      // 检查每个卡片的图片数据
      console.log('🔍 modalPagedCards - 当前页数据:', result);
      result.forEach((card, index) => {
        const imageUrl = this.getChannelImage(card);
        console.log(`🔍 modalPagedCards - 卡片${index}:`, card.channel, '图片URL:', imageUrl);
      });

      return result;
    },
    // 详情弹窗分页数据
    paginatedDetailData() {
      const start = (this.detailPage - 1) * this.detailPageSize;
      return this.detailData.slice(start, start + this.detailPageSize);
    },
    // 详情弹窗总页数
    detailTotalPages() {
      return Math.max(1, Math.ceil(this.detailData.length / this.detailPageSize));
    },
    
    // 人脸详情弹窗数据：固定通道列表，每个通道显示最新数据
    faceDetailListByChannel() {
      // 固定的通道列表（基于真实数据库门名称）- 共46个通道
      const fixedChannels = [
        // 1号门
        '1号门入口1', '1号门入口2', '1号门出口1', '1号门出口2',
        // 2号门
        '2号门入口1', '2号门入口2', '2号门入口3', '2号门出口1', '2号门出口2', '2号门出口3',
        '2号门转闸入口', '2号门转闸出口',
        // 3号门
        '3号门入口1', '3号门入口2', '3号门出口1', '3号门出口2',
        // 5号门
        '5号门入口1', '5号门入口2', '5号门入口3', '5号门入口4', 
        '5号门出口1', '5号门出口2', '5号门出口3', '5号门出口4',
        // 7号门
        '7号门入口1', '7号门入口2', '7号门出口1', '7号门出口2',
        // 8号门
        '8号门入口1', '8号门入口2', '8号门出口1', '8号门出口2',
        // 兴安门
        '兴安门入口1', '兴安门入口2', '兴安门出口1', '兴安门出口2',
        // 家具学院
        '家具学院转闸入口', '家具学院转闸出口',
        // 林科门
        '林科门入口1', '林科门入口2', '林科门出口1', '林科门出口2',
        // 银行门
        '银行门入口1', '银行门入口2', '银行门出口1', '银行门出口2'
      ];
      
      // 按通道分组人脸数据
      const channelDataMap = {};
      
      // 初始化所有固定通道
      fixedChannels.forEach(channel => {
        channelDataMap[channel] = {
          channel: channel,
          timestamp: '--',
          personName: '暂无数据',
          imageUrl: '',
          department: '--',
          personType: '--',
          recognitionMethod: '--',
          channelType: channel.includes('入口') ? 'entry' : 'exit',
          statusText: channel.includes('入口') ? '进场' : '出场',
          hasData: false
        };
      });
      
      // 用真实数据覆盖对应通道
      if (this.faceDetailList && this.faceDetailList.length > 0) {
        this.faceDetailList.forEach(record => {
          const channel = record.channel;
          if (fixedChannels.includes(channel)) {
            channelDataMap[channel] = {
              ...record,
              // 修复：只要有有效的人员数据就认为有数据，不仅仅依赖图片URL
              // 判断条件：record本身的hasData字段或者有有效的人员姓名
              hasData: record.hasData !== false && record.personName && record.personName !== '暂无数据'
            };
          }
        });
      }
      
      // 根据筛选条件过滤通道
      let filteredChannels = fixedChannels;
      if (this.faceDetailFilter === 'entry') {
        filteredChannels = fixedChannels.filter(channel => channel.includes('入口'));
      } else if (this.faceDetailFilter === 'exit') {
        filteredChannels = fixedChannels.filter(channel => channel.includes('出口'));
      }
      
      // console.log('🔍 人脸弹窗筛选:', this.faceDetailFilter, '显示通道数:', filteredChannels.length);
      
      const allChannelData = filteredChannels.map(channel => channelDataMap[channel]);
      
      // 分页处理 - 每页显示9个通道
      const pageSize = 9;
      const startIndex = (this.faceDetailPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      
      return allChannelData.slice(startIndex, endIndex);
    },
    
    // 人脸详情弹窗总页数
    faceDetailTotalPages() {
      // 固定的通道列表（基于真实数据库门名称）- 共46个通道，与上面保持一致
      const fixedChannels = [
        // 1号门
        '1号门入口1', '1号门入口2', '1号门出口1', '1号门出口2',
        // 2号门
        '2号门入口1', '2号门入口2', '2号门入口3', '2号门出口1', '2号门出口2', '2号门出口3',
        '2号门转闸入口', '2号门转闸出口',
        // 3号门
        '3号门入口1', '3号门入口2', '3号门出口1', '3号门出口2',
        // 5号门
        '5号门入口1', '5号门入口2', '5号门入口3', '5号门入口4', 
        '5号门出口1', '5号门出口2', '5号门出口3', '5号门出口4',
        // 7号门
        '7号门入口1', '7号门入口2', '7号门出口1', '7号门出口2',
        // 8号门
        '8号门入口1', '8号门入口2', '8号门出口1', '8号门出口2',
        // 兴安门
        '兴安门入口1', '兴安门入口2', '兴安门出口1', '兴安门出口2',
        // 家具学院
        '家具学院转闸入口', '家具学院转闸出口',
        // 林科门
        '林科门入口1', '林科门入口2', '林科门出口1', '林科门出口2',
        // 银行门
        '银行门入口1', '银行门入口2', '银行门出口1', '银行门出口2'
      ];
      
      // 根据筛选条件过滤通道
      let filteredChannels = fixedChannels;
      if (this.faceDetailFilter === 'entry') {
        filteredChannels = fixedChannels.filter(channel => channel.includes('入口'));
      } else if (this.faceDetailFilter === 'exit') {
        filteredChannels = fixedChannels.filter(channel => channel.includes('出口'));
      }
      
      const pageSize = 9;
      return Math.max(1, Math.ceil(filteredChannels.length / pageSize));
    },

    // 🔥 大数据量相关计算属性
    isLargeDataModal() {
      return (this.detailType && this.detailType.includes('face') && 
              (this.tabTimeRange === 'monthly' || this.tabTimeRange === 'yearly')) ||
              this.detailType.includes('-summary');
    },

    getDisplayedRecordCount() {
      return this.detailData ? this.detailData.length : 0;
    }
  },
  async mounted() {
    // 初始化空的车辆相机状态，不使用默认照片
    this.currentVehicleCamera = { channel: '', plateNumber: '', timestamp: '', imageUrl: '' };

    // 🚀 并行加载所有数据，大幅提升初始化速度
    try {
      await Promise.all([
        this.initVehicleRecords(),      // 车辆记录初始化
        this.loadStatisticsData(),       // 加载统计数据
        this.loadFaceMonitorData(),      // 加载人脸监控数据
        this.loadVehicleMonitorData(),   // 加载车辆监控数据
        this.loadFaceHeatmapData()       // 加载人脸热力图数据
      ]);
      console.log('✅ 所有数据加载完成');
    } catch (error) {
      console.error('❌ 数据加载失败:', error);
    }

    // 注释掉模拟数据，使用真实数据
    // this.initPersonRecords();
    this.faceLoading = false;
    // 🔥 禁用车辆轮询机制，改用单一定时器模式（和人脸监控一致）
    this.startDataGeneration(); // 仅用于流量数据，不更新车辆记录
    // await this.startVehiclePolling(); // 已禁用，改用 loadVehicleMonitorData 定时器

    // 定时刷新人脸数据（每10秒检查一次新数据）
    const faceRefreshTimer = setInterval(() => {
      console.log('⏰ [定时器] 10秒刷新 - 加载人脸数据');
      this.loadFaceMonitorData();
    }, 10000);

    // 🔥 启用车辆监控定时刷新（和人脸监控一样的单一定时器模式）
    const vehicleRefreshTimer = setInterval(() => {
      console.log('⏰ [定时器] 10秒刷新 - 加载车辆数据');
      this.loadVehicleMonitorData();
    }, 10000);

    // 保存定时器引用以便清理
    this.faceRefreshTimer = faceRefreshTimer;
    this.vehicleRefreshTimer = vehicleRefreshTimer;

    // 定时刷新热力图数据（每30秒）
    setInterval(() => {
      this.loadFaceHeatmapData();
    }, 30000);
    
    // 定时刷新统计数据（每15秒刷新KPI数据）
    setInterval(() => {
      console.log('⏰ [定时器] 15秒刷新 - KPI统计数据');
      this.loadStatisticsData();
    }, 15000);

    this.$nextTick(() => {
      this.measureContentHeights();
      this.startAutoScrolls();
    });
    
    // 添加定时器确保滚动持续进行（每30秒检查一次）
    setInterval(() => {
      // 如果表格有数据但滚动停止了，重新启动滚动
      if (this.displayedVehicleRecords.length > 0 && !this.vehicleAutoScrollTimer) {
        console.log('🔄 [定时检查] 重新启动车辆表格滚动');
        this.startVehicleAutoScroll();
      }
      if (this.displayedPersonRecords.length > 0 && !this.faceAutoScrollTimer) {
        console.log('🔄 [定时检查] 重新启动人脸表格滚动');
        this.startFaceAutoScroll();
      }
    }, 30000);
  },
  beforeDestroy() {
    if (this.vehicleAutoScrollTimer) {
      clearInterval(this.vehicleAutoScrollTimer);
    }
    if (this.faceAutoScrollTimer) {
      clearInterval(this.faceAutoScrollTimer);
    }
    if (this.faceRefreshTimer) {
      clearInterval(this.faceRefreshTimer);
    }
    if (this.vehicleRefreshTimer) {
      clearInterval(this.vehicleRefreshTimer);
    }
    if (this.detailRefreshTimer) {
      clearInterval(this.detailRefreshTimer);
    }
    if (this.dataGenerationTimer) {
      clearInterval(this.dataGenerationTimer);
    }
    if (this.pollingTimer) {
      clearInterval(this.pollingTimer);
    }
    // 清理轮播定时器
    if (this.carouselTimer) {
      clearInterval(this.carouselTimer);
    }
    // 清理弹窗实时更新定时器
    this.stopModalRealTimeUpdate();
  },
  methods: {
    // 时间范围变化处理
    onTimeRangeChange() {
      console.log('Center组件：时间范围切换为:', this.selectedTimeRange);
      // 通过 emit 向父组件传递时间范围变化
      this.$emit('time-range-change', this.selectedTimeRange);
    },
    
    // 创建占位数据确保表格能滚动
    createPlaceholderData() {
      const placeholders = [];
      for (let i = 1; i <= 10; i++) {
        placeholders.push({
          id: `placeholder-${i}`,
          license: '等待数据...',
          channel: '数据加载中',
          vipName: '等待中',
          time: new Date().toLocaleTimeString(),
          isPlaceholder: true
        });
      }
      return placeholders;
    },
    
    // 格式化日期时间，添加日期部分
    formatDateTime(timeInput) {
      if (!timeInput || timeInput === '-') return '-';

      // 如果是Date对象，转换为ISO字符串
      if (timeInput instanceof Date) {
        return timeInput.toISOString();
      }

      // 如果不是字符串，返回默认值
      if (typeof timeInput !== 'string') {
        console.warn('⚠️ [formatDateTime] 参数类型错误:', typeof timeInput, timeInput);
        return '-';
      }

      const timeStr = timeInput;

      // 获取当前日期
      const today = new Date();
      const year = today.getFullYear();
      const month = String(today.getMonth() + 1).padStart(2, '0');
      const day = String(today.getDate()).padStart(2, '0');
      const dateStr = `${year}-${month}-${day}`;

      // 如果时间字符串只包含时间部分，添加日期
      if (timeStr.includes(':') && !timeStr.includes('-')) {
        return `${dateStr} ${timeStr}`;
      }

      return timeStr;
    },

    // 统一映射后端字段到前端显示字段
    mapAndNormalizeRecords(records = []) {
      
      return (records || []).map(r => {
        // 根据eventType确定动作和通道类型
        const isEntry = r.eventType === 'in';
        const action = isEntry ? '进场' : '离场';
        const channelType = isEntry ? 'entry' : 'exit';
        
        const mapped = {
          license: r.plateNumber || r.license || r.carNo || '',
          channel: r.channel || r.channelName || r.channelCode || '未知通道',
          channelType: channelType,
          action: action,
          vehicleType: r.vipName || r.vehicleType || '普通用户',
          time: this.formatTime(r.time || r.createTime || r.appointmentTime || Date.now()),
          imageUrl: r.imageUrl || (r.rawData && r.rawData.imageUrl) || '', // 保留图片URL
          rawData: r.rawData || null, // 保留原始数据
          // 保留车牌颜色字段用于判断车牌样式 - 优先使用后端返回的 carColor 字段
          enter_car_license_color: r.carColor || r.enter_car_license_color || (r.rawData && r.rawData.enter_car_license_color) || '',
          exit_car_license_color: r.carColor || r.exit_car_license_color || (r.rawData && r.rawData.exit_car_license_color) || '',
          enter_car_type: r.enter_car_type || (r.rawData && r.rawData.enter_car_type) || '',
          isNew: false
        };
        return mapped;
      });
    },

    /**
     * 获取车牌颜色代码
     */
    getLicenseColorCode(colorName) {
      const colorMap = {
        '蓝色': '#0066CC',
        '黄色': '#FFCC00',
        '白色': '#FFFFFF',
        '黑色': '#000000',
        '绿色': '#00AA00',
        '红色': '#CC0000',
        '银色': '#C0C0C0',
        '灰色': '#808080',
        '褐色': '#A52A2A',
        '其他': '#999999'
      };
      return colorMap[colorName] || '#999999';
    },

    // 去重：以 车牌+时间 作为唯一键
    dedupeRecords(records = []) {
      const seen = new Set();
      const result = [];
      for (const rec of records) {
        const key = `${rec.license}__${rec.time}`;
        if (!seen.has(key)) {
          seen.add(key);
          result.push(rec);
        }
      }
      return result;
    },
    formatNumber(num) {
      return Number(num).toLocaleString();
    },
    formatCurrency(amount) {
      return (Number(amount) / 1000).toFixed(1) + 'k';
    },

    /**
     * 🔥 智能判断人员类型（基于部门信息修正）
     */
    getSmartPersonType(originalPersonType, department) {
      const deptStr = String(department || '').trim();
      const typeStr = String(originalPersonType || '').trim();
      
      // 🔍 根据部门信息智能判断
      if (deptStr.includes('教职工') || deptStr.includes('正式人员') || 
          deptStr.includes('教师') || deptStr.includes('职工') || 
          deptStr.includes('员工') || deptStr.includes('工作人员')) {
        return '教职工';
      }
      
      if (deptStr.includes('学生') || deptStr.includes('本科') || 
          deptStr.includes('研究生') || deptStr.includes('博士') || 
          deptStr.includes('硕士')) {
        return '学生';
      }
      
      if (deptStr.includes('访客') || deptStr.includes('客人') || 
          deptStr.includes('外来') || deptStr.includes('临时')) {
        return '访客';
      }
      
      // 如果无法从部门判断，返回原始类型或默认值
      if (typeStr && typeStr !== '未知' && typeStr !== '--') {
        return typeStr;
      }
      
      // 兜底：如果部门包含学院信息，默认为学生
      if (deptStr.includes('学院')) {
        return '学生';
      }
      
      return originalPersonType || '未知';
    },

    /**
     * 获取人员类型样式类
     */
    getPersonTypeClass(personType) {
      if (!personType) return 'type-unknown';

      const typeStr = String(personType).trim();
      const typeMap = {
        '预约访客': 'type-reserved',
        '访客': 'type-reserved',
        '未预约访客': 'type-unreserved',
        '教职工': 'type-staff',
        '教师': 'type-staff',
        '职工': 'type-staff',
        '学生': 'type-student',
        '本科生': 'type-student',
        '研究生': 'type-student',
        '博士生': 'type-student'
      };
      return typeMap[typeStr] || 'type-unknown';
    },

    /**
     * 🔥 判断是否为大数据量（改进版：支持车辆和人脸数据，基于实际数据量判断）
     */
    isLargeDataTimeRange(detailType) {
      // 获取统计数据
      const stats = detailType.includes('face') ? this.currentFaceData : this.currentVehicleData;
      
      // 根据数据类型获取预估数据量
      let estimatedCount = 0;
      if (detailType === 'face-entry' || detailType === 'vehicle-entry') {
        estimatedCount = stats.entry || 0;
      } else if (detailType === 'face-exit' || detailType === 'vehicle-exit') {
        estimatedCount = stats.exit || 0;
      } else if (detailType === 'vehicle-onsite') {
        estimatedCount = stats.current || 0;
      }
      
      // 超过10000条视为大数据量
      const isLarge = estimatedCount > 10000;
      
      if (isLarge) {
        console.log('⚠️ [大数据量检测]', {
          type: detailType,
          estimatedCount,
          threshold: 10000
        });
      }
      
      return isLarge;
    },

    /**
     * 🔥 处理大数据量弹窗（改进版：使用自定义美观弹窗）
     */
    async handleLargeDataModal(type) {
      const timeRangeText = {
        'daily': '今日',
        'yesterday': '昨日',
        'weekly': '本周',
        'monthly': '本月',
        'yearly': '本年'
      }[this.tabTimeRange] || '该时间段';
      
      // 支持车辆和人脸数据类型
      const typeTextMap = {
        'face-entry': '人脸进场',
        'face-exit': '人脸出场',
        'vehicle-entry': '车辆进场',
        'vehicle-exit': '车辆出场',
        'vehicle-onsite': '在场车辆'
      };
      const typeText = typeTextMap[type] || '数据';
      
      // 基于实际统计数据估算数据量
      let estimatedCount = 0;
      const stats = type.includes('face') ? this.currentFaceData : this.currentVehicleData;
      
      // 根据数据类型获取估算值
      if (type.includes('-entry')) {
        estimatedCount = stats.entry || 0;
      } else if (type.includes('-exit')) {
        estimatedCount = stats.exit || 0;
      } else if (type === 'vehicle-onsite') {
        estimatedCount = stats.current || 0;
      }
      
      // 如果没有统计数据，使用保守估算
      if (estimatedCount === 0) {
        if (this.tabTimeRange === 'monthly') {
          estimatedCount = 30 * 500;
        } else if (this.tabTimeRange === 'yearly') {
          estimatedCount = 365 * 500;
        } else {
          estimatedCount = 1000;
        }
      }
      
      const countText = estimatedCount > 10000 ? 
        `${Math.round(estimatedCount/10000)}万` : 
        estimatedCount > 1000 ? `${Math.round(estimatedCount/1000)}千` :
        `${estimatedCount}`;
      
      console.log('📊 [数据量估算]', {
        timeRange: this.tabTimeRange,
        type: type,
        estimatedCount: estimatedCount,
        stats: stats
      });
      
      // 设置弹窗信息并显示自定义弹窗
      this.largeDataWarningInfo = {
        timeRangeText,
        typeText,
        countText,
        estimatedCount,
        type
      };
      this.showLargeDataWarning = true;
    },

    /**
     * 🔥 显示大数据量统计摘要（修复版：支持车辆和人脸数据）
     */
    showLargeDataSummary(type, timeRangeText, typeText, countText) {
      // 创建特殊的摘要弹窗
      this.detailType = type + '-summary';  // 标记为摘要模式
      this.showDetailModal = true;
      
      const config = this.getDetailConfig(type);
      this.detailModalTitle = `${timeRangeText}${typeText}统计摘要`;
      
      // 设置摘要列
      this.detailColumns = [
        { key: 'metric', label: '统计项目' },
        { key: 'value', label: '数值' },
        { key: 'description', label: '说明' }
      ];
      
      // 根据数据类型获取正确的统计数据
      const isFaceData = type.includes('face');
      const stats = isFaceData ? this.currentFaceData : this.currentVehicleData;
      
      // 安全获取统计值，避免undefined
      const entry = stats.entry || 0;
      const exit = stats.exit || 0;
      const current = stats.current || 0;
      const accuracy = stats.accuracy || 0;
      
      // 根据数据类型生成不同的统计项目
      if (isFaceData) {
        // 人脸数据统计
        this.detailData = [
          {
            metric: '总进出场次数',
            value: `${entry + exit} 人次`,
            description: `进场${entry}人次，出场${exit}人次`
          },
          {
            metric: '预计详细记录数',
            value: countText,
            description: '包含所有进出场详细记录'
          },
          {
            metric: '当前在场人数',
            value: `${current} 人`,
            description: '进场未出场的人员数量'
          },
          {
            metric: '识别准确率',
            value: `${accuracy}%`,
            description: '人脸识别成功率'
          }
        ];
      } else {
        // 车辆数据统计
        this.detailData = [
          {
            metric: '总进出场次数',
            value: `${entry + exit} 车次`,
            description: `进场${entry}车次，出场${exit}车次`
          },
          {
            metric: '预计详细记录数',
            value: countText,
            description: '包含所有进出场详细记录'
          },
          {
            metric: '当前在场车辆',
            value: `${current} 辆`,
            description: '进场未出场的车辆数量'
          }
        ];
      }
      
      console.log('📊 [大数据量] 显示统计摘要模式', {
        type,
        isFaceData,
        stats
      });
    },

    /**
     * 🔥 显示最新记录
     */
    async showRecentRecords(type, limit = 1000) {
      this.detailType = type;
      this.showDetailModal = true;
      
      // 设置弹窗标题，标明是最新记录
      const config = this.getDetailConfig(type);
      this.detailModalTitle = `${config.title}（最新${limit}条）`;
      this.detailColumns = config.columns;
      
      // 重置筛选条件
      this.resetDetailFilters();
      
      // 加载通道列表
      await this.loadAvailableChannels();
      
      // 加载数据时添加限制
      this.detailPageSize = limit;  // 临时设置页面大小
      await this.loadDetailData();
      
      console.log(`📋 [大数据量] 显示最新${limit}条记录`);
    },

    /**
     * 🔥 关闭大数据量警告弹窗
     */
    closeLargeDataWarning() {
      this.showLargeDataWarning = false;
    },

    /**
     * 🔥 确认查看统计信息
     */
    confirmViewSummary() {
      const { type, timeRangeText, typeText, countText } = this.largeDataWarningInfo;
      this.closeLargeDataWarning();
      this.showLargeDataSummary(type, timeRangeText, typeText, `约${countText}条`);
    },

    /**
     * 🔥 确认查看最新记录
     */
    confirmViewRecords() {
      const { type } = this.largeDataWarningInfo;
      this.closeLargeDataWarning();
      this.showRecentRecords(type, 1000);
    },

    /**
     * 获取识别方式样式类
     */
    getRecognitionMethodClass(method) {
      if (!method) return 'method-unknown';

      const methodStr = String(method).trim();
      const methodMap = {
        '人脸识别': 'method-face',
        '人脸': 'method-face',
        '脸部识别': 'method-face',
        'Face': 'method-face',
        '刷卡': 'method-card',
        'IC卡': 'method-card',
        '卡片': 'method-card',
        'Card': 'method-card',
        '刷身份证': 'method-id',
        '身份证': 'method-id',
        'ID': 'method-id'
      };
      return methodMap[methodStr] || 'method-unknown';
    },

    /**
     * 获取识别状态徽章样式类
     */
    getRecognitionBadgeClass(method) {
      const methodMap = {
        '人脸识别': 'badge-face',
        '刷卡': 'badge-card',
        '刷身份证': 'badge-id'
      };
      return methodMap[method] || '';
    },

    /**
     * 加载人脸监控实时数据
     */
    async loadFaceMonitorData() {
      try {
        const response = await axios.get('http://localhost:8675/parking/face-monitor/realtime', {
          params: { limit: 50 }
        });

        if (response.data && response.data.code === '0' && response.data.data) {
          // 处理双层data嵌套的情况
          let records;
          if (response.data.data.data && response.data.data.data.records) {
            // 双层嵌套：response.data.data.data.records
            records = response.data.data.data.records;
          } else if (response.data.data.records) {
            // 单层嵌套：response.data.data.records
            records = response.data.data.records;
          }

          // 检查records是否存在且为数组
          if (!records || !Array.isArray(records)) {
            this.faceLoading = false;
            return;
          }


          // 🔍 调试：查看realtime API返回的第一条记录
          if (records.length > 0 && this.personRecords.length === 0) {
            console.log('🔍 [实时数据] 第一条记录的所有字段:', Object.keys(records[0]));
            console.log('🔍 [实时数据] 第一条完整记录:', records[0]);
          }

          // 动态更新表格数据
          if (records.length > 0) {
            const newRecords = records.map(record => {
              // 🔥 使用智能人员类型判断
              const smartPersonType = this.getSmartPersonType(record.personType, record.department);
              
              return {
                name: record.personName,
                channel: record.channelName,
                action: record.direction === '进' ? '进场' : '出场',
                time: this.formatTime(record.eventTime),
                eventTime: record.eventTime, // 保留原始时间用于比较
                channelType: record.direction === '进' ? 'entry' : 'exit',
                recognitionMethod: record.recognitionMethod,
                personType: smartPersonType, // 使用修正后的人员类型
                department: record.department,
                // 🖼️ 添加图片字段处理（优先使用photoUrl）
                imageUrl: record.photoUrl || record.imageUrl || record.faceImageUrl || record.faceUrl || record.facePhoto || record.facePath || record.picUrl || record.picture || '',
                photoUrl: record.photoUrl || record.imageUrl || record.faceImageUrl || record.faceUrl || record.facePhoto || record.facePath || record.picUrl || record.picture || '',
                isNew: true, // 标记为新数据
                // 🔍 保留原始数据用于调试
                rawRecord: record
              };
            });

            // 如果是首次加载，直接使用新数据（限制10条）
            if (this.personRecords.length === 0) {
              this.personRecords = newRecords.slice(0, 10);
            } else {
              // 合并新旧数据，去重，保留最新10条
              const existingTimes = new Set(this.personRecords.map(r => r.eventTime));
              const uniqueNewRecords = newRecords.filter(r => !existingTimes.has(r.eventTime));

              if (uniqueNewRecords.length > 0) {
                // 将新数据添加到前面
                this.personRecords = [...uniqueNewRecords, ...this.personRecords].slice(0, 10);

                // 短暂标记新记录
                setTimeout(() => {
                  this.personRecords.forEach(r => r.isNew = false);
                }, 3000);
              } else {
                // console.log('⏸️ [人脸监控] 无更新记录');
              }
            }
          } else {
            // console.log('⏸️ [人脸监控] 无新数据，保留旧数据');
          }

          // 智能更新当前显示的人脸监控照片
          if (records.length > 0) {
            const latest = records[0];
            const latestEventTime = new Date(latest.eventTime).getTime();

            // 如果是首次加载或有更新的数据，才更新显示
            if (!this.currentFaceLatestTime || latestEventTime > this.currentFaceLatestTime) {
              const formattedTimestamp = this.formatTime(latest.eventTime);
              // 🔥 使用智能人员类型判断
              const smartPersonType = this.getSmartPersonType(latest.personType, latest.department);
              
              // 只有当有照片时才显示
              if (latest.photoUrl) {
                this.currentFaceCamera = {
                  channel: latest.channelName,
                  timestamp: formattedTimestamp,
                  personName: latest.personName,
                  imageUrl: latest.photoUrl,
                  department: latest.department,
                  personType: smartPersonType, // 使用修正后的人员类型
                  recognitionMethod: latest.recognitionMethod
                };
              }
              // 更新最新时间记录
              this.currentFaceLatestTime = latestEventTime;
            } else {
              console.log('⏸️ [人脸监控] 无更新数据，保持当前显示');
            }
          }

          // 更新人脸详情弹窗数据（累积更新模式，保留各通道的最新数据）
          if (records.length > 0) {
            // console.log('🔄 [人脸监控] 更新通道数据，收到', records.length, '条记录');
            
            // 创建通道数据映射表（保留现有数据）
            const channelDataMap = {};
            
            // 先加载现有数据到映射表
            if (this.faceDetailList && this.faceDetailList.length > 0) {
              this.faceDetailList.forEach(item => {
                if (item.channel) {
                  channelDataMap[item.channel] = item;
                }
              });
            }
            
            // 用新数据更新对应通道（只更新时间更新的通道数据）
            records.forEach(record => {
              const channel = record.channelName;
              if (channel) {
                const recordTime = new Date(record.eventTime).getTime();
                const existingData = channelDataMap[channel];
                
                // 只有当新数据时间更新或通道没有数据时才更新
                const shouldUpdate = !existingData || 
                  !existingData.eventTime || 
                  recordTime > new Date(existingData.eventTime).getTime();
                
                if (shouldUpdate) {
                  const now = new Date();
                  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
                  const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

                  // 🔥 使用智能人员类型判断
                  const smartPersonType = this.getSmartPersonType(record.personType, record.department);
                  
                  // 🖼️ 提取人脸照片URL（使用正确的人脸字段）
                  const imageUrl = record.photoUrl || record.imageUrl || record.faceImageUrl || record.faceUrl || record.facePhoto || record.facePath || record.picUrl || record.picture || '';
                  
                  // 🔍 调试：检查轮询更新中的照片字段
                  if (!imageUrl && record.personName && record.personName !== '陌生人') {
                    console.warn('⚠️ [轮询更新] 未找到照片URL:', {
                      channel,
                      personName: record.personName,
                      photoUrl: record.photoUrl,
                      imageUrl: record.imageUrl,
                      allKeys: Object.keys(record)
                    });
                  }
                  
                  channelDataMap[channel] = {
                    channel: channel,
                    timestamp: this.formatTime(record.eventTime),
                    personName: record.personName,
                    department: record.department,
                    personType: smartPersonType, // 使用修正后的人员类型
                    recognitionMethod: record.recognitionMethod,
                    // 使用提取到的imageUrl作为主要照片字段
                    imageUrl: imageUrl,
                    photoUrl: imageUrl,
                    facePhoto: imageUrl,
                    faceImageUrl: imageUrl,
                    channelType: record.direction === '进' ? 'entry' : 'exit',
                    statusText: record.direction === '进' ? '进场' : '出场',
                    startTime: record.personName && record.personName !== '陌生人' ? startOfDay.toISOString() : null,
                    endTime: record.personName && record.personName !== '陌生人' ? endOfDay.toISOString() : null,
                    eventTime: record.eventTime, // 保留原始时间用于排序和比较
                    hasData: true
                  };
                  
                  // console.log('✅ [人脸监控] 更新通道:', channel, '人员:', record.personName, '时间:', this.formatTime(record.eventTime));
                } else {
                  // console.log('⏸️ [人脸监控] 跳过旧数据:', channel, '现有时间:', existingData.timestamp, '新数据时间:', this.formatTime(record.eventTime));
                }
              };
            });
            
            // 将映射表转换回数组
            this.faceDetailList = Object.values(channelDataMap);
            // console.log('📊 [人脸监控] 通道数据更新完成，当前通道数:', this.faceDetailList.length);
          }

          this.faceLoading = false;
        } else {
          console.warn('⚠️ [人脸监控] 后端返回格式不正确或code不为0');
          this.faceLoading = false;
        }
      } catch (error) {
        console.error('❌ [人脸监控] 加载实时数据失败:', error);
        if (error.response) {
          console.error('HTTP状态码:', error.response.status);
          console.error('错误信息:', error.response.data);
          if (error.response.status === 404) {
            console.error('⚠️ 接口不存在，请确认后端服务已重启并加载了 FaceMonitorController');
          }
        }
        this.faceLoading = false;
      }
    },

    /**
     * 加载人脸热力图数据
     */
    async loadFaceHeatmapData() {
      try {
        console.log('🚀 [人脸热力图] 开始加载数据...');
        const response = await axios.get('http://localhost:8675/parking/face-monitor/heatmap', {
          params: { timeRange: this.tabTimeRange || 'daily' }
        });

        console.log('📡 [人脸热力图] 后端响应:', response.data);

        if (response.data && response.data.code === '0' && response.data.data) {
          // 处理双层data嵌套的情况，优先检查直接存在的字段
          let heatmapData, entryData, exitData, locations;

          if (response.data.data.heatmapData && response.data.data.locations) {
            // 单层嵌套：response.data.data.* （优先）
            heatmapData = response.data.data.heatmapData;
            entryData = response.data.data.entryHeatmapData;
            exitData = response.data.data.exitHeatmapData;
            locations = response.data.data.locations;
            console.log('📦 [人脸热力图] 使用单层data结构');
          } else if (response.data.data.data && response.data.data.data.heatmapData) {
            // 双层嵌套：response.data.data.data.*
            heatmapData = response.data.data.data.heatmapData;
            entryData = response.data.data.data.entryHeatmapData;
            exitData = response.data.data.data.exitHeatmapData;
            locations = response.data.data.data.locations;
            console.log('📦 [人脸热力图] 检测到双层data嵌套');
          }

          // 检查数据有效性
          if (!heatmapData || !Array.isArray(heatmapData)) {
            console.warn('⚠️ [人脸热力图] 后端未返回有效的heatmapData数组');
            return;
          }

          if (!locations || !Array.isArray(locations)) {
            console.warn('⚠️ [人脸热力图] 后端未返回有效的locations数组');
            return;
          }

          // 保存完整数据和进出分类数据
          this.personHeatmapData = heatmapData;
          this.personEntryHeatmapData = entryData || [];
          this.personExitHeatmapData = exitData || [];
          this.faceHeatmapLocations = locations;

          console.log('✅ [人脸热力图] 加载成功，位置数:', this.faceHeatmapLocations.length,
            '总数据点:', heatmapData.length,
            '进场:', entryData ? entryData.filter(d => d[2] > 0).length : 0,
            '出场:', exitData ? exitData.filter(d => d[2] > 0).length : 0);
        } else {
          console.warn('⚠️ [人脸热力图] 后端返回格式不正确');
        }
      } catch (error) {
        console.error('❌ [人脸热力图] 加载数据失败:', error);
        console.error('错误详情:', error.response?.data || error.message);
      }
    },

    /**
     * 加载车辆监控实时数据（参考人脸监控实现）
     */
    async loadVehicleMonitorData() {
      try {
        // 使用现有的车辆数据服务获取最新数据
        const records = await vehicleDataService.getVehicleRecords(20);  // 获取20条最新记录
        
        // 模拟API响应格式
        const response = {
          data: {
            code: 0,
            data: records || []
          }
        };

        if (response.data && response.data.code === 0 && response.data.data) {
          const records = response.data.data;
          console.log(`📡 [车辆监控] 获取到 ${records.length} 条记录`);

          if (records.length > 0) {
            // 格式化记录
            const newRecords = records.map(record => ({
              id: record.id,
              license: record.plateNumber || record.license || record.carNo || '',
              plateNumber: record.plateNumber || record.license || record.carNo || '',
              channel: record.channelName || record.channel || '未知通道',
              channelName: record.channelName || record.channel || '未知通道',
              time: record.time || record.createTime,
              createTime: record.createTime || record.time,
              action: record.direction === 'in' ? '进场' : (record.direction === 'out' ? '出场' : '未知'),
              direction: record.direction,
              vipName: record.vipName || record.vehicleType || '普通用户',
              vehicleType: record.vehicleType || record.vipName || '普通用户',
              imageUrl: record.imageUrl || '',
              // 🔥 添加车牌颜色字段，确保车牌样式正确显示
              carColor: record.carColor || record.plateColor || '',
              enter_car_license_color: record.carColor || record.enter_car_license_color || record.plateColor || '',
              exit_car_license_color: record.carColor || record.exit_car_license_color || record.plateColor || '',
              enter_car_type: record.enter_car_type || '',
              plateColor: record.plateColor || record.carColor || '',
              rawData: record,
              isNew: true
            }));

            // 如果是首次加载，直接使用新数据（限制20条）
            if (this.vehicleRecords.length === 0) {
              this.vehicleRecords = newRecords.slice(0, 20);
              console.log(`✅ [车辆监控] 首次加载完成，${this.vehicleRecords.length} 条记录`);
            } else {
              // 合并新旧数据，去重，保留最新20条
              const existingTimes = new Set(this.vehicleRecords.map(r => r.createTime || r.time));
              const uniqueNewRecords = newRecords.filter(r => !existingTimes.has(r.createTime || r.time));

              if (uniqueNewRecords.length > 0) {
                // 将新数据添加到前面
                this.vehicleRecords = [...uniqueNewRecords, ...this.vehicleRecords].slice(0, 20);
                console.log(`🔄 [车辆监控] 更新完成，新增 ${uniqueNewRecords.length} 条记录`);

                // 短暂标记新记录
                setTimeout(() => {
                  this.vehicleRecords.forEach(r => r.isNew = false);
                }, 3000);
              }
            }

            // 🔥 更新车辆监控大图显示（高优先级全局更新）
            const latestWithImage = records.find(record => record.imageUrl);
            const latestRecord = latestWithImage || records[0]; // 优先有图片的，否则用最新的
            
            if (latestRecord) {
              const formattedTime = this.formatTime(latestRecord.time || latestRecord.createTime);
              const plateNumber = latestRecord.plateNumber || latestRecord.license || latestRecord.carNo || '';
              
              // 全局更新，高优先级，立即生效
              this.currentVehicleCamera = {
                channel: latestRecord.channelName || latestRecord.channel || '未知通道',
                timestamp: formattedTime,
                plateNumber: plateNumber,
                vehicleType: latestRecord.vipName || latestRecord.vehicleType || '普通用户',
                imageUrl: latestRecord.imageUrl ? this.getOptimizedImageUrl(latestRecord.imageUrl) : '',
                rawData: latestRecord,
                enter_car_license_color: latestRecord.enter_car_license_color || latestRecord.carColor || '',
                exit_car_license_color: latestRecord.exit_car_license_color || latestRecord.carColor || '',
                enter_car_type: latestRecord.enter_car_type || '',
                // 添加全局更新标记和时间戳，防止被其他机制覆盖
                _globalUpdateTime: Date.now(),
                _globalUpdate: true
              };
              console.log('🔥 [全局更新] 车辆监控大图已更新:', plateNumber, '时间:', formattedTime);
            }

            // 🔥 禁用车辆详情弹窗的自动同步更新，避免频繁刷新影响用户体验
            // 用户可通过点击"查询"按钮手动刷新数据
            // if (this.showDetailModal && (this.detailType === 'vehicle-entry' || this.detailType === 'vehicle-exit' || this.detailType === 'vehicle-onsite')) {
            //   console.log('🔄 [弹窗同步] 检测到车辆详情弹窗打开，同步更新弹窗数据');
            //   // 异步更新详情弹窗数据，不阻塞主流程
            //   this.$nextTick(() => {
            //     this.loadDetailData();
            //   });
            // }

            // 🔥 如果车辆通道弹窗正在显示，同时更新通道弹窗数据
            if (this.showChannelModal) {
              console.log('🔄 [通道弹窗同步] 检测到车辆通道弹窗打开，同步更新通道数据');
              let updatedChannelCount = 0;
              
              // 更新通道快照数据
              records.forEach(record => {
                const channelName = record.channelName || record.channel || '未知通道';
                if (channelName && record.imageUrl) {
                  // 检查是否是更新的数据
                  const existingSnapshot = this.channelSnapshots[channelName];
                  const recordTime = new Date(record.time || record.createTime || 0).getTime();
                  const existingTime = existingSnapshot && existingSnapshot.rawData ? 
                    new Date(existingSnapshot.rawData.time || existingSnapshot.rawData.createTime || 0).getTime() : 0;
                  
                  // 只有更新的数据才更新
                  if (!existingSnapshot || recordTime > existingTime) {
                    this.$set(this.channelSnapshots, channelName, {
                      channel: channelName,
                      imageUrl: record.imageUrl,
                      plateNumber: record.plateNumber || record.license || record.carNo || '',
                      timestamp: this.formatTime(record.time || record.createTime),
                      rawData: record // 保存原始数据用于时间比较
                    });
                    updatedChannelCount++;
                  }
                }
              });
              
              if (updatedChannelCount > 0) {
                console.log(`✅ [通道弹窗同步] 已更新 ${updatedChannelCount} 个通道的数据`);
                console.log(`📊 [通道弹窗同步] 当前通道总数: ${Object.keys(this.channelSnapshots).length}`);
                
                // 强制触发计算属性重新计算
                this.$nextTick(() => {
                  this.$forceUpdate();
                  console.log('🔄 [通道弹窗同步] 视图已强制刷新');
                });
              } else {
                console.log('💡 [通道弹窗同步] 没有发现更新的通道数据');
              }
            }
          }

          this.vehicleLoading = false;
        } else {
          console.warn('⚠️ [车辆监控] 后端返回格式不正确或code不为0');
          this.vehicleLoading = false;
        }
      } catch (error) {
        console.error('❌ [车辆监控] 加载实时数据失败:', error);
        this.vehicleLoading = false;
      }
    },

    /**
     * 加载统计数据（车辆、人脸、违规）
     */
    async loadStatisticsData() {
      try {
        console.log('🚀 [统计数据] 开始加载...', this.tabTimeRange);

        // 根据时间范围计算开始和结束时间
        const { startDate, endDate } = this.getDateRange(this.tabTimeRange);
        console.log('📅 [时间范围]', startDate, '-', endDate);

        // 并行加载所有数据
        const [vehicleEntry, vehicleExit, faceEntry, faceExit, violations] = await Promise.all([
          this.loadVehicleEntry(startDate, endDate),
          this.loadVehicleExit(startDate, endDate),
          this.loadFaceEntry(startDate, endDate),
          this.loadFaceExit(startDate, endDate),
          this.loadViolations(startDate, endDate)
        ]);

        // 计算在场车辆数
        const onSite = vehicleEntry - vehicleExit;

        // 更新数据
        this.vehicleData[this.tabTimeRange] = {
          entry: vehicleEntry,
          exit: vehicleExit,
          current: onSite > 0 ? onSite : 0,
          violation: violations
        };

        this.faceData[this.tabTimeRange] = {
          entry: faceEntry,
          exit: faceExit
        };

        console.log('✅ [统计数据] 加载完成:', {
          vehicle: this.vehicleData[this.tabTimeRange],
          face: this.faceData[this.tabTimeRange]
        });
      } catch (error) {
        console.error('❌ [统计数据] 加载失败:', error);
      }
    },

    /**
     * 获取日期范围
     */
    getDateRange(timeRange) {
      const now = new Date();
      let startDate, endDate;

      switch (timeRange) {
        case 'daily':
          // 今日：00:00:00 - 23:59:59
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'weekly':
          // 本周：周一到今天
          const dayOfWeek = now.getDay() || 7; // 周日为0，转为7
          startDate = new Date(now.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'monthly':
          // 本月：月1号到今天
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'yearly':
          // 今年：1月1号到今天
          startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      }

      // 转换为 YYYY-MM-DD HH:mm:ss 格式
      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      return {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
      };
    },

    /**
     * 统计车辆进场数（report_car_in）
     */
    async loadVehicleEntry(startDate, endDate) {
      try {
        const response = await axios.get('http://localhost:8675/parking/statistics/vehicle-entry', {
          params: { startDate, endDate }
        });
        // 处理双层data嵌套：response.data.data.data
        const result = response.data?.data?.data ?? response.data?.data ?? 0;
        console.log('✅ [车辆进场] 统计结果:', result);
        return typeof result === 'number' ? result : 0;
      } catch (error) {
        console.error('❌ [车辆进场] 统计失败:', error);
        return 0;
      }
    },

    /**
     * 统计车辆出场数（report_car_out）
     */
    async loadVehicleExit(startDate, endDate) {
      try {
        const response = await axios.get('http://localhost:8675/parking/statistics/vehicle-exit', {
          params: { startDate, endDate }
        });
        // 处理双层data嵌套：response.data.data.data
        const result = response.data?.data?.data ?? response.data?.data ?? 0;
        console.log('✅ [车辆出场] 统计结果:', result);
        return typeof result === 'number' ? result : 0;
      } catch (error) {
        console.error('❌ [车辆出场] 统计失败:', error);
        return 0;
      }
    },

    /**
     * 统计人脸进场数（acms_event_record）
     */
    async loadFaceEntry(startDate, endDate) {
      try {
        const response = await axios.get('http://localhost:8675/parking/statistics/face-entry', {
          params: { startDate, endDate }
        });
        // 处理双层data嵌套：response.data.data.data
        const result = response.data?.data?.data ?? response.data?.data ?? 0;
        return typeof result === 'number' ? result : 0;
      } catch (error) {
        console.error('❌ [人脸进场] 统计失败:', error);
        return 0;
      }
    },

    /**
     * 统计人脸出场数（acms_event_record）
     */
    async loadFaceExit(startDate, endDate) {
      try {
        const response = await axios.get('http://localhost:8675/parking/statistics/face-exit', {
          params: { startDate, endDate }
        });
        // 处理双层data嵌套：response.data.data.data
        const result = response.data?.data?.data ?? response.data?.data ?? 0;
        return typeof result === 'number' ? result : 0;
      } catch (error) {
        console.error('❌ [人脸出场] 统计失败:', error);
        return 0;
      }
    },

    /**
     * 统计违规数（直接调用外部API，与详情接口统一）
     */
    async loadViolations(startDate, endDate) {
      try {
        
        // 直接调用8543服务器违规API（配置CORS后）
        const response = await axios.get('https://www.xuerparking.cn:8543/parking/violations', {
          params: {
            page: 1,
            size: 100000000,  // 增加size获取更多数据，确保统计准确
            community: '东北林业大学',
            startDate,
            endDate
          }
        });
        
        // 检查响应数据类型，避免HTML响应导致的错误
        if (typeof response.data === 'string') {
          console.warn('⚠️ [违规统计] API返回HTML页面，可能是代理或服务器问题');
          return 0;
        }
        
        
        // 多层级获取总数，兼容不同响应格式（包括三层嵌套）
        let total = 0;
        if (response.data) {
          // 优先从total字段获取
          total = response.data.total ?? 
                 response.data.data?.total ?? 
                 response.data.data?.data?.total ??   // 添加三层嵌套支持
                 response.data.totalElements ?? 
                 response.data.data?.totalElements ?? 
                 response.data.data?.data?.totalElements ??  // 添加三层嵌套支持
                 // 如果没有total字段，从records数组长度获取
                 (response.data.records?.length) ?? 
                 (response.data.data?.records?.length) ?? 
                 (response.data.data?.data?.records?.length) ??  // 添加三层嵌套支持
                 (response.data.list?.length) ?? 
                 (response.data.data?.list?.length) ?? 
                 (response.data.data?.data?.list?.length) ?? 0;  // 添加三层嵌套支持
        }
        
        return typeof total === 'number' ? total : 0;
      } catch (error) {
        console.error('❌ [违规统计] 调用失败:', error);
        console.error('❌ [违规统计] 错误详情:', {
          message: error.message,
          status: error.response?.status,
          statusText: error.response?.statusText,
          data: error.response?.data
        });
        return 0;
      }
    },

    /**
     * 格式化时间 - 只显示时分秒
     */
    formatTime(timeStr) {
      if (!timeStr) return '--';

      try {
        const date = new Date(timeStr);
        
        // 🔥 检测无效日期，避免NaN显示
        if (isNaN(date.getTime())) {
          console.warn('⚠️ formatTime 无效时间:', timeStr);
          return '--';
        }
        
        const hours = date.getHours();
        const minutes = date.getMinutes();
        const seconds = date.getSeconds();
        
        // 🔥 再次检测NaN，确保安全
        if (isNaN(hours) || isNaN(minutes) || isNaN(seconds)) {
          console.warn('⚠️ formatTime 时间组件为NaN:', timeStr);
          return '--';
        }
        
        const result = `${String(hours).padStart(2, '0')}:${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`;
        // console.log('⏰ formatTime:', timeStr, '->', result);
        return result;
      } catch (e) {
        console.error('❌ formatTime 错误:', e, timeStr);
        return '--';
      }
    },

    // 初始化当前相机照片
    initCurrentCameras() {
      // 不使用默认车辆照片，保持空状态
      this.currentVehicleCamera = { channel: '', plateNumber: '', timestamp: '', imageUrl: '' };
      this.currentFaceCamera = this.faceCameras[0] || {};
    },

    // 初始化车辆记录
    async initVehicleRecords() {
      try {
        console.log('🚀 开始初始化车辆记录...');
        // 调用API获取车辆记录
        const records = await vehicleDataService.getVehicleRecords(10);  // 初始加载10条

        // 记录最后查询时间为最新记录的时间
        if (records && records.length > 0) {
          const latestRecord = records[0];
          if (latestRecord.createTime) {
            this.lastQueryTime = latestRecord.createTime;
            this.lastCarouselQueryTime = latestRecord.createTime;  // 轮播也使用相同的时间
          }
        }

        // 统一映射并去重
        const formatted = this.mapAndNormalizeRecords(records);

        // 按时间正序排序（最旧的在先，最新的在后）
        const sorted = this.dedupeRecords(formatted).sort((a, b) => {
          const timeA = new Date(a.time || 0).getTime();
          const timeB = new Date(b.time || 0).getTime();
          return timeA - timeB; // 正序：最旧的在先
        });

        this.vehicleRecords = sorted.slice(0, 20);

        // 将初始记录中有图片的加入到轮播队列（按时间正序）
        if (records && records.length > 0) {
          // 只筛选有图片的记录（和人脸监控一致，不做时间过滤）
          const recordsWithImages = records.filter(r => {
            return r && (r.imageUrl || (r.rawData && r.rawData.imageUrl));
          });
          
          // 按时间正序排序
          recordsWithImages.sort((a, b) => {
            const timeA = new Date(a.time || a.createTime || 0).getTime();
            const timeB = new Date(b.time || b.createTime || 0).getTime();
            return timeA - timeB; // 正序：最旧的在先
          });

          // 生成唯一标识并标记为已展示
          const getRecordId = (record) => {
            return `${record.createTime || record.time || Date.now()}_${record.license || record.plateNumber || record.carNo || ''}`;
          };

          // 同时标记为轮播和轮询的已展示记录
          recordsWithImages.forEach(record => {
            const recordId = getRecordId(record);
            this.shownRecordIds.push(recordId);
            this.pollingShownRecordIds.push(recordId);
          });

          // 保持数组大小限制
          if (this.shownRecordIds.length > 1000) {
            this.shownRecordIds = this.shownRecordIds.slice(-1000);
          }
          if (this.pollingShownRecordIds.length > 1000) {
            this.pollingShownRecordIds = this.pollingShownRecordIds.slice(-1000);
          }

          if (recordsWithImages.length > 0) {
            this.carouselQueue = recordsWithImages;
            // 启动轮播
            this.startCarousel();
          }
        }

        // 根据数据量动态调整加载动画时间
        const hasData = this.vehicleRecords && this.vehicleRecords.length > 0;
        const minAnimationTime = 2000; // 最少2秒动画时间
        const animationTime = hasData ? minAnimationTime : 3000; // 有数据2秒，无数据3秒

        setTimeout(() => {
          this.vehicleLoading = false;
        }, animationTime);

        // 初始化通道快照：从后端返回的记录中提取每个通道的最新一条
        const latestByChannel = {};
        (records || []).forEach(r => {
          const channel = r.channel || r.channelName || r.channelCode;
          if (!channel) return;
          const ts = new Date(r.time || r.createTime || Date.now()).getTime();
          if (!latestByChannel[channel] || ts >= latestByChannel[channel]._ts) {
            latestByChannel[channel] = { ...r, _ts: ts };
          }
        });
        Object.values(latestByChannel).forEach(r => {
          const snapshotCandidate = {
            channel: r.channel || r.channelName || r.channelCode,
            channelName: r.channelName,
            channelCode: r.channelCode,
            channelType: r.channelType || (r.eventType === 'in' ? 'entry' : 'exit'),
            plateNumber: r.plateNumber || r.license || r.carNo || '',
            license: r.license,
            carNo: r.carNo,
            imageUrl: r.imageUrl || (r.rawData && r.rawData.imageUrl) || '',
            time: r.time || r.createTime || Date.now(),
            createTime: r.createTime
          };
          this.updateChannelSnapshot(snapshotCandidate);
        });

        // 若已形成通道快照，则按白名单顺序选择一张用于车辆监控默认展示
        const preferredChannels = [...(this.entryChannelWhitelist || []), ...(this.exitChannelWhitelist || [])];
        for (const name of preferredChannels) {
          const s = (this.channelSnapshots || {})[name];
          const url = this.getChannelImage(s);
          if (s && url) {
            this.currentVehicleCamera = {
              channel: s.channel,
              timestamp: s.timestamp,
              plateNumber: s.plateNumber || '',
              imageUrl: this.withCacheBusting(url),
              // 传递车牌颜色字段用于判断车牌样式
              enter_car_license_color: s.enter_car_license_color || '',
              exit_car_license_color: s.exit_car_license_color || '',
              enter_car_type: s.enter_car_type || ''
            };
            break;
          }
        }

        // 使用有图片的最新记录刷新车辆监控照片
        const withImage = (records || []).find(r => r.imageUrl || (r.rawData && r.rawData.imageUrl));
        if (withImage) {
          const originalImageUrl = withImage.imageUrl || (withImage.rawData && withImage.rawData.imageUrl) || '';
          const optimizedUrl = this.getOptimizedImageUrl(originalImageUrl);
          this.currentVehicleCamera = {
            channel: withImage.channel || withImage.channelName || '未知通道',
            timestamp: this.formatTime(withImage.time || withImage.createTime || Date.now()),
            plateNumber: withImage.plateNumber || withImage.license || withImage.carNo || '',
            vehicleType: withImage.vipName || withImage.vehicleType || '普通用户',
            imageUrl: this.withCacheBusting(optimizedUrl),
            // 传递车牌颜色字段用于判断车牌样式 - 优先使用后端返回的carColor字段
            enter_car_license_color: withImage.carColor || withImage.enter_car_license_color || withImage.plateColor || (withImage.rawData && withImage.rawData.enter_car_license_color) || '',
            exit_car_license_color: withImage.carColor || withImage.exit_car_license_color || withImage.plateColor || (withImage.rawData && withImage.rawData.exit_car_license_color) || '',
            enter_car_type: withImage.enter_car_type || (withImage.rawData && withImage.rawData.enter_car_type) || ''
          };
        }
      } catch (error) {
        console.error('❌ 获取车辆记录失败:', error);
        // 不再添加任何模拟数据
        this.vehicleRecords = [];

        // 即使出错也要停止加载动画，但延迟更长时间
        setTimeout(() => {
          this.vehicleLoading = false;
          console.log('🎬 车辆表格加载动画结束（错误情况）');
        }, 3000); // 错误情况下3秒后停止动画
      }
    },

    // 初始化人脸记录
    initPersonRecords() {
      this.personRecords = [];
      for (let i = 0; i < 6; i++) {
        this.addPersonRecord();
      }
    },

    /**
     * 添加车辆记录（已弃用）
     * @deprecated 现在使用轮询方式从后端获取真实数据，通过 addPolledRecord() 方法处理
     */
    addVehicleRecord(record) {
      console.warn('⚠️ addVehicleRecord 方法已弃用，请使用 addPolledRecord() 方法');
    },

    // 添加人脸记录
    addPersonRecord() {
      const now = new Date();
      const year = now.getFullYear();
      const month = (now.getMonth() + 1).toString().padStart(2, '0');
      const day = now.getDate().toString().padStart(2, '0');
      const hours = now.getHours().toString().padStart(2, '0');
      const minutes = now.getMinutes().toString().padStart(2, '0');
      const seconds = now.getSeconds().toString().padStart(2, '0');
      const time = `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;

      const surnames = ['王', '李', '张', '刘', '陈', '杨', '赵', '黄', '周', '吴'];
      const names = ['伟', '芳', '娜', '秀英', '敏', '静', '丽', '强', '磊', '军'];

      const surname = surnames[Math.floor(Math.random() * surnames.length)];
      const name = names[Math.floor(Math.random() * names.length)];
      const fullName = surname + name;

      const channels = ['东门入口', '西门入口', '南门入口', '北门入口', '东门出口', '西门出口', '南门出口', '北门出口'];
      const channel = channels[Math.floor(Math.random() * channels.length)];

      const types = ['进场', '离场'];
      const type = types[Math.floor(Math.random() * types.length)];
      const channelType = channel.includes('入口') ? 'entry' : (channel.includes('出口') ? 'exit' : (type === '进场' ? 'entry' : 'exit'));

      this.personRecords.unshift({
        name: fullName,
        channel,
        channelType,
        action: type,
        time,
        isNew: true
      });

      // 保持最多6条记录
      if (this.personRecords.length > 10) {
        this.personRecords.pop();
      }

      // 清除新记录标记
      setTimeout(() => {
        this.personRecords.forEach(record => {
          record.isNew = false;
        });
      }, 1000);
    },

    // 测量内容高度
    measureContentHeights() {
      const vehicleBody = this.$refs.vehicleTableBody;
      const faceBody = this.$refs.faceTableBody;

      if (vehicleBody) {
        const content = vehicleBody.querySelector('.table-content');
        if (content) {
          this.vehicleContentHeight = content.scrollHeight / 2;
        }
      }

      if (faceBody) {
        const content = faceBody.querySelector('.table-content');
        if (content) {
          this.faceContentHeight = content.scrollHeight / 2;
        }
      }
    },

    // 开始自动滚动
    startAutoScrolls() {
      this.startVehicleAutoScroll();
      this.startFaceAutoScroll();
    },

    // 车辆表格自动滚动
    startVehicleAutoScroll() {
      const body = this.$refs.vehicleTableBody;
      if (!body || this.vehicleAutoScrollTimer) return;
      const stepPx = 1;
      const intervalMs = 40;
      this.vehicleAutoScrollTimer = setInterval(() => {
        if (!body) return;
        body.scrollTop += stepPx;
        if (this.vehicleContentHeight > 0 && body.scrollTop >= this.vehicleContentHeight) {
          body.scrollTop -= this.vehicleContentHeight;
        }
      }, intervalMs);
    },

    // 人脸表格自动滚动
    startFaceAutoScroll() {
      const body = this.$refs.faceTableBody;
      if (!body || this.faceAutoScrollTimer) return;
      const stepPx = 1;
      const intervalMs = 40;
      this.faceAutoScrollTimer = setInterval(() => {
        if (!body) return;
        body.scrollTop += stepPx;
        if (this.faceContentHeight > 0 && body.scrollTop >= this.faceContentHeight) {
          body.scrollTop -= this.faceContentHeight;
        }
      }, intervalMs);
    },

    // 停止车辆表格自动滚动
    stopVehicleAutoScroll() {
      if (this.vehicleAutoScrollTimer) {
        clearInterval(this.vehicleAutoScrollTimer);
        this.vehicleAutoScrollTimer = null;
      }
    },

    // 停止人脸表格自动滚动
    stopFaceAutoScroll() {
      if (this.faceAutoScrollTimer) {
        clearInterval(this.faceAutoScrollTimer);
        this.faceAutoScrollTimer = null;
      }
    },

    // 开始数据生成
    startDataGeneration() {
      console.log('🔄 开始数据生成定时器...');

      // 🔥 禁用车辆记录更新，避免与pollLatestRecords冲突
      // 现在由 pollLatestRecords() 轮询机制统一处理车辆数据更新
      // this.dataGenerationTimer = setInterval(async () => {
      //   try {
      //     const records = await vehicleDataService.getVehicleRecords();
      //     if (records && records.length > 0) {
      //       const mapped = this.mapAndNormalizeRecords(records).slice(0, 5);
      //       const merged = this.dedupeRecords([...mapped, ...this.vehicleRecords]);
      //       this.vehicleRecords = merged.slice(0, 20);
      //     }
      //   } catch (error) {
      //     console.error('❌ 获取车辆记录失败:', error);
      //   }
      // }, 8000);

      // 每10秒更新实时流量数据
      setInterval(async () => {
        try {
          // console.log('📈 定时获取实时流量数据...');
          const flowData = await vehicleDataService.getRealTimeFlow();
          // console.log('📈 获取到流量数据:', flowData);
          // 更新实时流量数据到父组件
          this.$emit('update-flow-data', flowData);
        } catch (error) {
          console.error('❌ 获取实时流量数据失败:', error);
        }
      }, 10000); // 10秒间隔

    },

    // 获取车牌类型（传统燃油车或新能源车）
    getPlateType(plateNumber, record = {}) {
      if (!plateNumber) return 'traditional';
      const plate = plateNumber.trim().toUpperCase();
    


      // 首先按车牌位数判
      if (plate.length === 8) {
        // 8位车牌 = 新能源车（绿牌
        return 'new-energy';
      }

      // 7位车牌需要根据颜色判断
      if (plate.length === 7) {
        // 获取后端数据库中的车牌颜色字段 - 添加 carColor 支持（后端API返回的字段名）
        let licenseColor = (record.carColor || record.enter_car_license_color || record.exit_car_license_color || record.plateColor || record.enterCarLicenseColor || record.leaveCarLicenseColor || '').toString().toLowerCase();

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
        
        // 判断警车
        if (/警$/.test(plate)) {
          console.log(`🎨 [车牌样式] ${plate} - 警车 → 样式: police`);
          return 'police';
        }
        
        // 按 enter_car_type 2 返回黄牌
        if (record && String(record.enter_car_type) === '2') {
          console.log(`🎨 [车牌样式] ${plate} - enter_car_type=2 → 样式: yellow`);
          return 'yellow';
        }

        // 默认7位车牌当作蓝牌
        console.log(`🎨 [车牌样式] ${plate} - 默认 → 样式: traditional`);
        return 'traditional';
      }

      // 其他长度车牌默认处理
      return 'traditional';
    },

    /**
     * 开始车辆记录轮询
     */
    async startVehiclePolling() {
      console.log(`🔄 [轮询] 开始轮询车辆记录，间隔: ${this.pollingInterval}ms`);

      // 🔥 启动前立即执行一次查询，确保刷新后能立即获取最新数据
      console.log('🚀 [轮询] 立即执行首次查询...');
      try {
        await this.pollLatestRecords();
      } catch (error) {
        console.error('❌ [轮询] 首次查询失败:', error);
      }

      // 设置定时器，定期查询最新记录
      this.pollingTimer = setInterval(async () => {
        console.log(`⏰ [轮询定时器] 触发第 ${++this.pollingCount || 1} 次轮询`);
        try {
          await this.pollLatestRecords();
        } catch (error) {
          console.error('❌ [轮询定时器] 执行失败，但定时器将继续:', error);
        }
      }, this.pollingInterval);
    },

    /**
     * 轮询查询最新记录（仅更新表格数据）
     */
    async pollLatestRecords() {
      try {
        // 使用增量查询，只获取上次查询时间之后的新记录
        const newRecords = await vehicleDataService.getIncrementalVehicleRecords(
          this.lastQueryTime,
          10  // 每次最多查询10条新记录
        );

        if (newRecords && newRecords.length > 0) {
          console.log(`✅ [轮询] 查询到 ${newRecords.length} 条新记录（仅更新表格）`);
          // 🔍 调试：查看第一条记录的车牌颜色字段
          if (newRecords[0]) {
            console.log('🔍 [轮询原始数据] 第一条记录的颜色字段:', {
              plateNumber: newRecords[0].plateNumber || newRecords[0].license,
              carColor: newRecords[0].carColor,
              enter_car_license_color: newRecords[0].enter_car_license_color,
              exit_car_license_color: newRecords[0].exit_car_license_color,
              plateColor: newRecords[0].plateColor,
              enter_car_type: newRecords[0].enter_car_type,
              allKeys: Object.keys(newRecords[0])
            });
          }

          // 生成记录的唯一标识
          const getRecordId = (record) => {
            return `${record.createTime || record.time || Date.now()}_${record.license || record.plateNumber || record.carNo || ''}`;
          };

          // 去重检查（和人脸监控一致，不做时间过滤）
          const uniqueRecords = newRecords.filter(record => {
            const recordId = getRecordId(record);
            const isNew = !this.pollingShownRecordIds.includes(recordId);
            
            if (isNew) {
              // 标记为已展示（用于轮询去重）
              this.pollingShownRecordIds.push(recordId);
              // 保持数组大小，只保留最近1000条记录ID
              if (this.pollingShownRecordIds.length > 1000) {
                this.pollingShownRecordIds = this.pollingShownRecordIds.slice(-1000);
              }
            }
            return isNew;
          });


          // 按时间正序排序新记录
          const sortedNewRecords = [...uniqueRecords].sort((a, b) => {
            const timeA = new Date(a.time || a.createTime || 0).getTime();
            const timeB = new Date(b.time || b.createTime || 0).getTime();
            return timeA - timeB; // 正序：最旧的在先
          });

          // 只更新表格数据，不添加到轮播队列
          // 轮播会自己获取数据
          sortedNewRecords.forEach(record => {
            this.addPolledRecord(record);
          });

          // 🔥 立即显示最新记录（像人脸监控一样实时更新）
          if (sortedNewRecords.length > 0) {
            const latestNewRecord = sortedNewRecords[sortedNewRecords.length - 1]; // 取最新的
            console.log('🔥 [实时更新] 立即显示最新车辆记录:', latestNewRecord.license || latestNewRecord.plateNumber);
            console.log('🔥 [实时更新] 记录时间:', latestNewRecord.time || latestNewRecord.createTime);
            console.log('🔥 [实时更新] 当前时间:', new Date().toLocaleString());
            
            // 格式化最新记录
            const formattedRecord = {
              imageUrl: latestNewRecord.imageUrl || (latestNewRecord.rawData && latestNewRecord.rawData.imageUrl) || '',
              license: latestNewRecord.license || latestNewRecord.plateNumber || latestNewRecord.carNo || '',
              channel: latestNewRecord.channel || latestNewRecord.channelName || latestNewRecord.channelCode || '未知通道',
              channelType: latestNewRecord.channelType || (latestNewRecord.eventType === 'in' ? 'entry' : 'exit'),
              action: latestNewRecord.action || (latestNewRecord.status === '进场' ? '进场' : '离场'),
              vehicleType: latestNewRecord.vehicleType || latestNewRecord.vipName || '普通用户',
              vipName: latestNewRecord.vipName || latestNewRecord.vehicleType || '普通用户',
              time: this.formatTime(latestNewRecord.time || latestNewRecord.createTime || latestNewRecord.appointmentTime || Date.now()),
              enter_car_license_color: latestNewRecord.carColor || latestNewRecord.enter_car_license_color || latestNewRecord.plateColor || (latestNewRecord.rawData && latestNewRecord.rawData.enter_car_license_color) || '',
              exit_car_license_color: latestNewRecord.carColor || latestNewRecord.exit_car_license_color || latestNewRecord.plateColor || (latestNewRecord.rawData && latestNewRecord.rawData.exit_car_license_color) || '',
              enter_car_type: latestNewRecord.enter_car_type || (latestNewRecord.rawData && latestNewRecord.rawData.enter_car_type) || ''
            };
            
            // 立即更新车辆监控照片（参考人脸监控的方式）
            if (formattedRecord.imageUrl) {
              this.currentVehicleCamera = {
                channel: formattedRecord.channel,
                timestamp: formattedRecord.time,
                plateNumber: formattedRecord.license,
                vehicleType: formattedRecord.vehicleType,
                imageUrl: formattedRecord.imageUrl,
                rawData: latestNewRecord.rawData || null,
                enter_car_license_color: formattedRecord.enter_car_license_color,
                exit_car_license_color: formattedRecord.exit_car_license_color,
                enter_car_type: formattedRecord.enter_car_type
              };
              console.log('✅ [实时更新] 车辆监控照片已更新');
            }
          }

          // 更新最后查询时间为最新记录的时间
          const latestRecord = newRecords[0];
          if (latestRecord.createTime) {
            this.lastQueryTime = latestRecord.createTime;
            console.log(`📅 [轮询] 更新lastQueryTime: ${this.lastQueryTime}`);
          }
        }
      } catch (error) {
        console.error('❌ [轮询] 查询新记录失败:', error);
        // 🔥 即使出错也要确保轮询继续进行
        console.log('✅ [轮询] 将在下一个周期继续尝试...');
      }
    },


    /**
     * 添加轮询获取到的记录
     */
    addPolledRecord(record) {
      console.log('📥 [表格] 准备添加记录:', {
        license: record.license || record.plateNumber || record.carNo,
        hasImage: !!(record.imageUrl || (record.rawData && record.rawData.imageUrl)),
        time: record.time || record.createTime
      });

      const formattedRecord = {
        imageUrl: record.imageUrl || (record.rawData && record.rawData.imageUrl) || '',
        license: record.license || record.plateNumber || record.carNo || '',
        channel: record.channel || record.channelName || record.channelCode || '未知通道',
        channelType: record.channelType || (record.eventType === 'in' ? 'entry' : 'exit'),
        action: record.action || (record.status === '进场' ? '进场' : '离场'),
        vehicleType: record.vehicleType || record.vipName || '普通用户',
        vipName: record.vipName || record.vehicleType || '普通用户',
        time: this.formatTime(record.time || record.createTime || record.appointmentTime || Date.now()),
        // 保留车牌颜色字段用于判断车牌样式 - 优先使用carColor字段
        enter_car_license_color: record.carColor || record.enter_car_license_color || (record.rawData && record.rawData.enter_car_license_color) || '',
        exit_car_license_color: record.carColor || record.exit_car_license_color || (record.rawData && record.rawData.exit_car_license_color) || '',
        enter_car_type: record.enter_car_type || (record.rawData && record.rawData.enter_car_type) || '',
        isNew: true
      };

      console.log('📋 [表格] 格式化后的记录:', {
        license: formattedRecord.license,
        channel: formattedRecord.channel,
        time: formattedRecord.time,
        carColor: record.carColor,
        enter_car_license_color: formattedRecord.enter_car_license_color,
        exit_car_license_color: formattedRecord.exit_car_license_color,
        enter_car_type: formattedRecord.enter_car_type
      });

      const beforeCount = this.vehicleRecords.length;

      // 合并并去重
      let merged = this.dedupeRecords([formattedRecord, ...this.vehicleRecords]);

      console.log('🔄 [表格] 去重前记录数:', beforeCount + 1, '去重后记录数:', merged.length);

      // 按时间正序排序（最旧的在先，最新的在后）
      merged = merged.sort((a, b) => {
        const timeA = new Date(a.time || 0).getTime();
        const timeB = new Date(b.time || 0).getTime();
        return timeA - timeB; // 正序：最旧的在先
      });

      const afterMergeCount = merged.length;
      this.vehicleRecords = merged.slice(0, 20);

      console.log(`📊 [表格] 表格记录数变化: ${beforeCount} → ${afterMergeCount} → ${this.vehicleRecords.length} (保留最新20条)`);

      // 更新通道快照数据（用于弹窗显示）
      this.updateChannelSnapshotFromFormatted(formattedRecord);

      // 注意：不再在这里更新图片，由轮播机制负责更新

      // 新数据插入后，保持无缝滚动
      this.$nextTick(() => {
        const body = this.$refs.vehicleTableBody;
        if (!body) return;

        // 重新测量内容高度
        this.measureContentHeights();

        // 如果滚动停止，强制重新启动
        if (!this.vehicleAutoScrollTimer) {
          console.log('🔄 检测到滚动停止，重新启动车辆表格滚动');
          this.startVehicleAutoScroll();
        }

        // 平滑滚动位置调整
        const maxScroll = Math.max(0, body.scrollHeight - body.clientHeight);
        if (maxScroll > 0) {
          if (body.scrollTop >= this.vehicleContentHeight && this.vehicleContentHeight > 0) {
            body.scrollTop -= this.vehicleContentHeight;
          }
          // 确保滚动不停止，如果接近底部则重置
          if (body.scrollTop >= maxScroll - 10) {
            body.scrollTop = 0;
          }
        }
      });

      // 清除新记录标记
      setTimeout(() => {
        this.vehicleRecords.forEach(record => {
          record.isNew = false;
        });
      }, 2000);
    },

    /**
     * 启动轮播
     */
    startCarousel() {
      // 如果队列为空，不启动
      if (this.carouselQueue.length === 0) {
        console.log('🎠 [轮播] 队列为空，不启动轮播');
        return;
      }

      if (this.carouselTimer) {
        clearInterval(this.carouselTimer);
      }

      // 立即显示第一条记录
      this.showCarouselItem(0);

      // 每隔指定时间切换到下一条（会自动显示并删除第一条）
      this.carouselTimer = setInterval(() => {
        this.nextCarouselItem();
      }, this.carouselInterval);

      console.log(`🎠 [轮播] 轮播已启动，队列长度: ${this.carouselQueue.length}，显示间隔: ${this.carouselInterval}ms`);
    },

    /**
     * 停止轮播
     */
    stopCarousel() {
      if (this.carouselTimer) {
        clearInterval(this.carouselTimer);
        this.carouselTimer = null;
        console.log('🎠 [轮播] 轮播已停止');
      }
    },

    /**
     * 切换到下一条记录
     */
    async nextCarouselItem() {
      // 如果队列为空，尝试获取新数据并停止轮播
      if (this.carouselQueue.length === 0) {
        console.log('🎠 [轮播] 队列为空，停止轮播并尝试获取新数据');
        this.stopCarousel();

        if (!this.isFetchingNextBatch) {
          this.fetchNextBatch().catch(error => {
            console.error('🎠 [轮播] 获取新数据失败:', error);
          });
        }

        return;
      }

      // 显示第一条记录（索引始终为0，因为我们会删除已播放的记录）
      this.showCarouselItem(0);

      // 2秒后删除已播放的记录
      setTimeout(() => {
        if (this.carouselQueue.length > 0) {
          const removedRecord = this.carouselQueue.shift(); // 删除并返回第一条记录
          const plateNumber = removedRecord.license || removedRecord.plateNumber || removedRecord.carNo || '未知车牌';
          console.log(`🎠 [轮播] 已删除记录，车牌: ${plateNumber}，剩余 ${this.carouselQueue.length} 条`);

          // 检查剩余记录数量，如果少于3条，主动获取新数据
          if (this.carouselQueue.length < 3 && !this.isFetchingNextBatch) {
            console.log(`🎠 [轮播] 剩余 ${this.carouselQueue.length} 条记录，主动获取新数据以保持轮播持续`);
            // 异步获取新数据，不等待完成，避免阻塞轮播
            this.fetchNextBatch().catch(error => {
              console.error('🎠 [轮播] 主动获取新数据失败:', error);
            });
          }

          // 如果删除后队列为空，停止轮播
          if (this.carouselQueue.length === 0) {
            console.log('🎠 [轮播] 队列已清空，停止轮播');
            this.stopCarousel();
          }
        }
      }, 2000); // 2秒后删除
    },

    /**
     * 显示指定索引的记录
     */
    showCarouselItem(index) {
      // 如果队列为空，不显示
      if (this.carouselQueue.length === 0) {
        console.log('🎠 [轮播] 队列为空，不显示');
        return;
      }

      if (index < 0 || index >= this.carouselQueue.length) {
        console.warn(`🎠 [轮播] 无效的索引: ${index}，队列长度: ${this.carouselQueue.length}`);
        return;
      }

      const record = this.carouselQueue[index];
      if (!record) {
        console.warn(`🎠 [轮播] 记录不存在，索引: ${index}`);
        return;
      }

      const plateNumber = record.license || record.plateNumber || record.carNo || '未知车牌';
      console.log(`🎠 [轮播] 显示第 ${index + 1}/${this.carouselQueue.length} 条记录，车牌: ${plateNumber}`);

      // 格式化和更新当前车辆监控大图
      const formattedRecord = {
        imageUrl: record.imageUrl || (record.rawData && record.rawData.imageUrl) || '',
        license: record.license || record.plateNumber || record.carNo || '',
        channel: record.channel || record.channelName || record.channelCode || '未知通道',
        channelType: record.channelType || (record.eventType === 'in' ? 'entry' : 'exit'),
        action: record.action || (record.status === '进场' ? '进场' : '离场'),
        vehicleType: record.vehicleType || record.vipName || '普通用户',
        vipName: record.vipName || record.vehicleType || '普通用户',
        time: this.formatTime(record.time || record.createTime || record.appointmentTime || Date.now()),
        enter_car_license_color: record.carColor || record.enter_car_license_color || record.plateColor || (record.rawData && record.rawData.enter_car_license_color) || '',
        exit_car_license_color: record.carColor || record.exit_car_license_color || record.plateColor || (record.rawData && record.rawData.exit_car_license_color) || '',
        enter_car_type: record.enter_car_type || (record.rawData && record.rawData.enter_car_type) || ''
      };

      // 无论是否有图片，都显示记录
      if (record && (record.imageUrl || (record.rawData && record.rawData.imageUrl))) {
        // 有图片：预加载图片以确保可用性
        const originalImageUrl = record.imageUrl || (record.rawData && record.rawData.imageUrl) || '';
        const optimizedUrl = this.getOptimizedImageUrl(originalImageUrl);

        // 检查是否有更新的全局更新，避免覆盖
        const currentGlobalUpdateTime = this.currentVehicleCamera._globalUpdateTime || 0;
        const now = Date.now();
        
        // 如果全局更新是5秒内的，不要覆盖
        if (now - currentGlobalUpdateTime < 5000) {
          console.log('🛡️ [轮播] 检测到近期全局更新，跳过轮播更新');
          return;
        }
        
        // 参考人脸监控方式：直接设置数据，不做预加载
        this.currentVehicleCamera = {
          channel: formattedRecord.channel,
          timestamp: this.formatTime(record.time || record.createTime), // 🔥 使用formatTime格式化时间
          plateNumber: formattedRecord.license,
          vehicleType: formattedRecord.vipName || formattedRecord.vehicleType,
          imageUrl: optimizedUrl,  // 直接使用原始URL，不添加缓存破坏
          rawData: record.rawData || null,
          enter_car_license_color: formattedRecord.enter_car_license_color,
          exit_car_license_color: formattedRecord.exit_car_license_color,
          enter_car_type: formattedRecord.enter_car_type,
          _globalUpdate: false // 标记为轮播更新
        };
        
        console.log('🔄 [车辆相机] 实时更新:', {
          channel: formattedRecord.channel,
          plateNumber: formattedRecord.license,
          imageUrl: optimizedUrl
        });
      } else {
        // 检查是否有更新的全局更新，避免覆盖（无图片情况）
        const currentGlobalUpdateTime = this.currentVehicleCamera._globalUpdateTime || 0;
        const now = Date.now();
        
        // 如果全局更新是5秒内的，不要覆盖
        if (now - currentGlobalUpdateTime < 5000) {
          console.log('🛡️ [轮播] 检测到近期全局更新，跳过无图片轮播更新');
          return;
        }
        
        // 没有图片：不设置 imageUrl，让前端显示占位符
        console.log('⚠️ 记录没有图片，显示加载占位符');
        this.currentVehicleCamera = {
          channel: formattedRecord.channel,
          timestamp: this.formatTime(record.time || record.createTime), // 🔥 使用formatTime格式化时间
          plateNumber: formattedRecord.license,
          imageUrl: '', // 空字符串，触发占位符显示
          rawData: record.rawData,
          _globalUpdate: false // 标记为轮播更新
        };
        console.log('🔄 使用占位符设置相机:', this.currentVehicleCamera);
      }
    },

    /**
     * 获取下一批数据（去重）
     */
    async fetchNextBatch() {
      // 如果已经在获取数据，直接返回
      if (this.isFetchingNextBatch) {
        console.log('🎠 [轮播] 正在获取数据，跳过重复请求');
        return;
      }

      this.isFetchingNextBatch = true;

      try {
        console.log('🔍 [轮播] 开始获取下一批数据...');

        // 获取新记录（使用独立的轮播查询时间）
        const newRecords = await vehicleDataService.getIncrementalVehicleRecords(
          this.lastCarouselQueryTime,
          10  // 每次获取10条
        );

        if (!newRecords || newRecords.length === 0) {
          console.log('📭 [轮播] 没有新数据，等待1秒后继续查询...');
          // 如果没有新数据，等待1秒后继续查询（不重置标志，继续等待）
          this.isFetchingNextBatch = false;
          setTimeout(async () => {
            await this.fetchNextBatch();
          }, 1000);
          return;
        }

        console.log(`📋 [轮播] 获取到 ${newRecords.length} 条新记录`);
        console.log(`📊 [轮播] 当前已展示记录数: ${this.shownRecordIds.length}`);

        // 生成记录的唯一标识（使用 createTime + license）
        const getRecordId = (record) => {
          return `${record.createTime || record.time || Date.now()}_${record.license || record.plateNumber || record.carNo || ''}`;
        };

        // 调试：打印第一条记录的详情
        if (newRecords.length > 0) {
          const firstRecord = newRecords[0];
          const firstRecordId = getRecordId(firstRecord);
          const isFirstDuplicate = this.shownRecordIds.includes(firstRecordId);
          console.log(`🔍 [轮播] 第一条记录信息:`, {
            license: firstRecord.license || firstRecord.plateNumber || firstRecord.carNo,
            createTime: firstRecord.createTime || firstRecord.time,
            recordId: firstRecordId,
            isDuplicate: isFirstDuplicate,
            shownInHistory: isFirstDuplicate ? '✅' : '❌'
          });
        }

        // 去重检查（和人脸监控一致，不做时间过滤）
        const uniqueRecords = newRecords.filter(record => {
          const recordId = getRecordId(record);
          const isNew = !this.shownRecordIds.includes(recordId);
          
          if (isNew) {
            // 标记为已展示
            this.shownRecordIds.push(recordId);
            // 保持数组大小，只保留最近1000条记录ID
            if (this.shownRecordIds.length > 1000) {
              this.shownRecordIds = this.shownRecordIds.slice(-1000);
            }
          }
          return isNew;
        });

        console.log(`✅ [轮播] 过滤后剩余 ${uniqueRecords.length} 条新记录（已去重）`);

        if (uniqueRecords.length === 0) {
          console.log('⚠️ [轮播] 所有新数据都是重复的，等待1秒后继续查询...');
          // 如果全部是重复数据，等待1秒后继续查询
          this.isFetchingNextBatch = false;
          setTimeout(async () => {
            await this.fetchNextBatch();
          }, 1000);
          return;
        }

        // 按时间正序排序
        uniqueRecords.sort((a, b) => {
          const timeA = new Date(a.time || a.createTime || 0).getTime();
          const timeB = new Date(b.time || b.createTime || 0).getTime();
          return timeA - timeB; // 正序：最旧的在先
        });

        // 调试：打印每条记录的图片信息
        console.log('🖼️ [轮播] 新记录图片信息:');
        uniqueRecords.forEach((r, index) => {
          const hasImage = !!(r.imageUrl || (r.rawData && r.rawData.imageUrl));
          console.log(`  记录${index + 1}: 车牌=${r.license || r.plateNumber || r.carNo}, 有图片=${hasImage ? '✅' : '❌'}`);
        });

        // 更新轮播查询时间为最新记录的时间（排序后的最后一条）
        const latestRecord = uniqueRecords[uniqueRecords.length - 1];
        if (latestRecord && latestRecord.createTime) {
          this.lastCarouselQueryTime = latestRecord.createTime;
          console.log(`📅 [轮播] 更新lastCarouselQueryTime: ${this.lastCarouselQueryTime}`);
        }

        console.log(`📊 [轮播] 获取到 ${uniqueRecords.length} 条新记录，全部添加到轮播队列和表格`);

        // 记录获取新数据前的队列长度和轮播状态
        const wasQueueEmpty = this.carouselQueue.length === 0;
        const wasCarouselRunning = !!this.carouselTimer;

        if (uniqueRecords.length > 0) {
          if (this.carouselQueue.length === 0) {
            // 如果队列为空，替换整个队列
            this.carouselQueue = uniqueRecords;
            this.currentCarouselIndex = 0;
            console.log(`🎠 [轮播] 替换队列为 ${uniqueRecords.length} 条记录`);
          } else {
            // 如果队列不为空，追加到队列末尾
            this.carouselQueue.push(...uniqueRecords);
            console.log(`🎠 [轮播] 追加 ${uniqueRecords.length} 条新记录到轮播队列（当前队列总长度: ${this.carouselQueue.length}）`);
          }

          // 更新表格数据（无论是否有图片都添加）
          uniqueRecords.forEach(record => {
            this.addPolledRecord(record);
          });

          // 如果之前队列为空且没有轮播，现在有数据了，启动轮播
          if (wasQueueEmpty && !wasCarouselRunning && this.carouselQueue.length > 0) {
            console.log('🎠 [轮播] 获取到新数据，启动轮播');
            this.startCarousel();
          }
        }

        // 成功完成，重置标志
        this.isFetchingNextBatch = false;

      } catch (error) {
        console.error('❌ [轮播] 获取下一批数据失败:', error);
        // 出错时继续查询
        this.isFetchingNextBatch = false;
        setTimeout(() => {
          this.fetchNextBatch();
        }, 1000);
      }
    },

    // 格式化时间

    // 防缓存：为图片URL追加时间戳参数（使用毫秒级时间戳，确保每次都是最新）
    withCacheBusting(url) {
      if (!url) return '';
      // 检查网络连接状态
      if (!navigator.onLine) {
        console.warn('网络连接不可用，跳过缓存破坏');
        return url;
      }
      const sep = url.includes('?') ? '&' : '?';
      // 使用毫秒级时间戳，确保每次都是唯一的URL
      const timestamp = Date.now();
      return `${url}${sep}t=${timestamp}`;
    },

    // 检查网络连接状态
    checkNetworkStatus() {
      return navigator.onLine;
    },

    // 预加载图片并检查可用性
    async preloadImage(url) {
      return new Promise((resolve, reject) => {
        if (!this.checkNetworkStatus()) {
          reject(new Error('网络连接不可用'));
          return;
        }

        const img = new Image();
        img.onload = () => resolve(url);
        img.onerror = () => reject(new Error('图片加载失败'));

        // 设置超时
        const timeout = setTimeout(() => {
          reject(new Error('图片加载超时'));
        }, 10000); // 10秒超时

        img.onload = () => {
          clearTimeout(timeout);
          resolve(url);
        };

        img.onerror = () => {
          clearTimeout(timeout);
          reject(new Error('图片加载失败'));
        };

        // 尝试不同的加载方式
        try {
          img.src = url;
        } catch (err) {
          clearTimeout(timeout);
          reject(err);
        }
      });
    },

    // 智能图片URL处理：强制使用HTTP协议
    getOptimizedImageUrl(originalUrl) {
      if (!originalUrl) return '';

      try {
        const url = new URL(originalUrl);
        // 对于特定域名，强制使用HTTP协议
        if (url.hostname.includes('cl.nefu.edu.cn')) {
          // 强制使用HTTP协议，因为HTTPS访问不了
          const httpUrl = originalUrl.replace(/^https:/, 'http:');
          // console.log('检测到nefu域名，强制使用HTTP协议:', httpUrl);
          return httpUrl;
        }
        return originalUrl;
      } catch (err) {
        console.warn('URL解析失败:', err);
        return originalUrl;
      }
    },

    // 图片加载失败时回调
    onVehicleImageError(e) {
      const img = e.target;
      const currentUrl = img.src;

      // 在元素上记录重试次数
      img._retryCount = (img._retryCount || 0) + 1;
      const maxRetries = 3; // 减少重试次数，避免无限循环

      // 检查是否超过最大重试次数
      if (img._retryCount > maxRetries) {
        console.warn('图片加载失败，已达到最大重试次数，使用默认图片');
        this.setDefaultImage(img);
        return;
      }

      // 第1次：尝试原始URL（去掉时间戳参数）
      if (img._retryCount === 1) {
        try {
          const baseUrl = currentUrl.split('?')[0];
          // console.log('第1次重试，使用原始URL:', baseUrl);
          img.src = baseUrl;
          return;
        } catch (err) {
          console.warn('第1次重试失败:', err);
        }
      }

      // 第2次：尝试使用rawData中的原始URL
      if (img._retryCount === 2 && this.currentVehicleCamera && this.currentVehicleCamera.rawData && this.currentVehicleCamera.rawData.imageUrl) {
        try {
          const rawUrl = this.currentVehicleCamera.rawData.imageUrl;
          // console.log('第2次重试，使用rawData URL:', rawUrl);
          img.src = rawUrl;
          return;
        } catch (err) {
          console.warn('第2次重试失败:', err);
        }
      }

      // 第3次：强制使用HTTP协议（因为HTTPS访问不了）
      if (img._retryCount === 3) {
        try {
          const urlObj = new URL(currentUrl);
          // 强制使用HTTP协议，因为HTTPS访问不了
          urlObj.protocol = 'http:';
          // console.log('第3次重试，强制使用HTTP协议:', urlObj.toString());
          img.src = urlObj.toString();
          return;
        } catch (err) {
          console.warn('第3次重试失败:', err);
        }
      }

      // 所有重试都失败，使用默认图片
      this.setDefaultImage(img);
    },

    // 设置默认图片（不再使用图片，而是隐藏并显示占位符）
    setDefaultImage(img) {
      try {
        console.log('车辆图片加载失败，隐藏图片显示占位符');
        // 隐藏图片元素，让父组件显示占位符
        img.style.display = 'none';
        
        // 触发父组件重新判断是否显示占位符
        const cameraDiv = img.closest('.camera-image');
        if (cameraDiv) {
          // 通过设置一个特殊的data属性来标记需要显示占位符
          cameraDiv.setAttribute('data-image-failed', 'true');
        }
      } catch (err) {
        console.warn('处理图片失败:', err);
        img.style.display = 'none';
      }
    },

    // 图片加载成功处理
    onVehicleImageLoad(e) {
      const img = e.target;
      console.log('车辆图片加载成功:', img.src);
      // 重置重试计数
      img._retryCount = 0;
      // 恢复透明度
      img.style.opacity = '1';
      img.style.display = 'block';
    },

    // 弹框中图片加载失败处理
    onChannelImageError(e) {
      const img = e.target;
      const currentUrl = img.src;
      console.warn('❌ 弹框图片加载失败:', currentUrl);
      console.warn('❌ 图片元素:', img);
      console.warn('❌ 错误事件:', e);

      // 在元素上记录重试次数
      img._retryCount = (img._retryCount || 0) + 1;
      const maxRetries = 2; // 弹框图片重试次数较少

      // 检查是否超过最大重试次数
      if (img._retryCount > maxRetries) {
        console.warn('弹框图片加载失败，已达到最大重试次数，显示占位符');
        this.setChannelImagePlaceholder(img);
        return;
      }

      // 第1次重试：尝试原始URL（去掉时间戳参数）
      if (img._retryCount === 1) {
        try {
          const baseUrl = currentUrl.split('?')[0];
          console.log('弹框图片第1次重试，使用原始URL:', baseUrl);
          img.src = baseUrl;
          return;
        } catch (err) {
          console.warn('弹框图片第1次重试失败:', err);
        }
      }

      // 第2次重试：强制使用HTTP协议（因为HTTPS访问不了）
      if (img._retryCount === 2) {
        try {
          const urlObj = new URL(currentUrl);
          // 强制使用HTTP协议，因为HTTPS访问不了
          urlObj.protocol = 'http:';
          console.log('弹框图片第2次重试，强制使用HTTP协议:', urlObj.toString());
          img.src = urlObj.toString();
          return;
        } catch (err) {
          console.warn('弹框图片第2次重试失败:', err);
        }
      }

      // 所有重试都失败，显示占位符
      this.setChannelImagePlaceholder(img);
    },

    // 弹框中图片加载成功处理
    onChannelImageLoad(e) {
      const img = e.target;
      console.log('✅ 弹框图片加载成功:', img.src);
      console.log('✅ 图片元素:', img);
      console.log('✅ 加载事件:', e);
      // 重置重试计数
      img._retryCount = 0;
      // 恢复透明度
      img.style.opacity = '1';
      img.style.display = 'block';
    },

    // 设置弹框图片占位符
    setChannelImagePlaceholder(img) {
      try {
        // 隐藏图片，显示占位符
        img.style.display = 'none';
        // 找到对应的占位符元素并显示
        const card = img.closest('.channel-card');
        if (card) {
          const placeholder = card.querySelector('.channel-card__placeholder');
          if (placeholder) {
            placeholder.style.display = 'flex';
            placeholder.textContent = '图片加载失败';
          }
        }
      } catch (err) {
        console.warn('设置弹框图片占位符失败:', err);
      }
    },
    // 打开通道9宫格弹窗
    async openChannelModal() {
      // 根据当前车辆相机通道默认入口/出口筛选
      const ch = (this.currentVehicleCamera && this.currentVehicleCamera.channel) || '';
      console.log('ch', this.currentVehicleCamera.imageUrl);
      this.channelModalFilter = ch.includes('入口') ? 'entry' : (ch.includes('出口') ? 'exit' : 'all');

      // 根据当前车辆相机信息定位到对应页面
      this.locateCurrentVehicleInModal();

      this.showChannelModal = true;

      // 🔥 添加加载动画状态
      this.vehicleChannelLoading = true;

      // 🔥 首次打开弹窗时加载所有通道的最新数据（参考人脸监控）
      await this.loadVehicleChannelLatestData();

      // 🔥 关闭加载动画
      this.vehicleChannelLoading = false;

      // 立即初始化所有通道数据（作为备用）
      this.initializeChannelData();

      // 启动弹窗实时更新
      this.startModalRealTimeUpdate();
    },
    closeChannelModal() {
      this.showChannelModal = false;
      // 停止弹窗实时更新
      this.stopModalRealTimeUpdate();
    },
    setChannelModalFilter(type) {
      this.channelModalFilter = type;
      this.modalPage = 1;
    },
    // 人脸详情弹窗相关方法
    async openFaceDetailModal() {
      this.showFaceDetailModal = true;
      
      // 添加加载动画状态
      this.faceChannelLoading = true;
      
      // 打开弹窗时为所有通道加载最新数据
      await this.loadChannelLatestData();
      
      // 关闭加载动画
      this.faceChannelLoading = false;
    },
    closeFaceDetailModal() {
      this.showFaceDetailModal = false;
    },
    setFaceDetailFilter(type) {
      // console.log('🔍 设置人脸筛选类型:', type);
      this.faceDetailFilter = type;
      this.faceDetailPage = 1; // 重置到第一页
    },

    /**
     * 为所有通道加载最新数据（改为批量获取后按通道分组）
     */
    async loadChannelLatestData() {
      try {
        console.log('🔄 [通道数据] 开始批量加载所有通道最新数据...');
        
        // 固定的通道列表（与 faceDetailListByChannel 保持一致）
        const fixedChannels = [
          // 1号门
          '1号门入口1', '1号门入口2', '1号门出口1', '1号门出口2',
          // 2号门
          '2号门入口1', '2号门入口2', '2号门入口3', '2号门出口1', '2号门出口2', '2号门出口3',
          '2号门转闸入口', '2号门转闸出口',
          // 3号门
          '3号门入口1', '3号门入口2', '3号门出口1', '3号门出口2',
          // 5号门
          '5号门入口1', '5号门入口2', '5号门入口3', '5号门入口4', 
          '5号门出口1', '5号门出口2', '5号门出口3', '5号门出口4',
          // 7号门
          '7号门入口1', '7号门入口2', '7号门出口1', '7号门出口2',
          // 8号门
          '8号门入口1', '8号门入口2', '8号门出口1', '8号门出口2',
          // 兴安门
          '兴安门入口1', '兴安门入口2', '兴安门出口1', '兴安门出口2',
          // 家具学院
          '家具学院转闸入口', '家具学院转闸出口',
          // 林科门
          '林科门入口1', '林科门入口2', '林科门出口1', '林科门出口2',
          // 银行门
          '银行门入口1', '银行门入口2', '银行门出口1', '银行门出口2'
        ];

        // 批量获取全表人脸数据，确保覆盖所有通道的最新记录
        // 添加日期范围，获取最近3天的数据，提高命中率
        const now = new Date();
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        
        const response = await axios.get('http://localhost:8675/parking/face-monitor/list', {
          params: {
            page: 1,
            size: 50000,  // 使用size参数而不是limit
            pageSize: 50000,  // 添加pageSize作为备用参数
            limit: 50000,  // 保留limit作为备用
            startDate: this.formatDateTime(threeDaysAgo),  // 最近3天
            endDate: this.formatDateTime(now),
            // 按时间倒序，优先获取最新数据
            orderBy: 'eventTime',
            orderDirection: 'DESC'
          }
        });

        let allRecords = [];
        if (response.data && response.data.code === '0') {
          // 处理多层嵌套的响应格式
          if (response.data.data && response.data.data.data && response.data.data.data.records) {
            allRecords = response.data.data.data.records;
          } else if (response.data.data && response.data.data.records) {
            allRecords = response.data.data.records;
          } else if (Array.isArray(response.data.data)) {
            allRecords = response.data.data;
          }
        }

        console.log(`📊 [通道数据] 获取到 ${allRecords.length} 条人脸记录`);
        console.log(`📅 [时间范围] ${this.formatDateTime(threeDaysAgo)} 至 ${this.formatDateTime(now)}`);
        
        // 🔍 调试：查看第一条记录的完整数据结构
        if (allRecords.length > 0) {
          console.log('🔍 [数据结构] 第一条记录的所有字段:', Object.keys(allRecords[0]));
          console.log('🔍 [数据结构] 第一条完整记录:', allRecords[0]);
        }
        
        // 检查前10条记录的通道分布
        const sampleChannels = allRecords.slice(0, 10).map(r => r.channelName);
        console.log(`🔍 [样本检查] 前10条记录的通道:`, sampleChannels);

        // 按通道分组，每个通道只保留最新的记录
        const channelLatestMap = {};
        const channelRecordCounts = {}; // 统计每个通道的记录数
        
        allRecords.forEach(record => {
          const channelName = record.channelName;
          if (channelName && fixedChannels.includes(channelName)) {
            // 统计每个通道的记录数
            channelRecordCounts[channelName] = (channelRecordCounts[channelName] || 0) + 1;
            
            const eventTime = new Date(record.eventTime).getTime();
            
            // 如果通道还没有记录，或者当前记录更新，则更新
            if (!channelLatestMap[channelName] || 
                eventTime > new Date(channelLatestMap[channelName].eventTime).getTime()) {
              channelLatestMap[channelName] = record;
            }
          }
        });

        console.log(`📋 [通道统计] 找到 ${Object.keys(channelLatestMap).length}/${fixedChannels.length} 个通道有数据:`);
        Object.entries(channelRecordCounts).forEach(([channel, count]) => {
          console.log(`  📍 ${channel}: ${count} 条记录, 最新: ${channelLatestMap[channel] ? this.formatTime(channelLatestMap[channel].eventTime) : '无'}`);
        });

        // 检查没有数据的通道
        const noDataChannels = fixedChannels.filter(channel => !channelLatestMap[channel]);
        if (noDataChannels.length > 0) {
          console.warn(`⚠️ [缺失通道] ${noDataChannels.length} 个通道无数据:`, noDataChannels);
        }

        // 创建通道数据映射
        const channelDataMap = {};
        
        // 为所有固定通道创建数据（更新有数据的，创建无数据的）
        // 不再保留旧数据，确保新数据总是覆盖旧数据
        let updatedCount = 0;
        fixedChannels.forEach(channelName => {
          const record = channelLatestMap[channelName];
          
          if (record) {
            // 有数据的通道
            const now = new Date();
            const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            const endOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);

            // 🔥 使用智能人员类型判断
            const smartPersonType = this.getSmartPersonType(record.personType, record.department);
            
            // 🔍 调试图片字段，优先检查photoUrl（后端主要字段）
            const imageUrl = record.photoUrl || record.imageUrl || record.faceImageUrl || record.faceUrl || record.facePhoto || record.facePath || record.picUrl || record.picture || '';
            
            if (updatedCount < 3) {
              // 打印前3个通道的详细信息
              console.log(`🔍 [图片字段 ${updatedCount + 1}] 通道:`, channelName, '人员:', record.personName);
              console.log(`🔍 [图片字段 ${updatedCount + 1}] 原始数据字段:`);
              console.log('  - photoUrl:', record.photoUrl);
              console.log('  - imageUrl:', record.imageUrl);
              console.log('  - faceImageUrl:', record.faceImageUrl);
              console.log('  - faceUrl:', record.faceUrl);
              console.log('  - facePhoto:', record.facePhoto);
              console.log('  - facePath:', record.facePath);
              console.log('  - picUrl:', record.picUrl);
              console.log('  - picture:', record.picture);
              console.log(`🎨 [最终结果 ${updatedCount + 1}] 提取到的imageUrl:`, imageUrl);
              console.log(`🔗 [字段检查 ${updatedCount + 1}] 是否有效:`, !!imageUrl);
              
              // 打印完整的record对象结构
              if (updatedCount === 0) {
                console.log('📊 [完整数据] 第一条记录的所有字段:', Object.keys(record));
                console.log('📊 [完整数据] 第一条记录内容:', record);
              }
            }
            
            channelDataMap[channelName] = {
              channel: channelName,
              timestamp: this.formatTime(record.eventTime),
              personName: record.personName,
              department: record.department,
              personType: smartPersonType, // 使用修正后的人员类型
              recognitionMethod: record.recognitionMethod,
              // 使用提取到的imageUrl作为主要照片字段
              imageUrl: imageUrl,
              photoUrl: imageUrl,
              facePhoto: imageUrl,
              faceImageUrl: imageUrl, // 也添加这个字段以防万一
              channelType: channelName.includes('入口') ? 'entry' : 'exit',
              statusText: channelName.includes('入口') ? '进场' : '出场',
              startTime: record.personName && record.personName !== '陌生人' ? startOfDay.toISOString() : null,
              endTime: record.personName && record.personName !== '陌生人' ? endOfDay.toISOString() : null,
              eventTime: record.eventTime,
              hasData: true
            };
            updatedCount++;
          } else {
            // 没有数据的通道，创建默认数据（总是创建，不判断是否已存在）
            channelDataMap[channelName] = {
              channel: channelName,
              timestamp: '--',
              personName: '暂无数据',
              imageUrl: '',
              department: '--',
              personType: '--',
              recognitionMethod: '--',
              channelType: channelName.includes('入口') ? 'entry' : 'exit',
              statusText: channelName.includes('入口') ? '进场' : '出场',
              hasData: false
            };
          }
        });

        // 将映射表转换回数组
        this.faceDetailList = Object.values(channelDataMap);
        
        console.log(`✅ [通道数据] 加载完成，${fixedChannels.length} 个通道，${updatedCount} 个有数据`);
        
        // 🔍 调试：检查faceDetailList中的照片字段
        const itemsWithPhoto = this.faceDetailList.filter(item => item.imageUrl || item.photoUrl);
        console.log(`🖼️ [照片统计] ${itemsWithPhoto.length} 个通道有照片URL`);
        if (itemsWithPhoto.length > 0) {
          console.log('🖼️ [照片示例] 第一个有照片的通道:', {
            channel: itemsWithPhoto[0].channel,
            personName: itemsWithPhoto[0].personName,
            imageUrl: itemsWithPhoto[0].imageUrl,
            photoUrl: itemsWithPhoto[0].photoUrl,
            facePhoto: itemsWithPhoto[0].facePhoto
          });
        }
        
      } catch (error) {
        console.error('❌ [通道数据] 加载失败:', error);
      }
    },

    /**
     * 为所有车辆通道加载最新数据（参考人脸监控实现）
     */
    async loadVehicleChannelLatestData() {
      try {
        console.log('🚗 [车辆通道数据] 开始批量加载所有通道最新数据...');
        
        // 获取最近3天的车辆数据，确保覆盖所有通道
        const now = new Date();
        const threeDaysAgo = new Date(now.getTime() - 3 * 24 * 60 * 60 * 1000);
        
        // 调用车辆数据API
        const response = await axios.get('http://localhost:8675/parking/nefuData/getLatestVehicleRecords', {
          params: {
            limit: 10000,  // 获取大量数据以覆盖所有通道
            startTime: this.formatDateTime(threeDaysAgo),
            endTime: this.formatDateTime(now)
          }
        });

        let allRecords = [];
        if (response.data && response.data.code === '0') {
          // 处理多层嵌套的响应格式
          if (response.data.data && response.data.data.records) {
            allRecords = response.data.data.records;
          } else if (Array.isArray(response.data.data)) {
            allRecords = response.data.data;
          }
        }

        console.log(`📊 [车辆通道数据] 获取到 ${allRecords.length} 条车辆记录`);
        console.log(`📅 [时间范围] ${this.formatDateTime(threeDaysAgo)} 至 ${this.formatDateTime(now)}`);
        
        // 按通道分组，每个通道只保留最新的记录
        const channelLatestMap = {};
        const channelRecordCounts = {}; // 统计每个通道的记录数
        
        allRecords.forEach(record => {
          const channelName = record.channel || record.channelName || record.channelCode || '';
          if (channelName) {
            // 统计每个通道的记录数
            channelRecordCounts[channelName] = (channelRecordCounts[channelName] || 0) + 1;
            
            const eventTime = new Date(record.time || record.createTime || 0).getTime();
            
            // 如果通道还没有记录，或者当前记录更新，则更新
            if (!channelLatestMap[channelName] || 
                eventTime > new Date(channelLatestMap[channelName].time || channelLatestMap[channelName].createTime || 0).getTime()) {
              channelLatestMap[channelName] = record;
            }
          }
        });

        console.log(`📋 [车辆通道统计] 找到 ${Object.keys(channelLatestMap).length} 个通道有数据:`);
        Object.entries(channelRecordCounts).forEach(([channel, count]) => {
          const latest = channelLatestMap[channel];
          const latestTime = latest ? this.formatTime(latest.time || latest.createTime) : '无';
          console.log(`  🚗 ${channel}: ${count} 条记录, 最新: ${latestTime}`);
        });

        // 更新channelSnapshots数据
        let updatedCount = 0;
        Object.entries(channelLatestMap).forEach(([channelName, record]) => {
          // 提取图片URL
          const imageUrl = record.imageUrl || 
                          (record.rawData && record.rawData.imageUrl) || 
                          record.enter_car_full_picture || 
                          record.enterCarFullPicture || '';
          
          // 更新通道快照数据
          this.$set(this.channelSnapshots, channelName, {
            channel: channelName,
            imageUrl: imageUrl,
            plateNumber: record.license || record.plateNumber || record.carNo || record.carNumber || '',
            timestamp: this.formatTime(record.time || record.createTime || Date.now()),
            channelType: record.channelType || (record.eventType === 'in' ? 'entry' : 'exit') || 
                        (channelName.includes('入口') ? 'entry' : 'exit'),
            vehicleType: record.vehicleType || record.vipName || '普通车辆',
            enter_car_license_color: record.carColor || record.enter_car_license_color || record.plateColor || '',
            exit_car_license_color: record.carColor || record.exit_car_license_color || record.plateColor || '',
            enter_car_type: record.enter_car_type || '',
            hasData: true
          });
          
          updatedCount++;
          console.log(`✅ [车辆通道数据] ${channelName} - 车牌: ${record.license || record.plateNumber || '无'}, 图片: ${imageUrl ? '有' : '无'}`);
        });
        
        console.log(`✅ [车辆通道数据] 加载完成，更新了 ${updatedCount} 个通道的数据`);
        
      } catch (error) {
        console.error('❌ [车辆通道数据] 加载失败:', error);
      }
    },

    // 获取卡片状态样式类
    getCardStatusClass(item) {
      // 如果没有数据，不返回任何状态class，让no-data class控制暗淡显示
      if (!item.hasData) {
        return '';
      }

      // 有数据的情况下，根据人员信息决定高亮颜色
      // 陌生人或无姓名 - 红色高亮（警告但仍然高亮）
      if (!item.personName || item.personName === '陌生人') {
        return 'status-unknown'; // 红色背景 - 未知/无权限但有数据
      }

      // 有人员类型信息 - 蓝色高亮（正常）
      if (item.personType && item.personType !== '--') {
        return 'status-normal'; // 蓝色背景 - 正常
      }

      // 检查是否在有效时间段内
      if (item.startTime && item.endTime && item.startTime !== '--' && item.endTime !== '--') {
        const currentTime = new Date();
        const startTime = new Date(item.startTime);
        const endTime = new Date(item.endTime);
        if (currentTime < startTime || currentTime > endTime) {
          return 'status-invalid-time'; // 橙色背景 - 不在有效时段但有数据
        }
      }

      // 默认情况 - 蓝色高亮（只要有数据就高亮）
      return 'status-normal'; // 蓝色背景 - 正常
    },
    // 获取状态标签文本
    getStatusLabel(item) {
      // 只有陌生人才显示暂无权限
      if (!item.personName || item.personName === '陌生人') {
        return '暂无权限';
      }

      // 对于教职工和学生，如果有personType信息，说明是已认证的人员，不显示权限标签
      if (item.personType) {
        return null; // 正常状态不显示标签
      }

      // 对于其他情况，如果有时间段信息，检查是否在有效时段内
      if (item.startTime && item.endTime && item.startTime !== '--' && item.endTime !== '--') {
        const currentTime = new Date();
        const startTime = new Date(item.startTime);
        const endTime = new Date(item.endTime);
        if (currentTime < startTime || currentTime > endTime) {
          return '不在有效时段';
        }
      }

      return null; // 正常状态不显示标签
    },
    // 获取状态标签样式类
    getStatusLabelClass(item) {
      // 只有陌生人才显示无权限标签
      if (!item.personName || item.personName === '陌生人') {
        return 'label-no-permission';
      }

      // 对于教职工和学生，不显示标签
      if (item.personType) {
        return '';
      }

      // 对于其他情况，检查时间段
      if (item.startTime && item.endTime && item.startTime !== '--' && item.endTime !== '--') {
        const currentTime = new Date();
        const startTime = new Date(item.startTime);
        const endTime = new Date(item.endTime);
        if (currentTime < startTime || currentTime > endTime) {
          return 'label-invalid-time';
        }
      }

      return '';
    },
    // 获取车辆图片URL
    getVehicleImage(camera) {
      if (!camera) return '';
      
      const imageUrl = camera.imageUrl || '';
      
      // 验证图片URL格式
      if (!imageUrl || !this.isValidImageUrl(imageUrl)) {
        return '';
      }
      
      return imageUrl;
    },
    
    // 获取人脸图片URL（参考车辆弹窗的方式）
    getFaceImage(item) {
      if (!item) return '';
      
      // 调整字段检查优先级，将imageUrl和photoUrl提前（这是后端主要返回字段）
      const imageUrl = item.imageUrl || item.photoUrl || item.faceImageUrl || item.faceUrl || item.facePhoto || item.facePath || item.picUrl || item.picture || '';
      
      // 🔍 调试信息：检查卡片中的照片字段
      if (item.personName && item.personName !== '暂无数据') {
        console.log('🖼️ [getFaceImage] 检查人员:', item.personName, '通道:', item.channel);
        console.log('🖼️ [getFaceImage] 字段值:');
        console.log('  - item.imageUrl:', item.imageUrl);
        console.log('  - item.photoUrl:', item.photoUrl);
        console.log('  - item.faceImageUrl:', item.faceImageUrl);
        console.log('  - item.facePhoto:', item.facePhoto);
        console.log('🖼️ [getFaceImage] 最终imageUrl:', imageUrl);
      }
      
      // 验证图片URL格式
      if (!imageUrl || !this.isValidImageUrl(imageUrl)) {
        if (item.personName && item.personName !== '暂无数据') {
          console.log('⚠️ [getFaceImage] URL验证失败:', imageUrl);
        }
        return '';
      }
      
      if (item.personName && item.personName !== '暂无数据') {
        console.log('✅ [getFaceImage] 成功返回照片URL:', imageUrl);
      }
      
      return imageUrl;
    },
    
    // 人脸图片加载失败处理（参考车辆弹窗的方式）
    onFaceImageError(e) {
      const img = e.target;
      const currentUrl = img.src;
      console.warn('❌ 人脸图片加载失败:', currentUrl);
      console.warn('❌ 图片元素:', img);
      
      // 在元素上记录重试次数
      img._retryCount = (img._retryCount || 0) + 1;
      const maxRetries = 2;
      
      // 检查是否超过最大重试次数
      if (img._retryCount > maxRetries) {
        console.warn('人脸图片加载失败，已达到最大重试次数，显示占位符');
        this.setFaceImagePlaceholder(img);
        return;
      }
      
      // 第1次重试：尝试原始URL（去掉时间戳参数）
      if (img._retryCount === 1) {
        try {
          const baseUrl = currentUrl.split('?')[0];
          console.log('人脸图片第1次重试，使用原始URL:', baseUrl);
          img.src = baseUrl;
          return;
        } catch (err) {
          console.warn('人脸图片第1次重试失败:', err);
        }
      }
      
      // 第2次重试：强制使用HTTP协议
      if (img._retryCount === 2) {
        try {
          const urlObj = new URL(currentUrl);
          urlObj.protocol = 'http:';
          console.log('人脸图片第2次重试，强制使用HTTP协议:', urlObj.toString());
          img.src = urlObj.toString();
          return;
        } catch (err) {
          console.warn('人脸图片第2次重试失败:', err);
        }
      }
      
      // 所有重试都失败，显示占位符
      this.setFaceImagePlaceholder(img);
    },
    
    // 人脸图片加载成功处理
    onFaceImageLoad(e) {
      const img = e.target;
      console.log('✅ 人脸图片加载成功:', img.src);
      // 重置重试计数
      img._retryCount = 0;
      // 恢复透明度
      img.style.opacity = '1';
      img.style.display = 'block';
    },
    
    // 设置人脸图片占位符
    setFaceImagePlaceholder(img) {
      try {
        // 隐藏图片，显示占位符
        img.style.display = 'none';
        // 找到对应的占位符元素并显示
        const card = img.closest('.face-detail-card');
        if (card) {
          const placeholder = card.querySelector('.face-card__placeholder');
          if (placeholder) {
            placeholder.style.display = 'flex';
            placeholder.textContent = '照片加载失败';
          }
        }
      } catch (err) {
        console.warn('设置人脸图片占位符失败:', err);
      }
    },
    // 根据当前车辆相机信息定位到弹窗中的对应位置
    locateCurrentVehicleInModal() {
      if (!this.currentVehicleCamera || !this.currentVehicleCamera.channel) {
        this.modalPage = 1;
        return;
      }

      const currentChannel = this.currentVehicleCamera.channel;
      const allItems = this.modalFilteredItems;

      // 查找当前通道在列表中的位置
      const index = allItems.findIndex(item => item.channel === currentChannel);
      if (index !== -1) {
        // 计算应该在第几页
        const targetPage = Math.floor(index / this.modalPageSize) + 1;
        this.modalPage = Math.max(1, targetPage);
        // console.log(`定位到通道 ${currentChannel}，第 ${this.modalPage} 页，位置 ${index}`);
      } else {
        this.modalPage = 1;
        // console.log(`未找到通道 ${currentChannel}，使用第1页`);
      }
    },
    // 选择用于显示的图片：优先实时，其次上一次
    getChannelImage(snapshot) {
      if (!snapshot) return '';

      const imageUrl = snapshot.imageUrl || snapshot.lastImageUrl || '';

      // 验证图片URL格式
      if (!imageUrl || !this.isValidImageUrl(imageUrl)) {
        return '';
      }

      // 直接返回图片URL，不添加缓存破坏参数
      return imageUrl;
    },

    // 验证图片URL是否有效（放宽验证条件）
    isValidImageUrl(url) {
      if (!url || typeof url !== 'string') {
        return false;
      }

      // 简化验证逻辑，避免过于严格的检查
      const trimmedUrl = url.trim();
      
      // 基本格式检查
      if (!trimmedUrl.startsWith('http://') && !trimmedUrl.startsWith('https://') && !trimmedUrl.startsWith('/')) {
        return false;
      }
      
      // 避免明显的非图片URL
      if (trimmedUrl.includes('javascript:') || trimmedUrl.includes('data:text')) {
        return false;
      }

      try {
        // 对于相对路径，直接通过
        if (trimmedUrl.startsWith('/')) {
          return true;
        }
        
        // 对于绝对路径，进行简单检查
        const urlObj = new URL(trimmedUrl);
        if (!urlObj.hostname) {
          return false;
        }

        return true;
      } catch (err) {
        console.log('❌ isValidImageUrl - URL解析失败:', err, trimmedUrl);
        return false;
      }
    },
    // 更新每个通道的最新与上一次图片
    updateChannelSnapshot(record) {
      // console.log('🔍 updateChannelSnapshot - 原始record:', record);
      const channel = record.channel || record.channelName || record.channelCode;
      if (!channel) {
        // console.log('⚠️ updateChannelSnapshot - 没有找到通道名称');
        return;
      }

      // 详细调试图片URL提取过程
      const imageUrlSources = {
        'record.imageUrl': record.imageUrl,
        'record.rawData.imageUrl': record.rawData && record.rawData.imageUrl
      };
      // console.log('🔍 updateChannelSnapshot - 图片URL来源:', imageUrlSources);

      const originalImageUrl = record.imageUrl || (record.rawData && record.rawData.imageUrl) || '';

      // 检查是否有有效的图片URL
      if (!originalImageUrl) {
        console.log(`⚠️ 通道 ${channel} 无图片数据，跳过更新`);
        return;
      }

      // 应用URL优化（不添加缓存破坏参数）
      const optimizedUrl = this.getOptimizedImageUrl(originalImageUrl);
      // console.log('🔍 updateChannelSnapshot - 优化后imageUrl:', optimizedUrl);
      // console.log('🔍 updateChannelSnapshot - 最终imageUrl (带缓存破坏):', imageUrl);

      const next = {
        channel,
        channelType: record.channelType || (record.eventType === 'in' ? 'entry' : 'exit'),
        plateNumber: record.plateNumber || record.license || record.carNo || '',
        timestamp: this.formatTime(record.time || record.createTime || Date.now()),
        // 保留车牌颜色字段
        enter_car_license_color: record.enter_car_license_color || (record.rawData && record.rawData.enter_car_license_color) || '',
        exit_car_license_color: record.exit_car_license_color || (record.rawData && record.rawData.exit_car_license_color) || '',
        enter_car_type: record.enter_car_type || (record.rawData && record.rawData.enter_car_type) || ''
      };
      const prev = this.channelSnapshots[channel] || {};

      // 检查是否真的有新数据（避免重复更新）
      const hasNewData = !prev.imageUrl ||
        prev.imageUrl !== optimizedUrl ||
        prev.plateNumber !== next.plateNumber ||
        prev.timestamp !== next.timestamp;

      if (!hasNewData) {
        // console.log(`📊 通道 ${channel} 无新数据，跳过更新`);
        return;
      }

      const newSnapshot = {
        ...next,
        lastImageUrl: prev.imageUrl || prev.lastImageUrl || '',
        imageUrl: optimizedUrl, // 使用优化后的URL，不添加缓存破坏
        // 确保时间戳是最新的
        timestamp: next.timestamp || this.formatTime(Date.now())
      };

      // console.log(`🆕 通道 ${channel} 有新数据，更新快照`);

      this.$set(this.channelSnapshots, channel, newSnapshot);

      // 只在有新数据时才更新视图
      if (this.showChannelModal) {
        this.$forceUpdate();
        console.log(`🔄 通道 ${channel} 数据已更新，弹窗视图已刷新`);
      }
    },

    // 从格式化记录更新通道快照（用于WebSocket数据）
    updateChannelSnapshotFromFormatted(formattedRecord) {
      // console.log('🔍 updateChannelSnapshotFromFormatted - 格式化记录:', formattedRecord);
      const channel = formattedRecord.channel;
      if (!channel) {
        console.log('⚠️ updateChannelSnapshotFromFormatted - 没有找到通道名称');
        return;
      }

      const imageUrl = formattedRecord.imageUrl || '';

      // 检查是否有有效的图片URL
      if (!imageUrl) {
        console.log(`⚠️ 通道 ${channel} 无图片数据，跳过更新`);
        return;
      }

      const next = {
        channel,
        channelType: formattedRecord.channelType || 'entry',
        plateNumber: formattedRecord.license || '',
        timestamp: formattedRecord.time || this.formatTime(Date.now()),
        // 保留车牌颜色字段
        enter_car_license_color: formattedRecord.enter_car_license_color || '',
        exit_car_license_color: formattedRecord.exit_car_license_color || '',
        enter_car_type: formattedRecord.enter_car_type || ''
      };

      const prev = this.channelSnapshots[channel] || {};

      // 检查是否真的有新数据（避免重复更新）
      const hasNewData = !prev.imageUrl ||
        prev.imageUrl !== imageUrl ||
        prev.plateNumber !== next.plateNumber ||
        prev.timestamp !== next.timestamp;

      if (!hasNewData) {
        console.log(`📊 通道 ${channel} 无新数据，跳过更新`);
        return;
      }

      const newSnapshot = {
        ...next,
        lastImageUrl: prev.imageUrl || prev.lastImageUrl || '',
        imageUrl: imageUrl,
        vehicleType: formattedRecord.vehicleType || formattedRecord.vipName || ''
      };

      // console.log(`🆕 通道 ${channel} 有新数据，更新快照`);

      this.$set(this.channelSnapshots, channel, newSnapshot);

      // 只在有新数据时才更新视图
      if (this.showChannelModal) {
        this.$forceUpdate();
        console.log(`🔄 通道 ${channel} 数据已更新，弹窗视图已刷新`);
      }
    },
    // 启动弹窗实时更新
    startModalRealTimeUpdate() {
      if (this.modalRealTimeTimer) {
        clearInterval(this.modalRealTimeTimer);
      }

      console.log('🚀 启动弹窗实时更新');
      this.modalRealTimeTimer = setInterval(() => {
        if (!this.showChannelModal) {
          this.stopModalRealTimeUpdate();
          return;
        }

        // 检查是否有新数据，只有在有新数据时才更新
        const hasNewData = this.checkForNewVehicleData();
        if (hasNewData) {
          console.log('🆕 检测到新数据，更新通道信息');
          this.updateAllChannelData();
        } else {
          // 🔥 定期从API刷新所有通道最新数据（每30秒）
          const timeSinceLastUpdate = Date.now() - this.lastUpdateTime;
          if (timeSinceLastUpdate > 30000) {
            console.log('⏰ 定期从API刷新通道最新数据');
            this.refreshVehicleChannelDataFromAPI();
          }
        }
      }, 5000); // 每5秒检查一次（降低刷新频率）
    },
    // 停止弹窗实时更新
    stopModalRealTimeUpdate() {
      if (this.modalRealTimeTimer) {
        clearInterval(this.modalRealTimeTimer);
        this.modalRealTimeTimer = null;
        console.log('⏹️ 停止弹窗实时更新');
      }
    },
    // 检测是否有新的车辆数据
    checkForNewVehicleData() {
      const currentCount = this.vehicleRecords ? this.vehicleRecords.length : 0;
      const hasNewData = currentCount > this.lastVehicleRecordsCount;

      if (hasNewData) {
        this.lastVehicleRecordsCount = currentCount;
      }

      return hasNewData;
    },

    // 🔥 从API刷新车辆通道数据（实时更新用）
    async refreshVehicleChannelDataFromAPI() {
      try {
        console.log('🔄 [实时更新] 从API刷新车辆通道数据...');
        
        // 获取最近1小时的数据（减少数据量，提高响应速度）
        const now = new Date();
        const oneHourAgo = new Date(now.getTime() - 1 * 60 * 60 * 1000);
        
        const response = await axios.get('http://localhost:8675/parking/nefuData/getLatestVehicleRecords', {
          params: {
            limit: 1000,  // 减少数据量
            startTime: this.formatDateTime(oneHourAgo),
            endTime: this.formatDateTime(now)
          }
        });

        let allRecords = [];
        if (response.data && response.data.code === '0') {
          if (response.data.data && response.data.data.records) {
            allRecords = response.data.data.records;
          } else if (Array.isArray(response.data.data)) {
            allRecords = response.data.data;
          }
        }

        if (allRecords.length === 0) {
          console.log('📊 [实时更新] 没有新的车辆记录');
          return;
        }

        console.log(`📊 [实时更新] 获取到 ${allRecords.length} 条车辆记录`);
        
        // 按通道分组，只更新有新记录的通道
        const channelLatestMap = {};
        let updateCount = 0;
        
        allRecords.forEach(record => {
          const channelName = record.channel || record.channelName || record.channelCode || '';
          if (channelName) {
            const eventTime = new Date(record.time || record.createTime || 0).getTime();
            
            // 检查是否比现有记录更新
            const existingSnapshot = this.channelSnapshots[channelName];
            const existingTime = existingSnapshot ? 
              new Date(existingSnapshot.timestamp || 0).getTime() : 0;
            
            if (!channelLatestMap[channelName] || 
                eventTime > new Date(channelLatestMap[channelName].time || channelLatestMap[channelName].createTime || 0).getTime()) {
              channelLatestMap[channelName] = record;
            }
            
            // 如果比现有数据更新，标记需要更新
            if (eventTime > existingTime) {
              updateCount++;
            }
          }
        });

        // 更新有新数据的通道
        Object.entries(channelLatestMap).forEach(([channelName, record]) => {
          const existingSnapshot = this.channelSnapshots[channelName];
          const recordTime = new Date(record.time || record.createTime || 0).getTime();
          const existingTime = existingSnapshot ? 
            new Date(existingSnapshot.timestamp || 0).getTime() : 0;
          
          // 只有当记录更新时才更新
          if (recordTime > existingTime) {
            const imageUrl = record.imageUrl || 
                            (record.rawData && record.rawData.imageUrl) || 
                            record.enter_car_full_picture || 
                            record.enterCarFullPicture || '';
            
            this.$set(this.channelSnapshots, channelName, {
              channel: channelName,
              imageUrl: imageUrl,
              plateNumber: record.license || record.plateNumber || record.carNo || record.carNumber || '',
              timestamp: this.formatTime(record.time || record.createTime || Date.now()),
              channelType: record.channelType || (record.eventType === 'in' ? 'entry' : 'exit') || 
                          (channelName.includes('入口') ? 'entry' : 'exit'),
              vehicleType: record.vehicleType || record.vipName || '普通车辆',
              enter_car_license_color: record.carColor || record.enter_car_license_color || record.plateColor || '',
              exit_car_license_color: record.carColor || record.exit_car_license_color || record.plateColor || '',
              enter_car_type: record.enter_car_type || '',
              hasData: true
            });
            
            console.log(`🔄 [实时更新] ${channelName} - 车牌: ${record.license || record.plateNumber || '无'}`);
          }
        });
        
        if (updateCount > 0) {
          console.log(`✅ [实时更新] 更新了 ${updateCount} 个通道的数据`);
          this.lastUpdateTime = Date.now();
        } else {
          console.log('📊 [实时更新] 所有通道数据已是最新');
        }
        
      } catch (error) {
        console.error('❌ [实时更新] 刷新车辆通道数据失败:', error);
      }
    },

    // 初始化所有通道数据
    initializeChannelData() {
      // 初始化记录数量
      this.lastVehicleRecordsCount = this.vehicleRecords ? this.vehicleRecords.length : 0;

      // 如果通道快照为空，先尝试从车辆记录中初始化
      if (Object.keys(this.channelSnapshots || {}).length === 0) {
        console.log('🔄 通道快照为空，尝试从车辆记录初始化');
        this.initializeChannelSnapshotsFromRecords();
      }

      this.updateAllChannelData();
    },

    // 从车辆记录初始化通道快照
    initializeChannelSnapshotsFromRecords() {
      console.log('🔄 从车辆记录初始化通道快照');

      if (!this.vehicleRecords || this.vehicleRecords.length === 0) {
        console.log('⚠️ 没有车辆记录数据');
        return;
      }

      // 获取所有唯一的通道名称
      const channels = new Set();
      this.vehicleRecords.forEach(record => {
        const channel = record.channel || record.channelName || '';
        if (channel) {
          channels.add(channel);
        }
      });


      // 为每个通道创建初始快照，并从记录中提取最新数据
      channels.forEach(channelName => {
        // 查找该通道的最新记录
        const channelRecords = this.vehicleRecords.filter(record =>
          (record.channel || record.channelName || '') === channelName
        );

        if (channelRecords.length > 0) {
          // 按时间排序，取最新的记录
          const latestRecord = channelRecords.sort((a, b) => {
            const timeA = new Date(a.time || a.createTime || 0).getTime();
            const timeB = new Date(b.time || b.createTime || 0).getTime();
            return timeB - timeA;
          })[0];

          // 提取图片URL
          const imageUrl = latestRecord.imageUrl || (latestRecord.rawData && latestRecord.rawData.imageUrl) || '';

          this.channelSnapshots[channelName] = {
            channel: channelName,
            imageUrl: imageUrl,
            plateNumber: latestRecord.license || latestRecord.plateNumber || latestRecord.carNo || '',
            timestamp: this.formatTime(latestRecord.time || latestRecord.createTime || Date.now()),
            channelType: latestRecord.channelType || (latestRecord.eventType === 'in' ? 'entry' : 'exit'),
            vehicleType: latestRecord.vehicleType || latestRecord.vipName || '',
            // 保留车牌颜色字段
            enter_car_license_color: latestRecord.enter_car_license_color || '',
            exit_car_license_color: latestRecord.exit_car_license_color || '',
            enter_car_type: latestRecord.enter_car_type || ''
          };
        } else {
          // 没有记录时创建空快照
          this.channelSnapshots[channelName] = {
            channel: channelName,
            imageUrl: '',
            plateNumber: '',
            timestamp: '',
            channelType: 'entry',
            vehicleType: '',
            // 空快照也需要初始化颜色字段
            enter_car_license_color: '',
            exit_car_license_color: '',
            enter_car_type: ''
          };
        }
      });
    },

    // 更新所有通道的实时数据
    updateAllChannelData() {
      const currentTime = Date.now();

      // 避免过于频繁的更新（至少间隔1秒）
      if (currentTime - this.lastUpdateTime < 1000) {
        console.log('⏱️ 跳过更新：更新间隔太短');
        return;
      }

      this.lastUpdateTime = currentTime;

      // 获取当前所有通道列表
      const allChannels = this.modalFilteredItems;
      console.log('📋 过滤后的通道数量:', allChannels.length);

      if (allChannels.length === 0) {
        console.log('⚠️ 没有可显示的通道，尝试重新初始化');
        this.initializeChannelSnapshotsFromRecords();
        return;
      }

      // 为每个通道获取最新的车辆数据
      let hasAnyUpdate = false;
      allChannels.forEach(channelItem => {
        const updated = this.updateChannelRealTimeData(channelItem.channel);
        if (updated) {
          hasAnyUpdate = true;
        }
      });

      // 只有在有实际更新时才刷新视图
      if (hasAnyUpdate) {
        console.log('✅ 弹窗通道数据更新完成');
      } else {
        console.log('📊 无新数据，跳过视图更新');
      }
    },

    // 更新单个通道的实时数据
    updateChannelRealTimeData(channelName) {
      // 从最新的记录中查找该通道的数据
      const latestRecords = this.vehicleRecords || [];

      // 查找该通道的最新记录（按时间排序，取最新的）
      const channelRecords = latestRecords.filter(record => {
        const recordChannel = record.channel || record.channelName || '';
        return recordChannel === channelName;
      });

      if (channelRecords.length > 0) {
        // 按时间排序，取最新的记录
        const latestRecord = channelRecords.sort((a, b) => {
          const timeA = new Date(a.time || a.createTime || 0).getTime();
          const timeB = new Date(b.time || b.createTime || 0).getTime();
          return timeB - timeA;
        })[0];

        // 格式化记录数据
        const formattedRecord = this.mapAndNormalizeRecords([latestRecord])[0];
        const originalImageUrl = latestRecord.imageUrl || (latestRecord.rawData && latestRecord.rawData.imageUrl) || '';
        const optimizedUrl = this.getOptimizedImageUrl(originalImageUrl);

        // 检查数据是否有变化，避免不必要的更新
        const currentSnapshot = this.channelSnapshots[channelName];
        const newPlateNumber = formattedRecord.license;
        const newTimestamp = formattedRecord.time;

        // 如果数据没有变化，跳过更新
        if (currentSnapshot &&
          currentSnapshot.imageUrl === optimizedUrl &&
          currentSnapshot.plateNumber === newPlateNumber &&
          currentSnapshot.timestamp === newTimestamp) {
          return false; // 没有更新
        }

        // 更新通道快照
        this.updateChannelSnapshot(channelName, {
          imageUrl: optimizedUrl, // 不添加缓存破坏
          plateNumber: newPlateNumber,
          timestamp: newTimestamp,
          channelType: formattedRecord.channelType,
          vehicleType: formattedRecord.vipName || formattedRecord.vehicleType
        });

        return true; // 有更新
      } else {
        // 即使没有记录，也要确保通道快照存在
        if (!this.channelSnapshots[channelName]) {
          this.channelSnapshots[channelName] = {
            channel: channelName,
            imageUrl: '',
            plateNumber: '',
            timestamp: '',
            channelType: 'entry',
            vehicleType: ''
          };
          return true; // 创建了新快照
        }
        return false; // 没有更新
      }
    },
    /**
 * 打开详情弹窗
 * @param {string} type - 详情类型
 * @param {boolean} preserveFilters - 是否保留筛选条件（车牌号等），默认为false
 */
    async openDetailModal(type, preserveFilters = false) {
      console.log('🔍 [详情弹窗] 打开详情弹窗:', type, '保留筛选:', preserveFilters, '当前时间范围:', this.tabTimeRange);
      
      // 🔥 大数据量处理：检查是否需要特殊处理
      const isLargeDataRange = this.isLargeDataTimeRange(type);
      if (isLargeDataRange) {
        console.log('⚠️ [大数据量] 检测到大数据量时间范围，启用优化模式');
        await this.handleLargeDataModal(type);
        return;
      }
      
      this.detailType = type;
      this.showDetailModal = true;

      // 设置弹窗标题和表格列
      const config = this.getDetailConfig(type);
      this.detailModalTitle = config.title;
      this.detailColumns = config.columns;

      // 重置筛选条件（根据参数决定是否保留车牌号筛选）
      const preservePlateNumber = preserveFilters ? this.detailFilters.plateNumber : null; // 只在需要时保存车牌号筛选
      this.resetDetailFilters();
      // 只有在 preserveFilters=true 时才恢复车牌筛选
      if (preservePlateNumber && preserveFilters && (type === 'violation' || type === 'vehicle-entry' || type === 'vehicle-exit')) {
        this.detailFilters.plateNumber = preservePlateNumber; // 恢复车牌号筛选
        console.log(`🔍 [${type}详情] 恢复车牌号筛选:`, preservePlateNumber);
      } else if (!preserveFilters) {
        console.log(`✨ [${type}详情] 不保留筛选条件，车牌号已清除`);
      }

      // 加载下拉选择列表
      if (type === 'violation') {
        // 违规类型加载添加人列表
        await this.loadAvailableCreators();
      } else if (!type.includes('face')) {
        // 其他车辆类型加载通道列表
        await this.loadAvailableChannels();
      } else {
        // 人脸类型也加载通道列表
        await this.loadAvailableChannels();
      }

      // 加载数据
      this.loadDetailData();
      
      // 🔥 禁用定时刷新，只在打开时加载一次数据，避免频繁刷新影响用户体验
      // this.startDetailRefresh();
    },

    /**
     * 关闭详情弹窗
     */
    closeDetailModal() {
      this.showDetailModal = false;
      this.detailData = [];
      this.detailPage = 1;
      this.lastRefreshTime = '';  // 清空更新时间
      
      // 🔥 停止定时刷新
      this.stopDetailRefresh();
      
      // 🔥 重置大数据量优化相关参数
      if (this.detailPageSize !== 10000) {
        console.log('🔄 [弹窗关闭] 重置页面大小从', this.detailPageSize, '到默认值');
        this.detailPageSize = 10000;  // 重置为默认值
      }
    },

    /**
     * 清理过期缓存 - 避免内存占用
     */
    cleanExpiredCache() {
      const now = Date.now();
      const expireTime = 5 * 60 * 1000; // 5分钟
      
      Object.keys(this.detailDataCache).forEach(key => {
        if (now - this.detailDataCache[key].timestamp > expireTime) {
          delete this.detailDataCache[key];
        }
      });
    },

    /**
     * 启动车辆弹窗定时刷新（每5秒刷新一次）
     */
    startDetailRefresh() {
      // 先停止已有的定时器
      this.stopDetailRefresh();
      
      console.log('⏰ [弹窗刷新] 启动定时刷新，间隔: 5秒');
      
      // 启动定时刷新
      this.detailRefreshTimer = setInterval(() => {
        console.log('🔄 [弹窗刷新] 定时刷新车辆数据...', new Date().toLocaleTimeString());
        
        // 只在弹窗打开状态下刷新
        if (this.showDetailModal) {
          this.loadDetailData();
        } else {
          // 如果弹窗已关闭，停止定时器
          console.log('⏹️ [弹窗刷新] 弹窗已关闭，停止刷新');
          this.stopDetailRefresh();
        }
      }, 5000);  // 5秒刷新一次，提升实时性
    },

    /**
     * 停止车辆弹窗定时刷新
     */
    stopDetailRefresh() {
      if (this.detailRefreshTimer) {
        console.log('⏹️ [弹窗刷新] 停止定时刷新');
        clearInterval(this.detailRefreshTimer);
        this.detailRefreshTimer = null;
      }
    },

    /**
     * 获取详情配置
     */
    getDetailConfig(type) {
      // 强制触发响应式更新
      this.$forceUpdate();
      const configs = {
        'vehicle-entry': {
          title: `${this.currentTimeLabel}车辆进场详情`,
          columns: [
            { key: 'plateNumber', label: '车牌号' },
            { key: 'channelName', label: '通道名称' },
             { key: 'enterVipType', label: '进场VIP类型', width: '150px' },  
             { key: 'enterCustomVipName', label: 'VIP名称', width: '180px' },
            { key: 'enterType', label: '放行类型' },
            { key: 'enterTime', label: '进场时间' },
            { key: 'enterPhoto', label: '进场照片', width: '150px' }
          ],
          api: '/parking/vehicle-records/report_car_in'
        },
        'vehicle-exit': {
          title: `${this.currentTimeLabel}车辆出场详情`,
          columns: [
            { key: 'plateNumber', label: '车牌号', width: '180px' },
            { key: 'enterChannelName', label: '进场通道', width: '120px' },
            { key: 'leaveChannelName', label: '出场通道', width: '120px' },
            { key: 'enterTime', label: '入场时间', width: '180px' },
            { key: 'leaveTime', label: '离场时间', width: '180px' },
            { key: 'enterVipType', label: '进场VIP类型', width: '150px' },  
            { key: 'leaveCustomVipName', label: 'VIP名称', width: '150px' },
            { key: 'stoppingTime', label: '停车时长', width: '120px' },
            { key: 'enterPhoto', label: '进场照片' },
            { key: 'leavePhoto', label: '出场照片'}
          ],
          api: '/parking/vehicle-records/report_car_out'
        },
        'vehicle-onsite': {
          title: `${this.currentTimeLabel}在场车辆详情`,
          columns: [
            { key: 'plateNumber', label: '车牌号' },
            { key: 'channelName', label: '进场通道' },
            { key: 'enterVipType', label: '进场VIP类型', width: '150px' },  
            { key: 'enterCustomVipName', label: 'VIP名称', width: '180px' },
            { key: 'enterTime', label: '进场时间' },
            { key: 'duration', label: '停车时长', width: '150px' },
            { key: 'enterPhoto', label: '进场照片', width: '120px' },
          ],
          api: '/parking/vehicle-records/onsite'
        },
        'violation': {
          title: `${this.currentTimeLabel}违规详情`,
          columns: [
            { key: 'plateNumber', label: '车牌号', width: '180px' },
            { key: 'violationType', label: '违规类型', width: '110px' },
            { key: 'location', label: '位置', width: '250px' }, // 从100px扩大刺150px
            { key: 'ownerInfo', label: '车主信息', width: '280px' },
            { key: 'createTime', label: '违规时间', width: '160px' }, // 从220px缩小到160px
            { key: 'createBy', label: '添加人', width: '140px' }, // 从100px扩大到140px
            { key: 'photos', label: '违规照片', width: '180px' }
          ],
          api: '/parking/violations/list'
        },
        'face-entry': {
          title: `${this.currentTimeLabel}人脸进场详情`,
          columns: [
            { key: 'personName', label: '姓名' },
            { key: 'channelName', label: '通道名称' },
            { key: 'personType', label: '人员类型' },
            { key: 'department', label: '部门/学院' },
            { key: 'phoneNo', label: '手机号' },
            { key: 'idNumber', label: '身份证号' },
            { key: 'recognitionMethod', label: '识别方式' },
            { key: 'reservationInfo', label: '预约信息' },
            { key: 'eventTime', label: '进场时间' },
            { key: 'facePhoto', label: '人脸照片', width: '120px' }
          ],
          api: '/parking/face-monitor/list'
        },
        'face-exit': {
          title: `${this.currentTimeLabel}人脸出场详情`,
          columns: [
            { key: 'personName', label: '姓名' },
            { key: 'channelName', label: '通道名称' },
            { key: 'personType', label: '人员类型' },
            { key: 'department', label: '部门/学院' },
            { key: 'phoneNo', label: '手机号' },
            { key: 'idNumber', label: '身份证号' },
            { key: 'recognitionMethod', label: '识别方式' },
            { key: 'reservationInfo', label: '预约信息' },
            { key: 'eventTime', label: '出场时间' },
            { key: 'facePhoto', label: '人脸照片', width: '120px' }
          ],
          api: '/parking/face-monitor/list'
        }
      };
      return configs[type] || configs['vehicle-entry'];
    },

    /**
     * 加载详情数据
     */
    async loadDetailData() {
      this.detailLoading = true;
      this.detailPage = 1;

      // 立即显示加载状态，提升用户体验
      this.$nextTick(() => {
        // 确保loading状态立即生效
      });

      try {
        const cacheKey = `${this.detailType}_${this.detailFilters.timeRange}_${JSON.stringify(this.detailFilters)}`;
        
        console.log('🚀 [详情数据] 开始加载最新数据...', this.detailType, '(已禁用缓存)');

        // 获取时间范围
        const { startDate, endDate } = this.getDetailTimeRange();
        console.log('📅 [详情时间范围]', startDate, '-', endDate);

        // 构建请求参数 - 根据统计数据动态调整加载量
        let dynamicSize = 5000;  // 默认5000条（增加默认值）
        
        // 根据当前统计数据预估合适的加载量
        const currentStats = this.currentVehicleData;
        const currentFaceStats = this.currentFaceData;
        
        // 🔥 大数据量优化：根据时间范围和数据类型调整限制
        if (this.detailType === 'vehicle-entry' && currentStats.entry) {
          dynamicSize = Math.min(Math.max(currentStats.entry, 5000), 10000);
        } else if (this.detailType === 'vehicle-exit' && currentStats.exit) {
          dynamicSize = Math.min(Math.max(currentStats.exit, 5000), 10000);
        } else if (this.detailType === 'vehicle-onsite' && currentStats.current) {
          dynamicSize = Math.min(Math.max(currentStats.current, 3000), 8000);
        } else if (this.detailType === 'face-entry' && currentFaceStats.entry) {
          // 人脸数据根据时间范围限制
          const isLargeTimeRange = this.tabTimeRange === 'monthly' || this.tabTimeRange === 'yearly';
          if (isLargeTimeRange) {
            dynamicSize = Math.min(this.detailPageSize || 1000, 2000); // 大时间范围限制到2000条以内
            console.log('⚠️ [大数据量限制] 人脸进场数据限制为', dynamicSize, '条');
          } else {
            dynamicSize = Math.min(Math.max(currentFaceStats.entry, 5000), 15000);
          }
        } else if (this.detailType === 'face-exit' && currentFaceStats.exit) {
          // 人脸数据根据时间范围限制  
          const isLargeTimeRange = this.tabTimeRange === 'monthly' || this.tabTimeRange === 'yearly';
          if (isLargeTimeRange) {
            dynamicSize = Math.min(this.detailPageSize || 1000, 2000); // 大时间范围限制到2000条以内
            console.log('⚠️ [大数据量限制] 人脸出场数据限制为', dynamicSize, '条');
          } else {
            dynamicSize = Math.min(Math.max(currentFaceStats.exit, 5000), 15000);
          }
        }
        
        const params = {
          startDate,
          endDate,
          page: this.detailPage,
          size: dynamicSize  // 直接使用dynamicSize，不再限制
        };
        
        console.log(`📊 [加载优化] ${this.detailType} 预估数据量: ${dynamicSize} 条`);

        // 添加车牌号筛选（车辆和违规用）
        if (this.detailFilters.plateNumber && !this.detailType.includes('face')) {
          params.plateNumber = this.detailFilters.plateNumber;
          // 违规API可能使用不同的参数名，添加兼容性
          if (this.detailType === 'violation') {
            params.carLicenseNumber = this.detailFilters.plateNumber;
            params.carNo = this.detailFilters.plateNumber;
          }
        }

        // 添加姓名筛选（人脸用）
        if (this.detailFilters.personName && this.detailType.includes('face')) {
          params.personName = this.detailFilters.personName;
        }

        // 添加手机号筛选（人脸用）
        if (this.detailFilters.phoneNo && this.detailType.includes('face')) {
          params.phoneNo = this.detailFilters.phoneNo;
        }

        // 添加身份证号筛选（人脸用）
        if (this.detailFilters.idNumber && this.detailType.includes('face')) {
          params.idNumber = this.detailFilters.idNumber;
        }

        // 添加人员类型筛选（人脸用）
        if (this.detailFilters.personType && this.detailType.includes('face')) {
          params.personType = this.detailFilters.personType;
        }

        // 添加组织机构/学院筛选（人脸用）
        if (this.detailFilters.organization && this.detailType.includes('face')) {
          params.organization = this.detailFilters.organization;
        }

        // 🔥 修改通道筛选逻辑 - 支持车辆出场的进场通道和出场通道筛选
        if (this.detailFilters.channel && this.detailType !== 'violation') {
          if (this.detailType === 'vehicle-exit') {
            // 车辆出场：根据通道类型使用不同参数
            if (this.detailFilters.channelType === 'enter') {
              params.enterChannel = this.detailFilters.channel;  // 进场通道筛选
              console.log('🔍 [车辆出场] 使用进场通道筛选:', params.enterChannel);
            } else {
              params.exitChannel = this.detailFilters.channel;  // 出场通道筛选  
              console.log('🔍 [车辆出场] 使用出场通道筛选:', params.exitChannel);
            }
          } else if (this.detailType === 'vehicle-entry' || this.detailType === 'vehicle-onsite') {
            params.channel = this.detailFilters.channel;  // 车辆进场和在场
          } else {
            params.channelName = this.detailFilters.channel;  // 人脸监控等用channelName
          }
        }

        // 添加创建人筛选（违规专用）
        if (this.detailFilters.createBy && this.detailType === 'violation') {
          params.createdBy = this.detailFilters.createBy;
        }

        // 根据类型调用不同的API
        let response;
        const config = this.getDetailConfig(this.detailType);

        if (this.detailType === 'violation') {
          // 违规数据调用外部API（与统计API保持一致）
          const apiUrl = 'https://www.xuerparking.cn:8543/parking/violations';
          response = await axios.get(apiUrl, {
            params: {
              ...params,
              community: '东北林业大学'
            }
          });
        } else if (this.detailType.includes('face')) {
          // 人脸数据
          const direction = this.detailType === 'face-entry' ? '进' : '出';
          const apiUrl = 'http://localhost:8675/parking/face-monitor/list';
          response = await axios.get(apiUrl, {
            params: {
              ...params,
              direction
            }
          });
        } else if (this.detailType === 'vehicle-onsite') {
          // 在场车辆：查询进场未出场的记录
          const apiUrl = 'http://localhost:8675/parking/vehicle-records/onsite';
          response = await axios.get(apiUrl, {
            params
          });
        } else {
          // 车辆进场/出场数据
          const table = this.detailType === 'vehicle-entry' ? 'report_car_in' : 'report_car_out';
          const apiUrl = `http://localhost:8675/parking/vehicle-records/${table}`;
          response = await axios.get(apiUrl, {
            params
          });
        }

        // 解析数据
        let records = [];
        if (response.data) {
          // 优先判断 code 字段（可能是 '0', 0, '200', 200）
          const code = String(response.data.code);

          if (code === '0' || code === '200' || response.data.code === 0 || response.data.code === 200 || response.data.success === true) {
            // 处理多种嵌套格式
            if (response.data.data && response.data.data.data && response.data.data.data.records) {
              records = response.data.data.data.records;
              console.log('📊 [数据解析] 使用三层嵌套 data.data.data.records，数量:', records.length);
            } else if (response.data.data && response.data.data.records) {
              records = response.data.data.records;
              console.log('📊 [数据解析] 使用双层嵌套 data.data.records，数量:', records.length);
            } else if (Array.isArray(response.data.data)) {
              records = response.data.data;
              console.log('📊 [数据解析] 使用单层数组 data.data，数量:', records.length);
            } else if (response.data.records) {
              records = response.data.records;
              console.log('📊 [数据解析] 使用 data.records，数量:', records.length);
            } else if (Array.isArray(response.data)) {
              records = response.data;
              console.log('📊 [数据解析] 直接使用 data 数组，数量:', records.length);
            } else {
              console.warn('⚠️ [数据解析] 未找到records数组，完整response.data:', JSON.stringify(response.data, null, 2));
            }
          } else {
            console.error('❌ [API响应] 响应code不符合预期:', {
              code: response.data.code,
              message: response.data.message || response.data.msg,
              全部响应: response.data
            });
          }
        } else {
          console.error('❌ [API响应] 响应数据为空');
        }

        // 数据转换
        this.detailData = this.transformDetailData(records);

        // 缓存数据 - 提升后续访问速度
        this.detailDataCache[cacheKey] = {
          data: this.detailData,
          timestamp: Date.now()
        };

        // 清理过期缓存 - 避免内存占用
        this.cleanExpiredCache();

        // 更新最后刷新时间
        const now = new Date();
        this.lastRefreshTime = now.toLocaleTimeString('zh-CN', { hour12: false });
        
        console.log('✅ [详情数据] 加载完成:', this.detailData.length, '条记录', '更新时间:', this.lastRefreshTime);
        console.log('📋 [详情数据示例] 第一条:', this.detailData[4]);

        // 如果没有数据，显示提示
        if (this.detailData.length === 0) {
          console.warn('⚠️ [详情数据] 查询结果为空，请检查：');
          console.warn('  1. API地址是否正确');
          console.warn('  2. 时间范围是否有数据');
          console.warn('  3. 筛选条件是否过于严格');
          console.warn('  4. 后端服务是否正常运行');
        }
      } catch (error) {
        console.error('❌ [详情数据] 加载失败:', error);
        console.error('❌ [错误详情]:', {
          message: error.message,
          response: error.response?.data,
          status: error.response?.status
        });
        this.$message?.error(`数据加载失败: ${error.message}`);
        this.detailData = [];
      } finally {
        this.detailLoading = false;
      }
    },

    /**
     * 加载可用通道列表（不带筛选条件）
     */
    async loadAvailableChannels() {
      try {
        console.log('📋 [通道列表] 开始加载...');

        // 获取时间范围
        const { startDate, endDate } = this.getDetailTimeRange();

        // 构建请求参数（不带任何筛选条件）
        const params = {
          startDate,
          endDate,
          page: 1,
          size: 10000
        };

        // 根据类型调用不同的API
        let response;

        if (this.detailType === 'violation') {
          // 与loadDetailData保持一致，使用相同的API地址
          response = await axios.get('https://www.xuerparking.cn:8543/parking/violations', {
            params: {
              ...params,
              community: '东北林业大学'
            }
          });
        } else if (this.detailType.includes('face')) {
          const direction = this.detailType === 'face-entry' ? '进' : '出';
          response = await axios.get('http://localhost:8675/parking/face-monitor/list', {
            params: {
              ...params,
              direction
            }
          });
        } else if (this.detailType === 'vehicle-onsite') {
          response = await axios.get('http://localhost:8675/parking/vehicle-records/onsite', {
            params
          });
        } else {
          const table = this.detailType === 'vehicle-entry' ? 'report_car_in' : 'report_car_out';
          response = await axios.get(`http://localhost:8675/parking/vehicle-records/${table}`, {
            params
          });
        }

        // 解析数据
        let records = [];
        if (response.data && response.data.code === '0') {
          if (response.data.data && response.data.data.data && response.data.data.data.records) {
            records = response.data.data.data.records;
          } else if (response.data.data && response.data.data.records) {
            records = response.data.data.records;
          } else if (Array.isArray(response.data.data)) {
            records = response.data.data;
          }
        }

        // 提取通道列表
        const channels = new Set();
        
        if (this.detailType === 'vehicle-exit') {
          // 🔥 车辆出场：需要同时提取进场通道和出场通道
          records.forEach(r => {
            // 进场通道
            const enterChannel = r.enterChannelName || r.enter_channel_name || '';
            if (enterChannel) channels.add(enterChannel);
            
            // 出场通道  
            const exitChannel = r.leaveChannelName || r.leave_channel_name || r.channelName || r.channel_name || '';
            if (exitChannel) channels.add(exitChannel);
          });
        } else {
          // 其他类型：使用原有逻辑
          records.forEach(r => {
            const channel = r.channelName || r.channel_name || '';
            if (channel) channels.add(channel);
          });
        }
        
        this.availableChannels = Array.from(channels).sort();

        console.log('✅ [通道列表] 加载完成:', this.availableChannels.length, '个通道', this.availableChannels);
      } catch (error) {
        console.error('❌ [通道列表] 加载失败:', error);
        this.availableChannels = [];
      }
    },

    /**
     * 加载可用添加人列表（违规专用）
     */
    async loadAvailableCreators() {
      try {
        console.log('📋 [添加人列表] 开始加载...');

        // 获取时间范围
        const { startDate, endDate } = this.getDetailTimeRange();

        // 构建请求参数（不带任何筛选条件）
        const params = {
          startDate,
          endDate,
          page: 1,
          size: 10000,
          community: '东北林业大学'
        };

        // 调用违规API
        const response = await axios.get('/violation-api/parking/violations', {
          params
        });

        // 解析数据
        let records = [];
        if (response.data && response.data.code === '0') {
          if (response.data.data && response.data.data.data && response.data.data.data.records) {
            records = response.data.data.data.records;
          } else if (response.data.data && response.data.data.records) {
            records = response.data.data.records;
          } else if (Array.isArray(response.data.data)) {
            records = response.data.data;
          }
        }

        // 提取添加人列表
        const creators = new Set();
        records.forEach(r => {
          const creator = r.createdBy || r.createBy || r.create_by || '';
          if (creator) creators.add(creator);
        });
        this.availableCreators = Array.from(creators).sort();

        console.log('✅ [添加人列表] 加载完成:', this.availableCreators.length, '个添加人', this.availableCreators);
      } catch (error) {
        console.error('❌ [添加人列表] 加载失败:', error);
        this.availableCreators = [];
      }
    },

    /**
     * 转换详情数据
     */
    transformDetailData(records) {
      return records.map(r => {
        if (this.detailType === 'violation') {
          // 构建车主信息对象
          const ownerInfo = {
            ownerName: r.violationOwnerName || r.ownerName || '',
            ownerPhone: r.ownerPhone || '',
            vipTypeName: r.vipTypeName || '',
            ownerType: r.ownerType || '',
            ownerCategory: r.ownerCategory || '',
            ownerAddress: r.ownerAddress || '',
            isMonthlyTicket: r.isMonthlyTicket || false
          };

          // 解析photos字段（可能是JSON字符串或数组）
          let photos = [];
          if (r.photos) {
            if (typeof r.photos === 'string') {
              try {
                photos = JSON.parse(r.photos);
                if (!Array.isArray(photos)) {
                  photos = [];
                }
              } catch (e) {
                console.warn('⚠️ [照片解析] 解析失败，原始值:', r.photos);
                photos = [];
              }
            } else if (Array.isArray(r.photos)) {
              photos = r.photos;
            }
          }

          // 处理时间字段 - 注意后端返回的是createdAt（带d）
          let createTime = '-';
          if (r.createdAt) {
            createTime = this.formatTimestamp(r.createdAt);
          } else if (r.createAt) {
            createTime = this.formatTimestamp(r.createAt);
          } else if (r.createTime) {
            createTime = r.createTime;
          } else if (r.create_time) {
            createTime = r.create_time;
          }

          // 处理创建人字段 - 注意后端返回的是createdBy（带d）
          const createBy = r.createdBy || r.createBy || r.create_by || r.creator || '-';


          // 智能判断新能源车牌
          const plateNumber = r.plateNumber || r.carNo || r.car_no || '';
          let isNewEnergy = r.isNewEnergy === 1 || r.isNewEnergy === true;

          // 如果后端标识为非新能源，但车牌格式符合新能源规则，则修正
          if (!isNewEnergy && plateNumber) {
            // 新能源车牌特征：
            // 1. 长度为8位（如：黑AF7863D）
            // 2. 最后一位是D或F
            // 3. 或以"新"开头
            const isGreenPlateFormat = plateNumber.length === 8 ||
              /[DF]$/.test(plateNumber) ||
              plateNumber.startsWith('新');
            if (isGreenPlateFormat) {
              isNewEnergy = true;
            }
          }

          return {
            plateNumber: plateNumber,
            isNewEnergy: isNewEnergy,
            violationType: r.violationType || r.violation_type || '',
            severity: this.getSeverityText(r.severity),
            description: r.description || '',
            parkName: r.parkName || r.parkCode || r.park_name || '',
            location: r.location || '',
            ownerInfo: ownerInfo,
            createTime: createTime,
            createBy: createBy,
            processStatus: this.getProcessStatusText(r.processStatus || r.process_status || r.status),
            photos: photos,
            remark: r.remark || '',
            shouldInBlacklist: r.shouldInBlacklist || false,
            // 添加车牌颜色字段映射，支持正确的车牌样式显示
            carColor: r.carColor || r.car_color || r.plateColor || r.plate_color || '',
            enter_car_license_color: r.carColor || r.car_color || r.plateColor || r.plate_color || '',
            exit_car_license_color: r.carColor || r.car_color || r.plateColor || r.plate_color || ''
          };
        } else if (this.detailType.includes('face')) {
          // 调试：打印原始数据查看字段
          if (process.env.NODE_ENV === 'development') {
            console.log('🔍 [预约信息调试]', {
              isReservedVisitor: r.isReservedVisitor,
              isPureVisitor: r.isPureVisitor,
              reservationTimeRange: r.reservationTimeRange,
              reservationFormName: r.reservationFormName,
              reservationCarPlate: r.reservationCarPlate,
              原始数据: r
            });
          }

          // 构建预约信息结构化对象
          let reservationInfo = {
            type: '-',  // 类型：reserved(预约)、pure(纯访客)、none(无)
            timeRange: '',
            formName: '',
            carPlate: '',
            isNewEnergy: false
          };

          if (r.isReservedVisitor) {
            // 预约访客
            reservationInfo.type = 'reserved';
            reservationInfo.timeRange = r.reservationTimeRange || '';
            reservationInfo.formName = r.reservationFormName || '';
            reservationInfo.carPlate = r.reservationCarPlate || '';
            // 判断是否为新能源车（绿牌：以"新"开头、长度为8位、或以特定字母开头）
            if (reservationInfo.carPlate) {
              const plate = reservationInfo.carPlate;
              reservationInfo.isNewEnergy = plate.startsWith('新') ||
                plate.length === 8 ||
                /^[京津沪渝冀豫云辽黑湘皖鲁新苏浙赣鄂桂甘晋蒙陕吉闽贵粤青藏川宁琼使领][A-Z][DF][A-Z0-9]{5}$/.test(plate);
            }
          } else if (r.isPureVisitor) {
            // 纯访客（人证比对进入且无预约）
            reservationInfo.type = 'pure';
          } else {
            reservationInfo.type = 'none';
          }

          // 🔥 使用智能人员类型判断（详情弹窗）
          const originalPersonType = r.personType || r.person_type || '';
          const department = r.department || '';
          const smartPersonType = this.getSmartPersonType(originalPersonType, department);
          
          return {
            personName: r.personName || r.person_name || '',
            channelName: r.channelName || r.channel_name || '',
            personType: smartPersonType, // 使用修正后的人员类型
            department: department,
            phoneNo: r.phoneNo || r.phone_no || '-',
            idNumber: r.idNumber || r.id_number || '-',
            recognitionMethod: r.recognitionMethod || r.recognition_method || '',
            reservationInfo: reservationInfo,  // 现在是对象而不是字符串
            eventTime: r.eventTime || r.event_time || '',
            // 添加人脸照片字段映射
            facePhoto: r.photoUrl || r.photo_url || r.facePhoto || r.face_photo || ''
          };
        } else {

          const plateNumber = r.car_license_number || r.license_number || r.licenseNumber || r.plateNumber || r.carNo || r.car_no || '';

          // 智能判断新能源车牌
          let isNewEnergy = r.isNewEnergy === 1 || r.isNewEnergy === true;
          if (!isNewEnergy && plateNumber) {
            const isGreenPlateFormat = plateNumber.length === 8 ||
              /[DF]$/.test(plateNumber) ||
              plateNumber.startsWith('新');
            if (isGreenPlateFormat) {
              isNewEnergy = true;
            }
          }

          return {
            // 基础字段
            plateNumber: plateNumber,
            licensePlateNumber: r.car_license_number || r.license_number || plateNumber,
            channelName: r.channel_name || r.channelName || '',
            isNewEnergy: isNewEnergy,

            // 时间字段
            createTime: r.create_time || r.createTime || r.enter_time || r.enterTime || '',
            enterTime: r.enter_time || r.enterTime || '',
            exitTime: r.exit_time || r.exitTime || '',

            // VIP和类型字段 - 按数据库表字段映射
            enterCustomVipName: r.enter_custom_vip_name || r.enterCustomVipName || '',  // 进场VIP名称
            enterVipType: r.enter_vip_type || r.enterVipType || '普通用户',  // ✅ 不回退到vipName
            leaveVipType: r.leave_vip_type || r.exit_vip_type || r.exitVipType || '',  // 出场VIP类型
            leaveCustomVipName: r.leave_custom_vip_name || r.exitVipName || '',  // 离场VIP名称
            vipName: r.vipName || r.vip_name || '普通用户',

            // 通道名称字段
            enterChannelName: r.enter_channel_name || r.channelName || r.channel_name || '',
            leaveChannelName: r.leave_channel_name || r.exitChannelName || '',

            // 车辆类型 - 按数据库表字段映射
            enterType: r.enter_type || r.enter_car_type || r.enterCarType || '',  // 进场类型
            leaveType: r.leave_type || r.exit_type || r.exitType || '',  // 离场类型
            enterCarType: r.enter_car_type || r.enterCarType || '',
            leaveCarType: r.leave_car_type || r.exit_car_type || r.exitCarType || '',
            recordType: r.record_type || r.recordType || '',

            // 车牌颜色 - 按数据库表字段映射（修复车牌颜色样式显示）
            enterCarLicenseColor: r.enter_car_license_color || r.enterCarLicenseColor || r.carColor || r.car_color || r.plateColor || r.plate_color || '',
            leaveCarLicenseColor: r.leave_car_license_color || r.exit_car_license_color || r.carColor || r.car_color || r.plateColor || r.plate_color || '',
            // 添加统一的车牌颜色字段，确保getPlateType方法能够正确识别
            carColor: r.carColor || r.car_color || r.plateColor || r.plate_color || r.enter_car_license_color || r.enterCarLicenseColor || '',
            enter_car_license_color: r.enter_car_license_color || r.carColor || r.car_color || r.plateColor || r.plate_color || r.enterCarLicenseColor || '',
            exit_car_license_color: r.leave_car_license_color || r.exit_car_license_color || r.carColor || r.car_color || r.plateColor || r.plate_color || '',

            // 时间和金额字段
            leaveTime: r.leave_time || r.exit_time || r.exitTime || '',  // 离场时间
            stoppingTime: r.stopping_time || r.parkingTime || this.calculateDuration(r.enter_time || r.enterTime, r.leave_time || r.exit_time),
            amountReceivable: r.amount_receivable || r.amount || '',

            // 照片 - 按数据库表字段映射（出场弹窗显示进场+出场照片）
            enterPhoto: r.enter_car_full_picture || r.imageUrl || r.enterPhoto || '',  // 进场照片
            leavePhoto: r.leave_car_full_picture || r.exit_car_full_picture || r.exitPhoto || '',  // 出场照片

            // 计算字段
            parkingTime: r.parking_time || this.calculateDuration(r.enter_time || r.enterTime, r.exit_time || r.exitTime),
            duration: this.calculateDuration(r.enter_time || r.enterTime, r.exit_time || r.exitTime)
          };
        }
      });
    },

    /**
     * 获取处理状态文本
     */
    getProcessStatusText(status) {
      const statusMap = {
        'pending': '待处理',
        'processing': '处理中',
        'processed': '已处理',
        'closed': '已关闭'
      };
      return statusMap[status] || status || '未知';
    },

    /**
     * 获取严重程度文本
     */
    getSeverityText(severity) {
      const severityMap = {
        'SEVERE': '严重',
        'MODERATE': '中等',
        'MINOR': '轻微',
        'WARNING': '警告'
      };
      return severityMap[severity] || severity || '未知';
    },

    /**
     * 格式化时间戳
     */
    formatTimestamp(timestamp) {
      if (!timestamp) return '-';
      try {
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      } catch (e) {
        return timestamp;
      }
    },

    /**
     * 计算停车时长
     */
    calculateDuration(enterTime, exitTime) {
      if (!enterTime) return '-';

      const start = new Date(enterTime);
      const end = exitTime ? new Date(exitTime) : new Date();
      const diff = end - start;

      if (diff < 0) return '-';

      const hours = Math.floor(diff / (1000 * 60 * 60));
      const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));

      if (hours > 0) {
        return `${hours}小时${minutes}分钟`;
      } else {
        return `${minutes}分钟`;
      }
    },

    /**
     * 获取详情时间范围
     */
    getDetailTimeRange() {
      const now = new Date();
      let startDate, endDate;

      switch (this.detailFilters.timeRange) {
        case 'today':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'yesterday':
          const yesterday = new Date(now.getTime() - 24 * 60 * 60 * 1000);
          startDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 0, 0, 0);
          endDate = new Date(yesterday.getFullYear(), yesterday.getMonth(), yesterday.getDate(), 23, 59, 59);
          break;
        case 'week':
          const dayOfWeek = now.getDay() || 7;
          startDate = new Date(now.getTime() - (dayOfWeek - 1) * 24 * 60 * 60 * 1000);
          startDate.setHours(0, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'year':
          // 今年：从1月1日到当前日期
          startDate = new Date(now.getFullYear(), 0, 1, 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          break;
        case 'custom':
          if (this.detailFilters.startTime && this.detailFilters.endTime) {
            startDate = new Date(this.detailFilters.startTime);
            endDate = new Date(this.detailFilters.endTime);
          } else {
            // 默认今日
            startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
            endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
          }
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 0, 0, 0);
          endDate = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 23, 59, 59);
      }

      const formatDate = (date) => {
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      };

      return {
        startDate: formatDate(startDate),
        endDate: formatDate(endDate)
      };
    },

    /**
     * 重置筛选条件
     */
    resetDetailFilters() {
      // 根据上方Tab的时间范围设置默认值
      let defaultTimeRange = 'today';
      switch (this.tabTimeRange) {
        case 'daily':
          defaultTimeRange = 'today';
          break;
        case 'weekly':
          defaultTimeRange = 'week';
          break;
        case 'monthly':
          defaultTimeRange = 'month';
          break;
        case 'yearly':
          defaultTimeRange = 'year';
          break;
      }

      this.detailFilters = {
        plateNumber: '',
        personName: '',
        phoneNo: '',
        idNumber: '',
        personType: '',
        organization: '',
        channel: '',
        createBy: '',
        timeRange: defaultTimeRange,
        startTime: '',
        endTime: ''
      };
      this.loadDetailData();
    },

    /**
     * 时间范围change事件
     */
    onDetailTimeRangeChange() {
      // 如果不是自定义，立即查询
      if (this.detailFilters.timeRange !== 'custom') {
        this.loadDetailData();
      }
    },

    /**
     * 格式化详情时间
     */
    formatDetailTime(timeStr) {
      if (!timeStr) return '-';

      try {
        const date = new Date(timeStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');
        return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`;
      } catch (e) {
        return timeStr;
      }
    },

    /**
     * 获取车牌样式类
     */
    getPlateClass(row) {
      // 可以根据车牌颜色或类型返回不同的样式类
      const plateNumber = row.plateNumber || row.carNo || '';
      if (plateNumber.includes('新能源')) {
        return 'plate-new-energy';
      }
      return 'plate-normal';
    },

    // 🔥 获取车辆弹窗中车牌的样式类（区分颜色）
    getChannelPlateClass(card) {
      if (!card || !card.plateNumber) return 'plate-default';
      
      const plateNumber = card.plateNumber;
      const plateType = this.getPlateType(plateNumber, card);
      
      // 获取车牌颜色信息
      let licenseColor = (card.enter_car_license_color || card.exit_car_license_color || '').toString().toLowerCase();
      
      // 🔍 调试日志：显示车牌颜色信息
      if (licenseColor) {
        console.log(`🎨 [车牌颜色] ${plateNumber} - 原始颜色: "${card.enter_car_license_color || card.exit_car_license_color}", 处理后: "${licenseColor}"`);
      }
      
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
      
      // 8位车牌自动判断为新能源绿牌
      if (plateNumber.length === 8) {
        return 'plate-new-energy';
      }
      
      // 根据颜色返回对应样式
      let resultClass;
      switch (licenseColor) {
        case '蓝色':
          resultClass = 'plate-blue';  // 蓝底白字（普通燃油车）
          break;
        case '黄色':
          resultClass = 'plate-yellow';  // 黄底黑字（大型车辆、营运车辆）
          break;
        case '绿色':
          resultClass = 'plate-new-energy';  // 绿底黑字（新能源）
          break;
        case '白色':
          resultClass = 'plate-white';  // 白底黑字（警用、军用等）
          break;
        default:
          // 默认根据车牌长度判断
          resultClass = plateNumber.length === 8 ? 'plate-new-energy' : 'plate-blue';
      } 
      return resultClass;
    },

    /**
     * 获取严重程度样式类
     */
    getSeverityClass(severity) {
      const classMap = {
        '严重': 'severity-severe',
        '中等': 'severity-moderate',
        '轻微': 'severity-minor',
        '警告': 'severity-warning'
      };
      return classMap[severity] || 'severity-unknown';
    },

    /**
     * 获取违规类型样式类
     */
    getViolationTypeClass(type) {
      if (!type) return 'type-default';

      // 根据违规类型关键词判断样式
      if (type.includes('超时') || type.includes('时长')) {
        return 'type-overtime';
      } else if (type.includes('违停') || type.includes('停放')) {
        return 'type-parking';
      } else if (type.includes('未缴费') || type.includes('欠费')) {
        return 'type-payment';
      } else if (type.includes('未授权') || type.includes('无权限')) {
        return 'type-unauthorized';
      } else {
        return 'type-other';
      }
    },

    /**
     * 预览照片
     */
    previewPhoto(photoUrl) {
      if (photoUrl) {
        this.photoPreviewUrl = photoUrl;
        this.photoPreviewVisible = true;
      }
    },

    /**
     * 关闭照片预览
     */
    closePhotoPreview() {
      this.photoPreviewVisible = false;
      this.photoPreviewUrl = '';
    },

    /**
     * 切换数据分析菜单
     */
    toggleAnalysisMenu() {
      this.showAnalysisMenu = !this.showAnalysisMenu;
    },

    /**
     * 打开排行榜弹窗
     */
    async openRankingModal(type) {
      console.log('🏆 [排行榜] 打开排行榜:', type);
      
      this.rankingType = type;
      this.showRankingModal = true;
      this.showAnalysisMenu = false; // 关闭下拉菜单
      
      // 加载排行榜数据
      await this.loadRankingData();
    },

    /**
     * 关闭排行榜弹窗
     */
    closeRankingModal() {
      this.showRankingModal = false;
      this.rankingData = [];
    },

    /**
     * 排行榜时间范围改变事件
     */
    onRankingTimeRangeChange() {
      console.log('📅 [排行榜] 时间范围改变:', this.rankingTimeRange);
      
      // 如果不是自定义时间，立即重新加载数据
      if (this.rankingTimeRange !== 'custom') {
        this.loadRankingData();
      } else {
        // 自定义时间：初始化默认日期为今天
        const today = new Date();
        const todayStr = today.toISOString().split('T')[0];
        
        if (!this.rankingCustomStartDate) {
          this.rankingCustomStartDate = todayStr;
        }
        if (!this.rankingCustomEndDate) {
          this.rankingCustomEndDate = todayStr;
        }
        
        console.log('📅 [排行榜] 切换到自定义时间:', {
          start: this.rankingCustomStartDate,
          end: this.rankingCustomEndDate
        });
      }
    },

    /**
     * 加载排行榜数据
     */
    async loadRankingData() {
      this.rankingLoading = true;
      
      try {
        // 🔥 使用排行榜独立的时间范围，而不是全局的selectedTimeRange
        let startDate, endDate;
        
        if (this.rankingTimeRange === 'custom') {
          // 自定义时间范围
          if (!this.rankingCustomStartDate || !this.rankingCustomEndDate) {
            console.warn('⚠️ [排行榜] 自定义时间范围未设置完整');
            this.rankingLoading = false;
            return;
          }
          startDate = this.rankingCustomStartDate;
          endDate = this.rankingCustomEndDate;
        } else {
          // 使用预设时间范围
          const dateRange = this.getDateRange(this.rankingTimeRange);
          startDate = dateRange.startDate;
          endDate = dateRange.endDate;
        }
        
        console.log('📅 [排行榜] 使用时间范围:', { 
          timeRange: this.rankingTimeRange, 
          startDate, 
          endDate 
        });
        
        if (this.rankingType === 'violation') {
          // 加载违规排行榜
          await this.loadViolationRanking(startDate, endDate);
        } else {
          // 加载进出频次排行
          await this.loadFrequencyRanking(startDate, endDate);
        }
      } catch (error) {
        console.error('❌ [排行榜] 加载失败:', error);
        this.rankingData = [];
      } finally {
        this.rankingLoading = false;
      }
    },

    /**
     * 加载违规排行榜数据
     */
    async loadViolationRanking(startDate, endDate) {
      try {
        console.log('🏆 [违规排行榜] 开始加载...', { startDate, endDate, limit: this.rankingLimit });
        
        // 调用外部违规API获取数据
        const response = await axios.get('https://www.xuerparking.cn:8543/parking/violations', {
          params: {
            page: 1,
            size: 100000, // 获取所有数据用于统计
            community: '东北林业大学',
            startDate,
            endDate
          }
        });

        const violations = response.data.data.data.records || [];
        console.log('📊 [违规排行榜] 获取到违规记录:', response);

        // 按车牌号分组统计
        const violationMap = {};
        violations.forEach(item => {
          const plate = item.carLicenseNumber || item.plateNumber;
          if (!plate) return;

          if (!violationMap[plate]) {
            violationMap[plate] = {
              plateNumber: plate,
              carLicenseNumber: plate,
              violationCount: 0,
              lastViolationTime: null,
              violations: [],
              ownerInfo: null,
              // 添加车牌颜色字段
              carColor: item.carColor || item.plateColor || item.enter_car_license_color || '',
              plateColor: item.carColor || item.plateColor || item.enter_car_license_color || ''
            };
          }

          violationMap[plate].violationCount++;
          violationMap[plate].violations.push(item);
          
          // 更新车牌颜色（使用最新记录的颜色）
          if (item.carColor || item.plateColor || item.enter_car_license_color) {
            violationMap[plate].carColor = item.carColor || item.plateColor || item.enter_car_license_color;
            violationMap[plate].plateColor = item.carColor || item.plateColor || item.enter_car_license_color;
          }
          
          // 提取业主信息（使用最新记录的业主信息）
          if (item.violationOwnerName || item.ownerName || item.ownerPhone || item.vipTypeName) {
            violationMap[plate].ownerInfo = {
              ownerName: item.violationOwnerName || item.ownerName || '',
              ownerPhone: item.ownerPhone || '',
              vipTypeName: item.vipTypeName || '',
              ownerType: item.ownerType || item.ownerCategory || ''
            };
          }
          
          // 更新最近违规时间
          const currentTime = item.violationTime || item.createTime;
          if (!violationMap[plate].lastViolationTime || 
              currentTime > violationMap[plate].lastViolationTime) {
            violationMap[plate].lastViolationTime = currentTime;
          }
        });

        // 转换为数组并排序
        let rankingData = Object.values(violationMap);
        
        if (this.rankingSortBy === 'count') {
          rankingData.sort((a, b) => b.violationCount - a.violationCount);
        } else {
          rankingData.sort((a, b) => 
            new Date(b.lastViolationTime) - new Date(a.lastViolationTime)
          );
        }

        // 限制数量
        this.rankingData = rankingData.slice(0, this.rankingLimit);
        
        console.log('✅ [违规排行榜] 加载完成, 排行数量:', this.rankingData.length);
        
      } catch (error) {
        console.error('❌ [违规排行榜] 加载失败:', error);
        this.rankingData = [];
      }
    },

    /**
     * 加载进出频次排行榜数据
     */
    async loadFrequencyRanking(startDate, endDate) {
      try {
        console.log('🔄 [频次排行榜] 开始加载...', { 
          dimension: this.frequencyDimension, 
          startDate, 
          endDate 
        });

        if (this.frequencyDimension === 'vehicle') {
          // 车辆维度排行
          await this.loadVehicleFrequencyRanking(startDate, endDate);
        } else {
          // 通道维度排行
          await this.loadChannelFrequencyRanking(startDate, endDate);
        }
        
      } catch (error) {
        console.error('❌ [频次排行榜] 加载失败:', error);
        this.rankingData = [];
      }
    },

    /**
     * 加载车辆频次排行
     */
    async loadVehicleFrequencyRanking(startDate, endDate) {
      try {
        // 获取进场记录
        const entryResponse = await axios.get('http://localhost:8675/parking/vehicle-records/report_car_in', {
          params: { startDate, endDate, page: 1, size: 100000 }
        });
        console.log('🔄 [车辆排行榜] 进场API响应:', entryResponse);
        console.log('🔄 [车辆排行榜] 进场数据结构:', {
          'response.data': entryResponse.data,
          'response.data.data': entryResponse.data?.data,
          'response.data.data.records': entryResponse.data?.data?.records
        });
        
        // 获取出场记录
        const exitResponse = await axios.get('http://localhost:8675/parking/vehicle-records/report_car_out', {
          params: { startDate, endDate, page: 1, size: 100000 }
        });
        console.log('🔄 [车辆排行榜] 出场API响应:', exitResponse);
        console.log('🔄 [车辆排行榜] 出场数据结构:', {
          'response.data': exitResponse.data,
          'response.data.data': exitResponse.data?.data,
          'response.data.data.records': exitResponse.data?.data?.records
        });
        
        const entryRecords = entryResponse.data?.data?.records || [];
        const exitRecords = exitResponse.data?.data?.records || [];

        console.log('📊 [车辆频次] 进场记录:', entryRecords.length, '条, 出场记录:', exitRecords.length, '条');
        
        // 🔍 调试：查看第一条进场记录的字段
        if (entryRecords.length > 0) {
          console.log('🔍 [进场记录] 第一条数据的所有字段:', Object.keys(entryRecords[0]));
          console.log('🔍 [进场记录] 第一条完整数据:', entryRecords[0]);
        }
        
        // 🔍 调试：查看第一条出场记录的字段
        if (exitRecords.length > 0) {
          console.log('🔍 [出场记录] 第一条数据的所有字段:', Object.keys(exitRecords[0]));
          console.log('🔍 [出场记录] 第一条完整数据:', exitRecords[0]);
        }
        
        // 如果没有数据，直接返回
        if (entryRecords.length === 0 && exitRecords.length === 0) {
          console.warn('⚠️ [车辆频次] 没有进出场记录数据');
          this.rankingData = [];
          return;
        }

        // 按车牌号统计
        const vehicleMap = {};
        
        entryRecords.forEach(item => {
          const plate = item.carLicenseNumber || item.plateNumber;
          if (!plate) return;
          
          if (!vehicleMap[plate]) {
            vehicleMap[plate] = {
              plateNumber: plate,
              carLicenseNumber: plate,
              entryCount: 0,
              exitCount: 0,
              totalCount: 0,
              ownerInfo: null,
              // 添加车牌颜色字段
              carColor: item.carColor || item.plateColor || item.enter_car_license_color || 
                        item.enterCarLicenseColor || '',
              plateColor: item.carColor || item.plateColor || item.enter_car_license_color || 
                          item.enterCarLicenseColor || ''
            };
          }
          vehicleMap[plate].entryCount++;
          vehicleMap[plate].totalCount++;
          
          // 更新车牌颜色（使用最新记录的颜色）
          const colorValue = item.carColor || item.plateColor || item.enter_car_license_color || 
                             item.enterCarLicenseColor || item.enter_car_type || '';
          if (colorValue) {
            vehicleMap[plate].carColor = colorValue;
            vehicleMap[plate].plateColor = colorValue;
          }
          
          // 提取业主信息（根据后端实际返回的字段）
          // 后端返回: vipName, enterCustomVipName, enterVipType
          const ownerName = item.ownerName || item.vipName || item.enterCustomVipName || '';
          const ownerPhone = item.ownerPhone || '';
          const vipTypeName = item.vipTypeName || item.enterVipType || item.vipName || item.enterCustomVipName || '';
          const ownerType = item.ownerType || item.ownerCategory || item.enterVipType || '';
          
          // 只有当至少有一个字段有值时才设置ownerInfo
          if (ownerName || ownerPhone || vipTypeName || ownerType) {
            vehicleMap[plate].ownerInfo = {
              ownerName,
              ownerPhone,
              vipTypeName,
              ownerType
            };
          }
        });

        exitRecords.forEach(item => {
          const plate = item.carLicenseNumber || item.plateNumber;
          if (!plate) return;
          
          if (!vehicleMap[plate]) {
            vehicleMap[plate] = {
              plateNumber: plate,
              carLicenseNumber: plate,
              entryCount: 0,
              exitCount: 0,
              totalCount: 0,
              ownerInfo: null,
              // 添加车牌颜色字段
              carColor: item.carColor || item.plateColor || item.exit_car_license_color || 
                        item.leave_car_license_color || item.leaveCarLicenseColor || 
                        item.enter_car_license_color || item.enterCarLicenseColor || '',
              plateColor: item.carColor || item.plateColor || item.exit_car_license_color || 
                          item.leave_car_license_color || item.leaveCarLicenseColor || 
                          item.enter_car_license_color || item.enterCarLicenseColor || ''
            };
          }
          vehicleMap[plate].exitCount++;
          vehicleMap[plate].totalCount++;
          
          // 更新车牌颜色（使用最新记录的颜色）
          const colorValue = item.carColor || item.plateColor || item.exit_car_license_color || 
                             item.leave_car_license_color || item.leaveCarLicenseColor || 
                             item.enter_car_license_color || item.enterCarLicenseColor || '';
          if (colorValue) {
            vehicleMap[plate].carColor = colorValue;
            vehicleMap[plate].plateColor = colorValue;
          }
          
          // 提取业主信息（如果出场记录中有，且之前没有业主信息）
          // 后端返回: vipName, leaveCustomVipName, leaveVipType
          if (!vehicleMap[plate].ownerInfo) {
            const ownerName = item.ownerName || item.vipName || item.leaveCustomVipName || '';
            const ownerPhone = item.ownerPhone || '';
            const vipTypeName = item.vipTypeName || item.leaveVipType || item.vipName || item.leaveCustomVipName || '';
            const ownerType = item.ownerType || item.ownerCategory || item.leaveVipType || '';
            
            // 只有当至少有一个字段有值时才设置ownerInfo
            if (ownerName || ownerPhone || vipTypeName || ownerType) {
              vehicleMap[plate].ownerInfo = {
                ownerName,
                ownerPhone,
                vipTypeName,
                ownerType
              };
            }
          }
        });

        // 转换为数组并排序
        let rankingData = Object.values(vehicleMap);
        rankingData.sort((a, b) => b.totalCount - a.totalCount);

        // 标记异常车辆（进出次数差异过大）
        rankingData.forEach(item => {
          const diff = Math.abs(item.entryCount - item.exitCount);
          item.abnormalFlag = diff > 5 || item.totalCount > 50;
        });

        this.rankingData = rankingData.slice(0, this.rankingLimit);
        
        console.log('✅ [车辆频次] 加载完成, 排行数量:', this.rankingData.length);
        console.log('✅ [车辆频次] 排行数据:', this.rankingData);
        
        // 🔍 调试：检查第一条排行数据的业主信息和车牌颜色
        if (this.rankingData.length > 0) {
          console.log('🔍 [排行数据] 第一条数据:', {
            车牌: this.rankingData[0].plateNumber,
            业主信息: this.rankingData[0].ownerInfo,
            车牌颜色: this.rankingData[0].carColor,
            plateColor: this.rankingData[0].plateColor
          });
        }
        
      } catch (error) {
        console.error('❌ [车辆频次] 加载失败:', error);
        this.rankingData = [];
      }
    },

    /**
     * 加载通道频次排行
     */
    async loadChannelFrequencyRanking(startDate, endDate) {
      try {
        // 获取进场记录
        const entryResponse = await axios.get('http://localhost:8675/parking/vehicle-records/report_car_in', {
          params: { startDate, endDate, page: 1, size: 100000 }
        });
        console.log('🔄 [通道频次] 获取进场记录:', entryResponse.data);
        // 获取出场记录
        const exitResponse = await axios.get('http://localhost:8675/parking/vehicle-records/report_car_out', {
          params: { startDate, endDate, page: 1, size: 100000 }
        });
        console.log('🔄 [通道频次] 获取出场记录:', exitResponse);
        const entryRecords = entryResponse.data?.data?.records || [];
        const exitRecords = exitResponse.data?.data?.records || [];

        // 按通道统计
        const channelMap = {};
        
        entryRecords.forEach(item => {
          const channel = item.enterChannelName || item.channel || '未知通道';
          
          if (!channelMap[channel]) {
            channelMap[channel] = {
              channelName: channel,
              channel: channel,
              entryCount: 0,
              exitCount: 0,
              totalCount: 0
            };
          }
          channelMap[channel].entryCount++;
          channelMap[channel].totalCount++;
        });

        exitRecords.forEach(item => {
          const channel = item.leaveChannelName || item.channel || '未知通道';
          
          if (!channelMap[channel]) {
            channelMap[channel] = {
              channelName: channel,
              channel: channel,
              entryCount: 0,
              exitCount: 0,
              totalCount: 0
            };
          }
          channelMap[channel].exitCount++;
          channelMap[channel].totalCount++;
        });

        // 转换为数组并排序
        let rankingData = Object.values(channelMap);
        rankingData.sort((a, b) => b.totalCount - a.totalCount);

        this.rankingData = rankingData.slice(0, this.rankingLimit);
        
        console.log('✅ [通道频次] 加载完成, 排行数量:', this.rankingData.length);
        
      } catch (error) {
        console.error('❌ [通道频次] 加载失败:', error);
        this.rankingData = [];
      }
    },

    /**
     * 查看违规详情
     */
    showViolationDetail(item) {
      console.log('🔍 [违规详情] 车牌:', item.plateNumber || item.carLicenseNumber);
      // 关闭排行榜弹窗
      this.closeRankingModal();
      
      // 重置所有筛选条件
      this.resetDetailFilters();
      
      // 设置车牌号筛选条件（只显示该车牌的违规记录）
      this.detailFilters.plateNumber = item.plateNumber || item.carLicenseNumber;
      
      // 打开违规详情弹窗（保留车牌号筛选）
      this.openDetailModal('violation', true);
    },

    /**
     * 查看频次详情
     */
    showFrequencyDetail(item) {
      console.log('🔍 [频次详情]', item);
      
      // 保存当前选择的车辆信息
      this.selectedVehicleForDetail = item;
      
      // 显示选择弹窗
      this.showRecordTypeSelector = true;
    },
    
    /**
     * 选择查看进场或出场记录
     */
    selectRecordType(type) {
      const plateNumber = this.selectedVehicleForDetail.plateNumber || this.selectedVehicleForDetail.carLicenseNumber;
      console.log('✅ [记录类型选择]', type, '车牌:', plateNumber);
      
      // 关闭选择弹窗
      this.showRecordTypeSelector = false;
      
      // 关闭排行榜弹窗
      this.closeRankingModal();
      
      // 先设置车牌号筛选，再打开弹窗（preserveFilters=true保留车牌筛选）
      this.detailFilters.plateNumber = plateNumber;
      console.log('🔍 [频次详情] 设置车牌筛选:', plateNumber);
      
      // 根据类型打开对应的详情页面（传入preserveFilters=true保留车牌筛选）
      if (type === 'entry') {
        this.openDetailModal('vehicle-entry', true);
      } else if (type === 'exit') {
        this.openDetailModal('vehicle-exit', true);
      }
      
      // 清空选择的车辆
      this.selectedVehicleForDetail = null;
    },
    
    /**
     * 取消选择
     */
    cancelRecordTypeSelection() {
      this.showRecordTypeSelector = false;
      this.selectedVehicleForDetail = null;
    },

    /**
     * 查看通道详情
     */
    showChannelDetail(item) {
      console.log('🔍 [通道详情]', item);
      // 可以打开详情弹窗显示该通道的所有车辆记录
      alert(`通道 ${item.channelName} 的详细流量分析功能待实现`);
    },

    /**
     * 格式化时间显示 - 只显示时分秒
     */
    formatTime(timeStr) {
      if (!timeStr) return '--';

      try {
        const date = new Date(timeStr);
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        const seconds = String(date.getSeconds()).padStart(2, '0');

        return `${hours}:${minutes}:${seconds}`;
      } catch (e) {
        console.error('❌ formatTime 错误:', e, timeStr);
        return timeStr;
      }
    },

    /**
     * 显示所有照片
     */
    showAllPhotos(photos) {
      if (!photos || photos.length === 0) return;

      // 创建一个简单的弹窗展示所有照片
      const message = `共 ${photos.length} 张照片，点击确定在新标签页中查看所有照片`;
      if (confirm(message)) {
        // 在新标签页中打开每张照片（可能会被浏览器拦截）
        photos.forEach((photo, index) => {
          setTimeout(() => {
            window.open(photo, '_blank');
          }, index * 100); // 延迟100ms打开，避免被拦截
        });
      }
    },

    /**
     * 获取表单类型颜色类
     */
    getFormTypeClass(formName) {
      if (!formName) return '';

      // 根据表单名称返回不同的颜色类
      const formTypeColors = {
        '走读学生': 'form-type-blue',
        '教职员舍楼楼': 'form-type-purple',
        '校友预约': 'form-type-indigo',
        '基建处车辆': 'form-type-green',
        '体育馆自助访客': 'form-type-teal',
        '体育馆访客车辆': 'form-type-cyan',
        '个人访客车辆': 'form-type-orange',
        '公务平访客车辆': 'form-type-amber',
        '博物馆访客': 'form-type-pink',
        '兴林宾馆访客': 'form-type-red'
      };

      // 精确匹配
      if (formTypeColors[formName]) {
        return formTypeColors[formName];
      }

      // 模糊匹配
      for (const [key, value] of Object.entries(formTypeColors)) {
        if (formName.includes(key) || key.includes(formName)) {
          return value;
        }
      }

      // 默认返回随机但固定的颜色（基于字符串哈希）
      const colors = ['form-type-blue', 'form-type-purple', 'form-type-indigo', 'form-type-green',
        'form-type-teal', 'form-type-cyan', 'form-type-orange', 'form-type-amber',
        'form-type-pink', 'form-type-red'];
      const hash = formName.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
      return colors[hash % colors.length];
    },

  },

  // 监听数据变化
  watch: {
    // 监听Tab时间范围变化（左侧按钮）- 控制当前页面数据
    tabTimeRange: {
      handler(newVal) {
        console.log('⏰ [Tab时间范围切换]', newVal);
        this.loadStatisticsData();
        this.loadFaceHeatmapData();
      }
    },
    
    // 🔥 监听出场记录通道类型变化
    'detailFilters.channelType': {
      handler(newVal, oldVal) {
        if (this.detailType === 'vehicle-exit' && newVal !== oldVal) {
          console.log('🔄 [通道类型切换] 从', oldVal, '切换到', newVal);
          // 清空当前通道选择
          this.detailFilters.channel = '';
          // 重新加载通道选项（因为需要根据类型显示不同的通道）
          this.loadAvailableChannels();
        }
      },
      immediate: false
    },
    vehicleRecords: {
      handler(newRecords) {
        if (newRecords && newRecords.length > 0) {
          // console.log(`📊 车辆记录数据更新: ${newRecords.length} 条记录`);

          // 如果弹窗正在显示，立即更新通道数据
          if (this.showChannelModal) {
            // console.log('🔄 弹窗显示中，立即更新通道数据');
            this.updateAllChannelData();
          }
          
          // 数据更新后重新测量内容高度，确保滚动正常
          this.$nextTick(() => {
            this.measureContentHeights();
          });
        }
      },
      deep: true,
      immediate: true
    },
    personRecords: {
      handler(newRecords) {
        if (newRecords && newRecords.length > 0) {
          // 数据更新后重新测量内容高度，确保滚动正常
          this.$nextTick(() => {
            this.measureContentHeights();
          });
        }
      },
      deep: true,
      immediate: true
    },
    displayedVehicleRecords: {
      handler(newRecords) {
        // 显示的记录变化时，重新测量内容高度并确保滚动正在运行
        this.$nextTick(() => {
          this.measureContentHeights();
          // 如果有数据但滚动未启动，启动滚动
          if (newRecords && newRecords.length > 0 && !this.vehicleAutoScrollTimer) {
            this.startVehicleAutoScroll();
          }
        });
      }
    },
    displayedPersonRecords: {
      handler(newRecords) {
        // 显示的记录变化时，重新测量内容高度并确保滚动正在运行
        this.$nextTick(() => {
          this.measureContentHeights();
          // 如果有数据但滚动未启动，启动滚动
          if (newRecords && newRecords.length > 0 && !this.faceAutoScrollTimer) {
            this.startFaceAutoScroll();
          }
        });
      }
    }
  }
}
</script>

<style lang="scss" scoped>
.camera-monitor {
  width: 100%;
  height: 100%; // 降低整体高度，从130%改为100%
  background: linear-gradient(135deg, #0f172a 0%, #1e293b 100%);
  color: #e2e8f0;
  font-family: 'Microsoft YaHei', sans-serif;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  padding: 10px 10px 0 10px;
  box-sizing: border-box;
}

// 顶部统计
.top-stats {
  display: flex;
  gap: 20px;
  margin-bottom: 15px; // 减少底部边距
  height: 60px; // 降低高度，从80px改为60px

  .stat-card {
    flex: 1;
    background: rgba(11, 19, 42, 0.6);
    border: 1px solid #1e40af;
    border-radius: 12px;
    padding: 12px; // 减少内边距，从20px改为12px
    display: flex;
    align-items: center;
    gap: 10px; // 减少间距，从15px改为10px
    transition: all 0.3s ease;

    &:hover {
      background: rgba(11, 19, 42, 0.8);
      border-color: #3b82f6;
      transform: translateY(-2px);
    }

    .stat-icon {
      font-size: 24px; // 减小图标大小，从32px改为24px
      opacity: 0.8;
    }

    .stat-content {
      .stat-value {
        font-size: 20px; // 减小字体大小，从28px改为20px
        font-weight: bold;
        color: #3b82f6;
        margin-bottom: 3px; // 减少底部边距，从5px改为3px
      }

      .stat-label {
        font-size: 14px;
        color: #94a3b8;
      }
    }
  }
}

// KPI样式（复用 index 页面风格，使整体上移紧贴）
.kpi-section {
  display: flex;
  justify-content: center;
  gap: 20px;
  padding: 0 10px 10px 10px;
  background: transparent;

  .kpi-card {
    flex: 1;
    max-width: 200px;
    background: rgba(11, 19, 42, 0.9);
    border: 1px solid #1e3a8a;
    border-radius: 8px;
    padding: 12px 10px;
    text-align: center;
    transition: all 0.3s ease;

    .kpi-header {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      margin-bottom: 10px;

      .kpi-icon {
        font-size: 16px;
      }

      .kpi-title {
        font-size: 10px;
        color: #94a3b8;
        font-weight: 500;
      }
    }

    .kpi-value {
      font-size: 22px;
      font-weight: bold;
      color: #3b82f6;
      margin-bottom: 4px;
    }

    .kpi-unit {
      font-size: 10px;
      color: #64748b;
      font-weight: 500;
    }

    .kpi-subtitle {
      font-size: 10px;
      color: #10b981;
      margin-top: 4px;
      font-weight: 500;
      opacity: 0.9;
    }
  }
}

// 时间选择器样式 - 增强科技感
.time-selector {
  margin-bottom: 20px;
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 20px;

  .time-options {
    display: flex;
    gap: 3px;
    background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
    padding: 4px;
    border-radius: 8px;
    border: 1px solid rgba(59, 130, 246, 0.4);
    box-shadow:
      0 6px 24px rgba(0, 0, 0, 0.3),
      inset 0 1px 0 rgba(255, 255, 255, 0.1);
    backdrop-filter: blur(10px);

    .time-btn {
      padding: 6px 10px;
      background: transparent;
      border: none;
      color: #94a3b8;
      font-size: 10px;
      font-weight: 600;
      border-radius: 4px;
      cursor: pointer;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        top: 0;
        left: -100%;
        width: 100%;
        height: 100%;
        background: linear-gradient(90deg, transparent, rgba(59, 130, 246, 0.2), transparent);
        transition: left 0.5s ease;
      }

      &:hover {
        color: #3b82f6;
        background: rgba(59, 130, 246, 0.15);
        transform: translateY(-1px);
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);

        &::before {
          left: 100%;
        }
      }

      &.active {
        background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
        color: white;
        box-shadow:
          0 4px 16px rgba(59, 130, 246, 0.4),
          0 0 20px rgba(59, 130, 246, 0.3);
        transform: translateY(-1px);
      }
    }
  }
  
  // 时间范围选择器（select下拉框）
  .time-range-selector {
    .time-select {
      padding: 6px 14px;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.95) 0%, rgba(30, 41, 59, 0.9) 100%);
      border: 1px solid rgba(59, 130, 246, 0.4);
      border-radius: 8px;
      color: #94a3b8;
      font-size: 12px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
      outline: none;
      
      &:hover {
        border-color: #3b82f6;
        color: #3b82f6;
        box-shadow: 0 4px 12px rgba(59, 130, 246, 0.3);
      }
      
      &:focus {
        border-color: #3b82f6;
        box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
      }
    }
  }

  // 数据分析菜单
  .analysis-menu {
    position: relative;

    .analysis-btn {
      display: flex;
      align-items: center;
      gap: 6px;
      padding: 6px 14px;
      background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.08) 100%);
      border: 1px solid rgba(139, 92, 246, 0.4);
      border-radius: 8px;
      color: #c4b5fd;
      font-size: 11px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);

      .btn-icon {
        font-size: 14px;
        filter: drop-shadow(0 0 4px rgba(139, 92, 246, 0.6));
      }

      .arrow {
        font-size: 10px;
        transition: transform 0.3s ease;

        &.arrow-up {
          transform: rotate(180deg);
        }
      }

      &:hover {
        background: linear-gradient(135deg, rgba(139, 92, 246, 0.25) 0%, rgba(139, 92, 246, 0.15) 100%);
        border-color: rgba(139, 92, 246, 0.6);
        transform: translateY(-2px);
        box-shadow: 0 4px 12px rgba(139, 92, 246, 0.3);
      }
    }

    .analysis-dropdown {
      position: absolute;
      top: calc(100% + 8px);
      right: 0;
      min-width: 180px;
      background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%);
      border: 1px solid rgba(139, 92, 246, 0.4);
      border-radius: 8px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(10px);
      z-index: 1000;
      overflow: hidden;

      .menu-item {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 16px;
        color: #cbd5e1;
        font-size: 12px;
        font-weight: 500;
        cursor: pointer;
        transition: all 0.3s ease;
        border-bottom: 1px solid rgba(139, 92, 246, 0.1);

        &:last-child {
          border-bottom: none;
        }

        .item-icon {
          font-size: 16px;
          filter: drop-shadow(0 0 4px rgba(139, 92, 246, 0.5));
        }

        &:hover {
          background: rgba(139, 92, 246, 0.15);
          color: #e9d5ff;
          padding-left: 20px;

          .item-icon {
            filter: drop-shadow(0 0 8px rgba(139, 92, 246, 0.8));
            transform: scale(1.1);
          }
        }
      }
    }
  }
}

// 下拉菜单过渡动画
.dropdown-enter-active,
.dropdown-leave-active {
  transition: all 0.3s ease;
}

.dropdown-enter-from,
.dropdown-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

// 统一KPI区域样式 - 科技感增强
.unified-kpi-section {
  display: flex;
  gap: 8px;
  margin-bottom: 20px;
  flex-wrap: nowrap;
  justify-content: space-between;

  .vehicle-kpi-card {
    flex: 1;
    min-width: 80px;
    max-width: 120px;
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 8px;
    padding: 8px 4px;
    text-align: center;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #3b82f6, #60a5fa, #3b82f6);
      background-size: 200% 100%;
      animation: shimmer 2s infinite;
    }

    &::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(59, 130, 246, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      transform: translateY(-2px) scale(1.01);
      box-shadow:
        0 8px 25px rgba(59, 130, 246, 0.2),
        0 0 20px rgba(59, 130, 246, 0.1);
      border-color: rgba(59, 130, 246, 0.6);

      &::after {
        opacity: 1;
      }
    }

    .kpi-header {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 6px;
      gap: 4px;

      .kpi-icon {
        font-size: 14px;
        filter: drop-shadow(0 0 4px rgba(59, 130, 246, 0.6));
        animation: pulse 2s infinite;
      }

      .kpi-title {
        font-size: 10px;
        font-weight: 700;
        color: #3b82f6;
        text-shadow: 0 0 6px rgba(59, 130, 246, 0.4);
        letter-spacing: 0.1px;
        line-height: 1.0;
      }
    }

    .kpi-value {
      font-size: 18px;
      font-weight: 900;
      color: #3b82f6;
      margin-bottom: 3px;
      text-shadow: 0 0 8px rgba(59, 130, 246, 0.5);
      background: linear-gradient(135deg, #3b82f6, #60a5fa);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1.0;
      letter-spacing: -0.5px;
    }

    .kpi-unit {
      font-size: 8px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }

    // KPI卡片快捷链接
    .kpi-quick-link {
      position: absolute;
      bottom: 2px;
      left: 50%;
      transform: translateX(-50%);
      font-size: 9px;
      color: #3b82f6;
      opacity: 0;
      transition: all 0.3s ease;
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 2px;
      padding: 2px 6px;
      border-radius: 10px;
      background: rgba(59, 130, 246, 0.1);
      white-space: nowrap;

      .link-icon {
        font-size: 10px;
      }

      .link-text {
        font-weight: 600;
        font-size: 8px;
      }

      &:hover {
        background: rgba(59, 130, 246, 0.2);
        color: #60a5fa;
        transform: translateX(-50%) scale(1.05);
      }
    }

    &:hover .kpi-quick-link {
      opacity: 1;
      bottom: 4px;
    }
  }

  // 人脸KPI卡片样式（在统一区域中）
  .face-kpi-card {
    flex: 1;
    min-width: 80px;
    max-width: 120px;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.12) 0%, rgba(16, 185, 129, 0.06) 100%);
    border: 1px solid rgba(16, 185, 129, 0.4);
    border-radius: 8px;
    padding: 8px 4px;
    text-align: center;
    transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    position: relative;
    overflow: hidden;
    backdrop-filter: blur(10px);

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 2px;
      background: linear-gradient(90deg, #10b981, #34d399, #10b981);
      background-size: 200% 100%;
      animation: shimmer 2s infinite;
    }

    &::after {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(16, 185, 129, 0.1) 0%, transparent 70%);
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    &:hover {
      transform: translateY(-2px) scale(1.01);
      box-shadow:
        0 8px 25px rgba(16, 185, 129, 0.2),
        0 0 20px rgba(16, 185, 129, 0.1);
      border-color: rgba(16, 185, 129, 0.6);

      &::after {
        opacity: 1;
      }
    }

    .kpi-header {
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 6px;
      gap: 4px;

      .kpi-icon {
        font-size: 14px;
        filter: drop-shadow(0 0 4px rgba(16, 185, 129, 0.6));
        animation: pulse 2s infinite;
      }

      .kpi-title {
        font-size: 10px;
        font-weight: 700;
        color: #10b981;
        text-shadow: 0 0 6px rgba(16, 185, 129, 0.4);
        letter-spacing: 0.1px;
        line-height: 1.0;
      }
    }

    .kpi-value {
      font-size: 18px;
      font-weight: 900;
      color: #10b981;
      margin-bottom: 3px;
      text-shadow: 0 0 8px rgba(16, 185, 129, 0.5);
      background: linear-gradient(135deg, #10b981, #34d399);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      line-height: 1.0;
      letter-spacing: -0.5px;
    }

    .kpi-unit {
      font-size: 9px;
      color: #64748b;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.4px;
    }
  }

  /* 车辆KPI特定颜色 */
  .vehicle-entry .kpi-value {
    color: #3b82f6 !important;
    background: linear-gradient(135deg, #3b82f6, #60a5fa) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
  }

  .vehicle-exit .kpi-value {
    color: #10b981 !important;
    background: linear-gradient(135deg, #10b981, #34d399) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
  }

  .vehicle-on-site .kpi-value {
    color: #f59e0b !important;
    background: linear-gradient(135deg, #f59e0b, #fbbf24) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
  }

  .vehicle-violation .kpi-value {
    color: #ef4444 !important;
    background: linear-gradient(135deg, #ef4444, #f87171) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
  }

  /* 人脸KPI特定颜色 */
  .face-entry .kpi-value {
    color: #f97316 !important;
    background: linear-gradient(135deg, #f97316, #fb923c) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
  }

  .face-exit .kpi-value {
    color: #ef4444 !important;
    background: linear-gradient(135deg, #ef4444, #f87171) !important;
    -webkit-background-clip: text !important;
    -webkit-text-fill-color: transparent !important;
    background-clip: text !important;
  }
}

@keyframes shimmer {
  0% {
    background-position: -200% 0;
  }

  100% {
    background-position: 200% 0;
  }
}

@keyframes pulse {

  0%,
  100% {
    transform: scale(1);
  }

  50% {
    transform: scale(1.1);
  }
}


// 通道照片区域
.camera-section {
  flex: 1;
  display: flex;
  gap: 20px;
  min-height: 0;
}

// 车辆和人脸照片区域
.vehicle-camera-section,
.face-camera-section {
  flex: 1;
  background: rgba(11, 19, 42, 0.3);
  // border: 1px solid #1e40af;
  border-radius: 8px;
  padding: 5px;
  display: flex;
  height: 300px;
  flex-direction: column;
}

.section-header {
  margin-bottom: 5px;
}

.section-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.title-icon {
  font-size: 16px;
}

.title-text {
  color: #94a3b8;
}

.camera-grid {
  flex: 1;
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 15px;
  min-height: 0;
  justify-items: center;
  align-items: center;

  .camera-item {
    background: rgba(11, 19, 42, 0.6);
    // border: 1px solid #1e40af;
    border-radius: 8px;
    padding: 10px;
    display: flex;
    flex-direction: column;
    transition: all 0.3s ease;
    width: 100%;
    max-width: 300px;
    justify-self: center;
    align-self: center;

    &:hover {
      background: rgba(11, 19, 42, 0.8);
      border-color: #3b82f6;
      transform: scale(1.02);
    }

    &.active {
      border-color: #10b981;
      box-shadow: 0 0 15px rgba(16, 185, 129, 0.3);
    }

    .camera-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 8px;
      gap: 10px;

      .channel-info {
        font-size: 12px;
        color: #3b82f6;
        font-weight: bold;
        flex: 1;

        .channel-badge {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 10px;
          font-size: 12px;
          font-weight: bold;
          border: 1px solid transparent;
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
        }

        .channel-badge.entry {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border-color: rgba(16, 185, 129, 0.4);
        }

        .channel-badge.exit {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border-color: rgba(245, 158, 11, 0.4);
        }
      }

      .plate-info,
      .person-info {
        font-size: 12px;
        color: #fbbf24;
        font-weight: bold;
        flex: 1;
        text-align: center;

        .plate-number {
          display: inline-block;
          padding: 4px 10px;
          border-radius: 4px;
          font-weight: bold;
          font-size: 12px;
          font-family: "微软雅黑", "Microsoft YaHei", sans-serif;
          letter-spacing: 0.5px;
          min-width: 80px;
          max-width: 110px;
          text-align: center;
          transition: all 0.3s ease;
          white-space: nowrap;
          overflow: hidden;
          text-overflow: ellipsis;
        }

      }

      .timestamp {
        font-size: 10px;
        color: #94a3b8;
      }
    }

    .camera-image {
      flex: 1;
      position: relative;
      margin-bottom: 8px;
      border-radius: 4px;
      overflow: hidden;

      img {
        width: 100%;
        height: 100%;
        object-fit: contain; // 保持图片比例，完整显示不被裁剪
        background-color: rgba(0, 0, 0, 0.1); // 添加背景色，避免空白区域
      }

    }

    .camera-details {
      .vehicle-type {
        font-size: 10px;
        color: #94a3b8;
        margin-bottom: 8px;
      }

      .camera-actions {
        display: flex;
        gap: 3px;

        .action-btn {
          flex: 1;
          background: rgba(11, 19, 42, 0.8);
          border: 1px solid #1e40af;
          color: #e2e8f0;
          padding: 3px 6px;
          border-radius: 3px;
          cursor: pointer;
          font-size: 8px;
          transition: all 0.3s ease;

          &:hover {
            background: rgba(59, 130, 246, 0.2);
            border-color: #3b82f6;
          }

          &.open-gate:hover {
            background: rgba(16, 185, 129, 0.2);
            border-color: #10b981;
          }

          &.close-gate:hover {
            background: rgba(239, 68, 68, 0.2);
            border-color: #ef4444;
          }
        }
      }
    }
  }
}

// 实时数据滚动区域
.realtime-data-section {
  background: rgba(11, 19, 42, 0.4);
  border: 1px solid #1e40af;
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 20px;
  height: 200px;
  overflow: hidden;
}

.data-header {
  margin-bottom: 15px;
}

.data-title {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
  font-weight: 600;
  color: #e2e8f0;
}

.data-scroll-container {
  height: 150px;
  overflow: hidden;
  position: relative;
}

.data-scroll-content {
  display: flex;
  flex-direction: column;
  gap: 8px;
  animation: scrollUp 20s linear infinite;

  &.scrolling {
    animation-play-state: running;
  }
}

.data-item {
  display: flex;
  align-items: center;
  gap: 12px;
  background: rgba(11, 19, 42, 0.6);
  border: 1px solid #1e40af;
  border-radius: 6px;
  padding: 8px 12px;
  transition: all 0.3s ease;

  &.vehicle {
    border-left: 3px solid #3b82f6;
  }

  &.face {
    border-left: 3px solid #f97316;
  }

  &:hover {
    background: rgba(11, 19, 42, 0.8);
    transform: translateX(5px);
  }
}

.data-type-icon {
  font-size: 16px;
  width: 20px;
  text-align: center;
}

.data-content {
  flex: 1;
  display: grid;
  grid-template-columns: 1fr 1fr 1fr 1fr;
  gap: 10px;
  align-items: center;
}

.data-name {
  font-weight: 600;
  color: #e2e8f0;
  font-size: 12px;
}

.data-channel {
  color: #94a3b8;
  font-size: 11px;
}

.data-status {
  font-size: 11px;
  padding: 2px 6px;
  border-radius: 3px;
  text-align: center;

  &.entry {
    background: rgba(16, 185, 129, 0.2);
    color: #10b981;
  }

  &.exit {
    background: rgba(239, 68, 68, 0.2);
    color: #ef4444;
  }
}

.data-time {
  color: #64748b;
  font-size: 10px;
  text-align: right;
}

@keyframes scrollUp {
  0% {
    transform: translateY(0);
  }

  100% {
    transform: translateY(-100%);
  }
}

// 单张相机照片样式
.camera-single {
  flex: 1;
  background: rgba(11, 19, 42, 0.6);
  border: 1px solid #1e40af;
  border-radius: 2px;
  padding: 0; // 去除padding，让内容贴边
  display: flex;
  flex-direction: column;
  transition: all 0.3s ease;
  height: 120px; // 进一步降低高度，与照片内容更贴合

  &:hover {
    background: rgba(11, 19, 42, 0.8);
    border-color: #3b82f6;
    transform: scale(1.02);
  }

  .camera-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 0px;
    padding: 2px 6px; // 减少padding，让头部更紧凑
    border-bottom: none;
    height: 28px; // 降低头部高度，与照片内容更贴合
    gap: 10px;

    .channel-info {
      font-size: 12px; // 调整字体大小以适应新的高度
      flex: 1;
      color: #3b82f6;
      font-weight: 600;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .plate-info,
    .person-info {
      font-size: 12px;
      color: #fbbf24;
      font-weight: bold;
      flex: 1;
      text-align: center;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .timestamp {
      font-size: 12px; // 调整字体大小以适应新的高度
      color: #94a3b8;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
  }

  .camera-image {
    position: relative;
    flex: 1;
    display: flex;
    height: calc(100% - 28px); // 减去头部高度，填满剩余空间
    align-items: flex-start; // 改为顶部对齐，让照片向上贴住
    justify-content: center;
    margin-top: 0; // 去除顶部边距

    img {
      width: 100%;
      max-width: 500px;
      height: 100%; // 填满整个容器高度
      object-fit: contain; // 保持图片比例，完整显示不被裁剪
      border-radius: 1px;
      border: 1px solid rgba(59, 130, 246, 0.3);
      background-color: rgba(0, 0, 0, 0.1); // 添加背景色，避免空白区域
    }
    
    // 车辆占位符样式
    .vehicle-placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.03);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 1px;
      cursor: pointer;
      
      .loading-animation {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 12px;
        color: rgba(255, 255, 255, 0.6);
        
        .spinner {
          width: 32px;
          height: 32px;
          border: 3px solid rgba(59, 130, 246, 0.2);
          border-top: 3px solid #3b82f6;
          border-radius: 50%;
          animation: spin 1s linear infinite;
        }
        
        span {
          font-size: 13px;
          font-weight: 500;
        }
      }
      
      &:hover {
        background: rgba(255, 255, 255, 0.05);
      }
    }

  }

  /* 顶部单张相机头部内的徽标与车牌样式（与网格卡片一致） */
  .camera-header {
    .channel-info {
      .channel-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 12px;
        font-weight: bold;
        border: 1px solid transparent;
        background: rgba(59, 130, 246, 0.15);
        color: #3b82f6;
      }

      .channel-badge.entry {
        background: rgba(16, 185, 129, 0.15);
        color: #10b981;
        border-color: rgba(16, 185, 129, 0.4);
      }

      .channel-badge.exit {
        background: rgba(245, 158, 11, 0.15);
        color: #f59e0b;
        border-color: rgba(245, 158, 11, 0.4);
      }
    }

    .plate-info {
      .plate-number {
        display: inline-block;
        padding: 4px 10px;
        border-radius: 4px;
        font-weight: bold;
        font-size: 12px;
        font-family: "微软雅黑", "Microsoft YaHei", sans-serif;
        letter-spacing: 0.5px;
        min-width: 80px;
        max-width: 110px;
        text-align: center;
        transition: all 0.3s ease;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;
      }

    }
  }
}

// 表格容器样式
.tables-container {
  display: flex;
  gap: 8px; // 从20px减少到8px，缩小表格间距
  margin-bottom: 20px;
  width: 100%; // 确保容器占满宽度
  padding: 0 5px; // 添加少量内边距，避免表格贴边
  box-sizing: border-box; // 确保内边距不影响总宽度
}

// 数据表格样式
.vehicle-data-table,
.face-data-table {
  flex: 1.1; // 从1增加到1.1，增加10%宽度
  background: rgba(11, 19, 42, 0.6);
  border: 1px solid #1e40af;
  border-radius: 8px;
  overflow: hidden;
  height: 220px; // 调整为220px，比之前的260px更低
  display: flex;
  flex-direction: column;

  // 车牌号码样式
  .plate-number {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 4px;
    font-weight: bold;
    font-size: 12px;
    font-family: "微软雅黑", "Microsoft YaHei", sans-serif;
    letter-spacing: 0.5px;
    min-width: 80px;
    max-width: 110px;
    text-align: center;
    transition: all 0.3s ease;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;

    &:hover {
      transform: translateY(-1px);
      box-shadow: 0 3px 8px rgba(0, 0, 0, 0.15);
    }
  }

  .table-header {
    display: flex;
    background: rgba(59, 130, 246, 0.2);
    border-bottom: 1px solid #3b82f6;

    .header-cell {
      flex: 1;
      padding: 10px 8px;
      font-size: 12px;
      color: #ffffff;
      text-align: center;
      font-weight: bold;
      border-right: 1px solid rgba(59, 130, 246, 0.3);

      &:last-child {
        border-right: none;
      }
    }
  }
  
  // 车辆表格header特定设置
  .vehicle-data-table .table-header {
    .header-cell {
      // 车牌号 (第1列)
      &:nth-child(1) {
        flex: 1.4;
        min-width: 120px;
      }

      // 通道名称 (第2列)
      &:nth-child(2) {
        flex: 1.2;
        min-width: 90px;
      }

      // VIP类型 (第3列)
      &:nth-child(3) {
        flex: 1.6;
        min-width: 110px;
      }

      // 时间 (第4列)
      &:nth-child(4) {
        flex: 1.5;
        min-width: 130px;
      }
    }
  }
  
  // 人脸表格header特定设置
  .face-data-table .table-header {
    .header-cell {
      // 姓名 (第1列)
      &:nth-child(1) {
        flex: 1;
        min-width: 80px;
      }

      // 通道名称 (第2列)
      &:nth-child(2) {
        flex: 1.2;
        min-width: 90px;
      }

      // 识别状态 (第3列)
      &:nth-child(3) {
        flex: 1;
        min-width: 90px;
      }

      // 时间 (第4列)
      &:nth-child(4) {
        flex: 1.5;
        min-width: 130px;
      }
    }
  }

  .table-body {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    scrollbar-gutter: stable;
    -ms-overflow-style: none;
    scrollbar-width: none;

    &::-webkit-scrollbar {
      width: 0;
      height: 0;
    }

    .table-loading {
      display: flex;
      flex-direction: column;
      gap: 8px;
      padding: 10px 8px;
      height: 100%;
      justify-content: center;
    }

    .skeleton-row {
      display: grid;
      grid-template-columns: 1fr 1fr 1fr 1fr;
      gap: 10px;
      align-items: center;
    }

    .skeleton-cell {
      height: 14px;
      border-radius: 4px;
      background: linear-gradient(90deg, rgba(148, 163, 184, 0.15), rgba(148, 163, 184, 0.3), rgba(148, 163, 184, 0.15));
      background-size: 200% 100%;
      animation: skeletonPulse 1.2s ease-in-out infinite;
    }

    .skeleton-cell.w-10 {
      width: 40px;
    }

    .skeleton-cell.w-14 {
      width: 56px;
    }

    .skeleton-cell.w-16 {
      width: 64px;
    }

    .skeleton-cell.w-18 {
      width: 72px;
    }

    .skeleton-cell.w-20 {
      width: 80px;
    }

    .skeleton-cell.w-24 {
      width: 96px;
    }

    .table-row {
      display: flex;
      border-bottom: 1px solid rgba(100, 116, 139, 0.2);
      transition: all 0.3s ease;

      &:hover {
        background: rgba(59, 130, 246, 0.1);
      }

      &.new-record {
        background: rgba(16, 185, 129, 0.1);
        animation: highlight 2s ease-out;
      }

      .table-cell {
        flex: 1;
        padding: 8px 6px;
        font-size: 12px;
        color: #e2e8f0;
        text-align: center;
        border-right: 1px solid rgba(100, 116, 139, 0.1);
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        // 人脸表格 - 姓名列
        &.name {
          flex: 1;
          min-width: 80px;
        }

        // 识别状态列
        &.status {
          flex: 1;
          min-width: 90px;
        }

        // 车牌号码列设置 - 与header第1列一致
        &.license {
          flex: 1.4;
          min-width: 120px;
          font-size: 11px;
        }
        
        // 通道列 - 与header第2列一致
        &.channel {
          flex: 1.2;
          min-width: 90px;
        }

        // VIP类型列 - 与header第3列一致
        &.vip-type {
          flex: 1.6;
          min-width: 110px;
        }

        // 时间列 - 与header第4列一致
        &.time {
          flex: 1.5;
          min-width: 130px;
          text-align: center;
          color: #e2e8f0;
          display: flex;
          flex-direction: column;
          justify-content: center;
          align-items: center;
          gap: 2px;
          padding: 6px 4px;
          
          .time-date {
            font-size: 10px;
            opacity: 0.8;
          }
          
          .time-clock {
            font-size: 11px;
            font-weight: 600;
          }
        }

        &:last-child {
          border-right: none;
        }

        &.license,
        &.name {
          color: #fbbf24;
          font-weight: bold;
        }

        &.channel {
          &.entry {
            color: #10b981;
          }

          &.exit {
            color: #f59e0b;
          }
        }

        &.time {
          &.entry {
            color: #10b981;
          }

          &.exit {
            color: #f59e0b;
          }
        }
      }

      .status .badge {
        display: inline-block;
        padding: 2px 6px;
        border-radius: 10px;
        font-size: 10px;
        font-weight: bold;

        &.entry {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.4);
        }

        &.exit {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.4);
        }
      }

      .vip-type .vip-badge {
        display: inline-block;
        padding: 2px 8px;
        border-radius: 10px;
        font-size: 9px;
        font-weight: bold;
        max-width: 200px;
        white-space: nowrap;
        overflow: hidden;
        text-overflow: ellipsis;

        // 保障车辆类
        &[class*="保障车辆"] {
          background: rgba(16, 185, 129, 0.15);
          color: #10b981;
          border: 1px solid rgba(16, 185, 129, 0.4);
        }

        // 教职工类
        &[class*="教职工"] {
          background: rgba(59, 130, 246, 0.15);
          color: #3b82f6;
          border: 1px solid rgba(59, 130, 246, 0.4);
        }

        // VIP类
        &[class*="超级VIP"] {
          background: rgba(236, 72, 153, 0.15);
          color: #ec4899;
          border: 1px solid rgba(236, 72, 153, 0.4);
        }

        // 公务车辆类
        &[class*="公务车辆"] {
          background: rgba(168, 85, 247, 0.15);
          color: #a855f7;
          border: 1px solid rgba(168, 85, 247, 0.4);
        }

        // 施工车辆类
        &[class*="施工车辆"] {
          background: rgba(245, 158, 11, 0.15);
          color: #f59e0b;
          border: 1px solid rgba(245, 158, 11, 0.4);
        }

        // 新能源车辆
        &.新能源 {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.4);
        }

        // 油车
        &.油车 {
          background: rgba(107, 114, 128, 0.15);
          color: #6b7280;
          border: 1px solid rgba(107, 114, 128, 0.4);
        }

        // 居民车辆类
        &[class*="居民车辆"] {
          background: rgba(34, 197, 94, 0.15);
          color: #22c55e;
          border: 1px solid rgba(34, 197, 94, 0.4);
        }

        // 外聘类
        &[class*="外聘"] {
          background: rgba(239, 68, 68, 0.15);
          color: #ef4444;
          border: 1px solid rgba(239, 68, 68, 0.4);
        }

        // 合作车辆类
        &[class*="合作车辆"] {
          background: rgba(14, 165, 233, 0.15);
          color: #0ea5e9;
          border: 1px solid rgba(14, 165, 233, 0.4);
        }

        // 教工私车类
        &[class*="教工私车"] {
          background: rgba(99, 102, 241, 0.15);
          color: #6366f1;
          border: 1px solid rgba(99, 102, 241, 0.4);
        }

        // 优秀校友
        &[class*="优秀校友"] {
          background: rgba(251, 191, 36, 0.15);
          color: #fbbf24;
          border: 1px solid rgba(251, 191, 36, 0.4);
        }

        // 二道岗可通行车辆
        &[class*="二道岗"] {
          background: rgba(107, 114, 128, 0.15);
          color: #6b7280;
          border: 1px solid rgba(107, 114, 128, 0.4);
        }

        // 访客车辆类
        &[class*="访客"] {
          background: rgba(14, 165, 233, 0.15);
          color: #0ea5e9;
          border: 1px solid rgba(14, 165, 233, 0.4);
        }

        // 体育馆访客车辆
        &[class*="体育馆"] {
          background: rgba(14, 165, 233, 0.15);
          color: #0ea5e9;
          border: 1px solid rgba(14, 165, 233, 0.4);
        }

        // 默认样式（当没有匹配到特定类型时）
        &:not([class*="保障车辆"]):not([class*="教职工"]):not([class*="超级VIP"]):not([class*="公务车辆"]):not([class*="施工车辆"]):not([class*="居民车辆"]):not([class*="外聘"]):not([class*="合作车辆"]):not([class*="教工私车"]):not([class*="优秀校友"]):not([class*="二道岗"]):not([class*="访客"]):not([class*="体育馆"]) {
          background: rgba(107, 114, 128, 0.15);
          color: #6b7280;
          border: 1px solid rgba(107, 114, 128, 0.4);
        }
      }
    }
  }

  @keyframes skeletonPulse {
    0% {
      background-position: 200% 0;
    }

    100% {
      background-position: -200% 0;
    }
  }
}

// 热力图区域样式
.heatmap-section {
  display: flex;
  gap: 10px;
  margin-bottom: 40px;
  margin-top: -15px;
  height: 330px;

  .vehicle-heatmap,
  .face-heatmap {
    flex: 1;
    border-radius: 8px;
    padding: 5px;
    display: flex;
    flex-direction: column;

    .heatmap-title {
      display: flex;
      align-items: center;
      gap: 6px;
      margin-bottom: 5px;
      padding-bottom: 4px;
      border-bottom: 1px solid rgba(59, 130, 246, 0.3);
      flex-shrink: 0;

      .title-icon {
        font-size: 13px;
      }

      .title-text {
        font-size: 11px;
        color: #3b82f6;
        font-weight: bold;
      }
    }
  }
}


// 响应式设计
@media (max-width: 1200px) {
  .camera-grid {
    grid-template-columns: repeat(3, 1fr);
    grid-template-rows: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .camera-grid {
    grid-template-columns: repeat(2, 1fr);
    grid-template-rows: repeat(3, 1fr);
  }
}

/* 通道弹窗 */
.channel-modal-mask {
  position: fixed;
  inset: 0;
  background: rgba(0, 0, 0, 0.6);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 9999;
}

.channel-modal {
  width: 85vw;
  max-width: 1200px;
  background: rgba(11, 19, 42, 0.95);
  border: 1px solid #1e40af;
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
}

.channel-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(30, 64, 175, 0.5);
}

.channel-modal__title {
  color: #e2e8f0;
  font-size: 16px;
}

.channel-modal__filters {
  display: flex;
  gap: 8px;
}

.channel-filter-btn {
  padding: 4px 10px;
  font-size: 12px;
  color: #cbd5e1;
  background: rgba(30, 58, 138, 0.4);
  border: 1px solid #1e40af;
  border-radius: 6px;
  cursor: pointer;
}

.channel-filter-btn.active {
  color: #0ea5e9;
  border-color: #3b82f6;
  background: rgba(2, 6, 23, 0.6);
}

.channel-modal__close {
  color: #94a3b8;
  cursor: pointer;
}

.channel-modal__body {
  padding: 12px;
}

.channel-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 10px;
}

.channel-card {
  background: rgba(11, 19, 42, 0.6);
  border: 1px solid #1e40af;
  border-radius: 8px;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

.channel-card__header {
  display: flex;
  justify-content: space-between;
  padding: 6px 8px;
  border-bottom: 1px solid rgba(30, 64, 175, 0.3);
}

.channel-card__badge {
  padding: 2px 6px;
  font-size: 12px;
  border-radius: 4px;
  background: rgba(59, 130, 246, 0.15);
  color: #93c5fd;
  border: 1px solid rgba(59, 130, 246, 0.4);
}

.channel-card__time {
  font-size: 12px;
  color: #94a3b8;
}

.channel-card__image {
  height: 180px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(2, 6, 23, 0.6);
}

.channel-card__image img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.channel-card__placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #64748b;
  font-size: 13px;
  background: rgba(2, 6, 23, 0.4);
  border: 1px dashed #374151;
  border-radius: 4px;
  flex-direction: column;
  gap: 4px;
}

.channel-card__footer {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 6px 8px;
}

.channel-card__plate {
  padding: 2px 6px;
  border-radius: 4px;
  font-size: 13px;
  font-weight: 500;
  
  /* 默认样式（蓝牌） */
  &.plate-default,
  &.plate-blue {
    background: linear-gradient(180deg, #0066CC 0%, #003D7A 100%);
    color: #ffffff;
    border: 1px solid #0066CC;
  }
  
  /* 新能源绿牌 */
  &.plate-new-energy {
    background: linear-gradient(180deg, #22c55e 0%, #16a34a 100%);
    color: #000000;
    border: 1px solid #22c55e;
  }
  
  /* 黄牌（大型车辆、营运车辆） */
  &.plate-yellow {
    background: linear-gradient(180deg, #FFC107 0%, #FF8F00 100%);
    color: #000000;
    border: 1px solid #FFC107;
  }
  
  /* 白牌（警用、军用等） */
  &.plate-white {
    background: linear-gradient(180deg, #ffffff 0%, #f3f4f6 100%);
    color: #000000;
    border: 1px solid #d1d5db;
  }
  
  /* 兼容原有样式（如果没有指定类） */
  &:not([class*="plate-"]) {
    border: 1px solid #0C4FC5;
    color: #3b82f6;
    background: transparent;
  }
}

@media (max-width: 1200px) {
  .channel-card__image {
    height: 140px;
  }
}
</style>
<style lang="scss" scoped>
.channel-modal__footer {
  padding: 8px 12px 12px 12px;
  border-top: 1px solid rgba(30, 64, 175, 0.3);
  display: flex;
  justify-content: flex-end;
}

.pagination {
  display: flex;
  align-items: center;
  gap: 10px;
}

.page-btn {
  padding: 4px 10px;
  font-size: 12px;
  color: #cbd5e1;
  background: rgba(30, 58, 138, 0.4);
  border: 1px solid #1e40af;
  border-radius: 6px;
  cursor: pointer;
}

.page-btn[disabled] {
  opacity: 0.5;
  cursor: not-allowed;
}

.page-info {
  color: #94a3b8;
  font-size: 12px;
}
</style>

<style lang="scss" scoped>
// 人脸监控新布局样式
.camera-single.face-layout {
  display: flex;
  flex-direction: column;
  height: auto;
  min-height: 200px;

  // 通道网格布局
  .face-channels-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 12px;
    padding: 8px;
  }
  
  // 每个通道卡片
  .face-channel-card {
    background: rgba(255, 255, 255, 0.02);
    border: 1px solid rgba(255, 255, 255, 0.1);
    border-radius: 8px;
    overflow: hidden;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(100, 149, 237, 0.3);
    }
  }

  .camera-content-wrapper {
    display: flex;
    flex-direction: row;
    gap: 8px; // 从10px减少到8px，让右侧信息更靠近图片
    padding: 6px;
    height: 250px; // 进一步增加高度，让照片显示更高更清晰

    // 左侧图片区域 - 调整宽度更窄，高度更高
    .camera-image.left {
      flex: 0 0 35%; // 从50%减少到35%，更窄
      position: relative;
      border-radius: 6px;
      overflow: hidden;
      cursor: pointer;
      max-height: 350px; // 进一步增加到300px，让照片显示更高更清晰

      img {
        width: 100%;
        height: 100%;
        object-fit: cover;
        transition: transform 0.3s ease;
      }

      &:hover img {
        transform: scale(1.05);
      }
    }

    // 右侧信息面板
    .face-info-panel {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 10px; // 增加间距
      padding: 15px 8px 8px 0px; // 减少顶部padding，让内容整体往上移动
      justify-content: flex-start; // 改为顶部对齐

      .info-item {
        display: flex;
        align-items: flex-start; // 改为顶部对齐，适应换行
        font-size: 13px; // 稍微减小字体，给更多空间
        gap: 8px;
        margin-bottom: 6px;
        min-height: 22px; // 添加最小高度

        &.name-time-row {
          flex-direction: row;
          align-items: center;
          justify-content: flex-start; // 左对齐
          gap: 6px; // 进一步缩小间距，让时间更靠左
          margin-bottom: 8px;
          white-space: nowrap; // 确保不换行

          .name-value {
            font-size: 20px; // 减小姓名字体
            font-weight: 700;
            color: #4fd2dd;
            flex-shrink: 0;
            white-space: nowrap; // 姓名不换行
          }

          .time-status {
            font-size: 18px; // 增大时间状态字体，更醒目
            color: #4fd2dd;
            font-weight: 600;
            flex-shrink: 0;
            white-space: nowrap; // 时间和状态不换行
          }
        }

        .info-label {
          color: #ffffff;
          min-width: 70px;
          flex-shrink: 0;
          font-weight: 500;
        }

        .info-value {
          color: #ffffff;
          flex: 1;
          font-weight: 600;
          font-size: 11px; // 减小字体以容纳更多文字
          // 强制换行策略
          word-wrap: break-word;
          word-break: break-word; // 改为 break-word 而不是 break-all，更智能的断行
          overflow-wrap: break-word;
          white-space: normal; // 允许换行
          max-width: calc(100% - 10px); // 留一些边距
          line-height: 1.6;
          overflow: hidden; // 隐藏溢出
          text-overflow: ellipsis; // 过长显示省略号

          &.status-badge {
            display: inline-block;
            padding: 2px 6px;
            border-radius: 3px;
            font-weight: bold;

            &.entry {
              background: rgba(16, 185, 129, 0.2);
              color: #10b981;
            }

            &.exit {
              background: rgba(245, 158, 11, 0.2);
              color: #f59e0b;
            }
          }
        }
      }

      .info-divider {
        height: 1px;
        background: linear-gradient(90deg, transparent, #4fd2dd, transparent);
        margin: 4px 0 8px 0;
      }
    }
  }
  
  // 车辆监控占位符样式
  .vehicle-placeholder {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.05);
    border: 2px dashed rgba(79, 210, 221, 0.3);
    border-radius: 8px;
    cursor: pointer;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(79, 210, 221, 0.1);
      border-color: rgba(79, 210, 221, 0.5);
    }
    
    .loading-animation {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 12px;
      color: rgba(79, 210, 221, 0.8);
      
      .vehicle-icon {
        font-size: 48px;
        opacity: 0.8;
        animation: pulse 2s infinite;
      }
      
      span {
        font-size: 14px;
        font-weight: 500;
        opacity: 0.9;
      }
    }
  }
  
  @keyframes pulse {
    0%, 100% { opacity: 0.8; }
    50% { opacity: 0.4; }
  }

  // 人脸监控区域占位符
  .no-face-placeholder {
    width: 100%;
    height: 120%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: rgba(255, 255, 255, 0.03);
    border: 1px dashed rgba(255, 255, 255, 0.2);
    border-radius: 4px;
    
    .no-face-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: rgba(255, 255, 255, 0.4);
      
      .no-face-icon {
        font-size: 32px;
        opacity: 0.6;
      }
      
      span:last-child {
        font-size: 13px;
        font-weight: 500;
      }
    }
  }
  
  // 无照片占位符
  .no-photo-placeholder {
    display: flex;
    align-items: center;
    justify-content: center;
    height: 120px;
    padding: 8px;
    
    .no-photo-text {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 8px;
      color: rgba(255, 255, 255, 0.4);
      
      .no-photo-icon {
        font-size: 32px;
        opacity: 0.6;
      }
      
      span:last-child {
        font-size: 13px;
        font-weight: 500;
      }
    }
  }
  
  // 无数据状态
  .no-face-data {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 150px;
    color: rgba(255, 255, 255, 0.4);
    
    .empty-icon {
      font-size: 48px;
      margin-bottom: 12px;
      opacity: 0.6;
    }
    
    p {
      font-size: 14px;
      margin: 0;
      font-weight: 500;
    }
  }
}

// 人脸详情弹窗样式
.face-detail-modal {
  position: relative;
  background: rgba(11, 19, 42, 0.95);
  border-radius: 10px;
  box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5);
  width: 90%;
  max-width: 1200px;
  max-height: 95vh;
  display: flex;
  flex-direction: column;

  // DataV dv-border-box-10 风格的边框
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 10px;
    padding: 2px;
    background: linear-gradient(45deg,
        #00d4ff 0%,
        #0099cc 25%,
        #00d4ff 50%,
        #0099cc 75%,
        #00d4ff 100%);
    background-size: 200% 200%;
    animation: borderFlow 3s linear infinite;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: xor;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    z-index: -1;
  }

  // 内层发光边框
  &::after {
    content: '';
    position: absolute;
    top: -1px;
    left: -1px;
    right: -1px;
    bottom: -1px;
    border-radius: 11px;
    background: linear-gradient(45deg,
        rgba(0, 212, 255, 0.3) 0%,
        rgba(0, 153, 204, 0.3) 25%,
        rgba(0, 212, 255, 0.3) 50%,
        rgba(0, 153, 204, 0.3) 75%,
        rgba(0, 212, 255, 0.3) 100%);
    background-size: 200% 200%;
    animation: borderFlow 3s linear infinite reverse;
    z-index: -2;
    filter: blur(2px);
  }
}

.face-detail-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 10px 14px;
  border-bottom: 1px solid rgba(30, 64, 175, 0.5);
  background: rgba(11, 19, 42, 0.8);
}

.face-detail-modal__title {
  font-size: 18px;
  color: #ffffff;
  font-weight: bold;
}

.face-detail-modal__filters {
  display: flex;
  gap: 8px;
  flex: 1;
  justify-content: center;
}

.face-detail-modal__close {
  color: #94a3b8;
  cursor: pointer;
  font-size: 24px;
  padding: 0 8px;
  transition: color 0.3s ease;

  &:hover {
    color: #ffffff;
  }
}

.face-detail-modal__body {
  flex: 1;
  padding: 15px;
  overflow-y: auto;
}

.face-detail-modal__footer {
  padding: 15px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
  display: flex;
  justify-content: center;
  align-items: center;
}

.face-detail-grid {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  grid-auto-rows: auto;
  gap: 24px;
  padding: 8px;
}

.face-detail-card {
  position: relative;
  background: transparent;
  border-radius: 12px;
  padding: 12px;
  transition: all 0.3s ease;
  overflow: hidden;
  height: auto;
  backdrop-filter: blur(10px);

  // 卡片头部样式
  .face-detail-card__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 12px;
    padding-bottom: 10px;
    border-bottom: 1px solid rgba(79, 210, 221, 0.3);
    position: relative;
    z-index: 1;

    .face-channel-badge {
      font-size: 14px;
      font-weight: 700;
      padding: 6px 14px;
      border-radius: 20px;
      letter-spacing: 1px;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
      transition: all 0.3s ease;

      &.badge-entry {
        color: #4ade80;
        background: linear-gradient(135deg, rgba(74, 222, 128, 0.35), rgba(34, 197, 94, 0.3));
        border: 1px solid rgba(74, 222, 128, 0.7);
        box-shadow: 0 0 15px rgba(74, 222, 128, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3);
      }

      &.badge-exit {
        color: #fb923c;
        background: linear-gradient(135deg, rgba(251, 146, 60, 0.35), rgba(249, 115, 22, 0.3));
        border: 1px solid rgba(251, 146, 60, 0.7);
        box-shadow: 0 0 15px rgba(251, 146, 60, 0.5), 0 2px 8px rgba(0, 0, 0, 0.3);
      }
    }

    .face-card-time {
      font-size: 13px;
      font-weight: 600;
      padding: 4px 10px;
      border-radius: 12px;
      text-shadow: 0 1px 3px rgba(0, 0, 0, 0.6);

      &.time-entry {
        color: #86efac;
      }

      &.time-exit {
        color: #fdba74;
      }
    }
  }

  .face-detail-card__content {
    display: flex !important;
    flex-direction: row !important;
    gap: 12px;
    width: 100%;
    height: auto;
    align-items: flex-start;
  }

  // 确保border-box-10组件不影响flexbox布局
  :deep(.border-box-10) {
    position: absolute !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    z-index: -1 !important;
    pointer-events: none !important;

    .corner-cut {
      display: none !important;
    }
  }

  // 向内深蓝色渐变边框
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    border-radius: 12px;
    padding: 2px;
    background: linear-gradient(135deg,
        rgba(0, 20, 60, 0.8) 0%,
        rgba(0, 40, 100, 0.6) 25%,
        rgba(0, 60, 120, 0.4) 50%,
        rgba(0, 40, 100, 0.6) 75%,
        rgba(0, 20, 60, 0.8) 100%);
    background-size: 200% 200%;
    animation: borderFlow 4s linear infinite;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: xor;
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    z-index: -1;
  }

  // 内层深蓝色渐变背景
  &::after {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    right: 2px;
    bottom: 2px;
    border-radius: 10px;
    background: linear-gradient(135deg,
        rgba(0, 20, 60, 0.3) 0%,
        rgba(0, 40, 100, 0.2) 50%,
        rgba(0, 20, 60, 0.3) 100%);
    z-index: -2;
  }

  // 右上角斜切角效果
  .corner-cut {
    position: absolute;
    top: 0;
    right: 0;
    width: 0;
    height: 0;
    border-left: 24px solid transparent;
    border-top: 24px solid rgba(0, 212, 255, 0.3);
    z-index: 2;
  }

  // 正常状态 - 蓝色科技感
  &.status-normal {
    // border-color: #00d4ff;
    background: linear-gradient(135deg, rgba(0, 20, 40, 0.9), rgba(0, 40, 80, 0.8));

    &::after {
      // background: linear-gradient(45deg, #00d4ff, #0099cc, #00d4ff);
      animation: glow-blue 2s ease-in-out infinite alternate;
    }
  }

  // 未知状态 - 红色警告
  &.status-unknown {
    border-color: #ff3366;
    background: linear-gradient(135deg, rgba(40, 0, 0, 0.9), rgba(80, 0, 0, 0.8));

    &::after {
      background: linear-gradient(45deg, #ff3366, #cc0033, #ff3366);
      animation: glow-red 2s ease-in-out infinite alternate;
    }
  }

  // 无权限/时间无效 - 橙色警告
  &.status-no-permission,
  &.status-invalid-time {
    border-color: #ff9900;
    background: linear-gradient(135deg, rgba(40, 20, 0, 0.9), rgba(80, 40, 0, 0.8));

    &::after {
      background: linear-gradient(45deg, #ff9900, #cc6600, #ff9900);
      animation: glow-orange 2s ease-in-out infinite alternate;
    }
  }

  &:hover {
    transform: translateY(-3px) scale(1.02);
    box-shadow: 0 12px 40px rgba(0, 0, 0, 0.5);
  }
  
  // 无数据卡片样式
  &.no-data {
    opacity: 0.6;
    
    .face-detail-card__image {
      opacity: 0.7;
    }
    
    .face-detail-card__info {
      opacity: 0.7;
      
      .name-value {
        color: rgba(255, 255, 255, 0.5);
      }
      
      .info-value {
        color: rgba(255, 255, 255, 0.4);
      }
    }
    
    &:hover {
      transform: none;
      box-shadow: 0 4px 20px rgba(0, 0, 0, 0.3);
    }
  }

  .face-detail-card__image {
    width: 80px !important;
    height: 120px !important;
    border-radius: 8px;
    overflow: hidden;
    flex-shrink: 0 !important;
    flex-grow: 0 !important;
    position: relative;
    border: 2px solid rgba(255, 255, 255, 0.2);
    background: rgba(255, 255, 255, 0.05);


    img {
      width: 100%;
      height: 100%;
      object-fit: cover;
      transition: transform 0.3s ease;
    }

    &:hover img {
      transform: scale(1.05);
    }

    .status-label {
      position: absolute;
      bottom: 0;
      left: 0;
      right: 0;
      background: rgba(0, 0, 0, 0.9);
      color: #ffffff;
      font-size: 11px;
      padding: 4px 6px;
      text-align: center;
      font-weight: 600;
      letter-spacing: 0.5px;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.8);

      &.label-no-permission {
        background: linear-gradient(135deg, #ff3366, #cc0033);
        box-shadow: 0 2px 8px rgba(255, 51, 102, 0.4);
      }

      &.label-invalid-time {
        background: linear-gradient(135deg, #ff9900, #cc6600);
        color: #ffffff;
        box-shadow: 0 2px 8px rgba(255, 153, 0, 0.4);
      }
    }
    
    // 人脸占位符样式
    .face-card__placeholder {
      width: 100%;
      height: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.03);
      color: rgba(255, 255, 255, 0.4);
      font-size: 12px;
      font-weight: 500;
      border: 1px dashed rgba(255, 255, 255, 0.2);
      border-radius: 6px;
    }
  }

  .face-detail-card__info {
    display: flex !important;
    flex-direction: column !important;
    gap: 8px;
    flex: 1 !important;
    justify-content: flex-start;
    min-width: 0; // 防止flex子项溢出
    height: auto;
    overflow: visible;

    // 确保在border-box-10内部也能正确显示
    :deep(.border-box-10) & {
      display: flex !important;
      flex-direction: column !important;
      flex: 1 !important;
      min-width: 0 !important;
    }
  }

  .name-time-row {
    display: flex;
    margin-bottom: 10px;

    .name-value {
      font-size: 20px;
      font-weight: 700;
      color: #ffffff;
      line-height: 1.3;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
      letter-spacing: 0.5px;
      white-space: nowrap;
    }
  }

  .info-divider {
    width: 100%;
    height: 1px;
    background: linear-gradient(90deg,
        transparent 0%,
        rgba(255, 255, 255, 0.2) 20%,
        rgba(255, 255, 255, 0.4) 50%,
        rgba(255, 255, 255, 0.2) 80%,
        transparent 100%);
    margin: 8px 0;
    opacity: 0.6;
  }

  .info-item {
    display: flex;
    align-items: center;
    font-size: 14px;
    gap: 8px;
    margin-bottom: 6px;

    .info-label {
      color: #ffffff;
      opacity: 0.9;
      min-width: 60px;
      flex-shrink: 0;
      font-weight: 500;
      letter-spacing: 0.3px;
    }

    .info-value {
      color: #4fd2dd;
      flex: 1;
      font-weight: 600;
      text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);

      &.no-data {
        color: #888888;
        font-style: italic;
      }

      .college-info {
        color: #ffd700;
        font-size: 0.9em;
        font-weight: 500;
        margin-left: 4px;
        text-shadow: 0 1px 2px rgba(255, 215, 0, 0.3);
      }
    }
  }
}

// 人员类型样式
.person-type {
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 6px;
  display: inline-block;
  width: fit-content;
  max-width: 100%;
  font-size: 13px;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

  &.type-reserved {
    color: #10b981;
    background: linear-gradient(135deg, rgba(16, 185, 129, 0.3), rgba(5, 150, 105, 0.25));
    border: 1px solid rgba(16, 185, 129, 0.6);
    box-shadow: 0 0 10px rgba(16, 185, 129, 0.4);
  }

  &.type-unreserved {
    color: #fbbf24;
    background: linear-gradient(135deg, rgba(251, 191, 36, 0.3), rgba(245, 158, 11, 0.25));
    border: 1px solid rgba(251, 191, 36, 0.6);
    box-shadow: 0 0 10px rgba(251, 191, 36, 0.4);
  }

  &.type-staff {
    color: #60a5fa;
    background: linear-gradient(135deg, rgba(96, 165, 250, 0.3), rgba(59, 130, 246, 0.25));
    border: 1px solid rgba(96, 165, 250, 0.6);
    box-shadow: 0 0 10px rgba(96, 165, 250, 0.4);
  }

  &.type-student {
    color: #c084fc;
    background: linear-gradient(135deg, rgba(192, 132, 252, 0.3), rgba(168, 85, 247, 0.25));
    border: 1px solid rgba(192, 132, 252, 0.6);
    box-shadow: 0 0 10px rgba(192, 132, 252, 0.4);
  }

  &.type-unknown {
    color: #9ca3af;
    background: linear-gradient(135deg, rgba(156, 163, 175, 0.3), rgba(107, 114, 128, 0.25));
    border: 1px solid rgba(156, 163, 175, 0.6);
    box-shadow: 0 0 10px rgba(156, 163, 175, 0.4);
  }
}

// 识别方式样式
.recognition-method {
  font-weight: 700;
  padding: 4px 12px;
  border-radius: 6px;
  display: inline-block;
  width: fit-content;
  max-width: 100%;
  font-size: 13px;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.5);
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);

  &.method-face {
    color: #34d399;
    background: linear-gradient(135deg, rgba(52, 211, 153, 0.35), rgba(16, 185, 129, 0.3));
    border: 1px solid rgba(52, 211, 153, 0.7);
    box-shadow: 0 0 12px rgba(52, 211, 153, 0.5);
  }

  &.method-card {
    color: #818cf8;
    background: linear-gradient(135deg, rgba(129, 140, 248, 0.35), rgba(99, 102, 241, 0.3));
    border: 1px solid rgba(129, 140, 248, 0.7);
    box-shadow: 0 0 12px rgba(129, 140, 248, 0.5);
  }

  &.method-id {
    color: #fb923c;
    background: linear-gradient(135deg, rgba(251, 146, 60, 0.35), rgba(249, 115, 22, 0.3));
    border: 1px solid rgba(251, 146, 60, 0.7);
    box-shadow: 0 0 12px rgba(251, 146, 60, 0.5);
  }

  &.method-unknown {
    color: #9ca3af;
    background: linear-gradient(135deg, rgba(156, 163, 175, 0.35), rgba(107, 114, 128, 0.3));
    border: 1px solid rgba(156, 163, 175, 0.7);
    box-shadow: 0 0 12px rgba(156, 163, 175, 0.5);
  }
}

// 识别状态徽章样式
.badge.recognition-badge {
  &.badge-face {
    background: linear-gradient(135deg, #10b981, #059669);
    color: #ffffff;
  }

  &.badge-card {
    background: linear-gradient(135deg, #3b82f6, #2563eb);
    color: #ffffff;
  }

  &.badge-id {
    background: linear-gradient(135deg, #f59e0b, #d97706);
    color: #ffffff;
  }
}

// 发光动画效果
@keyframes glow-blue {
  0% {
    box-shadow: 0 0 5px #00d4ff, 0 0 10px #00d4ff, 0 0 15px #00d4ff;
  }

  100% {
    box-shadow: 0 0 10px #00d4ff, 0 0 20px #00d4ff, 0 0 30px #00d4ff;
  }
}

// DataV 边框流动动画
@keyframes borderFlow {
  0% {
    background-position: 0% 50%;
  }

  50% {
    background-position: 100% 50%;
  }

  100% {
    background-position: 0% 50%;
  }
}

@keyframes glow-red {
  0% {
    box-shadow: 0 0 5px #ff3366, 0 0 10px #ff3366, 0 0 15px #ff3366;
  }

  100% {
    box-shadow: 0 0 10px #ff3366, 0 0 20px #ff3366, 0 0 30px #ff3366;
  }
}

@keyframes glow-orange {
  0% {
    box-shadow: 0 0 5px #ff9900, 0 0 10px #ff9900, 0 0 15px #ff9900;
  }

  100% {
    box-shadow: 0 0 10px #ff9900, 0 0 20px #ff9900, 0 0 30px #ff9900;
  }
}

@media (max-width: 1200px) {
  .face-detail-grid {
    grid-template-columns: repeat(3, 1fr);
  }
}

@media (max-width: 900px) {
  .face-detail-grid {
    grid-template-columns: repeat(2, 1fr);
  }
}

@media (max-width: 768px) {
  .face-detail-grid {
    grid-template-columns: 1fr;
  }
}

/* 详情弹窗样式 */
.detail-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
}

.detail-modal {
  width: 95%;
  max-width: 1600px;
  max-height: 90vh;
  background: linear-gradient(135deg, #1a2332 0%, #0f1419 100%);
  border-radius: 12px;
  border: 1px solid rgba(79, 210, 221, 0.3);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.detail-modal__header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20px 24px;
  background: rgba(79, 210, 221, 0.1);
  border-bottom: 1px solid rgba(79, 210, 221, 0.3);
}

.detail-modal__title {
  font-size: 20px;
  font-weight: 600;
  color: #4fd2dd;
  text-shadow: 0 0 10px rgba(79, 210, 221, 0.5);
}

/* 更新时间样式 */
.refresh-time {
  font-size: 14px;
  font-weight: 400;
  color: #52c41a;
  margin-left: 12px;
  opacity: 0.8;
  text-shadow: 0 0 8px rgba(82, 196, 26, 0.4);
  animation: fadeIn 0.5s ease-in-out;
}

@keyframes fadeIn {
  from {
    opacity: 0;
    transform: translateY(-5px);
  }
  to {
    opacity: 0.8;
    transform: translateY(0);
  }
}

.detail-modal__close {
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  color: #fff;
  font-size: 20px;
  border-radius: 50%;
  transition: all 0.3s;
}

.detail-modal__close:hover {
  background: rgba(255, 255, 255, 0.1);
  color: #4fd2dd;
}

/* 🔥 大数据量警告样式 */
.detail-modal__warning {
  display: flex;
  align-items: flex-start;
  gap: 12px;
  padding: 16px 24px;
  background: linear-gradient(135deg, 
    rgba(255, 165, 0, 0.15),   /* 橙色背景 */
    rgba(255, 165, 0, 0.08)
  );
  border-left: 4px solid #ffa500;
  border-bottom: 1px solid rgba(255, 165, 0, 0.3);
  margin: 0;
}

.detail-modal__warning .warning-icon {
  font-size: 20px;
  line-height: 1;
  margin-top: 2px;
  animation: warningPulse 2s ease-in-out infinite alternate;
}

.detail-modal__warning .warning-text {
  flex: 1;
  font-size: 14px;
  line-height: 1.5;
  color: #fff;
}

.detail-modal__warning .warning-text span {
  display: block;
  margin-bottom: 4px;
}

.detail-modal__warning .warning-text br {
  margin: 4px 0;
}

@keyframes warningPulse {
  0% { 
    opacity: 0.7; 
    transform: scale(1);
  }
  100% { 
    opacity: 1; 
    transform: scale(1.1);
  }
}

/* 筛选区域 */
.detail-modal__filters {
  padding: 20px 24px;
  background: rgba(255, 255, 255, 0.02);
  border-bottom: 1px solid rgba(79, 210, 221, 0.2);
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
  align-items: flex-end;
}

.filter-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.filter-item label {
  color: #8b9cad;
  font-size: 14px;
}

.filter-input,
.filter-select {
  padding: 8px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(79, 210, 221, 0.3);
  border-radius: 4px;
  color: #fff;
  font-size: 14px;
  min-width: 150px;
}

.filter-input:focus,
.filter-select:focus {
  outline: none;
  border-color: #4fd2dd;
  box-shadow: 0 0 8px rgba(79, 210, 221, 0.3);
}

/* 表单输入框独特样式 */
/* 姓名输入框 - 蓝色主题 */
.filter-input-name {
  border-color: rgba(33, 150, 243, 0.4);
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.08), rgba(33, 150, 243, 0.12));
}

.filter-input-name:focus {
  border-color: #2196f3;
  box-shadow: 0 0 12px rgba(33, 150, 243, 0.4);
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.12), rgba(33, 150, 243, 0.15));
}

/* 手机号输入框 - 紫色主题 */
.filter-input-phone {
  border-color: rgba(156, 39, 176, 0.4);
  background: linear-gradient(135deg, rgba(156, 39, 176, 0.08), rgba(156, 39, 176, 0.12));
}

.filter-input-phone:focus {
  border-color: #9c27b0;
  box-shadow: 0 0 12px rgba(156, 39, 176, 0.4);
  background: linear-gradient(135deg, rgba(156, 39, 176, 0.12), rgba(156, 39, 176, 0.15));
}

/* 身份证号输入框 - 橙色主题 */
.filter-input-id {
  border-color: rgba(255, 152, 0, 0.4);
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.08), rgba(255, 152, 0, 0.12));
}

.filter-input-id:focus {
  border-color: #ff9800;
  box-shadow: 0 0 12px rgba(255, 152, 0, 0.4);
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.12), rgba(255, 152, 0, 0.15));
}

/* 学院/部门输入框 - 青色主题 */
.filter-input-org {
  border-color: rgba(0, 188, 212, 0.4);
  background: linear-gradient(135deg, rgba(0, 188, 212, 0.08), rgba(0, 188, 212, 0.12));
}

.filter-input-org:focus {
  border-color: #00bcd4;
  box-shadow: 0 0 12px rgba(0, 188, 212, 0.4);
  background: linear-gradient(135deg, rgba(0, 188, 212, 0.12), rgba(0, 188, 212, 0.15));
}

/* 车牌号输入框 - 绿色主题 */
.filter-input-plate {
  border-color: rgba(76, 175, 80, 0.4);
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.08), rgba(76, 175, 80, 0.12));
}

.filter-input-plate:focus {
  border-color: #4caf50;
  box-shadow: 0 0 12px rgba(76, 175, 80, 0.4);
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.12), rgba(76, 175, 80, 0.15));
}

/* 下拉选择框独特样式 */
/* 人员类型选择框 - 品红主题 */
.filter-select-person-type {
  border-color: rgba(233, 30, 99, 0.4);
  background: linear-gradient(135deg, rgba(233, 30, 99, 0.08), rgba(233, 30, 99, 0.12));
}

.filter-select-person-type:focus {
  border-color: #e91e63;
  box-shadow: 0 0 12px rgba(233, 30, 99, 0.4);
  background: linear-gradient(135deg, rgba(233, 30, 99, 0.12), rgba(233, 30, 99, 0.15));
}

/* 通道选择框 - 深青主题 */
.filter-select-channel {
  border-color: rgba(0, 150, 136, 0.4);
  background: linear-gradient(135deg, rgba(0, 150, 136, 0.08), rgba(0, 150, 136, 0.12));
}

.filter-select-channel:focus {
  border-color: #009688;
  box-shadow: 0 0 12px rgba(0, 150, 136, 0.4);
  background: linear-gradient(135deg, rgba(0, 150, 136, 0.12), rgba(0, 150, 136, 0.15));
}

/* 时间范围选择框 - 琥珀主题 */
.filter-select-time {
  border-color: rgba(255, 193, 7, 0.4);
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.08), rgba(255, 193, 7, 0.12));
}

.filter-select-time:focus {
  border-color: #ffc107;
  box-shadow: 0 0 12px rgba(255, 193, 7, 0.4);
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.12), rgba(255, 193, 7, 0.15));
}

/* 下拉菜单选项样式 */
.filter-select option {
  background: #1a2332;
  color: #fff;
  padding: 8px;
}

.filter-select option:hover {
  background: rgba(79, 210, 221, 0.2);
}

.filter-actions {
  display: flex;
  gap: 12px;
  align-items: flex-end;
}

.btn-search,
.btn-reset {
  padding: 8px 20px;
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 14px;
  transition: all 0.3s;
}

.btn-search {
  background: linear-gradient(135deg, #4fd2dd 0%, #3da8b3 100%);
  color: #fff;
}

.btn-search:hover {
  background: linear-gradient(135deg, #3da8b3 0%, #2d8691 100%);
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 210, 221, 0.3);
}

.btn-reset {
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-reset:hover {
  background: rgba(255, 255, 255, 0.15);
}

/* 数据表格 */
.detail-modal__body {
  flex: 1;
  overflow-y: auto;
  overflow-x: hidden; /* 隐藏横向滚动条 */
  padding: 20px 24px;
}

.detail-loading,
.detail-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  color: #8b9cad;
}

.loading-spinner {
  width: 40px;
  height: 40px;
  border: 4px solid rgba(79, 210, 221, 0.2);
  border-top-color: #4fd2dd;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 16px;
}

@keyframes spin {
  to {
    transform: rotate(360deg);
  }
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
  opacity: 0.5;
}

.detail-table {
  width: 100%;
  border-collapse: collapse;
  font-size: 14px;
  table-layout: fixed; /* 强制使用固定表格布局 */
}

.detail-table thead {
  background: rgba(79, 210, 221, 0.1);
}

.detail-table th {
  padding: 12px 16px;
  text-align: left;
  color: #4fd2dd;
  font-weight: 600;
  border-bottom: 2px solid rgba(79, 210, 221, 0.3);
  white-space: nowrap;
}

.detail-table tbody tr {
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
  transition: background 0.2s;
}

.detail-table tbody tr:hover {
  background: rgba(79, 210, 221, 0.05);
}

.detail-table td {
  padding: 12px 16px;
  color: #e8ebef;
  vertical-align: middle;
}

/* 违规详情表格特殊样式 */
.detail-table.violation-table td {
  white-space: normal;
  word-wrap: break-word;
}

.detail-table.violation-table th,
.detail-table.violation-table td {
  min-width: unset !important;
  max-width: unset !important;
}

/* 注释掉固定列宽设置，使用动态配置 */
/*
.detail-table th:first-child,
.detail-table td:first-child {
  min-width: 100px;
  max-width: 120px;
}

.detail-table th:nth-child(2),
.detail-table td:nth-child(2) {
  min-width: 150px;
  max-width: 200px;
}

.detail-table th:nth-child(5),
.detail-table td:nth-child(5) {
  min-width: 160px;
  max-width: 180px;
}

.detail-table th:nth-child(8),
.detail-table td:nth-child(8) {
  min-width: 320px;
  max-width: 400px;
}

.detail-table th:nth-child(9),
.detail-table td:nth-child(9) {
  min-width: 180px;
  max-width: 200px;
}
*/

/* 车牌样式 - 参考violation.vue */
.plate-number {
  display: inline-block;
  font-size: 11px;
  font-weight: bold;
  padding: 3px 8px;
  border-radius: 4px;
  font-family: "微软雅黑", "Consolas", monospace;
  letter-spacing: 0.5px;
  min-width: 70px;
  text-align: center;
  position: relative;
  transition: all 0.3s ease;
  white-space: nowrap;
}

/* 车牌颜色样式 */
.plate-number.traditional {
  background: linear-gradient(180deg, #0C4FC5 0%, #216FEF 100%);
  color: #FFFFFF;
  border: 1px solid #0C4FC5;
  box-shadow: 0 2px 4px rgba(12, 79, 197, 0.3);
}

.plate-number.new-energy {
  background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
  color: #000000;
  border: 1px solid #6AD390;
  box-shadow: 0 2px 4px rgba(106, 211, 144, 0.3);
}

.plate-number.yellow {
  background: linear-gradient(180deg, #f8c401 0%, #dba700 100%);
  color: #111;
  border: 1px solid #a88600;
  box-shadow: 0 2px 4px rgba(220, 176, 20, 0.15);
}

.plate-number.police {
  background: linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 100%);
  color: #222;
  border: 1px solid #adadad;
  box-shadow: 0 2px 4px rgba(160, 160, 160, 0.15);
}

.blue-plate {
  background: linear-gradient(135deg, #0C4FC5, #216FEF);
  color: #FFFFFF;
  border: 1px solid #0C4FC5;
  box-shadow: 0 2px 8px rgba(12, 79, 197, 0.2);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(12, 79, 197, 0.3);
  }
}

.green-plate {
  background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
  color: #000000;
  border: 1px solid #6AD390;
  box-shadow: 0 2px 8px rgba(82, 196, 26, 0.2);

  &:hover {
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
  }

  &::before {
    position: absolute;
    top: -12px;
    right: -6px;
    background: #f6ffed;
    color: #52c41a;
    font-size: 10px;
    padding: 1px 4px;
    border-radius: 3px;
    border: 1px solid #b7eb8f;
    transform: scale(0.8);
  }
}

/* 保留原有样式作为备用 */
.plate-normal {
  padding: 4px 8px;
  background: rgba(79, 210, 221, 0.2);
  border-radius: 4px;
  font-weight: 600;
}

.plate-new-energy {
  padding: 4px 8px;
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
  border-radius: 4px;
  font-weight: 600;
}

/* 预约信息样式 */
.reservation-info-cell {
  padding: 8px 0;
  min-width: 280px;
}

.reservation-details {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 10px;
  background: rgba(79, 210, 221, 0.05);
  border-radius: 8px;
  border-left: 3px solid #4fd2dd;
}

.reservation-item {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 4px 0;
}

.reservation-label {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: #4fd2dd;
  font-weight: 600;
  min-width: 70px;
  flex-shrink: 0;
  padding: 4px 8px;
  background: rgba(79, 210, 221, 0.1);
  border-radius: 4px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
}

.reservation-value {
  font-size: 13px;
  color: #e8ebef;
  flex: 1;
}

/* 时间段样式 - 优化美化，支持换行 */
.time-value-wrapper {
  display: inline-block;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  background: linear-gradient(135deg, rgba(255, 167, 38, 0.2), rgba(251, 140, 0, 0.3));
  color: #ffb74d;
  padding: 8px 16px;
  border-radius: 6px;
  border: 1px solid rgba(255, 167, 38, 0.4);
  border-left: 3px solid #ff9800;
  font-weight: 600;
  font-size: 13px;
  letter-spacing: 0.5px;
  line-height: 1.6;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
  white-space: normal;
  word-break: break-all;
  max-width: 280px;
  text-align: left;
}

.time-value-wrapper:hover {
  background: linear-gradient(135deg, rgba(255, 167, 38, 0.3), rgba(251, 140, 0, 0.4));
  box-shadow: 0 2px 8px rgba(255, 167, 38, 0.3);
  transform: translateY(-1px);
}

/* 保留旧的时间段样式以兼容 */
.time-value {
  display: inline-flex;
  align-items: center;
  gap: 8px;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  background: linear-gradient(135deg, rgba(255, 167, 38, 0.2), rgba(251, 140, 0, 0.3));
  color: #ffb74d;
  padding: 8px 14px;
  border-radius: 6px;
  border: 1px solid rgba(255, 167, 38, 0.4);
  border-left: 3px solid #ff9800;
  font-weight: 500;
  letter-spacing: 0.5px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.time-value:hover {
  background: linear-gradient(135deg, rgba(255, 167, 38, 0.3), rgba(251, 140, 0, 0.4));
  box-shadow: 0 2px 8px rgba(255, 167, 38, 0.3);
}

.time-start,
.time-end {
  display: inline-block;
  padding: 4px 8px;
  background: rgba(255, 152, 0, 0.2);
  border-radius: 4px;
  font-weight: 600;
  font-size: 13px;
}

.time-separator {
  color: #ff9800;
  font-weight: bold;
  font-size: 16px;
  margin: 0 4px;
}

/* 表单名称样式 - 优化美化 */
.form-value {
  display: inline-block;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.2), rgba(102, 187, 106, 0.3));
  color: #81c784;
  padding: 6px 12px;
  border-radius: 6px;
  border: 1px solid rgba(76, 175, 80, 0.4);
  border-left: 3px solid #4caf50;
  font-weight: 500;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.form-value:hover {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.3), rgba(102, 187, 106, 0.4));
  box-shadow: 0 2px 8px rgba(76, 175, 80, 0.3);
}

/* 表单名称增强样式 - 更醒目的设计 */
.form-value-enhanced {
  display: inline-block;
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.25), rgba(56, 142, 60, 0.35));
  color: #66bb6a;
  padding: 8px 16px;
  border-radius: 8px;
  border: 1px solid rgba(76, 175, 80, 0.5);
  border-left: 4px solid #4caf50;
  font-weight: 600;
  font-size: 14px;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.15),
    0 2px 6px rgba(76, 175, 80, 0.2);
  transition: all 0.3s ease;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  position: relative;
  overflow: hidden;
}

.form-value-enhanced::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s;
}

.form-value-enhanced:hover {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.35), rgba(56, 142, 60, 0.45));
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(76, 175, 80, 0.4);
  transform: translateY(-1px);
  color: #81c784;
}

.form-value-enhanced:hover::before {
  left: 100%;
}

/* 表单类型独立颜色样式 */
/* 蓝色 - 走读学生 */
.form-type-blue {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.25), rgba(25, 118, 210, 0.35)) !important;
  color: #64b5f6 !important;
  border-color: rgba(33, 150, 243, 0.5) !important;
  border-left-color: #2196f3 !important;
}

.form-type-blue:hover {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.35), rgba(25, 118, 210, 0.45)) !important;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(33, 150, 243, 0.4) !important;
  color: #90caf9 !important;
}

/* 紫色 - 教职员舍楼楼 */
.form-type-purple {
  background: linear-gradient(135deg, rgba(156, 39, 176, 0.25), rgba(123, 31, 162, 0.35)) !important;
  color: #ba68c8 !important;
  border-color: rgba(156, 39, 176, 0.5) !important;
  border-left-color: #9c27b0 !important;
}

.form-type-purple:hover {
  background: linear-gradient(135deg, rgba(156, 39, 176, 0.35), rgba(123, 31, 162, 0.45)) !important;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(156, 39, 176, 0.4) !important;
  color: #ce93d8 !important;
}

/* 靛蓝 - 校友预约 */
.form-type-indigo {
  background: linear-gradient(135deg, rgba(63, 81, 181, 0.25), rgba(48, 63, 159, 0.35)) !important;
  color: #7986cb !important;
  border-color: rgba(63, 81, 181, 0.5) !important;
  border-left-color: #3f51b5 !important;
}

.form-type-indigo:hover {
  background: linear-gradient(135deg, rgba(63, 81, 181, 0.35), rgba(48, 63, 159, 0.45)) !important;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(63, 81, 181, 0.4) !important;
  color: #9fa8da !important;
}

/* 绿色 - 基建处车辆 */
.form-type-green {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.25), rgba(56, 142, 60, 0.35)) !important;
  color: #81c784 !important;
  border-color: rgba(76, 175, 80, 0.5) !important;
  border-left-color: #4caf50 !important;
}

.form-type-green:hover {
  background: linear-gradient(135deg, rgba(76, 175, 80, 0.35), rgba(56, 142, 60, 0.45)) !important;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(76, 175, 80, 0.4) !important;
  color: #a5d6a7 !important;
}

/* 青色 - 体育馆自助访客 */
.form-type-teal {
  background: linear-gradient(135deg, rgba(0, 150, 136, 0.25), rgba(0, 121, 107, 0.35)) !important;
  color: #4db6ac !important;
  border-color: rgba(0, 150, 136, 0.5) !important;
  border-left-color: #009688 !important;
}

.form-type-teal:hover {
  background: linear-gradient(135deg, rgba(0, 150, 136, 0.35), rgba(0, 121, 107, 0.45)) !important;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 150, 136, 0.4) !important;
  color: #80cbc4 !important;
}

/* 天蓝 - 体育馆访客车辆 */
.form-type-cyan {
  background: linear-gradient(135deg, rgba(0, 188, 212, 0.25), rgba(0, 151, 167, 0.35)) !important;
  color: #4dd0e1 !important;
  border-color: rgba(0, 188, 212, 0.5) !important;
  border-left-color: #00bcd4 !important;
}

.form-type-cyan:hover {
  background: linear-gradient(135deg, rgba(0, 188, 212, 0.35), rgba(0, 151, 167, 0.45)) !important;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(0, 188, 212, 0.4) !important;
  color: #80deea !important;
}

/* 橙色 - 个人访客车辆 */
.form-type-orange {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.25), rgba(245, 124, 0, 0.35)) !important;
  color: #ffb74d !important;
  border-color: rgba(255, 152, 0, 0.5) !important;
  border-left-color: #ff9800 !important;
}

.form-type-orange:hover {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.35), rgba(245, 124, 0, 0.45)) !important;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(255, 152, 0, 0.4) !important;
  color: #ffcc80 !important;
}

/* 琥珀 - 公务平访客车辆 */
.form-type-amber {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.25), rgba(255, 160, 0, 0.35)) !important;
  color: #ffd54f !important;
  border-color: rgba(255, 193, 7, 0.5) !important;
  border-left-color: #ffc107 !important;
}

.form-type-amber:hover {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.35), rgba(255, 160, 0, 0.45)) !important;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(255, 193, 7, 0.4) !important;
  color: #ffe082 !important;
}

/* 粉色 - 博物馆访客 */
.form-type-pink {
  background: linear-gradient(135deg, rgba(233, 30, 99, 0.25), rgba(194, 24, 91, 0.35)) !important;
  color: #f06292 !important;
  border-color: rgba(233, 30, 99, 0.5) !important;
  border-left-color: #e91e63 !important;
}

.form-type-pink:hover {
  background: linear-gradient(135deg, rgba(233, 30, 99, 0.35), rgba(194, 24, 91, 0.45)) !important;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(233, 30, 99, 0.4) !important;
  color: #f48fb1 !important;
}

/* 红色 - 兴林宾馆访客 */
.form-type-red {
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.25), rgba(211, 47, 47, 0.35)) !important;
  color: #e57373 !important;
  border-color: rgba(244, 67, 54, 0.5) !important;
  border-left-color: #f44336 !important;
}

.form-type-red:hover {
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.35), rgba(211, 47, 47, 0.45)) !important;
  box-shadow:
    inset 0 1px 3px rgba(0, 0, 0, 0.15),
    0 4px 12px rgba(244, 67, 54, 0.4) !important;
  color: #ef5350 !important;
}

/* 车牌号徽章样式（参考小程序） */
.plate-number-badge {
  display: inline-block;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
  letter-spacing: 2px;
  text-align: center;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.plate-number-badge:hover {
  transform: translateY(-1px);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.3);
}

/* 不同类型车牌颜色样式 */
.plate-number-badge.traditional {
  background: linear-gradient(180deg, #0C4FC5 0%, #216FEF 100%);
  color: #FFFFFF;
  border: 1px solid #0C4FC5;
  box-shadow: 0 2px 4px rgba(12, 79, 197, 0.3);
}

.plate-number-badge.new-energy {
  background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
  color: #000000;
  border: 1px solid #6AD390;
  box-shadow: 0 2px 4px rgba(106, 211, 144, 0.3);
}

.plate-number-badge.yellow {
  background: linear-gradient(180deg, #f8c401 0%, #dba700 100%);
  color: #111;
  border: 1px solid #a88600;
  box-shadow: 0 2px 4px rgba(220, 176, 20, 0.15);
}

.plate-number-badge.police {
  background: linear-gradient(180deg, #f5f5f5 0%, #e0e0e0 100%);
  color: #222;
  border: 1px solid #adadad;
  box-shadow: 0 2px 4px rgba(160, 160, 160, 0.15);
}

/* 蓝牌（油车） */
.blue-plate {
  background: linear-gradient(180deg, #0C4FC5 0%, #216FEF 100%);
  color: #FFFFFF;
  border: 1px solid #0C4FC5;
}

/* 绿牌（新能源） */
.green-plate {
  background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
  color: #000000;
  border: 1px solid #6AD390;
  font-weight: bold;
}

/* ==================== 违规详情专用样式 ==================== */
/* 违规车牌号样式（参考小程序） */
.violation-plate-badge {
  display: inline-block;
  padding: 6px 16px;
  border-radius: 6px;
  font-size: 16px;
  font-weight: bold;
  letter-spacing: 2px;
  text-align: center;
  box-shadow: 0 2px 10px rgba(0, 0, 0, 0.25);
  transition: all 0.3s ease;
  font-family: 'Consolas', 'Monaco', monospace;
}

.violation-plate-badge:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 16px rgba(0, 0, 0, 0.35);
}

.violation-plate-badge.blue-plate {
  background: linear-gradient(135deg, #0C4FC5 0%, #216FEF 100%);
  color: #FFFFFF;
  border: 2px solid #0C4FC5;
}

.violation-plate-badge.green-plate {
  background: linear-gradient(135deg, #5FCF80 0%, #B8E6C9 100%);
  color: #1a5a35;
  border: 2px solid #4CAF50;
  font-weight: 900;
  box-shadow: 0 2px 12px rgba(76, 175, 80, 0.5);
}

.violation-plate-badge.traditional {
  background: linear-gradient(135deg, #0C4FC5 0%, #216FEF 100%);
  color: #FFFFFF;
  border: 2px solid #0C4FC5;
  box-shadow: 0 2px 12px rgba(12, 79, 197, 0.5);
}

.violation-plate-badge.yellow {
  background: linear-gradient(135deg, #FFD700 0%, #FFC107 100%);
  color: #000000;
  border: 2px solid #FFD700;
  box-shadow: 0 2px 12px rgba(255, 215, 0, 0.5);
}

.violation-plate-badge.new-energy {
  background: linear-gradient(135deg, #5FCF80 0%, #B8E6C9 100%);
  color: #1a5a35;
  border: 2px solid #4CAF50;
  font-weight: 900;
  box-shadow: 0 2px 12px rgba(76, 175, 80, 0.5);
}

/* 严重程度徽章 */
.severity-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 600;
  text-align: center;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  transition: all 0.3s ease;
}

.severity-badge:hover {
  transform: scale(1.05);
  box-shadow: 0 3px 10px rgba(0, 0, 0, 0.25);
}

.severity-severe {
  background: linear-gradient(135deg, rgba(244, 67, 54, 0.9), rgba(211, 47, 47, 0.9));
  color: #fff;
  border: 1px solid #f44336;
}

.severity-moderate {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.9), rgba(245, 124, 0, 0.9));
  color: #fff;
  border: 1px solid #ff9800;
}

.severity-minor {
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.9), rgba(255, 160, 0, 0.9));
  color: #000;
  border: 1px solid #ffc107;
}

.severity-warning {
  background: linear-gradient(135deg, rgba(33, 150, 243, 0.9), rgba(25, 118, 210, 0.9));
  color: #fff;
  border: 1px solid #2196f3;
}

.severity-unknown {
  background: linear-gradient(135deg, rgba(158, 158, 158, 0.9), rgba(117, 117, 117, 0.9));
  color: #fff;
  border: 1px solid #9e9e9e;
}

/* 车主信息单元格 */
.owner-info-cell {
  padding: 8px;
  min-width: 280px;
  max-width: 280px;
}

.owner-detail {
  display: flex;
  flex-direction: column;
  gap: 6px;
  background: rgba(33, 150, 243, 0.08);
  padding: 10px;
  border-radius: 8px;
  border-left: 3px solid #2196f3;
  white-space: normal;
  word-wrap: break-word;
}

.owner-item {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 13px;
}

.owner-label {
  color: #90caf9;
  font-weight: 500;
  min-width: 60px;
  font-size: 12px;
}

.owner-value {
  color: #e8ebef;
  flex: 1;
}

.monthly-badge {
  display: inline-block;
  padding: 4px 10px;
  background: linear-gradient(135deg, rgba(255, 193, 7, 0.25), rgba(255, 160, 0, 0.35));
  color: #ffd54f;
  border-radius: 12px;
  border: 1px solid rgba(255, 193, 7, 0.5);
  font-size: 11px;
  font-weight: 600;
  align-self: flex-start;
}

/* 违规类型徽章 */
.violation-type-badge {
  display: inline-block;
  padding: 6px 14px;
  border-radius: 16px;
  font-size: 13px;
  font-weight: 600;
  letter-spacing: 0.5px;
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.3);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
  white-space: nowrap;
}

.violation-type-badge.type-overtime {
  color: #ffa726;
  background: linear-gradient(135deg, rgba(255, 167, 38, 0.25), rgba(251, 140, 0, 0.2));
  border: 1px solid rgba(255, 167, 38, 0.5);
}

.violation-type-badge.type-parking {
  color: #ef5350;
  background: linear-gradient(135deg, rgba(239, 83, 80, 0.25), rgba(229, 57, 53, 0.2));
  border: 1px solid rgba(239, 83, 80, 0.5);
}

.violation-type-badge.type-payment {
  color: #ab47bc;
  background: linear-gradient(135deg, rgba(171, 71, 188, 0.25), rgba(156, 39, 176, 0.2));
  border: 1px solid rgba(171, 71, 188, 0.5);
}

.violation-type-badge.type-unauthorized {
  color: #ec407a;
  background: linear-gradient(135deg, rgba(236, 64, 122, 0.25), rgba(233, 30, 99, 0.2));
  border: 1px solid rgba(236, 64, 122, 0.5);
}

.violation-type-badge.type-other {
  color: #42a5f5;
  background: linear-gradient(135deg, rgba(66, 165, 245, 0.25), rgba(33, 150, 243, 0.2));
  border: 1px solid rgba(66, 165, 245, 0.5);
}

.violation-type-badge.type-default {
  color: #78909c;
  background: linear-gradient(135deg, rgba(120, 144, 156, 0.25), rgba(96, 125, 139, 0.2));
  border: 1px solid rgba(120, 144, 156, 0.5);
}

/* 违规位置徽章 */
.violation-location-badge {
  display: inline-block;
  color: #66bb6a;
  font-size: 13px;
  font-weight: 600;
  padding: 6px 12px;
  border-radius: 16px;
  background: linear-gradient(135deg, rgba(102, 187, 106, 0.2), rgba(76, 175, 80, 0.15));
  border: 1px solid rgba(102, 187, 106, 0.4);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
}

/* 添加人徽章 */
.creator-badge {
  display: inline-block;
  color: #64b5f6;
  font-size: 13px;
  font-weight: 600;
  padding: 5px 10px;
  border-radius: 14px;
  background: linear-gradient(135deg, rgba(100, 181, 246, 0.2), rgba(33, 150, 243, 0.15));
  border: 1px solid rgba(100, 181, 246, 0.4);
  text-shadow: 0 1px 2px rgba(0, 0, 0, 0.2);
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.15);
  white-space: nowrap;
}

/* 违规描述单元格 - 支持换行 */
.violation-description-cell {
  max-width: 200px;
  line-height: 1.6;
  word-wrap: break-word;
  word-break: break-word;
  white-space: normal;
  color: rgba(255, 255, 255, 0.9);
  font-size: 13px;
  padding: 6px 0;
}

/* 人脸详情弹窗加载动画 */
.face-detail-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  width: 100%;
  
  .loading-spinner {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
    
    .spinner-ring {
      width: 20px;
      height: 20px;
      margin: 0 5px;
      border: 3px solid rgba(79, 210, 221, 0.3);
      border-top: 3px solid #4fd2dd;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      
      &:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }
  
  .loading-text {
    color: rgba(79, 210, 221, 0.9);
    font-size: 16px;
    font-weight: 500;
    text-align: center;
    animation: pulse 2s infinite;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

@keyframes pulse {
  0%, 100% { opacity: 1; }
  50% { opacity: 0.6; }
}

/* 车辆通道加载动画 */
.vehicle-channel-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400px;
  width: 100%;
  
  .loading-spinner {
    display: flex;
    justify-content: center;
    align-items: center;
    margin-bottom: 20px;
    
    .spinner-ring {
      width: 20px;
      height: 20px;
      margin: 0 5px;
      border: 3px solid rgba(34, 197, 94, 0.3);
      border-top: 3px solid #22c55e;
      border-radius: 50%;
      animation: spin 1s linear infinite;
      
      &:nth-child(2) {
        animation-delay: 0.2s;
      }
      
      &:nth-child(3) {
        animation-delay: 0.4s;
      }
    }
  }
  
  .loading-text {
    color: rgba(34, 197, 94, 0.9);
    font-size: 16px;
    font-weight: 500;
    text-align: center;
    animation: pulse 2s infinite;
  }
}

/* 违规照片单元格 */
.violation-photos-cell {
  padding: 8px;
  max-width: 180px;
  min-width: 180px;
}

.photo-gallery {
  display: flex;
  align-items: center;
  gap: 6px;
  flex-wrap: wrap;
}

.violation-photo-thumb {
  width: 60px;
  height: 60px;
  object-fit: cover;
  border-radius: 6px;
  border: 2px solid rgba(33, 150, 243, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 6px rgba(0, 0, 0, 0.2);
}

.violation-photo-thumb:hover {
  transform: scale(1.1);
  border-color: #2196f3;
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.4);
  z-index: 10;
}

.photo-more,
.photo-more-badge {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 60px;
  height: 60px;
  background: rgba(33, 150, 243, 0.2);
  color: #64b5f6;
  border-radius: 6px;
  border: 2px dashed rgba(33, 150, 243, 0.5);
  font-size: 14px;
}

/* 进出场照片单元格 */
.entry-photos-cell {
  padding: 8px;
  max-width: 200px;
  min-width: 200px;
}

.entry-photos-cell .photo-gallery {
  display: flex;
  align-items: center;
  gap: 8px;
  flex-wrap: wrap;
}

.entry-photo-thumb {
  width: 70px;
  height: 50px;
  object-fit: cover;
  border-radius: 8px;
  border: 2px solid rgba(0, 229, 255, 0.3);
  cursor: pointer;
  transition: all 0.3s ease;
  box-shadow: 0 2px 8px rgba(0, 229, 255, 0.2);
}

.entry-photo-thumb:hover {
  transform: scale(1.1);
  border-color: #00E5FF;
  box-shadow: 0 4px 16px rgba(0, 229, 255, 0.4);
  z-index: 10;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
}

/* 特殊字段样式 */
.license-color-badge {
  display: inline-flex;
  align-items: center;
  gap: 6px;
  padding: 4px 8px;
  background: rgba(255, 255, 255, 0.05);
  border-radius: 6px;
  font-size: 13px;
  color: #fff;
}

.color-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  border: 1px solid rgba(255, 255, 255, 0.3);
  flex-shrink: 0;
}

.car-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background: rgba(33, 150, 243, 0.2);
  color: #64b5f6;
  border-radius: 6px;
  font-size: 13px;
  border: 1px solid rgba(33, 150, 243, 0.3);
}

.vip-type-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background: rgba(255, 193, 7, 0.2);
  color: #ffca28;
  border-radius: 6px;
  font-size: 13px;
  border: 1px solid rgba(255, 193, 7, 0.3);
  font-weight: 500;
}

.amount-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
  border-radius: 6px;
  font-size: 13px;
  border: 1px solid rgba(76, 175, 80, 0.3);
  font-weight: 500;
}

.duration-badge {
  display: inline-flex;
  align-items: center;
  padding: 4px 8px;
  background: rgba(255, 152, 0, 0.2);
  color: #ffa726;
  border-radius: 6px;
  font-size: 13px;
  border: 1px solid rgba(255, 152, 0, 0.3);
  font-weight: 500;
}

.photo-more-badge:hover {
  background: rgba(33, 150, 243, 0.35);
  border-color: #2196f3;
  color: #90caf9;
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(33, 150, 243, 0.5);
}

/* 预约访客标签 */
.reservation-tag {
  align-self: flex-start;
  padding: 3px 10px;
  border-radius: 12px;
  font-size: 11px;
  font-weight: 500;
  margin-top: 4px;
}

.reserved-tag {
  background: rgba(76, 175, 80, 0.2);
  color: #66bb6a;
  border: 1px solid rgba(76, 175, 80, 0.4);
}

/* 纯访客样式 */
.reservation-pure {
  padding: 8px 12px;
  background: rgba(255, 152, 0, 0.1);
  border-radius: 6px;
  border-left: 3px solid #ff9800;
}

.pure-visitor-tag {
  font-size: 13px;
  color: #ffa726;
  font-weight: 500;
}

/* 无预约样式 */
.reservation-none {
  color: rgba(255, 255, 255, 0.3);
  font-size: 14px;
}

/* 敏感数据样式 */
.sensitive-data {
  display: inline-block;
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  letter-spacing: 2px;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

/* 手机号样式 - 强制应用到第5列 */
.detail-table tbody tr td:nth-child(5) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.detail-table tbody tr td:nth-child(5) span {
  display: inline-block;
  background: linear-gradient(135deg, rgba(103, 58, 183, 0.15), rgba(103, 58, 183, 0.25));
  color: #ba68c8;
  border: 1px solid rgba(103, 58, 183, 0.3);
  border-left: 3px solid #9c27b0;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 2px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.detail-table tbody tr td:nth-child(5) span:hover {
  background: linear-gradient(135deg, rgba(103, 58, 183, 0.25), rgba(103, 58, 183, 0.35));
  box-shadow: 0 2px 8px rgba(103, 58, 183, 0.3);
}

/* 身份证号样式 - 强制应用到第6列 */
.detail-table tbody tr td:nth-child(6) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
}

.detail-table tbody tr td:nth-child(6) span {
  display: inline-block;
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.15), rgba(255, 152, 0, 0.25));
  color: #ffb74d;
  border: 1px solid rgba(255, 152, 0, 0.3);
  border-left: 3px solid #ff9800;
  padding: 6px 12px;
  border-radius: 6px;
  font-size: 13px;
  font-weight: 500;
  letter-spacing: 2px;
  box-shadow: inset 0 1px 3px rgba(0, 0, 0, 0.2);
  transition: all 0.3s ease;
}

.detail-table tbody tr td:nth-child(6) span:hover {
  background: linear-gradient(135deg, rgba(255, 152, 0, 0.25), rgba(255, 152, 0, 0.35));
  box-shadow: 0 2px 8px rgba(255, 152, 0, 0.3);
}

/* 进场时间样式 - 应用到第9列 */
.detail-table tbody tr td:nth-child(9) {
  font-family: 'Consolas', 'Monaco', 'Courier New', monospace;
  font-weight: 500;
  color: #81c784;
  font-size: 13px;
  letter-spacing: 0.5px;
}

/* 分页 */
.detail-modal__footer {
  padding: 16px 24px;
  background: rgba(255, 255, 255, 0.02);
  border-top: 1px solid rgba(79, 210, 221, 0.3);
}

.detail-modal__footer .pagination {
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 12px;
}

.detail-modal__footer .page-btn {
  padding: 8px 16px;
  font-size: 14px;
  color: #fff;
  background: linear-gradient(135deg, rgba(79, 210, 221, 0.2), rgba(61, 168, 179, 0.2));
  border: 1px solid rgba(79, 210, 221, 0.4);
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
  min-width: 80px;
}

.detail-modal__footer .page-btn:hover:not([disabled]) {
  background: linear-gradient(135deg, rgba(79, 210, 221, 0.4), rgba(61, 168, 179, 0.4));
  border-color: #4fd2dd;
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(79, 210, 221, 0.3);
}

.detail-modal__footer .page-btn[disabled] {
  opacity: 0.3;
  cursor: not-allowed;
  background: rgba(255, 255, 255, 0.05);
  border-color: rgba(255, 255, 255, 0.1);
}

.detail-modal__footer .page-info {
  color: #4fd2dd;
  font-size: 14px;
  font-weight: 600;
  padding: 0 16px;
  min-width: 80px;
  text-align: center;
}

.detail-modal__footer .page-size-selector {
  display: flex;
  align-items: center;
  gap: 8px;
  color: #8b9cad;
  font-size: 14px;
  margin-left: 16px;
}

.detail-modal__footer .page-size-selector select {
  padding: 6px 12px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(79, 210, 221, 0.3);
  border-radius: 4px;
  color: #fff;
  cursor: pointer;
  transition: all 0.3s;
}

.detail-modal__footer .page-size-selector select:hover {
  border-color: #4fd2dd;
  background: rgba(255, 255, 255, 0.1);
}

.detail-modal__footer .page-size-selector select:focus {
  outline: none;
  border-color: #4fd2dd;
  box-shadow: 0 0 8px rgba(79, 210, 221, 0.3);
}

.detail-modal__footer .page-size-selector select option {
  background: #1a2332;
  color: #fff;
  padding: 8px;
}

.detail-modal__footer .page-total {
  margin-left: auto;
  color: #8b9cad;
  font-size: 14px;
}

/* KPI卡片添加cursor指针 */
.vehicle-kpi-card,
.face-kpi-card {
  cursor: pointer;
  transition: all 0.3s;
}

.vehicle-kpi-card:hover,
.face-kpi-card:hover {
  transform: translateY(-4px);
  box-shadow: 0 8px 20px rgba(79, 210, 221, 0.3);
}

/* 图片预览弹窗 */
.photo-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  animation: fadeIn 0.3s ease;
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }

  to {
    opacity: 1;
  }
}

/* 加载动画 */
@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}

.photo-preview-content {
  position: relative;
  max-width: 90vw;
  max-height: 90vh;
  display: flex;
  align-items: center;
  justify-content: center;
  animation: zoomIn 0.3s ease;
}

@keyframes zoomIn {
  from {
    transform: scale(0.8);
    opacity: 0;
  }

  to {
    transform: scale(1);
    opacity: 1;
  }
}

.photo-preview-image {
  max-width: 100%;
  max-height: 90vh;
  object-fit: contain;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.photo-preview-close {
  position: absolute;
  top: -50px;
  right: 0;
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 2px solid rgba(255, 255, 255, 0.3);
  border-radius: 50%;
  color: #fff;
  font-size: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  backdrop-filter: blur(10px);
}

.photo-preview-close:hover {
  background: rgba(255, 255, 255, 0.2);
  border-color: rgba(255, 255, 255, 0.5);
  transform: rotate(90deg);
}

/* 排行榜弹窗样式 */
.ranking-modal-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.75);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 2000;
  backdrop-filter: blur(8px);
  animation: fadeIn 0.3s ease;
}

.ranking-modal {
  width: 90%;
  max-width: 1000px;
  max-height: 85vh;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%);
  border-radius: 16px;
  border: 1px solid rgba(59, 130, 246, 0.3);
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  display: flex;
  flex-direction: column;
  animation: slideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1);
}

.ranking-modal__header {
  padding: 20px 24px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
  background: linear-gradient(135deg, rgba(59, 130, 246, 0.1) 0%, rgba(59, 130, 246, 0.05) 100%);
  border-radius: 16px 16px 0 0;
}

.ranking-modal__title {
  font-size: 20px;
  font-weight: 700;
  color: #e2e8f0;
  display: flex;
  align-items: center;
  gap: 8px;
}

.ranking-modal__close {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: rgba(239, 68, 68, 0.2);
  border: 1px solid rgba(239, 68, 68, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s ease;
  color: #ef4444;
  font-size: 18px;
  font-weight: bold;

  &:hover {
    background: rgba(239, 68, 68, 0.3);
    border-color: rgba(239, 68, 68, 0.6);
    transform: rotate(90deg) scale(1.1);
  }
}

.ranking-modal__toolbar {
  padding: 16px 24px;
  border-bottom: 1px solid rgba(59, 130, 246, 0.1);
  display: flex;
  align-items: center;
  gap: 20px;
  flex-wrap: wrap;
  background: rgba(15, 23, 42, 0.5);
}

.toolbar-item {
  display: flex;
  align-items: center;
  gap: 8px;

  label {
    color: #94a3b8;
    font-size: 13px;
    font-weight: 500;
  }

  select {
    padding: 6px 12px;
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 6px;
    color: #e2e8f0;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.3s ease;

    &:hover {
      border-color: rgba(59, 130, 246, 0.5);
      background: rgba(30, 41, 59, 0.9);
    }

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }
  }
}

.toolbar-item-date {
  .date-input {
    padding: 6px 12px;
    background: rgba(30, 41, 59, 0.8);
    border: 1px solid rgba(59, 130, 246, 0.3);
    border-radius: 6px;
    color: #e2e8f0;
    font-size: 12px;
    cursor: pointer;
    transition: all 0.3s ease;
    min-width: 140px;

    &:hover {
      border-color: rgba(59, 130, 246, 0.5);
      background: rgba(30, 41, 59, 0.9);
    }

    &:focus {
      outline: none;
      border-color: #3b82f6;
      box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.2);
    }

    /* 日期选择器的下拉日历样式 */
    &::-webkit-calendar-picker-indicator {
      filter: invert(0.8);
      cursor: pointer;
    }
  }
}

.toolbar-tabs {
  display: flex;
  gap: 8px;
}

.tab-btn {
  padding: 6px 16px;
  background: rgba(30, 41, 59, 0.6);
  border: 1px solid rgba(59, 130, 246, 0.2);
  border-radius: 6px;
  color: #94a3b8;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: rgba(59, 130, 246, 0.15);
    color: #e2e8f0;
    border-color: rgba(59, 130, 246, 0.4);
  }

  &.active {
    background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
    color: white;
    border-color: #3b82f6;
    box-shadow: 0 2px 8px rgba(59, 130, 246, 0.4);
  }
}

.ranking-modal__body {
  flex: 1;
  overflow-y: auto;
  padding: 20px 24px;
}

.ranking-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 20px;
}

.loading-text {
  color: #94a3b8;
  font-size: 14px;
}

.ranking-table {
  width: 100%;
}

.ranking-table-header {
  display: grid;
  grid-template-columns: 80px 180px 200px 120px 150px 100px;
  gap: 12px;
  padding: 12px 16px;
  background: rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  margin-bottom: 12px;

  &.ranking-table-header:has(.channel) {
    grid-template-columns: 80px 1.5fr 120px 120px 120px 100px;
  }
}

.header-cell {
  color: #94a3b8;
  font-size: 12px;
  font-weight: 700;
  text-transform: uppercase;
  letter-spacing: 0.5px;
  text-align: center;

  &.rank {
    text-align: center;
  }

  &.plate,
  &.channel {
    text-align: left;
  }
}

.ranking-table-body {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.ranking-row {
  display: grid;
  grid-template-columns: 80px 180px 200px 120px 150px 100px;
  gap: 12px;
  padding: 14px 16px;
  background: rgba(30, 41, 59, 0.4);
  border: 1px solid rgba(59, 130, 246, 0.1);
  border-radius: 8px;
  transition: all 0.3s ease;
  align-items: center;

  &:has(.channel-badge) {
    grid-template-columns: 80px 1.5fr 120px 120px 120px 100px;
  }

  &.top-three {
    background: linear-gradient(135deg, rgba(59, 130, 246, 0.12) 0%, rgba(59, 130, 246, 0.06) 100%);
    border-color: rgba(59, 130, 246, 0.3);
  }

  &.abnormal {
    border-left: 3px solid #ef4444;
    background: linear-gradient(135deg, rgba(239, 68, 68, 0.08) 0%, rgba(239, 68, 68, 0.04) 100%);
  }

  &:hover {
    background: rgba(59, 130, 246, 0.15);
    border-color: rgba(59, 130, 246, 0.4);
    transform: translateX(4px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
  }
}

.cell {
  color: #e2e8f0;
  font-size: 13px;
  text-align: center;

  &.rank {
    display: flex;
    align-items: center;
    justify-content: center;
  }

  &.plate,
  &.channel,
  &.owner {
    text-align: left;
    display: flex;
    align-items: center;
    gap: 8px;
  }
}

.medal {
  font-size: 24px;
  filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.3));
}

.rank-number {
  font-size: 16px;
  font-weight: 700;
  color: #64748b;
}

.plate-number {
  font-family: 'Consolas', 'Monaco', monospace;
  font-size: 14px;
  font-weight: 700;
  color: #60a5fa;
  background: rgba(59, 130, 246, 0.15);
  padding: 4px 10px;
  border-radius: 4px;
  letter-spacing: 1px;
}

.channel-badge {
  font-size: 13px;
  font-weight: 600;
  color: #34d399;
  background: rgba(16, 185, 129, 0.15);
  padding: 4px 10px;
  border-radius: 4px;
}

.count-badge,
.total-badge {
  display: inline-block;
  padding: 4px 12px;
  background: linear-gradient(135deg, #8b5cf6 0%, #6d28d9 100%);
  color: white;
  border-radius: 12px;
  font-weight: 700;
  font-size: 13px;
  box-shadow: 0 2px 8px rgba(139, 92, 246, 0.3);
}

.abnormal-tag {
  font-size: 11px;
  color: #ef4444;
  background: rgba(239, 68, 68, 0.2);
  padding: 2px 8px;
  border-radius: 10px;
  font-weight: 600;
}

.detail-btn {
  padding: 6px 14px;
  background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 12px;
  font-weight: 600;
  cursor: pointer;
  transition: all 0.3s ease;
  white-space: nowrap;

  &:hover {
    background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
    transform: translateY(-1px);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4);
  }

  &:active {
    transform: translateY(0);
  }
}

.ranking-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60px 20px;
  gap: 16px;

  .empty-icon {
    font-size: 64px;
    opacity: 0.3;
  }

  .empty-text {
    color: #64748b;
    font-size: 16px;
  }
}

/* 业主信息样式 */
.owner-info {
  display: flex;
  flex-direction: column;
  gap: 2px;
  font-size: 11px;
  
  .owner-name {
    color: #60a5fa;
    font-weight: 600;
  }
  
  .owner-phone {
    color: #34d399;
    font-weight: 500;
  }
  
  .owner-type {
    color: #a78bfa;
    font-weight: 500;
    font-size: 10px;
  }
}

.owner-unknown {
  display: flex;
  align-items: center;
  justify-content: center;
  
  .unknown-text {
    color: #64748b;
    font-size: 11px;
    font-style: italic;
    opacity: 0.7;
  }
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(30px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

/* 进出记录类型选择弹窗样式 */
.record-type-selector-mask {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;
}

.record-type-selector {
  width: 500px;
  background: linear-gradient(135deg, #1a1f3a 0%, #2d3561 100%);
  border-radius: 16px;
  border: 2px solid rgba(100, 200, 255, 0.3);
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.5),
    0 0 60px rgba(100, 200, 255, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  overflow: hidden;
  animation: slideUp 0.4s ease;
}

.selector-header {
  padding: 20px 24px;
  background: linear-gradient(135deg, rgba(100, 200, 255, 0.15) 0%, rgba(60, 150, 255, 0.1) 100%);
  border-bottom: 1px solid rgba(100, 200, 255, 0.2);
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.selector-header h3 {
  margin: 0;
  font-size: 20px;
  font-weight: 600;
  color: #64c8ff;
  text-shadow: 0 2px 8px rgba(100, 200, 255, 0.3);
}

.selector-header .close-btn {
  width: 32px;
  height: 32px;
  border: none;
  background: rgba(255, 255, 255, 0.1);
  color: #fff;
  font-size: 20px;
  border-radius: 8px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.selector-header .close-btn:hover {
  background: rgba(255, 100, 100, 0.3);
  transform: rotate(90deg);
}

.selector-body {
  padding: 32px 24px;
}

.vehicle-info {
  text-align: center;
  margin-bottom: 32px;
  padding: 24px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%);
  border-radius: 12px;
  border: 1px solid rgba(100, 200, 255, 0.2);
}

.vehicle-info .plate-label {
  margin: 0 0 12px 0;
  font-size: 14px;
  color: #94a3b8;
  text-transform: uppercase;
  letter-spacing: 1px;
}

.vehicle-info .plate-value {
  margin: 0;
  font-size: 32px;
  font-weight: 700;
  letter-spacing: 4px;
  text-shadow: 0 2px 12px rgba(100, 200, 255, 0.4);
  padding: 12px 24px;
  border-radius: 8px;
  display: inline-block;
}

.record-stats {
  display: grid;
  grid-template-columns: repeat(3, 1fr);
  gap: 16px;
  margin-bottom: 32px;
}

.stat-item {
  text-align: center;
  padding: 16px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%);
  border-radius: 10px;
  border: 1px solid rgba(100, 200, 255, 0.15);
  transition: all 0.3s ease;
}

.stat-item:hover {
  transform: translateY(-2px);
  border-color: rgba(100, 200, 255, 0.4);
  box-shadow: 0 4px 16px rgba(100, 200, 255, 0.2);
}

.stat-label {
  display: block;
  font-size: 12px;
  color: #94a3b8;
  margin-bottom: 8px;
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.stat-value {
  display: block;
  font-size: 28px;
  font-weight: 700;
  text-shadow: 0 2px 8px currentColor;
}

.stat-value.entry {
  color: #4ade80;
}

.stat-value.exit {
  color: #f87171;
}

.stat-value.total {
  color: #60a5fa;
}

.selector-actions {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
}

.action-btn {
  padding: 20px 24px;
  border: 2px solid;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
  position: relative;
  overflow: hidden;
}

.action-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.action-btn:hover::before {
  left: 100%;
}

.action-btn .btn-icon {
  font-size: 48px;
  filter: drop-shadow(0 4px 8px currentColor);
}

.action-btn .btn-text {
  font-size: 16px;
  font-weight: 600;
  letter-spacing: 1px;
}

.entry-btn {
  border-color: rgba(74, 222, 128, 0.4);
  color: #4ade80;
}

.entry-btn:hover {
  border-color: #4ade80;
  background: linear-gradient(135deg, rgba(74, 222, 128, 0.15) 0%, rgba(74, 222, 128, 0.1) 100%);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(74, 222, 128, 0.3);
}

.exit-btn {
  border-color: rgba(248, 113, 113, 0.4);
  color: #f87171;
}

.exit-btn:hover {
  border-color: #f87171;
  background: linear-gradient(135deg, rgba(248, 113, 113, 0.15) 0%, rgba(248, 113, 113, 0.1) 100%);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(248, 113, 113, 0.3);
}

@keyframes slideUp {
  from {
    opacity: 0;
    transform: translateY(50px) scale(0.9);
  }
  to {
    opacity: 1;
    transform: translateY(0) scale(1);
  }
}

/* 大数据量警告弹窗样式 */
.large-data-warning-mask {
  position: fixed;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(8px);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10000;
  animation: fadeIn 0.3s ease;
}

.large-data-warning-modal {
  width: 90%;
  max-width: 600px;
  background: linear-gradient(135deg, rgba(15, 23, 42, 0.98) 0%, rgba(30, 41, 59, 0.95) 100%);
  border: 2px solid rgba(251, 191, 36, 0.5);
  border-radius: 16px;
  box-shadow: 
    0 20px 60px rgba(0, 0, 0, 0.5),
    0 0 40px rgba(251, 191, 36, 0.2),
    inset 0 1px 0 rgba(255, 255, 255, 0.1);
  overflow: hidden;
  animation: slideUp 0.4s cubic-bezier(0.34, 1.56, 0.64, 1);
}

.warning-modal__header {
  display: flex;
  align-items: center;
  gap: 12px;
  padding: 24px 28px;
  background: linear-gradient(135deg, rgba(251, 191, 36, 0.15) 0%, rgba(245, 158, 11, 0.1) 100%);
  border-bottom: 1px solid rgba(251, 191, 36, 0.3);
  position: relative;
}

.warning-icon {
  font-size: 32px;
  filter: drop-shadow(0 4px 12px rgba(251, 191, 36, 0.6));
  animation: pulse 2s infinite;
}

@keyframes pulse {
  0%, 100% {
    transform: scale(1);
  }
  50% {
    transform: scale(1.1);
  }
}

.warning-title {
  flex: 1;
  margin: 0;
  font-size: 22px;
  font-weight: 600;
  color: #fbbf24;
  text-shadow: 0 2px 8px rgba(251, 191, 36, 0.4);
}

.warning-close {
  width: 36px;
  height: 36px;
  display: flex;
  align-items: center;
  justify-content: center;
  background: rgba(251, 191, 36, 0.1);
  border: 1px solid rgba(251, 191, 36, 0.3);
  border-radius: 8px;
  color: #fbbf24;
  font-size: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.warning-close:hover {
  background: rgba(251, 191, 36, 0.2);
  border-color: #fbbf24;
  transform: rotate(90deg);
}

.warning-modal__body {
  padding: 28px;
}

.warning-info {
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%);
  border: 1px solid rgba(251, 191, 36, 0.2);
  border-radius: 12px;
  padding: 20px;
  margin-bottom: 24px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 0;
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.info-row:last-child {
  border-bottom: none;
}

.info-row.highlight {
  background: linear-gradient(90deg, rgba(251, 191, 36, 0.1) 0%, transparent 100%);
  padding: 16px 12px;
  margin: 8px -12px -12px;
  border-radius: 0 0 8px 8px;
  border-bottom: none;
}

.info-label {
  font-size: 14px;
  color: #94a3b8;
  font-weight: 500;
}

.info-value {
  font-size: 16px;
  color: #e2e8f0;
  font-weight: 600;
}

.info-value.large {
  font-size: 24px;
  color: #fbbf24;
  text-shadow: 0 2px 8px rgba(251, 191, 36, 0.4);
}

.warning-message {
  color: #cbd5e1;
  line-height: 1.8;
}

.warning-message p {
  margin: 8px 0;
  font-size: 14px;
}

.warning-message p:first-child {
  color: #fbbf24;
  font-weight: 500;
}

.warning-modal__footer {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 16px;
  padding: 20px 28px 28px;
  background: linear-gradient(180deg, rgba(0, 0, 0, 0.1) 0%, transparent 100%);
}

.warning-btn {
  padding: 20px 16px;
  border: 2px solid;
  border-radius: 12px;
  background: linear-gradient(135deg, rgba(0, 0, 0, 0.3) 0%, rgba(0, 0, 0, 0.2) 100%);
  cursor: pointer;
  transition: all 0.3s ease;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 6px;
  position: relative;
  overflow: hidden;
}

.warning-btn::before {
  content: '';
  position: absolute;
  top: 0;
  left: -100%;
  width: 100%;
  height: 100%;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
  transition: left 0.5s ease;
}

.warning-btn:hover::before {
  left: 100%;
}

.warning-btn .btn-icon {
  font-size: 36px;
  filter: drop-shadow(0 4px 8px currentColor);
}

.warning-btn .btn-text {
  font-size: 16px;
  font-weight: 600;
}

.warning-btn .btn-desc {
  font-size: 12px;
  color: #94a3b8;
  font-weight: 400;
}

.summary-btn {
  border-color: rgba(139, 92, 246, 0.4);
  color: #a78bfa;
}

.summary-btn:hover {
  border-color: #a78bfa;
  background: linear-gradient(135deg, rgba(139, 92, 246, 0.15) 0%, rgba(139, 92, 246, 0.1) 100%);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(139, 92, 246, 0.3);
}

.records-btn {
  border-color: rgba(34, 197, 94, 0.4);
  color: #4ade80;
}

.records-btn:hover {
  border-color: #4ade80;
  background: linear-gradient(135deg, rgba(34, 197, 94, 0.15) 0%, rgba(34, 197, 94, 0.1) 100%);
  transform: translateY(-4px);
  box-shadow: 0 8px 24px rgba(34, 197, 94, 0.3);
}

@keyframes fadeIn {
  from {
    opacity: 0;
  }
  to {
    opacity: 1;
  }
}
</style>