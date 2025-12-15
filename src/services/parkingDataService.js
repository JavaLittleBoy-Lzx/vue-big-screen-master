// 智慧停车数据服务
class ParkingDataService {
  constructor() {
    this.baseUrl = process.env.VUE_APP_API_BASE_URL || '/api';
  }

  // ===== 综合数据处理方法 =====

  // 实时车流监控数据
  async getRealTimeFlow() {
    const now = new Date();
    const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
    const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
    
    try {
      // 直接使用模拟数据，不再调用具体的数据获取方法
      const entryCount = Math.floor(Math.random() * 20) + 10;
      const exitCount = Math.floor(Math.random() * 18) + 8;
      const netFlow = entryCount - exitCount;
      const hourlyEntry = Math.floor(Math.random() * 30) + 50;
      
      return {
        realtimeEntry: entryCount,
        realtimeExit: exitCount,
        netFlow: netFlow,
        hourlyEntry: hourlyEntry,
        currentVehicles: 423,
        todayEntry: await this.getTodayEntry(),
        utilization: await this.getUtilizationRate(),
        flowTrend: await this.getFlowTrend(), // 最近50个数据点
        channelStats: await this.getChannelStats(),
        prediction: await this.getPrediction()
      };
    } catch (error) {
      // console.error('获取实时车流数据失败:', error);
      return this.getMockRealTimeFlow();
    }
  }

  // 24小时趋势数据
  async getHourlyTrend() {
    try {
      const today = new Date();
      const startOfDay = new Date(today.getFullYear(), today.getMonth(), today.getDate());
      // const endOfDay = new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000);

      const hourlyData = [];
      for (let hour = 0; hour < 24; hour++) {
        // 直接使用模拟数据，生成不同时段的车流量
        const baseEntry = hour >= 7 && hour <= 9 ? 120 + Math.random() * 40 : 
                         hour >= 17 && hour <= 19 ? 100 + Math.random() * 30 :
                         hour >= 22 || hour <= 6 ? 10 + Math.random() * 20 :
                         50 + Math.random() * 30;
        
        const entryCount = Math.floor(baseEntry);
        const exitCount = Math.floor(baseEntry * 0.8 + Math.random() * 20);
        
        hourlyData.push({
          hour,
          entryCount: entryCount,
          exitCount: exitCount,
          isPeak: entryCount > 150 // 定义高峰时段阈值
        });
      }

      // 计算统计指标
      const entryValues = hourlyData.map(d => d.entryCount);
      const peakEntry = Math.max(...entryValues);
      const lowEntry = Math.min(...entryValues.filter(v => v > 0));
      const peakHour = hourlyData.find(d => d.entryCount === peakEntry);

      return {
        hourlyData,
        statistics: {
          peakHour: `${peakHour.hour}:00-${peakHour.hour + 1}:00`,
          peakFlow: `${peakEntry}辆/h`,
          lowHour: '02:00-06:00',
          lowFlow: `${lowEntry}辆/h`
        }
      };
    } catch (error) {
      console.error('获取24小时趋势数据失败:', error);
      return this.getMockHourlyTrend();
    }
  }

  // 车辆轨迹数据
  async getVehicleTrajectory() {
    try {
      // 模拟车辆轨迹数据
      return {
        trajectories: [
          {
            vehicleId: '黑A12345',
            path: [
              { x: 100, y: 150, timestamp: Date.now() - 300000, status: 'entry' },
              { x: 200, y: 200, timestamp: Date.now() - 240000, status: 'parking' },
              { x: 200, y: 200, timestamp: Date.now() - 180000, status: 'parking' },
              { x: 150, y: 100, timestamp: Date.now() - 60000, status: 'exit' }
            ]
          },
          {
            vehicleId: '黑B67890',  
            path: [
              { x: 50, y: 100, timestamp: Date.now() - 420000, status: 'entry' },
              { x: 150, y: 250, timestamp: Date.now() - 360000, status: 'parking' },
              { x: 150, y: 250, timestamp: Date.now() - 120000, status: 'parking' }
            ]
          }
        ],
        stats: {
          totalVehicles: 2,
          averageStayTime: '2.5小时',
          mostVisitedArea: '停车区域A'
        }
      };
    } catch (error) {
      console.error('获取车辆轨迹数据失败:', error);
      return {
        trajectories: [],
        stats: {
          totalVehicles: 0,
          averageStayTime: '0小时',
          mostVisitedArea: '无'
        }
      };
    }
  }

