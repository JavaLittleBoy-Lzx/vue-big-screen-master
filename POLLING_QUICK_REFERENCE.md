# 🚀 前端轮询机制快速参考

## 📋 改动总结

**改造目标：** 将WebSocket推送改为HTTP API轮询

**改动文件：** 3个
- `vehicleDataService.js` - 添加API查询方法
- `centreLeft1.vue` - 移除WebSocket，添加轮询
- `center.vue` - 移除WebSocket，添加轮询

---

## 🔑 核心概念

### 轮询机制
```
初始化 → 加载50条记录 → 记录lastQueryTime
   ↓
启动定时器（每5秒）
   ↓
增量查询（只查询lastQueryTime之后的新记录）
   ↓
有新数据 → 显示 + 更新lastQueryTime
   ↓
继续轮询...
```

### 关键参数
```javascript
lastQueryTime: null      // 上次查询时间
pollingInterval: 5000    // 轮询间隔（5秒）
pollingTimer: null       // 定时器引用
```

---

## 📊 API接口

### 1. 获取最新记录
```javascript
GET /parking/getLatestVehicleRecords?limit=50&lastTime=2024-10-25 10:00:00
```

### 2. 增量查询
```javascript
// 只返回lastTime之后的记录
GET /parking/getLatestVehicleRecords?limit=20&lastTime=2024-10-25 10:00:00
```

---

## 🔧 核心代码

### vehicleDataService.js

```javascript
// 获取最新记录
async getVehicleRecords(limit = 50, lastTime = null) {
  const response = await this.http.get(`${this.apiPrefix}/getLatestVehicleRecords`, {
    params: { limit, lastTime }
  });
  return response.data.data?.records || [];
}

// 增量查询
async getIncrementalVehicleRecords(lastTime, limit = 20) {
  const response = await this.http.get(`${this.apiPrefix}/getLatestVehicleRecords`, {
    params: { limit, lastTime }
  });
  return response.data.data?.records || [];
}
```

### 视图组件（centreLeft1.vue / center.vue）

```javascript
// 1. 数据字段
data() {
  return {
    lastQueryTime: null,
    pollingInterval: 5000,
    pollingTimer: null
  };
}

// 2. 启动轮询
async mounted() {
  await this.initVehicleRecords();  // 初始化
  this.startVehiclePolling();       // 开始轮询
}

// 3. 清理定时器
beforeDestroy() {
  if (this.pollingTimer) {
    clearInterval(this.pollingTimer);
  }
}

// 4. 初始化
async initVehicleRecords() {
  const records = await vehicleDataService.getVehicleRecords(50);
  if (records && records.length > 0) {
    this.vehicleRecords = records.map(...);
    this.lastQueryTime = records[0].createTime;  // 记录时间
  }
}

// 5. 开始轮询
startVehiclePolling() {
  this.pollingTimer = setInterval(async () => {
    await this.pollLatestRecords();
  }, this.pollingInterval);
}

// 6. 轮询查询
async pollLatestRecords() {
  const newRecords = await vehicleDataService.getIncrementalVehicleRecords(
    this.lastQueryTime,
    20
  );
  
  if (newRecords && newRecords.length > 0) {
    newRecords.forEach(record => this.addPolledRecord(record));
    this.lastQueryTime = newRecords[0].createTime;  // 更新时间
  }
}

// 7. 添加记录
addPolledRecord(record) {
  const formattedRecord = {
    license: record.plateNumber,
    channel: record.channel,
    vipName: record.vipName || '普通用户',
    channelType: record.eventType === 'in' ? 'entry' : 'exit',
    action: record.status === '进场' ? '进场' : '离场',
    time: this.formatTime(record.time),
    isNew: true
  };
  
  this.vehicleRecords.unshift(formattedRecord);
  
  if (this.vehicleRecords.length > 50) {
    this.vehicleRecords = this.vehicleRecords.slice(0, 50);
  }
  
  setTimeout(() => formattedRecord.isNew = false, 3000);
}
```

