// 车辆数据服务 - 调用后端API获取真实数据
import axios from 'axios';
import { API_CONFIG } from '@/config/apiConfig';
import { websocketService } from './websocketService';

class VehicleDataService {
  constructor() {
    // 使用配置文件中的API设置
    this.baseUrl = API_CONFIG.BACKEND_URL;
    this.apiPrefix = API_CONFIG.API_PREFIX;
    
    // 创建axios实例
    this.http = axios.create({
      baseURL: this.baseUrl,
      timeout: API_CONFIG.TIMEOUT,
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    // 请求拦截器
    this.http.interceptors.request.use(
      config => {
        // console.log('发送请求:', config.url);
        return config;
      },
      error => {
        console.error('请求错误:', error);
        return Promise.reject(error);
      }
    );
    
    // 响应拦截器
    this.http.interceptors.response.use(
      response => {
        // console.log('收到响应:', response.data);
        return response;
      },
      error => {
        console.error('响应错误:', error);
        return Promise.reject(error);
      }
    );
  }

  /**
   * 获取车辆进出场记录
   * 从后端API查询最新的记录
   */
  async getVehicleRecords(limit = 50, lastTime = null) {
    try {
      
      // 调用后端API查询最新记录
      console.log('🚗 [车辆记录] 开始查询最新记录...');
      const response = await axios.get('http://10.100.111.2:8675/parking/nefuData/getLatestVehicleRecords', {
        params: {
          limit: limit,
          lastTime: lastTime
        }
      });
    
      console.log('🚗 [车辆记录] 查询成功:', response.data);
      // 检查返回数据是否有效
      if (response.data.code === '0' && response.data.data && response.data.data.records) {
        const records = response.data.data.records;
        return records;
      } else {
        console.warn('⚠️ [车辆记录] 后端无数据或返回异常');
        return [];
      }
    } catch (error) {
      console.error('❌ 获取车辆进出场记录失败:', error);
      return [];
    }
  }

  /**
   * 获取增量车辆记录（只查询上次时间之后的新记录）
   * @param {string} lastTime 上次查询的最后时间
   * @param {number} limit 最大查询数量
   */
  async getIncrementalVehicleRecords(lastTime, limit = 10) {
    try {
      // console.log('🔄 查询增量车辆记录...', { lastTime, limit });
      
      const response = await axios.get('http://10.100.111.2:8675/parking/nefuData/getLatestVehicleRecords', {
        params: {
          limit: limit,
          lastTime: lastTime
        }
      });
      console.log('🔄 查询增量车辆记录...', response.data.data);
      if (response.data.data.code === '0' && response.data.data && response.data.data.records) {
        const records = response.data.data.records;
        console.log(`✅ [增量查询] 查询到 ${records.length} 条新记录`);
        return records;
      } else {
        return [];
      }
    } catch (error) {
      console.error('❌ 查询增量记录失败:', error);
      return [];
    }
  }

  /**
   * 获取最新进场记录
   */
  async getLatestCarInRecords(limit = 50, lastTime = null) {
    try {
      const response = await axios.get('http://10.100.111.2:8675/parking/nefuData/getLatestCarInRecords', {
        params: {
          limit: limit,
          lastTime: lastTime
        }
      });
      console.log('🚗 [最新进场记录] 查询成功:', response.data.data.records);
      
      if (response.data.code === '0' && response.data.data && response.data.data.records) {
        return response.data.data.records;
      }
      return [];
    } catch (error) {
      console.error('❌ 获取进场记录失败:', error);
      return [];
    }
  }

  /**
   * 获取最新离场记录
   */
  async getLatestCarOutRecords(limit = 50, lastTime = null) {
    try {
      const response = await axios.get('http://10.100.111.2:8675/parking/nefuData/getLatestCarOutRecords', {
        params: {
          limit: limit,
          lastTime: lastTime
        }
      });
      console.log('🚗 [最新离场记录] 查询成功:', response);      
      if (response.data.code === '0' && response.data.data && response.data.data.records) {
        return response.data.data.records;
      }
      return [];
    } catch (error) {
      console.error('❌ 获取离场记录失败:', error);
      return [];
    }
  }

  /**
   * 等待WebSocket连接建立（已弃用，保留用于向后兼容）
   * @deprecated 使用轮询方式替代WebSocket
   */
  waitForWebSocketConnection(timeout = 5000) {
    return new Promise((resolve, reject) => {
      if (websocketService.isConnected) {
        resolve();
        return;
      }
      
      const timer = setTimeout(() => {
        reject(new Error('WebSocket连接超时'));
      }, timeout);
      
      const onConnected = () => {
        clearTimeout(timer);
        websocketService.off('connected', onConnected);
        resolve();
      };
      
      websocketService.on('connected', onConnected);
    });
  }

  /**
   * 监听新的进出场记录
   */
  onNewRecord(callback) {
    websocketService.on('recordAdded', callback);
  }

  /**
   * 移除进出场记录监听器
   */
  offNewRecord(callback) {
    websocketService.off('recordAdded', callback);
  }

  /**
   * 监听车辆进场事件
   */
  onCarIn(callback) {
    console.log('🔌 vehicleDataService.onCarIn 注册监听器');
    websocketService.on('carIn', callback);
  }

  /**
   * 监听车辆离场事件
   */
  onCarOut(callback) {
    console.log('🔌 vehicleDataService.onCarOut 注册监听器');
    websocketService.on('carOut', callback);
  }

  /**
   * 移除车辆进场事件监听器
   */
  offCarIn(callback) {
    websocketService.off('carIn', callback);
  }

  /**
   * 移除车辆离场事件监听器
   */
  offCarOut(callback) {
    websocketService.off('carOut', callback);
  }

  /**
   * 获取最新记录（实时更新用）
   */
  getLatestRecords(count = 10) {
    return websocketService.getLatestRecords(count);
  }

  /**
   * 获取在场车辆数据
   */
  async getCurrentVehicles() {
    try {
      console.log('🚙 正在获取在场车辆数据...');
      // 调用获取在场车辆的接口
      const response = await axios.get('http://10.100.111.2:8675/parking/nefuData/getParkOnSiteCar', {
        params: {
          parkCodeList: 'PARK001', // 停车场编码，需要根据实际情况调整
          enterTimeFrom: this.getTodayStartTime(),
          enterTimeTo: this.getCurrentTime(),
          pageNum: 1,
          pageSize: 100
        }
      });
      
      console.log('📊 在场车辆API响应:', response.data);
      
      const transformedData = this.transformCurrentVehicleData(response.data.data || []);
      console.log('🚙 在场车辆数据 (API数据):', {
        total: transformedData.length,
        vehicles: transformedData
      });
      
      return transformedData;
    } catch (error) {
      console.error('❌ 获取在场车辆失败:', error);
      console.log('🔄 使用模拟数据作为降级方案');
      const mockData = this.getMockCurrentVehicles();
      console.log('🚙 在场车辆数据 (模拟数据):', {
        total: mockData.length,
        vehicles: mockData
      });
      return mockData;
    }
  }

  /**
   * 获取实时进出场数据
   */
  async getRealTimeFlow() {
    try {
      console.log('📈 正在获取实时流量数据...');
      const now = new Date();
      const fiveMinutesAgo = new Date(now.getTime() - 5 * 60 * 1000);
      
      // 获取最近5分钟的进出场数据
      const results = await Promise.all([
        // this.getRecentEntryData(fiveMinutesAgo, now),
        // this.getRecentExitData(fiveMinutesAgo, now)
      ]);
      
      // 确保有默认值，避免 undefined 错误
      const entryData = results[0] || [];
      const exitData = results[1] || [];
      
      const flowData = {
        realtimeEntry: entryData.length || 0,
        realtimeExit: exitData.length || 0,
        netFlow: (entryData.length || 0) - (exitData.length || 0),
        hourlyEntry: await this.getHourlyEntryCount(),
        currentVehicles: await this.getCurrentVehicleCount(),
        todayEntry: await this.getTodayEntryCount(),
        utilization: await this.getUtilizationRate(),
        flowTrend: await this.getFlowTrend(),
        channelStats: await this.getChannelStats(),
        prediction: await this.getPrediction()
      };
      
      console.log('📈 实时流量数据 (API数据):', {
        realtimeEntry: flowData.realtimeEntry,
        realtimeExit: flowData.realtimeExit,
        netFlow: flowData.netFlow,
        currentVehicles: flowData.currentVehicles,
        todayEntry: flowData.todayEntry
      });
      
      return flowData;
    } catch (error) {
      console.error('❌ 获取实时流量数据失败:', error);
      console.log('🔄 使用模拟数据作为降级方案');
      // const mockData = this.getMockRealTimeFlow();
      // console.log('📈 实时流量数据 (模拟数据):', {
      //   realtimeEntry: mockData.realtimeEntry,
      //   realtimeExit: mockData.realtimeExit,
      //   netFlow: mockData.netFlow,
      //   currentVehicles: mockData.currentVehicles,
      //   todayEntry: mockData.todayEntry
      // });
      // return mockData;
      return [];
    }
  }

  /**
   * 获取最近进场数据
   */
  async getRecentEntryData(startTime, endTime) {
    try {
      const response = await axios.get('http://10.100.111.2:8675/parking/nefuData/getCarInList', {
        params: {
          parkCode: 'PARK001',
          isPresence: '1',
          startTime: this.formatDateTime(startTime),
          endTime: this.formatDateTime(endTime),
          pageNum: 1,
          pageSize: 1000
        }
      });
      
      return response.data.data || [];
    } catch (error) {
      console.error('获取进场数据失败:', error);
      return [];
    }
  }

  /**
   * 获取最近离场数据
   */
  async getRecentExitData(startTime, endTime) {
    try {
      // 这里需要根据实际的后端接口调整
      // 暂时返回空数组，实际应该调用相应的离场数据接口
      return [];
    } catch (error) {
      console.error('获取离场数据失败:', error);
      return [];
    }
  }

  /**
   * 转换车辆数据格式
   */
  transformVehicleData(records) {
    console.log('🔄 原始车辆数据:', records);
    
    const transformedRecords = records.map(record => {
      const transformed = {
        id: record.id,
        plateNumber: record.plateNumber || record.carNo || record.car_license_number,
        type: this.determineVehicleType(record.plateNumber || record.carNo),
        channel: record.channelName || record.channel_name || record.enterChannelName || '未知通道',
        time: record.appointmentTime || record.createTime || record.enterTime || record.enter_time,
        status: record.reserveFlag === 1 ? '已放行' : '待放行',
        yardName: record.yardName || '未知停车场',
        yardCode: record.yardCode || 'UNKNOWN',
        // 添加VIP相关字段处理
        vipName: record.vipName || record.enterCustomVipName || record.enter_custom_vip_name || record.vipType || '普通用户',
        vipType: record.vipType || record.enterVipType || record.enter_vip_type || '',
        vehicleType: record.vehicleType || record.enterType || record.enter_type || '普通车辆',
        // 添加车牌颜色
        plateColor: record.enter_car_license_color || record.enterCarLicenseColor || '',
        // 添加图片URL
        imageUrl: record.imageUrl || record.enterPhoto || record.enter_car_full_picture || ''
      };
      
      console.log(`🚗 车辆记录转换: ${transformed.plateNumber} -> VIP:${transformed.vipName} Type:${transformed.vehicleType} (${transformed.status})`);
      return transformed;
    });
    
    console.log('✅ 车辆数据转换完成:', transformedRecords);
    return transformedRecords;
  }

  /**
   * 转换在场车辆数据格式
   */
  transformCurrentVehicleData(vehicles) {
    console.log('🔄 原始在场车辆数据:', vehicles);
    
    const transformedVehicles = vehicles.map(vehicle => {
      const transformed = {
        plateNumber: vehicle.carNo || vehicle.plateNumber || vehicle.car_license_number,
        type: this.determineVehicleType(vehicle.carNo || vehicle.plateNumber),
        entryTime: vehicle.enterTime || vehicle.enter_time,
        parkingArea: vehicle.parkingArea || '未知区域',
        duration: this.calculateParkingDuration(vehicle.enterTime || vehicle.enter_time),
        // 添加VIP相关字段处理
        vipName: vehicle.vipName || vehicle.enterCustomVipName || vehicle.enter_custom_vip_name || vehicle.vipType || '普通用户',
        vipType: vehicle.vipType || vehicle.enterVipType || vehicle.enter_vip_type || '',
        vehicleType: vehicle.vehicleType || vehicle.enterType || vehicle.enter_type || '普通车辆',
        // 添加车牌颜色
        plateColor: vehicle.enter_car_license_color || vehicle.enterCarLicenseColor || '',
        // 添加图片URL
        imageUrl: vehicle.imageUrl || vehicle.enterPhoto || vehicle.enter_car_full_picture || ''
      };
      
      console.log(`🚙 在场车辆转换: ${transformed.plateNumber} -> VIP:${transformed.vipName} (停车${transformed.duration})`);
      return transformed;
    });
    
    console.log('✅ 在场车辆数据转换完成:', transformedVehicles);
    return transformedVehicles;
  }

  /**
   * 根据车牌号判断车辆类型
   * 7位=油车，8位=新能源
   */
  determineVehicleType(plateNumber) {
    if (!plateNumber) {
      console.log('⚠️ 车牌号为空，返回未知类型');
      return '未知';
    }
    
    const type = plateNumber.length === 7 ? '油车' : '新能源';
    console.log(`🔍 车辆类型判断: ${plateNumber} (${plateNumber.length}位) -> ${type}`);
    return type;
  }

  /**
   * 计算停车时长
   */
  calculateParkingDuration(entryTime) {
    if (!entryTime) return '未知';
    const now = new Date();
    const entry = new Date(entryTime);
    const diffMs = now - entry;
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffMinutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));
    return `${diffHours}小时${diffMinutes}分钟`;
  }

