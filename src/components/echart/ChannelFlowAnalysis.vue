<template>
  <div class="channel-flow-analysis">
    <div class="table-container">
      <div class="table-header">
        <div class="header-left">
          <h3>📊 {{ analysisTitle }}</h3>
        </div>
      </div>
      
      <!-- 加载动画遮罩 -->
      <div v-if="isLoading" class="loading-overlay">
        <div class="loading-spinner">
          <div class="spinner"></div>
          <p>加载数据中...</p>
        </div>
      </div>
      
      <div class="table-scroll-wrapper" :class="{ 'loading': isLoading }">
        <table class="channel-table">
        <thead>
          <tr>
            <th style="width: 35%;">通道名称</th>
            <th style="width: 32.5%;">人数</th>
            <th style="width: 32.5%;">人群属性分布</th>
            <!-- <th>时段分布</th> -->
          </tr>
        </thead>
        <tbody>
          <tr v-for="(channel, index) in channelData" :key="index">
            <td class="channel-name">
              {{ channel.name }}
            </td>
            
            <!-- 人数 - 迷你柱状图 -->
            <td class="mini-chart-cell">
              <div 
                :id="`chart-count-${index}`" 
                class="mini-chart clickable-chart"
                @click="showDetailModal(channel)"
                title="点击查看详细数据"
              ></div>
            </td>
            
            <!-- 人群属性分布 - 迷你折线图 -->
            <td class="mini-chart-cell">
              <div 
                :id="`chart-type-${index}`" 
                class="mini-chart clickable-chart"
                @click="showDetailModal(channel)"
                title="点击查看详细数据"
              ></div>
            </td>
            
            <!-- 时段分布 - 迷你环状图 -->
            <!-- <td class="mini-chart-cell">
              <div 
                :id="`chart-time-${index}`" 
                class="mini-chart clickable-chart"
                style="width: 90px; height: 70px;"
                @click="showDetailModal(channel)"
                title="点击查看详细数据"
              ></div>
            </td> -->
          </tr>
        </tbody>
      </table>
      </div>
    </div>
    
    <!-- 详情弹窗 -->
    <div v-if="showModal" class="modal-overlay" @click="closeModal">
      <div class="modal-content" @click.stop>
        <div class="modal-header">
          <h3>{{ modalData.channel?.name }} - 人脸识别数据分析</h3>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        
        <!-- 弹窗加载动画 -->
        <div v-if="isModalLoading" class="modal-loading-overlay">
          <div class="loading-spinner">
            <div class="spinner"></div>
            <p>正在加载详细数据...</p>
          </div>
        </div>
        
        <div class="modal-body" :class="{ 'loading': isModalLoading }">
          <!-- 三个图表并排显示 -->
          <div class="charts-container">
            <!-- 人流量柱状图 -->
            <div class="chart-section">
              <div class="chart-header">
                <h4>📊 {{ flowChartTitle }}</h4>
                <div class="page-controls" v-if="timeRange === 'today' && totalPages > 1">
                  <button 
                    class="page-btn" 
                    :disabled="currentPage === 0"
                    @click="previousPage"
                    title="前12小时"
                  >◀</button>
                  <span class="page-info">{{ currentPage === 0 ? '00:00-11:00' : '12:00-23:00' }}</span>
                  <button 
                    class="page-btn" 
                    :disabled="currentPage === 1"
                    @click="nextPage"
                    title="后12小时"
                  >▶</button>
                </div>
              </div>
              <div class="detail-chart-container">
                <div id="modal-chart-count" class="detail-chart"></div>
              </div>
            </div>
            
            <!-- 人群属性分布折线图 -->
            <div class="chart-section">
              <h4>👥 人群属性分布</h4>
              <div class="detail-chart-container">
                <div id="modal-chart-type" class="detail-chart"></div>
              </div>
            </div>
            
            <!-- 时段分布圆环图 -->
            <!-- <div class="chart-section">
              <h4>⏰ 时段分布</h4>
              <div class="detail-chart-container">
                <div id="modal-chart-time" class="detail-chart"></div>
              </div>
            </div> -->
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
const echarts = require("echarts");
import axios from 'axios';

