// 访客和VIP车辆数据服务
class VisitorVipDataService {
  constructor() {
    this.baseUrl = process.env.VUE_APP_API_BASE_URL || 'http://localhost:8675';
  }

  // 获取访客和VIP车辆进出数据
  async getVisitorVipData(timeRange = 'daily', parkName = '东北林业大学') {
    try {
      // 调用后端统计分析接口
      const response = await this.request('/parking/analysis/visitor-vip/statistics', {
        parkName: parkName,
        timeRange: timeRange
      }, 'POST');
      console.log('📡 [统计分析] 后端返回数据:', response.data);
      
      // 检查返回数据是否有效（后端可能返回null或空数据）
      if (response.code === '0' && response.data && 
          response.data.hourlyData && response.data.hourlyData.length > 0) {
        // console.log('✅ [统计分析] 使用真实数据');
        return this.formatResponseData(response.data);
      } else {
        // console.warn('⚠️ [统计分析] 后端无数据或返回null，使用模拟数据');
        return this.getMockVisitorVipData(timeRange);
      }
    } catch (error) {
      console.error('获取访客VIP数据失败，使用模拟数据:', error);
      return this.getMockVisitorVipData(timeRange);
    }
  }

  // 获取详细统计数据（用于弹窗）
  async getDetailStatistics(timePoint, parkName = '东北林业大学', timeRange = 'daily') {
    try {
      // 调用后端详细统计接口
      const response = await this.request('/parking/analysis/visitor-vip/detail-statistics', {
        parkName: parkName,
        timePoint: timePoint,
        timeRange: timeRange
      }, 'POST');
      console.log('📡 [详细统计] 后端返回数据:', response.data);
      
      // 检查返回数据是否有效（后端可能返回null）
      if (response.code === '0' && response.data && 
          response.data.vipTypes && response.data.vipTypes.length > 0) {
        console.log('✅ [详细统计] 使用真实数据');
        return this.formatDetailResponseData(response.data);
      } else {
        console.warn('⚠️ [详细统计] 后端无数据或返回null，使用模拟数据');
        return this.getMockDetailStatistics(timePoint);
      }
    } catch (error) {
      console.error('获取详细统计数据失败，使用模拟数据:', error);
      return this.getMockDetailStatistics(timePoint);
    }
  }


  // 处理访客和VIP数据
  processVisitorVipData(entryData, exitData, timeRange) {
    // 按小时分组数据
    const hourlyData = this.groupDataByHour(entryData, exitData, timeRange);
    
    // 分析VIP类型分布
    const vipTypes = this.analyzeVipTypes(entryData, exitData);
    
    // 分析访客类型分布
    const visitorTypes = this.analyzeVisitorTypes(entryData, exitData);

    return {
      hourlyData,
      vipTypes,
      visitorTypes,
      summary: this.calculateSummary(hourlyData)
    };
  }

  // 按小时分组数据
  groupDataByHour(entryData, exitData, timeRange) {
    const hours = this.getHourRange(timeRange);
    const hourlyStats = {};

    // 初始化每小时数据
    hours.forEach(hour => {
      hourlyStats[hour] = {
        visitorEntry: 0,
        visitorExit: 0,
        vipEntry: 0,
        vipExit: 0
      };
    });

    // 处理进场数据
    entryData.forEach(record => {
      const hour = this.getHourFromTime(record.enterTime);
      if (hourlyStats[hour]) {
        if (this.isVipVehicle(record)) {
          hourlyStats[hour].vipEntry++;
        } else {
          hourlyStats[hour].visitorEntry++;
        }
      }
    });

    // 处理出场数据
    exitData.forEach(record => {
      const hour = this.getHourFromTime(record.leaveTime);
      if (hourlyStats[hour]) {
        if (this.isVipVehicle(record)) {
          hourlyStats[hour].vipExit++;
        } else {
          hourlyStats[hour].visitorExit++;
        }
      }
    });

    // 转换为数组格式
    return hours.map(hour => ({
      hour: `${hour}:00`,
      ...hourlyStats[hour]
    }));
  }

  // 分析VIP类型分布
  analyzeVipTypes(entryData, exitData) {
    const vipTypeStats = {};

    // 处理进场VIP数据
    entryData.forEach(record => {
      if (this.isVipVehicle(record)) {
        const vipType = this.getVipType(record);
        if (!vipTypeStats[vipType]) {
          vipTypeStats[vipType] = { entry: 0, exit: 0 };
        }
        vipTypeStats[vipType].entry++;
      }
    });

    // 处理出场VIP数据
    exitData.forEach(record => {
      if (this.isVipVehicle(record)) {
        const vipType = this.getVipType(record);
        if (!vipTypeStats[vipType]) {
          vipTypeStats[vipType] = { entry: 0, exit: 0 };
        }
        vipTypeStats[vipType].exit++;
      }
    });

    // 转换为数组格式
    return Object.keys(vipTypeStats).map(type => ({
      name: type,
      value: vipTypeStats[type].entry + vipTypeStats[type].exit,
      entry: vipTypeStats[type].entry,
      exit: vipTypeStats[type].exit
    })).sort((a, b) => b.value - a.value);
  }