  // 停车时长分布数据
  async getParkingDuration() {
    try {
      // 直接使用模拟数据，不再调用getExitData
      const exitData = this.generateMockExitData();
      
      const durationStats = {
        short: 0,    // 0-1h
        medium: 0,   // 1-4h
        long: 0,     // 4-8h
        veryLong: 0  // >8h
      };

      exitData.forEach(record => {
        const duration = record.parking_duration; // 分钟
        if (duration <= 60) {
          durationStats.short++;
        } else if (duration <= 240) {
          durationStats.medium++;
        } else if (duration <= 480) {
          durationStats.long++;
        } else {
          durationStats.veryLong++;
        }
      });

      const total = exitData.length;
      
      return {
        distribution: [
          { name: '短停(0-1h)', value: durationStats.short, rate: (durationStats.short / total * 100).toFixed(1) },
          { name: '中停(1-4h)', value: durationStats.medium, rate: (durationStats.medium / total * 100).toFixed(1) },
          { name: '长停(4-8h)', value: durationStats.long, rate: (durationStats.long / total * 100).toFixed(1) },
          { name: '超长停(>8h)', value: durationStats.veryLong, rate: (durationStats.veryLong / total * 100).toFixed(1) }
        ],
        avgDuration: (exitData.reduce((sum, r) => sum + r.parking_duration, 0) / total / 60).toFixed(1) + '小时'
      };
    } catch (error) {
      console.error('获取停车时长数据失败:', error);
      return this.getMockDurationData();
    }
  }

  // 区域车位数据
  async getAreaSpaceData() {
    try {
      // 直接使用模拟数据，不再调用getAreaSpaceStats
      const areaStats = this.generateMockAreaSpaceData();
      
      const areaData = areaStats.map(area => ({
        name: area.area_name,
        total: area.total_spaces,
        occupied: area.occupied_spaces,
        available: area.available_spaces,
        utilization: area.utilization_rate,
        status: this.getAreaStatus(area.utilization_rate)
      }));

      // 生成热力图数据
      const heatmapData = areaData.map((area, index) => ({
        x: index % 5,  // 5列网格
        y: Math.floor(index / 5),
        value: area.utilization,
        name: area.name,
        occupied: area.occupied,
        total: area.total
      }));

      const totalSpaces = areaData.reduce((sum, area) => sum + area.total, 0);
      const totalOccupied = areaData.reduce((sum, area) => sum + area.occupied, 0);
      const totalUtilization = (totalOccupied / totalSpaces * 100).toFixed(1);

      return {
        areaData,
        heatmapData,
        summary: {
          totalSpaces,
          occupiedSpaces: totalOccupied,
          availableSpaces: totalSpaces - totalOccupied,
          totalUtilization: parseFloat(totalUtilization),
          nearFullAreas: areaData.filter(a => a.utilization > 90).map(a => a.name)
        }
      };
    } catch (error) {
      console.error('获取区域车位数据失败:', error);
      return this.getMockAreaSpaceData();
    }
  }

