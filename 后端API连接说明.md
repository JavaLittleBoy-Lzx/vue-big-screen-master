# 🔗 后端API连接说明

## ✅ 已完成配置

登录页面已成功连接到后端API，不再使用模拟数据。

---

## 📡 API配置信息

### 后端地址
```javascript
baseURL: 'http://10.100.111.2:8675'
```

### 登录接口
```
POST http://10.100.111.2:8675/api/auth/login
```

### 请求格式
```json
{
  "username": "admin",
  "password": "123456"
}
```

### 响应格式（成功）
```json
{
  "code": "0",
  "msg": "登录成功",
  "data": {
    "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
    "user": {
      "id": 1,
      "username": "admin",
      "name": "管理员",
      "role": "admin",
      ...
    }
  }
}
```

### 响应格式（失败）
```json
{
  "code": "401",
  "msg": "用户名或密码错误"
}
```

---

## 🔧 前端配置

### 1. API服务配置
**文件**：`src/services/authService.js`

```javascript
// 创建axios实例
const authRequest = axios.create({
  baseURL: 'http://10.100.111.2:8675',  // 后端地址
  timeout: 10000,                     // 10秒超时
  headers: {
    'Content-Type': 'application/json'
  }
})

// 请求拦截器 - 添加Token
authRequest.interceptors.request.use(
  config => {
    const token = getToken()
    if (token) {
      config.headers['Authorization'] = `Bearer ${token}`
    }
    return config
  }
)

// 响应拦截器 - 处理错误
authRequest.interceptors.response.use(
  response => response.data,
  error => {
    // 统一错误处理
    if (error.response) {
      switch (error.response.status) {
        case 401: console.warn('未授权'); break
        case 403: console.warn('禁止访问'); break
        case 500: console.error('服务器错误'); break
      }
    }
    return Promise.reject(error)
  }
)
```

### 2. 登录API调用
```javascript
export async function loginAPI(credentials) {
  try {
    console.log('📝 发送登录请求:', credentials.username)
    console.log('📡 后端地址:', authRequest.defaults.baseURL)
    
    // 调用真实的后端API
    const response = await authRequest.post('/api/auth/login', credentials)
    
    console.log('✅ 登录响应:', response)
    return response
    
  } catch (error) {
    console.error('❌ 登录失败:', error)
    
    // 返回友好的错误信息
    if (error.response) {
      return {
        code: error.response.status,
        msg: error.response.data?.msg || '登录失败'
      }
    } else if (error.request) {
      return {
        code: -1,
        msg: '无法连接到服务器，请检查网络或后端是否启动'
      }
    }
  }
}
```

---

## 🎯 后端接口

### AuthController.java
**路径**：`/api/auth`

#### 1. 登录接口
```java
@PostMapping("/login")
public Result<LoginResponse> login(
    @Valid @RequestBody LoginRequest loginRequest,
    HttpServletRequest request) {
    
    log.info("收到登录请求: username={}", loginRequest.getUsername());
    
    // 获取客户端IP
    String ipAddress = getClientIpAddress(request);
    
    // 执行登录
    LoginResponse response = userService.login(loginRequest, ipAddress);
    
    return Result.success(response);
}
```

#### 2. 登出接口
```java
@PostMapping("/logout")
public Result<String> logout(HttpServletRequest request) {
    String token = getTokenFromRequest(request);
    log.info("用户登出");
    return Result.success("登出成功");
}
```

#### 3. 刷新Token
```java
@PostMapping("/refresh")
public Result<Map<String, String>> refreshToken(HttpServletRequest request) {
    String oldToken = getTokenFromRequest(request);
    String newToken = userService.refreshToken(oldToken);
    return Result.success(Map.of("token", newToken));
}
```

#### 4. 验证Token
```java
@GetMapping("/validate")
public Result<Map<String, Object>> validateToken(HttpServletRequest request) {
    String token = getTokenFromRequest(request);
    boolean isValid = userService.validateToken(token);
    return Result.success(Map.of("valid", isValid));
}
```

#### 5. 获取用户信息
```java
@GetMapping("/userinfo")
public Result<Map<String, Object>> getUserInfo(HttpServletRequest request) {
    String token = getTokenFromRequest(request);
    // 从Token获取用户信息
    return Result.success(userInfo);
}
```

---

## 🔄 登录流程

### 完整流程图
```
用户操作
  ↓
输入用户名/密码/验证码
  ↓
点击登录按钮
  ↓
前端验证
  ├─ 检查非空
  ├─ 检查格式
  └─ 检查验证码
  ↓
调用 loginAPI()
  ↓
发送 POST /api/auth/login
  {
    username: "admin",
    password: "123456"
  }
  ↓
后端 AuthController
  ↓
UserService.login()
  ├─ 查询用户
  ├─ 验证密码
  ├─ 生成Token
  └─ 记录登录日志
  ↓
返回响应
  {
    code: "0",
    msg: "登录成功",
    data: {
      token: "...",
      user: {...}
    }
  }
  ↓
前端处理
  ├─ 保存Token
  ├─ 保存用户信息
  └─ 跳转到首页
  ↓
登录成功 ✓
```

---

## 🧪 测试步骤

