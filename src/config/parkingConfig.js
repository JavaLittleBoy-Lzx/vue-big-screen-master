// 智慧停车配置文件
export const PARKING_CONFIG = {
  // API配置
  API_BASE_URL: process.env.VUE_APP_API_BASE_URL || 'http://localhost:3000/api',
  
  // 数据刷新频率（毫秒）
  REFRESH_INTERVALS: {
    REALTIME_DATA: 5000,      // 实时数据5秒
    CHART_DATA: 30000,        // 图表数据30秒
    ALERT_DATA: 3000,         // 告警数据3秒
    TIME_DISPLAY: 1000        // 时间显示1秒
  },
  
  // 阈值配置
  THRESHOLDS: {
    UTILIZATION: {
      LOW: 60,               // 低利用率阈值
      NORMAL: 85,            // 正常利用率阈值
      HIGH: 95               // 高利用率阈值
    },
    FLOW: {
      PEAK_FACTOR: 1.5,      // 高峰流量倍数
      ALERT_NET_FLOW: 20     // 净流量告警阈值
    },
    PARKING_DURATION: {
      SHORT: 60,             // 短停阈值（分钟）
      MEDIUM: 240,           // 中停阈值（分钟）
      LONG: 480,             // 长停阈值（分钟）
      OVERTIME: 2880         // 超时阈值（分钟，48小时）
    }
  },
  
  // 图表配置
  CHART_COLORS: {
    ENTRY: '#10b981',        // 进场颜色
    EXIT: '#f59e0b',         // 离场颜色
    NET_POSITIVE: '#10b981', // 正净流量
    NET_NEGATIVE: '#ef4444', // 负净流量
    UTILIZATION: {
      LOW: '#3b82f6',        // 低利用率
      NORMAL: '#10b981',     // 正常利用率
      HIGH: '#f59e0b',       // 高利用率
      CRITICAL: '#ef4444'    // 危险利用率
    }
  },
  
  // 区域配置
  PARKING_AREAS: [
    { code: 'A1', name: 'A1区', capacity: 120 },
    { code: 'A2', name: 'A2区', capacity: 150 },
    { code: 'A3', name: 'A3区', capacity: 100 },
    { code: 'A4', name: 'A4区', capacity: 130 },
    { code: 'A5', name: 'A5区', capacity: 140 },
    { code: 'B1', name: 'B1区', capacity: 110 },
    { code: 'B2', name: 'B2区', capacity: 90 },
    { code: 'B3', name: 'B3区', capacity: 120 },
    { code: 'B4', name: 'B4区', capacity: 80 },
    { code: 'B5', name: 'B5区', capacity: 155 }
  ],

  // 停车场基础信息
  PARKING_LOT_INFO: {
    name: 'XX智慧停车场',
    totalCapacity: 1000,
    address: 'XX市XX区XX路XX号',
    phone: '400-123-4567',
    operatingHours: '24小时营业'
  },

  // 告警配置
  ALERT_CONFIG: {
    LEVELS: {
      EMERGENCY: {
        color: '#ef4444',
        priority: 1,
        sound: true,
        description: '紧急'
      },
      WARNING: {
        color: '#f59e0b',
        priority: 2,
        sound: false,
        description: '警告'
      },
      INFO: {
        color: '#3b82f6',
        priority: 3,
        sound: false,
        description: '信息'
      }
    },
    AUTO_PROCESS: {
      enabled: true,
      timeout: 300000, // 5分钟自动处理
      whitelist: ['频繁进出', '短时超时']
    }
  },

  // 收费配置
  PRICING_CONFIG: {
    BASE_RATE: 2,           // 基础费率（元/小时）
    FREE_DURATION: 15,      // 免费时长（分钟）
    MAX_DAILY_FEE: 50,      // 每日最高收费（元）
    VIP_DISCOUNT: 0.8,      // VIP折扣
    MONTHLY_PASS: 300       // 月卡价格（元）
  },

  // 数据展示配置
  DISPLAY_CONFIG: {
    NUMBER_FORMAT: {
      DECIMAL_PLACES: 1,
      THOUSAND_SEPARATOR: ',',
      CURRENCY_SYMBOL: '¥'
    },
    TIME_FORMAT: {
      DATE_FORMAT: 'YYYY年MM月DD日',
      TIME_FORMAT: 'HH:mm:ss',
      DATETIME_FORMAT: 'YYYY年MM月DD日 HH:mm:ss'
    },
    CHART_ANIMATION: {
      DURATION: 1500,
      EASING: 'cubicOut'
    }
  },

  // 性能配置
  PERFORMANCE_CONFIG: {
    MAX_DATA_POINTS: 100,   // 图表最大数据点数
    CACHE_DURATION: 60000,  // 缓存持续时间（毫秒）
    BATCH_SIZE: 50,         // 批量处理大小
    DEBOUNCE_DELAY: 300     // 防抖延迟（毫秒）
  }
};
