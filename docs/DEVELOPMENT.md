# 开发文档

## 📋 文档概述

本文档为东北林业大学智慧车行数据可视化平台的开发指南，包含开发环境配置、代码规范、组件开发流程、新功能添加方法等，旨在帮助开发者快速上手项目开发。

## 🛠️ 开发环境配置

### 系统要求

**操作系统**：
- Windows 10/11 (推荐)
- macOS 10.15+
- Ubuntu 18.04+ 或其他Linux发行版

**硬件要求**：
- CPU: 双核2.0GHz以上（推荐四核）
- 内存: 8GB以上（推荐16GB）
- 硬盘: 10GB可用空间
- 显卡: 支持硬件加速的显卡

### 软件依赖

**必需软件**：
- **Node.js**: >= 14.0.0 (推荐使用LTS版本)
- **npm**: >= 6.0.0 或 **yarn**: >= 1.22.0
- **Git**: >= 2.20.0

**推荐工具**：
- **IDE**: Visual Studio Code
- **浏览器**: Chrome 90+ / Firefox 88+ / Edge 90+
- **调试工具**: Vue DevTools

### 环境安装步骤

#### 1. 安装Node.js
```bash
# Windows: 下载官方安装包
# https://nodejs.org/zh-cn/

# macOS (使用Homebrew)
brew install node

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_lts.x | sudo -E bash -
sudo apt-get install -y nodejs
```

#### 2. 验证安装
```bash
node --version  # 应该显示 v14.0.0 或更高版本
npm --version   # 应该显示 6.0.0 或更高版本
```

#### 3. 克隆项目
```bash
# 使用HTTPS
git clone https://github.com/nefu/big-screen-vue-datav.git

# 使用SSH（推荐）
git clone git@github.com:nefu/big-screen-vue-datav.git

# 进入项目目录
cd big-screen-vue-datav
```

#### 4. 安装依赖
```bash
# 使用npm
npm install

# 或使用yarn（推荐，速度更快）
yarn install
```

#### 5. 配置环境变量
```bash
# 复制环境变量模板
cp .env.example .env.development

# 编辑开发环境配置
# 配置API地址、WebSocket地址等
```

### 开发服务器启动

```bash
# 启动开发服务器
npm run serve

# 或使用yarn
yarn serve

# 服务器启动后访问
# http://localhost:6954
```

**开发服务器特性**：
- 热重载：代码修改后自动刷新页面
- 源码映射：便于调试
- 错误提示：实时显示编译错误
- 代理支持：自动代理API请求

## 🏗️ 项目架构详解

### 核心技术栈

```json
{
  "framework": "Vue 2.7.16",
  "ui": "@jiaminghi/data-view 2.10.0",
  "charts": {
    "echarts": "4.9.0",
    "@antv/g2plot": "2.4.35"
  },
  "state": "Vuex 3.6.2",
  "router": "Vue Router 3.6.5",
  "http": "Axios 1.12.2",
  "style": "SCSS 1.93.2"
}
```

### 目录结构说明

```
src/
├── assets/                    # 静态资源
│   ├── scss/                 # SCSS样式
│   │   ├── _variables.scss   # 全局变量
│   │   ├── _mixins.scss      # 混合器
│   │   ├── base.scss         # 基础样式
│   │   └── components.scss   # 组件样式
│   └── images/               # 图片资源
│
├── components/               # 可复用组件
│   ├── common/              # 通用组件
│   │   ├── LoadingSpinner.vue
│   │   ├── ErrorMessage.vue
│   │   └── ConfirmDialog.vue
│   ├── layout/              # 布局组件
│   │   ├── Header.vue
│   │   ├── Sidebar.vue
│   │   └── Footer.vue
│   ├── echart/              # 图表组件
│   │   ├── base/            # 图表基类
│   │   ├── business/        # 业务图表
│   │   └── utils/           # 图表工具
│   └── business/            # 业务组件
│
├── views/                   # 页面组件
├── services/                # 业务服务
├── utils/                   # 工具函数
├── config/                  # 配置文件
├── store/                   # 状态管理
├── router/                  # 路由配置
├── middleware/              # 中间件
├── directives/              # 自定义指令
├── filters/                 # 过滤器
├── plugins/                 # 插件
└── main.js                  # 应用入口
```

## 📝 代码规范

### 1. JavaScript/Vue规范