  // 流量对比分析数据
  async getFlowComparison() {
    try {
      const today = new Date();
      const hours = [];
      
      // 获取今天每小时的进出场数据
      for (let hour = 6; hour <= 23; hour++) {
        // 直接使用模拟数据生成流量数据
        const baseEntry = hour >= 7 && hour <= 9 ? 120 + Math.random() * 40 : 
                         hour >= 17 && hour <= 19 ? 100 + Math.random() * 30 :
                         hour >= 22 || hour <= 6 ? 10 + Math.random() * 20 :
                         50 + Math.random() * 30;
        
        const entryCount = Math.floor(baseEntry);
        const exitCount = Math.floor(baseEntry * 0.8 + Math.random() * 20);
        
        hours.push({
          hour: `${hour}:00`,
          entryCount: entryCount,
          exitCount: exitCount,
          balance: entryCount - exitCount
        });
      }

      // 计算平衡系数
      const totalEntry = hours.reduce((sum, h) => sum + h.entryCount, 0);
      const totalExit = hours.reduce((sum, h) => sum + h.exitCount, 0);
      const balanceRatio = totalExit / totalEntry;

      // 找出高峰时段
      const peakEntry = hours.reduce((max, h) => h.entryCount > max.entryCount ? h : max);
      const peakExit = hours.reduce((max, h) => h.exitCount > max.exitCount ? h : max);

      return {
        hourlyData: hours,
        statistics: {
          balanceRatio: balanceRatio.toFixed(2),
          peakEntryTime: peakEntry.hour,
          peakEntryCount: peakEntry.entryCount,
          peakExitTime: peakExit.hour,
          peakExitCount: peakExit.exitCount
        }
      };
    } catch (error) {
      console.error('获取流量对比数据失败:', error);
      return this.getMockFlowComparison();
    }
  }

  // 异常监控数据
  // async getAnomalyMonitor() {
  //   try {
  //     const [blacklistData, debtData, currentVehicles] = await Promise.all([
  //       // this.getBlacklistData(),
  //       // this.getDebtVehicles(),
  //       // this.getCurrentVehicles()
  //     ]);

  //     // 统计超时停车
  //     const now = new Date();
  //     const overtimeVehicles = currentVehicles.filter(vehicle => {
  //       const entryTime = new Date(vehicle.entry_time);
  //       const hoursParked = (now - entryTime) / (1000 * 60 * 60);
  //       return hoursParked > 48; // 超过48小时
  //     });

  //     // 统计频繁进出
  //     const frequentVehicles = await this.getFrequentVehicles();

  //     // 告警统计
  //     const alertStats = {
  //       emergency: blacklistData.length + debtData.filter(d => d.debt_amount > 100).length,
  //       warning: overtimeVehicles.length + debtData.filter(d => d.debt_amount <= 100).length,
  //       info: frequentVehicles.length,
  //       processed: 45, // 从历史数据获取
  //       processing: 15  // 从历史数据获取
  //     };

  //     // 异常分布
  //     const anomalyDistribution = [
  //       { name: '黑名单', value: blacklistData.length },
  //       { name: '欠费', value: debtData.length },
  //       { name: '超时', value: overtimeVehicles.length },
  //       { name: '频繁', value: frequentVehicles.length },
  //       { name: '其他', value: 5 }
  //     ];

  //     // 风险车辆排行
  //     const riskVehicles = this.generateRiskRanking(blacklistData, debtData);

  //     return {
  //       alertStats,
  //       anomalyDistribution,
  //       riskVehicles,
  //       totalAlerts: alertStats.emergency + alertStats.warning + alertStats.info,
  //       processingEfficiency: ((alertStats.processed / (alertStats.processed + alertStats.processing)) * 100).toFixed(0),
  //       avgResponseTime: '3.2分钟',
  //       weeklyImprovement: -15,
  //       bestProcessor: '张三(45件)'
  //     };
  //   } catch (error) {
  //     console.error('获取异常监控数据失败:', error);
  //     return this.getMockAnomalyData();
  //   }
  // }

  // ===== 辅助方法 =====

  getAreaStatus(utilization) {
    if (utilization > 95) return 'critical';
    if (utilization > 85) return 'high';
    if (utilization > 70) return 'normal';
    return 'low';
  }

  getDurationLabel(key) {
    const labels = {
      veryShort: '0-30min',
      short: '30min-1h',
      shortMedium: '1-2h',
      medium: '2-3h',
      mediumLong: '3-4h',
      long: '4-6h',
      veryLong: '6-8h',
      extremelyLong: '8-12h',
      ultraLong: '12-24h',
      megaLong: '>24h'
    };
    return labels[key] || key;
  }

  getPaymentStatusLabel(status) {
    const labels = {
      '已付': '已付费',
      '未付': '未付费',
      '免费': '免费停车'
    };
    return labels[status] || status;
  }

