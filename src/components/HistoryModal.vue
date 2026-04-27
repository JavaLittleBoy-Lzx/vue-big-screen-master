<template>
  <div class="history-modal">
    <div class="modal-overlay" @click="$emit('close')"></div>
    
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <div class="header-left">
          <span class="modal-icon">{{ getTypeIcon }}</span>
          <span class="modal-title">{{ getTypeTitle }}</span>
        </div>
        <button class="btn-close" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <div class="history-info">
          <div class="info-item">
            <span class="label">关注对象：</span>
            <span class="value">{{ formatWatchValue() }}</span>
          </div>
          <div class="info-item" v-if="watchItem.remark">
            <span class="label">备注：</span>
            <span class="value">{{ watchItem.remark }}</span>
          </div>
        </div>

        <!-- 加载状态 -->
        <div v-if="loading" class="loading-state">
          <div class="loading-spinner"></div>
          <p>加载进出场记录中...</p>
        </div>

        <!-- 记录列表 -->
        <div v-else-if="records.length > 0" class="records-container">
          <div class="records-header">
            <span>共找到 {{ total }} 条记录</span>
          </div>
          
          <div class="records-list">
            <div v-for="record in records" :key="record.id" class="record-item">
              <!-- 基本信息区块 -->
              <div class="info-block basic-info">
                <div class="block-header">
                  <span class="block-icon">🚗</span>
                  <span class="block-title">基本信息</span>
                </div>
                <div class="block-content">
                  <div class="info-row">
                    <span class="label">时间：</span>
                    <span class="value">{{ formatDateTime(record.eventTime) }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">类型：</span>
                    <span class="value event-type" :class="record.eventType">{{ record.eventType === 'entry' ? '进场' : '出场' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">通道：</span>
                    <span class="value">{{ record.channelName || '未知通道' }}</span>
                  </div>
                  <div class="info-row" v-if="record.watchValue && record.alertType === 'vehicle'">
                    <span class="label">车牌号：</span>
                    <span class="value plate-number">{{ record.watchValue }}</span>
                  </div>
                </div>
              </div>

              <!-- 人员信息区块 -->
              <div class="info-block person-info" v-if="record.personName || record.department || record.phoneNo">
                <div class="block-header">
                  <span class="block-icon">👤</span>
                  <span class="block-title">人员信息</span>
                </div>
                <div class="block-content">
                  <div class="info-row" v-if="record.personName">
                    <span class="label">姓名：</span>
                    <span class="value">{{ record.personName }}</span>
                  </div>
                  <div class="info-row" v-if="record.alertType === 'person' && record.watchValue">
                    <span class="label">身份证：</span>
                    <span class="value">{{ formatIdCard(record.watchValue) }}</span>
                  </div>
                  <div class="info-row" v-if="record.department">
                    <span class="label">部门：</span>
                    <span class="value">{{ record.department }}</span>
                  </div>
                  <div class="info-row" v-if="record.phoneNo">
                    <span class="label">联系电话：</span>
                    <span class="value">{{ formatPhone(record.phoneNo) }}</span>
                  </div>
                </div>
              </div>

              <!-- 预约信息区块 -->
              <div class="info-block reservation-info" v-if="record.reservationPerson || record.reservationReason || record.visitorReservationTimeRange">
                <div class="block-header">
                  <span class="block-icon">📅</span>
                  <span class="block-title">预约信息</span>
                </div>
                <div class="block-content">
                  <div class="info-row" v-if="record.reservationPerson">
                    <span class="label">预约人：</span>
                    <span class="value">{{ record.reservationPerson }}</span>
                  </div>
                  <div class="info-row" v-if="record.reservationPhone">
                    <span class="label">联系电话：</span>
                    <span class="value">{{ formatPhone(record.reservationPhone) }}</span>
                  </div>
                  <div class="info-row" v-if="record.reservationReason">
                    <span class="label">预约事由：</span>
                    <span class="value">{{ record.reservationReason }}</span>
                  </div>
                  <div class="info-row" v-if="record.visitorReservationTimeRange">
                    <span class="label">预约时段：</span>
                    <span class="value">{{ record.visitorReservationTimeRange }}</span>
                  </div>
                  <div class="info-row" v-if="record.visitorVipType">
                    <span class="label">VIP类型：</span>
                    <span class="value vip-type">{{ record.visitorVipType }}</span>
                  </div>
                </div>
              </div>

              <!-- 被访信息区块 -->
              <div class="info-block visit-info" v-if="record.reservationPerson">
                <div class="block-header">
                  <span class="block-icon">🏢</span>
                  <span class="block-title">被访信息</span>
                </div>
                <div class="block-content">
                  <div class="info-row">
                    <span class="label">被访人：</span>
                    <span class="value">{{ record.reservationPerson }}</span>
                  </div>
                  <div class="info-row" v-if="record.department">
                    <span class="label">所属部门：</span>
                    <span class="value">{{ record.department }}</span>
                  </div>
                </div>
              </div>

              <!-- 进场信息区块 -->
              <div class="info-block entry-info">
                <div class="block-header">
                  <span class="block-icon">🚪</span>
                  <span class="block-title">进场信息</span>
                </div>
                <div class="block-content">
                  <div class="info-row">
                    <span class="label">进场通道：</span>
                    <span class="value">{{ record.channelName || '未知通道' }}</span>
                  </div>
                  <div class="info-row">
                    <span class="label">进场时间：</span>
                    <span class="value">{{ formatDateTime(record.eventTime) }}</span>
                  </div>
                  <div class="info-row" v-if="record.watchValue && record.alertType === 'vehicle'">
                    <span class="label">车牌号码：</span>
                    <span class="value plate-number">{{ record.watchValue }}</span>
                  </div>
                  <div class="info-row" v-if="record.stoppingTime">
                    <span class="label">停留时长：</span>
                    <span class="value">{{ record.stoppingTime }}</span>
                  </div>
                </div>
              </div>
              
              <!-- 照片区块 -->
              <div class="record-photo" v-if="record.photoUrl" @click="previewImage(record.photoUrl)">
                <img :src="record.photoUrl" alt="进出场照片" @error="handleImageError">
              </div>
            </div>
          </div>
          
          <!-- 分页 -->
          <div v-if="total > pageSize" class="pagination">
            <button class="page-btn" :disabled="currentPage === 1" @click="changePage(currentPage - 1)">上一页</button>
            <span class="page-info">第 {{ currentPage }} / {{ totalPages }} 页</span>
            <button class="page-btn" :disabled="currentPage === totalPages" @click="changePage(currentPage + 1)">下一页</button>
          </div>
        </div>

        <!-- 空状态 -->
        <div v-else class="empty-state">
          <span class="empty-icon">📭</span>
          <p>暂无进出场记录</p>
        </div>
      </div>
      
      <!-- 图片预览 -->
      <transition name="fade">
        <div v-if="showImagePreview" class="image-preview" @click="closeImagePreview">
          <img :src="previewImageUrl" alt="预览图片" @click.stop>
          <button class="btn-close-preview" @click="closeImagePreview">×</button>
        </div>
      </transition>
    </div>
  </div>
</template>

<script>
import { focusAlertService } from '@/services/focusAlertService';

export default {
  name: 'HistoryModal',
  props: {
    watchItem: {
      type: Object,
      required: true
    }
  },
  data() {
    return {
      loading: false,
      records: [],
      total: 0,
      currentPage: 1,
      pageSize: 20,
      showImagePreview: false,
      previewImageUrl: ''
    };
  },
  computed: {
    watchType() {
      return this.watchItem.watchType || this.watchItem.watch_type;
    },
    watchValue() {
      return this.watchItem.watchValue || this.watchItem.watch_value;
    },
    getTypeIcon() {
      return this.watchType === 'idcard' ? '👤' : '🚗';
    },
    getTypeTitle() {
      const type = this.watchType === 'idcard' ? '身份证号' : '车牌号';
      return `${type}进出记录`;
    },
    totalPages() {
      return Math.ceil(this.total / this.pageSize);
    }
  },
  mounted() {
    this.loadRecords();
  },
  methods: {
    async loadRecords() {
      this.loading = true;
      try {
        const data = await focusAlertService.getRecordsByWatch(
          this.watchType,
          this.watchValue,
          this.currentPage,
          this.pageSize
        );
        this.records = data.list || data.records || [];
        this.total = data.total || 0;
        console.log('✅ 加载进出场记录成功:', this.records.length, '条');
      } catch (error) {
        console.error('❌ 加载进出场记录失败:', error);
        this.records = [];
        this.total = 0;
      } finally {
        this.loading = false;
      }
    },
    
    changePage(page) {
      if (page < 1 || page > this.totalPages) return;
      this.currentPage = page;
      this.loadRecords();
    },
    
    formatDateTime(dateTime) {
      if (!dateTime) return '-';
      const date = new Date(dateTime);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      return `${month}/${day} ${hours}:${minutes}`;
    },
    
    previewImage(url) {
      this.previewImageUrl = url;
      this.showImagePreview = true;
    },
    
    closeImagePreview() {
      this.showImagePreview = false;
    },
    
    handleImageError(e) {
      e.target.style.display = 'none';
    },
    
    formatPhone(phone) {
      if (!phone) return '未填写';
      if (phone.length === 11) {
        return phone.replace(/(\d{3})(\d{4})(\d{4})/, '$1****$3');
      }
      return phone;
    },
    
    formatIdCard(idCard) {
      if (!idCard) return '未填写';
      if (idCard.length === 18) {
        return idCard.replace(/(\d{6})\d{8}(\d{4})/, '$1********$2');
      }
      return idCard;
    },
    
    formatWatchValue() {
      const value = this.watchItem.watchValue || this.watchItem.watch_value;
      if (!value) return '未知';
      
      // 如果是身份证号，进行加密显示
      if (this.watchType === 'idcard' && value.length === 18) {
        return this.formatIdCard(value);
      }
      
      // 车牌号正常显示
      return value;
    }
  }
};
</script>

<style scoped>
.history-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.modal-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 800px;
  max-height: 80vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid rgba(0, 255, 255, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 255, 255, 0.2);
  display: flex;
  flex-direction: column;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 255, 255, 0.2);
}

.header-left {
  display: flex;
  align-items: center;
  gap: 12px;
}

.modal-icon {
  font-size: 28px;
}

.modal-title {
  font-size: 20px;
  font-weight: bold;
  color: #00ffff;
}

.modal-subtitle {
  font-size: 18px;
  color: rgba(255, 255, 255, 0.8);
  letter-spacing: 1px;
}

.btn-close {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-close:hover {
  background: rgba(255, 0, 0, 0.2);
  border-color: rgba(255, 0, 0, 0.4);
}

.modal-body {
  padding: 24px;
  overflow-y: auto;
}

.history-info {
  background: rgba(0, 201, 255, 0.1);
  border: 1px solid rgba(0, 201, 255, 0.2);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 20px;
}

.info-item {
  display: flex;
  gap: 12px;
  margin-bottom: 8px;
  font-size: 14px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.label {
  color: rgba(255, 255, 255, 0.6);
  min-width: 80px;
}

.value {
  color: white;
  font-weight: bold;
}

.hint-text {
  background: rgba(255, 193, 7, 0.1);
  border: 1px solid rgba(255, 193, 7, 0.3);
  border-radius: 8px;
  padding: 16px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  line-height: 1.6;
}

.modal-body::-webkit-scrollbar {
  width: 6px;
}

.modal-body::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.modal-body::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 255, 0.3);
  border-radius: 3px;
}

/* 加载状态 */
.loading-state {
  text-align: center;
  padding: 40px;
  color: rgba(255, 255, 255, 0.6);
}

.loading-spinner {
  width: 40px;
  height: 40px;
  margin: 0 auto 16px;
  border: 3px solid rgba(0, 255, 255, 0.2);
  border-top-color: #00ffff;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  to { transform: rotate(360deg); }
}

/* 记录容器 */
.records-container {
  margin-top: 20px;
}

.records-header {
  padding: 12px;
  background: rgba(0, 201, 255, 0.1);
  border: 1px solid rgba(0, 201, 255, 0.2);
  border-radius: 8px;
  margin-bottom: 16px;
  text-align: center;
  color: #00ffff;
  font-weight: bold;
}

.records-list {
  max-height: 400px;
  overflow-y: auto;
  scrollbar-width: none; /* Firefox */
  -ms-overflow-style: none; /* IE and Edge */
}

.records-list::-webkit-scrollbar {
  display: none; /* Chrome, Safari and Opera */
}

.record-item {
  background: rgba(255, 255, 255, 0.02);
  border: 1px solid rgba(255, 255, 255, 0.08);
  border-radius: 12px;
  padding: 0;
  margin-bottom: 20px;
  transition: all 0.3s;
  overflow: hidden;
}

.record-item:hover {
  background: rgba(255, 255, 255, 0.04);
  border-color: rgba(0, 255, 255, 0.2);
  transform: translateY(-2px);
  box-shadow: 0 8px 25px rgba(0, 255, 255, 0.1);
}

/* 信息块样式 */
.info-block {
  margin-bottom: 0;
  border-radius: 0;
  border: none;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
  background: transparent;
}

.info-block:last-child {
  border-bottom: none;
}

.block-header {
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 12px 16px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(255, 255, 255, 0.05);
}

.block-icon {
  font-size: 16px;
}

.block-title {
  font-size: 14px;
  font-weight: bold;
  color: #00ffff;
  text-shadow: 0 0 4px rgba(0, 255, 255, 0.3);
}

.block-content {
  padding: 12px 16px;
}

.info-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
  font-size: 14px;
  line-height: 1.4;
}