  // 分析访客类型分布
  analyzeVisitorTypes(entryData, exitData) {
    const visitorTypeStats = {};

    // 处理进场访客数据
    entryData.forEach(record => {
      if (!this.isVipVehicle(record)) {
        const visitorType = this.getVisitorType(record);
        if (!visitorTypeStats[visitorType]) {
          visitorTypeStats[visitorType] = { entry: 0, exit: 0 };
        }
        visitorTypeStats[visitorType].entry++;
      }
    });

    // 处理出场访客数据
    exitData.forEach(record => {
      if (!this.isVipVehicle(record)) {
        const visitorType = this.getVisitorType(record);
        if (!visitorTypeStats[visitorType]) {
          visitorTypeStats[visitorType] = { entry: 0, exit: 0 };
        }
        visitorTypeStats[visitorType].exit++;
      }
    });

    // 转换为数组格式
    return Object.keys(visitorTypeStats).map(type => ({
      name: type,
      value: visitorTypeStats[type].entry + visitorTypeStats[type].exit,
      entry: visitorTypeStats[type].entry,
      exit: visitorTypeStats[type].exit
    })).sort((a, b) => b.value - a.value);
  }

  // 判断是否为VIP车辆
  isVipVehicle(record) {
    // 根据后端代码，enterVipType = 2 表示VIP
    return record.enterVipType === 2 || record.enterVipType === '2';
  }

  // 获取VIP类型
  getVipType(record) {
    // 根据后端代码中的VIP类型映射
    const vipTypeMap = {
      1: '企业VIP',
      2: '政府VIP', 
      3: '酒店VIP',
      4: '商场VIP',
      5: '医院VIP',
      6: '学校VIP',
      7: '银行VIP',
      8: '机场VIP',
      9: '火车站VIP',
      10: '景区VIP',
      11: '体育场VIP',
      12: '会展VIP',
      13: '物流VIP',
      14: '快递VIP',
      15: '外卖VIP',
      16: '维修VIP',
      17: '清洁VIP',
      18: '安保VIP',
      19: '媒体VIP',
      20: '贵宾VIP',
      21: '特殊VIP',
      22: '其他VIP'
    };

    return vipTypeMap[record.enterVipType] || '未知VIP';
  }

  // 获取访客类型
  getVisitorType(record) {
    // 根据vehicleClassification字段获取访客类型
    const visitorTypeMap = {
      1: '临时访客',
      2: '预约访客',
      3: '商务访客',
      4: '家庭访客',
      5: '维修访客',
      6: '配送访客',
      7: '快递访客',
      8: '外卖访客',
      9: '清洁访客',
      10: '安保访客',
      11: '媒体访客',
      12: '其他访客',
      13: '未知访客'
    };

    return visitorTypeMap[record.vehicleClassification] || 
           record.vehicleClassification || 
           '未知访客';
  }

  // 获取时间范围
  getTimeRange(timeRange) {
    const now = new Date();
    let startTime, endTime;

    switch (timeRange) {
      case 'daily':
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
        break;
      case 'weekly':
        const dayOfWeek = now.getDay();
        startTime = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000);
        endTime = new Date(startTime.getTime() + 7 * 24 * 60 * 60 * 1000);
        break;
      case 'monthly':
        startTime = new Date(now.getFullYear(), now.getMonth(), 1);
        endTime = new Date(now.getFullYear(), now.getMonth() + 1, 1);
        break;
      case 'yearly':
        startTime = new Date(now.getFullYear(), 0, 1);
        endTime = new Date(now.getFullYear() + 1, 0, 1);
        break;
      default:
        startTime = new Date(now.getFullYear(), now.getMonth(), now.getDate());
        endTime = new Date(startTime.getTime() + 24 * 60 * 60 * 1000);
    }