#### 1.1 组件命名
```javascript
// 文件命名：PascalCase
// ✅ 好的命名
VehicleFlowChart.vue
ParkingStatistics.vue
RealTimeMonitor.vue

// ❌ 不好的命名
vehicleflowchart.vue
parking-statistics.vue
realTimeMonitor.vue

// 组件内部name属性：PascalCase
export default {
  name: 'VehicleFlowChart'  // 与文件名保持一致
}
```

#### 1.2 组件结构
```vue
<template>
  <!-- 模板内容 -->
  <div class="vehicle-flow-chart">
    <!-- 使用语义化的类名 -->
    <div class="chart-header">
      <h3 class="chart-title">{{ title }}</h3>
    </div>
    <div class="chart-container" ref="chartContainer">
      <!-- 图表容器 -->
    </div>
  </div>
</template>

<script>
// 导入顺序：第三方库 -> 本地模块
import echarts from 'echarts'
import { formatChartData } from '@/utils/chartUtils'
import vehicleService from '@/services/vehicleService'

export default {
  name: 'VehicleFlowChart',

  // 组件选项顺序：name -> props -> data -> computed -> watch -> methods -> lifecycle
  props: {
    title: {
      type: String,
      required: true
    },
    data: {
      type: Array,
      default: () => []
    },
    options: {
      type: Object,
      default: () => ({})
    }
  },

  data() {
    return {
      chart: null,
      loading: false
    }
  },

  computed: {
    formattedData() {
      return formatChartData(this.data)
    }
  },

  watch: {
    data: {
      handler: 'updateChart',
      deep: true
    }
  },

  methods: {
    initChart() {
      // 初始化图表
    },

    updateChart() {
      // 更新图表数据
    }
  },

  mounted() {
    this.initChart()
  },

  beforeDestroy() {
    // 清理工作
    if (this.chart) {
      this.chart.dispose()
    }
  }
}
</script>

<style lang="scss" scoped>
// 使用scoped样式避免污染
.vehicle-flow-chart {
  // 组件样式
}
</style>
```

#### 1.3 方法命名规范
```javascript
export default {
  methods: {
    // 1. 事件处理方法：handle + 事件名
    handleChartClick(event) {},
    handleResize() {},

    // 2. API请求方法：动词 + 名词
    fetchVehicleData() {},
    submitForm() {},

    // 3. 工具方法：动词 + 名词
    formatChartData() {},
    validateInput() {},

    // 4. 私有方法：下划线开头
    _initChart() {},
    _updateChart() {}
  }
}
```

### 2. CSS/SCSS规范

#### 2.1 命名规范
```scss
// 使用BEM命名规范
.block {                    // 块
  &__element {             // 元素
    color: #fff;
  }

  &--modifier {            // 修饰符
    background: #1890ff;
  }
}

// 示例
.chart-container {
  &__title {
    font-size: 18px;
  }

  &__content {
    padding: 16px;
  }

  &--large {
    .chart-container__title {
      font-size: 24px;
    }
  }
}
```

#### 2.2 样式组织
```scss
// 1. 变量定义
$primary-color: #1890ff;
$text-color: #ffffff;
$border-radius: 4px;

// 2. 混合器
@mixin flex-center {
  display: flex;
  align-items: center;
  justify-content: center;
}

// 3. 基础样式
%base-button {
  padding: 8px 16px;
  border: none;
  border-radius: $border-radius;
  cursor: pointer;
}

// 4. 组件样式
.button {
  @extend %base-button;
  background: $primary-color;

  &--primary {
    background: darken($primary-color, 10%);
  }
}
```

### 3. 文件命名规范

```
# Vue组件文件
VehicleFlowChart.vue          # PascalCase
UserProfile.vue              # PascalCase

# JavaScript文件
chartUtils.js                # camelCase
apiService.js                # camelCase

# SCSS文件
_variables.scss              # 下划线开头的私有文件
_mixins.scss                 # 下划线开头的私有文件
main.scss                    # 普通文件

# 图片文件
chart-bg.png                 # kebab-case
logo.png                     # kebab-case
```

## 🔧 组件开发指南

### 1. 创建新组件

#### 1.1 组件文件结构
```
components/echart/
├── NewChart.vue             # 主组件文件
├── NewChart.config.js       # 图表配置
├── NewChart.mock.js         # 模拟数据
└── index.js                 # 导出文件
```

