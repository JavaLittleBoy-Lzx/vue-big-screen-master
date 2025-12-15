# 进出场记录轮询使用指南（前端）

## 概述

本文档说明如何在前端实现进出场记录的定时轮询功能，替代原有的WebSocket实时推送方式。

## 实现方案

### 方案对比

| 特性 | WebSocket推送 | 定时轮询 |
|------|--------------|---------|
| 实时性 | 高（毫秒级） | 中（秒级） |
| 服务器压力 | 高（需维护连接） | 低 |
| 网络带宽 | 占用高 | 占用低 |
| 实现复杂度 | 高 | 低 |
| 稳定性 | 中（连接易断） | 高 |
| 负载均衡 | 困难 | 容易 |

### 推荐配置

```javascript
const POLLING_CONFIG = {
  INITIAL_LIMIT: 50,        // 首次加载数量
  POLLING_LIMIT: 50,        // 轮询查询数量
  POLLING_INTERVAL: 5000,   // 轮询间隔（毫秒）
  MAX_RECORDS: 100,         // 前端保持的最大记录数
  RETRY_TIMES: 3,           // 失败重试次数
  RETRY_DELAY: 2000,        // 重试延迟（毫秒）
};
```

## API接口

### 1. 获取最新进出场记录

**接口地址：** `GET /parking/nefuData/getLatestVehicleRecords`

**请求参数：**

```typescript
interface QueryParams {
  limit?: number;      // 查询数量，默认50
  lastTime?: string;   // 上次查询时间，格式：yyyy-MM-dd HH:mm:ss
}
```

**响应数据：**

```typescript
interface VehicleRecord {
  id: number;
  plateNumber: string;
  channel: string;
  vipName: string;
  time: string;
  eventType: 'in' | 'out';
  status: '进场' | '离场';
  imageUrl: string;
  vipType: string;
  carType: string;
  carColor: string;
  enterType?: string;
  leaveType?: string;
  amountReceivable?: string;
  stoppingTime?: string;
  enterTime?: string;
  createTime: string;
}

interface ApiResponse {
  code: string;
  msg: string;
  data: {
    records: VehicleRecord[];
    total: number;
    queryTime: string;
  };
}
```

## Vue 3 实现示例

### 1. Composition API 完整示例

创建文件：`src/composables/useVehicleRecords.ts`

