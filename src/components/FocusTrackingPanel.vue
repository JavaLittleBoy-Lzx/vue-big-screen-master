<template>
  <div class="focus-tracking-panel">
    <!-- 弹窗遮罩 (仅非嵌入模式) -->
    <div v-if="!isEmbedded && showModal" class="modal-overlay" @click="closeModal"></div>
    
    <!-- 主弹窗 (非嵌入模式) 或 主内容区域 (嵌入模式) -->
    <div v-if="isEmbedded || showModal" :class="isEmbedded ? 'focus-embedded-content' : 'focus-modal'" @click.stop>
      <!-- 弹窗头部 (仅非嵌入模式) -->
      <div v-if="!isEmbedded" class="modal-header">
        <div class="header-left">
          <span class="modal-icon">👁️</span>
          <span class="modal-title">关注监控</span>
        </div>
        <div class="header-actions">
          <button class="btn-add" @click="showAddForm">
            <span>➕</span> 添加关注
          </button>
          <button class="btn-close" @click="closeModal">×</button>
        </div>
      </div>

      <!-- 主Tab切换 (仅非嵌入模式) -->
      <div v-if="!isEmbedded" class="main-tabs">
        <div 
          class="main-tab" 
          :class="{ active: mainTab === 'watch' }" 
          @click="mainTab = 'watch'">
          <span class="tab-icon">📋</span>
          <span>关注列表</span>
        </div>
        <div 
          class="main-tab" 
          :class="{ active: mainTab === 'alerts' }" 
          @click="mainTab = 'alerts'">
          <span class="tab-icon">🔔</span>
          <span>提醒管理</span>
          <span v-if="pendingCount > 0" class="tab-badge">{{ pendingCount }}</span>
        </div>
      </div>

      <!-- 关注列表内容 -->
      <div v-show="mainTab === 'watch'" class="tab-content">
        <WatchListPanel 
          @refresh-count="fetchPendingCount"
          ref="watchListPanel" />
      </div>

      <!-- 提醒管理内容 -->
      <div v-show="mainTab === 'alerts'" class="tab-content">
        <AlertManagePanel 
          @refresh-count="fetchPendingCount"
          ref="alertManagePanel" />
      </div>
    </div>

    <!-- 添加关注表单弹窗 -->
    <AddWatchForm 
      v-if="showAddModal" 
      @close="showAddModal = false"
      @added="handleWatchAdded" />
  </div>
</template>

<script>
import WatchListPanel from './WatchListPanel.vue';
import AlertManagePanel from './AlertManagePanel.vue';
import AddWatchForm from './AddWatchForm.vue';
import axios from 'axios';

export default {
  name: 'FocusTrackingPanel',
  components: {
    WatchListPanel,
    AlertManagePanel,
    AddWatchForm
  },
  props: {
    visible: {
      type: Boolean,
      default: false
    },
    isEmbedded: {
      type: Boolean,
      default: false
    }
  },
  data() {
    return {
      showModal: false,
      showAddModal: false,
      mainTab: 'watch', // watch: 关注列表, alerts: 提醒管理
      pendingCount: 0
    };
  },
  watch: {
    visible(newVal) {
      this.showModal = newVal;
      if (newVal) {
        this.fetchPendingCount();
      }
    }
  },
  mounted() {
    this.fetchPendingCount();
    // 每30秒自动刷新未确认数量
    this.countInterval = setInterval(() => {
      this.fetchPendingCount();
    }, 30000);
  },
  beforeDestroy() {
    if (this.countInterval) {
      clearInterval(this.countInterval);
    }
  },
  methods: {
    closeModal() {
      this.showModal = false;
      this.$emit('close');
    },
    showAddForm() {
      this.showAddModal = true;
    },
    handleWatchAdded() {
      this.showAddModal = false;
      // 刷新关注列表
      if (this.$refs.watchListPanel) {
        this.$refs.watchListPanel.loadWatchList();
      }
    },
    async fetchPendingCount() {
      try {
        const response = await axios.get('http://localhost:8675/parking/focus/alerts/pending-count');
        
        // 处理嵌套响应格式
        let resultCode, resultData;
        if (response.data.code === "0" && response.data.data) {
          resultCode = response.data.data.code;
          resultData = response.data.data.data;
        } else {
          resultCode = response.data.code;
          resultData = response.data.data;
        }
        
        if (resultCode === 200) {
          this.pendingCount = resultData.total || 0;
          this.$emit('update-count', this.pendingCount);
        }
      } catch (error) {
        console.error('获取未确认数量失败:', error);
      }
    }
  }
};
</script>

<style scoped>
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  z-index: 9998;
  backdrop-filter: blur(4px);
}

.focus-modal {
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 1200px;
  height: 85vh;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid rgba(0, 255, 255, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 255, 255, 0.2);
  z-index: 9999;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  background: rgba(0, 255, 255, 0.05);
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
  font-size: 24px;
  font-weight: bold;
  color: #00ffff;
  text-shadow: 0 0 10px rgba(0, 255, 255, 0.5);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.btn-add {
  padding: 10px 20px;
  background: linear-gradient(135deg, #00c9ff 0%, #0066ff 100%);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-add:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 201, 255, 0.4);
}

.btn-close {
  width: 40px;
  height: 40px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  font-size: 28px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
}

.btn-close:hover {
  background: rgba(255, 0, 0, 0.2);
  border-color: rgba(255, 0, 0, 0.4);
}

.main-tabs {
  display: flex;
  padding: 0 24px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(0, 255, 255, 0.2);
}

.main-tab {
  padding: 16px 24px;
  display: flex;
  align-items: center;
  gap: 8px;
  color: rgba(255, 255, 255, 0.6);
  font-size: 16px;
  cursor: pointer;
  border-bottom: 3px solid transparent;
  transition: all 0.3s;
  position: relative;
}

.main-tab:hover {
  color: rgba(255, 255, 255, 0.9);
  background: rgba(255, 255, 255, 0.05);
}

.main-tab.active {
  color: #00ffff;
  border-bottom-color: #00ffff;
  font-weight: bold;
}

.tab-icon {
  font-size: 18px;
}

.tab-badge {
  background: linear-gradient(135deg, #ff4d4d 0%, #ff0000 100%);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
}

.tab-content {
  flex: 1;
  overflow: hidden;
  display: flex;
  flex-direction: column;
}

/* 嵌入模式样式 */
.focus-embedded-content {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.embedded-header {
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(0, 255, 255, 0.1);
  display: flex;
  justify-content: flex-end;
}

.btn-add-embedded {
  padding: 10px 20px;
  background: linear-gradient(135deg, #00c9ff 0%, #0066ff 100%);
  border: none;
  border-radius: 6px;
  color: white;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  gap: 6px;
}

.btn-add-embedded:hover {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 201, 255, 0.4);
}

.focus-badge {
  background: linear-gradient(135deg, #ff4d4d 0%, #ff0000 100%);
  color: white;
  padding: 2px 8px;
  border-radius: 12px;
  font-size: 12px;
  font-weight: bold;
  min-width: 20px;
  text-align: center;
  margin-left: 6px;
}
</style>
