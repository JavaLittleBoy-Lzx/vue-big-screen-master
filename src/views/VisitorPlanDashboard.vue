<template>
  <div id="visitorPlanDashboard">
    <div>
      <div class="chart-header">
        <div class="header-left">
          <h3>📊 {{ dashboardTitle }}</h3>
        </div>
      </div>
      <div class="dashboard-content">
        <!-- 加载动画遮罩 -->
        <div v-if="isLoading" class="loading-overlay">
          <div class="loading-spinner">
            <div class="spinner"></div>
            <p>加载中...</p>
          </div>
        </div>
        
        <!-- 水波图容器 -->
        <div class="charts-container" :class="{ 'loading': isLoading }">
          <!-- 访客数据水波图 -->
          <div class="chart-section" @click="showDetailModal('visitor')" style="cursor: pointer;" title="点击查看访客详情">
            <div class="chart-header">
              <span class="chart-title">计划访客</span>
              <span class="chart-total">{{ visitorStats.total }} 人</span>
            </div>
            <div class="liquid-chart visitor-chart" ref="visitorChart"></div>
          </div>

          <!-- 车辆数据水波图 -->
          <div class="chart-section" @click="showDetailModal('vehicle')" style="cursor: pointer;" title="点击查看车辆详情">
            <div class="chart-header">
              <span class="chart-title">预计车辆</span>
              <span class="chart-total">{{ vehicleStats.expected }} 辆</span>
            </div>
            <div class="liquid-chart vehicle-chart" ref="vehicleChart"></div>
          </div>
        </div>
      </div>
    </div>

    <!-- 详情弹窗 -->
    <div v-if="showModal" class="detail-modal" @click.self="closeModal">
      <div class="modal-content">
        <div class="modal-header">
          <h3>{{ modalTitle }}</h3>
          <button class="close-btn" @click="closeModal">×</button>
        </div>
        <div class="modal-body">
          <div class="table-wrapper">
            <table class="detail-table">
              <thead>
                <tr>
                  <th>序号</th>
                  <th>访客姓名</th>
                  <th>手机号</th>
                  <th v-if="modalType === 'vehicle'">车牌号</th>
                  <th>被访人</th>
                  <th>被访部门</th>
                  <th>开始时间</th>
                  <th>结束时间</th>
                  <th>进场时间</th>
                  <th>离场时间</th>
                  <th>来访状态</th>
                </tr>
              </thead>
              <tbody>
                <tr v-for="(item, index) in paginatedList" :key="item.id">
                  <td>{{ (currentPage - 1) * pageSize + index + 1 }}</td>
                  <td>{{ item.visitorName }}</td>
                  <td>{{ item.visitorPhone }}</td>
                  <td v-if="modalType === 'vehicle'">
                    <span :class="getPlateClass(item.carNumber)">{{ item.carNumber }}</span>
                  </td>
                  <td>{{ item.passName }}</td>
                  <td>{{ item.passDep }}</td>
                  <td>{{ formatTime(item.startTime) }}</td>
                  <td>{{ formatTime(item.endTime) }}</td>
                  <td>
                    <div class="time-cell" @click.stop="showTimeDetails(item, 'entry')" style="cursor: pointer;">
                      <span class="time-display">{{ getLatestEntryTime(item) }}</span>
                      <span v-if="getEntryRecordCount(item) > 1" class="record-count">{{ getEntryRecordCount(item) }}条</span>
                    </div>
                  </td>
                  <td>
                    <div class="time-cell" @click.stop="showTimeDetails(item, 'exit')" style="cursor: pointer;">
                      <span class="time-display">{{ getLatestExitTime(item) }}</span>
                      <span v-if="getExitRecordCount(item) > 1" class="record-count">{{ getExitRecordCount(item) }}条</span>
                    </div>
                  </td>
                  <td>
                    <span :class="getStatusClass(modalType === 'vehicle' ? item.carVisitStatus : item.personVisitStatus)">
                      {{ modalType === 'vehicle' ? (item.carVisitStatus || '未到达') : (item.personVisitStatus || '未来访') }}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
            <div v-if="detailList.length === 0" class="no-data">
              暂无数据
            </div>
          </div>
          
          <!-- 分页器 -->
          <div v-if="detailList.length > 0" class="pagination-container">
            <div class="pagination-controls">
              <button 
                class="page-btn" 
                :disabled="currentPage === 1"
                @click="goToPage(1)"
              >首页</button>
              <button 
                class="page-btn" 
                :disabled="currentPage === 1"
                @click="goToPage(currentPage - 1)"
              >上一页</button>
              
              <div class="page-numbers">
                <span 
                  v-for="page in visiblePages" 
                  :key="page"
                  class="page-number"
                  :class="{ active: page === currentPage }"
                  @click="goToPage(page)"
                >{{ page }}</span>
              </div>
              
              <button 
                class="page-btn" 
                :disabled="currentPage === totalPages"
                @click="goToPage(currentPage + 1)"
              >下一页</button>
              <button 
                class="page-btn" 
                :disabled="currentPage === totalPages"
                @click="goToPage(totalPages)"
              >末页</button>
              
              <select v-model.number="pageSize" @change="onPageSizeChange" class="page-size-select">
                <option :value="10">10条/页</option>
                <option :value="20">20条/页</option>
                <option :value="50">50条/页</option>
                <option :value="100">100条/页</option>
              </select>
            </div>
            <!-- 分页信息放到右下角 -->
            <div class="pagination-info-bottom">
              共 {{ detailList.length }} 条记录，当前第 {{ currentPage }}/{{ totalPages }} 页
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 时间详情弹窗 -->
    <div v-if="showTimeDetailModal" 
         class="time-detail-modal" 
         @click.self="closeTimeDetailModal"
         :style="{
           position: 'fixed',
           top: '0',
           left: '0',
           right: '0', 
           bottom: '0',
           width: '100vw',
           height: '100vh',
           background: 'rgba(0, 0, 0, 0.85)',
           display: 'flex',
           alignItems: 'center',
           justifyContent: 'center',
           zIndex: 999999,
           pointerEvents: 'all',
           backdropFilter: 'blur(8px)'
         }">
      <div class="time-modal-content" 
           :style="{
             background: 'linear-gradient(135deg, rgba(30, 30, 60, 0.98), rgba(20, 20, 40, 0.98))',
             borderRadius: '16px',
             width: '95%',
             maxWidth: '800px',
             maxHeight: '85vh',
             boxShadow: '0 30px 80px rgba(0, 229, 255, 0.4), 0 10px 40px rgba(0, 0, 0, 0.6)',
             border: '2px solid rgba(0, 229, 255, 0.5)',
             display: 'flex',
             flexDirection: 'column',
             animation: 'modalFadeIn 0.3s ease-out'
           }">
        <div class="time-modal-header" 
             :style="{
               display: 'flex',
               justifyContent: 'space-between',
               alignItems: 'center',
               padding: '24px 32px',
               background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.1), rgba(0, 191, 255, 0.05))',
               borderBottom: '1px solid rgba(0, 229, 255, 0.3)',
               borderRadius: '16px 16px 0 0'
             }">
          <div style="display: flex; align-items: center; gap: 12px;">
            <span style="font-size: 32px;">{{ timeDetailType === 'entry' ? '🚪' : '🚶' }}</span>
            <h3 style="margin: 0; font-size: 22px; color: #ffffff; font-weight: 600; text-shadow: 0 0 15px rgba(0, 229, 255, 0.8);">
              {{ timeDetailType === 'entry' ? '进场记录详情' : '离场记录详情' }}
            </h3>
          </div>
          <button class="close-btn" @click="closeTimeDetailModal" 
                  :style="{
                    width: '36px',
                    height: '36px',
                    border: 'none',
                    background: 'linear-gradient(135deg, rgba(255, 59, 92, 0.8), rgba(255, 99, 132, 0.6))',
                    color: '#ffffff',
                    fontSize: '20px',
                    cursor: 'pointer',
                    borderRadius: '8px',
                    transition: 'all 0.3s',
                    boxShadow: '0 4px 12px rgba(255, 59, 92, 0.3)'
                  }">×</button>
        </div>
        <div class="time-modal-body" 
             :style="{
               flex: 1,
               padding: '32px',
               overflowY: 'auto'
             }">
          <div class="visitor-info" 
               :style="{
                 display: 'flex',
                 alignItems: 'center',
                 gap: '20px',
                 marginBottom: '32px',
                 padding: '20px 24px',
                 background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.08), rgba(0, 191, 255, 0.05))',
                 borderRadius: '12px',
                 border: '1px solid rgba(0, 229, 255, 0.2)',
                 boxShadow: '0 4px 16px rgba(0, 229, 255, 0.1)'
               }">
            <div style="display: flex; align-items: center; gap: 12px;">
              <span style="font-size: 24px;">👤</span>
              <span class="visitor-name" 
                    :style="{
                      fontSize: '18px',
                      fontWeight: '600',
                      color: '#ffffff',
                      textShadow: '0 0 10px rgba(0, 229, 255, 0.6)'
                    }">{{ timeDetailItem?.visitorName }}</span>
            </div>
            <span v-if="modalType === 'vehicle' && timeDetailItem?.carNumber" 
                  :class="getPlateClass(timeDetailItem.carNumber)"
                  :style="{ transform: 'scale(1.1)' }">
              {{ timeDetailItem.carNumber }}
            </span>
          </div>
          <div class="time-records">
            <div v-for="(record, index) in timeDetailRecords" :key="index" 
                 class="time-record-item"
                 :style="{
                   marginBottom: '24px',
                   padding: '24px',
                   background: 'linear-gradient(135deg, rgba(255, 255, 255, 0.03), rgba(0, 229, 255, 0.02))',
                   borderRadius: '16px',
                   border: '1px solid rgba(0, 229, 255, 0.15)',
                   boxShadow: '0 8px 24px rgba(0, 0, 0, 0.2)',
                   position: 'relative',
                   overflow: 'hidden'
                 }">
              <div v-if="timeDetailRecords.length > 1" class="record-index" 
                   :style="{
                     fontSize: '16px',
                     fontWeight: '700',
                     color: '#00E5FF',
                     marginBottom: '16px',
                     padding: '8px 16px',
                     background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(0, 191, 255, 0.1))',
                     borderRadius: '8px',
                     display: 'inline-block',
                     boxShadow: '0 2px 8px rgba(0, 229, 255, 0.2)'
                   }">
                第{{ index + 1 }}次访问
              </div>
              <div v-else class="record-title"
                   :style="{
                     fontSize: '16px',
                     fontWeight: '700',
                     color: '#00E5FF',
                     marginBottom: '16px',
                     padding: '8px 16px',
                     background: 'linear-gradient(135deg, rgba(0, 229, 255, 0.2), rgba(0, 191, 255, 0.1))',
                     borderRadius: '8px',
                     display: 'inline-block',
                     boxShadow: '0 2px 8px rgba(0, 229, 255, 0.2)'
                   }">
                最新访问记录
              </div>
              <div class="record-times" 
                   :style="{
                     display: 'grid',
                     gridTemplateColumns: '1fr 1fr',
                     gap: '20px'
                   }">
                <div v-if="record.enterTime" class="time-entry"
                     :style="{
                       display: 'flex',
                       flexDirection: 'column',
                       gap: '8px',
                       padding: '16px',
                       background: 'linear-gradient(135deg, rgba(0, 255, 136, 0.1), rgba(0, 230, 118, 0.05))',
                       borderRadius: '12px',
                       border: '1px solid rgba(0, 255, 136, 0.2)'
                     }">
                  <span class="time-label" 
                        :style="{
                          fontSize: '14px',
                          color: '#00ff88',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }">
                    <span style="font-size: 16px;">🚪</span> 进场时间
                  </span>
                  <span class="time-value"
                        :style="{
                          fontFamily: 'Consolas, Monaco, monospace',
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#ffffff',
                          background: 'rgba(0, 255, 136, 0.15)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          textShadow: '0 0 8px rgba(0, 255, 136, 0.6)'
                        }">{{ formatTime(record.enterTime) }}</span>
                </div>
                <div v-if="record.leaveTime" class="time-exit"
                     :style="{
                       display: 'flex',
                       flexDirection: 'column',
                       gap: '8px',
                       padding: '16px',
                       background: 'linear-gradient(135deg, rgba(255, 152, 0, 0.1), rgba(255, 193, 7, 0.05))',
                       borderRadius: '12px',
                       border: '1px solid rgba(255, 152, 0, 0.2)'
                     }">
                  <span class="time-label"
                        :style="{
                          fontSize: '14px',
                          color: '#ff9800',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }">
                    <span style="font-size: 16px;">🚶</span> 离场时间
                  </span>
                  <span class="time-value"
                        :style="{
                          fontFamily: 'Consolas, Monaco, monospace',
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#ffffff',
                          background: 'rgba(255, 152, 0, 0.15)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          textShadow: '0 0 8px rgba(255, 152, 0, 0.6)'
                        }">{{ formatTime(record.leaveTime) }}</span>
                </div>
                <div v-if="record.enterTime && !record.leaveTime" class="time-exit"
                     :style="{
                       display: 'flex',
                       flexDirection: 'column',
                       gap: '8px',
                       padding: '16px',
                       background: 'linear-gradient(135deg, rgba(156, 39, 176, 0.1), rgba(142, 36, 170, 0.05))',
                       borderRadius: '12px',
                       border: '1px solid rgba(156, 39, 176, 0.2)'
                     }">
                  <span class="time-label"
                        :style="{
                          fontSize: '14px',
                          color: '#9c27b0',
                          fontWeight: '600',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '8px'
                        }">
                    <span style="font-size: 16px;">⏳</span> 离场时间
                  </span>
                  <span class="time-value pending"
                        :style="{
                          fontFamily: 'Consolas, Monaco, monospace',
                          fontSize: '16px',
                          fontWeight: '700',
                          color: '#9c27b0',
                          background: 'rgba(156, 39, 176, 0.15)',
                          padding: '8px 12px',
                          borderRadius: '8px',
                          textShadow: '0 0 8px rgba(156, 39, 176, 0.6)'
                        }">未离场</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { Liquid } from '@antv/g2plot';