```typescript
import { ref, onMounted, onUnmounted } from 'vue';
import axios from 'axios';

interface VehicleRecord {
  id: number;
  plateNumber: string;
  channel: string;
  vipName: string;
  time: string;
  eventType: 'in' | 'out';
  status: '进场' | '离场';
  imageUrl: string;
  vipType: string;
  carType: string;
  carColor: string;
  createTime: string;
  [key: string]: any;
}

interface UseVehicleRecordsOptions {
  initialLimit?: number;
  pollingLimit?: number;
  pollingInterval?: number;
  maxRecords?: number;
  autoStart?: boolean;
}

export function useVehicleRecords(options: UseVehicleRecordsOptions = {}) {
  const {
    initialLimit = 50,
    pollingLimit = 50,
    pollingInterval = 5000,
    maxRecords = 100,
    autoStart = true,
  } = options;

  // 状态
  const records = ref<VehicleRecord[]>([]);
  const loading = ref(false);
  const error = ref<string | null>(null);
  const lastQueryTime = ref<string | null>(null);
  
  let pollInterval: number | null = null;
  let retryCount = 0;
  const MAX_RETRY = 3;

  // API基础URL
  const BASE_URL = '/parking/nefuData';

  /**
   * 加载初始数据
   */
  const loadInitialData = async () => {
    loading.value = true;
    error.value = null;

    try {
      const response = await axios.get(`${BASE_URL}/getLatestVehicleRecords`, {
        params: { limit: initialLimit },
      });

      if (response.data.code === '0') {
        records.value = response.data.data.records;
        lastQueryTime.value = response.data.data.queryTime;
        retryCount = 0;
        console.log('✅ 成功加载初始数据:', records.value.length, '条');
      } else {
        throw new Error(response.data.msg || '加载失败');
      }
    } catch (err: any) {
      error.value = err.message || '加载数据失败';
      console.error('❌ 加载初始数据失败:', err);
      
      // 重试
      if (retryCount < MAX_RETRY) {
        retryCount++;
        console.log(`🔄 重试加载数据 (${retryCount}/${MAX_RETRY})...`);
        setTimeout(loadInitialData, 2000 * retryCount);
      }
    } finally {
      loading.value = false;
    }
  };

  /**
   * 轮询新数据
   */
  const pollNewData = async () => {
    // 如果正在加载，跳过本次轮询
    if (loading.value) {
      console.log('⏭️ 跳过本次轮询（正在加载）');
      return;
    }

    try {
      const params: any = { limit: pollingLimit };
      if (lastQueryTime.value) {
        params.lastTime = lastQueryTime.value;
      }

      const response = await axios.get(`${BASE_URL}/getLatestVehicleRecords`, {
        params,
      });

      if (response.data.code === '0') {
        const newRecords = response.data.data.records;
        
        if (newRecords.length > 0) {
          console.log('🔔 发现新数据:', newRecords.length, '条');
          
          // 将新数据添加到列表顶部
          records.value = [...newRecords, ...records.value];
          
          // 限制列表长度
          if (records.value.length > maxRecords) {
            records.value = records.value.slice(0, maxRecords);
          }
          
          // 更新查询时间
          lastQueryTime.value = response.data.data.queryTime;
          
          // 触发新数据事件（可选）
          emitNewRecords(newRecords);
        }
        
        retryCount = 0;
      }
    } catch (err: any) {
      console.error('❌ 轮询数据失败:', err);
      error.value = err.message || '轮询失败';
      
      // 轮询失败不影响继续轮询，但记录错误次数
      if (retryCount < MAX_RETRY) {
        retryCount++;
      } else {
        // 连续失败太多次，停止轮询
        console.error('🛑 连续失败次数过多，停止轮询');
        stopPolling();
      }
    }
  };

  /**
   * 开始轮询
   */
  const startPolling = () => {
    if (pollInterval) {
      console.log('⚠️ 轮询已在运行');
      return;
    }

    console.log(`🚀 开始轮询，间隔: ${pollingInterval}ms`);
    pollInterval = window.setInterval(pollNewData, pollingInterval);
  };

  /**
   * 停止轮询
   */
  const stopPolling = () => {
    if (pollInterval) {
      clearInterval(pollInterval);
      pollInterval = null;
      console.log('🛑 停止轮询');
    }
  };

  /**
   * 重启轮询
   */
  const restartPolling = () => {
    stopPolling();
    startPolling();
  };

  /**
   * 手动刷新
   */
  const refresh = async () => {
    lastQueryTime.value = null;
    await loadInitialData();
  };

  /**
   * 清空记录
   */
  const clearRecords = () => {
    records.value = [];
    lastQueryTime.value = null;
  };

  /**
   * 触发新数据事件（用于通知、声音提示等）
   */
  const emitNewRecords = (newRecords: VehicleRecord[]) => {
    // 可以在这里添加通知、声音提示等逻辑
    newRecords.forEach(record => {
      console.log(`📢 新${record.status}: ${record.plateNumber} @ ${record.channel}`);
    });
  };

  /**
   * 筛选进场记录
   */
  const getCarInRecords = () => {
    return records.value.filter(r => r.eventType === 'in');
  };

  /**
   * 筛选离场记录
   */
  const getCarOutRecords = () => {
    return records.value.filter(r => r.eventType === 'out');
  };

  // 生命周期
  onMounted(() => {
    loadInitialData();
    if (autoStart) {
      startPolling();
    }
  });

  onUnmounted(() => {
    stopPolling();
  });

  return {
    // 状态
    records,
    loading,
    error,
    lastQueryTime,
    
    // 方法
    loadInitialData,
    pollNewData,
    startPolling,
    stopPolling,
    restartPolling,
    refresh,
    clearRecords,
    getCarInRecords,
    getCarOutRecords,
  };
}
```

### 2. 组件使用示例

创建文件：`src/views/VehicleRecordsView.vue`

