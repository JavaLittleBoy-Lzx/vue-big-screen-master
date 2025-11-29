<template>
  <div class="visitor-reservation-panel">
    <div class="chart-header">
      <div class="header-left">
        <h3>📊 访客预约分类</h3>
      </div>
    </div>
    
    <!-- 加载动画 -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-spinner">
        <div class="spinner"></div>
        <p>加载中...</p>
      </div>
    </div>
    
    <div class="panel-body" :class="{ 'loading': isLoading }">
      <div class="left-chart">
        <VisitorReservationPie :data="pieData" :activeName="activeName" @slice-click="onSliceClick" @slice-hover="onSliceHover" />
      </div>
    </div>
  </div>
</template>

<script>
import VisitorReservationPie from "@/components/echart/VisitorReservationPie.vue";
import axios from 'axios';

export default {
  name: "VisitorReservationPanel",
  components: { VisitorReservationPie },
  props: {
    // 时间范围
    timeRange: {
      type: String,
      default: 'today'
    },
    // 允许父级覆盖默认分类（降级方案）
    categories: {
      type: Array,
      default: () => []
    }
  },
  data() {
    return {
      activeName: null,
      realCategories: [], // 真实数据
      isLoading: false
    };
  },
  computed: {
    pieData() {
      // 优先使用真实数据，其次使用props传入的数据
      const data = this.realCategories.length > 0 ? this.realCategories : this.categories;
      return data.map(c => ({ name: c.name, value: c.value }));
    }
  },
  watch: {
    // 监听时间范围变化
    timeRange(newVal, oldVal) {
      if (newVal !== oldVal) {
        console.log('📊 [访客预约分类] 时间范围变化:', oldVal, '->', newVal);
        this.loadCategoryData();
      }
    }
  },
  mounted() {
    this.loadCategoryData();
  },
  methods: {
    // 加载分类数据
    async loadCategoryData() {
      try {
        this.isLoading = true;
        console.log('🚀 [访客预约分类] 开始加载数据，时间范围:', this.timeRange);
        
        const response = await axios.get('http://localhost:8675/parking/visitor/reservation-category', {
          params: {
            timeRange: this.timeRange
          }
        });
        
        console.log('📡 [访客预约分类] API响应:', response.data.data);
        
        // 解析响应数据
        let data = null;
        if (response.data) {
          if (response.data.code === '0' && response.data.data) {
            data = response.data.data;
          }
        }
        
        if (data && data.categories && data.categories.length > 0) {
          this.realCategories = data.categories;
          console.log('📊 [访客预约分类] 数据加载成功:', this.realCategories);
        } else {
          console.warn('⚠️ [访客预约分类] 未获取到数据，使用默认数据');
          this.realCategories = [];
        }
        
        setTimeout(() => {
          this.isLoading = false;
        }, 300);
      } catch (error) {
        console.error('❌ [访客预约分类] 加载失败:', error);
        this.realCategories = [];
        this.isLoading = false;
      }
    },
    onSliceClick(payload) {
      this.activeName = payload.name;
      this.$emit("pie-click", payload);
    },
    onSliceHover(payload) {
      this.activeName = payload && payload.name ? payload.name : null;
    }
  }
};
</script>

<style scoped>
.visitor-reservation-panel {
  height: 100%;
  display: flex;
  flex-direction: column;
}
.chart-header {
  margin-bottom: 15px;
  margin-top: 20px;
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  
  .header-left {
    flex: 1;
    
    h3 {
      margin: 0 0 5px 0;
      padding-left: 15px;
      font-size: 16px;
      color: #ffffff;
      font-weight: bold;
    }
  }
}
.panel-body {
  flex: 1;
  display: flex;
  height: calc(100% - 50px);
  margin-top: -15px;
}
.left-chart {
  flex: 1;
  height: 100%;
  padding: 2px 0 0 2px;
}

/* 加载动画样式 */
.loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(20, 24, 48, 0.85);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
  border-radius: 8px;
  backdrop-filter: blur(4px);
}

.loading-spinner {
  text-align: center;
}

.spinner {
  width: 50px;
  height: 50px;
  margin: 0 auto 16px;
  border: 4px solid rgba(0, 229, 255, 0.1);
  border-top-color: #00E5FF;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

.loading-spinner p {
  color: #00E5FF;
  font-size: 14px;
  margin: 0;
  text-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
}

.panel-body.loading {
  opacity: 0.3;
  pointer-events: none;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>