import axios from 'axios';

export default {
  name: "VisitorPlanDashboard",
  props: {
    timeRange: {
      type: String,
      default: 'today'
    }
  },
  data() {
    return {
      visitorStats: {
        total: 0,
        completed: 0,
        pending: 0,
        percentage: 0
      },
      vehicleStats: {
        expected: 0,
        arrived: 0,
        current: 0
      },
      visitorChart: null,
      vehicleChart: null,
      showModal: false,
      modalType: 'visitor', // visitor 或 vehicle
      detailList: [],
      dataTimer: null,
      // 分页相关
      currentPage: 1,
      pageSize: 10,
      // 加载状态
      isLoading: false,
      // 时间详情弹窗
      showTimeDetailModal: false,
      timeDetailItem: null,
      timeDetailType: '', // 'entry' 或 'exit'
      timeDetailRecords: []
    };
  },
  computed: {
    // 根据时间范围动态显示标题
    dashboardTitle() {
      const titles = {
        'today': '今日计划看板',
        'week': '本周计划看板',
        'month': '本月计划看板',
        'year': '本年度计划看板'
      };
      return titles[this.timeRange] || '今日计划看板';
    },
    visitorProgress() {
      if (!this.visitorStats.total || this.visitorStats.total === 0) return 0;
      return (this.visitorStats.completed / this.visitorStats.total) * 100;
    },
    vehicleProgress() {
      if (!this.vehicleStats.expected || this.vehicleStats.expected === 0) return 0;
      return (this.vehicleStats.arrived / this.vehicleStats.expected) * 100;
    },
    modalTitle() {
      return this.modalType === 'visitor' ? '📋 访客预约详情' : '🚗 车辆预约详情';
    },
    // 总页数
    totalPages() {
      return Math.ceil(this.detailList.length / this.pageSize);
    },
    // 分页后的数据
    paginatedList() {
      const start = (this.currentPage - 1) * this.pageSize;
      const end = start + this.pageSize;
      return this.detailList.slice(start, end);
    },
    // 可见的页码
    visiblePages() {
      const total = this.totalPages;
      const current = this.currentPage;
      const pages = [];
      
      if (total <= 7) {
        // 如果总页数小于等于7，显示所有页码
        for (let i = 1; i <= total; i++) {
          pages.push(i);
        }
      } else {
        // 显示首页、尾页和当前页附近的页码
        if (current <= 4) {
          for (let i = 1; i <= 5; i++) pages.push(i);
          pages.push('...');
          pages.push(total);
        } else if (current >= total - 3) {
          pages.push(1);
          pages.push('...');
          for (let i = total - 4; i <= total; i++) pages.push(i);
        } else {
          pages.push(1);
          pages.push('...');
          for (let i = current - 1; i <= current + 1; i++) pages.push(i);
          pages.push('...');
          pages.push(total);
        }
      }
      
      return pages;
    }
  },
  watch: {
    // 监听时间范围变化，重新加载数据
    timeRange(newVal, oldVal) {
      if (newVal !== oldVal) {
        console.log('📊 [计划看板] 时间范围变化:', oldVal, '->', newVal);
        this.loadStatistics();
      }
    }
  },
  mounted() {
    this.loadStatistics();
    this.startDataRefresh();
  },
  beforeDestroy() {
    if (this.dataTimer) {
      clearInterval(this.dataTimer);
    }
    if (this.visitorChart) {
      this.visitorChart.destroy();
    }
    if (this.vehicleChart) {
      this.vehicleChart.destroy();
    }
  },
  methods: {
    // 加载统计数据
    async loadStatistics() {
      try {
        this.isLoading = true;
        console.log('📊 [今日计划看板] 开始加载统计数据...');
        
        const response = await axios.get('http://10.100.111.2:8675/parking/visitor/plan-dashboard/statistics', {
          params: {
            timeRange: this.timeRange
          }
        });
        
        console.log('📡 [今日计划看板] API响应:', response.data);
        
        // 兼容嵌套的响应格式
        let data = null;
        
        if (response.data) {
          // 格式1: {code: "0", data: {code: "0", data: {...}}}（嵌套结构）
          if (response.data.code === '0' && response.data.data && response.data.data.data) {
            data = response.data.data.data;
            console.log('✅ [今日计划看板] 检测到嵌套结构，使用 response.data.data.data');
          }
          // 格式2: {code: "0", data: {...}}（简单结构）
          else if (response.data.code === '0' && response.data.data) {
            data = response.data.data;
            console.log('✅ [今日计划看板] 检测到简单结构，使用 response.data.data');
          }
        }
        
        if (data && data.visitorStats && data.vehicleStats) {
          // 更新访客统计
          this.visitorStats = {
            total: data.visitorStats.total || 0,
            completed: data.visitorStats.completed || 0,
            pending: data.visitorStats.pending || 0,
            percentage: data.visitorStats.percentage || 0
          };
          
          // 更新车辆统计
          this.vehicleStats = {
            expected: data.vehicleStats.expected || 0,
            arrived: data.vehicleStats.arrived || 0,
            current: data.vehicleStats.current || 0
          };
          
          console.log('✅ [今日计划看板] 数据加载成功', {
            访客: `${this.visitorStats.completed}/${this.visitorStats.total}`,
            车辆: `${this.vehicleStats.arrived}/${this.vehicleStats.expected}`
          });
          
          // 初始化或更新图表
          this.$nextTick(() => {
            if (this.visitorChart && this.vehicleChart) {
              this.updateCharts();
            } else {
              this.initCharts();
            }
            // 图表渲染完成后关闭 loading
            setTimeout(() => {
              this.isLoading = false;
            }, 300);
          });
        } else {
          console.warn('⚠️ [今日计划看板] API返回数据格式异常');
          this.isLoading = false;
        }
      } catch (error) {
        console.error('❌ [今日计划看板] 加载统计数据失败:', error);
        this.isLoading = false;
      }
    },
    
    initCharts() {
      // 初始化访客水波图
      this.$nextTick(() => {
        this.initVisitorChart();
        this.initVehicleChart();
      });
    },
    
    initVisitorChart() {
      const container = this.$refs.visitorChart;
      if (!container) {
        console.error('❌ visitorChart 容器不存在');
        return;
      }
      
      const progress = this.visitorProgress / 100;
      const completedValue = this.visitorStats.completed;
      
      console.log('🎨 [今日计划看板] 初始化访客水波图', {
        进度: `${(this.visitorProgress || 0).toFixed(2)}% (${progress})`,
        已来访: completedValue,
        总数: this.visitorStats.total
      });
      
      this.visitorChart = new Liquid(container, {
        width: 140,
        height: 140,
        autoFit: false,
        percent: progress,
        shape: 'circle',
        outline: {
          border: 0,
          distance: 0,
        },
        wave: {
          count: 3,
          length: 128,
        },
        statistic: {
          title: false,
          content: {
            style: {
              fontSize: 'clamp(16px, 3vmin, 28px)',  // 响应式字体大小
              fontWeight: 'bold',
              fill: '#ffffff',
              textAlign: 'center',
            },
            customHtml: () => `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: clamp(16px, 3vmin, 28px);">${completedValue}</div>`,
          },
        },
        liquidStyle: {
          fill: '#00ff88',
        },
        background: {
          fill: 'transparent',
        },
        theme: {
          styleSheet: {
            brandColor: '#00ff88',
            paletteQualitative10: ['#00ff88'],
            paletteQualitative20: ['#00ff88'],
          },
        },
      });
      
      this.visitorChart.render();
    },
    
    initVehicleChart() {
      const container = this.$refs.vehicleChart;
      if (!container) return;
      
      const progress = this.vehicleProgress / 100;
      const arrivedValue = this.vehicleStats.arrived;
      
      this.vehicleChart = new Liquid(container, {
        width: 140,
        height: 140,
        autoFit: false,
        percent: progress,
        shape: 'circle',
        outline: {
          border: 0,
          distance: 0,
        },
        wave: {
          count: 3,
          length: 128,
        },
        waveStyle: {
          fill: '#4a90e2',
          fillOpacity: 0.5,
        },
        statistic: {
          title: false,
          content: {
            style: {
              fontSize: 'clamp(16px, 3vmin, 28px)',  // 响应式字体大小
              fontWeight: 'bold',
              fill: '#ffffff',
              textAlign: 'center',
            },
            customHtml: () => `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: clamp(16px, 3vmin, 28px);">${arrivedValue}</div>`,
          },
        },
        liquidStyle: {
          fill: '#002ae7',
        },
        background: {
          fill: 'transparent',
        },
        theme: {
          styleSheet: {
            brandColor: '#002ae7',
            paletteQualitative10: ['#002ae7'],
            paletteQualitative20: ['#002ae7'],
          },
        },
      });
      
      this.vehicleChart.render();
    },
    
    startDataRefresh() {
      // 每30秒刷新数据
      this.dataTimer = setInterval(() => {
        this.loadStatistics();
      }, 30000);
    },
    
    updateCharts() {
      const visitorPercent = this.visitorProgress / 100;
      const vehiclePercent = this.vehicleProgress / 100;
      
      console.log('🔄 [今日计划看板] 更新水波图', {
        访客: `${this.visitorStats.completed}/${this.visitorStats.total} = ${(this.visitorProgress || 0).toFixed(2)}% (${visitorPercent})`,
        车辆: `${this.vehicleStats.arrived}/${this.vehicleStats.expected} = ${(this.vehicleProgress || 0).toFixed(2)}% (${vehiclePercent})`
      });
      
      if (this.visitorChart) {
        this.visitorChart.changeData(visitorPercent);
        this.visitorChart.update({
          statistic: {
            content: {
              customHtml: () => `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: clamp(16px, 3vmin, 28px);">${this.visitorStats.completed}</div>`
            }
          }
        });
        console.log('✅ 访客水波图已更新');
      } else {
        console.warn('⚠️ visitorChart 不存在');
      }
      
      if (this.vehicleChart) {
        this.vehicleChart.changeData(vehiclePercent);
        this.vehicleChart.update({
          statistic: {
            content: {
              customHtml: () => `<div style="display: flex; align-items: center; justify-content: center; width: 100%; height: 100%; font-size: clamp(16px, 3vmin, 28px);">${this.vehicleStats.arrived}</div>`
            }
          }
        });
        console.log('✅ 车辆水波图已更新');
      } else {
        console.warn('⚠️ vehicleChart 不存在');
      }
    },
    
    // 显示详情弹窗
    async showDetailModal(type) {
      this.modalType = type;
      this.showModal = true;
      this.currentPage = 1;
      
      try {
        console.log('📋 [计划看板] 加载详细列表，类型:', type, '时间范围:', this.timeRange);
        
        // 🔍 分析：为什么统计API显示1058条，但详情API只返回119条？
        const expectedCount = this.modalType === 'visitor' ? this.visitorStats.total : this.vehicleStats.expected;
        console.log(`🔍 [问题分析] 统计API显示: ${expectedCount} 条，但详情API却只返回了119条`);
        console.log('� [可能原因] 详情API默认只返回“未离场”的记录，而统计API统计所有记录');
        console.log(`� [计划看板] 请求URL: http://10.100.111.2:8675/parking/visitor/plan-dashboard/detail-list`);
        console.log('🔵 [计划看板] 尝试showAll参数获取所有记录，期望:', expectedCount, '条');
        
        const requestParams = { 
          type: type,
          timeRange: this.timeRange,
          showAll: true  // 显示所有预约记录，包括已离场的
        };
        
        console.log('📤 [请求参数] 实际发送:', requestParams);
        
        const response = await axios.get('http://10.100.111.2:8675/parking/visitor/plan-dashboard/detail-list', {
          params: requestParams
        });
        
        console.log('📡 [今日计划看板] 详情列表API响应:', response.data);
        
        // 兼容嵌套的响应格式
        let data = null;
        
        if (response.data) {
          // 格式1: {code: "0", data: {code: "0", data: {...}}}（嵌套结构）
          if (response.data.code === '0' && response.data.data && response.data.data.data) {
            data = response.data.data.data;
            console.log('✅ [今日计划看板] 检测到嵌套结构，type:', data.type);
          }
          // 格式2: {code: "0", data: {...}}（简单结构）
          else if (response.data.code === '0' && response.data.data) {
            data = response.data.data;
            console.log('✅ [今日计划看板] 检测到简单结构，type:', data.type);
          }
        }
        
        if (data && data.list) {
          this.detailList = data.list || [];
          const expectedCount = this.modalType === 'visitor' ? this.visitorStats.total : this.vehicleStats.expected;
          console.log(`✅ [今日计划看板] 加载到 ${this.detailList.length} 条记录，类型: ${data.type}`);
          console.log(`🔍 [数据比对] 期望: ${expectedCount} 条，实际: ${this.detailList.length} 条`);
          if (this.detailList.length < expectedCount) {
            console.warn(`⚠️ [数据不匹配] 当前只加载了 ${this.detailList.length}/${expectedCount} 条记录，可能后端showAll参数未生效`);
          }
          console.log('📋 [今日计划看板] 前3条数据示例:', this.detailList.slice(0, 3));
        } else {
          this.detailList = [];
          console.warn('⚠️ [今日计划看板] 未获取到详细数据');
        }
      } catch (error) {
        console.error('❌ [今日计划看板] 加载详细列表失败:', error);
        this.detailList = [];
      }
    },
    
    // 关闭弹窗
    closeModal() {
      this.showModal = false;
      this.detailList = [];
      this.currentPage = 1;
    },
    
    // 跳转到指定页
    goToPage(page) {
      if (page === '...' || page < 1 || page > this.totalPages) return;
      this.currentPage = page;
    },
    
    // 改变每页显示条数
    onPageSizeChange() {
      this.currentPage = 1;
    },
    
    // 格式化时间
    formatTime(time) {
      if (!time) return '-';
      const date = new Date(time);
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');
      const hour = String(date.getHours()).padStart(2, '0');
      const minute = String(date.getMinutes()).padStart(2, '0');
      const second = String(date.getSeconds()).padStart(2, '0');
      return `${month}-${day} ${hour}:${minute}:${second}`;
    },
    
    // 获取状态样式类
    getStatusClass(status) {
      if (!status) return 'status-pending';
      if (status.includes('已进场') || status.includes('来访中')) return 'status-active';
      if (status.includes('已离场')) return 'status-finished';
      return 'status-pending';
    },
    
    // 获取最新进场时间
    getLatestEntryTime(item) {
      const timesJson = this.modalType === 'vehicle' ? item.carVisitTimes : item.personVisitTimes;
      if (!timesJson) return '-';
      
      try {
        const times = JSON.parse(timesJson);
        if (Array.isArray(times) && times.length > 0) {
          const enterTimes = times.filter(record => record.enterTime);
          if (enterTimes.length > 0) {
            // 返回最新的进场时间
            return this.formatTime(enterTimes[enterTimes.length - 1].enterTime);
          }
        }
      } catch (e) {
        console.error('解析进场时间失败:', e, timesJson);
      }
      return '-';
    },
    
    // 获取最新离场时间
    getLatestExitTime(item) {
      const timesJson = this.modalType === 'vehicle' ? item.carVisitTimes : item.personVisitTimes;
      if (!timesJson) return '-';
      
      try {
        const times = JSON.parse(timesJson);
        if (Array.isArray(times) && times.length > 0) {
          // 找到最新的离场时间
          for (let i = times.length - 1; i >= 0; i--) {
            if (times[i].leaveTime) {
              return this.formatTime(times[i].leaveTime);
            }
          }
        }
      } catch (e) {
        console.error('解析离场时间失败:', e, timesJson);
      }
      return '-';
    },
    
    // 获取进场记录数量
    getEntryRecordCount(item) {
      const timesJson = this.modalType === 'vehicle' ? item.carVisitTimes : item.personVisitTimes;
      if (!timesJson) return 0;
      
      try {
        const times = JSON.parse(timesJson);
        if (Array.isArray(times)) {
          // 使用处理后的记录数量
          const processedTimes = this.processTimeRecords(times);
          return processedTimes.filter(record => record.enterTime).length;
        }
      } catch (e) {
        console.error('解析进场记录数量失败:', e);
      }
      return 0;
    },
    
    // 获取离场记录数量
    getExitRecordCount(item) {
      const timesJson = this.modalType === 'vehicle' ? item.carVisitTimes : item.personVisitTimes;
      if (!timesJson) return 0;
      
      try {
        const times = JSON.parse(timesJson);
        if (Array.isArray(times)) {
          // 使用处理后的记录数量
          const processedTimes = this.processTimeRecords(times);
          return processedTimes.filter(record => record.leaveTime).length;
        }
      } catch (e) {
        console.error('解析离场记录数量失败:', e);
      }
      return 0;
    },
    
    // 获取车牌样式类（参考center.vue）
    getPlateClass(carNumber) {
      if (!carNumber) return '';
      // 新能源车牌（8位）
      if (carNumber.length >= 8) {
        return 'plate-new-energy';
      }
      // 普通车牌
      return 'plate-normal';
    },
    
    // 显示进出场时间详情
    showTimeDetails(item, type) {
      const timesJson = this.modalType === 'vehicle' ? item.carVisitTimes : item.personVisitTimes;
      
      if (!timesJson) {
        // 如果没有真实数据，显示提示
        this.$message?.info('该记录暂无进出场时间数据');
        return;
      }
      
      try {
        const times = JSON.parse(timesJson);
        
        if (Array.isArray(times) && times.length > 0) {
          // 处理只有进场时间没有离场时间的情况
          const processedTimes = this.processTimeRecords(times);
          
          this.timeDetailItem = item;
          this.timeDetailType = type;
          this.timeDetailRecords = processedTimes;
          this.showTimeDetailModal = true;
        } else {
          this.$message?.info('进出场时间数据格式错误');
        }
      } catch (e) {
        console.error('解析时间记录失败:', e);
        this.$message?.error('数据解析失败');
      }
    },
    
    // 处理时间记录，合并连续的只有进场时间的记录
    processTimeRecords(times) {
      if (!times || times.length === 0) return [];
      
      // 检查是否所有记录都只有进场时间，没有离场时间
      const allOnlyEnter = times.every(record => record.enterTime && !record.leaveTime);
      
      if (allOnlyEnter && times.length > 1) {
        // 如果都是只有进场时间的记录，只返回最后一条
        return [times[times.length - 1]];
      }
      
      // 否则返回所有记录
      return times;
    },
    
    // 关闭时间详情弹窗
    closeTimeDetailModal() {
      this.showTimeDetailModal = false;
      this.timeDetailItem = null;
      this.timeDetailType = '';
      this.timeDetailRecords = [];
    },
    
    // 判断是否为新能源车牌（8位）
    isNewEnergyPlate(carNumber) {
      if (!carNumber) return false;
      // 新能源车牌通常是8位，普通车牌是7位
      return carNumber.length >= 8;
    }
  }
};
</script>