```vue
<template>
  <div class="vehicle-records-container">
    <!-- 头部操作栏 -->
    <div class="header">
      <h2>进出场记录</h2>
      <div class="actions">
        <el-button 
          type="primary" 
          :loading="loading" 
          @click="refresh"
        >
          刷新
        </el-button>
        <el-button 
          v-if="!isPolling" 
          type="success" 
          @click="startPolling"
        >
          开始轮询
        </el-button>
        <el-button 
          v-else 
          type="warning" 
          @click="stopPolling"
        >
          停止轮询
        </el-button>
        <el-button 
          type="danger" 
          @click="clearRecords"
        >
          清空
        </el-button>
      </div>
    </div>

    <!-- 统计信息 -->
    <div class="stats">
      <el-row :gutter="20">
        <el-col :span="6">
          <el-statistic title="总记录数" :value="records.length" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="进场" :value="carInCount" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="离场" :value="carOutCount" />
        </el-col>
        <el-col :span="6">
          <el-statistic title="最后更新" :value="lastQueryTime || '未更新'" />
        </el-col>
      </el-row>
    </div>

    <!-- 错误提示 -->
    <el-alert
      v-if="error"
      type="error"
      :title="error"
      :closable="true"
      show-icon
      @close="error = null"
    />

    <!-- 加载中 -->
    <div v-if="loading && records.length === 0" class="loading">
      <el-skeleton :rows="5" animated />
    </div>

    <!-- 记录列表 -->
    <div v-else class="records-list">
      <TransitionGroup name="list">
        <div
          v-for="record in records"
          :key="record.id"
          :class="['record-item', record.eventType]"
        >
          <!-- 车辆图片 -->
          <div class="image-container">
            <el-image
              :src="record.imageUrl"
              fit="cover"
              lazy
            >
              <template #error>
                <div class="image-slot">
                  <el-icon><Picture /></el-icon>
                </div>
              </template>
            </el-image>
          </div>

          <!-- 信息区域 -->
          <div class="info-container">
            <div class="header-row">
              <div class="plate-number">{{ record.plateNumber }}</div>
              <el-tag 
                :type="record.eventType === 'in' ? 'success' : 'danger'"
                effect="dark"
              >
                {{ record.status }}
              </el-tag>
            </div>

            <div class="detail-row">
              <div class="detail-item">
                <el-icon><Location /></el-icon>
                <span>{{ record.channel }}</span>
              </div>
              <div class="detail-item">
                <el-icon><User /></el-icon>
                <span>{{ record.vipName }}</span>
              </div>
              <div class="detail-item">
                <el-icon><Clock /></el-icon>
                <span>{{ record.time }}</span>
              </div>
            </div>

            <!-- 离场特有信息 -->
            <div v-if="record.eventType === 'out'" class="extra-info">
              <div v-if="record.amountReceivable" class="detail-item">
                <el-icon><Money /></el-icon>
                <span>费用：¥{{ record.amountReceivable }}</span>
              </div>
              <div v-if="record.stoppingTime" class="detail-item">
                <el-icon><Timer /></el-icon>
                <span>停留：{{ record.stoppingTime }}</span>
              </div>
            </div>
          </div>
        </div>
      </TransitionGroup>
    </div>

    <!-- 空状态 -->
    <el-empty 
      v-if="!loading && records.length === 0" 
      description="暂无数据"
    />
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useVehicleRecords } from '@/composables/useVehicleRecords';
import { 
  Picture, 
  Location, 
  User, 
  Clock, 
  Money, 
  Timer 
} from '@element-plus/icons-vue';

// 使用组合式函数
const {
  records,
  loading,
  error,
  lastQueryTime,
  startPolling,
  stopPolling,
  refresh,
  clearRecords,
  getCarInRecords,
  getCarOutRecords,
} = useVehicleRecords({
  initialLimit: 50,
  pollingLimit: 50,
  pollingInterval: 5000,
  maxRecords: 100,
  autoStart: true,
});

// 计算属性
const isPolling = computed(() => {
  // 这里可以通过一个ref来跟踪轮询状态
  return true; // 简化示例
});

const carInCount = computed(() => getCarInRecords().length);
const carOutCount = computed(() => getCarOutRecords().length);
</script>

<style scoped lang="scss">
.vehicle-records-container {
  padding: 20px;

  .header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h2 {
      margin: 0;
      font-size: 24px;
      font-weight: bold;
    }

    .actions {
      display: flex;
      gap: 10px;
    }
  }

  .stats {
    margin-bottom: 20px;
    padding: 20px;
    background: #f5f7fa;
    border-radius: 8px;
  }

  .records-list {
    display: grid;
    grid-template-columns: repeat(auto-fill, minmax(350px, 1fr));
    gap: 20px;

    .record-item {
      display: flex;
      gap: 15px;
      padding: 15px;
      background: white;
      border-radius: 8px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;

      &:hover {
        box-shadow: 0 4px 16px rgba(0, 0, 0, 0.15);
        transform: translateY(-2px);
      }

      &.in {
        border-left: 4px solid #67c23a;
      }

      &.out {
        border-left: 4px solid #f56c6c;
      }

      .image-container {
        flex-shrink: 0;
        width: 120px;
        height: 90px;
        border-radius: 4px;
        overflow: hidden;

        .el-image {
          width: 100%;
          height: 100%;
        }

        .image-slot {
          display: flex;
          justify-content: center;
          align-items: center;
          width: 100%;
          height: 100%;
          background: #f5f7fa;
          color: #909399;
          font-size: 30px;
        }
      }

      .info-container {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .header-row {
          display: flex;
          justify-content: space-between;
          align-items: center;

          .plate-number {
            font-size: 18px;
            font-weight: bold;
            color: #303133;
          }
        }

        .detail-row,
        .extra-info {
          display: flex;
          flex-wrap: wrap;
          gap: 10px;

          .detail-item {
            display: flex;
            align-items: center;
            gap: 4px;
            font-size: 14px;
            color: #606266;

            .el-icon {
              font-size: 16px;
            }
          }
        }
      }
    }
  }

  .loading {
    padding: 20px;
  }
}

// 列表过渡动画
.list-enter-active,
.list-leave-active {
  transition: all 0.5s ease;
}

.list-enter-from {
  opacity: 0;
  transform: translateY(-30px);
}

.list-leave-to {
  opacity: 0;
  transform: translateX(30px);
}

.list-move {
  transition: transform 0.5s ease;
}
</style>
```

