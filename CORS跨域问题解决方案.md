# CORS跨域问题解决方案

## 问题描述

前端直接调用远程违规统计接口时，遇到CORS跨域错误：

```
Access to XMLHttpRequest at 'https://localhost:8543/parking/violations' 
from origin 'http://localhost:6954' has been blocked by CORS policy: 
No 'Access-Control-Allow-Origin' header is present on the requested resource.
```

## 原因分析

1. **浏览器同源策略**：浏览器出于安全考虑，限制跨域HTTP请求
2. **远程服务器配置**：`localhost:8543` 未设置允许跨域的响应头
3. **协议/域名/端口不同**：本地 `http://localhost:6954` 与远程 `https://localhost:8543` 不同源

## 解决方案：后端代理

### 核心思路
**由后端服务器代理调用远程接口**，避免浏览器跨域限制：

```
前端 → 本地后端 → 远程API
(同域)   (服务器间通信，无跨域限制)
```

### 实现步骤

#### 1. 后端添加代理接口

**文件**: `StatisticsController.java`

**新增接口**:
```java
@GetMapping("/violations")
public Result<Integer> getViolations(
        @RequestParam String startDate,
        @RequestParam String endDate) {
    
    // 调用远程API
    String url = "https://localhost:8543/parking/violations?page=1&size=1&community=东北林业大学&startDate={startDate}&endDate={endDate}";
    
    ResponseEntity<String> response = restTemplate.exchange(
        url, HttpMethod.GET, entity, String.class, startDate, endDate
    );
    
    // 解析并返回结果
    return Result.success(total);
}
```

#### 2. 配置RestTemplate

**文件**: `WebConfig.java`

**添加Bean**:
```java
@Bean
public RestTemplate restTemplate() {
    SimpleClientHttpRequestFactory factory = new SimpleClientHttpRequestFactory();
    factory.setConnectTimeout(10000);  // 连接超时10秒
    factory.setReadTimeout(30000);     // 读取超时30秒
    return new RestTemplate(factory);
}
```

#### 3. 前端调用本地接口

**文件**: `center.vue`

**修改前**:
```javascript
// ❌ 直接调用远程接口，会被CORS阻止
const response = await axios.get('https://localhost:8543/parking/violations', {
  params: { ... }
});
```

**修改后**:
```javascript
// ✅ 调用本地后端代理接口
const response = await axios.get('http://10.100.111.2:8675/parking/statistics/violations', {
  params: { startDate, endDate }
});
```

## 技术细节

### 1. RestTemplate配置

- **连接超时**: 10秒（建立连接的最长时间）
- **读取超时**: 30秒（等待响应数据的最长时间）
- **工厂类型**: `SimpleClientHttpRequestFactory`（Spring默认实现）

### 2. 响应解析

使用FastJSON解析远程API返回的JSON：

```java
JSONObject jsonObject = JSONObject.parseObject(body);
JSONObject data = jsonObject.getJSONObject("data");
Integer total = data.getInteger("total");
```

### 3. 错误处理

- **网络异常**: 捕获异常并返回0，不影响其他数据加载
- **非200状态**: 返回0
- **数据解析失败**: 返回0

```java
catch (Exception e) {
    log.error("❌ [违规统计代理] 调用失败", e);
    return Result.success(0); // 失败时返回0
}
```

## 优势对比

### 方案对比

| 方案 | 优点 | 缺点 | 适用场景 |
|------|------|------|----------|
| **后端代理** ✅ | 彻底解决跨域<br>统一管理<br>可缓存优化 | 需要后端支持 | 生产环境推荐 |
| 前端CORS配置 | 简单快速 | 需远程服务器配置<br>安全性低 | 本地开发测试 |
| JSONP | 无需服务器配置 | 只支持GET<br>安全风险 | 已过时 |
| 浏览器插件 | 开发调试方便 | 仅本地有效 | 仅开发环境 |

### 后端代理优势

1. ✅ **彻底解决跨域**: 服务器间通信无跨域限制
2. ✅ **统一管理**: 集中管理远程API调用
3. ✅ **安全性高**: 隐藏真实API地址和参数
4. ✅ **可扩展**: 可添加缓存、重试、降级等逻辑
5. ✅ **日志记录**: 完整的请求/响应日志
6. ✅ **错误处理**: 统一的异常处理机制