---

## 🧪 测试步骤

### 1. 检查初始化
```
✅ 打开页面
✅ 控制台显示："🚗 初始化车辆记录..."
✅ 控制台显示："📅 初始化lastQueryTime: ..."
✅ 页面显示记录
```

### 2. 检查轮询
```
✅ 等待5秒
✅ 控制台显示："🔄 [轮询] 开始轮询车辆记录..."
✅ Network面板看到定期请求
✅ 请求URL包含lastTime参数
```

### 3. 检查新数据
```
✅ 后端添加新记录
✅ 最多5秒后前端自动显示
✅ 控制台显示："✅ [轮询] 查询到 X 条新记录"
✅ lastQueryTime自动更新
```

### 4. 检查错误处理
```
✅ 停止后端服务
✅ 控制台显示："❌ [轮询] 查询新记录失败"
✅ 重启后端后自动恢复
```

---

## 🐛 故障排查

### 问题：没有新数据显示

**检查清单：**
```javascript
// 1. 检查定时器
console.log('pollingTimer:', this.pollingTimer);  // 不为null

// 2. 检查lastQueryTime
console.log('lastQueryTime:', this.lastQueryTime);  // 有值

// 3. 手动触发轮询
this.pollLatestRecords();

// 4. 检查后端接口
// 浏览器访问：
// http://your-backend/parking/getLatestVehicleRecords?limit=20
```

### 问题：数据重复

**解决方案：**
```javascript
// 确保lastQueryTime正确更新
if (newRecords && newRecords.length > 0) {
  this.lastQueryTime = newRecords[0].createTime;
  console.log('✅ lastQueryTime已更新:', this.lastQueryTime);
}
```

### 问题：轮询过快

**解决方案：**
```javascript
// 增加轮询间隔
this.pollingInterval = 10000;  // 改为10秒
```

---

## 📈 性能指标

| 指标 | 目标值 | 说明 |
|-----|--------|------|
| 轮询间隔 | 5秒 | 可根据需求调整 |
| 单次响应 | < 200ms | 快速响应 |
| 记录上限 | 50条 | 避免内存占用过大 |
| 请求参数 | limit=20 | 每次最多查20条新记录 |

---

## ⚙️ 配置调整

### 调整轮询间隔
```javascript
// data中修改
pollingInterval: 3000  // 改为3秒
pollingInterval: 10000 // 改为10秒
```

### 调整记录数量
```javascript
// 初始加载
const records = await vehicleDataService.getVehicleRecords(100);  // 改为100条

// 增量查询
const newRecords = await vehicleDataService.getIncrementalVehicleRecords(
  this.lastQueryTime,
  50  // 改为50条
);

// 显示上限
if (this.vehicleRecords.length > 100) {  // 改为100条
  this.vehicleRecords = this.vehicleRecords.slice(0, 100);
}
```

---

## 📞 快速命令

### 开发调试
```javascript
// 在浏览器控制台执行

// 1. 查看当前状态
console.log('lastQueryTime:', this.$root.$children[0].lastQueryTime);
console.log('pollingTimer:', this.$root.$children[0].pollingTimer);

// 2. 手动触发轮询
this.$root.$children[0].pollLatestRecords();

// 3. 停止轮询
clearInterval(this.$root.$children[0].pollingTimer);

// 4. 重启轮询
this.$root.$children[0].startVehiclePolling();
```

---

## ✅ 验收标准

- [x] WebSocket代码已移除
- [x] 轮询机制正常工作
- [x] 增量查询避免重复
- [x] 页面实时性满足需求
- [x] 错误处理健全
- [x] 性能指标达标

---

## 📚 详细文档

完整文档请参考：`WEBSOCKET_TO_POLLING_MIGRATION.md`

---

**快速参考版本：** v1.0.0  
**创建日期：** 2024年10月25日

