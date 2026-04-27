// 进出口车辆数据服务
class VehicleFlowDataService {
  constructor() {
    this.baseUrl = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8675';
  }

  // 获取进出口车辆统计数据
  async getVehicleFlowData(timeRange = 'daily', parkName = '东北林业大学') {
    try {
      // 调用后端统计分析接口
      const response = await this.request('/parking/analysis/vehicle-flow/statistics', {
        parkName: parkName,
        timeRange: timeRange
      }, 'POST');
      
      console.log('进出口车辆分析response', response);
      if (response.code === '0' && response.data) {
        return this.formatResponseData(response.data);
      } else {
        console.warn('后端接口返回异常，使用模拟数据:', response.message);
        return this.getMockVehicleFlowData(timeRange);
      }
    } catch (error) {
      console.error('获取进出口车辆数据失败，使用模拟数据:', error);
      return this.getMockVehicleFlowData(timeRange);
    }
  }

  // 获取详细统计数据（用于弹窗）
  async getDetailStatistics(timePoint, parkName = '东北林业大学', timeRange = 'daily') {
    try {
      // 调用后端详细统计接口
      const response = await this.request('/parking/analysis/vehicle-flow/detail-statistics', {
        parkName: parkName,
        timePoint: timePoint,
        timeRange: timeRange
      }, 'POST');
      if (response.code === '0' && response.data) {
        return this.formatDetailResponseData(response.data);
      } else {
        console.warn('后端详细统计接口返回异常，使用模拟数据:', response.message);
        return this.getMockDetailStatistics(timePoint);
      }
    } catch (error) {
      console.error('获取详细统计数据失败，使用模拟数据:', error);
      return this.getMockDetailStatistics(timePoint);
    }
  }

  // 获取通道详情统计数据（用于弹窗）
  async getChannelDetailStatistics(channelType, parkName = '东北林业大学', timeRange = 'daily', startTime = null, endTime = null) {
    try {
      // 调用后端通道详情统计接口
      const response = await this.request('/parking/analysis/vehicle-flow/channel-detail-statistics', {
        parkName: parkName,
        channelType: channelType,
        timeRange: timeRange,
        startTime: startTime,
        endTime: endTime
      }, 'POST');
      
      console.log('通道详情统计response', response.data);
      if (response.code === '0' && response.data) {
        return this.formatChannelDetailResponseData(response.data);
      } else {
        console.warn('后端通道详情统计接口返回异常，使用模拟数据:', response.message);
        return this.getMockChannelDetailStatistics(channelType, timeRange);
      }
    } catch (error) {
      console.error('获取通道详情统计数据失败，使用模拟数据:', error);
      return this.getMockChannelDetailStatistics(channelType, timeRange);
    }
  }

  // 处理进出口车辆数据
  processVehicleFlowData(entryData, exitData, timeRange) {
    // 按时间分组数据
    const timeData = this.groupDataByTime(entryData, exitData, timeRange);
    
    // 分析通道分布
    const channelStats = this.analyzeChannelStats(entryData, exitData);
    
    // 分析车辆类型分布
    const vehicleTypes = this.analyzeVehicleTypes(entryData, exitData);

    return {
      timeData,
      channelStats,
      vehicleTypes,
      summary: this.calculateSummary(timeData)
    };
  }

  // 按时间分组数据
  groupDataByTime(entryData, exitData, timeRange) {
    const timeLabels = this.getTimeLabels(timeRange);
    const timeStats = {};

    // 初始化时间数据
    timeLabels.forEach(label => {
      timeStats[label] = {
        entry: 0,
        exit: 0
      };
    });

    // 处理进场数据
    entryData.forEach(record => {
      const timeLabel = this.getTimeLabelFromRecord(record, timeRange);
      if (timeStats[timeLabel]) {
        timeStats[timeLabel].entry++;
      }
    });

    // 处理出场数据
    exitData.forEach(record => {
      const timeLabel = this.getTimeLabelFromRecord(record, timeRange);
      if (timeStats[timeLabel]) {
        timeStats[timeLabel].exit++;
      }
    });

    // 转换为数组格式
    return timeLabels.map(label => ({
      time: label,
      entry: timeStats[label].entry,
      exit: timeStats[label].exit,
      netFlow: timeStats[label].entry - timeStats[label].exit
    }));
  }