#### 1.2 组件模板
```vue
<!-- NewChart.vue -->
<template>
  <div class="new-chart" ref="chartContainer">
    <div v-if="loading" class="chart-loading">
      <LoadingSpinner />
    </div>
    <div v-else-if="error" class="chart-error">
      <ErrorMessage :message="error" @retry="fetchData" />
    </div>
  </div>
</template>

<script>
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import ErrorMessage from '@/components/common/ErrorMessage.vue'
import chartConfig from './NewChart.config.js'

export default {
  name: 'NewChart',

  components: {
    LoadingSpinner,
    ErrorMessage
  },

  props: {
    data: {
      type: Array,
      default: () => []
    },
    config: {
      type: Object,
      default: () => ({})
    }
  },

  data() {
    return {
      chart: null,
      loading: false,
      error: null
    }
  },

  computed: {
    chartOptions() {
      return {
        ...chartConfig,
        ...this.config
      }
    }
  },

  watch: {
    data: {
      handler: 'updateChart',
      immediate: true
    }
  },

  methods: {
    initChart() {
      this.chart = echarts.init(this.$refs.chartContainer)
      this.chart.setOption(this.chartOptions)

      // 绑定事件
      this.chart.on('click', this.handleChartClick)
      this.chart.on('mouseover', this.handleMouseOver)

      // 响应式处理
      window.addEventListener('resize', this.handleResize)
    },

    updateChart() {
      if (!this.chart) return

      const options = {
        ...this.chartOptions,
        series: [{
          ...this.chartOptions.series[0],
          data: this.data
        }]
      }

      this.chart.setOption(options)
    },

    handleChartClick(params) {
      this.$emit('chart-click', params)
    },

    handleMouseOver(params) {
      this.$emit('chart-hover', params)
    },

    handleResize() {
      if (this.chart) {
        this.chart.resize()
      }
    },

    async fetchData() {
      this.loading = true
      this.error = null

      try {
        // 获取数据逻辑
      } catch (error) {
        this.error = error.message
      } finally {
        this.loading = false
      }
    }
  },

  mounted() {
    this.$nextTick(() => {
      this.initChart()
    })
  },

  beforeDestroy() {
    // 清理工作
    if (this.chart) {
      this.chart.dispose()
    }
    window.removeEventListener('resize', this.handleResize)
  }
}
</script>

<style lang="scss" scoped>
.new-chart {
  width: 100%;
  height: 100%;
  position: relative;

  .chart-loading,
  .chart-error {
    @include flex-center;
    width: 100%;
    height: 100%;
  }
}
</style>
```

#### 1.3 图表配置文件
```javascript
// NewChart.config.js
import { commonConfig } from '@/config/chartConfig'

export default {
  ...commonConfig,

  // 图表类型特定配置
  series: [{
    type: 'bar',
    name: '数据统计',
    data: [],

    // 样式配置
    itemStyle: {
      color: new echarts.graphic.LinearGradient(0, 0, 0, 1, [
        { offset: 0, color: '#1890ff' },
        { offset: 1, color: '#0050b3' }
      ])
    },

    emphasis: {
      itemStyle: {
        color: '#40a9ff'
      }
    }
  }],

  // 交互配置
  tooltip: {
    trigger: 'axis',
    formatter: (params) => {
      // 自定义tooltip格式
    }
  }
}
```

### 2. 图表组件基类