## 接口调用流程

```
┌─────────┐      HTTP      ┌──────────────┐    HTTPS    ┌─────────────────┐
│  前端   │ ────────────> │ 本地后端代理 │ ─────────> │ 远程违规API     │
│ Vue.js  │  localhost    │ Spring Boot  │  互联网    │ xuerparking.cn  │
└─────────┘  无跨域限制    └──────────────┘  无跨域限制  └─────────────────┘
    ↑                            │                              │
    │         Result<Integer>    │         JSON Response        │
    └────────────────────────────┴──────────────────────────────┘
                统计结果           解析并包装
```

## 测试验证

### 1. 检查后端接口

```bash
curl "http://10.100.111.2:8675/parking/statistics/violations?startDate=2025-11-18%2000:00:00&endDate=2025-11-18%2023:59:59"
```

**预期响应**:
```json
{
  "code": "0",
  "msg": "success",
  "data": 3
}
```

### 2. 查看后端日志

```
📊 [违规统计代理] 开始查询: 2025-11-18 00:00:00 - 2025-11-18 23:59:59
✅ [违规统计代理] 查询完成: 3 起
```

### 3. 检查前端控制台

- ❌ 不再出现CORS错误
- ✅ 成功获取违规统计数据
- ✅ 正常显示在页面上

## 注意事项

### 1. 超时配置

根据远程API响应时间调整：
```java
factory.setConnectTimeout(10000);  // 可增加到15000
factory.setReadTimeout(30000);     // 可增加到60000
```

### 2. SSL证书问题

如果远程API使用自签名证书，可能需要配置信任：
```java
// 不推荐生产环境使用
// 仅开发测试时可临时忽略SSL验证
```

### 3. 参数编码

确保中文参数正确编码：
```java
community=东北林业大学
// URL编码后: community=%E4%B8%9C%E5%8C%97%E6%9E%97%E4%B8%9A%E5%A4%A7%E5%AD%A6
```

### 4. 错误重试

可在代理层添加重试逻辑：
```java
@Retryable(maxAttempts = 3, backoff = @Backoff(delay = 1000))
public Result<Integer> getViolations(...) {
    // 调用远程API
}
```

## 性能优化建议

### 1. 结果缓存

```java
@Cacheable(value = "violations", key = "#startDate + '-' + #endDate")
public Result<Integer> getViolations(String startDate, String endDate) {
    // 缓存5分钟，减少远程调用
}
```

### 2. 异步调用

对于非关键数据，可以异步加载：
```java
@Async
public CompletableFuture<Integer> getViolationsAsync(...) {
    // 异步调用，不阻塞主流程
}
```

### 3. 降级处理

当远程API不可用时，返回默认值：
```java
catch (Exception e) {
    log.error("远程API调用失败，使用降级数据");
    return Result.success(0); // 或返回缓存的历史数据
}
```

## 其他跨域方案对比

### 方案1: 配置远程服务器CORS

**优点**: 前端直连，无需代理  
**缺点**: 需要远程服务器管理员配置  
**实施**: 需要在 `localhost:8543` 添加响应头

```java
// 远程服务器需要添加
response.setHeader("Access-Control-Allow-Origin", "*");
```

### 方案2: Nginx反向代理

**优点**: 集中管理多个API  
**缺点**: 需要额外的Nginx配置  
**实施**: 配置Nginx代理规则

```nginx
location /api/violations {
    proxy_pass https://localhost:8543/parking/violations;
}
```

### 方案3: 开发环境代理

**优点**: 开发快速  
**缺点**: 仅限开发环境  
**实施**: Vue配置文件

```javascript
// vue.config.js
devServer: {
  proxy: {
    '/api': {
      target: 'https://localhost:8543',
      changeOrigin: true
    }
  }
}
```

## 总结

✅ **推荐方案**: 后端代理（已实现）  
✅ **优势**: 彻底解决跨域，生产环境可用  
✅ **实现简单**: 只需添加一个接口和Bean配置  
✅ **扩展性强**: 可添加缓存、重试、降级等功能  

---

**更新时间**: 2025-11-18  
**解决状态**: ✅ 已解决
