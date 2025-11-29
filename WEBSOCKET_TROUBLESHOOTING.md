# WebSocket连接问题排查指南

## 🚨 当前问题

前端正在尝试连接到 `ws://localhost:8673/websocket/vehicle`，但连接失败。

## 🔍 问题分析

### 1. 连接地址问题
- **当前尝试**: `ws://localhost:8673/websocket/vehicle`
- **问题**: `localhost` 这个域名可能不存在或无法访问
- **端口**: 8673 可能不是正确的后端服务端口

### 2. 后端服务状态
- 需要确认后端服务是否正在运行
- 需要确认后端服务监听的端口
- 需要确认WebSocket端点是否正确配置

## 🛠️ 解决方案

### 方案1: 使用WebSocket测试页面

1. **访问测试页面**
   ```
   http://localhost:6954/websocket-test
   ```

2. **运行连接测试**
   - 点击"开始测试"按钮
   - 查看哪些地址可以连接
   - 使用可用的地址连接WebSocket

### 方案2: 手动配置正确的地址

1. **检查后端服务**
   ```bash
   # 检查8675端口是否被占用
   netstat -an | findstr :8675
   
   # 检查后端服务是否运行
   curl http://localhost:8675/parking/nefuData/testWebSocketPush?type=in&plateNumber=测试
   ```

2. **修改前端配置**
   在浏览器控制台中运行：
   ```javascript
   // 设置正确的WebSocket地址
   window.websocketService.runDiagnostics();
   ```

### 方案3: 使用环境变量

1. **创建环境配置文件**
   ```bash
   # 在vue-big-screen-master目录下创建.env.local文件
   echo "VUE_APP_WEBSOCKET_HOST=localhost:8080" > .env.local
   ```

2. **重启前端服务**
   ```bash
   npm run serve
   ```

## 🧪 测试步骤

### 1. 启动后端服务
```bash
cd boot
mvn spring-boot:run
```

### 2. 启动前端服务
```bash
cd vue-big-screen-master
npm run serve
```

### 3. 访问测试页面
```
http://localhost:6954/websocket-test
```

### 4. 运行连接测试
- 点击"开始测试"按钮
- 查看测试结果
- 如果有可用的地址，点击"连接WebSocket"

### 5. 测试WebSocket推送
```bash
   # 测试车辆进场推送
   curl -X POST "http://localhost:8675/parking/nefuData/testWebSocketPush?type=in&plateNumber=京A12345"

   # 测试车辆离场推送
   curl -X POST "http://localhost:8675/parking/nefuData/testWebSocketPush?type=out&plateNumber=京A12345"
```

## 🔧 常见问题解决

### 问题1: 所有地址都无法连接
**可能原因**:
- 后端服务未启动
- 后端服务端口不正确
- 防火墙阻止连接

**解决方法**:
1. 检查后端服务状态
2. 确认端口配置
3. 检查防火墙设置

### 问题2: 连接成功但收不到消息
**可能原因**:
- WebSocket端点路径错误
- 消息格式不匹配
- 后端推送逻辑问题

**解决方法**:
1. 检查WebSocket端点路径
2. 验证消息格式
3. 查看后端日志

### 问题3: 连接频繁断开
**可能原因**:
- 网络不稳定
- 后端服务重启
- 代理配置问题

**解决方法**:
1. 检查网络连接
2. 查看后端服务日志
3. 调整重连策略

## 📊 调试信息

### 浏览器控制台命令
```javascript
// 运行WebSocket诊断
window.testWebSocketConnection();

   // 手动测试连接
   window.websocketTest.testConnection('ws://localhost:8675/websocket/vehicle');

// 查看WebSocket服务状态
window.websocketService.isConnected;
```

### 后端日志关键词
```
🔌 新的WebSocket连接建立
🚗 推送车辆进场事件
📢 广播消息给 X 个连接
```

### 前端日志关键词
```
🔌 正在连接WebSocket...
✅ WebSocket连接成功
📨 收到WebSocket消息
```

## ✅ 验证清单

- [ ] 后端服务启动成功
- [ ] 后端服务监听8675端口
- [ ] WebSocket端点配置正确
- [ ] 前端可以访问测试页面
- [ ] 连接测试找到可用地址
- [ ] WebSocket连接建立成功
- [ ] 可以接收推送消息
- [ ] 界面显示实时数据

## 🎯 预期结果

修复后，系统应该能够：

1. **自动发现可用地址**: 前端自动测试多个可能的WebSocket地址
2. **智能连接**: 选择第一个可用的地址进行连接
3. **实时推送**: 后端数据变化时立即推送到前端
4. **界面更新**: 前端大屏实时显示新的进出场记录

现在可以使用测试页面来诊断和解决WebSocket连接问题了！