#### 2.1 基础图表组件
```vue
<!-- BaseChart.vue -->
<template>
  <div
    class="base-chart"
    ref="chartContainer"
    :class="{ 'is-loading': loading }"
  >
    <slot v-if="loading" name="loading">
      <div class="chart-loading">
        <LoadingSpinner />
      </div>
    </slot>
  </div>
</template>

<script>
import LoadingSpinner from '@/components/common/LoadingSpinner.vue'
import { chartTheme } from '@/config/chartConfig'

export default {
  name: 'BaseChart',

  components: {
    LoadingSpinner
  },

  props: {
    data: {
      type: [Array, Object],
      required: true
    },
    options: {
      type: Object,
      default: () => ({})
    },
    theme: {
      type: String,
      default: 'dark'
    },
    autoResize: {
      type: Boolean,
      default: true
    },
    loading: {
      type: Boolean,
      default: false
    }
  },

  data() {
    return {
      chart: null,
      resizeObserver: null
    }
  },

  computed: {
    chartOptions() {
      return {
        ...chartTheme[this.theme],
        ...this.options,
        series: this.processSeries()
      }
    }
  },

  watch: {
    data: {
      handler: 'updateChart',
      deep: true
    },
    options: {
      handler: 'updateChart',
      deep: true
    }
  },

  methods: {
    initChart() {
      if (!this.$refs.chartContainer) return

      this.chart = echarts.init(this.$refs.chartContainer, this.theme)
      this.chart.setOption(this.chartOptions)
      this.bindEvents()

      if (this.autoResize) {
        this.setupResizeObserver()
      }
    },

    updateChart() {
      if (!this.chart) return
      this.chart.setOption(this.chartOptions, true)
    },

    processSeries() {
      // 子类实现具体的数据处理逻辑
      return []
    },

    bindEvents() {
      // 绑定图表事件
      this.$emit('ready', this.chart)
    },

    setupResizeObserver() {
      this.resizeObserver = new ResizeObserver(() => {
        if (this.chart) {
          this.chart.resize()
        }
      })
      this.resizeObserver.observe(this.$refs.chartContainer)
    },

    getChart() {
      return this.chart
    },

    dispose() {
      if (this.chart) {
        this.chart.dispose()
        this.chart = null
      }
      if (this.resizeObserver) {
        this.resizeObserver.disconnect()
        this.resizeObserver = null
      }
    }
  },

  mounted() {
    this.$nextTick(() => {
      this.initChart()
    })
  },

  beforeDestroy() {
    this.dispose()
  }
}
</script>
```

### 3. 业务图表组件示例

#### 3.1 车流量统计图表
```vue
<!-- VehicleFlowChart.vue -->
<template>
  <BaseChart
    :data="chartData"
    :options="chartOptions"
    :loading="loading"
    @ready="handleChartReady"
    @chart-click="handleChartClick"
  />
</template>

<script>
import BaseChart from './BaseChart.vue'
import { barChartConfig } from '@/config/chartConfig'
import vehicleService from '@/services/vehicleService'

export default {
  name: 'VehicleFlowChart',

  components: {
    BaseChart
  },

  props: {
    timeRange: {
      type: String,
      default: 'today'
    },
    channelType: {
      type: String,
      default: 'all'
    }
  },

  data() {
    return {
      chartData: [],
      loading: false
    }
  },

  computed: {
    chartOptions() {
      return {
        ...barChartConfig,
        xAxis: {
          type: 'category',
          data: this.chartData.map(item => item.time)
        },
        yAxis: {
          type: 'value',
          name: '车辆数'
        },
        series: [{
          type: 'bar',
          name: '车流量',
          data: this.chartData.map(item => item.count)
        }]
      }
    }
  },

  methods: {
    async fetchData() {
      this.loading = true

      try {
        const data = await vehicleService.getVehicleFlow({
          timeRange: this.timeRange,
          channelType: this.channelType
        })
        this.chartData = data
      } catch (error) {
        this.$message.error('获取车流量数据失败')
        console.error(error)
      } finally {
        this.loading = false
      }
    },

    handleChartReady(chart) {
      // 图表就绪后的处理
    },

    handleChartClick(params) {
      this.$emit('chart-click', params)
    }
  },

  watch: {
    timeRange: 'fetchData',
    channelType: 'fetchData'
  },

  mounted() {
    this.fetchData()
  }
}
</script>
```

## 🔄 状态管理

### Vuex Store结构

```javascript
// store/index.js
import Vue from 'vue'
import Vuex from 'vuex'
import modules from './modules'

Vue.use(Vuex)

export default new Vuex.Store({
  state: {
    // 全局状态
    loading: false,
    error: null,
    theme: 'dark'
  },

  mutations: {
    // 全局mutations
    SET_LOADING(state, loading) {
      state.loading = loading
    },

    SET_ERROR(state, error) {
      state.error = error
    },

    SET_THEME(state, theme) {
      state.theme = theme
    }
  },

  actions: {
    // 全局actions
    setLoading({ commit }, loading) {
      commit('SET_LOADING', loading)
    },

    setError({ commit }, error) {
      commit('SET_ERROR', error)
    },

    setTheme({ commit }, theme) {
      commit('SET_THEME', theme)
      localStorage.setItem('theme', theme)
    }
  },

  getters: {
    // 全局getters
    isLoading: state => state.loading,
    error: state => state.error,
    theme: state => state.theme
  },

  modules
})
```

