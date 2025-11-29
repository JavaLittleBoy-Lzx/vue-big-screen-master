<template>
  <div class="demo-page">
    <div class="demo-header">
      <h1>🚗 智慧停车3D数据分析大屏</h1>
      <p>基于3D立体热力图的停车时长与通道分析系统</p>
    </div>
    
    <div class="demo-content">
      <!-- 3D热力图组件 -->
      <div class="chart-section">
        <ParkingDurationChannel3D />
      </div>
      
      <!-- 功能说明 -->
      <div class="feature-description">
        <h2>🎯 功能特点</h2>
        <div class="features-grid">
          <div class="feature-item">
            <div class="feature-icon">🔥</div>
            <div class="feature-title">3D热力图</div>
            <div class="feature-desc">时空三维数据可视化，直观展示停车时长分布</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">🌊</div>
            <div class="feature-title">飞线流动</div>
            <div class="feature-desc">动态展示通道间车辆流动轨迹</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">📊</div>
            <div class="feature-title">实时KPI</div>
            <div class="feature-desc">关键指标实时监控和预警</div>
          </div>
          <div class="feature-item">
            <div class="feature-icon">⏰</div>
            <div class="feature-title">时间轴控制</div>
            <div class="feature-desc">交互式时间轴，查看不同时段数据</div>
          </div>
        </div>
      </div>
      
      <!-- 数据维度说明 -->
      <div class="data-dimensions">
        <h2>📈 数据维度分析</h2>
        <div class="dimensions-grid">
          <div class="dimension-item">
            <h3>时间维度</h3>
            <ul>
              <li>24小时时段分析</li>
              <li>高峰时段识别</li>
              <li>流量变化趋势</li>
            </ul>
          </div>
          <div class="dimension-item">
            <h3>时长维度</h3>
            <ul>
              <li>短停(0-1h)：快速停车</li>
              <li>中停(1-4h)：常规停车</li>
              <li>长停(4-8h)：长时间停车</li>
              <li>超长停(>8h)：异常停车</li>
            </ul>
          </div>
          <div class="dimension-item">
            <h3>通道维度</h3>
            <ul>
              <li>入口通道效率</li>
              <li>出口通道效率</li>
              <li>通道间流动模式</li>
              <li>瓶颈识别</li>
            </ul>
          </div>
          <div class="dimension-item">
            <h3>流动维度</h3>
            <ul>
              <li>车辆流动轨迹</li>
              <li>通道转移模式</li>
              <li>流量平衡分析</li>
              <li>拥堵预警</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import ParkingDurationChannel3D from './parkingDurationChannel3D.vue'

export default {
  name: 'DemoPage',
  components: {
    ParkingDurationChannel3D
  }
}
</script>

<style lang="scss" scoped>
.demo-page {
  min-height: 100vh;
  background: linear-gradient(135deg, #0f1419 0%, #1a1f2e 50%, #2d3748 100%);
  color: #e2e8f0;
  padding: 20px;
}

.demo-header {
  text-align: center;
  margin-bottom: 30px;
  
  h1 {
    font-size: 32px;
    font-weight: bold;
    color: #00bcd4;
    margin-bottom: 10px;
    text-shadow: 0 0 20px rgba(0, 188, 212, 0.5);
  }
  
  p {
    font-size: 16px;
    color: #94a3b8;
  }
}

.demo-content {
  max-width: 1400px;
  margin: 0 auto;
}

.chart-section {
  background: rgba(0, 0, 0, 0.3);
  border-radius: 12px;
  border: 1px solid #00bcd4;
  padding: 20px;
  margin-bottom: 30px;
  box-shadow: 0 8px 32px rgba(0, 188, 212, 0.1);
}

.feature-description {
  margin-bottom: 30px;
  
  h2 {
    font-size: 24px;
    color: #00bcd4;
    margin-bottom: 20px;
    text-align: center;
  }
  
  .features-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(250px, 1fr));
    gap: 20px;
    
    .feature-item {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid #00bcd4;
      border-radius: 8px;
      padding: 20px;
      text-align: center;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(0, 188, 212, 0.1);
        transform: translateY(-5px);
        box-shadow: 0 8px 25px rgba(0, 188, 212, 0.3);
      }
      
      .feature-icon {
        font-size: 32px;
        margin-bottom: 15px;
      }
      
      .feature-title {
        font-size: 18px;
        font-weight: bold;
        color: #00bcd4;
        margin-bottom: 10px;
      }
      
      .feature-desc {
        font-size: 14px;
        color: #94a3b8;
        line-height: 1.5;
      }
    }
  }
}

.data-dimensions {
  h2 {
    font-size: 24px;
    color: #00bcd4;
    margin-bottom: 20px;
    text-align: center;
  }
  
  .dimensions-grid {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
    gap: 20px;
    
    .dimension-item {
      background: rgba(0, 0, 0, 0.3);
      border: 1px solid #00bcd4;
      border-radius: 8px;
      padding: 20px;
      
      h3 {
        font-size: 18px;
        color: #00bcd4;
        margin-bottom: 15px;
        text-align: center;
      }
      
      ul {
        list-style: none;
        padding: 0;
        
        li {
          padding: 8px 0;
          border-bottom: 1px solid rgba(0, 188, 212, 0.2);
          color: #e2e8f0;
          font-size: 14px;
          
          &:last-child {
            border-bottom: none;
          }
          
          &:before {
            content: "▶";
            color: #00bcd4;
            margin-right: 10px;
          }
        }
      }
    }
  }
}

// 响应式设计
@media (max-width: 768px) {
  .demo-header h1 {
    font-size: 24px;
  }
  
  .features-grid {
    grid-template-columns: 1fr;
  }
  
  .dimensions-grid {
    grid-template-columns: 1fr;
  }
}
</style>
