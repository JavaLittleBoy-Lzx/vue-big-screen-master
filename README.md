# 东北林业大学智慧车行数据可视化平台

[![Vue](https://img.shields.io/badge/Vue-2.7.16-green.svg)](https://vuejs.org/)
[![ECharts](https://img.shields.io/badge/ECharts-4.9.0-blue.svg)](https://echarts.apache.org/)
[![License](https://img.shields.io/badge/License-Private-red.svg)](LICENSE)

## 📖 项目简介

东北林业大学智慧车行数据可视化平台是一个基于Vue.js和ECharts开发的企业级大屏数据展示系统。该平台专为停车场管理而设计，提供实时数据监控、多维度数据分析和专业的可视化展示功能。

### 🎯 核心功能

- **实时数据监控** - 车流量、车位使用率、异常情况实时监控
- **多维度分析** - 时间、通道、车辆类型等多维度数据分析
- **专业可视化** - 30+种专业图表类型，包括饼图、柱状图、雷达图等
- **交互式展示** - 支持图表点击、数据钻取、弹窗详情查看
- **自动刷新** - 30秒自动刷新数据，支持WebSocket实时推送
- **响应式设计** - 专为1920x1080大屏优化，支持多种屏幕尺寸

## 🛠️ 技术栈

### 前端技术
- **Vue 2.7.16** - 渐进式JavaScript框架
- **ECharts 4.9.0** - 企业级图表库
- **@antv/g2plot 2.4.35** - 专业统计图表库
- **@jiaminghi/data-view 2.10.0** - 大屏UI组件库
- **Vue Router 3.6.5** - 官方路由管理
- **Vuex 3.6.2** - 状态管理模式
- **Axios 1.12.2** - HTTP客户端
- **SCSS 1.93.2** - CSS预处理器

### 开发工具
- **Vue CLI 4.5.19** - Vue开发标准工具
- **Webpack** - 模块打包工具
- **Babel** - JavaScript编译器

## 🚀 快速开始

### 环境要求
- Node.js >= 14.0.0
- npm >= 6.0.0

### 安装依赖
```bash
npm install
```

### 开发模式
```bash
npm run serve
```
访问地址：http://localhost:6954

### 生产构建
```bash
npm run build
```

### 代码检查
```bash
npm run lint
```

## 📁 项目结构

```
vue-big-screen-master/
├── public/                 # 公共资源
├── src/
│   ├── assets/            # 静态资源
│   │   ├── scss/         # SCSS样式文件
│   │   └── images/       # 图片资源
│   ├── components/        # 可复用组件
│   │   ├── echart/       # 图表组件
│   │   └── business/     # 业务组件
│   ├── services/          # 业务服务层
│   │   ├── parkingDataService.js
│   │   ├── vehicleFlowDataService.js
│   │   └── visitorVipDataService.js
│   ├── views/             # 页面组件
│   │   ├── index.vue     # 主大屏页面
│   │   └── ...           # 其他页面
│   ├── config/            # 配置文件
│   ├── utils/             # 工具函数
│   ├── store/             # 状态管理
│   ├── router/            # 路由配置
│   └── main.js            # 应用入口
├── docs/                  # 项目文档
└── dist/                  # 构建输出
```

## 📊 功能模块

### 实时监控
- 车流量实时统计
- 车位使用率监控
- 异常情况预警（黑名单、欠费、超时停车）
- 通道状态监控

### 数据分析
- **时间维度**：今日/本周/本月/本年度数据切换
- **通道维度**：进口/出口/全部通道筛选
- **车辆类型**：油车/新能源车分类统计
- **停车时长**：不同时长段统计分析

### 可视化图表
- 🥧 饼图 - 通道流量分布、访客分类占比
- 📊 柱状图 - 车辆流量趋势、收费时长分析
- 📈 堆叠图 - 访客VIP进出统计分析
- 📉 折线图 - 24小时车流量趋势
- 🎯 雷达图 - 通道性能对比分析
- 🔥 热力图 - 车辆分布热力图
- ⚡ 仪表盘 - 通道利用率展示
- 🌟 3D图表 - 词云、飞线图等特效图表

## 🔧 配置说明

### API配置
```javascript
// config/apiConfig.js
const API_BASE_URL = process.env.NODE_ENV === 'development'
  ? '/api'
  : 'http://localhost:8675';

const API_PREFIX = '/parking/nefuData';
const TIMEOUT = 10000; // 10秒超时
```

### 代理配置
```javascript
// vue.config.js
module.exports = {
  devServer: {
    port: 6954,
    proxy: {
      '/api': {
        target: 'http://localhost:8675',
        changeOrigin: true,
        secure: false,
        pathRewrite: { '^/api': '' }
      }
    }
  }
}
```

## 🌐 主要页面

| 路由 | 页面描述 | 功能特性 |
|------|----------|----------|
| `/` | 主大屏页面 | 核心数据展示，完整功能 |
| `/demo3d` | 3D演示页面 | 3D图表特效展示 |
| `/visitor-vip` | 访客VIP分析 | 访客和VIP车辆数据分析 |
| `/channel-detail` | 通道详情 | 通道详细统计信息 |
| `/face-visitor` | 人脸访客 | 人脸识别访客管理 |
| `/websocket-test` | WebSocket测试 | 实时数据连接测试 |

## 📱 交互功能

### 筛选器
- **时间筛选器**：支持今日/本周/本月/本年度切换
- **通道选择器**：支持进口/出口/全部通道筛选

### 图表交互
- **点击事件**：图表点击触发详情弹窗
- **图例切换**：支持图例显示/隐藏
- **数据钻取**：从概览到详细的数据钻取

### 自动刷新
- **定时刷新**：30秒自动刷新数据
- **WebSocket**：支持实时数据推送
- **手动刷新**：支持手动刷新按钮

## 🎨 主题与样式

### 设计特点
- **深色主题**：专业的深色主题配色方案
- **大屏优化**：专为1920x1080分辨率设计
- **响应式**：支持不同屏幕尺寸适配
- **动画效果**：丰富的图表和界面动画

### 配色方案
```scss
// 主色调
$primary-color: #1890ff;
$background-color: #0b132a;
$text-color: #ffffff;
$border-color: #1e3a5f;

// 图表配色
$chart-colors: (
  #1890ff, #2fc25b, #facc14,
  #f04864, #8543e0, #13c2c2
);
```

## 🚀 部署指南

### 开发环境
```bash
# 安装依赖
npm install

# 启动开发服务器
npm run serve

# 访问应用
http://localhost:6954
```

### 生产环境
```bash
# 构建生产版本
npm run build

# 部署dist目录到Web服务器
# 配置Nginx/Apache
# 设置HTTPS（推荐）
```

### 服务器要求
- Web服务器：Nginx/Apache
- 静态文件托管
- HTTPS支持（推荐）
- CORS配置（如需要）

## 📖 文档目录

- [技术文档](docs/TECHNICAL.md) - 详细技术架构和实现
- [用户手册](docs/USER_GUIDE.md) - 功能使用说明
- [开发文档](docs/DEVELOPMENT.md) - 开发环境和规范
- [部署文档](docs/DEPLOYMENT.md) - 部署配置和优化
- [变更日志](CHANGELOG.md) - 版本更新记录

## 🤝 参考链接

### 相关文档
- [DataV 官方文档](http://datav.jiaminghi.com/guide/)
- [ECharts 实例](https://www.echartsjs.com/examples/zh/index.html)
- [ECharts 官方文档](https://www.echartsjs.com/zh/option.html#title)
- [Vue 官方文档](https://cn.vuejs.org/v2/guide/instance.html)

### 项目演示
项目截图（展示动态）
![](https://images.gitee.com/uploads/images/2020/0411/221307_0f8af2e7_4964818.gif)

## 🐛 问题反馈

如果您在使用过程中遇到问题，请：

1. 查看[常见问题解答](docs/USER_GUIDE.md#常见问题)
2. 检查[已知问题](docs/DEPLOYMENT.md#已知问题)
3. 提交Issue描述问题
4. 提供详细的错误信息和复现步骤

## 📄 许可证

本项目为私有项目，版权归属东北林业大学智慧车行项目组。

## 👥 开发团队

- **项目负责** - 智慧车行项目组
- **技术架构** - 前端开发团队
- **UI设计** - 界面设计团队
- **数据支持** - 后端开发团队

---

**注意**：本项目为企业内部使用系统，请遵守相关使用规范和保密要求。
"# vue-big-screen-master"  