### 模块化状态管理

```javascript
// store/modules/vehicle.js
const state = {
  vehicleData: [],
  realTimeVehicles: [],
  statistics: {}
}

const mutations = {
  SET_VEHICLE_DATA(state, data) {
    state.vehicleData = data
  },

  SET_REAL_TIME_VEHICLES(state, vehicles) {
    state.realTimeVehicles = vehicles
  },

  SET_STATISTICS(state, statistics) {
    state.statistics = statistics
  }
}

const actions = {
  async fetchVehicleData({ commit }, params) {
    try {
      const data = await vehicleService.getData(params)
      commit('SET_VEHICLE_DATA', data)
      return data
    } catch (error) {
      throw error
    }
  },

  async fetchRealTimeVehicles({ commit }) {
    try {
      const vehicles = await vehicleService.getRealTime()
      commit('SET_REAL_TIME_VEHICLES', vehicles)
      return vehicles
    } catch (error) {
      throw error
    }
  }
}

const getters = {
  vehicleCount: state => state.vehicleData.length,
  onlineVehicles: state => state.realTimeVehicles.filter(v => v.online),
  totalStatistics: state => state.statistics
}

export default {
  namespaced: true,
  state,
  mutations,
  actions,
  getters
}
```

## 🔌 API服务开发

### 1. 服务层架构

```javascript
// services/base/BaseService.js
import axios from 'axios'
import { API_CONFIG } from '@/config/apiConfig'

class BaseService {
  constructor(baseURL = API_CONFIG.BASE_URL) {
    this.http = axios.create({
      baseURL,
      timeout: API_CONFIG.TIMEOUT
    })

    this.setupInterceptors()
  }

  setupInterceptors() {
    // 请求拦截器
    this.http.interceptors.request.use(
      config => {
        // 添加通用参数
        config.params = {
          ...config.params,
          _t: Date.now()
        }

        return config
      },
      error => Promise.reject(error)
    )

    // 响应拦截器
    this.http.interceptors.response.use(
      response => response.data,
      error => {
        // 统一错误处理
        const { response } = error

        if (response) {
          switch (response.status) {
            case 401:
              // 处理认证失败
              break
            case 403:
              // 处理权限不足
              break
            case 404:
              // 处理资源不存在
              break
            case 500:
              // 处理服务器错误
              break
          }
        }

        return Promise.reject(error)
      }
    )
  }

  async request(config) {
    try {
      return await this.http.request(config)
    } catch (error) {
      // 重试逻辑
      if (config.retry && error.response?.status >= 500) {
        return this.retryRequest(config)
      }
      throw error
    }
  }

  async retryRequest(config, retryCount = 0) {
    const maxRetries = config.retryAttempts || 3

    if (retryCount >= maxRetries) {
      throw new Error('请求重试次数已达上限')
    }

    // 延迟重试
    await new Promise(resolve =>
      setTimeout(resolve, 1000 * (retryCount + 1))
    )

    return this.request({
      ...config,
      retryCount: retryCount + 1
    })
  }
}

export default BaseService
```

### 2. 具体服务实现

```javascript
// services/VehicleService.js
import BaseService from './base/BaseService'

class VehicleService extends BaseService {
  constructor() {
    super(`${API_CONFIG.BASE_URL}/vehicle`)
  }

  // 获取车辆统计数据
  async getStatistics(params = {}) {
    return this.request({
      url: '/statistics',
      method: 'get',
      params,
      retry: true
    })
  }

  // 获取实时车辆数据
  async getRealTime() {
    return this.request({
      url: '/realtime',
      method: 'get'
    })
  }

  // 获取车辆历史数据
  async getHistory(params) {
    return this.request({
      url: '/history',
      method: 'get',
      params
    })
  }

  // 搜索车辆
  async searchVehicle(keyword) {
    return this.request({
      url: '/search',
      method: 'get',
      params: { keyword }
    })
  }

  // 获取车辆详情
  async getVehicleDetail(id) {
    return this.request({
      url: `/${id}`,
      method: 'get'
    })
  }
}

// 单例模式
export default new VehicleService()
```

## 🎯 路由管理

### 路由配置