export default {
  name: "ChannelFlowAnalysis",
  props: {
    timeRange: {
      type: String,
      default: 'today'
    }
  },
  data() {
    return {
      currentDate: '',
      channelData: [],
      charts: [],
      refreshTimer: null,
      showModal: false,
      modalData: {
        channel: null
      },
      currentPage: 0, // 0表示前12小时(0-11), 1表示后12小时(12-23)
      modalChartInstances: [], // 存储弹窗图表实例
      totalPages: 2, // 总页数，默认2页（24小时分为两页）
      // 加载状态
      isLoading: false,
      isModalLoading: false,
      isFirstLoad: true // 是否是首次加载，首次加载显示loading
    };
  },
  computed: {
    // 根据时间范围动态显示标题
    analysisTitle() {
      const titles = {
        'today': '通道时段人流分析（今日）',
        'week': '通道时段人流分析（本周）',
        'month': '通道时段人流分析（本月）',
        'year': '通道时段人流分析（本年度）'
      };
      return titles[this.timeRange] || '通道时段人流分析';
    },
    // 流量图表标题
    flowChartTitle() {
      const titles = {
        'today': '24小时人流量',
        'week': '本周人流量（周一至周日）',
        'month': '本月人流量（1号至月底）',
        'year': '本年度人流量（1月至12月）'
      };
      return titles[this.timeRange] || '24小时人流量';
    }
  },
  watch: {
    // 监听时间范围变化，重新加载数据
    timeRange(newVal, oldVal) {
      if (newVal !== oldVal) {
        console.log('📊 [人流分析] 时间范围变化:', oldVal, '->', newVal);
        // 切换时间范围时，标记为首次加载，显示loading动画
        this.isFirstLoad = true;
        this.loadChannelData();
      }
    }
  },
  mounted() {
    this.initDate();
    this.loadChannelData();
    // 设置定时刷新（每5分钟刷新一次）
    this.refreshTimer = setInterval(() => {
      this.loadChannelData();
    }, 3 * 1000);
    // 响应式处理
    window.addEventListener("resize", () => {
      this.charts.forEach(chart => {
        if (chart) chart.resize();
      });
    });
  },
  beforeDestroy() {
    // 清理定时器
    if (this.refreshTimer) {
      clearInterval(this.refreshTimer);
    }
    // 清理所有图表实例
    this.charts.forEach(chart => {
      if (chart) chart.dispose();
    });
    window.onresize = null;
  },
  methods: {
    initDate() {
      const now = new Date();
      const month = String(now.getMonth() + 1).padStart(2, '0');
      const day = String(now.getDate()).padStart(2, '0');
      this.currentDate = `${month}-${day}`;
    },
    
    // 动态加载通道数据
    async loadChannelData() {
      try {
        // 只在首次加载时显示loading动画
        if (this.isFirstLoad) {
          this.isLoading = true;
          console.log('🎬 [人流分析] 首次加载，显示loading动画');
        } else {
          console.log('🔄 [人流分析] 静默刷新数据，不显示loading');
        }
        console.log('🚀 [人流分析] 开始请求API，时间范围:', this.timeRange);
        
        // 调用人脸数据分析API
        const response = await axios.get('http://localhost:8675/parking/analysis/face/channel-statistics', {
          params: {
            timeRange: this.timeRange
          }
        });
        
        console.log('📡 [人脸数据] API响应:', response);
        console.log('📦 [人脸数据] 响应数据:', response.data);
        
        // 兼容不同的响应格式
        // 格式1: {code: "0", data: {code: "0", data: {channels: [...]}}}
        // 格式2: {code: 200, data: {channels: [...]}}
        let apiData = null;
        let channels = [];
        
        if (response.data) {
          // 检查是否是嵌套结构（code为字符串"0"）
          if (response.data.code === "0" && response.data.data && response.data.data.data) {
            apiData = response.data.data.data;
            channels = apiData.channels || [];
            // console.log('✅ [人脸数据] 检测到嵌套结构，使用 response.data.data.data');
          }
          // 检查是否是简单结构（code为数字200）
          else if (response.data.code === 200 && response.data.data) {
            apiData = response.data.data;
            channels = apiData.channels || [];
            // console.log('✅ [人脸数据] 检测到简单结构，使用 response.data.data');
          }
          // 检查是否直接返回数据（code为字符串"0"）
          else if (response.data.code === "0" && response.data.data && response.data.data.channels) {
            apiData = response.data.data;
            channels = apiData.channels || [];
            // console.log('✅ [人脸数据] 检测到直接结构，使用 response.data.data');
          }
        }
        
        if (apiData && channels.length > 0) {
          // console.log('✅ [人脸数据] 获取到', channels.length, '个通道数据');
          // console.log('📊 [人脸数据] 通道列表:', channels.map(c => c.name));
          
          // 时间段标签（12小时）
          const hours = ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'];
          
          this.channelData = channels.map((channel, idx) => {
            // console.log(`🔍 [人脸数据] 处理通道: ${channel.name}`, {
            //   totalCount: channel.totalCount,
            //   countDataLength: channel.countData?.length,
            //   typeDistributionLength: channel.typeDistribution?.length
            // });
            
            // 使用后端返回的数据
            const countData = channel.countData || this.generateRandomData(12, 50, 150);
            const totalCount = channel.totalCount || 0;
            const dominantType = channel.dominantType || '无数据';
            
            // 人群属性分布数据（从后端获取）
            const typeDistribution = channel.typeDistribution || [];
            
            // 生成模拟的按小时类型数据用于折线图展示
            const typeData = this.generateTypeDataFromDistribution(typeDistribution, 12);
            
            // 计算高峰时段分布（用于时段图）
            const timeDistribution = this.calculateTimeDistribution(countData, hours);
            const peakPeriod = timeDistribution.peak;
            
            return {
              id: channel.id || idx,
              name: channel.name,
              hours,
              countData,
              typeData,
              totalCount,
              dominantType,
              peakPeriod,
              timeDistribution,
              typeDistribution: { data: typeDistribution }
            };
          });
          
          // console.log('✅ [人脸数据] 数据处理完成，共', this.channelData.length, '个通道');
        } else {
          console.warn('⚠️ [人脸数据] API返回格式不正确，切换到模拟数据');
          // console.log('📦 [人脸数据] 异常响应:', response.data);
          this.initMockData();
          return;
        }
        
        // 数据加载完成后初始化图表
        this.$nextTick(() => {
          this.initCharts();
        });
        
        // console.log('✅ [人脸数据] 渲染完成，通道数：', channels.length);
        
        // 延迟关闭 loading，确保图表渲染完成
        setTimeout(() => {
          this.isLoading = false;
          // 标记为非首次加载，后续刷新不再显示loading
          this.isFirstLoad = false;
        }, 500);
      } catch (error) {
        console.error(' [人脸数据] 加载失败:', error);
        this.isLoading = false;
        // 即使失败也标记为非首次加载
        this.isFirstLoad = false;
      }
    },
    
    // 从人群属性分布生成按小时的类型数据（用于折线图）
    generateTypeDataFromDistribution(typeDistribution, hourCount) {
      const data = [];
      
      // 如果没有类型分布数据，返回空数组
      if (!typeDistribution || typeDistribution.length === 0) {
        for (let i = 0; i < hourCount; i++) {
          data.push({});
        }
        return data;
      }
      
      // 使用真实的总体占比（不添加随机波动）
      // 表格中的小图表显示恒定的占比趋势线
      for (let i = 0; i < hourCount; i++) {
        const hourData = {};
        typeDistribution.forEach(type => {
          // 使用真实的百分比，不添加波动
          hourData[type.name] = type.percent || 0;
        });
        data.push(hourData);
      }
      
      // console.log(' [人群属性数据] 生成了', hourCount, '小时的类型分布，基于真实占比');
      return data;
    },
    
    // 备用模拟数据方法
    initMockData() {
      // 生成模拟的通道数据
      const channels = [
        { id: 1, name: '1号门入口', icon: '', type: 'in' },
        { id: 2, name: '2号门入口', icon: '', type: 'in' },
        { id: 3, name: '3号门入口', icon: '', type: 'in' },
        { id: 4, name: '1号门出口', icon: '', type: 'out' },
        { id: 5, name: '2号门出口', icon: '', type: 'out' },
      ];
      
      // 时间段标签（12小时）
      const hours = ['00', '02', '04', '06', '08', '10', '12', '14', '16', '18', '20', '22'];
      
      this.channelData = channels.map((channel, idx) => {
        // 生成车辆数量数据（模拟）
        const countData = this.generateRandomData(12, 50, 150);
        
      // 生成人群属性分布数据（模拟）
      const typeData = this.generateCrowdTypeData(12);
        
        // 计算总车辆数
        const totalCount = countData.reduce((sum, val) => sum + val, 0);
        
      // 计算人群属性分布
      const typeDistribution = this.calculateCrowdTypeDistribution(typeData);
        const dominantType = typeDistribution.dominant;
        
        // 计算高峰时段分布
        const timeDistribution = this.calculateTimeDistribution(countData, hours);
        const peakPeriod = timeDistribution.peak;
        
        return {
          ...channel,
          hours,
          countData,
          typeData,
          totalCount,
          dominantType,
          peakPeriod,
          timeDistribution,
          typeDistribution
        };
      });
      
      // 使用模拟数据时也要初始化图表
      this.$nextTick(() => {
        this.initCharts();
      });
    },
    
    // 手动刷新数据
    refreshData() {
      this.loadChannelData();
    },
    
    generateRandomData(count, min, max) {
      const data = [];
      for (let i = 0; i < count; i++) {
        // 模拟流量规律：早晚高峰较高
        let baseValue = min;
        if (i >= 2 && i <= 4) { // 6-10点早高峰
          baseValue = max * 0.7;
        } else if (i >= 5 && i <= 7) { // 10-16点上午
          baseValue = max * 0.5;
        } else if (i >= 8 && i <= 9) { // 16-20点下午
          baseValue = max * 0.6;
        } else if (i >= 9 && i <= 10) { // 20-22点晚高峰
          baseValue = max * 0.8;
        } else { // 夜间
          baseValue = max * 0.3;
        }
        
        data.push(Math.floor(baseValue + Math.random() * (max - baseValue) * 0.3));
      }
      return data;
    },
    
    generateCrowdTypeData(count) {
      // 改为使用实际的人员类型：学生、教职工、外来人员、临聘老师
      const crowdTypes = [
        { name: '学生', color: '#3b82f6', icon: '' },
        { name: '教职工', color: '#10b981', icon: '' },
        { name: '外来人员', color: '#f59e0b', icon: '' },
        { name: '临聘老师', color: '#ef5da8', icon: '' }
      ];
      
      const data = [];
      for (let i = 0; i < count; i++) {
        const typeDistribution = {};
        crowdTypes.forEach(type => {
          // 模拟不同人群属性的分布
          const baseValue = type.name === '学生' ? 0.45 : 
                           type.name === '教职工' ? 0.28 : 
                           type.name === '外来人员' ? 0.18 : 0.09;
          typeDistribution[type.name] = Math.floor(baseValue * 100 + Math.random() * 15);
        });
        data.push(typeDistribution);
      }
      return data;
    },
    
    calculateCrowdTypeDistribution(typeData) {
      const totals = {};
      const crowdTypes = ['学生', '教职工', '外来人员', '临聘老师'];
      
      crowdTypes.forEach(type => {
        totals[type] = typeData.reduce((sum, item) => sum + (item[type] || 0), 0);
      });
      
      const total = Object.values(totals).reduce((sum, val) => sum + val, 0);
      const percentages = {};
      
      crowdTypes.forEach(type => {
        percentages[type] = Math.round((totals[type] / total) * 100);
      });
      
      // 找出主要类型
      const dominant = Object.entries(percentages).reduce((max, [type, percent]) => 
        percent > max.percent ? { type, percent } : max, 
        { type: '学生', percent: 0 }
      );
      
      return {
        totals,
        percentages,
        dominant: `${dominant.type}${dominant.percent}%`,
        data: crowdTypes.map(type => ({
          name: type,
          value: totals[type],
          percent: percentages[type]
        }))
      };
    },
    
    calculateTimeDistribution(countData, hours) {
      // 定义时间段
      const periods = {
        early: { name: '早高峰', hours: ['06', '08', '10'], color: '#10b981', icon: '' },
        morning: { name: '上午', hours: ['10', '12', '14'], color: '#3b82f6', icon: '' },
        afternoon: { name: '下午', hours: ['14', '16', '18'], color: '#f59e0b', icon: '' },
        evening: { name: '晚高峰', hours: ['18', '20', '22'], color: '#ef4444', icon: '' },
        night: { name: '夜间', hours: ['00', '02', '04'], color: '#6b7280', icon: '' }
      };
      
      const data = [];
      let total = 0;
      
      Object.entries(periods).forEach(([key, period]) => {
        let periodTotal = 0;
        period.hours.forEach(hour => {
          const index = hours.indexOf(hour);
          if (index !== -1) {
            periodTotal += countData[index] || 0;
          }
        });
        total += periodTotal;
        data.push({ ...period, value: periodTotal });
      });
      
      // 计算百分比
      data.forEach(item => {
        item.percent = Math.round((item.value / total) * 100);
      });
      
      // 找出高峰时段
      const peak = data.reduce((max, item) => item.value > max.value ? item : max, data[0]);
      
      return { data, peak: `${peak.icon}${peak.percent}%` };
    },
    
    initCharts() {
      // 初始化所有图表
      this.$nextTick(() => {
        this.channelData.forEach((channel, index) => {
          this.initCountChart(channel, index);
          this.initTypeChart(channel, index);
          this.initTimeChart(channel, index);
        });
      });
    },
    
    // 人数 - 迷你柱状图
    initCountChart(channel, index) {
      const chartDom = document.getElementById(`chart-count-${index}`);
      if (!chartDom) return;
      
      const chart = echarts.init(chartDom);
      const option = {
        grid: {
          left: 0,
          right: 0,
          top: 5,
          bottom: 0,
          containLabel: false
        },
        xAxis: {
          type: 'category',
          data: channel.hours,
          show: false
        },
        yAxis: {
          type: 'value',
          show: false
        },
        series: [{
          type: 'bar',
          data: channel.countData,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#3b82f6' },
                { offset: 1, color: '#60a5fa' }
              ]
            }
          },
          barWidth: '60%',
          markLine: {
            silent: true,
            data: [{
              type: 'average',
              name: '平均值'
            }],
            lineStyle: {
              color: 'rgba(59, 130, 246, 0.5)',
              type: 'dashed',
              width: 1
            }
          }
        }]
      };
      chart.setOption(option);
      this.charts.push(chart);
    },
    
    // 人群属性分布 - 迷你柱状图（显示4种人群类型的人数）
    initTypeChart(channel, index) {
      const chartDom = document.getElementById(`chart-type-${index}`);
      if (!chartDom) return;
      
      const chart = echarts.init(chartDom);
      
      // 使用人群属性分布数据（学生、教职工、外来人员、临聘老师）
      const typeData = channel.typeDistribution?.data || [];
      const categories = typeData.map(item => item.name);
      const values = typeData.map(item => item.value);
      
      const option = {
        grid: {
          left: 5,
          right: 5,
          top: 5,
          bottom: 5,
          containLabel: false
        },
        xAxis: {
          type: 'category',
          data: categories,
          show: false
        },
        yAxis: {
          type: 'value',
          show: false
        },
        series: [{
          type: 'bar',
          data: values,
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: '#FF3D8E' },
                { offset: 1, color: '#8B5CF6' }
              ]
            },
            borderRadius: [2, 2, 0, 0]
          },
          barWidth: '70%'
        }]
      };
      chart.setOption(option);
      this.charts.push(chart);
    },
    
    // 时段分布 - 迷你环状图
    initTimeChart(channel, index) {
      const chartDom = document.getElementById(`chart-time-${index}`);
      if (!chartDom) return;
      
      const chart = echarts.init(chartDom);
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}人 ({d}%)'
        },
        series: [{
          type: 'pie',
          radius: ['40%', '60%'],
          center: ['50%', '50%'],
          data: channel.timeDistribution.data,
          itemStyle: {
            color: (params) => params.data.color
          },
          label: {
            show: false
          },
          emphasis: {
            disabled: true
          }
        }]
      };
      chart.setOption(option);
      this.charts.push(chart);
    },
    
    // 显示详情弹窗
    async showDetailModal(channel) {
      console.log(' [详情弹窗] 打开通道详情:', channel.name);
      
      this.modalData = {
        channel: channel,
        detailData: null, // 将存储从后端获取的详细数据
        isLoading: true
      };
      this.showModal = true;
      this.isModalLoading = true;
      this.currentPage = 0; // 重置为第一页
      
      try {
        // 调用后端API获取该通道的详细数据
        const response = await axios.get('http://localhost:8675/parking/analysis/face/channel-detail', {
          params: {
            channelName: channel.name,
            timeRange: this.timeRange
          }
        });
        
        console.log(' [详情弹窗] API响应:', response.data);
        
        // 解析响应数据
        let detailData = null;
        if (response.data) {
          if (response.data.code === "0" && response.data.data && response.data.data.data) {
            detailData = response.data.data.data;
            console.log(' [详情弹窗] 获取到详细数据（嵌套结构）');
          } else if (response.data.code === 200 && response.data.data) {
            detailData = response.data.data;
            console.log(' [详情弹窗] 获取到详细数据（简单结构）');
          } else if (response.data.code === "0" && response.data.data) {
            detailData = response.data.data;
            console.log(' [详情弹窗] 获取到详细数据（直接结构）');
          }
        }
        
        if (detailData && detailData.hourlyData) {
          this.modalData.detailData = detailData;
          console.log(' [详情弹窗] 详细数据:', {
            hourlyDataLength: detailData.hourlyData.length,
            hourlyTypeDataLength: detailData.hourlyTypeData?.length
          });
        } else {
          console.warn(' [详情弹窗] 后端未返回详细数据，使用表格数据');
          this.modalData.detailData = null;
        }
      } catch (error) {
        console.error(' [详情弹窗] 加载失败:', error);
        this.modalData.isLoading = false;
        this.isModalLoading = false;
      } finally {
        this.modalData.isLoading = false;
      }
      
      // 延迟创建弹窗中的图表，确保DOM已渲染
      this.$nextTick(() => {
        this.initAllModalCharts(channel);
        // 图表渲染完成后关闭 loading
        setTimeout(() => {
          this.isModalLoading = false;
        }, 500);
      });
    },
    
    // 上一页
    previousPage() {
      if (this.currentPage > 0) {
        this.currentPage--;
        this.updateModalCountChart(this.modalData.channel);
      }
    },
    
    // 下一页
    nextPage() {
      if (this.currentPage < 1) {
        this.currentPage++;
        this.updateModalCountChart(this.modalData.channel);
      }
    },
    
    // 关闭弹窗
    closeModal() {
      this.showModal = false;
      this.modalData = {
        channel: null
      };
      this.currentPage = 0;
      
      // 清理弹窗图表实例
      this.modalChartInstances.forEach(chart => {
        if (chart) chart.dispose();
      });
      this.modalChartInstances = [];
    },
    
    // 初始化弹窗中的所有图表
    initAllModalCharts(channel) {
      // 初始化人流量柱状图
      this.initModalCountChart(channel);
      // 初始化人群属性分布折线图
      this.initModalTypeChart(channel);
      // 初始化时段分布圆环图
      this.initModalTimeChart(channel);
    },
    
    // 初始化弹窗中的人流量柱状图
    initModalCountChart(channel) {
      const chartElement = document.getElementById('modal-chart-count');
      if (!chartElement) return;
      
      // 如果已存在实例，先销毁
      const existingChart = echarts.getInstanceByDom(chartElement);
      if (existingChart) {
        existingChart.dispose();
      }
      
      const chart = echarts.init(chartElement);
      
      // 根据时间范围生成不同的X轴标签和数据
      let displayData = [];
      let displayLabels = [];
      let fullData = []; // 用于保存完整数据
      
      // 优先使用后端返回的详细数据
      if (this.modalData.detailData && this.modalData.detailData.hourlyData) {
        const hourlyData = this.modalData.detailData.hourlyData;
        fullData = [...hourlyData]; // 保存完整数据副本
        console.log('📊 [详情图表] 使用后端返回的数据:', hourlyData.length, '个数据点，时间范围:', this.timeRange);
        
        switch (this.timeRange) {
          case 'today':
            // 今日：24小时，分页显示
            const startHour = this.currentPage * 12;
            const endHour = startHour + 12;
            displayData = hourlyData.slice(startHour, endHour);
            displayLabels = Array.from({length: 12}, (_, i) => `${startHour + i}:00`);
            this.totalPages = 2;
            break;
            
          case 'week':
            // 本周：7天（周一到周日）
            displayData = hourlyData.slice(0, 7); // 取前7个数据
            displayLabels = ['周一', '周二', '周三', '周四', '周五', '周六', '周日'];
            this.totalPages = 1;
            this.currentPage = 0;
            break;
            
          case 'month':
            // 本月：每一天（1-28/29/30/31号）
            displayData = hourlyData; // 使用所有数据
            const daysInMonth = hourlyData.length;
            displayLabels = Array.from({length: daysInMonth}, (_, i) => `${i + 1}号`);
            this.totalPages = 1;
            this.currentPage = 0;
            break;
            
          case 'year':
            // 本年度：12个月
            displayData = hourlyData.slice(0, 12); // 取前12个数据
            displayLabels = ['1月', '2月', '3月', '4月', '5月', '6月', '7月', '8月', '9月', '10月', '11月', '12月'];
            this.totalPages = 1;
            this.currentPage = 0;
            break;
            
          default:
            // 默认24小时
            displayData = hourlyData.slice(0, 12);
            displayLabels = Array.from({length: 12}, (_, i) => `${i}:00`);
            this.totalPages = 2;
        }
      } else {
        // 降级方案：使用表格中的数据或模拟数据
        console.warn('⚠️ [详情图表] 后端未返回详细数据，使用降级方案');
        if (channel.countData && channel.countData.length >= 12) {
          displayData = channel.countData.slice(0, 12);
          displayLabels = Array.from({length: 12}, (_, i) => `${i}:00`);
        } else {
          for (let i = 0; i < 12; i++) {
            displayData.push(Math.floor(50 + Math.random() * 100));
          }
          displayLabels = Array.from({length: 12}, (_, i) => `${i}:00`);
        }
        this.totalPages = 2;
      }
      
      const option = {
        tooltip: {
          trigger: 'axis',
          axisPointer: {
            type: 'shadow'
          }
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: displayLabels,
          axisLabel: {
            fontSize: 10,
            color: '#C7D2FE'
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(0, 229, 255, 0.25)'
            }
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            fontSize: 10,
            color: '#C7D2FE'
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(0, 229, 255, 0.25)'
            }
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(0, 229, 255, 0.12)'
            }
          }
        },
        series: [{
          data: displayData,
          type: 'bar',
          itemStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [
                { offset: 0, color: 'rgba(0, 229, 255, 0.95)' },
                { offset: 1, color: 'rgba(139, 92, 246, 0.75)' }
              ]
            },
            shadowBlur: 12,
            shadowColor: 'rgba(0, 229, 255, 0.45)'
          },
          barWidth: '60%'
        }]
      };
      chart.setOption(option);
      
      // 保存图表实例
      this.modalChartInstances.push(chart);
      
      // 同时保存完整数据到channel对象中（用于分页切换）
      channel.fullHourlyData = fullData;
    },
    
    // 更新弹窗中的人流量图表（切换页面时调用）
    updateModalCountChart(channel) {
      const chartElement = document.getElementById('modal-chart-count');
      if (!chartElement) return;
      
      const chart = echarts.getInstanceByDom(chartElement);
      if (!chart) return;
      
      // 使用完整的24小时数据
      const hourlyData = channel.fullHourlyData || [];
      
      // 根据当前页显示对应的12小时数据
      const startHour = this.currentPage * 12;
      const endHour = startHour + 12;
      const displayData = hourlyData.slice(startHour, endHour);
      const displayLabels = Array.from({length: 12}, (_, i) => `${startHour + i}:00`);
      
      // 更新图表
      chart.setOption({
        xAxis: {
          data: displayLabels
        },
        series: [{
          data: displayData
        }]
      });
    },
    
    // 初始化弹窗中的人群属性分布折线图
    initModalTypeChart(channel) {
      const chartElement = document.getElementById('modal-chart-type');
      if (!chartElement) return;
      
      const chart = echarts.init(chartElement);
      
      // 优先使用后端返回的详细数据
      let typeDistribution = [];
      let categories = [];
      let values = [];
      
      if (this.modalData.detailData && this.modalData.detailData.typeDistribution) {
        // 使用后端返回的详细数据
        typeDistribution = this.modalData.detailData.typeDistribution;
        categories = typeDistribution.map(item => item.name);
        values = typeDistribution.map(item => item.value);
        console.log('📊 [人群属性] 使用后端返回的数据:', typeDistribution);
      } else if (channel.typeDistribution && channel.typeDistribution.data) {
        // 降级：使用通道表格数据
        typeDistribution = channel.typeDistribution.data;
        categories = typeDistribution.map(item => item.name);
        values = typeDistribution.map(item => item.value);
        console.warn('⚠️ [人群属性] 使用表格数据');
      } else {
        // 最后降级：使用默认分类
        categories = ['学生', '教职工', '外来人员', '临聘老师'];
        values = [0, 0, 0, 0];
        console.warn('⚠️ [人群属性] 无数据，使用默认分类');
      }
      
      const option = {
        tooltip: {
          trigger: 'axis'
        },
        grid: {
          left: '3%',
          right: '4%',
          bottom: '3%',
          containLabel: true
        },
        xAxis: {
          type: 'category',
          data: categories,
          axisLabel: {
            fontSize: 10,
            color: '#C7D2FE'
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(0, 229, 255, 0.25)'
            }
          }
        },
        yAxis: {
          type: 'value',
          axisLabel: {
            fontSize: 10,
            color: '#C7D2FE'
          },
          axisLine: {
            lineStyle: {
              color: 'rgba(0, 229, 255, 0.25)'
            }
          },
          splitLine: {
            lineStyle: {
              color: 'rgba(0, 229, 255, 0.12)'
            }
          }
        },
        series: [{
          data: values,
          type: 'line',
          smooth: true,
          itemStyle: {
            color: '#FF3D8E'
          },
          lineStyle: {
            color: '#FF3D8E',
            width: 2,
            shadowBlur: 12,
            shadowColor: 'rgba(255, 61, 142, 0.45)'
          },
          areaStyle: {
            color: {
              type: 'linear',
              x: 0,
              y: 0,
              x2: 0,
              y2: 1,
              colorStops: [{
                offset: 0, color: 'rgba(255, 61, 142, 0.35)'
              }, {
                offset: 1, color: 'rgba(255, 61, 142, 0.08)'
              }]
            }
          }
        }]
      };
      chart.setOption(option);
      this.charts.push(chart);
    },
    
    // 初始化弹窗中的时段分布圆环图
    initModalTimeChart(channel) {
      const chartElement = document.getElementById('modal-chart-time');
      if (!chartElement) return;
      
      const chart = echarts.init(chartElement);
      const option = {
        tooltip: {
          trigger: 'item',
          formatter: '{b}: {c}人 ({d}%)'
        },
        series: [{
          type: 'pie',
          radius: ['40%', '58%'],
          center: ['50%', '50%'],
          data: channel.timeDistribution.data.map((d, idx) => ({
            ...d,
            itemStyle: {
              color: d.color || ['#00E5FF', '#8B5CF6', '#FF3D8E', '#22D3EE', '#A78BFA'][idx % 5],
              shadowBlur: 18,
              shadowColor: 'rgba(0, 229, 255, 0.35)'
            }
          })),
          label: {
            show: true,
            fontSize: 10,
            color: '#C7D2FE'
          },
          labelLine: {
            show: true,
            lineStyle: {
              color: 'rgba(0, 229, 255, 0.45)'
            }
          }
        }]
      };
      chart.setOption(option);
      this.charts.push(chart);
    }
  }
};
</script>

