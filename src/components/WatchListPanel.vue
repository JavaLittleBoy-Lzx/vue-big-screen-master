<template>
  <div class="watch-list-panel">
    <!-- 子Tab切换 -->
    <div class="sub-tabs">
      <div 
        class="sub-tab" 
        :class="{ active: watchType === 'all' }" 
        @click="switchType('all')">
        <span class="tab-icon">📊</span>
        <span>全部 ({{ totalCount }})</span>
      </div>
      <div 
        class="sub-tab" 
        :class="{ active: watchType === 'idcard' }" 
        @click="switchType('idcard')">
        <span class="tab-icon">👤</span>
        <span>身份证号 ({{ idcardCount }})</span>
      </div>
      <div 
        class="sub-tab" 
        :class="{ active: watchType === 'plate' }" 
        @click="switchType('plate')">
        <span class="tab-icon">🚗</span>
        <span>车牌号 ({{ plateCount }})</span>
      </div>
    </div>

    <!-- 搜索栏 -->
    <div class="search-bar">
      <input 
        v-model="searchKeyword" 
        @input="handleSearch"
        type="text" 
        placeholder="搜索关注对象..." 
        class="search-input">
      <span class="search-icon">🔍</span>
    </div>

    <!-- 关注列表 -->
    <div class="watch-list" v-loading="loading">
      <div v-if="filteredList.length === 0" class="empty-state">
        <span class="empty-icon">📭</span>
        <p>暂无关注对象</p>
        <p class="empty-hint">点击"添加关注"按钮开始使用</p>
      </div>

      <div v-else class="list-container">
        <div 
          v-for="item in filteredList" 
          :key="item.id" 
          class="watch-item">
          <div class="item-header">
            <span class="item-type-icon">
              {{ item.watchType === 'idcard' ? '👤' : '🚗' }}
            </span>
            <span class="item-type-label">
              {{ item.watchType === 'idcard' ? '身份证号' : '车牌号' }}
            </span>
          </div>
          
          <div class="item-content">
            <div class="item-value" :class="getValueClass(item)">{{ formatDisplayValue(item) }}</div>
            <div class="item-remark" v-if="item.remark">
              <span class="remark-label">备注：</span>
              <span>{{ item.remark }}</span>
            </div>
            <div class="item-time">
              添加时间：{{ formatTime(item.createdAt) }}
            </div>
          </div>

          <div class="item-actions">
            <button class="btn-history" @click="viewHistory(item)">
              <span>📋</span> 查看记录
            </button>
            <button class="btn-delete" @click="confirmDelete(item)">
              <span>🗑️</span> 删除
            </button>
          </div>
        </div>
      </div>
    </div>

    <!-- 历史记录弹窗 -->
    <HistoryModal 
      v-if="showHistoryModal"
      :watch-item="currentWatchItem"
      @close="showHistoryModal = false" />
  </div>
</template>

<script>
import axios from 'axios';
import HistoryModal from './HistoryModal.vue';

