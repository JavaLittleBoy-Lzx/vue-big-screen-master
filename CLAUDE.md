# CLAUDE.md

本文件为 Claude Code 在此代码库中工作时提供指导。

## 项目概述

东北林业大学智慧车行数据可视化平台 - 基于 Vue 2.7 和 ECharts 构建的企业级大屏数据展示系统，用于停车场管理。

## 常用命令

```bash
cd vue-big-screen-master

npm install          # 安装依赖
npm run serve        # 启动开发服务器，端口 6954
npm run build        # 生产环境构建，输出到 dist/
npm run lint         # ESLint 代码检查
```

## 架构

### 技术栈
- **Vue 2.7.16** + Vue Router 3.6.5 + Vuex 3.6.2
- **ECharts 4.9.0** 图表库
- **@jiaminghi/data-view 2.10.0** 大屏 UI 组件库
- **@antv/g2plot 2.4.35** 统计图表库
- **Element UI 2.15.14** 表单/弹窗组件
- **SCSS** 样式预处理

### 目录结构
```
src/
├── assets/scss/        # 全局样式、变量 (_variables.scss)
├── components/echart/  # 可复用的 ECharts 组件 (子目录: bottom/, center/, visitor/)
├── config/              # API 和停车场配置
├── router/index.js     # Vue Router，含鉴权守卫
├── services/           # 数据服务层 (parkingDataService.js, websocketService.js 等)
├── store/index.js       # Vuex 状态管理 (目前较轻量，主要使用组件内局部状态)
├── utils/              # 工具函数 (auth.js, corsHandler.js, websocketTest.js)
└── views/              # 页面组件 (index.vue 为主大屏页面)
```

### 服务层
`parkingDataService.js` 是主要的数据服务，包含真实的 API 调用（使用 fetch）和完整的模拟数据降级方案。当后端不可用时，会优雅地切换到模拟数据。

### 关键路由
| 路由 | 页面 | 鉴权 |
|------|------|------|
| `/` | 主大屏页面 (index.vue) | 需要登录 |
| `/demo3d` | 3D 可视化演示 | 需要登录 |
| `/visitor-vip` | 访客 VIP 分析 | 需要登录 |
| `/channel-detail` | 通道统计详情 | 需要登录 |
| `/face-visitor` | 人脸访客管理 | 需要登录 |
| `/websocket-test` | WebSocket 测试 | 需要登录 |
| `/user-profile` | 用户个人信息 | 需要登录 |
| `/user-management` | 用户管理 | 仅管理员 |
| `/login` | 登录页面 | 无需登录 |

### API 代理配置
开发服务器代理：
- `/api` → `http://localhost:8675` (后端服务)
- `/violation-api` → `https://www.xuerparking.cn:8543` (违规管理服务)

## 开发注意事项

- 开发服务器运行在 **端口 6954**（在 vue.config.js 中配置）
- 模拟数据在 `parkingDataService.js` 中实时生成，当 API 调用失败时自动降级
- 认证通过 localStorage 处理，使用 `isLoggedIn()` 和 `getUserInfo()` 工具函数
- Vue Router 使用 `history` 模式，通过全局 `beforeEach` 守卫实现鉴权
- ECharts 组件遵循在 `mounted()` 中调用 `initChart()`，窗口 resize 时调用 `chart.resize()` 的模式
- SCSS 变量通过 `vue.config.js` 的 loaderOptions 全局注入

## 项目约定

### 代码风格
- 回复和代码注释使用**中文**
- 优先修改现有文件，而非创建新文件
- 不写无意义的注释，变量名和方法名自解释
- 修改前先读文件，Edit/Write 前先 Read

### 任务处理
- 简单问题直接回答，不需要规划
- 多步骤任务创建 Todo 逐个完成
- 完成后验证（编译、测试）再报告
- 涉及数据库/后端修改时，需要用户确认后端已重启

### 省 Token 技巧
- 简单查询/修改用 Haiku 模型，复杂架构设计用 Opus
- 读文件时指定行范围（offset + limit），避免全文读取
- 修改前明确文件路径和行号，减少试错
- 任务完成后开新对话，避免上下文膨胀