<style lang="scss" scoped>
#visitorPlanDashboard {
  padding: clamp(0.8rem, 1.2vh, 1rem) clamp(0.8rem, 1.2vw, 1rem) 0;
  height: 100%;
  min-height: 0;
  min-width: 0;
  border-radius: 5px;
  display: flex;
  flex-direction: column;
  
  .bg-color-black {
    height: 100%;
    border-radius: 10px;
  }
  
  .text {
    color: #c3cbde;
  }
  
  .decoration2 {
    position: absolute;
    right: 10px;
  }
  
  .chart-header {
    margin-bottom: clamp(10px, 1.2vh, 15px);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    padding: 0 clamp(8px, 1vw, 12px);
    flex-shrink: 0;
    
    .header-left {
      flex: 1;
      
      h3 {
        margin: 0 0 5px 0;
        font-size: 16px;
        color: #ffffff;
        font-weight: bold;
      }
    }
  }
  
  .dashboard-content {
    padding: clamp(12px, 1.5vh, 18px);
    padding-top: clamp(12px, 1.5vh, 18px);
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    
    .charts-container {
      display: flex;
      justify-content: space-around;
      align-items: center;
      flex: 1;
      min-height: 0;
      gap: clamp(15px, 2vw, 20px);
      
      .chart-section {
        display: flex;
        flex-direction: column;
        align-items: center;
        flex: 1;
        
        .chart-header {
          display: flex;
          flex-direction: column;
          align-items: center;
          margin-bottom: clamp(12px, 1.5vh, 20px);
          
          .chart-title {
            font-size: clamp(12px, 1.4vw, 16px);
            color: #c3cbde;
            margin-bottom: clamp(4px, 0.6vh, 8px);
            font-weight: 500;
          }
          
          .chart-total {
            font-size: clamp(18px, 2.2vw, 24px);
            font-weight: 900;
            letter-spacing: 1px;
            animation: glow 2s ease-in-out infinite alternate;
          }
          
          // 访客数字样式 - 绿色系
          &:first-child .chart-total {
            color: #00ff88;
            text-shadow: 0 0 10px rgba(0, 255, 136, 0.8);
            background: linear-gradient(45deg, #00ff88, #00d4aa);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
          
          // 车辆数字样式 - 蓝色系
          &:last-child .chart-total {
            color: #4a90e2;
            text-shadow: 0 0 10px rgba(74, 144, 226, 0.8);
            background: linear-gradient(45deg, #4a90e2, #00bfff);
            -webkit-background-clip: text;
            -webkit-text-fill-color: transparent;
            background-clip: text;
          }
        }
        
        .progress-percent {
          margin-top: 10px;
          font-size: 12px;
          color: #c3cbde;
          font-weight: 500;
          opacity: 0.8;
        }
        
        .liquid-chart {
          width: clamp(100px, 14vmin, 180px);
          height: clamp(100px, 14vmin, 180px);
          position: relative;
          border-radius: 50%;
          background: radial-gradient(circle at center, 
            rgba(0, 255, 136, 0.1) 0%, 
            rgba(0, 255, 136, 0.05) 30%, 
            transparent 70%);
          box-shadow: 
            0 0 20px rgba(0, 255, 136, 0.3),
            inset 0 0 20px rgba(0, 255, 136, 0.1);
          border: 1px solid rgba(0, 255, 136, 0.2);
          
          // 确保G2Plot生成的统计文本居中
          ::v-deep .g2-html-annotation {
            display: flex !important;
            align-items: center !important;
            justify-content: center !important;
          }
          
          &::before {
            content: '';
            position: absolute;
            top: -2px;
            left: -2px;
            right: -2px;
            bottom: -2px;
            border-radius: 50%;
            background: linear-gradient(45deg, 
              rgba(0, 255, 136, 0.3), 
              rgba(0, 255, 136, 0.1), 
              rgba(0, 255, 136, 0.3));
            z-index: -1;
            animation: rotate 3s linear infinite;
          }
          
          &.vehicle-chart {
            background: radial-gradient(circle at center, 
              rgba(96, 165, 250, 0.15) 0%, 
              rgba(96, 165, 250, 0.08) 30%, 
              transparent 70%);
            box-shadow: 
              0 0 20px rgba(96, 165, 250, 0.4),
              inset 0 0 20px rgba(96, 165, 250, 0.15);
            border: 1px solid rgba(96, 165, 250, 0.3);
            
            &::before {
              background: linear-gradient(45deg, 
                rgba(36, 129, 243, 0.2), 
                rgba(36, 129, 243, 0.08), 
                rgba(36, 129, 243, 0.2));
            }
          }
        }
        
        @keyframes rotate {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        
        @keyframes glow {
          0% { 
            transform: scale(1);
          }
          100% { 
            transform: scale(1.05);
          }
        }
        
        // 访客数字发光动画
        &:first-child .chart-total {
          animation: glowGreen 2s ease-in-out infinite alternate;
        }
        
        // 车辆数字发光动画
        &:last-child .chart-total {
          animation: glowBlue 2s ease-in-out infinite alternate;
        }
        
        @keyframes glowGreen {
          0% { 
            text-shadow: 0 0 10px rgba(0, 255, 136, 0.8);
          }
          100% { 
            text-shadow: 0 0 20px rgba(0, 255, 136, 1), 0 0 30px rgba(0, 212, 170, 0.6);
          }
        }
        
        @keyframes glowBlue {
          0% { 
            text-shadow: 0 0 10px rgba(74, 144, 226, 0.8);
          }
          100% { 
            text-shadow: 0 0 20px rgba(74, 144, 226, 1), 0 0 30px rgba(0, 191, 255, 0.6);
          }
        }
      }
    }
  }
  
  // 详情弹窗样式
  .detail-modal {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.75);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 10000;
    backdrop-filter: blur(8px);
    
    .modal-content {
      background: linear-gradient(135deg, rgba(30, 30, 60, 0.98), rgba(20, 20, 40, 0.98));
      border-radius: 16px;
      width: 95%;
      max-width: 1600px;
      max-height: 88vh;
      box-shadow: 0 20px 60px rgba(0, 229, 255, 0.3),
                  inset 0 0 40px rgba(0, 229, 255, 0.08);
      border: 1px solid rgba(0, 229, 255, 0.3);
      display: flex;
      flex-direction: column;
      
      .modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 24px 32px;
        border-bottom: 1px solid rgba(0, 229, 255, 0.2);
        background: rgba(0, 229, 255, 0.05);
        
        h3 {
          margin: 0;
          font-size: 20px;
          color: #ffffff;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(0, 229, 255, 0.6);
        }
        
        .close-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: rgba(255, 59, 92, 0.2);
          color: #ff3b5c;
          font-size: 24px;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.3s;
          
          &:hover {
            background: rgba(255, 59, 92, 0.3);
            transform: scale(1.1);
          }
        }
      }
      
      .modal-body {
        flex: 1;
        padding: 24px 32px;
        overflow: hidden;
        display: flex;
        flex-direction: column;
        
        .table-wrapper {
          flex: 1;
          overflow-y: auto;
          max-height: calc(85vh - 200px);
          
          /* 自定义滚动条 */
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
          
          .detail-table {
            width: 100%;
            border-collapse: collapse;
            
            thead {
              position: sticky;
              top: 0;
              z-index: 10;
              background: rgba(30, 30, 60, 0.95);
              
              th {
                padding: 16px 12px;
                text-align: left;
                color: #00E5FF;
                font-size: 14px;
                font-weight: 600;
                border-bottom: 2px solid rgba(0, 229, 255, 0.3);
                white-space: nowrap;
              }
            }
            
            tbody {
              tr {
                transition: background 0.3s;
                
                &:hover {
                  background: rgba(0, 229, 255, 0.08);
                }
                
                td {
                  padding: 14px 12px;
                  color: #c3cbde;
                  font-size: 13px;
                  border-bottom: 1px solid rgba(0, 229, 255, 0.1);
                  vertical-align: top; // 顶部对齐
                  
                  .status-active {
                    display: inline-block;
                    padding: 4px 12px;
                    background: rgba(0, 255, 136, 0.2);
                    color: #00ff88;
                    border-radius: 12px;
                    font-size: 12px;
                    border: 1px solid rgba(0, 255, 136, 0.4);
                  }
                  
                  .status-pending {
                    display: inline-block;
                    padding: 4px 12px;
                    background: rgba(255, 152, 0, 0.2);
                    color: #ff9800;
                    border-radius: 12px;
                    font-size: 12px;
                    border: 1px solid rgba(255, 152, 0, 0.4);
                  }
                  
                  .status-finished {
                    display: inline-block;
                    padding: 4px 12px;
                    background: rgba(96, 125, 139, 0.2);
                    color: #90a4ae;
                    border-radius: 12px;
                    font-size: 12px;
                    border: 1px solid rgba(96, 125, 139, 0.4);
                  }
                  
                  // 时间单元格样式
                  .time-cell {
                    cursor: pointer !important;
                    padding: 8px;
                    border-radius: 6px;
                    transition: all 0.3s;
                    display: flex;
                    align-items: center;
                    gap: 8px;
                    user-select: none; // 防止文本选择
                    
                    &:hover {
                      background: rgba(0, 229, 255, 0.15);
                      transform: translateY(-1px);
                      box-shadow: 0 2px 8px rgba(0, 229, 255, 0.2);
                    }
                    
                    &:active {
                      transform: translateY(0);
                      background: rgba(0, 229, 255, 0.25);
                    }
                    
                    .time-display {
                      font-family: 'Consolas', 'Monaco', monospace;
                      color: #00E5FF;
                      font-weight: 500;
                    }
                    
                    .record-count {
                      background: linear-gradient(135deg, #ff6b6b, #ee5a24);
                      color: #ffffff;
                      padding: 3px 8px;
                      border-radius: 12px;
                      font-size: 11px;
                      font-weight: 600;
                      border: 1px solid rgba(255, 107, 107, 0.4);
                      box-shadow: 0 2px 6px rgba(255, 107, 107, 0.3);
                      animation: pulse 2s infinite;
                      
                      &::before {
                        content: '📊';
                        margin-right: 3px;
                      }
                    }
                    
                    @keyframes pulse {
                      0% { transform: scale(1); }
                      50% { transform: scale(1.05); }
                      100% { transform: scale(1); }
                    }
                  }
                  
                  // 参考violation.vue的车牌样式
                  .plate-normal {
                    display: inline-block;
                    font-size: 14px;
                    font-weight: bold;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-family: "微软雅黑";
                    letter-spacing: 1px;
                    min-width: 80px;
                    text-align: center;
                    position: relative;
                    transition: all 0.3s ease;
                    background: linear-gradient(135deg, #0C4FC5, #216FEF);
                    color: #FFFFFF;
                    border: 1px solid #0C4FC5;
                    box-shadow: 0 2px 8px rgba(12, 79, 197, 0.2);
                    
                    &:hover {
                      transform: translateY(-1px);
                      box-shadow: 0 4px 12px rgba(12, 79, 197, 0.3);
                    }
                  }
                  
                  .plate-new-energy {
                    display: inline-block;
                    font-size: 14px;
                    font-weight: bold;
                    padding: 6px 12px;
                    border-radius: 6px;
                    font-family: "微软雅黑";
                    letter-spacing: 1px;
                    min-width: 80px;
                    text-align: center;
                    position: relative;
                    transition: all 0.3s ease;
                    background: linear-gradient(180deg, #6AD390 0%, #D0F1E4 100%);
                    color: #000000;
                    border: 1px solid #6AD390;
                    box-shadow: 0 2px 8px rgba(82, 196, 26, 0.2);
                    
                    &:hover {
                      transform: translateY(-1px);
                      box-shadow: 0 4px 12px rgba(82, 196, 26, 0.3);
                    }
                    
                    &::before {
                      position: absolute;
                      top: -12px;
                      right: -6px;
                      background: #f6ffed;
                      color: #52c41a;
                      font-size: 10px;
                      padding: 1px 4px;
                      border-radius: 3px;
                      border: 1px solid #b7eb8f;
                      transform: scale(0.8);
                    }
                  }
                }
              }
            }
          }
          
          .no-data {
            text-align: center;
            padding: 60px 20px;
            color: #7981a6;
            font-size: 16px;
          }
        }
        
        /* 分页器样式 */
        .pagination-container {
          display: flex;
          justify-content: space-between;
          align-items: flex-end;
          margin-top: 20px;
          padding: 16px 20px;
          border-top: 1px solid rgba(0, 229, 255, 0.1);
          position: relative;
          
          .pagination-info-bottom {
            position: absolute;
            bottom: 16px;
            right: 20px;
            color: rgba(0, 229, 255, 0.8);
            font-size: 13px;
            font-weight: 500;
            background: rgba(0, 229, 255, 0.1);
            padding: 8px 16px;
            border-radius: 20px;
            border: 1px solid rgba(0, 229, 255, 0.2);
            text-shadow: 0 0 8px rgba(0, 229, 255, 0.4);
            backdrop-filter: blur(4px);
          }
          
          .pagination-info {
            text-align: center;
            color: #c3cbde;
            font-size: 13px;
            margin-bottom: 12px;
            opacity: 0.8;
          }
          
          .pagination-controls {
            display: flex;
            align-items: center;
            justify-content: center;
            gap: 8px;
            
            .page-btn {
              padding: 6px 14px;
              background: rgba(0, 229, 255, 0.1);
              border: 1px solid rgba(0, 229, 255, 0.3);
              color: #00E5FF;
              font-size: 13px;
              cursor: pointer;
              border-radius: 4px;
              transition: all 0.3s;
              
              &:hover:not(:disabled) {
                background: rgba(0, 229, 255, 0.2);
                border-color: rgba(0, 229, 255, 0.5);
                transform: translateY(-1px);
              }
              
              &:disabled {
                opacity: 0.3;
                cursor: not-allowed;
              }
            }
            
            .page-numbers {
              display: flex;
              gap: 6px;
              margin: 0 8px;
              
              .page-number {
                min-width: 32px;
                height: 32px;
                display: flex;
                align-items: center;
                justify-content: center;
                background: rgba(0, 229, 255, 0.08);
                border: 1px solid rgba(0, 229, 255, 0.2);
                color: #c3cbde;
                font-size: 13px;
                cursor: pointer;
                border-radius: 4px;
                transition: all 0.3s;
                
                &:hover {
                  background: rgba(0, 229, 255, 0.15);
                  border-color: rgba(0, 229, 255, 0.4);
                  color: #00E5FF;
                }
                
                &.active {
                  background: rgba(0, 229, 255, 0.3);
                  border-color: rgba(0, 229, 255, 0.6);
                  color: #ffffff;
                  font-weight: bold;
                  box-shadow: 0 0 10px rgba(0, 229, 255, 0.3);
                }
              }
            }
            
            .page-size-select {
              margin-left: 12px;
              padding: 6px 10px;
              background: rgba(0, 229, 255, 0.1);
              border: 1px solid rgba(0, 229, 255, 0.3);
              color: #00E5FF;
              font-size: 13px;
              cursor: pointer;
              border-radius: 4px;
              outline: none;
              transition: all 0.3s;
              
              &:hover {
                background: rgba(0, 229, 255, 0.2);
                border-color: rgba(0, 229, 255, 0.5);
              }
              
              option {
                background: rgba(30, 30, 60, 0.95);
                color: #c3cbde;
              }
            }
          }
        }
      }
    }
  }
  
  // 加载动画样式
  .loading-overlay {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(20, 24, 48, 0.85);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 100;
    border-radius: 8px;
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
        text-shadow: 0 0 10px rgba(0, 229, 255, 0.5);
      }
    }
  }
  
  .charts-container.loading {
    opacity: 0.3;
    pointer-events: none;
  }
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// 响应式设计
@media (min-width: 2048px) {
  #visitorPlanDashboard {
    padding: clamp(1rem, 1.5vh, 1.5rem) clamp(1rem, 1.5vw, 1.5rem) 0;
    
    .chart-header {
      padding: 0 clamp(15px, 1.2vw, 20px);
      
      .header-left h3 {
        font-size: clamp(17px, 1.8vw, 20px);
      }
    }
    
    .dashboard-content {
      padding: clamp(18px, 2vh, 24px);
      padding-top: clamp(18px, 2vh, 24px);
      
      .charts-container {
        gap: clamp(25px, 3vw, 40px);
        
        .chart-section {
          .liquid-chart {
            width: clamp(140px, 16vmin, 220px);
            height: clamp(140px, 16vmin, 220px);
          }
          
          .chart-header {
            margin-bottom: clamp(18px, 2vh, 25px);
            
            .chart-title {
              font-size: clamp(14px, 1.5vw, 18px);
            }
            
            .chart-total {
              font-size: clamp(22px, 2.5vw, 28px);
            }
          }
        }
      }
    }
  }
}

@media (max-width: 1440px) {
  #visitorPlanDashboard {
    .dashboard-content .charts-container {
      gap: clamp(12px, 1.5vw, 18px);
      
      .chart-section {
        .liquid-chart {
          width: clamp(85px, 13vmin, 130px);
          height: clamp(85px, 13vmin, 130px);
        }
        
        .chart-header {
          margin-bottom: clamp(10px, 1.2vh, 15px);
          
          .chart-title {
            font-size: clamp(11px, 1.3vw, 13px);
          }
          
          .chart-total {
            font-size: clamp(15px, 1.8vw, 18px);
          }
        }
      }
    }
  }
}