export default {
  name: 'WatchListPanel',
  components: {
    HistoryModal
  },
  data() {
    return {
      watchType: 'all',
      watchList: [],
      searchKeyword: '',
      loading: false,
      totalCount: 0,
      idcardCount: 0,
      plateCount: 0,
      showHistoryModal: false,
      currentWatchItem: null
    };
  },
  computed: {
    filteredList() {
      let list = this.watchList;
      
      // 搜索过滤
      if (this.searchKeyword) {
        list = list.filter(item => 
          item.watchValue.toLowerCase().includes(this.searchKeyword.toLowerCase()) ||
          (item.remark && item.remark.toLowerCase().includes(this.searchKeyword.toLowerCase()))
        );
      }
      
      return list;
    }
  },
  mounted() {
    this.loadWatchList();
  },
  methods: {
    // 获取显示值的样式类
    getValueClass(item) {
      if (item.watchType === 'plate') {
        // 车牌号根据长度判断类型
        const plate = item.watchValue.trim();
        if (plate.length === 8) {
          return 'plate-number new-energy'; // 新能源车牌
        }
        return 'plate-number traditional'; // 普通蓝牌
      }
      return 'idcard-number'; // 身份证号
    },
    
    // 格式化显示值（身份证号加密显示）
    formatDisplayValue(item) {
      if (item.watchType === 'idcard') {
        // 身份证号加密显示
        return this.maskIdCard(item.watchValue);
      }
      // 车牌号正常显示
      return item.watchValue;
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
    
    switchType(type) {
      this.watchType = type;
      this.loadWatchList();
    },
    async loadWatchList() {
      this.loading = true;
      try {
        const params = {
          page: 1,
          limit: 100
        };
        
        if (this.watchType !== 'all') {
          params.watch_type = this.watchType;
        }
        
        const response = await axios.get('http://localhost:8675/parking/focus/watch/list', { params });
        
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
          this.watchList = resultData.list || [];
          this.totalCount = resultData.total || 0;
          this.idcardCount = resultData.idcard_count || 0;
          this.plateCount = resultData.plate_count || 0;
        } else {
          this.$message.error(response.data.message || '获取关注列表失败');
        }
      } catch (error) {
        console.error('获取关注列表失败:', error);
        this.$message.error('获取关注列表失败');
      } finally {
        this.loading = false;
      }
    },
    handleSearch() {
      // 搜索通过计算属性实现，这里不需要额外操作
    },
    viewHistory(item) {
      this.currentWatchItem = item;
      this.showHistoryModal = true;
    },
    confirmDelete(item) {
      this.$confirm(`确定要删除关注对象 "${item.watch_value}" 吗？`, '确认删除', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        this.deleteWatch(item.id);
      }).catch(() => {
        // 取消删除
      });
    },
    async deleteWatch(id) {
      try {
        const response = await axios.delete(`http://localhost:8675/parking/focus/watch/${id}`);
        
        if (response.data.code === 200) {
          this.$message.success('删除成功');
          this.loadWatchList();
          this.$emit('refresh-count');
        } else {
          this.$message.error(response.data.message || '删除失败');
        }
      } catch (error) {
        console.error('删除失败:', error);
        this.$message.error('删除失败');
      }
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
.watch-list-panel {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.sub-tabs {
  display: flex;
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.2);
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

.search-bar {
  padding: 16px 24px;
  background: rgba(0, 0, 0, 0.2);
  border-bottom: 1px solid rgba(0, 255, 255, 0.1);
  position: relative;
}

.search-input {
  width: 100%;
  padding: 12px 40px 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  color: white;
  font-size: 14px;
  outline: none;
  transition: all 0.3s;
}

.search-input:focus {
  border-color: #00c9ff;
  background: rgba(255, 255, 255, 0.1);
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.4);
}

.search-icon {
  position: absolute;
  right: 36px;
  top: 50%;
  transform: translateY(-50%);
  font-size: 18px;
  pointer-events: none;
}

.watch-list {
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

.empty-state p {
  margin: 8px 0;
  font-size: 16px;
}

.empty-hint {
  font-size: 14px;
  color: rgba(255, 255, 255, 0.3);
}

.list-container {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
  gap: 16px;
}

.watch-item {
  background: linear-gradient(135deg, rgba(0, 201, 255, 0.05) 0%, rgba(0, 102, 255, 0.05) 100%);
  border: 1px solid rgba(0, 255, 255, 0.2);
  border-radius: 8px;
  padding: 16px;
  transition: all 0.3s;
}

.watch-item:hover {
  border-color: #00c9ff;
  box-shadow: 0 4px 12px rgba(0, 201, 255, 0.2);
  transform: translateY(-2px);
}

.item-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.item-type-icon {
  font-size: 20px;
}

.item-type-label {
  color: #00ffff;
  font-size: 12px;
  font-weight: bold;
}

.item-content {
  margin-bottom: 12px;
}

.item-value {
  font-size: 18px;
  font-weight: bold;
  color: white;
  margin-bottom: 8px;
  letter-spacing: 1px;
  
  /* 车牌号样式 */
  &.plate-number {
    display: inline-block;
    font-size: 16px;
    font-weight: 700;
    padding: 6px 14px;
    border-radius: 6px;
    letter-spacing: 2px;
    
    /* 默认样式（蓝牌） */
    &.traditional {
      background: linear-gradient(180deg, #0C4FC5 0%, #216FEF 100%);
      color: #FFFFFF;
      border: 1px solid rgba(33, 111, 239, 0.6);
      box-shadow: 0 2px 6px rgba(12, 79, 197, 0.3);
    }
    
    /* 绿牌（新能源） */
    &.new-energy {
      background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
      color: #000000;
      border: 1px solid #6AD390;
      box-shadow: 0 2px 4px rgba(106, 211, 144, 0.3);
    }
  }
  
  /* 身份证号样式 */
  &.idcard-number {
    font-family: 'Courier New', monospace;
    letter-spacing: 2px;
  }
}

.item-remark {
  font-size: 13px;
  color: rgba(255, 255, 255, 0.7);
  margin-bottom: 6px;
  display: flex;
  gap: 6px;
}

.remark-label {
  color: rgba(255, 255, 255, 0.5);
}

.item-time {
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

.item-actions {
  display: flex;
  gap: 8px;
}

.btn-history,
.btn-delete {
  flex: 1;
  padding: 8px 12px;
  border: none;
  border-radius: 4px;
  font-size: 13px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 4px;
}

.btn-history {
  background: rgba(0, 201, 255, 0.2);
  color: #00c9ff;
  border: 1px solid rgba(0, 201, 255, 0.3);
}

.btn-history:hover {
  background: rgba(0, 201, 255, 0.3);
  border-color: #00c9ff;
}

.btn-delete {
  background: rgba(255, 77, 77, 0.2);
  color: #ff4d4d;
  border: 1px solid rgba(255, 77, 77, 0.3);
}

.btn-delete:hover {
  background: rgba(255, 77, 77, 0.3);
  border-color: #ff4d4d;
}

/* 滚动条样式 */
.watch-list::-webkit-scrollbar {
  width: 6px;
}

.watch-list::-webkit-scrollbar-track {
  background: rgba(0, 0, 0, 0.2);
}

.watch-list::-webkit-scrollbar-thumb {
  background: rgba(0, 255, 255, 0.3);
  border-radius: 3px;
}

.watch-list::-webkit-scrollbar-thumb:hover {
  background: rgba(0, 255, 255, 0.5);
}
</style>
