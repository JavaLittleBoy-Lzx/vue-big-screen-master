<template>
  <div class="alert-manage-panel">
    <!-- 主Tab切换 -->
    <div class="main-tabs">
      <div 
        class="main-tab" 
        :class="{ active: alertTab === 'pending' }" 
        @click="switchTab('pending')">
        <span class="tab-icon">🔔</span>
        <span>未确认提醒</span>
        <span v-if="getTotalPendingCount() > 0" class="count-badge">{{ getTotalPendingCount() }}</span>
      </div>
      <div 
        class="main-tab" 
        :class="{ active: alertTab === 'history' }" 
        @click="switchTab('history')">
        <span class="tab-icon">📜</span>
        <span>历史记录</span>
        <span v-if="getTotalHistoryCount() > 0" class="count-badge">{{ getTotalHistoryCount() }}</span>
      </div>
    </div>

    <!-- 子Tab切换（车辆/行人分类） -->
    <div class="sub-tabs">
      <div 
        class="sub-tab" 
        :class="{ active: alertType === 'vehicle' }" 
        @click="switchType('vehicle')">
        <span class="tab-icon">🚗</span>
        <span>车辆</span>
        <span v-if="getTypeCount('vehicle') > 0" class="type-badge">{{ getTypeCount('vehicle') }}</span>
      </div>
      <div 
        class="sub-tab" 
        :class="{ active: alertType === 'person' }" 
        @click="switchType('person')">
        <span class="tab-icon">👤</span>
        <span>人员</span>
        <span v-if="getTypeCount('person') > 0" class="type-badge">{{ getTypeCount('person') }}</span>
      </div>
    </div>

    <!-- 操作栏 -->
    <div class="action-bar">
      <div class="current-view-info">
        <span class="view-label">
          {{ alertTab === 'pending' ? '未确认' : '历史记录' }} - 
          {{ alertType === 'vehicle' ? '🚗 车辆' : '👤 人员' }}
        </span>
        <span class="count-info">({{ alertList.length }}条)</span>
      </div>
      
      <div v-if="alertTab === 'pending' && alertList.length > 0" class="batch-actions">
        <button class="btn-batch-confirm" @click="confirmAll">
          <span>✓</span> 全部确认
        </button>
      </div>
    </div>

    <!-- 提醒列表 -->
    <div class="alert-list" v-loading="loading">
      <div v-if="alertList.length === 0" class="empty-state">
        <span class="empty-icon">{{ alertTab === 'pending' ? '✅' : '📭' }}</span>
        <p>{{ alertTab === 'pending' ? '暂无未确认提醒' : '暂无历史记录' }}</p>
      </div>

      <div v-else class="list-container">
        <div 
          v-for="item in alertList" 
          :key="item.id" 
          class="alert-item"
          :class="'alert-' + item.event_type">
          
          <!-- 事件类型标识 -->
          <div class="event-badge" :class="'badge-' + item.event_type">
            {{ item.event_type === 'entry' ? '进场' : '出场' }}
          </div>

          <!-- 提醒内容 -->
          <div class="alert-content">
            <!-- 头部 -->
            <div class="content-header">
              <span class="type-icon">
                {{ item.alert_type === 'person' ? '👤' : '🚗' }}
              </span>
              <span class="watch-value">{{ getDisplayName(item) }}</span>
              <span v-if="shouldShowSecondary(item)" class="person-name">
                ({{ getSecondaryInfo(item) }})
              </span>
            </div>

            <!-- 详细信息 -->
            <div class="content-details">
              <div class="detail-item">
                <span class="label">时间：</span>
                <span class="value">{{ formatTime(item.event_time) }}</span>
              </div>
              <div class="detail-item" v-if="item.channel_name">
                <span class="label">通道：</span>
                <span class="value">{{ item.channel_name }}</span>
              </div>
              <div class="detail-item" v-if="item.stopping_time">
                <span class="label">停车时长：</span>
                <span class="value">{{ item.stopping_time }}</span>
              </div>
              <div class="detail-item" v-if="item.remark">
                <span class="label">备注：</span>
                <span class="value">{{ item.remark }}</span>
              </div>
            </div>

            <!-- 预约信息（如果有） -->
            <div v-if="hasReservation(item)" class="reservation-info">
              <div class="reservation-title">📋 预约信息</div>
              <div class="reservation-details">
                <div v-if="item.visitorName" class="reservation-item">
                  <span class="label">访客姓名：</span>
                  <span>{{ item.visitorName }}</span>
                </div>
                <div v-if="item.reservation_person" class="reservation-item">
                  <span class="label">预约人：</span>
                  <span>{{ item.reservation_person }}</span>
                </div>
                <div v-if="item.reservation_phone" class="reservation-item">
                  <span class="label">联系电话：</span>
                  <span>{{ item.reservation_phone }}</span>
                </div>
                <div v-if="formatVisitorIdentity(item)" class="reservation-item">
                  <span class="label">访客身份信息：</span>
                  <span class="identity-info">{{ formatVisitorIdentity(item) }}</span>
                </div>
                <div v-if="getIdCardNumber(item)" class="reservation-item">
                  <span class="label">身份证号：</span>
                  <span class="identity-info">{{ getIdCardNumber(item) }}</span>
                </div>
                <div v-if="item.reservation_time_range || item.visitor_reservation_time_range" class="reservation-item">
                  <span class="label">预约时段：</span>
                  <span>{{ item.reservation_time_range || item.visitor_reservation_time_range }}</span>
                </div>
              </div>
            </div>

            <!-- 照片 -->
            <div v-if="item.photo_url" class="photo-container">
              <img :src="item.photo_url" @click="previewImage(item.photo_url)" class="alert-photo" alt="抓拍照片">
            </div>
          </div>

          <!-- 操作按钮 -->
          <div class="alert-actions">
            <button 
              v-if="alertTab === 'pending'"
              class="btn-confirm" 
              @click="confirmAlert(item.id)">
              <span>✓</span> 确认
            </button>
            <div v-else class="confirmed-time">
              已确认于 {{ formatTime(item.confirmed_at) }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 图片预览 -->
    <div v-if="previewImageUrl" class="image-preview-modal" @click="previewImageUrl = null">
      <img :src="previewImageUrl" alt="预览图片">
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AlertManagePanel',
  data() {
    return {
      alertTab: 'pending', // pending: 未确认, history: 历史记录
      alertType: 'vehicle', // vehicle: 车辆, person: 人员
      alertList: [],
      loading: false,
      // 分类统计数据
      pendingVehicleCount: 0,
      pendingPersonCount: 0,
      historyVehicleCount: 0,
      historyPersonCount: 0,
      previewImageUrl: null
    };
  },
  mounted() {
    this.loadAlerts();
  },
  methods: {
    switchTab(tab) {
      this.alertTab = tab;
      this.loadAlerts();
    },
    switchType(type) {
      this.alertType = type;
      this.loadAlerts();
    },
    // 获取总的未确认数量
    getTotalPendingCount() {
      return this.pendingVehicleCount + this.pendingPersonCount;
    },
    // 获取总的历史记录数量
    getTotalHistoryCount() {
      return this.historyVehicleCount + this.historyPersonCount;
    },
    // 获取当前类型的数量
    getTypeCount(type) {
      if (this.alertTab === 'pending') {
        return type === 'vehicle' ? this.pendingVehicleCount : this.pendingPersonCount;
      } else {
        return type === 'vehicle' ? this.historyVehicleCount : this.historyPersonCount;
      }
    },
    async loadAlerts() {
      this.loading = true;
      try {
        // 加载当前选中类型的数据
        await this.loadCurrentTypeAlerts();
        
        // 同时加载统计数据（用于显示徽章数量）
        await this.loadStatistics();
        
      } catch (error) {
        console.error('获取提醒列表失败:', error);
        this.$message.error('获取提醒列表失败');
      } finally {
        this.loading = false;
      }
    },
    
    // 加载当前选中类型的提醒数据
    async loadCurrentTypeAlerts() {
      const endpoint = this.alertTab === 'pending' 
        ? 'http://localhost:8675/parking/focus/alerts/pending' 
        : 'http://localhost:8675/parking/focus/alerts/history';
      
      const params = {
        page: 1,
        limit: 100,
        alert_type: this.alertType
      };
      
      const response = await axios.get(endpoint, { params });
      
      // 处理嵌套响应格式
      let resultData, resultCode;
      if (response.data.code === "0" && response.data.data) {
        resultCode = response.data.data.code;
        resultData = response.data.data.data;
      } else {
        resultCode = response.data.code;
        resultData = response.data.data;
      }
      
      if (resultCode === 200) {
        this.alertList = resultData.list || [];
      } else {
        this.$message.error(response.data.message || '获取提醒列表失败');
      }
    },
    
    // 加载统计数据
    async loadStatistics() {
      try {
        // 加载未确认提醒统计
        const pendingVehicleResponse = await axios.get('http://localhost:8675/parking/focus/alerts/pending', {
          params: { page: 1, limit: 1, alert_type: 'vehicle' }
        });
        const pendingPersonResponse = await axios.get('http://localhost:8675/parking/focus/alerts/pending', {
          params: { page: 1, limit: 1, alert_type: 'person' }
        });
        
        // 加载历史记录统计
        const historyVehicleResponse = await axios.get('http://localhost:8675/parking/focus/alerts/history', {
          params: { page: 1, limit: 1, alert_type: 'vehicle' }
        });
        const historyPersonResponse = await axios.get('http://localhost:8675/parking/focus/alerts/history', {
          params: { page: 1, limit: 1, alert_type: 'person' }
        });
        
        // 更新统计数据（处理嵌套格式）
        const extractTotal = (response) => {
          if (response.data.code === "0" && response.data.data) {
            return response.data.data.data?.total || 0;
          }
          return response.data.data?.total || 0;
        };
        
        this.pendingVehicleCount = extractTotal(pendingVehicleResponse);
        this.pendingPersonCount = extractTotal(pendingPersonResponse);
        this.historyVehicleCount = extractTotal(historyVehicleResponse);
        this.historyPersonCount = extractTotal(historyPersonResponse);
      } catch (error) {
        console.warn('获取统计数据失败:', error);
      }
    },
    async confirmAlert(id) {
      try {
        const response = await axios.post(`http://localhost:8675/parking/focus/alerts/confirm/${id}`);
        
        if (response.data.code === 200) {
          this.$message.success('确认成功');
          this.loadAlerts();
          this.$emit('refresh-count');
        } else {
          this.$message.error(response.data.message || '确认失败');
        }
      } catch (error) {
        console.error('确认失败:', error);
        this.$message.error('确认失败');
      }
    },
    async confirmAll() {
      this.$confirm('确定要确认所有未确认提醒吗？', '批量确认', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'info'
      }).then(async () => {
        try {
          const ids = this.alertList.map(item => item.id);
          const response = await axios.post('http://localhost:8675/parking/focus/alerts/confirm-batch', { ids });
          
          if (response.data.code === 200) {
            this.$message.success(`成功确认 ${response.data.data.confirmed_count} 条提醒`);
            this.loadAlerts();
            this.$emit('refresh-count');
          } else {
            this.$message.error(response.data.message || '批量确认失败');
          }
        } catch (error) {
          console.error('批量确认失败:', error);
          this.$message.error('批量确认失败');
        }
      }).catch(() => {});
    },
    hasReservation(item) {
      return item.visitorName || item.reservation_person || item.reservation_phone || 
             item.reservation_reason || item.reservation_time_range ||
             item.visitor_pass_name || item.visitor_reservation_time_range;
    },
    formatWatchValue(item) {
      if (!item.watch_value) return '未知访客';
      
      // 其他情况返回原值
      return item.watch_value;
    },
    // 格式化访客身份信息（加密显示）
    formatVisitorIdentity(item) {
      if (!item.watch_value || item.alert_type !== 'person') return null;
      
      const watchValue = item.watch_value;
      
      // 检查是否包含公安局等机构信息
      if (watchValue.includes('公安局') || 
          watchValue.includes('派出所') || 
          watchValue.includes('公安分局')) {
        // 对机构信息进行部分加密显示
        return this.maskSensitiveInfo(watchValue);
      }
      
      // 如果是身份证号格式，进行加密显示
      if (/^\d{15}(\d{2}[0-9xX])?$/.test(watchValue)) {
        return this.maskIdCard(watchValue);
      }
      
      return null;
    },
    // 加密身份证号
    maskIdCard(idCard) {
      if (!idCard || idCard.length < 6) return idCard;
      
      // 显示前3位和后4位，中间用*替代
      const start = idCard.substring(0, 3);
      const end = idCard.substring(idCard.length - 4);
      const middle = '*'.repeat(idCard.length - 7);
      
      return `${start}${middle}${end}`;
    },
    // 加密敏感机构信息
    maskSensitiveInfo(info) {
      if (!info) return info;
      
      // 对包含地名+公安局的信息进行部分加密
      // 例如：黑龙江省哈尔滨市南岗区公安局 -> 黑龙江省***公安局
      const patterns = [
        { regex: /(.{2,3}省)(.+)(公安局|派出所|公安分局)/, replacement: '$1***$3' },
        { regex: /(.{2,3}市)(.+)(公安局|派出所|公安分局)/, replacement: '$1***$3' },
        { regex: /(.{2,3}区)(.+)(公安局|派出所|公安分局)/, replacement: '$1***$3' },
        { regex: /(.{2,3}县)(.+)(公安局|派出所|公安分局)/, replacement: '$1***$3' }
      ];
      
      for (const pattern of patterns) {
        if (pattern.regex.test(info)) {
          return info.replace(pattern.regex, pattern.replacement);
        }
      }
      
      // 如果没有匹配到特定模式，简单加密中间部分
      if (info.length > 6) {
        const start = info.substring(0, 2);
        const end = info.substring(info.length - 3);
        return `${start}***${end}`;
      }
      
      return info;
    },
    // 获取身份证号并加密显示
    getIdCardNumber(item) {
      if (!item.watch_value || item.alert_type !== 'person') return null;
      
      const watchValue = item.watch_value;
      
      // 检查是否是身份证号格式
      if (/^\d{15}(\d{2}[0-9xX])?$/.test(watchValue)) {
        return this.maskIdCard(watchValue);
      }
      
      return null;
    },
    // 获取主要显示名称（优先显示姓名）
    getDisplayName(item) {
      // 如果有姓名，优先显示姓名
      if (item.person_name) {
        return item.person_name;
      }
      
      // 如果是车辆类型，显示车牌号
      if (item.alert_type === 'vehicle') {
        return item.watch_value;
      }
      
      // 如果是人员类型但没有姓名，显示加密后的身份证号或其他信息
      if (item.alert_type === 'person') {
        return this.formatWatchValue(item);
      }
      
      return item.watch_value || '未知';
    },
    // 判断是否显示次要信息
    shouldShowSecondary(item) {
      // 如果主要显示的是姓名，且有身份证号，则显示加密的身份证号
      if (item.person_name && item.alert_type === 'person') {
        return this.getIdCardNumber(item) !== null;
      }
      return false;
    },
    // 获取次要显示信息
    getSecondaryInfo(item) {
      // 如果主要显示的是姓名，次要显示加密的身份证号
      if (item.person_name && item.alert_type === 'person') {
        return this.getIdCardNumber(item) || '';
      }
      return '';
    },
    previewImage(url) {
      this.previewImageUrl = url;
    },
    formatTime(time) {
      if (!time) return '';
      const date = new Date(time);
      return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`;
    }
  }
};
</script>

<style scoped>
.alert-manage-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

/* 主Tab样式 */
.main-tabs {
  display: flex;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.3);
  border-bottom: 1px solid rgba(0, 255, 255, 0.2);
  gap: 16px;
}

.main-tab {
  padding: 12px 24px;
  background: rgba(255, 255, 255, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.15);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.8);
  font-size: 15px;
  font-weight: 500;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 10px;
  position: relative;
}

.main-tab:hover {
  background: rgba(255, 255, 255, 0.12);
  border-color: rgba(0, 255, 255, 0.4);
  color: rgba(255, 255, 255, 0.95);
  transform: translateY(-1px);
}

.main-tab.active {
  background: linear-gradient(135deg, rgba(0, 201, 255, 0.25) 0%, rgba(0, 102, 255, 0.25) 100%);
  border-color: #00c9ff;
  color: #00ffff;
  font-weight: bold;
  box-shadow: 0 4px 12px rgba(0, 201, 255, 0.3);
}

/* 子Tab样式 */
.sub-tabs {
  display: flex;
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.15);
  border-bottom: 1px solid rgba(0, 255, 255, 0.1);
  gap: 12px;
}

.sub-tab {
  padding: 10px 20px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 8px;
  position: relative;
}

.sub-tab:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(0, 255, 255, 0.3);
  color: rgba(255, 255, 255, 0.9);
}

.sub-tab.active {
  background: linear-gradient(135deg, rgba(0, 201, 255, 0.2) 0%, rgba(0, 102, 255, 0.2) 100%);
  border-color: #00c9ff;
  color: #00ffff;
  font-weight: bold;
}

.count-badge {
  background: linear-gradient(135deg, #ff4d4d 0%, #ff0000 100%);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
}

.type-badge {
  background: linear-gradient(135deg, #00c9ff 0%, #0066ff 100%);
  color: white;
  padding: 2px 6px;
  border-radius: 10px;
  font-size: 11px;
  font-weight: bold;
  min-width: 16px;
  text-align: center;
}

/* 操作栏样式 */
.action-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.1);
  border-bottom: 1px solid rgba(0, 255, 255, 0.08);
}

.current-view-info {
  display: flex;
  align-items: center;
  gap: 8px;
}

.view-label {
  color: #00ffff;
  font-size: 14px;
  font-weight: 500;
}

.count-info {
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
}

.filter-bar {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 12px 24px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(0, 255, 255, 0.1);
}

.filter-group {
  display: flex;
  gap: 8px;
}

.filter-btn {
  padding: 6px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 4px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
}

.filter-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.9);
}

.filter-btn.active {
  background: rgba(0, 201, 255, 0.2);
  border-color: #00c9ff;
  color: #00ffff;
  font-weight: bold;
}

.btn-batch-confirm {
  padding: 6px 16px;
  background: linear-gradient(135deg, #00c9ff 0%, #0066ff 100%);
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 13px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-batch-confirm:hover {
  transform: translateY(-1px);
  box-shadow: 0 2px 8px rgba(0, 201, 255, 0.4);
}

.alert-list {
  flex: 1;
  overflow-y: auto;
  padding: 16px 24px;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 100%;
  color: rgba(255, 255, 255, 0.5);
}

.empty-icon {
  font-size: 64px;
  margin-bottom: 16px;
}

.list-container {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.alert-item {
  background: linear-gradient(135deg, rgba(0, 201, 255, 0.05) 0%, rgba(0, 102, 255, 0.05) 100%);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 8px;
  padding: 16px;
  position: relative;
  transition: all 0.3s;
}

.alert-item:hover {
  border-color: #00c9ff;
  box-shadow: 0 4px 12px rgba(0, 201, 255, 0.2);
}

.alert-item.alert-entry {
  border-left: 4px solid #52c41a;
}

.alert-item.alert-exit {
  border-left: 4px solid #1890ff;
}

.event-badge {
  position: absolute;
  top: 16px;
  right: 16px;
  padding: 4px 12px;
  border-radius: 4px;
  font-size: 12px;
  font-weight: bold;
}

.badge-entry {
  background: rgba(82, 196, 26, 0.2);
  color: #52c41a;
  border: 1px solid rgba(82, 196, 26, 0.4);
}

.badge-exit {
  background: rgba(24, 144, 255, 0.2);
  color: #1890ff;
  border: 1px solid rgba(24, 144, 255, 0.4);
}

.alert-content {
  margin-bottom: 12px;
}

.content-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.type-icon {
  font-size: 24px;
}

.watch-value {
  font-size: 18px;
  font-weight: bold;
  color: white;
  letter-spacing: 1px;
}

.person-name {
  color: rgba(255, 255, 255, 0.7);
  font-size: 14px;
}

.content-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 8px;
  margin-bottom: 12px;
}

.detail-item {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.8);
}

.detail-item .label {
  color: rgba(255, 255, 255, 0.5);
}

.reservation-info {
  background: rgba(0, 201, 255, 0.1);
  border: 1px solid rgba(0, 201, 255, 0.2);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 12px;
}

.reservation-title {
  font-size: 14px;
  font-weight: bold;
  color: #00ffff;
  margin-bottom: 8px;
}

.reservation-details {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 6px;
}

.reservation-item {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
}

.reservation-item .label {
  color: rgba(255, 255, 255, 0.5);
}

.identity-info {
  color: #ffa940;
  font-weight: 500;
  font-family: 'Courier New', monospace;
  letter-spacing: 1px;
}

.photo-container {
  margin-bottom: 12px;
}

.alert-photo {
  max-width: 200px;
  max-height: 150px;
  border-radius: 6px;
  cursor: pointer;
  transition: all 0.3s;
}

.alert-photo:hover {
  transform: scale(1.05);
  box-shadow: 0 4px 12px rgba(0, 201, 255, 0.4);
}

.alert-actions {
  display: flex;
  justify-content: flex-end;
}

.btn-confirm {
  padding: 8px 20px;
  background: linear-gradient(135deg, #00c9ff 0%, #0066ff 100%);
  border: none;
  border-radius: 4px;
  color: white;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 4px;
}

.btn-confirm:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 201, 255, 0.4);
}

.confirmed-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.image-preview-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.9);
  z-index: 10001;
  display: flex;
  align-items: center;
  justify-content: center;
  cursor: pointer;
}

.image-preview-modal img {
  max-width: 90%;
  max-height: 90%;
  border-radius: 8px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.5);
}

/* 滚动条样式 */
.alert-list::-webkit-scrollbar {
  width: 6px;
}

.alert-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.alert-list::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 255, 0.3);
  border-radius: 3px;
}

.alert-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 255, 255, 0.5);
}
</style>