  // 分析通道统计
  analyzeChannelStats(entryData, exitData) {
    const channelStats = {};

    // 处理进场数据
    entryData.forEach(record => {
      const channel = this.getChannelName(record);
      if (!channelStats[channel]) {
        channelStats[channel] = { entry: 0, exit: 0 };
      }
      channelStats[channel].entry++;
    });

    // 处理出场数据
    exitData.forEach(record => {
      const channel = this.getChannelName(record);
      if (!channelStats[channel]) {
        channelStats[channel] = { entry: 0, exit: 0 };
      }
      channelStats[channel].exit++;
    });

    // 转换为数组格式并排序
    return Object.keys(channelStats).map(channel => ({
      name: channel,
      entry: channelStats[channel].entry,
      exit: channelStats[channel].exit,
      total: channelStats[channel].entry + channelStats[channel].exit
    })).sort((a, b) => b.total - a.total);
  }

  // 分析车辆类型分布
  analyzeVehicleTypes(entryData, exitData) {
    const typeStats = {};

    // 处理进场数据
    entryData.forEach(record => {
      const vehicleType = this.getVehicleType(record);
      if (!typeStats[vehicleType]) {
        typeStats[vehicleType] = { entry: 0, exit: 0 };
      }
      typeStats[vehicleType].entry++;
    });

    // 处理出场数据
    exitData.forEach(record => {
      const vehicleType = this.getVehicleType(record);
      if (!typeStats[vehicleType]) {
        typeStats[vehicleType] = { entry: 0, exit: 0 };
      }
      typeStats[vehicleType].exit++;
    });

    // 转换为数组格式并排序
    return Object.keys(typeStats).map(type => ({
      name: type,
      entry: typeStats[type].entry,
      exit: typeStats[type].exit,
      total: typeStats[type].entry + typeStats[type].exit
    })).sort((a, b) => b.total - a.total);
  }

  // 获取通道名称
  getChannelName(record) {
    return record.enterChannelName || record.leaveChannelName || '未知通道';
  }

  // 获取车辆类型
  getVehicleType(record) {
    const plateNumber = record.carLicenseNumber;
    if (plateNumber && plateNumber.length === 8) {
      return '新能源车';
    } else if (plateNumber && plateNumber.length === 7) {
      return '油车';
    }
    return '未知类型';
  }

  // 获取时间标签
  getTimeLabels(timeRange) {
    switch (timeRange) {
      case 'daily':
        return Array.from({ length: 24 }, (_, i) => `${i}:00`);
      case 'weekly':
        return ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
      case 'monthly':
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        return Array.from({ length: daysInMonth }, (_, i) => `${i + 1}日`);
      case 'yearly':
        return ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
      default:
        return Array.from({ length: 24 }, (_, i) => `${i}:00`);
    }
  }

  // 从记录中获取时间标签
  getTimeLabelFromRecord(record, timeRange) {
    const timeStr = record.enterTime || record.leaveTime;
    if (!timeStr) return this.getTimeLabels(timeRange)[0];

    const date = new Date(timeStr);
    
    switch (timeRange) {
      case 'daily':
        return `${date.getHours()}:00`;
      case 'weekly':
        const weekDays = ['周日', '周一', '周二', '周三', '周四', '周五', '周六'];
        return weekDays[date.getDay()];
      case 'monthly':
        return `${date.getDate()}日`;
      case 'yearly':
        return `${date.getMonth() + 1}月`;
      default:
        return `${date.getHours()}:00`;
    }
  }

  // 计算汇总统计
  calculateSummary(timeData) {
    const totalEntry = timeData.reduce((sum, item) => sum + item.entry, 0);
    const totalExit = timeData.reduce((sum, item) => sum + item.exit, 0);
    const netFlow = totalEntry - totalExit;
    
    // 找出高峰时段
    const peakEntry = timeData.reduce((max, item) => item.entry > max.entry ? item : max);
    const peakExit = timeData.reduce((max, item) => item.exit > max.exit ? item : max);

    return {
      totalEntry,
      totalExit,
      netFlow,
      peakEntryTime: peakEntry.time,
      peakEntryCount: peakEntry.entry,
      peakExitTime: peakExit.time,
      peakExitCount: peakExit.exit
    };
  }

  // 格式化响应数据
  formatResponseData(data) {
    return {
      timeData: data.timeData || [],
      channelStats: data.channelStats || [],
      vehicleTypes: data.vehicleTypes || [],
      summary: data.summary || {},
      dataSource: data.dataSource || 'UNKNOWN'
    };
  }

  // 格式化详细响应数据
  formatDetailResponseData(data) {
    return {
      timeData: Array.isArray(data.timeData) ? data.timeData : [],
      channelStats: data.channelStats || [],
      vehicleTypes: data.vehicleTypes || [],
      timePoint: data.timePoint || '',
      dataSource: data.dataSource || 'UNKNOWN'
    };
  }