<style lang="scss" scoped>
.channel-flow-analysis {
  padding: 1rem;
  height: 100%;
  color: #c3cbde;
  
  .table-container {
    background: rgba(0, 0, 0, 0.3);
    border-radius: 10px;
    overflow: hidden;
    height: 100%;
    display: flex;
    flex-direction: column;
  }
  
  .table-scroll-wrapper {
    flex: 1;
    overflow-y: auto;
    overflow-x: hidden;
    
    /* 自定义滚动条样式 */
    &::-webkit-scrollbar {
      width: 8px;
    }
    
    &::-webkit-scrollbar-track {
      background: rgba(0, 0, 0, 0.2);
      border-radius: 4px;
    }
    
    &::-webkit-scrollbar-thumb {
      background: rgba(0, 229, 255, 0.3);
      border-radius: 4px;
      
      &:hover {
        background: rgba(0, 229, 255, 0.5);
      }
    }
  }
  
  .table-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 0.5rem 1.5rem;
    background: rgba(139, 92, 246, 0.1);
    border-bottom: 1px solid rgba(0, 229, 255, 0.25);
    
    .header-left {
      flex: 1;
      
      h3 {
        margin: 0 0 5px 0;
        font-size: 16px;
        color: #ffffff;
        font-weight: bold;
      }
    }
    
    .header-right {
      display: flex;
      align-items: center;
      gap: 0.8rem;
    }
    
    .date-badge {
      padding: 0.3rem 0.8rem;
      background: rgba(139, 92, 246, 0.25);
      border-radius: 4px;
      font-size: 0.85rem;
      color: #C7D2FE;
    }
    
    .refresh-btn {
      background: rgba(0, 229, 255, 0.12);
      border: 1px solid rgba(0, 229, 255, 0.25);
      color: #00E5FF;
      padding: 0.3rem 0.6rem;
      border-radius: 0.4rem;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      
      &:hover {
        background: rgba(0, 229, 255, 0.22);
        border-color: rgba(0, 229, 255, 0.45);
        transform: scale(1.05);
      }
      
      &:active {
        transform: scale(0.95);
      }
      
      .refresh-icon {
        font-size: 0.9rem;
        transition: transform 0.3s ease;
      }
      
      &:hover .refresh-icon {
        transform: rotate(180deg);
      }
    }
  }
  
  .channel-table {
    width: 100%;
    border-collapse: collapse;
    table-layout: fixed;
    
    thead {
      background: rgba(139, 92, 246, 0.15);
      
      th {
        padding: 1rem 1rem;
        text-align: left;
        font-size: 0.9rem;
        font-weight: 600;
        color: #00E5FF;
        border-bottom: 2px solid rgba(0, 229, 255, 0.3);
        
        &:first-child {
          padding-left: 1.5rem;
        }
        
        &:last-child {
          padding-right: 1.5rem;
        }
      }
    }
    
    tbody {
      tr {
        transition: background-color 0.3s;
        border-bottom: 1px solid rgba(255, 255, 255, 0.06);
        
        &:hover {
          background: rgba(0, 229, 255, 0.08);
        }
        
        &:last-child {
          border-bottom: none;
        }
      }
      
      td {
        padding: 1rem 1rem;
        
        &:first-child {
          padding-left: 1.5rem;
        }
        
        &:last-child {
          padding-right: 1.5rem;
        }
      }
    }
    
      .channel-name {
        font-weight: 500;
        text-align: left;
        .channel-icon {
          display: inline-block;
          margin-right: 0.5rem;
        }
      }
    
    .mini-chart-cell {
      text-align: center;
      padding: clamp(0.8rem, 1vh, 1rem) clamp(0.5rem, 0.8vw, 1rem) !important;
      
      .mini-chart {
        width: 100%;
        height: clamp(60px, 8vh, 80px);
        margin: 0 auto;
        
        &.clickable-chart {
          cursor: pointer;
          transition: all 0.3s ease;
          border-radius: 4px;
          
          &:hover {
            transform: scale(1.05);
            box-shadow: 0 4px 14px rgba(139, 92, 246, 0.35), 0 0 16px rgba(0, 229, 255, 0.25) inset;
          }
          
          &:active {
            transform: scale(0.95);
          }
        }
      }
    }
  }
  
  // 弹窗样式
  .modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background: rgba(0, 0, 0, 0.8);
    display: flex;
    justify-content: center;
    align-items: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
  }
  
  .modal-content {
    background: linear-gradient(135deg, rgba(9, 14, 24, 0.95), rgba(4, 7, 14, 0.96));
    border-radius: 12px;
    width: 92%;
    max-width: 1400px;
    max-height: 90vh;
    overflow-y: auto;
    border: 1px solid rgba(0, 229, 255, 0.25);
    box-shadow: 0 20px 40px rgba(0, 0, 0, 0.55), 0 0 24px rgba(139, 92, 246, 0.25);
  }
  
  .modal-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 1rem 1.5rem;
    background: rgba(139, 92, 246, 0.1);
    border-bottom: 1px solid rgba(0, 229, 255, 0.25);
    
    h3 {
      color: #00E5FF;
      font-size: 1.1rem;
      font-weight: 600;
      margin: 0;
    }
    
    .close-btn {
      background: rgba(239, 68, 68, 0.2);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: #ef4444;
      width: 28px;
      height: 28px;
      border-radius: 50%;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      transition: all 0.3s ease;
      
      &:hover {
        background: rgba(239, 68, 68, 0.3);
        border-color: rgba(239, 68, 68, 0.5);
        transform: scale(1.1);
      }
    }
  }
  
  .modal-body {
    padding: 1.5rem;
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .charts-container {
    display: flex;
    gap: 1rem;
    margin-bottom: 1.5rem;
    
    .chart-section {
      flex: 1;
      background: rgba(0, 0, 0, 0.2);
      border-radius: 8px;
      padding: 0.8rem;
      border: 1px solid rgba(0, 229, 255, 0.22);
      
      .chart-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        margin-bottom: 0.8rem;
        
        h4 {
          color: #00E5FF;
          font-size: 0.85rem;
          font-weight: 600;
          margin: 0;
        }
        
        .page-controls {
          display: flex;
          align-items: center;
          gap: 0.5rem;
          
          .page-btn {
            background: rgba(0, 229, 255, 0.12);
            border: 1px solid rgba(0, 229, 255, 0.25);
            color: #00E5FF;
            width: 28px;
            height: 28px;
            border-radius: 4px;
            cursor: pointer;
            display: flex;
            align-items: center;
            justify-content: center;
            font-size: 0.75rem;
            transition: all 0.3s ease;
            
            &:hover:not(:disabled) {
              background: rgba(0, 229, 255, 0.25);
              border-color: rgba(0, 229, 255, 0.45);
              transform: scale(1.05);
            }
            
            &:active:not(:disabled) {
              transform: scale(0.95);
            }
            
            &:disabled {
              opacity: 0.3;
              cursor: not-allowed;
            }
          }
          
          .page-info {
            color: #C7D2FE;
            font-size: 0.75rem;
            min-width: 80px;
            text-align: center;
          }
        }
      }
      
      h4 {
        color: #00E5FF;
        font-size: 0.85rem;
        font-weight: 600;
        margin: 0 0 0.8rem 0;
        text-align: center;
      }
      
      .detail-chart-container {
        background: transparent;
        border-radius: 4px;
        padding: 0.3rem;
        
        .detail-chart {
          width: 100%;
          height: 280px;
        }
      }
    }
  }
  
  .detail-chart-container {
    background: rgba(0, 0, 0, 0.2);
    border-radius: 8px;
    padding: 1rem;
    border: 1px solid rgba(0, 229, 255, 0.18);
    box-shadow: 0 0 20px rgba(139, 92, 246, 0.15) inset;
  }
  
  .detail-chart {
    width: 100%;
    height: 300px;
  }
  
  .detail-data {
    display: flex;
    flex-direction: column;
    gap: 1.5rem;
  }
  
  .data-section {
    h4 {
      color: #00E5FF;
      font-size: 1rem;
      margin-bottom: 1rem;
      font-weight: 600;
    }
  }
  
  .data-grid {
    display: grid;
    grid-template-columns: repeat(6, 1fr);
    gap: 0.6rem;
  }
  
  .data-item {
    background: rgba(139, 92, 246, 0.1);
    border: 1px solid rgba(0, 229, 255, 0.22);
    border-radius: 6px;
    padding: 0.6rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.2rem;
    
    .hour {
      color: #C7D2FE;
      font-size: 0.75rem;
    }
    
    .count {
      color: #FF3D8E;
      font-weight: 600;
      font-size: 0.8rem;
    }
  }
  
  .type-stats, .time-stats {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 0.6rem;
  }
  
  .type-item, .time-item {
    background: rgba(139, 92, 246, 0.08);
    border: 1px solid rgba(0, 229, 255, 0.2);
    border-radius: 6px;
    padding: 0.8rem;
    display: flex;
    align-items: center;
    justify-content: space-between;
    position: relative;
    overflow: hidden;
    
    // 背景条，按百分比展示
    &::before {
      content: '';
      position: absolute;
      left: 0;
      top: 0;
      height: 100%;
      width: var(--bar-width, 0%);
      background: linear-gradient(90deg, rgba(0,229,255,0.25), rgba(139,92,246,0.25));
      pointer-events: none;
    }

    .type-icon {
      font-size: 1rem;
      margin-right: 0.4rem;
    }
    
    .type-name, .time-period {
      color: #C7D2FE;
      flex: 1;
      font-size: 0.85rem;
    }
    
    .type-percent, .time-count {
      color: #FF3D8E;
      font-weight: 600;
      font-size: 0.85rem;
    }
  }
  
  // 加载动画样式
  .loading-overlay, .modal-loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(20, 24, 48, 0.9);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    backdrop-filter: blur(4px);
    
    .loading-spinner {
      text-align: center;
      
      .spinner {
        width: 50px;
        height: 50px;
        margin: 0 auto 16px;
        border: 4px solid rgba(0, 229, 255, 0.1);
        border-top-color: #00E5FF;
        border-radius: 50%;
        animation: spin 1s linear infinite;
      }
      
      p {
        color: #00E5FF;
        font-size: 14px;
        margin: 0;
        text-shadow: 0 0 10px rgba(0, 229, 255, 0.6);
      }
    }
  }
  
  .table-scroll-wrapper.loading,
  .modal-body.loading {
    opacity: 0.3;
    pointer-events: none;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* 响应式优化 */
@media (min-width: 2048px) {
  .channel-flow-analysis {
    .table-header {
      .header-left h3 {
        font-size: clamp(17px, 1.8vw, 20px);
      }
    }
    
    .channel-table {
      thead th {
        padding: clamp(1.2rem, 1.5vh, 1.5rem);
        font-size: clamp(1rem, 1.1vw, 1.1rem);
      }
      
      tbody td {
        padding: clamp(1.2rem, 1.5vh, 1.5rem);
      }
      
      .channel-name {
        font-size: clamp(1rem, 1.1vw, 1.1rem);
      }
      
      .mini-chart-cell .mini-chart {
        height: clamp(80px, 10vh, 100px);
      }
    }
  }
}

@media (max-width: 1440px) {
  .channel-flow-analysis {
    .channel-table {
      thead th {
        padding: clamp(0.8rem, 1.2vh, 1rem);
        font-size: clamp(0.8rem, 1vw, 0.9rem);
      }
      
      tbody td {
        padding: clamp(0.8rem, 1.2vh, 1rem);
      }
      
      .channel-name {
        font-size: clamp(0.85rem, 1vw, 0.95rem);
      }
    }
  }
}

@media (max-width: 768px) {
  .channel-flow-analysis {
    .channel-table {
      thead th {
        padding: 0.6rem;
        font-size: 0.75rem;
      }
      
      tbody td {
        padding: 0.6rem;
      }
      
      .mini-chart-cell .mini-chart {
        height: clamp(50px, 6vh, 60px);
      }
    }
  }
}
</style>

