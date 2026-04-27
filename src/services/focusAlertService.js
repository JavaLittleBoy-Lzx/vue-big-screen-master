import axios from 'axios';

// const API_BASE_URL = 'http://localhost:8675';
const API_BASE_URL = 'http://localhost:8675';
export const focusAlertService = {
  /**
   * 处理API响应的通用方法
   */
  _handleResponse(response, errorMsg = '操作失败') {
    console.log('🔍 API响应:', response.data);
    
    // 处理全局响应拦截器的双层嵌套结构
    if (response.data.code === '0' && response.data.data) {
      // 外层是全局拦截器包装的Result，内层是实际的业务数据
      const businessData = response.data.data;
      if (businessData.code === 200) {
        return businessData.data;
      }
      throw new Error(businessData.message || errorMsg);
    } else if (response.data.code === 200) {
      // 直接返回的业务数据（如果没有被拦截器包装）
      return response.data.data;
    }
    
    throw new Error(response.data.message || response.data.msg || errorMsg);
  },

  /**
   * 获取未确认提醒数量
   */
  async getPendingCount() {
    try {
      const response = await axios.get(`${API_BASE_URL}/parking/focus/alerts/pending-count`);
      const data = this._handleResponse(response, '获取数量失败');
      return data.count || 0;
    } catch (error) {
      console.error('❌ 获取未确认提醒数量失败:', error);
      return 0;
    }
  },

  /**
   * 获取未确认提醒列表
   * @param {string} alertType - 提醒类型 (vehicle/person)
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   */
  async getPendingAlerts(alertType = null, page = 1, limit = 100) {
    try {
      const params = { page, limit };
      if (alertType) {
        params.alert_type = alertType;
      }
      
      const response = await axios.get(`${API_BASE_URL}/parking/focus/alerts/pending`, { params });
      return this._handleResponse(response, '获取未确认提醒失败');
    } catch (error) {
      console.error('❌ 获取未确认提醒失败:', error);
      throw error;
    }
  },

  /**
   * 获取历史提醒列表
   * @param {string} alertType - 提醒类型 (vehicle/person)
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   */
  async getHistoryAlerts(alertType = null, page = 1, limit = 100) {
    try {
      const params = { page, limit };
      if (alertType) {
        params.alert_type = alertType;
      }
      
      const response = await axios.get(`${API_BASE_URL}/parking/focus/alerts/history`, { params });
      return this._handleResponse(response, '获取历史提醒失败');
    } catch (error) {
      console.error('❌ 获取历史提醒失败:', error);
      throw error;
    }
  },

  /**
   * 确认单条提醒
   * @param {number} id - 提醒记录ID
   */
  async confirmAlert(id) {
    try {
      const response = await axios.post(`${API_BASE_URL}/parking/focus/alerts/confirm/${id}`);
      return this._handleResponse(response, '确认失败');
    } catch (error) {
      console.error('❌ 确认提醒失败:', error);
      throw error;
    }
  },

  /**
   * 批量确认提醒
   * @param {Array<number>} ids - 提醒记录ID数组
   */
  async confirmBatchAlerts(ids) {
    try {
      const response = await axios.post(`${API_BASE_URL}/parking/focus/alerts/confirm-batch`, { ids });
      return this._handleResponse(response, '批量确认失败');
    } catch (error) {
      console.error('❌ 批量确认失败:', error);
      throw error;
    }
  },

  /**
   * 根据关注对象查询进出场记录
   * @param {string} watchType - 关注类型 (idcard/plate)
   * @param {string} watchValue - 关注值（身份证号或车牌号）
   * @param {number} page - 页码
   * @param {number} limit - 每页数量
   */
  async getRecordsByWatch(watchType, watchValue, page = 1, limit = 50) {
    try {
      const params = { 
        watch_type: watchType,
        watch_value: watchValue,
        page, 
        limit 
      };
      
      const response = await axios.get(`${API_BASE_URL}/parking/focus/alerts/records`, { params });
      return this._handleResponse(response, '查询记录失败');
    } catch (error) {
      console.error('❌ 查询进出场记录失败:', error);
      throw error;
    }
  }
};