.info-row:last-child {
  margin-bottom: 0;
}

.info-row .label {
  color: rgba(255, 255, 255, 0.7);
  min-width: 80px;
  flex-shrink: 0;
  font-weight: 500;
}

.info-row .value {
  color: #ffffff;
  text-align: right;
  flex: 1;
  font-weight: 600;
}

.record-type {
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 14px;
  font-weight: bold;
}

.record-type.entry {
  background: rgba(76, 175, 80, 0.2);
  color: #4caf50;
  border: 1px solid rgba(76, 175, 80, 0.4);
}

.record-type.exit {
  background: rgba(255, 152, 0, 0.2);
  color: #ff9800;
  border: 1px solid rgba(255, 152, 0, 0.4);
}

.record-time {
  color: rgba(255, 255, 255, 0.6);
  font-size: 14px;
}

.vip-type {
  color: #ff9800;
  font-weight: bold;
  background: rgba(255, 152, 0, 0.1);
  padding: 2px 8px;
  border-radius: 4px;
  border: 1px solid rgba(255, 152, 0, 0.3);
}

.record-photo {
  margin-top: 12px;
  cursor: pointer;
}

.record-photo img {
  width: 100%;
  max-width: 300px;
  border-radius: 8px;
  border: 2px solid rgba(0, 255, 255, 0.3);
  transition: all 0.3s;
}