```javascript
// router/index.js
import Vue from 'vue'
import VueRouter from 'vue-router'
import routes from './routes'

Vue.use(VueRouter)

const router = new VueRouter({
  mode: 'history',
  base: process.env.BASE_URL,
  routes,
  scrollBehavior(to, from, savedPosition) {
    if (savedPosition) {
      return savedPosition
    }
    return { x: 0, y: 0 }
  }
})

// 路由守卫
router.beforeEach((to, from, next) => {
  // 页面标题设置
  if (to.meta.title) {
    document.title = `${to.meta.title} - 智慧车行数据平台`
  }

  // 权限检查
  if (to.meta.requiresAuth && !isAuthenticated()) {
    next('/login')
    return
  }

  // 加载状态
  if (to.meta.loading !== false) {
    store.dispatch('setLoading', true)
  }

  next()
})

router.afterEach(() => {
  store.dispatch('setLoading', false)
})

export default router
```

### 路由定义

```javascript
// router/routes.js
export default [
  {
    path: '/',
    name: 'Home',
    component: () => import('@/views/index.vue'),
    meta: {
      title: '数据大屏',
      keepAlive: true
    }
  },
  {
    path: '/demo3d',
    name: 'Demo3D',
    component: () => import('@/views/Demo3D.vue'),
    meta: {
      title: '3D演示'
    }
  },
  {
    path: '/visitor-vip',
    name: 'VisitorVip',
    component: () => import('@/views/VisitorVip.vue'),
    meta: {
      title: '访客VIP分析'
    }
  },
  {
    path: '/channel-detail',
    name: 'ChannelDetail',
    component: () => import('@/views/ChannelDetail.vue'),
    meta: {
      title: '通道详情'
    }
  },
  {
    path: '/404',
    name: 'NotFound',
    component: () => import('@/views/404.vue'),
    meta: {
      title: '页面不存在'
    }
  },
  {
    path: '*',
    redirect: '/404'
  }
]
```

## 🧪 测试开发

### 1. 单元测试

```javascript
// tests/unit/components/VehicleChart.spec.js
import { shallowMount, createLocalVue } from '@vue/test-utils'
import VehicleChart from '@/components/VehicleChart.vue'
import echarts from 'echarts'

const localVue = createLocalVue()

jest.mock('echarts', () => ({
  init: jest.fn(() => ({
    setOption: jest.fn(),
    dispose: jest.fn(),
    on: jest.fn()
  }))
}))

describe('VehicleChart.vue', () => {
  let wrapper

  beforeEach(() => {
    wrapper = shallowMount(VehicleChart, {
      localVue,
      propsData: {
        data: [
          { time: '00:00', count: 10 },
          { time: '01:00', count: 20 }
        ]
      }
    })
  })

  afterEach(() => {
    wrapper.destroy()
  })

  it('renders correctly', () => {
    expect(wrapper.exists()).toBe(true)
  })

  it('receives correct props', () => {
    expect(wrapper.vm.data).toEqual([
      { time: '00:00', count: 10 },
      { time: '01:00', count: 20 }
    ])
  })

  it('computes chart options correctly', () => {
    const options = wrapper.vm.chartOptions
    expect(options.xAxis.data).toEqual(['00:00', '01:00'])
    expect(options.series[0].data).toEqual([10, 20])
  })

  it('emits chart-click event', () => {
    const mockParams = { name: 'test' }
    wrapper.vm.handleChartClick(mockParams)
    expect(wrapper.emitted()['chart-click']).toBeTruthy()
    expect(wrapper.emitted()['chart-click'][0]).toEqual([mockParams])
  })
})
```

### 2. E2E测试

```javascript
// tests/e2e/dashboard.spec.js
describe('Dashboard Page', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should display dashboard correctly', () => {
    cy.get('.dashboard-container').should('be.visible')
    cy.get('.chart-container').should('have.length.greaterThan', 0)
  })

  it('should filter data by time range', () => {
    cy.get('[data-testid="time-filter"]').click()
    cy.get('[data-testid="time-option-week"]').click()

    // 验证图表更新
    cy.get('.vehicle-chart').should('be.visible')
  })

  it('should show chart details on click', () => {
    cy.get('.chart-series').first().click()
    cy.get('.chart-detail-modal').should('be.visible')
  })
})
```

## 🔨 构建和部署

### 1. 构建配置

