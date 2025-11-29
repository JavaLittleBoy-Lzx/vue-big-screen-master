<template>
  <div class="visitor-vip-demo">
    <FullScreenContainerFix class="bg">
      <div class="host-body">
        <!-- 标题区域 -->
        <div class="header-section">
          <div class="header-center">
            <div class="main-title">访客与VIP车辆进出统计分析</div>
          </div>
          
          <div class="header-right">
            <div class="datetime-info">
              <span class="datetime-text">{{currentDateTime}}</span>
            </div>
          </div>
        </div>

        <div class="body-box">
          <div class="page-content">
            <div class="chart-container">
              <VisitorVipAnalysisChart 
                :selectedHour="selectedHour"
                :selectedEntry="selectedEntry"
                :selectedType="selectedType"
              />
            </div>
          </div>
        </div>
      </div>
    </FullScreenContainerFix>
  </div>
</template>

<script>
import VisitorVipAnalysisChart from '@/components/echart/VisitorVipAnalysisChart.vue'
import FullScreenContainerFix from "@/components/FullScreenContainerFix.vue";

export default {
  name: 'VisitorVipDemo',
  components: {
    VisitorVipAnalysisChart,
    FullScreenContainerFix
  },
  data() {
    return {
      currentDateTime: "",
      timeTimer: null,
      selectedHour: null,
      selectedEntry: null,
      selectedType: null
    }
  },
  mounted() {
    this.startTimeUpdate()
    this.parseUrlParams()
  },
  beforeDestroy() {
    if (this.timeTimer) {
      clearInterval(this.timeTimer)
    }
  },
  methods: {
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
    },
    
    parseUrlParams() {
      // 解析URL参数
      const query = this.$route.query
      this.selectedHour = query.hour || null
      this.selectedEntry = query.entry ? parseInt(query.entry) : null
      this.selectedType = query.type || null
      
      console.log('接收到的参数:', {
        hour: this.selectedHour,
        entry: this.selectedEntry,
        type: this.selectedType
      })
    }
  }
}
</script>

<style lang="scss" scoped>
@import "../assets/scss/index.scss";

.visitor-vip-demo {
  width: 100%;
  height: 100vh;
  overflow: hidden;
  background-color: #000000;
  
  .bg {
    padding: 1rem;
    background-image: url("../assets/pageBg.png");
    background-size: cover;
    background-repeat: no-repeat;
    background-position: center;
  }
}

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
  }
  
  .datetime-info {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 8px 15px;
    background: rgba(11, 19, 42, 0.8);
    border: 1px solid #1e3a8a;
    border-radius: 6px;
    
    .datetime-text {
      font-size: 14px;
      color: #e2e8f0;
      font-weight: 500;
    }
  }
}

// 页面内容区域样式
.page-content {
  height: auto;
  overflow: hidden;
  display: flex;
  flex-direction: column;
  gap: 15px;
  padding: 15px;
}

.chart-container {
  flex: 1;
  background: rgba(11, 19, 42, 0.8);
  border: 1px solid #1e3a8a;
  border-radius: 12px;
  padding: 20px;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.3);
}
</style>