### 3. 大屏展示组件示例

创建文件：`src/components/VehicleRecordsDisplay.vue`

```vue
<template>
  <div class="vehicle-records-display">
    <div class="title">
      <span>实时进出场</span>
      <span class="update-time">{{ lastQueryTime }}</span>
    </div>

    <div class="records-container">
      <TransitionGroup name="slide-fade">
        <div
          v-for="record in displayRecords"
          :key="record.id"
          :class="['record-card', record.eventType]"
        >
          <div class="status-indicator"></div>
          
          <div class="car-image">
            <img :src="record.imageUrl" alt="车辆图片" />
          </div>

          <div class="car-info">
            <div class="plate">{{ record.plateNumber }}</div>
            <div class="meta">
              <span class="channel">{{ record.channel }}</span>
              <span class="time">{{ formatTime(record.time) }}</span>
            </div>
            <div class="vip-info">{{ record.vipName }}</div>
          </div>

          <div class="status-badge">
            {{ record.status }}
          </div>
        </div>
      </TransitionGroup>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue';
import { useVehicleRecords } from '@/composables/useVehicleRecords';
import dayjs from 'dayjs';

const props = defineProps({
  limit: {
    type: Number,
    default: 10,
  },
});

const { records, lastQueryTime } = useVehicleRecords({
  initialLimit: props.limit,
  pollingLimit: props.limit,
  pollingInterval: 3000,
  maxRecords: props.limit,
  autoStart: true,
});

const displayRecords = computed(() => {
  return records.value.slice(0, props.limit);
});

const formatTime = (time: string) => {
  return dayjs(time).format('HH:mm:ss');
};
</script>

<style scoped lang="scss">
.vehicle-records-display {
  width: 100%;
  height: 100%;
  padding: 20px;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  border-radius: 12px;
  overflow: hidden;

  .title {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;
    padding-bottom: 15px;
    border-bottom: 2px solid rgba(255, 255, 255, 0.2);
    font-size: 24px;
    font-weight: bold;
    color: white;

    .update-time {
      font-size: 14px;
      font-weight: normal;
      opacity: 0.8;
    }
  }

  .records-container {
    height: calc(100% - 70px);
    overflow-y: auto;
    
    &::-webkit-scrollbar {
      width: 6px;
    }

    &::-webkit-scrollbar-thumb {
      background: rgba(255, 255, 255, 0.3);
      border-radius: 3px;
    }

    .record-card {
      display: flex;
      align-items: center;
      gap: 15px;
      margin-bottom: 15px;
      padding: 15px;
      background: rgba(255, 255, 255, 0.95);
      border-radius: 8px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      position: relative;
      overflow: hidden;

      &::before {
        content: '';
        position: absolute;
        left: 0;
        top: 0;
        width: 4px;
        height: 100%;
        background: linear-gradient(180deg, #67c23a 0%, #85ce61 100%);
      }

      &.out::before {
        background: linear-gradient(180deg, #f56c6c 0%, #f78989 100%);
      }

      .status-indicator {
        width: 10px;
        height: 10px;
        border-radius: 50%;
        background: #67c23a;
        animation: pulse 2s ease-in-out infinite;
      }

      &.out .status-indicator {
        background: #f56c6c;
      }

      .car-image {
        width: 100px;
        height: 75px;
        border-radius: 6px;
        overflow: hidden;
        flex-shrink: 0;

        img {
          width: 100%;
          height: 100%;
          object-fit: cover;
        }
      }

      .car-info {
        flex: 1;
        display: flex;
        flex-direction: column;
        gap: 8px;

        .plate {
          font-size: 20px;
          font-weight: bold;
          color: #303133;
        }

        .meta {
          display: flex;
          gap: 15px;
          font-size: 14px;
          color: #606266;

          .channel {
            display: flex;
            align-items: center;
            gap: 4px;

            &::before {
              content: '📍';
            }
          }

          .time {
            display: flex;
            align-items: center;
            gap: 4px;

            &::before {
              content: '🕐';
            }
          }
        }

        .vip-info {
          font-size: 13px;
          color: #909399;
        }
      }

      .status-badge {
        flex-shrink: 0;
        padding: 8px 16px;
        border-radius: 20px;
        font-size: 14px;
        font-weight: bold;
        color: white;
        background: #67c23a;
      }

      &.out .status-badge {
        background: #f56c6c;
      }
    }
  }
}

// 动画
@keyframes pulse {
  0%, 100% {
    opacity: 1;
    transform: scale(1);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

.slide-fade-enter-active {
  transition: all 0.6s ease;
}

.slide-fade-leave-active {
  transition: all 0.4s ease;
}

.slide-fade-enter-from {
  transform: translateX(-30px);
  opacity: 0;
}

.slide-fade-leave-to {
  transform: translateX(30px);
  opacity: 0;
}
</style>
```