.record-photo img:hover {
  border-color: rgba(0, 255, 255, 0.6);
  transform: scale(1.02);
}

/* 空状态 */
.empty-state {
  text-align: center;
  padding: 60px 20px;
  color: rgba(255, 255, 255, 0.5);
}

.empty-icon {
  font-size: 64px;
  display: block;
  margin-bottom: 16px;
}

/* 分页 */
.pagination {
  display: flex;
  justify-content: center;
  align-items: center;
  gap: 16px;
  margin-top: 20px;
  padding-top: 20px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);
}

.page-btn {
  padding: 8px 16px;
  background: rgba(0, 201, 255, 0.2);
  border: 1px solid rgba(0, 201, 255, 0.4);
  border-radius: 6px;
  color: white;
  cursor: pointer;
  transition: all 0.3s;
}

.page-btn:hover:not(:disabled) {
  background: rgba(0, 201, 255, 0.3);
  border-color: rgba(0, 201, 255, 0.6);
}

.page-btn:disabled {
  opacity: 0.4;
  cursor: not-allowed;
}

.page-info {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

/* 图片预览 */
.image-preview {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10001;
  cursor: pointer;
}

.image-preview img {
  max-width: 90%;
  max-height: 90%;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

.btn-close-preview {
  position: absolute;
  top: 20px;
  right: 20px;
  width: 48px;
  height: 48px;
  background: rgba(255, 255, 255, 0.2);
  border: 2px solid rgba(255, 255, 255, 0.4);
  border-radius: 50%;
  color: white;
  font-size: 32px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-close-preview:hover {
  background: rgba(255, 0, 0, 0.3);
  border-color: rgba(255, 0, 0, 0.6);
  transform: scale(1.1);
}

.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
}
</style>
