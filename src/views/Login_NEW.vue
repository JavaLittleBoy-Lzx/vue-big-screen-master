<template>
  <div class="login-container">
    <!-- 背景图 -->
    <div class="page-bg"></div>

    <!-- 页面标题 -->
    <div class="page-title">
      <span>东北林业大学智慧车行数据可视化平台</span>
    </div>

    <!-- 主要内容区 -->
    <div class="login-page-main">
      <!-- 左侧3D场景 -->
      <div class="login-page-left">
        <div class="pedestal-body">
          <!-- 星球背景 -->
          <div class="planet-bg"></div>
          
          <!-- 气泡标签 -->
          <div class="bubble bubble-1">
            <span>智慧<br>停车</span>
          </div>
          <div class="bubble bubble-2">
            <span>车辆<br>识别</span>
          </div>
          <div class="bubble bubble-3">
            <span>实时<br>监控</span>
          </div>
          <div class="bubble bubble-4">
            <span>数据<br>分析</span>
          </div>
          <div class="bubble bubble-5">
            <span>预约<br>管理</span>
          </div>
          <div class="bubble bubble-6">
            <span>访客<br>管理</span>
          </div>
          <div class="bubble bubble-7">
            <span>统计<br>报表</span>
          </div>
        </div>
      </div>

      <!-- 右侧登录表单 -->
      <div class="login-page-right">
        <div class="login-body">
          <div class="item-body">
            <!-- 边框装饰 -->
            <div class="grid-view">
              <div class="corner corner-left-top"></div>
              <div class="corner corner-right-top"></div>
              <div class="corner corner-left-bottom"></div>
              <div class="corner corner-right-bottom"></div>
            </div>
            
            <!-- 登录表单内容 -->
            <div class="item-body-inner">
              <div class="login-form">
                <!-- 欢迎标题 -->
                <div class="login-title">
                  <span>您好，欢迎登录！</span>
                </div>

                <!-- 用户名输入框 -->
                <div class="login-input">
                  <div class="icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <path d="M12 12C14.2091 12 16 10.2091 16 8C16 5.79086 14.2091 4 12 4C9.79086 4 8 5.79086 8 8C8 10.2091 9.79086 12 12 12Z" stroke="#55b6f4" stroke-width="2"/>
                      <path d="M12 14C7.02944 14 3 17.134 3 21H21C21 17.134 16.9706 14 12 14Z" stroke="#55b6f4" stroke-width="2"/>
                    </svg>
                  </div>
                  <input
                    v-model="loginForm.username"
                    type="text"
                    placeholder="请输入账号"
                    @keyup.enter="handleLogin"
                  />
                </div>

                <!-- 密码输入框 -->
                <div class="login-input">
                  <div class="icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="5" y="11" width="14" height="10" rx="2" stroke="#55b6f4" stroke-width="2"/>
                      <path d="M8 11V7C8 5.34315 9.34315 4 11 4H13C14.6569 4 16 5.34315 16 7V11" stroke="#55b6f4" stroke-width="2"/>
                      <circle cx="12" cy="16" r="1.5" fill="#55b6f4"/>
                    </svg>
                  </div>
                  <input
                    v-model="loginForm.password"
                    :type="showPassword ? 'text' : 'password'"
                    placeholder="请输入密码"
                    @keyup.enter="handleLogin"
                  />
                  <span class="toggle-password" @click="showPassword = !showPassword">
                    {{ showPassword ? '👁️' : '👁️‍🗨️' }}
                  </span>
                </div>

                <!-- 验证码输入框 -->
                <div class="login-input captcha-row">
                  <div class="icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <rect x="4" y="4" width="16" height="16" rx="2" stroke="#55b6f4" stroke-width="2"/>
                      <path d="M9 12L11 14L15 10" stroke="#55b6f4" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>
                    </svg>
                  </div>
                  <input
                    v-model="loginForm.captcha"
                    type="text"
                    placeholder="请输入验证码"
                    style="flex: 1;"
                    @keyup.enter="handleLogin"
                  />
                  <canvas
                    ref="captchaCanvas"
                    class="captcha-canvas"
                    width="100"
                    height="40"
                    @click="generateCaptcha"
                  ></canvas>
                </div>

                <!-- 登录按钮 -->
                <div
                  class="login-button"
                  :class="{ 'loading': isLoading }"
                  @click="!isLoading && handleLogin()"
                >
                  <span v-if="!isLoading">登 录</span>
                  <span v-else>登录中...</span>
                </div>

                <!-- 登录提示 -->
                <transition name="fade">
                  <div v-if="loginMessage.show" class="login-message" :class="loginMessage.type">
                    <span class="message-icon">{{ loginMessage.type === 'success' ? '✓' : '✗' }}</span>
                    <span class="message-text">{{ loginMessage.text }}</span>
                  </div>
                </transition>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script>