### 1. 启动后端服务
```bash
# 进入后端目录
cd d:\nefu-edu-datav\boot-new-20251112

# 运行启动脚本
.\启动后端.bat

# 或使用Maven命令
mvn spring-boot:run
```

**验证**：访问 `http://10.100.111.2:8675` 确认后端已启动

### 2. 启动前端服务
```bash
# 进入前端目录
cd d:\nefu-edu-datav\vue-big-screen-master

# 运行启动脚本
.\启动前端.bat

# 或使用npm命令
npm run serve
```

**验证**：访问 `http://localhost:8080` 打开登录页面

### 3. 测试登录功能

#### 测试账号
```
用户名：admin
密码：123456
验证码：(输入页面显示的验证码)
```

#### 预期结果
1. **成功场景**：
   - 显示"登录成功！正在跳转..."
   - 1秒后跳转到首页
   - 控制台输出：
     ```
     📝 发送登录请求: admin
     📡 后端地址: http://10.100.111.2:8675
     ✅ 登录响应: {code: "0", msg: "登录成功", data: {...}}
     ```

2. **失败场景**：
   - 用户名或密码错误：显示"用户名或密码错误"
   - 验证码错误：显示"验证码错误"
   - 后端未启动：显示"无法连接到服务器"
   - 控制台输出：
     ```
     ❌ 登录失败: ...
     ```

---

## 🐛 故障排查

### 问题1：无法连接到服务器
**错误信息**：`无法连接到服务器，请检查网络或后端是否启动`

**解决方法**：
1. 检查后端是否启动：访问 `http://10.100.111.2:8675`
2. 检查端口占用：`netstat -ano | findstr 8675`
3. 查看后端日志：检查控制台输出
4. 防火墙设置：确保8675端口未被阻止

### 问题2：401未授权
**错误信息**：`用户名或密码错误`

**解决方法**：
1. 确认测试账号存在于数据库
2. 检查密码是否正确
3. 查看后端日志确认收到请求
4. 确认数据库连接正常

### 问题3：CORS跨域错误
**错误信息**：`Access to XMLHttpRequest ... has been blocked by CORS policy`

**解决方法**：
后端添加CORS配置（可能已配置）：
```java
@Configuration
public class CorsConfig {
    @Bean
    public CorsFilter corsFilter() {
        CorsConfiguration config = new CorsConfiguration();
        config.addAllowedOrigin("http://localhost:8080");
        config.addAllowedMethod("*");
        config.addAllowedHeader("*");
        config.setAllowCredentials(true);
        
        UrlBasedCorsConfigurationSource source = new UrlBasedCorsConfigurationSource();
        source.registerCorsConfiguration("/**", config);
        
        return new CorsFilter(source);
    }
}
```

### 问题4：Token存储失败
**错误信息**：登录成功但刷新后又回到登录页

**解决方法**：
1. 检查浏览器LocalStorage
2. 打开开发者工具 → Application → Local Storage
3. 确认 `parking_token` 和 `parking_user` 已保存
4. 检查 `src/utils/auth.js` 的实现

---

## 📁 相关文件

### 前端文件
- `src/services/authService.js` - API服务配置
- `src/views/Login.vue` - 登录页面组件
- `src/utils/auth.js` - Token和用户信息管理

### 后端文件
- `AuthController.java` - 认证控制器
- `UserService.java` - 用户服务
- `LoginRequest.java` - 登录请求DTO
- `LoginResponse.java` - 登录响应DTO

---

## 🔒 安全说明

### Token机制
1. **生成**：后端登录成功后生成JWT Token
2. **存储**：前端保存到LocalStorage
3. **使用**：每次请求自动添加到Authorization头
4. **验证**：后端拦截器验证Token有效性
5. **刷新**：Token过期前可刷新获取新Token

### 密码处理
1. **传输**：HTTPS加密传输（生产环境）
2. **存储**：后端使用BCrypt加密存储
3. **验证**：对比加密后的密码
4. **更改**：需要验证旧密码

---

## 📊 监控和日志

### 前端日志
登录过程中会在控制台输出：
```
📝 发送登录请求: admin
📡 后端地址: http://10.100.111.2:8675
✅ 登录响应: {...}
```

### 后端日志
```
收到登录请求: username=admin
用户登录成功: username=admin, ip=127.0.0.1
生成Token: username=admin
```

### 调试建议
1. 打开浏览器开发者工具
2. 切换到 Network 标签
3. 筛选 XHR 请求
4. 查看 `/api/auth/login` 请求详情

---

## ✅ 验证清单

- [ ] 后端服务已启动（端口8675）
- [ ] 前端服务已启动（端口8080）
- [ ] 数据库连接正常
- [ ] 测试账号存在于数据库
- [ ] 登录接口路径正确（/api/auth/login）
- [ ] 可以成功登录并跳转
- [ ] Token已保存到LocalStorage
- [ ] 刷新页面保持登录状态

---

**后端API连接完成！现在使用真实的后端服务进行登录认证！** 🎉

启动测试：
1. ✅ 启动后端：`.\启动后端.bat`
2. ✅ 启动前端：`.\启动前端.bat`
3. ✅ 访问登录页：`http://localhost:8080/login`
4. ✅ 测试登录：用户名 `admin` 密码 `123456`