    return {
      startTime: this.formatDateTime(startTime),
      endTime: this.formatDateTime(endTime)
    };
  }

  // 获取小时范围
  getHourRange(timeRange) {
    switch (timeRange) {
      case 'daily':
        // 早上5点到晚上12点（5:00-24:00），共20个小时
        return Array.from({ length: 20 }, (_, i) => i + 5);
      case 'weekly':
        return Array.from({ length: 7 }, (_, i) => i);
      case 'monthly':
        return Array.from({ length: 30 }, (_, i) => i + 1);
      case 'yearly':
        return Array.from({ length: 12 }, (_, i) => i + 1);
      default:
        // 早上5点到晚上12点（5:00-24:00），共20个小时
        return Array.from({ length: 20 }, (_, i) => i + 5);
    }
  }

  // 从时间字符串中提取小时
  getHourFromTime(timeStr) {
    if (!timeStr) return 0;
    
    // 处理不同的时间格式
    let date;
    if (timeStr.includes('T')) {
      date = new Date(timeStr);
    } else if (timeStr.includes('-')) {
      date = new Date(timeStr);
    } else {
      // 处理yyyyMMddHHmmss格式
      const year = timeStr.substring(0, 4);
      const month = timeStr.substring(4, 6);
      const day = timeStr.substring(6, 8);
      const hour = timeStr.substring(8, 10);
      date = new Date(`${year}-${month}-${day}T${hour}:00:00`);
    }
    
    return date.getHours();
  }

  // 格式化日期时间
  formatDateTime(date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  // 计算汇总统计
  calculateSummary(hourlyData) {
    return {
      totalVisitorEntry: hourlyData.reduce((sum, item) => sum + item.visitorEntry, 0),
      totalVisitorExit: hourlyData.reduce((sum, item) => sum + item.visitorExit, 0),
      totalVipEntry: hourlyData.reduce((sum, item) => sum + item.vipEntry, 0),
      totalVipExit: hourlyData.reduce((sum, item) => sum + item.vipExit, 0),
      peakHour: this.findPeakHour(hourlyData),
      visitorNetFlow: hourlyData.reduce((sum, item) => sum + (item.visitorEntry - item.visitorExit), 0),
      vipNetFlow: hourlyData.reduce((sum, item) => sum + (item.vipEntry - item.vipExit), 0)
    };
  }

  // 查找高峰时段
  findPeakHour(hourlyData) {
    const totalFlow = hourlyData.map(item => 
      item.visitorEntry + item.visitorExit + item.vipEntry + item.vipExit
    );
    const maxFlow = Math.max(...totalFlow);
    const peakIndex = totalFlow.indexOf(maxFlow);
    return hourlyData[peakIndex]?.hour || '00:00';
  }

  // 格式化响应数据
  formatResponseData(data) {
    return {
      hourlyData: data.hourlyData || [],
      vipTypes: data.vipTypes || [],
      visitorTypes: data.visitorTypes || [],
      summary: data.summary || {},
      dataSource: data.dataSource || 'UNKNOWN'
    };
  }

  // 格式化详细响应数据
  formatDetailResponseData(data) {
    return {
      hourlyData: Array.isArray(data.hourlyData) ? data.hourlyData : [],
      vipTypes: data.vipTypes || [],
      visitorTypes: data.visitorTypes || [],
      timePoint: data.timePoint || '',
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
  getMockVisitorVipData(timeRange = 'daily') {
    let hours, timeLabels;
    
    switch (timeRange) {
      case 'daily':
        // 早上5点到晚上12点（5:00-24:00），共20个小时
        hours = Array.from({ length: 20 }, (_, i) => i + 5);
        timeLabels = hours.map(hour => `${hour}:00`);
        break;
      case 'weekly':
        hours = Array.from({ length: 7 }, (_, i) => i);
        timeLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
        break;
      case 'monthly':
        const now = new Date();
        const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
        hours = Array.from({ length: daysInMonth }, (_, i) => i);
        timeLabels = hours.map(day => `${day + 1}日`);
        break;
      case 'yearly':
        hours = Array.from({ length: 12 }, (_, i) => i);
        timeLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
        break;
      default:
        // 早上5点到晚上12点（5:00-24:00），共20个小时
        hours = Array.from({ length: 20 }, (_, i) => i + 5);
        timeLabels = hours.map(hour => `${hour}:00`);
    }
    
    return {
      hourlyData: hours.map((_, index) => ({
        hour: timeLabels[index],
        visitorEntry: Math.floor(Math.random() * 50) + 10,
        visitorExit: Math.floor(Math.random() * 45) + 8,
        vipEntry: Math.floor(Math.random() * 20) + 5,
        vipExit: Math.floor(Math.random() * 18) + 3
      })),
      vipTypes: [
        { name: '保障车辆(不值班24小时全部门)', value: 45, entry: 23, exit: 22 },
        { name: '二道岗可通行车辆', value: 38, entry: 19, exit: 19 },
        { name: '教职工(地库车辆)', value: 32, entry: 16, exit: 16 },
        { name: '保障车辆(值班48小时全部门)', value: 28, entry: 14, exit: 14 },
        { name: '外聘私车值班(48小时)', value: 25, entry: 13, exit: 12 },
        { name: '教职工离退37号楼居民', value: 22, entry: 11, exit: 11 },
        { name: '超级VIP', value: 20, entry: 10, exit: 10 },
        { name: '外聘教师(校内)', value: 18, entry: 9, exit: 9 }
      ],
      visitorTypes: [
        { name: '基建处车辆', value: 120, entry: 60, exit: 60 },
        { name: '走读学生', value: 85, entry: 43, exit: 42 },
        { name: '非经营活动车辆', value: 65, entry: 33, exit: 32 },
        { name: '兴林宾馆访客', value: 55, entry: 28, exit: 27 },
        { name: '博物馆访客', value: 45, entry: 23, exit: 22 },
        { name: '校友会访客', value: 40, entry: 20, exit: 20 },
        { name: '体育馆自助访客', value: 35, entry: 18, exit: 17 },
        { name: '经营性会议车辆', value: 30, entry: 15, exit: 15 }
      ],
      summary: {
        totalVisitorEntry: 1200,
        totalVisitorExit: 1150,
        totalVipEntry: 450,
        totalVipExit: 420,
        peakHour: '08:00',
        visitorNetFlow: 50,
        vipNetFlow: 30
      },
      dataSource: 'MOCK'
    };
  }

  // 获取模拟详细统计数据
  getMockDetailStatistics(timePoint) {
    return {
      hourlyData: [],
      vipTypes: [
        { name: '保障车辆(不值班24小时全部门)', value: 45, entry: 23, exit: 22 },
        { name: '二道岗可通行车辆', value: 38, entry: 19, exit: 19 },
        { name: '教职工(地库车辆)', value: 32, entry: 16, exit: 16 },
        { name: '保障车辆(值班48小时全部门)', value: 28, entry: 14, exit: 14 },
        { name: '外聘私车值班(48小时)', value: 25, entry: 13, exit: 12 },
        { name: '教职工离退37号楼居民', value: 22, entry: 11, exit: 11 },
        { name: '超级VIP', value: 20, entry: 10, exit: 10 },
        { name: '外聘教师(校内)', value: 18, entry: 9, exit: 9 },
        { name: 'I公务车辆', value: 16, entry: 8, exit: 8 },
        { name: '优秀校友', value: 14, entry: 7, exit: 7 },
        { name: 'IV施工车辆(小)', value: 12, entry: 6, exit: 6 },
        { name: 'IV施工车辆(大)', value: 10, entry: 5, exit: 5 },
        { name: 'Ⅱ类保障车辆(小)', value: 8, entry: 4, exit: 4 },
        { name: 'Ⅲ类居民车辆', value: 6, entry: 3, exit: 3 },
        { name: 'Ⅲ类居民车辆(租)', value: 4, entry: 2, exit: 2 },
        { name: 'Ⅱ类保障车辆(大)', value: 3, entry: 2, exit: 1 },
        { name: 'D类离退私车', value: 2, entry: 1, exit: 1 },
        { name: 'C类外聘私车', value: 2, entry: 1, exit: 1 },
        { name: 'F类合作车辆', value: 1, entry: 1, exit: 0 },
        { name: 'B2类教工私车', value: 1, entry: 1, exit: 0 },
        { name: 'B1类专任教师私车', value: 1, entry: 1, exit: 0 },
        { name: 'A类公车', value: 1, entry: 1, exit: 0 },
        { name: '设备巡检', value: 1, entry: 1, exit: 0 }
      ],
      visitorTypes: [
        { name: '基建处车辆', value: 120, entry: 60, exit: 60 },
        { name: '走读学生', value: 85, entry: 43, exit: 42 },
        { name: '非经营活动车辆', value: 65, entry: 33, exit: 32 },
        { name: '兴林宾馆访客', value: 55, entry: 28, exit: 27 },
        { name: '博物馆访客', value: 45, entry: 23, exit: 22 },
        { name: '校友会访客', value: 40, entry: 20, exit: 20 },
        { name: '体育馆自助访客', value: 35, entry: 18, exit: 17 },
        { name: '经营性会议车辆', value: 30, entry: 15, exit: 15 },
        { name: '个人访客车辆', value: 25, entry: 13, exit: 12 },
        { name: '公务车访客车辆', value: 20, entry: 10, exit: 10 },
        { name: '体育馆访客车辆', value: 15, entry: 8, exit: 7 }
      ],
      timePoint: timePoint,
      dataSource: 'MOCK'
    };
  }
}

export const visitorVipDataService = new VisitorVipDataService();