import { loginAPI } from '@/services/authService'
import { setToken, setUserInfo } from '@/utils/auth'

export default {
  name: 'Login',
  data() {
    return {
      loginForm: {
        username: '',
        password: '',
        captcha: '',
        rememberMe: false
      },
      showPassword: false,
      isLoading: false,
      captchaText: '',
      loginMessage: {
        show: false,
        type: 'error',
        text: ''
      }
    }
  },
  mounted() {
    this.generateCaptcha()
  },
  methods: {
    // 生成验证码
    generateCaptcha() {
      const canvas = this.$refs.captchaCanvas
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      let code = ''
      
      // 清空画布
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      // 绘制背景
      ctx.fillStyle = 'rgba(26, 71, 166, 0.2)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
      
      // 生成4位验证码
      for (let i = 0; i < 4; i++) {
        const char = chars[Math.floor(Math.random() * chars.length)]
        code += char
        
        // 随机颜色
        const colors = ['#00f7ff', '#00ff88', '#ff00ff', '#ffaa00']
        ctx.fillStyle = colors[Math.floor(Math.random() * colors.length)]
        
        // 随机字体大小和倾斜
        ctx.font = `${20 + Math.random() * 8}px Arial`
        const rotate = (Math.random() - 0.5) * 0.4
        
        ctx.save()
        ctx.translate(20 + i * 20, 25)
        ctx.rotate(rotate)
        ctx.fillText(char, 0, 0)
        ctx.restore()
      }
      
      // 绘制干扰线
      for (let i = 0; i < 3; i++) {
        ctx.strokeStyle = `rgba(85, 182, 244, ${Math.random() * 0.5})`
        ctx.beginPath()
        ctx.moveTo(Math.random() * canvas.width, Math.random() * canvas.height)
        ctx.lineTo(Math.random() * canvas.width, Math.random() * canvas.height)
        ctx.stroke()
      }
      
      this.captchaText = code
    },

    // 显示消息
    showMessage(type, text) {
      this.loginMessage = { show: true, type, text }
      setTimeout(() => {
        this.loginMessage.show = false
      }, 3000)
    },

    // 处理登录
    async handleLogin() {
      // 验证表单
      if (!this.loginForm.username) {
        this.showMessage('error', '请输入用户名')
        return
      }
      if (!this.loginForm.password) {
        this.showMessage('error', '请输入密码')
        return
      }
      if (!this.loginForm.captcha) {
        this.showMessage('error', '请输入验证码')
        return
      }
      if (this.loginForm.captcha.toUpperCase() !== this.captchaText.toUpperCase()) {
        this.showMessage('error', '验证码错误')
        this.generateCaptcha()
        return
      }

      this.isLoading = true

      try {
        // 调用登录API
        const response = await loginAPI({
          username: this.loginForm.username,
          password: this.loginForm.password
        })

        console.log('登录响应:', response)

        if (response.code === '0' || response.code === 0) {
          // 保存Token和用户信息
          setToken(response.data.token)
          setUserInfo(response.data.user)

          this.showMessage('success', '登录成功！正在跳转...')

          // 延迟跳转
          setTimeout(() => {
            this.$router.push('/')
          }, 1000)
        } else {
          this.showMessage('error', response.msg || '登录失败，请检查用户名和密码')
          this.generateCaptcha()
        }
      } catch (error) {
        console.error('登录错误:', error)
        this.showMessage('error', '网络错误，请稍后重试')
        this.generateCaptcha()
      } finally {
        this.isLoading = false
      }
    }
  }
}
</script>

<style lang="scss" scoped>
// 基础容器
.login-container {
  position: fixed;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  flex-direction: column;
  background: #0a0e27;
  overflow: hidden;
}

// 背景图
.page-bg {
  position: absolute;
  width: 100%;
  height: 100%;
  background: url('~@/assets/login_18/bg-4bf14bc8.jpg') no-repeat center center;
  background-size: cover;
  z-index: 0;
  opacity: 0.6;
}