@media (max-width: 768px) {
  #visitorPlanDashboard {
    .dashboard-content .charts-container {
      flex-direction: column;
      gap: 30px;
      
      .chart-section {
        .liquid-chart {
          width: clamp(100px, 20vmin, 120px);
          height: clamp(100px, 20vmin, 120px);
        }
      }
    }
    
    .detail-modal .modal-content {
      width: 95%;
      max-height: 90vh;
      
      .modal-header {
        padding: 16px 20px;
        
        h3 {
          font-size: 18px;
        }
      }
      
      .modal-body {
        padding: 16px 20px;
        
        .table-wrapper .detail-table {
          font-size: 12px;
          
          th, td {
            padding: 10px 8px;
          }
        }
        
        .pagination-container {
          .pagination-info {
            font-size: 12px;
          }
          
          .pagination-controls {
            flex-wrap: wrap;
            gap: 6px;
            
            .page-btn {
              padding: 4px 10px;
              font-size: 12px;
            }
            
            .page-numbers {
              margin: 0 4px;
              
              .page-number {
                min-width: 28px;
                height: 28px;
                font-size: 12px;
              }
            }
            
            .page-size-select {
              font-size: 12px;
              padding: 4px 8px;
            }
          }
        }
      }
    }
  }
  
  // 时间详情弹窗样式 - 使用深度选择器
  ::v-deep .time-detail-modal {
    position: fixed !important;
    top: 0 !important;
    left: 0 !important;
    right: 0 !important;
    bottom: 0 !important;
    width: 100vw !important;
    height: 100vh !important;
    background: rgba(255, 0, 0, 0.8) !important; // 临时改为红色调试
    display: flex !important;
    align-items: center !important;
    justify-content: center !important;
    z-index: 999999 !important; // 进一步提高z-index
    backdrop-filter: none !important; // 临时移除模糊效果
    pointer-events: all !important;
    
    .time-modal-content {
      background: linear-gradient(135deg, rgba(30, 30, 60, 0.98), rgba(20, 20, 40, 0.98));
      border-radius: 16px;
      width: 95%; // 增加宽度
      max-width: 800px; // 增加最大宽度
      max-height: 85vh; // 增加最大高度
      box-shadow: 0 30px 80px rgba(0, 229, 255, 0.4),
                  0 10px 40px rgba(0, 0, 0, 0.6),
                  inset 0 0 40px rgba(0, 229, 255, 0.12);
      border: 2px solid rgba(0, 229, 255, 0.5);
      display: flex;
      flex-direction: column;
      animation: modalFadeIn 0.3s ease-out;
      
      .time-modal-header {
        display: flex;
        justify-content: space-between;
        align-items: center;
        padding: 20px 24px;
        border-bottom: 1px solid rgba(0, 229, 255, 0.2);
        background: rgba(0, 229, 255, 0.05);
        
        h3 {
          margin: 0;
          font-size: 18px;
          color: #ffffff;
          font-weight: bold;
          text-shadow: 0 0 10px rgba(0, 229, 255, 0.6);
        }
        
        .close-btn {
          width: 32px;
          height: 32px;
          border: none;
          background: rgba(255, 59, 92, 0.2);
          color: #ff3b5c;
          font-size: 20px;
          cursor: pointer;
          border-radius: 6px;
          transition: all 0.3s;
          
          &:hover {
            background: rgba(255, 59, 92, 0.3);
            transform: scale(1.1);
          }
        }
      }
      
      .time-modal-body {
        flex: 1;
        padding: 20px 24px;
        overflow-y: auto;
        
        .visitor-info {
          display: flex;
          align-items: center;
          gap: 16px;
          margin-bottom: 20px;
          padding: 16px;
          background: rgba(0, 229, 255, 0.05);
          border-radius: 8px;
          border-left: 3px solid #00E5FF;
          
          .visitor-name {
            font-size: 16px;
            font-weight: 600;
            color: #ffffff;
          }
        }
        
        .time-records {
          .time-record-item {
            margin-bottom: 16px;
            padding: 16px;
            background: rgba(255, 255, 255, 0.02);
            border-radius: 8px;
            border: 1px solid rgba(0, 229, 255, 0.1);
            
            .record-index {
              font-size: 14px;
              font-weight: 600;
              color: #00E5FF;
              margin-bottom: 12px;
              padding: 4px 8px;
              background: rgba(0, 229, 255, 0.1);
              border-radius: 4px;
              display: inline-block;
            }
            
            .record-times {
              display: flex;
              flex-direction: column;
              gap: 8px;
              
              .time-entry,
              .time-exit {
                display: flex;
                align-items: center;
                gap: 12px;
                
                .time-label {
                  font-size: 13px;
                  color: #c3cbde;
                  min-width: 80px;
                }
                
                .time-value {
                  font-family: 'Consolas', 'Monaco', monospace;
                  font-size: 14px;
                  font-weight: 600;
                  color: #00ff88;
                  background: rgba(0, 255, 136, 0.1);
                  padding: 4px 8px;
                  border-radius: 4px;
                  
                  &.pending {
                    color: #ff9800;
                    background: rgba(255, 152, 0, 0.1);
                  }
                }
              }
            }
          }
        }
      }
    }
  }
  
  // 弹窗进入动画
  @keyframes modalFadeIn {
    0% {
      opacity: 0;
      transform: translateY(-30px) scale(0.9);
    }
    100% {
      opacity: 1;
      transform: translateY(0) scale(1);
    }
  }
}
</style>