  // 格式化通道详情响应数据
  formatChannelDetailResponseData(data) {
    return {
      channelStats: data.channelStats || [],
      hourlyData: data.hourlyData || [],
      vehicleTypes: data.vehicleTypeStats || [],
      summary: data.summary || {},
      timeRange: data.timeRange || 'daily',
      channelType: data.channelType || 'entry',
      parkName: data.parkName || '东北林业大学',
      dataSource: data.dataSource || 'UNKNOWN'
    };
  }

  // HTTP请求方法
  async request(url, params = {}, method = 'GET') {
    try {
      let fullUrl = `${this.baseUrl}${url}`;
      let options = {
        method: method,
        headers: {
          'Content-Type': 'application/json',
        }
      };

      if (method === 'GET') {
        const queryString = new URLSearchParams(params).toString();
        fullUrl = `${fullUrl}?${queryString}`;
      } else {
        options.body = JSON.stringify(params);
      }
      
      const response = await fetch(fullUrl, options);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      return await response.json();
    } catch (error) {
      console.error('API请求失败:', error);
      throw error;
    }
  }

  // 模拟数据（用于测试和演示）
  getMockVehicleFlowData(timeRange = 'daily') {
    let timeLabels, timeData;
    
    switch (timeRange) {
      case 'daily':
        timeLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        timeData = timeLabels.map((time, index) => {
          const baseEntry = index >= 7 && index <= 9 ? 80 + Math.random() * 40 : 
                           index >= 17 && index <= 19 ? 70 + Math.random() * 30 :
                           index >= 22 || index <= 6 ? 5 + Math.random() * 15 :
                           30 + Math.random() * 20;
          const baseExit = baseEntry * (0.8 + Math.random() * 0.2);
          return {
            time,
            entry: Math.floor(baseEntry),
            exit: Math.floor(baseExit),
            netFlow: Math.floor(baseEntry - baseExit)
          };
        });
        break;
      case 'weekly':
        timeLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        timeData = timeLabels.map((day, index) => {
          const baseEntry = index < 5 ? 800 + Math.random() * 200 : 600 + Math.random() * 150;
          const baseExit = baseEntry * (0.85 + Math.random() * 0.1);
          return {
            time: day,
            entry: Math.floor(baseEntry),
            exit: Math.floor(baseExit),
            netFlow: Math.floor(baseEntry - baseExit)
          };
        });
        break;
      case 'monthly':
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        timeLabels = Array.from({ length: daysInMonth }, (_, i) => `${i + 1}日`);
        timeData = timeLabels.map((day, index) => {
          const baseEntry = 1000 + Math.random() * 500;
          const baseExit = baseEntry * (0.9 + Math.random() * 0.1);
          return {
            time: day,
            entry: Math.floor(baseEntry),
            exit: Math.floor(baseExit),
            netFlow: Math.floor(baseEntry - baseExit)
          };
        });
        break;
      case 'yearly':
        timeLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        timeData = timeLabels.map((month, index) => {
          const baseEntry = 20000 + Math.random() * 10000;
          const baseExit = baseEntry * (0.95 + Math.random() * 0.05);
          return {
            time: month,
            entry: Math.floor(baseEntry),
            exit: Math.floor(baseExit),
            netFlow: Math.floor(baseEntry - baseExit)
          };
        });
        break;
      default:
        timeLabels = Array.from({ length: 24 }, (_, i) => `${i}:00`);
        timeData = timeLabels.map((time, index) => ({
          time,
          entry: Math.floor(Math.random() * 50) + 10,
          exit: Math.floor(Math.random() * 45) + 8,
          netFlow: Math.floor(Math.random() * 10) - 5
        }));
    }
    
    return {
      timeData,
      channelStats: [
        { name: '东门入口', entry: 450, exit: 420, total: 870 },
        { name: '西门入口', entry: 380, exit: 360, total: 740 },
        { name: '南门入口', entry: 320, exit: 300, total: 620 },
        { name: '北门入口', entry: 280, exit: 270, total: 550 },
        { name: '东门出口', entry: 0, exit: 420, total: 420 },
        { name: '西门出口', entry: 0, exit: 360, total: 360 },
        { name: '南门出口', entry: 0, exit: 300, total: 300 },
        { name: '北门出口', entry: 0, exit: 270, total: 270 }
      ],
      vehicleTypes: [
        { name: '油车', entry: 1200, exit: 1150, total: 2350 },
        { name: '新能源车', entry: 800, exit: 750, total: 1550 },
        { name: '未知类型', entry: 50, exit: 45, total: 95 }
      ],
      summary: {
        totalEntry: 2050,
        totalExit: 1945,
        netFlow: 105,
        peakEntryTime: '8:00',
        peakEntryCount: 156,
        peakExitTime: '18:00',
        peakExitCount: 142
      },
      dataSource: 'MOCK'
    };
  }

