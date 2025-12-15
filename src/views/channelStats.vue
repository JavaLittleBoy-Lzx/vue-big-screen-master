<template>
  <div class="channel-stats">
    <div class="chart-header">
      <div class="title">🚪 通道进出情况分析</div>
    </div>
    
    <!-- 通道流量对比图 -->
    <div class="channel-flow-chart">
      <div 
        v-for="(channel, index) in channelData" 
        :key="index"
        class="channel-bar"
      >
        <div class="channel-name">{{ channel.name }}</div>
        <div class="bar-container">
          <div class="bar-group">
            <div class="bar entry-bar" :style="{ height: channel.entry * 2 + 'px' }">
              <span class="bar-value">{{ channel.entry }}</span>
            </div>
            <div class="bar exit-bar" :style="{ height: channel.exit * 2 + 'px' }">
              <span class="bar-value">{{ channel.exit }}</span>
            </div>
          </div>
          <div class="bar-labels">
            <span class="entry-label">进场</span>
            <span class="exit-label">离场</span>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 通道效率分析 -->
    <div class="channel-efficiency">
      <div class="efficiency-title">通道效率分析</div>
      <div class="efficiency-list">
        <div 
          v-for="(channel, index) in channelData" 
          :key="index"
          class="efficiency-item"
        >
          <div class="efficiency-name">{{ channel.name }}</div>
          <div class="efficiency-rate">
            <div class="rate-bar">
              <div class="rate-fill" :style="{ width: (channel.entry + channel.exit) / 2 + '%' }"></div>
            </div>
            <div class="rate-value">{{ Math.round((channel.entry + channel.exit) / 2) }}%</div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
export default {
  name: 'ChannelStats',
  props: {
    channelData: {
      type: Array,
      default: () => [
        { name: '1号门', entry: 45, exit: 32 },
        { name: '2号门', entry: 38, exit: 41 },
        { name: '3号门', entry: 52, exit: 28 },
        { name: '4号门', entry: 29, exit: 35 },
        { name: '5号门', entry: 41, exit: 33 }
      ]
    }
  }
}
</script>

<style lang="scss" scoped>
.channel-stats {
  width: 100%;
  height: 100%;
  padding: 10px;
  display: flex;
  flex-direction: column;
  box-sizing: border-box;
}

.chart-header {
  text-align: center;
  margin-bottom: 10px;
  
  .title {
    font-size: 18px;
    font-weight: bold;
    color: #3b82f6;
    margin-bottom: 5px;
  }
  
  .subtitle {
    font-size: 12px;
    color: #94a3b8;
  }
}

.channel-flow-chart {
  flex: 0 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: end;
  height: 120px;
  margin-bottom: 10px;
  
  .channel-bar {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 10px;
    
    .channel-name {
      font-size: 12px;
      color: #e2e8f0;
      font-weight: bold;
    }
    
    .bar-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 5px;
      
         .bar-group {
         display: flex;
         gap: 3px;
         align-items: end;
         height: 60px;
        
        .bar {
          width: 20px;
          border-radius: 3px;
          position: relative;
          display: flex;
          align-items: end;
          justify-content: center;
          transition: all 0.3s ease;
          
          &.entry-bar {
            background: linear-gradient(to top, #3b82f6, #60a5fa);
          }
          
          &.exit-bar {
            background: linear-gradient(to top, #10b981, #34d399);
          }
          
          .bar-value {
            position: absolute;
            bottom: -20px;
            font-size: 10px;
            color: #e2e8f0;
            font-weight: bold;
          }
        }
      }
      
      .bar-labels {
        display: flex;
        gap: 3px;
        font-size: 9px;
        
        .entry-label {
          color: #3b82f6;
        }
        
        .exit-label {
          color: #10b981;
        }
      }
    }
  }
}

.channel-efficiency {
  .efficiency-title {
    font-size: 14px;
    color: #3b82f6;
    text-align: center;
    margin-bottom: 10px;
    font-weight: bold;
  }
  
  .efficiency-list {
    display: flex;
    flex-direction: column;
    gap: 6px;
    
    .efficiency-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 6px 10px;
      background: rgba(11, 19, 42, 0.6);
      border: 1px solid #1e40af;
      border-radius: 6px;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(11, 19, 42, 0.8);
        border-color: #3b82f6;
      }
      
      .efficiency-name {
        font-size: 12px;
        color: #e2e8f0;
        font-weight: bold;
        min-width: 60px;
      }
      
      .efficiency-rate {
        display: flex;
        align-items: center;
        gap: 10px;
        flex: 1;
        
        .rate-bar {
          flex: 1;
          height: 8px;
          background: rgba(30, 64, 175, 0.3);
          border-radius: 4px;
          overflow: hidden;
          position: relative;
          
          .rate-fill {
            height: 100%;
            background: linear-gradient(90deg, #3b82f6, #60a5fa);
            border-radius: 4px;
            transition: width 0.5s ease;
          }
        }
        
        .rate-value {
          font-size: 11px;
          color: #3b82f6;
          font-weight: bold;
          min-width: 35px;
          text-align: right;
        }
      }
    }
  }
}
</style>

