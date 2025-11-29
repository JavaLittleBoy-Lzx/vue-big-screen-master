# 访客VIP车辆统计分析功能实现说明

## 功能概述

基于ACMS接口文档，实现了访客与VIP车辆进出统计分析功能，包括：
1. 实时车辆数据获取（在场车辆和离场车辆）
2. 统计分析接口
3. 前端数据服务更新
4. 弹窗详细统计显示

## 实现内容

### 1. 后端服务层 (AcmsVipService.java)

#### 新增接口方法：
- `getRealtimeCarInList()` - 获取在场车辆数据
- `getRealtimeCarOutList()` - 获取离场车辆数据

#### 对应ACMS接口：
- **GET_REALTIME_CAR_IN_LIST (3.5)** - 获取在场车辆接口
- **GET_REALTIME_CAR_OUT_LIST (3.6)** - 获取离场车辆接口

#### 请求参数：
```json
{
    "biz_content": {
        "page": "1",
        "size": "100",
        "car_license_number": "",
        "car_card_number": "",
        "record_type": "1"
    },
    "command": "GET_REALTIME_CAR_IN_LIST",
    "device_id": "设备ID",
    "message_id": "消息ID",
    "sign": "签名",
    "sign_type": "MD5",
    "charset": "UTF-8",
    "timestamp": "时间戳"
}
```

#### 响应数据结构：
- 车牌号、进场时间、离场时间
- 通道信息、车辆类型、颜色
- VIP类型、操作员信息等

### 2. 控制器层 (VisitorVipAnalysisController.java)

#### 主要接口：

##### 2.1 统计数据接口
- **POST** `/parking/analysis/visitor-vip/statistics`
- **GET** `/parking/analysis/visitor-vip/statistics`

**请求参数：**
```json
{
    "parkName": "东北林业大学",
    "timeRange": "daily|weekly|monthly|yearly",
    "startTime": "可选",
    "endTime": "可选"
}
```

**响应数据：**
```json
{
    "code": 200,
    "data": {
        "hourlyData": [
            {
                "hour": "08:00",
                "visitorEntry": 25,
                "visitorExit": 20,
                "vipEntry": 10,
                "vipExit": 8
            }
        ],
        "vipTypes": [
            {
                "name": "保障车辆(不值班24小时全部门)",
                "value": 45,
                "entry": 23,
                "exit": 22
            }
        ],
        "visitorTypes": [
            {
                "name": "基建处车辆",
                "value": 120,
                "entry": 60,
                "exit": 60
            }
        ],
        "summary": {
            "totalVisitorEntry": 1200,
            "totalVisitorExit": 1150,
            "totalVipEntry": 450,
            "totalVipExit": 420,
            "visitorNetFlow": 50,
            "vipNetFlow": 30
        },
        "dataSource": "ACMS|MOCK"
    }
}
```

##### 2.2 详细统计接口（用于弹窗）
- **POST** `/parking/analysis/visitor-vip/detail-statistics`

**请求参数：**
```json
{
    "parkName": "东北林业大学",
    "timePoint": "08:00",
    "timeRange": "daily"
}
```

**响应数据：**
```json
{
    "code": 200,
    "data": {
        "vipTypes": [
            {
                "name": "保障车辆(不值班24小时全部门)",
                "value": 45,
                "entry": 23,
                "exit": 22
            }
        ],
        "visitorTypes": [
            {
                "name": "基建处车辆",
                "value": 120,
                "entry": 60,
                "exit": 60
            }
        ],
        "timePoint": "08:00",
        "dataSource": "ACMS|MOCK"
    }
}
```

### 3. 前端服务层 (visitorVipDataService.js)

#### 更新内容：
- 调用真实后端接口替代模拟数据
- 支持时间范围参数
- 添加详细统计接口调用
- 保持向后兼容的模拟数据兜底

#### 主要方法：
- `getVisitorVipData(timeRange, parkName)` - 获取统计数据
- `getDetailStatistics(timePoint, parkName, timeRange)` - 获取详细统计
- `formatResponseData(data)` - 格式化响应数据
- `formatDetailResponseData(data)` - 格式化详细响应数据

### 4. 前端组件更新

#### 4.1 VisitorVipAnalysisChart.vue
- 更新数据获取方法调用真实后端接口
- 保持模拟数据兜底机制

#### 4.2 VisitorVipAnalysisModal.vue
- 更新弹窗数据获取调用详细统计接口
- 支持动态时间点统计

## VIP类型映射

基于ACMS接口返回的`enter_custom_vip_name`字段，映射到具体的VIP类型：

### VIP类型列表：
1. 保障车辆(不值班24小时全部门)
2. 二道岗可通行车辆
3. 教职工(地库车辆)
4. 保障车辆(值班48小时全部门)
5. 外聘私车值班(48小时)
6. 教职工离退37号楼居民
7. 超级VIP
8. 外聘教师(校内)
9. I公务车辆
10. 优秀校友
11. IV施工车辆(小)
12. IV施工车辆(大)
13. Ⅱ类保障车辆(小)
14. Ⅲ类居民车辆
15. Ⅲ类居民车辆(租)
16. Ⅱ类保障车辆(大)
17. D类离退私车
18. C类外聘私车
19. F类合作车辆
20. B2类教工私车
21. B1类专任教师私车
22. A类公车
23. 设备巡检

### 访客类型列表：
1. 基建处车辆
2. 走读学生
3. 非经营活动车辆
4. 兴林宾馆访客
5. 博物馆访客
6. 校友会访客
7. 体育馆自助访客
8. 经营性会议车辆
9. 个人访客车辆
10. 公务车访客车辆
11. 体育馆访客车辆

## 数据流程

1. **前端请求** → 调用`visitorVipDataService.getVisitorVipData()`
2. **后端处理** → `VisitorVipAnalysisController.getVisitorVipStatistics()`
3. **ACMS调用** → `AcmsVipService.getRealtimeCarInList()` 和 `getRealtimeCarOutList()`
4. **数据解析** → 解析ACMS响应，按时间分组统计
5. **类型分析** → 分析VIP类型和访客类型分布
6. **返回结果** → 返回格式化的统计数据
7. **前端展示** → 更新图表和弹窗显示

## 容错机制

1. **ACMS接口异常** → 自动降级到模拟数据
2. **网络请求失败** → 使用本地模拟数据
3. **数据解析错误** → 返回默认统计结果
4. **参数校验** → 严格的参数验证和错误提示

## 调用频率

- **实时数据刷新**：每30秒自动刷新
- **用户交互**：点击图表时实时获取详细统计
- **时间范围切换**：立即重新获取数据

## 配置说明

### 后端配置 (application.yml)
```yaml
acms:
  api:
    url: "ACMS接口地址"
    device_id: "设备ID"
    sign_type: "MD5"
    charset: "UTF-8"
```

### 前端配置 (.env)
```env
VUE_APP_API_BASE_URL=http://localhost:8080
```

## 测试说明

1. **正常流程测试**：确保ACMS接口正常时能获取真实数据
2. **异常流程测试**：ACMS接口异常时能降级到模拟数据
3. **参数测试**：不同时间范围和车场名称的参数测试
4. **性能测试**：大量数据时的响应时间测试

## 注意事项

1. 仅处理"东北林业大学"车场的数据
2. ACMS接口需要正确的签名和认证
3. 前端需要配置正确的API基础地址
4. 保持与现有组件的兼容性
5. 模拟数据作为兜底方案确保功能可用性