```javascript
// vue.config.js
const path = require('path')
const CompressionPlugin = require('compression-webpack-plugin')

module.exports = {
  // 基础配置
  publicPath: process.env.NODE_ENV === 'production' ? './' : '/',
  outputDir: 'dist',
  assetsDir: 'static',
  lintOnSave: process.env.NODE_ENV !== 'production',
  productionSourceMap: false,

  // 开发服务器配置
  devServer: {
    port: 6954,
    open: true,
    overlay: {
      warnings: false,
      errors: true
    },
    proxy: {
      '/api': {
        target: 'http://10.100.111.2:8675',
        changeOrigin: true,
        secure: false,
        pathRewrite: { '^/api': '' }
      }
    }
  },

  // Webpack配置
  configureWebpack: {
    resolve: {
      alias: {
        '@': path.resolve(__dirname, 'src'),
        'components': path.resolve(__dirname, 'src/components'),
        'utils': path.resolve(__dirname, 'src/utils')
      }
    },
    optimization: {
      splitChunks: {
        chunks: 'all',
        cacheGroups: {
          vendor: {
            name: 'chunk-vendors',
            test: /[\\/]node_modules[\\/]/,
            priority: 10,
            chunks: 'initial'
          },
          echarts: {
            name: 'chunk-echarts',
            test: /[\\/]node_modules[\\/]echarts[\\/]/,
            priority: 20,
            chunks: 'all'
          }
        }
      }
    },
    plugins: [
      new CompressionPlugin({
        algorithm: 'gzip',
        test: /\.(js|css|html|svg)$/,
        threshold: 8192,
        minRatio: 0.8
      })
    ]
  },

  // CSS配置
  css: {
    loaderOptions: {
      sass: {
        prependData: `@import "@/assets/scss/_variables.scss";`
      }
    }
  },

  // 链式配置
  chainWebpack: config => {
    // 生产环境优化
    if (process.env.NODE_ENV === 'production') {
      // 移除console
      config.optimization.minimizer('terser').tap(args => {
        args[0].terserOptions.compress.drop_console = true
        return args
      })
    }

    // 预加载
    config.plugin('preload').tap(options => {
      options[0].include = 'allChunks'
      return options
    })
  }
}
```

### 2. 环境变量配置

```bash
# .env.development
NODE_ENV=development
VUE_APP_API_BASE_URL=/api
VUE_APP_WS_URL=ws://localhost:6954
VUE_APP_DEBUG=true
VUE_APP_MOCK=false

# .env.production
NODE_ENV=production
VUE_APP_API_BASE_URL=http://10.100.111.2:8675
VUE_APP_WS_URL=ws://localhost:8675
VUE_APP_DEBUG=false
VUE_APP_MOCK=false
```

## 🐛 调试和问题排查

### 1. 开发调试

#### Vue DevTools
```javascript
// 在main.js中启用开发工具
if (process.env.NODE_ENV === 'development') {
  Vue.config.devtools = true
  Vue.config.performance = true
}
```

#### 控制台调试
```javascript
// 在组件中添加调试代码
export default {
  mounted() {
    // 调试组件实例
    console.log('Component mounted:', this.$options.name)

    // 调试数据
    console.log('Chart data:', this.chartData)

    // 调试DOM
    console.log('Chart container:', this.$refs.chartContainer)
  }
}
```

### 2. 常见问题排查

#### 图表不显示
1. 检查容器尺寸
2. 验证数据格式
3. 确认ECharts实例初始化
4. 检查配置项

#### 数据不更新
1. 检查watch监听
2. 验证数据响应性
3. 确认API请求状态
4. 查看控制台错误

#### 性能问题
1. 使用Chrome Performance分析
2. 检查组件重复渲染
3. 优化大数据量处理
4. 启用代码分割

## 📚 开发工具推荐

### IDE插件
- **Vetur**: Vue开发工具
- **ESLint**: 代码检查
- **Prettier**: 代码格式化
- **GitLens**: Git增强
- **Auto Rename Tag**: 标签重命名

### 浏览器插件
- **Vue DevTools**: Vue调试工具
- **React Developer Tools**: 调试React组件
- **Postman**: API测试
- **JSON Viewer**: JSON格式化

### 命令行工具
- **vue-cli-service**: Vue CLI服务
- **nodemon**: 开发服务器自动重启
- **concurrently**: 并行运行命令
- **cross-env**: 跨平台环境变量

---

本文档将根据项目发展持续更新，如有问题或建议，请联系开发团队。