  generateRiskRanking(blacklist, debt) {
    const vehicles = [];
    
    // 添加黑名单车辆（高风险）
    blacklist.slice(0, 10).forEach(vehicle => {
      vehicles.push({
        plateNumber: vehicle.plate_number,
        type: '黑名单',
        riskLevel: '🔴高',
        status: '已处理'
      });
    });

    // 添加欠费车辆（中风险）
    debt.slice(0, 5).forEach(vehicle => {
      vehicles.push({
        plateNumber: vehicle.plate_number,
        type: '欠费',
        riskLevel: '🟡中',
        status: '处理中'
      });
    });

    return vehicles.slice(0, 15); // 返回前15条
  }

  async request(url, params = {}) {
    try {
      console.log(`📡 发送请求: ${this.baseUrl}${url}`, params);
      
      // 构建请求URL，如果有参数则添加到URL中
      const requestUrl = Object.keys(params).length > 0 
        ? `${this.baseUrl}${url}?${new URLSearchParams(params).toString()}`
        : `${this.baseUrl}${url}`;
      
      // 使用真实的HTTP请求
      const response = await fetch(requestUrl, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP错误: ${response.status} - ${response.statusText}`);
      }
      
      const data = await response.json();
      console.log(`✅ 请求成功: ${url}`, data);
      
      // 检查响应格式
      if (data.code === '0' && data.data) {
        return data.data;
      } else if (data.code === 0 && data.data) {
        return data.data;
      } else {
        console.warn(`⚠️ 非标准响应格式，使用模拟数据: ${url}`, data);
        return this.getMockData(url);
      }
      
    } catch (error) {
      console.error(`❌ 请求失败 ${url}:`, error);
      console.log(`🔄 使用模拟数据作为降级方案: ${url}`);
      return this.getMockData(url);
    }
  }

  getMockData(url) {
    // 根据不同的URL返回不同的模拟数据
    const mockDataMap = {
      '/parking/entry': this.generateMockEntryData(),
      '/parking/exit': this.generateMockExitData(),
      '/parking/spaces': this.generateMockSpaceData(),
      '/parking/current-vehicles': this.generateMockCurrentVehicles(),
      '/parking/flow': this.generateMockFlowData(),
      '/parking/area-spaces': this.generateMockAreaSpaceData(),
      '/parking/blacklist': this.generateMockBlacklistData(),
      '/parking/debt-vehicles': this.generateMockDebtData(),
      '/parking/pre-entry': this.generateMockPreEntryData(),
      '/parking/pre-exit': this.generateMockPreExitData(),
      // 新增的后端API端点映射
      '/parking/vehicle-records/report_car_in': this.generateMockEntryData(),
      '/parking/vehicle-records/report_car_out': this.generateMockExitData(),
      '/parking/vehicle-records/onsite': this.generateMockCurrentVehicles(),
      '/parking/nefuData/getLatestVehicleRecords': this.generateMockEntryData(),
      '/parking/nefuData/getLatestCarInRecords': this.generateMockEntryData(),
      '/parking/nefuData/getLatestCarOutRecords': this.generateMockExitData()
    };

    return mockDataMap[url] || {};
  }

  // ===== 模拟数据生成方法 =====
  
  generateMockEntryData() {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < 50; i++) {
      const entryTime = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
      data.push({
        plate_number: this.generatePlateNumber(),
        entry_time: entryTime.toISOString(),
        channel_id: `CH${Math.floor(Math.random() * 4) + 1}`,
        parking_area: `A${Math.floor(Math.random() * 5) + 1}`,
        vehicle_type: Math.random() > 0.8 ? 'VIP' : '普通',
        operator: '系统自动'
      });
    }
    
    return data;
  }

  generateMockExitData() {
    const data = [];
    const now = new Date();
    
    for (let i = 0; i < 45; i++) {
      const exitTime = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
      // 调整停车时长分布，增加长时停车比例
      const rand = Math.random();
      let duration;
      if (rand < 0.4) {
        duration = Math.floor(Math.random() * 120) + 30; // 30-150分钟 (40%)
      } else if (rand < 0.7) {
        duration = Math.floor(Math.random() * 180) + 150; // 150-330分钟 (30%)
      } else if (rand < 0.9) {
        duration = Math.floor(Math.random() * 300) + 330; // 330-630分钟 (20%)
      } else if (rand < 0.98) {
        duration = Math.floor(Math.random() * 720) + 630; // 630-1350分钟 (8%)
      } else {
        duration = Math.floor(Math.random() * 1440) + 1350; // 1350-2790分钟 (2%)
      }
      const fee = this.calculateParkingFee(duration);
      
      data.push({
        plate_number: this.generatePlateNumber(),
        exit_time: exitTime.toISOString(),
        channel_id: `CH${Math.floor(Math.random() * 4) + 1}`,
        parking_duration: duration,
        parking_fee: fee,
        payment_status: Math.random() > 0.1 ? '已付' : '未付'
      });
    }
    
    return data;
  }

  calculateParkingFee(duration) {
    // 简单的计费规则：2元/小时，不足1小时按1小时计
    const hours = Math.ceil(duration / 60);
    return hours * 2;
  }

  generatePlateNumber() {
    const provinces = ['京', '粤', '沪', '津', '冀'];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    const province = provinces[Math.floor(Math.random() * provinces.length)];
    const letter = letters[Math.floor(Math.random() * letters.length)];
    const number = Array(5).fill().map(() => 
      Math.random() > 0.5 ? 
        numbers[Math.floor(Math.random() * numbers.length)] :
        letters[Math.floor(Math.random() * letters.length)]
    ).join('');
    
    return `${province}${letter}${number}`;
  }

  generateMockSpaceData() {
    return {
      total_spaces: 1000,
      occupied_spaces: 785,
      available_spaces: 215,
      update_time: new Date().toISOString()
    };
  }

  generateMockCurrentVehicles() {
    const vehicles = [];
    const now = new Date();
    
    for (let i = 0; i < 423; i++) {
      const entryTime = new Date(now.getTime() - Math.random() * 8 * 60 * 60 * 1000);
      vehicles.push({
        plate_number: this.generatePlateNumber(),
        entry_time: entryTime.toISOString(),
        parking_area: `A${Math.floor(Math.random() * 5) + 1}`
      });
    }
    
    return vehicles;
  }

  generateMockFlowData() {
    return {
      entry_count: Math.floor(Math.random() * 20) + 10,
      exit_count: Math.floor(Math.random() * 18) + 8
    };
  }

  generateMockAreaSpaceData() {
    const areas = ['A1区', 'A2区', 'A3区', 'A4区', 'A5区', 'B1区', 'B2区', 'B3区', 'B4区', 'B5区'];
    return areas.map((name) => ({
      area_name: name,
      total_spaces: 100 + Math.floor(Math.random() * 50),
      occupied_spaces: Math.floor((100 + Math.floor(Math.random() * 50)) * (0.6 + Math.random() * 0.3)),
      available_spaces: 0,
      utilization_rate: Math.floor((0.6 + Math.random() * 0.3) * 100)
    }));
  }

  generateMockBlacklistData() {
    const data = [];
    for (let i = 0; i < 8; i++) {
      data.push({
        plate_number: this.generatePlateNumber(),
        blacklist_type: ['逃费', '恶意占用', '违规停车'][Math.floor(Math.random() * 3)],
        blacklist_reason: '多次违规',
        add_time: new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000).toISOString(),
        status: '有效'
      });
    }
    return data;
  }

  generateMockDebtData() {
    const data = [];
    for (let i = 0; i < 12; i++) {
      data.push({
        plate_number: this.generatePlateNumber(),
        debt_amount: Math.floor(Math.random() * 200) + 10,
        debt_days: Math.floor(Math.random() * 30) + 1,
        last_exit_time: new Date(Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000).toISOString(),
        total_amount: Math.floor(Math.random() * 300) + 50
      });
    }
    return data;
  }

  generateMockPreEntryData() {
    const data = [];
    for (let i = 0; i < 1000; i++) {
      data.push({
        plate_number: this.generatePlateNumber(),
        pre_entry_time: new Date(Date.now() + Math.random() * 2 * 60 * 60 * 1000).toISOString(),
        channel_id: `CH${Math.floor(Math.random() * 4) + 1}`
      });
    }
    return data;
  }

  generateMockPreExitData() {
    const data = [];
    for (let i = 0; i < 850; i++) {
      data.push({
        plate_number: this.generatePlateNumber(),
        pre_exit_time: new Date(Date.now() + Math.random() * 1 * 60 * 60 * 1000).toISOString()
      });
    }
    return data;
  }

  // 其他辅助方法
  async getTodayEntry() {
    return 156;
  }

  async getUtilizationRate() {
    return 78.5;
  }

  async getFlowTrend() {
    return Array(50).fill().map((_, i) => ({
      time: new Date(Date.now() - (49 - i) * 30 * 1000),
      entry: Math.floor(Math.random() * 20) + 10,
      exit: Math.floor(Math.random() * 18) + 8,
      vip: Math.floor(Math.random() * 5)
    }));
  }

  async getChannelStats() {
    return [
      { channel: 'CH1', count: 45, efficiency: 95 },
      { channel: 'CH2', count: 38, efficiency: 88 },
      { channel: 'CH3', count: 42, efficiency: 92 },
      { channel: 'CH4', count: 31, efficiency: 85 }
    ];
  }

  async getPrediction() {
    return '+28';
  }

  async getFlowPaths() {
    return [
      { from: '入口A', to: '区域1', value: 45 },
      { from: '入口A', to: '区域2', value: 32 },
      { from: '入口B', to: '区域3', value: 28 },
      { from: '区域1', to: '出口A', value: 42 },
      { from: '区域2', to: '出口B', value: 35 }
    ];
  }

  // Mock数据方法
  getMockRealTimeFlow() {
    return {
      realtimeEntry: 156,
      realtimeExit: 142,
      netFlow: 14,
      hourlyEntry: 85,
      currentVehicles: 423,
      todayEntry: 156,
      utilization: 78.5,
      flowTrend: Array(50).fill().map((_, i) => ({
        time: new Date(Date.now() - (49 - i) * 30 * 1000),
        entry: Math.floor(Math.random() * 20) + 10,
        exit: Math.floor(Math.random() * 18) + 8,
        vip: Math.floor(Math.random() * 5)
      })),
      channelStats: [
        { channel: 'CH1', count: 45, efficiency: 95 },
        { channel: 'CH2', count: 38, efficiency: 88 },
        { channel: 'CH3', count: 42, efficiency: 92 },
        { channel: 'CH4', count: 31, efficiency: 85 }
      ],
      prediction: '+28'
    };
  }

  getMockTrajectoryData() {
    return {
      funnelData: [
        { name: '预约进场', value: 1000, rate: 100 },
        { name: '到达停车场', value: 950, rate: 95 },
        { name: '成功进场', value: 920, rate: 92 },
        { name: '正常停车', value: 890, rate: 89 },
        { name: '正常离场', value: 850, rate: 85 },
        { name: '完成支付', value: 820, rate: 82 }
      ],
      pathData: [
        { from: '入口A', to: '区域1', value: 45 },
        { from: '入口A', to: '区域2', value: 32 },
        { from: '入口B', to: '区域3', value: 28 },
        { from: '区域1', to: '出口A', value: 42 },
        { from: '区域2', to: '出口B', value: 35 }
      ],
      realTimeFlow: {
        entryRate: '156辆/h',
        popularPath: '入口A→区域1→出口A',
        congestionAlert: '区域1出口轻微拥堵'
      }
    };
  }

  getMockHourlyTrend() {
    const hourlyData = [];
    for (let hour = 0; hour < 24; hour++) {
      const baseEntry = hour >= 7 && hour <= 9 ? 120 + Math.random() * 40 : 
                       hour >= 17 && hour <= 19 ? 100 + Math.random() * 30 :
                       hour >= 22 || hour <= 6 ? 10 + Math.random() * 20 :
                       50 + Math.random() * 30;
      
      hourlyData.push({
        hour,
        entryCount: Math.floor(baseEntry),
        exitCount: Math.floor(baseEntry * 0.8 + Math.random() * 20),
        isPeak: baseEntry > 150
      });
    }

    return {
      hourlyData,
      statistics: {
        peakHour: '8:00-9:00',
        peakFlow: '156辆/h',
        lowHour: '02:00-06:00',
        lowFlow: '15辆/h'
      }
    };
  }

  getMockDurationData() {
    return {
      distribution: [
        { name: '短停(0-1h)', value: 245, rate: '35.2' },
        { name: '中停(1-4h)', value: 312, rate: '44.8' },
        { name: '长停(4-8h)', value: 98, rate: '14.1' },
        { name: '超长停(>8h)', value: 41, rate: '5.9' }
      ],
      avgDuration: '2.3小时'
    };
  }

  getMockAreaSpaceData() {
    const areas = ['A1区', 'A2区', 'A3区', 'A4区', 'A5区', 'B1区', 'B2区', 'B3区', 'B4区', 'B5区'];
    const areaData = areas.map((name) => ({
      name,
      total: 100 + Math.floor(Math.random() * 50),
      occupied: Math.floor((100 + Math.floor(Math.random() * 50)) * (0.6 + Math.random() * 0.3)),
      available: 0,
      utilization: Math.floor((0.6 + Math.random() * 0.3) * 100),
      status: 'normal'
    }));

    const totalSpaces = areaData.reduce((sum, area) => sum + area.total, 0);
    const totalOccupied = areaData.reduce((sum, area) => sum + area.occupied, 0);

    return {
      areaData,
      heatmapData: areaData.map((area, index) => ({
        x: index % 5,
        y: Math.floor(index / 5),
        value: area.utilization,
        name: area.name,
        occupied: area.occupied,
        total: area.total
      })),
      summary: {
        totalSpaces,
        occupiedSpaces: totalOccupied,
        availableSpaces: totalSpaces - totalOccupied,
        totalUtilization: 78.5,
        nearFullAreas: ['A1区', 'B2区']
      }
    };
  }

  getMockFlowComparison() {
    const hours = [];
    for (let hour = 6; hour <= 23; hour++) {
      const baseEntry = hour >= 7 && hour <= 9 ? 120 + Math.random() * 40 : 
                       hour >= 17 && hour <= 19 ? 100 + Math.random() * 30 :
                       hour >= 22 || hour <= 6 ? 10 + Math.random() * 20 :
                       50 + Math.random() * 30;
      
      hours.push({
        hour: `${hour}:00`,
        entryCount: Math.floor(baseEntry),
        exitCount: Math.floor(baseEntry * 0.8 + Math.random() * 20),
        balance: Math.floor(baseEntry - baseEntry * 0.8 - Math.random() * 20)
      });
    }

    return {
      hourlyData: hours,
      statistics: {
        balanceRatio: '0.85',
        peakEntryTime: '8:00',
        peakEntryCount: 156,
        peakExitTime: '18:00',
        peakExitCount: 142
      }
    };
  }

  getMockAnomalyData() {
    return {
      alertStats: {
        emergency: 8,
        warning: 12,
        info: 5,
        processed: 45,
        processing: 15
      },
      anomalyDistribution: [
        { name: '黑名单', value: 8 },
        { name: '欠费', value: 12 },
        { name: '超时', value: 3 },
        { name: '频繁', value: 5 },
        { name: '其他', value: 5 }
      ],
      riskVehicles: [
        { plateNumber: '京A12345', type: '黑名单', riskLevel: '🔴高', status: '已处理' },
        { plateNumber: '粤B67890', type: '欠费', riskLevel: '🟡中', status: '处理中' },
        { plateNumber: '沪C11111', type: '超时', riskLevel: '🟡中', status: '处理中' },
        { plateNumber: '津D22222', type: '频繁', riskLevel: '🔵低', status: '监控中' },
        { plateNumber: '冀E33333', type: '欠费', riskLevel: '🟡中', status: '处理中' }
      ],
      totalAlerts: 25,
      processingEfficiency: '75',
      avgResponseTime: '3.2分钟',
      weeklyImprovement: -15,
      bestProcessor: '张三(45件)'
    };
  }
}

export const parkingDataService = new ParkingDataService();
