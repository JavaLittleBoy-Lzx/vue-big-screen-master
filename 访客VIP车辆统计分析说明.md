# 访客与VIP车辆进出统计分析

## 功能概述

这是一个专门用于统计访客和VIP车辆进出情况的数据可视化组件，支持多维度分析和实时数据展示。

## 主要特性

### 📊 整体展示
- **堆积柱状图**：直观展示访客和VIP的总体进出情况
- **时间维度**：支持今日、本周、本月、今年等时间范围选择
- **实时统计**：显示访客进场、访客出场、VIP进场、VIP出场的实时数据

### 🎯 详细分析
- **点击交互**：点击主图表可展开详细类型分析
- **VIP类型分布**：22种不同的VIP类型（企业、政府、酒店、商场、医院、学校、银行等）
- **访客类型分布**：13种不同的访客类型（临时、预约、商务、家庭、维修、配送等）
- **多图表组合**：饼图、柱状图、折线图等多种展示方式

### 🔄 实时功能
- **自动刷新**：每30秒自动更新数据
- **响应式设计**：适配不同屏幕尺寸
- **科技感UI**：现代化的深色主题设计

## 技术实现

### 后端数据源
- **API接口**：`getCarInList` 和 `getCarOutList`
- **VIP识别**：通过 `enterVipType` 字段（值为2表示VIP）
- **类型分类**：通过 `vehicleClassification` 字段区分访客类型

### 前端组件
- **图表库**：ECharts
- **数据服务**：`visitorVipDataService.js`
- **主组件**：`VisitorVipAnalysisChart.vue`

## 使用方法

### 1. 基本使用

```vue
<template>
  <div>
    <VisitorVipAnalysisChart />
  </div>
</template>

<script>
import VisitorVipAnalysisChart from '@/components/echart/VisitorVipAnalysisChart.vue'

export default {
  components: {
    VisitorVipAnalysisChart
  }
}
</script>
```

### 2. 访问演示页面

访问 `/visitor-vip` 路由查看完整演示：
```
http://localhost:6954/visitor-vip
```

### 3. API配置

在环境变量中配置后端API地址：
```javascript
// .env
VUE_APP_API_BASE_URL=http://localhost:6954
```

## 数据结构

### VIP类型映射
```javascript
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
}
```

### 访客类型映射
```javascript
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
}
```

## 图表类型说明

### 1. 堆积柱状图（主图表）
- **用途**：展示整体进出情况
- **X轴**：时间段（小时）
- **Y轴**：车辆数量
- **堆积**：访客进场、访客出场、VIP进场、VIP出场

### 2. 饼图
- **用途**：显示VIP和访客类型分布
- **特点**：环形设计，支持标签显示

### 3. 柱状图
- **用途**：各类型进出对比
- **特点**：双系列对比（进场vs出场）

### 4. 折线图
- **用途**：趋势分析和净流量
- **特点**：平滑曲线，面积填充

## 自定义配置

### 时间范围配置
```javascript
timeOptions: [
  { label: '今日', value: 'daily' },
  { label: '本周', value: 'weekly' },
  { label: '本月', value: 'monthly' },
  { label: '今年', value: 'yearly' }
]
```

### 自动刷新间隔
```javascript
// 默认30秒刷新一次
this.autoRefreshTimer = setInterval(() => {
  this.loadData()
}, 30000)
```

## 样式定制

组件使用SCSS编写样式，支持以下主题色彩：
- **主色调**：蓝色系（#3b82f6）
- **VIP色调**：橙色系（#f59e0b）
- **背景色**：深色渐变（#0f172a → #1e293b）
- **边框色**：蓝色边框（#1e40af）

## 注意事项

1. **数据格式**：确保后端返回的数据格式符合预期
2. **时间格式**：支持多种时间格式的自动解析
3. **性能优化**：大数据量时建议分页加载
4. **错误处理**：API失败时会自动使用模拟数据

## 扩展功能

### 可扩展的特性
- 添加更多时间维度（季度、自定义时间段）
- 支持数据导出功能
- 添加告警和异常检测
- 集成更多图表类型（热力图、散点图等）

### 集成建议
- 与现有的大屏系统集成
- 添加权限控制
- 支持多停车场数据
- 添加数据缓存机制

## 技术支持

如有问题或建议，请联系开发团队或查看相关文档。
