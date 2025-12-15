# CORS跨域问题已修复 ✅

## 问题说明
违规详情弹窗无法加载数据，原因是：
- 前端运行在 `http://localhost:6954`
- 违规API在 `https://localhost:8543`
- 浏览器CORS策略阻止了跨域请求
- 错误信息：`403 Forbidden` + `No 'Access-Control-Allow-Origin' header`

## 已完成的修复

### 1. **配置Vue代理服务器** (vue.config.js)
添加了 `/violation-api` 代理配置：
```javascript
'/violation-api': {
  target: 'https://localhost:8543',
  changeOrigin: true,
  secure: false,
  pathRewrite: {
    '^/violation-api': ''
  }
}
```

### 2. **修改API请求地址** (center.vue)
将直接请求外部URL改为通过代理：
```javascript
// 修改前（会被CORS阻止）
const apiUrl = 'https://localhost:8543/parking/violations';

// 修改后（通过代理）
const apiUrl = '/violation-api/parking/violations';
```

## 🔴 重要：必须重启开发服务器

### 步骤1: 停止当前服务器
在运行 `npm run serve` 的命令行窗口中：
- 按 `Ctrl + C` 停止服务器
- 如果提示确认，输入 `Y` 并回车

### 步骤2: 重新启动服务器
```bash
npm run serve
```

### 步骤3: 验证修复
1. 打开浏览器控制台（F12）
2. 切换到 Console 标签
3. 点击"今日违规详情"按钮
4. 查看日志：
   - ✅ 应该看到 `🌐 [API请求] 违规数据（代理）: /violation-api/parking/violations`
   - ✅ 应该看到 `🔄 [代理请求]:` 和 `✅ [代理响应]:` （如果配置正确）
   - ✅ 不应该再有 CORS 错误

## 工作原理

### 请求流程：
```
前端页面 (localhost:6954)
    ↓
    请求: /violation-api/parking/violations
    ↓
Vue开发服务器代理
    ↓
    实际请求: https://localhost:8543/parking/violations
    ↓
    响应返回
    ↓
前端页面接收数据
```

### 为什么这样能解决CORS？
- 浏览器的CORS策略只针对**浏览器发起的跨域请求**
- 通过**服务器端代理**，浏览器实际上是向**同源的服务器**（localhost:6954）发请求
- 开发服务器再将请求转发到真实的API服务器
- 因为是服务器之间的通信，不受CORS限制

## 其他说明

### 代理配置详解
```javascript
{
  target: 'https://localhost:8543',  // 目标服务器
  changeOrigin: true,                          // 修改请求头的origin
  secure: false,                               // 接受自签名HTTPS证书
  logLevel: 'debug',                           // 输出调试日志
  pathRewrite: {                               // 路径重写
    '^/violation-api': ''                      // 去掉/violation-api前缀
  },
  timeout: 30000                               // 30秒超时
}
```

### 影响范围
- ✅ 违规详情弹窗
- ✅ 违规数据查询
- ✅ 违规筛选功能
- ✅ 其他使用该API的功能

### 不影响的功能
- ✅ 人脸进场/出场数据（使用本地API）
- ✅ 车辆进场/出场数据（使用本地API）
- ✅ 在场车辆数据（使用本地API）

## 生产环境部署注意事项

### 问题：生产环境没有Vue开发服务器
代理配置只在 `npm run serve` 开发模式下有效。生产环境需要其他解决方案。

### 解决方案选项：

#### 方案1: Nginx反向代理（推荐）
```nginx
location /violation-api/ {
    proxy_pass https://localhost:8543/;
    proxy_set_header Host $host;
    proxy_set_header X-Real-IP $remote_addr;
    proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
}
```

#### 方案2: 后端服务器转发
在后端添加一个转发接口：
```java
@GetMapping("/api/violations")
public ResponseEntity<?> getViolations(@RequestParam Map<String, String> params) {
    // 转发请求到 https://localhost:8543/parking/violations
    return restTemplate.getForEntity(externalUrl, Object.class, params);
}
```

#### 方案3: 配置外部API服务器的CORS
最直接的方法，在 `localhost:8543` 后端添加CORS响应头：
```java
response.setHeader("Access-Control-Allow-Origin", "*");
response.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
```

## 常见问题

### Q: 重启后还是报CORS错误？
A: 检查以下几点：
1. 确认浏览器完全刷新了页面（Ctrl+Shift+R）
2. 清除浏览器缓存
3. 检查控制台是否显示"代理请求"日志
4. 确认vue.config.js保存正确

### Q: 代理配置没有生效？
A: 可能原因：
1. 没有重启开发服务器
2. vue.config.js语法错误
3. 端口被占用

### Q: 其他接口也有CORS问题怎么办？
A: 按照同样的方式添加代理配置：
```javascript
proxy: {
  '/api': { ... },
  '/violation-api': { ... },
  '/your-new-api': {
    target: 'https://your-api-server.com',
    changeOrigin: true,
    pathRewrite: { '^/your-new-api': '' }
  }
}
```

## 验证清单

- [ ] 已停止当前开发服务器
- [ ] 已执行 `npm run serve` 重新启动
- [ ] 浏览器已完全刷新（Ctrl+Shift+R）
- [ ] 控制台显示"代理请求"日志
- [ ] 违规详情弹窗能正常显示数据
- [ ] 没有CORS错误信息

---

**修复完成时间**: 2025-11-25  
**修改文件**:
- `vue.config.js` - 添加代理配置
- `src/views/center.vue` - 修改API请求地址