  /**
   * 格式化日期时间
   */
  formatDateTime(date) {
    return date.toISOString().slice(0, 19).replace('T', ' ');
  }

  /**
   * 获取今天开始时间
   */
  getTodayStartTime() {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return this.formatDateTime(today);
  }

  /**
   * 获取当前时间
   */
  getCurrentTime() {
    return this.formatDateTime(new Date());
  }

  /**
   * 获取小时进场数量
   */
  async getHourlyEntryCount() {
    try {
      const now = new Date();
      const hourStart = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());
      const hourEnd = new Date(hourStart.getTime() + 60 * 60 * 1000);
      
      // const data = await this.getRecentEntryData(hourStart, hourEnd);
      // return data.length;
      return 0;
    } catch (error) {
      console.error('获取小时进场数量失败:', error);
      return 0;
    }
  }

  /**
   * 获取当前在场车辆数量
   */
  async getCurrentVehicleCount() {
    try {
      // const vehicles = await this.getCurrentVehicles();
      // return vehicles.length;
      return 0;
    } catch (error) {
      console.error('获取在场车辆数量失败:', error);
      return 0;
    }
  }

  /**
   * 获取今日进场数量
   */
  async getTodayEntryCount() {
    try {
      const todayStart = new Date();
      todayStart.setHours(0, 0, 0, 0);
      // const data = await this.getRecentEntryData(todayStart, new Date());
      // return data.length;
      return 0;
    } catch (error) {
      console.error('获取今日进场数量失败:', error);
      return 0;
    }
  }

  /**
   * 获取利用率
   */
  async getUtilizationRate() {
    try {
      // 这里需要根据实际的停车场容量和当前在场车辆数计算
      // 暂时返回模拟数据
      return 78.5;
    } catch (error) {
      console.error('获取利用率失败:', error);
      return 0;
    }
  }

  /**
   * 获取流量趋势
   */
  async getFlowTrend() {
    try {
      // 获取最近50个数据点的流量趋势
      const trendData = [];
      const now = new Date();
      
      for (let i = 49; i >= 0; i--) {
        const time = new Date(now.getTime() - i * 30 * 1000); // 每30秒一个数据点
        const startTime = new Date(time.getTime() - 30 * 1000);
        const endTime = time;
        
          // const entryData = await this.getRecentEntryData(startTime, endTime);
          // const exitData = await this.getRecentExitData(startTime, endTime);
        
        // trendData.push({
        //   time,
        //   entry: entryData.length,
        //   exit: exitData.length,
        //   vip: Math.floor(Math.random() * 3) // 暂时模拟VIP数量
        // });
      }
      
      return trendData;
    } catch (error) {
      console.error('获取流量趋势失败:', error);
      return this.getMockFlowTrend();
    }
  }

  /**
   * 获取通道统计
   */
  async getChannelStats() {
    try {
      // 这里需要根据实际的通道数据统计
      // 暂时返回模拟数据
      return [
        { channel: '东门入口', count: 45, efficiency: 95 },
        { channel: '西门入口', count: 38, efficiency: 88 },
        { channel: '南门入口', count: 42, efficiency: 92 },
        { channel: '北门入口', count: 31, efficiency: 85 }
      ];
    } catch (error) {
      console.error('获取通道统计失败:', error);
      return [];
    }
  }

  /**
   * 获取预测数据
   */
  async getPrediction() {
    try {
      // 这里可以根据历史数据计算预测值
      // 暂时返回模拟数据
      return '+28';
    } catch (error) {
      console.error('获取预测数据失败:', error);
      return '+0';
    }
  }

  // ===== 模拟数据方法（降级方案） =====

  getMockVehicleRecords() {
    const records = [];
    const now = new Date();
    
    // 车辆类型数组
    const vehicleTypes = [
      '保障车辆(不值班24小时全部门)',
      '二道岗可通行车辆',
      '教职工(地库车辆)',
      '保障车辆(值班48小时全部门)',
      '外聘私车值班(48小时)',
      '教职工离退37号楼居民(在职教职工及离退)',
      '超级VIP',
      '外聘教师(校内)',
      'I公务车辆',
      '优秀校友',
      'IV施工车辆(小)',
      'IV施工车辆(大)',
      'Ⅱ类保障车辆(小)',
      'Ⅲ类居民车辆',
      'Ⅲ类居民车辆(租)',
      'Ⅱ类保障车辆(大)',
      'D类离退私车',
      'C类外聘私车',
      'F类合作车辆',
      'B2类教工私车'
    ];
    
    // 通道数组
    const channels = ['东门入口', '西门入口', '南门入口', '北门入口', '东门出口', '西门出口', '南门出口', '北门出口'];
    
    // 动作类型
    const actions = ['进场', '离场'];
    
    for (let i = 0; i < 20; i++) {
      const time = new Date(now.getTime() - Math.random() * 24 * 60 * 60 * 1000);
      const plateNumber = this.generateMockPlateNumber();
      const channel = channels[Math.floor(Math.random() * channels.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const vehicleType = vehicleTypes[Math.floor(Math.random() * vehicleTypes.length)];
      
      // 格式化时间
      const timeStr = time.toLocaleString('zh-CN', {
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
        hour12: false
      }).replace(/\//g, '-');
      
      records.push({
        license: plateNumber,  // 使用 license 而不是 plateNumber
        channel: channel,
        channelType: channel.includes('入口') ? 'entry' : 'exit',
        action: action,
        vehicleType: vehicleType,  // 使用 vehicleType 而不是 type
        time: timeStr,  // 使用格式化的时间字符串
        isNew: false
      });
    }
    
    return records;
  }

  getMockCurrentVehicles() {
    const vehicles = [];
    const now = new Date();
    
    for (let i = 0; i < 15; i++) {
      const entryTime = new Date(now.getTime() - Math.random() * 8 * 60 * 60 * 1000);
      const plateNumber = this.generateMockPlateNumber();
      
      vehicles.push({
        plateNumber,
        type: this.determineVehicleType(plateNumber),
        entryTime: entryTime.toISOString(),
        parkingArea: `A${Math.floor(Math.random() * 5) + 1}区`,
        duration: this.calculateParkingDuration(entryTime)
      });
    }
    
    return vehicles;
  }

  getMockRealTimeFlow() {
    return {
      realtimeEntry: Math.floor(Math.random() * 20) + 10,
      realtimeExit: Math.floor(Math.random() * 18) + 8,
      netFlow: Math.floor(Math.random() * 10) + 2,
      hourlyEntry: Math.floor(Math.random() * 50) + 30,
      currentVehicles: Math.floor(Math.random() * 100) + 200,
      todayEntry: Math.floor(Math.random() * 200) + 100,
      utilization: 75 + Math.random() * 20,
      flowTrend: this.getMockFlowTrend(),
      channelStats: [
        { channel: '东门入口', count: 45, efficiency: 95 },
        { channel: '西门入口', count: 38, efficiency: 88 },
        { channel: '南门入口', count: 42, efficiency: 92 },
        { channel: '北门入口', count: 31, efficiency: 85 }
      ],
      prediction: '+28'
    };
  }

  getMockFlowTrend() {
    const trend = [];
    const now = new Date();
    
    for (let i = 49; i >= 0; i--) {
      const time = new Date(now.getTime() - i * 30 * 1000);
      trend.push({
        time,
        entry: Math.floor(Math.random() * 10) + 5,
        exit: Math.floor(Math.random() * 8) + 3,
        vip: Math.floor(Math.random() * 3)
      });
    }
    
    return trend;
  }

  generateMockPlateNumber() {
    const provinces = ['京', '沪', '粤', '苏', '浙', '鲁', '豫', '川', '湘', '鄂'];
    const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    const numbers = '0123456789';
    
    const province = provinces[Math.floor(Math.random() * provinces.length)];
    const letter = letters[Math.floor(Math.random() * letters.length)];
    
    // 30%概率生成新能源车牌（8位），70%概率生成油车（7位）
    const isNewEnergy = Math.random() < 0.3;
    let plateNumber;
    
    if (isNewEnergy) {
      // 新能源车牌：省份 + 字母 + 6位数字
      const number = Array(6).fill().map(() => 
        numbers[Math.floor(Math.random() * numbers.length)]
      ).join('');
      plateNumber = `${province}${letter}${number}`;
    } else {
      // 油车车牌：省份 + 字母 + 5位数字
      const number = Array(5).fill().map(() => 
        numbers[Math.floor(Math.random() * numbers.length)]
      ).join('');
      plateNumber = `${province}${letter}${number}`;
    }
    
    return plateNumber;
  }

  /**
   * 获取收费分析数据
   * @param {string} timeRange - 时间范围 (today, week, month, year)
   * @param {string} parkName - 停车场名称
   * @returns {Promise<Object>} 收费分析数据
   */
  async getRevenueAnalysis(timeRange = 'today', parkName = '东北林业大学') {
    try {
      console.log('💰 [收费分析] 开始查询...', { timeRange, parkName });
      
      const response = await this.http.post('http://10.100.111.2:8675/parking/analysis/vehicle-flow/revenue-analysis', {
        parkName: parkName,
        timeRange: timeRange
      });
      console.log('📊 [收费分析] 查询成功', response);
      // 检查响应数据
      if (response.data && response.data.code === '0' && response.data.data) {
        const data = response.data.data;
        console.log('✅ [收费分析] 查询成功', {
          totalRevenue: data.summary?.totalRevenue,
          totalVehicles: data.summary?.totalVehicles,
          dataSource: data.dataSource
        });
        // 始终返回真实数据，即使是全零数据
        return data;
      } else {
        console.warn('⚠️ [收费分析] 后端返回异常，返回空数据');
        return {
          paymentStats: [],
          revenueByDuration: [],
          summary: {
            totalRevenue: 0,
            avgRevenue: '0.00',
            paidVehicles: 0,
            unpaidVehicles: 0,
            freeVehicles: 0,
            totalVehicles: 0
          },
          dataSource: 'ERROR'
        };
      }
    } catch (error) {
      console.error('❌ [收费分析] 网络请求失败，返回空数据', error);
      return {
        paymentStats: [],
        revenueByDuration: [],
        summary: {
          totalRevenue: 0,
          avgRevenue: '0.00',
          paidVehicles: 0,
          unpaidVehicles: 0,
          freeVehicles: 0,
          totalVehicles: 0
        },
        dataSource: 'NETWORK_ERROR'
      };
    }
  }

  /**
   * 获取车辆热力图数据
   * @param {string} timeRange - 时间范围 (today, week, month, year)
   * @param {string} parkName - 停车场名称
   * @returns {Promise<Object>} 热力图数据
   */
  async getHeatmapData(timeRange = 'today', parkName = '东北林业大学') {
    try {
      console.log('🔥 [车辆热力图] 开始查询...', { timeRange, parkName });
      
      const response = await this.http.post('http://10.100.111.2:8675/parking/analysis/vehicle-flow/heatmap-data', {
        parkName: parkName,
        timeRange: timeRange
      });
      console.log('🔥 [车辆热力图] 查询成功', response.data.data);      
      // 检查响应数据
      if (response.data && response.data.code === '0' && response.data.data) {
        const data = response.data.data;
        console.log('✅ [车辆热力图] 查询成功', {
          totalRecords: data.totalRecords,
          dataSource: data.dataSource
        });
        return data;
      } else {
        console.warn('⚠️ [车辆热力图] 后端返回异常，使用模拟数据');
        return this.getMockHeatmapData();
      }
    } catch (error) {
      console.error('❌ [车辆热力图] 查询失败，使用模拟数据', error);
      return this.getMockHeatmapData();
    }
  }

  /**
   * 生成模拟收费分析数据（降级方案）
   */
  getMockRevenueData() {
    return {
      paymentStats: [
        { name: '已付费', value: 1250, rate: '85.2' },
        { name: '未付费', value: 180, rate: '12.3' },
        { name: '免费停车', value: 40, rate: '2.5' }
      ],
      revenueByDuration: [
        { name: '极短停(0-30min)', avgRevenue: '3.20', count: 156 },
        { name: '短停(30min-1h)', avgRevenue: '8.50', count: 245 },
        { name: '短中停(1-2h)', avgRevenue: '12.80', count: 198 },
        { name: '中停(2-4h)', avgRevenue: '18.60', count: 312 },
        { name: '中长停(4-6h)', avgRevenue: '24.40', count: 89 },
        { name: '长停(6-8h)', avgRevenue: '32.80', count: 98 },
        { name: '超长停(8-12h)', avgRevenue: '45.60', count: 41 },
        { name: '极长停(>12h)', avgRevenue: '68.90', count: 23 }
      ],
      summary: {
        totalRevenue: 25600,
        avgRevenue: '18.50',
        paidVehicles: 1250,
        unpaidVehicles: 180,
        freeVehicles: 40,
        totalVehicles: 1470
      },
      dataSource: 'MOCK'
    };
  }

  /**
   * 生成模拟热力图数据（降级方案）
   */
  getMockHeatmapData() {
    const vehicleHeatmapData = [];
    for (let h = 0; h < 24; h++) {
      for (let d = 0; d < 9; d++) {
        let base = 100;
        if (h >= 7 && h <= 9) base = 220 + Math.random() * 140;
        else if (h >= 17 && h <= 19) base = 180 + Math.random() * 120;
        else if (h >= 0 && h <= 5) base = 80 + Math.random() * 60;
        else base = 150 + Math.random() * 100;
        
        const weights = [0.22, 0.18, 0.16, 0.14, 0.12, 0.08, 0.06, 0.03, 0.01];
        vehicleHeatmapData.push([h, d, Math.round(base * weights[d])]);
      }
    }
    
    return {
      vehicleHeatmapData: vehicleHeatmapData,
      durationLabels: [
        '0-15min', '15-30min', '30min-1h', '1-2h', '2-4h', 
        '4-8h', '8-12h', '12-24h', '>24h'
      ],
      dataSource: 'MOCK',
      totalRecords: 0
    };
  }
}

// 创建单例实例
export const vehicleDataService = new VehicleDataService();
export default vehicleDataService;
