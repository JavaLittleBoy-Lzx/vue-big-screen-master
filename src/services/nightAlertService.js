/**
 * 夜间学生出校提醒服务
 * 提供夜间提醒相关的API调用
 */

import axios from 'axios';

// 后端API基础URL
const BASE_URL = 'http://localhost:8675/parking/night-alert';

const nightAlertService = {
  /**
   * 获取夜间提醒配置
   * @returns {Promise} 配置信息
   */
  getConfig() {
    return axios.get(`${BASE_URL}/config`);
  },

  /**
   * 更新夜间提醒配置
   * @param {Object} config - 配置对象
   * @param {number} config.enabled - 是否启用：0-禁用，1-启用
   * @param {string} config.nightStartTime - 夜间开始时间（如22:00）
   * @param {string} config.nightEndTime - 夜间结束时间（如06:00）
   * @param {string} config.alertChannels - 需要提醒的出口通道（逗号分隔）
   * @returns {Promise} 更新结果
   */
  updateConfig(config) {
    return axios.put(`${BASE_URL}/config`, config);
  },

  /**
   * 获取未读数量
   * @returns {Promise} 未读数量
   */
  getUnreadCount() {
    return axios.get(`${BASE_URL}/unread-count`);
  },

  /**
   * 分页查询提醒记录
   * @param {Object} params - 查询参数
   * @param {number} params.pageNum - 页码
   * @param {number} params.pageSize - 每页数量
   * @param {string} params.channelName - 通道名称（筛选）
   * @param {string} params.gender - 性别（筛选）
   * @param {string} params.college - 学院（筛选）
   * @param {string} params.startTime - 开始时间（格式：yyyy-MM-dd）
   * @param {string} params.endTime - 结束时间（格式：yyyy-MM-dd）
   * @returns {Promise} 记录列表
   */
  getRecords(params) {
    return axios.get(`${BASE_URL}/records`, { params });
  },

  /**
   * 标记单条记录为已读
   * @param {number} id - 记录ID
   * @returns {Promise} 操作结果
   */
  markAsRead(id) {
    return axios.put(`${BASE_URL}/read/${id}`);
  },

  /**
   * 标记全部记录为已读
   * @returns {Promise} 操作结果
   */
  markAllAsRead() {
    return axios.put(`${BASE_URL}/read-all`);
  },

  /**
   * 获取综合统计
   * @param {Object} params - 查询参数
   * @param {string} params.startTime - 开始时间（格式：yyyy-MM-dd）
   * @param {string} params.endTime - 结束时间（格式：yyyy-MM-dd）
   * @returns {Promise} 统计数据
   */
  getStatistics(params) {
    return axios.get(`${BASE_URL}/statistics`, { params });
  },

  /**
   * 按通道统计
   * @param {Object} params - 查询参数
   * @param {string} params.startTime - 开始时间
   * @param {string} params.endTime - 结束时间
   * @returns {Promise} 通道统计数据
   */
  getStatisticsByChannel(params) {
    return axios.get(`${BASE_URL}/statistics/channel`, { params });
  },

  /**
   * 按性别统计
   * @param {Object} params - 查询参数
   * @param {string} params.startTime - 开始时间
   * @param {string} params.endTime - 结束时间
   * @returns {Promise} 性别统计数据
   */
  getStatisticsByGender(params) {
    return axios.get(`${BASE_URL}/statistics/gender`, { params });
  },

  /**
   * 按学院统计
   * @param {Object} params - 查询参数
   * @param {string} params.startTime - 开始时间
   * @param {string} params.endTime - 结束时间
   * @returns {Promise} 学院统计数据
   */
  getStatisticsByCollege(params) {
    return axios.get(`${BASE_URL}/statistics/college`, { params });
  },

  /**
   * 获取所有可用的出口通道列表
   * @returns {Promise} 通道列表
   */
  getChannels() {
    return axios.get(`${BASE_URL}/channels`);
  },

  /**
   * 获取所有学院列表
   * @returns {Promise} 学院列表
   */
  getColleges() {
    return axios.get(`${BASE_URL}/colleges`);
  }
};

export default nightAlertService;