## 配置说明

### 1. 开发环境配置

在`vite.config.ts`或`vue.config.js`中配置代理：

```typescript
// vite.config.ts
export default defineConfig({
  server: {
    proxy: {
      '/parking': {
        target: 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
});
```

### 2. Axios配置

创建文件：`src/utils/request.ts`

```typescript
import axios from 'axios';
import { ElMessage } from 'element-plus';

const request = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000,
});

// 请求拦截器
request.interceptors.request.use(
  (config) => {
    // 可以在这里添加token等
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// 响应拦截器
request.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    ElMessage.error(error.message || '请求失败');
    return Promise.reject(error);
  }
);

export default request;
```

### 3. 环境变量配置

创建文件：`.env.development`

```bash
# 开发环境
VITE_API_BASE_URL=http://localhost:8080
```

创建文件：`.env.production`

```bash
# 生产环境
VITE_API_BASE_URL=http://your-production-api.com
```

## 性能优化建议

### 1. 使用虚拟滚动

对于大量数据，使用虚拟滚动提高性能：

```bash
npm install vue-virtual-scroller
```

```vue
<template>
  <RecycleScroller
    :items="records"
    :item-size="120"
    key-field="id"
    v-slot="{ item }"
  >
    <VehicleRecordItem :record="item" />
  </RecycleScroller>
</template>
```

### 2. 图片懒加载

使用Element Plus的图片懒加载：

```vue
<el-image :src="record.imageUrl" lazy />
```

### 3. 防抖和节流

对于频繁触发的事件，使用防抖或节流：

```typescript
import { debounce } from 'lodash-es';

const debouncedRefresh = debounce(refresh, 1000);
```

## 故障处理

### 1. 连接失败处理

```typescript
const handleConnectionError = () => {
  // 停止轮询
  stopPolling();
  
  // 显示错误提示
  ElMessage.error('连接失败，已停止轮询');
  
  // 提供重连按钮
  ElMessageBox.confirm(
    '是否重新连接？',
    '连接失败',
    {
      confirmButtonText: '重新连接',
      cancelButtonText: '取消',
    }
  ).then(() => {
    restartPolling();
  });
};
```

### 2. 数据异常处理

```typescript
const validateRecord = (record: VehicleRecord): boolean => {
  return !!(
    record.id &&
    record.plateNumber &&
    record.time &&
    record.eventType
  );
};

// 在添加记录前验证
const filteredRecords = newRecords.filter(validateRecord);
```

## 总结

通过定时轮询替代WebSocket，我们获得了：

1. **更好的稳定性** - 不需要维护长连接
2. **更容易的部署** - 支持负载均衡和CDN
3. **更低的服务器压力** - 减少连接数
4. **更灵活的控制** - 可以随时启停、调整间隔

同时需要注意：

1. **合理设置轮询间隔** - 平衡实时性和性能
2. **做好错误处理** - 网络异常时的降级策略
3. **优化前端性能** - 虚拟滚动、懒加载等
4. **监控和日志** - 及时发现和处理问题