// 页面标题
.page-title {
  position: relative;
  z-index: 1;
  font-size: 42px;
  font-weight: 700;
  color: #ffffff;
  text-shadow: 0 0 20px rgba(0, 247, 255, 0.8);
  margin-bottom: 60px;
  letter-spacing: 4px;
  animation: titleGlow 2s ease-in-out infinite;
}

@keyframes titleGlow {
  0%, 100% { text-shadow: 0 0 20px rgba(0, 247, 255, 0.8); }
  50% { text-shadow: 0 0 40px rgba(0, 247, 255, 1); }
}

// 主要内容区
.login-page-main {
  position: relative;
  width: 86%;
  max-width: 1400px;
  display: flex;
  justify-content: center;
  align-items: center;
  height: 600px;
  z-index: 1;
}

// 左侧3D场景
.login-page-left {
  flex: 1;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.pedestal-body {
  position: relative;
  width: 100%;
  height: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

// 星球背景
.planet-bg {
  width: 400px;
  height: 400px;
  background: url('~@/assets/login_18/xingqiu-c844cea3.png') center center no-repeat;
  background-size: contain;
  animation: planetRotate 20s linear infinite;
}

@keyframes planetRotate {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

// 气泡标签
.bubble {
  position: absolute;
  background-size: 100% 100%;
  display: flex;
  justify-content: center;
  align-items: center;
  color: #fff;
  font-size: 16px;
  font-weight: 800;
  text-align: center;
  line-height: 1.5;
  cursor: pointer;
  transition: all 0.3s ease;
  animation: bubbleFloat 3s ease-in-out infinite;

  &:hover {
    transform: scale(1.1);
  }

  span {
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.5);
  }
}

@keyframes bubbleFloat {
  0%, 100% { transform: translate(0, 0); }
  25% { transform: translate(5px, -5px); }
  50% { transform: translate(2px, 5px); }
  75% { transform: translate(5px, 0); }
}

.bubble-1 {
  background: url('~@/assets/login_18/qipao1-877f2558.png') center center no-repeat;
  width: 150px;
  height: 152px;
  top: 48%;
  left: 38%;
  animation-delay: 0s;
}

.bubble-2 {
  background: url('~@/assets/login_18/qipao2-bf020116.png') center center no-repeat;
  width: 111px;
  height: 111px;
  top: 10%;
  left: 25%;
  animation-delay: 0.5s;
}

.bubble-3 {
  background: url('~@/assets/login_18/qipao2-bf020116.png') center center no-repeat;
  width: 132px;
  height: 132px;
  top: 30%;
  left: 13%;
  animation-delay: 1s;
}

.bubble-4 {
  background: url('~@/assets/login_18/qipao2-bf020116.png') center center no-repeat;
  width: 132px;
  height: 132px;
  top: 48%;
  left: 13%;
  animation-delay: 1.5s;
}

.bubble-5 {
  background: url('~@/assets/login_18/qipao2-bf020116.png') center center no-repeat;
  width: 120px;
  height: 122px;
  top: 65%;
  left: 55%;
  animation-delay: 2s;
}

.bubble-6 {
  background: url('~@/assets/login_18/qipao2-bf020116.png') center center no-repeat;
  width: 140px;
  height: 142px;
  top: 47%;
  left: 65%;
  animation-delay: 2.5s;
}

.bubble-7 {
  background: url('~@/assets/login_18/qipao2-bf020116.png') center center no-repeat;
  width: 130px;
  height: 132px;
  top: 62%;
  left: 70%;
  animation-delay: 3s;
}

// 右侧登录表单
.login-page-right {
  width: 520px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-body {
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.item-body {
  width: 100%;
  position: relative;
}

// 边框装饰
.grid-view {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
  z-index: 0;

  .corner {
    position: absolute;
    width: 20px;
    height: 20px;
    
    &::before, &::after {
      content: '';
      position: absolute;
      background: #55b6f4;
      box-shadow: 0 0 10px #55b6f4;
    }
  }

  .corner-left-top {
    top: 0;
    left: 0;
    border-top: 2px solid rgba(85, 182, 244, 0.6);
    border-left: 2px solid rgba(85, 182, 244, 0.6);
  }

  .corner-right-top {
    top: 0;
    right: 0;
    border-top: 2px solid rgba(85, 182, 244, 0.6);
    border-right: 2px solid rgba(85, 182, 244, 0.6);
  }

  .corner-left-bottom {
    bottom: 0;
    left: 0;
    border-bottom: 2px solid rgba(85, 182, 244, 0.6);
    border-left: 2px solid rgba(85, 182, 244, 0.6);
  }

  .corner-right-bottom {
    bottom: 0;
    right: 0;
    border-bottom: 2px solid rgba(85, 182, 244, 0.6);
    border-right: 2px solid rgba(85, 182, 244, 0.6);
  }
}

// 登录表单内容
.item-body-inner {
  border: 1px solid rgba(26, 71, 166, 0.66);
  background: rgba(10, 20, 50, 0.85);
  backdrop-filter: blur(10px);
  padding: 48px 40px;
  position: relative;
  z-index: 1;
}

.login-form {
  width: 100%;
}

// 标题
.login-title {
  text-align: center;
  margin-bottom: 40px;

  span {
    font-size: 24px;
    font-weight: 700;
    color: #ffffff;
    text-shadow: 0 0 10px rgba(85, 182, 244, 0.5);
  }
}

// 输入框
.login-input {
  width: 100%;
  height: 56px;
  border-bottom: 1px solid rgba(156, 178, 249, 0.3);
  display: flex;
  align-items: center;
  margin-bottom: 24px;
  transition: border-color 0.3s;

  &:hover {
    border-bottom-color: rgba(85, 182, 244, 0.6);
  }

  &:focus-within {
    border-bottom-color: #55b6f4;
  }

  .icon {
    width: 50px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;

    svg {
      width: 24px;
      height: 24px;
    }
  }

  input {
    flex: 1;
    height: 100%;
    border: none;
    background: none;
    outline: none;
    color: #ffffff;
    font-size: 15px;

    &::placeholder {
      color: #a8b7e7;
    }
  }

  .toggle-password {
    cursor: pointer;
    padding: 0 12px;
    font-size: 20px;
    opacity: 0.6;
    transition: opacity 0.3s;

    &:hover {
      opacity: 1;
    }
  }
}

// 验证码行
.captcha-row {
  .captcha-canvas {
    margin-left: 12px;
    border-radius: 8px;
    background: rgba(255, 255, 255, 0.05);
    cursor: pointer;
    transition: all 0.3s;

    &:hover {
      background: rgba(255, 255, 255, 0.1);
      transform: scale(1.05);
    }
  }
}

// 登录按钮
.login-button {
  width: 100%;
  height: 56px;
  background: #009CFF;
  box-shadow: 0 7px 6px rgba(0, 0, 0, 0.3);
  border-radius: 6px;
  margin-top: 32px;
  color: #fff;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 10px;
  text-indent: 10px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.3s ease;

  &:hover {
    background: #0088dd;
    transform: translateY(-2px);
    box-shadow: 0 10px 20px rgba(0, 156, 255, 0.4);
  }

  &:active {
    transform: translateY(0);
  }

  &.loading {
    background: rgba(0, 156, 255, 0.6);
    cursor: not-allowed;
  }
}

// 登录消息
.login-message {
  margin-top: 20px;
  padding: 12px 16px;
  border-radius: 8px;
  display: flex;
  align-items: center;
  font-size: 14px;
  animation: slideDown 0.3s ease;

  &.success {
    background: rgba(0, 255, 136, 0.15);
    border: 1px solid rgba(0, 255, 136, 0.3);
    color: #00ff88;
  }

  &.error {
    background: rgba(255, 68, 68, 0.15);
    border: 1px solid rgba(255, 68, 68, 0.3);
    color: #ff4444;
  }

  .message-icon {
    margin-right: 8px;
    font-size: 18px;
    font-weight: 700;
  }
}

@keyframes slideDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 过渡动画
.fade-enter-active, .fade-leave-active {
  transition: all 0.3s ease;
}

.fade-enter, .fade-leave-to {
  opacity: 0;
  transform: translateY(-5px);
}

// 响应式
@media (max-width: 1200px) {
  .login-page-main {
    flex-direction: column;
  }

  .login-page-left {
    height: 300px;
  }

  .planet-bg {
    width: 250px;
    height: 250px;
  }

  .bubble {
    font-size: 12px;
    
    &.bubble-1 { width: 100px; height: 102px; }
    &.bubble-2,
    &.bubble-3,
    &.bubble-4,
    &.bubble-5,
    &.bubble-6,
    &.bubble-7 {
      width: 80px;
      height: 80px;
    }
  }
}

@media (max-width: 768px) {
  .page-title {
    font-size: 24px;
    margin-bottom: 30px;
  }

  .login-page-main {
    width: 95%;
  }

  .login-page-right {
    width: 100%;
  }

  .item-body-inner {
    padding: 32px 24px;
  }
}
</style>