  // 获取模拟详细统计数据
  getMockDetailStatistics(timePoint) {
    return {
      timeData: [],
      channelStats: [
        { name: '东门入口', entry: 450, exit: 420, total: 870 },
        { name: '西门入口', entry: 380, exit: 360, total: 740 },
        { name: '南门入口', entry: 320, exit: 300, total: 620 },
        { name: '北门入口', entry: 280, exit: 270, total: 550 },
        { name: '东门出口', entry: 0, exit: 420, total: 420 },
        { name: '西门出口', entry: 0, exit: 360, total: 360 },
        { name: '南门出口', entry: 0, exit: 300, total: 300 },
        { name: '北门出口', entry: 0, exit: 270, total: 270 }
      ],
      vehicleTypes: [
        { name: '油车', entry: 1200, exit: 1150, total: 2350 },
        { name: '新能源车', entry: 800, exit: 750, total: 1550 },
        { name: '未知类型', entry: 50, exit: 45, total: 95 }
      ],
      timePoint: timePoint,
      dataSource: 'MOCK'
    };
  }

  // 获取模拟通道详情统计数据
  getMockChannelDetailStatistics(channelType, timeRange) {
    // 根据通道类型生成不同的通道数据
    let channelStats;
    if (channelType === 'entry') {
      // 进口通道数据
      channelStats = [
        { name: '3号门入口', entry: 90, exit: 0, total: 90 },
        { name: '5号门入口', entry: 69, exit: 0, total: 69 },
        { name: '8号门入口', entry: 86, exit: 0, total: 86 },
        { name: '银行门入口', entry: 80, exit: 0, total: 80 }
      ];
    } else if (channelType === 'exit') {
      // 出口通道数据
      channelStats = [
        { name: '3号门出口', entry: 0, exit: 85, total: 85 },
        { name: '5号门出口', entry: 0, exit: 65, total: 65 },
        { name: '8号门出口', entry: 0, exit: 82, total: 82 },
        { name: '银行门出口', entry: 0, exit: 75, total: 75 }
      ];
    } else {
      // 所有通道数据
      channelStats = [
        { name: '3号门入口', entry: 90, exit: 85, total: 175 },
        { name: '5号门入口', entry: 69, exit: 65, total: 134 },
        { name: '8号门入口', entry: 86, exit: 82, total: 168 },
        { name: '银行门入口', entry: 80, exit: 75, total: 155 },
        { name: '3号门出口', entry: 0, exit: 85, total: 85 },
        { name: '5号门出口', entry: 0, exit: 65, total: 65 },
        { name: '8号门出口', entry: 0, exit: 82, total: 82 },
        { name: '银行门出口', entry: 0, exit: 75, total: 75 }
      ];
    }

    // 生成模拟的每小时数据
    const timeLabels = this.getTimeLabels(timeRange);
    const hourlyData = timeLabels.map((hour, index) => {
      let entry, exit;
      if (channelType === 'entry') {
        entry = Math.floor(Math.random() * 50) + 10;
        exit = 0;
      } else if (channelType === 'exit') {
        entry = 0;
        exit = Math.floor(Math.random() * 45) + 8;
      } else {
        entry = Math.floor(Math.random() * 50) + 10;
        exit = Math.floor(Math.random() * 45) + 8;
      }
      return {
        hour: hour,
        entry: entry,
        exit: exit,
        netFlow: entry - exit
      };
    });

    // 生成模拟的车辆类型数据
    const vehicleTypes = [
      { name: '油车', entry: 120, exit: 110, total: 230 },
      { name: '新能源车', entry: 85, exit: 78, total: 163 },
      { name: '未知类型', entry: 15, exit: 12, total: 27 }
    ];

    // 计算汇总统计
    const summary = {
      totalEntry: hourlyData.reduce((sum, item) => sum + item.entry, 0),
      totalExit: hourlyData.reduce((sum, item) => sum + item.exit, 0),
      netFlow: 0
    };
    summary.netFlow = summary.totalEntry - summary.totalExit;

    return {
      channelStats: channelStats,
      hourlyData: hourlyData,
      vehicleTypes: vehicleTypes,
      summary: summary,
      timeRange: timeRange,
      channelType: channelType,
      parkName: '东北林业大学',
      dataSource: 'MOCK'
    };
  }
}

export const vehicleFlowDataService = new VehicleFlowDataService();
