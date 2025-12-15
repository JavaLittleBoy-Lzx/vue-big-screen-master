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
            <span>通道<br>监控</span>
          </div>
          <div class="bubble bubble-2">
            <span>车流<br>分析</span>
          </div>
          <div class="bubble bubble-3">
            <span>通道<br>流量</span>
          </div>
          <div class="bubble bubble-4">
            <span>收费<br>分析</span>
          </div>
          <div class="bubble bubble-5">
            <span>访客<br>计划</span>
          </div>
          <div class="bubble bubble-6">
            <span>流量<br>分析</span>
          </div>
          <div class="bubble bubble-7">
            <span>预约<br>分类</span>
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
                <div class="login-input" :class="{ 'error': errors.username }">
                  <div class="icon">
                    <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                      <circle cx="12" cy="8" r="4" stroke="#55b6f4" stroke-width="2"/>
                      <path d="M6 21C6 17.6863 8.68629 15 12 15C15.3137 15 18 17.6863 18 21" stroke="#55b6f4" stroke-width="2"/>
                    </svg>
                  </div>
                  <input
                    v-model="loginForm.username"
                    type="text"
                    placeholder="请输入账号"
                    maxlength="20"
                    @keyup.enter="handleLogin"
                    @blur="validateUsername"
                  />
                  <span v-if="errors.username" class="error-text">{{ errors.username }}</span>
                </div>

                <!-- 密码输入框 -->
                <div class="login-input" :class="{ 'error': errors.password }">
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
                    maxlength="20"
                    @keyup.enter="handleLogin"
                    @blur="validatePassword"
                  />
                  <span class="toggle-password" @click="showPassword = !showPassword">
                    {{ showPassword ? '👁️' : '👁️‍🗨️' }}
                  </span>
                  <span v-if="errors.password" class="error-text">{{ errors.password }}</span>
                </div>

                <!-- 验证码输入框 -->
                <div class="login-input captcha-row" :class="{ 'error': errors.captcha }">
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
                    maxlength="4"
                    style="flex: 1;"
                    @keyup.enter="handleLogin"
                    @blur="validateCaptcha"
                  />
                  <canvas
                    ref="captchaCanvas"
                    class="captcha-canvas"
                    width="100"
                    height="40"
                    @click="generateCaptcha"
                  ></canvas>
                  <span v-if="errors.captcha" class="error-text">{{ errors.captcha }}</span>
                </div>

                <!-- 记住密码 -->
                <div class="remember-me-row">
                  <label class="remember-checkbox">
                    <input type="checkbox" v-model="loginForm.rememberMe" />
                    <span class="checkbox-icon"></span>
                    <span class="checkbox-label">记住密码</span>
                  </label>
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

                <!-- Tips提示 -->
                <div class="login-tips">
                  Tips: 用户名、密码和验证码必须填写
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
import { setToken, setUserInfo, getUserInfo } from '@/utils/auth'

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
      errors: {
        username: '',
        password: '',
        captcha: ''
      },
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

          // 根据用户角色跳转不同页面
          console.log('📋 完整登录响应:', response)
          console.log('👤 用户信息:', response.data.user)
          
          const userRole = response.data.user.role
          console.log('🎭 用户角色:', userRole)
          console.log('🔍 角色类型:', typeof userRole)
          
          let redirectPath = '/'
          
          if (userRole === 'admin') {
            redirectPath = '/user-management'
            console.log('👑 管理员登录，跳转到用户管理页面:', redirectPath)
          } else {
            redirectPath = '/'
            console.log('👤 普通用户登录，跳转到数据大屏:', redirectPath)
          }

          console.log('🚀 准备跳转到:', redirectPath)
          
          // 确保 localStorage 保存完成后再跳转
          setTimeout(() => {
            // 再次验证 userInfo 已保存（使用getUserInfo确保key一致）
            const savedUserInfo = getUserInfo()
            console.log('💾 验证 localStorage 中的 userInfo:', savedUserInfo)
            
            if (savedUserInfo) {
              console.log('✈️ 开始执行跳转到:', redirectPath)
              this.$router.push(redirectPath)
            } else {
              console.error('❌ userInfo 未成功保存，重新保存')
              setUserInfo(response.data.user)
              setTimeout(() => {
                this.$router.push(redirectPath)
              }, 100)
            }
          }, 300)
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
    },

    // 验证用户名
    validateUsername() {
      this.errors.username = ''
      
      if (!this.loginForm.username) {
        this.errors.username = '请输入用户名'
        return false
      }
      
      if (this.loginForm.username.length < 3) {
        this.errors.username = '用户名至少3个字符'
        return false
      }
      
      if (this.loginForm.username.length > 20) {
        this.errors.username = '用户名最多20个字符'
        return false
      }
      
      // 验证用户名格式（字母、数字、下划线）
      const usernameRegex = /^[a-zA-Z0-9_]+$/
      if (!usernameRegex.test(this.loginForm.username)) {
        this.errors.username = '用户名只能包含字母、数字和下划线'
        return false
      }
      
      return true
    },

    // 验证密码
    validatePassword() {
      this.errors.password = ''
      
      if (!this.loginForm.password) {
        this.errors.password = '请输入密码'
        return false
      }
      
      if (this.loginForm.password.length < 6) {
        this.errors.password = '密码至少6个字符'
        return false
      }
      
      if (this.loginForm.password.length > 20) {
        this.errors.password = '密码最多20个字符'
        return false
      }
      
      return true
    },

    // 验证验证码
    validateCaptcha() {
      this.errors.captcha = ''
      
      if (!this.loginForm.captcha) {
        this.errors.captcha = '请输入验证码'
        return false
      }
      
      if (this.loginForm.captcha.length !== 4) {
        this.errors.captcha = '验证码必须是4位'
        return false
      }
      
      // 验证码内容比对（不区分大小写）
      if (this.loginForm.captcha.toUpperCase() !== this.captchaText.toUpperCase()) {
        this.errors.captcha = '验证码错误'
        return false
      }
      
      return true
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
  margin-bottom: 100px;
  margin-top: -120px;
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
  margin-left: -125px;
  margin-top: 150px;
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
  margin-left: 60px;
}

.login-body {
    margin-top: 80px;
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
  border: 1px solid rgba(85, 182, 244, 0.4);
  background: linear-gradient(135deg, 
    rgba(255, 255, 255, 0.98) 0%, 
    rgba(250, 252, 255, 0.98) 50%,
    rgba(255, 255, 255, 0.98) 100%
  );
  backdrop-filter: blur(20px);
  padding: 40px 32px;
  border-radius: 16px;
  position: relative;
  z-index: 1;
  box-shadow: 
    0 8px 32px rgba(0, 0, 0, 0.5),
    inset 0 0 60px rgba(85, 182, 244, 0.05);
  transition: all 0.4s ease;

  // 内部发光边框
  &::before {
    content: '';
    position: absolute;
    inset: -1px;
    border-radius: inherit;
    padding: 1px;
    background: linear-gradient(135deg, 
      rgba(85, 182, 244, 0.5),
      rgba(0, 247, 255, 0.3),
      rgba(85, 182, 244, 0.5)
    );
    -webkit-mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    -webkit-mask-composite: xor;
    mask: linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
    mask-composite: exclude;
    opacity: 0.6;
    animation: borderGlow 3s ease-in-out infinite;
  }

  // 背景粒子效果
  &::after {
    content: '';
    position: absolute;
    inset: 0;
    background-image: 
      radial-gradient(circle at 20% 30%, rgba(85, 182, 244, 0.1) 1px, transparent 1px),
      radial-gradient(circle at 80% 70%, rgba(0, 247, 255, 0.1) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: particleFloat 20s linear infinite;
    pointer-events: none;
  }

  &:hover {
    border-color: rgba(85, 182, 244, 0.6);
    box-shadow: 
      0 12px 48px rgba(0, 0, 0, 0.6),
      inset 0 0 80px rgba(85, 182, 244, 0.08),
      0 0 60px rgba(85, 182, 244, 0.2);
  }
}

@keyframes borderGlow {
  0%, 100% {
    opacity: 0.6;
  }
  50% {
    opacity: 1;
  }
}

@keyframes particleFloat {
  0% {
    background-position: 0 0, 50px 50px;
  }
  100% {
    background-position: 50px 50px, 0 0;
  }
}

.login-form {
  width: 100%;
  position: relative;
  z-index: 1;
}

// 标题
.login-title {
  text-align: center;
  margin-bottom: 32px;
  position: relative;
  animation: titleFadeIn 0.6s ease-out;

  &::before {
    content: '';
    position: absolute;
    left: 50%;
    bottom: -16px;
    transform: translateX(-50%);
    width: 60px;
    height: 3px;
    background: linear-gradient(90deg, 
      transparent,
      #55b6f4,
      #00f7ff,
      #55b6f4,
      transparent
    );
    border-radius: 2px;
    animation: lineExpand 0.8s ease-out 0.3s;
  }

  span {
    font-size: 22px;
    font-weight: 700;
    color: #2c3e50;
    display: inline-block;
    position: relative;
  }
}

@keyframes titleFadeIn {
  from {
    opacity: 0;
    transform: translateY(-20px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

@keyframes lineExpand {
  from {
    width: 0;
    opacity: 0;
  }
  to {
    width: 60px;
    opacity: 1;
  }
}

// 输入框
.login-input {
  width: 100%;
  height: 48px;
  position: relative;
  display: flex;
  align-items: center;
  margin-bottom: 16px;
  background: rgba(230, 235, 245, 0.95);
  border-radius: 12px;
  border: 1px solid rgba(200, 210, 230, 0.5);
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  overflow: hidden;
  padding: 0 16px;

  // 发光动画背景
  &::before {
    content: '';
    position: absolute;
    top: 0;
    left: -100%;
    width: 100%;
    height: 100%;
    background: linear-gradient(90deg, 
      transparent, 
      rgba(85, 182, 244, 0.2), 
      transparent
    );
    transition: left 0.6s ease;
  }

  // 底部发光线
  &::after {
    content: '';
    position: absolute;
    bottom: 0;
    left: 50%;
    width: 0;
    height: 2px;
    background: linear-gradient(90deg, #00f7ff, #55b6f4, #00ff88);
    transform: translateX(-50%);
    transition: width 0.4s ease;
    box-shadow: 0 0 10px rgba(85, 182, 244, 0.6);
  }

  &:hover {
    border-color: rgba(85, 182, 244, 0.5);
    background: rgba(235, 240, 250, 1);
    box-shadow: 0 2px 8px rgba(85, 182, 244, 0.15);
    
    &::before {
      left: 100%;
    }

    .icon svg {
      opacity: 0.7;
      transform: scale(1.02);
    }
  }

  &:focus-within {
    border-color: #5B7FFF;
    background: rgba(240, 245, 255, 1);
    box-shadow: 0 2px 12px rgba(91, 127, 255, 0.2);
    transform: translateY(0);

    &::after {
      width: 100%;
      background: linear-gradient(90deg, #5B7FFF, #4A90E2);
    }

    .icon svg {
      opacity: 0.8;
      transform: scale(1.05);
      
      path, rect, circle {
        stroke: #5B7FFF;
      }
    }

    input::placeholder {
      opacity: 0.5;
    }
  }

  // 错误状态
  &.error {
    border-color: #ef4444 !important;
    background: rgba(254, 226, 226, 0.95) !important;
    box-shadow: 0 0 0 3px rgba(239, 68, 68, 0.1) !important;
    animation: shake 0.4s ease;

    .icon svg {
      path, rect, circle {
        stroke: #ef4444;
      }
    }
  }

  .icon {
    width: 24px;
    min-width: 24px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    position: relative;
    margin-right: 16px;

    svg {
      width: 20px;
      height: 20px;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 0.5;
      
      path, rect, circle {
        stroke: #94a3b8;
      }
    }

    // 图标脉冲效果
    &::before {
      content: '';
      position: absolute;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      background: radial-gradient(circle, rgba(85, 182, 244, 0.2), transparent);
      opacity: 0;
      animation: iconPulse 2s ease-in-out infinite;
    }
  }

  input {
    flex: 1;
    height: 100%;
    border: none;
    background: transparent;
    outline: none;
    color: #2c3e50;
    font-size: 14px;
    padding: 0;
    transition: all 0.3s ease;

    &::placeholder {
      color: #a0aec0;
      transition: all 0.3s ease;
      opacity: 1;
    }

    &:focus::placeholder {
      color: #cbd5e0;
    }
  }

  .error-text {
    position: absolute;
    bottom: -20px;
    left: 0;
    font-size: 12px;
    color: #ef4444;
    animation: fadeInDown 0.3s ease;
  }

  .toggle-password {
    cursor: pointer;
    margin-left: 12px;
    font-size: 20px;
    opacity: 0.5;
    transition: all 0.3s ease;
    position: relative;

    &::before {
      content: '';
      position: absolute;
      inset: -4px;
      border-radius: 50%;
      background: rgba(85, 182, 244, 0.1);
      opacity: 0;
      transform: scale(0);
      transition: all 0.3s ease;
    }

    &:hover {
      opacity: 1;
      transform: scale(1.2);
      filter: drop-shadow(0 0 8px rgba(85, 182, 244, 0.8));

      &::before {
        opacity: 1;
        transform: scale(1);
      }
    }

    &:active {
      transform: scale(1.1);
    }
  }
}

// 图标脉冲动画
@keyframes iconPulse {
  0% {
    opacity: 0;
    transform: scale(0.8);
  }
  50% {
    opacity: 0.5;
    transform: scale(1.2);
  }
}

// 抖动动画
@keyframes shake {
  0%, 100% { transform: translateX(0); }
  10%, 30%, 50%, 70%, 90% { transform: translateX(-5px); }
  20%, 40%, 60%, 80% { transform: translateX(5px); }
}

// 淡入下滑动画
@keyframes fadeInDown {
  from {
    opacity: 0;
    transform: translateY(-10px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}

// 验证码行
.captcha-row {
  input {
    margin-right: 12px;
  }

  .captcha-canvas {
    flex-shrink: 0;
    border-radius: 8px;
    background: linear-gradient(135deg, 
      rgba(85, 182, 244, 0.1), 
      rgba(0, 247, 255, 0.1)
    );
    border: 1px solid rgba(85, 182, 244, 0.3);
    cursor: pointer;
    transition: all 0.3s ease;
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: -50%;
      left: -50%;
      width: 200%;
      height: 200%;
      background: radial-gradient(circle, rgba(255, 255, 255, 0.1), transparent);
      opacity: 0;
      transition: opacity 0.3s;
    }

    &:hover {
      background: linear-gradient(135deg, 
        rgba(85, 182, 244, 0.2), 
        rgba(0, 247, 255, 0.2)
      );
      border-color: rgba(85, 182, 244, 0.6);
      transform: scale(1.05) rotate(-2deg);
      box-shadow: 0 4px 15px rgba(85, 182, 244, 0.3);

      &::before {
        opacity: 1;
        animation: shimmer 0.8s ease-in-out;
      }
    }

    &:active {
      transform: scale(0.98);
    }
  }
}

@keyframes shimmer {
  0% {
    transform: translate(-50%, -50%) rotate(0deg);
  }
  100% {
    transform: translate(50%, 50%) rotate(180deg);
  }
}

// 记住密码
.remember-me-row {
  display: flex;
  align-items: center;
  margin-bottom: 20px;
  margin-top: 8px;

  .remember-checkbox {
    display: flex;
    align-items: center;
    cursor: pointer;
    user-select: none;

    input[type="checkbox"] {
      display: none;

      &:checked + .checkbox-icon {
        background: linear-gradient(135deg, #5B7FFF, #4A90E2);
        border-color: #5B7FFF;

        &::after {
          opacity: 1;
          transform: scale(1);
        }
      }
    }

    .checkbox-icon {
      position: relative;
      width: 18px;
      height: 18px;
      border: 2px solid #d0d7de;
      border-radius: 4px;
      background: transparent;
      transition: all 0.3s ease;
      margin-right: 8px;
      display: flex;
      align-items: center;
      justify-content: center;

      &::after {
        content: '✓';
        color: #ffffff;
        font-size: 11px;
        font-weight: 700;
        line-height: 1;
        opacity: 0;
        transform: scale(0);
        transition: all 0.3s ease;
      }
    }

    input[type="checkbox"]:checked + .checkbox-icon::after {
      opacity: 1;
      transform: scale(1);
    }

    .checkbox-label {
      font-size: 14px;
      color: #64748b;
    }

    &:hover .checkbox-icon {
      border-color: #5B7FFF;
    }
  }
}

// 登录按钮
.login-button {
  width: 100%;
  height: 50px;
  background: linear-gradient(135deg, #5B7FFF 0%, #4A90E2 100%);
  box-shadow: 0 4px 12px rgba(91, 127, 255, 0.3);
  border-radius: 12px;
  margin-top: 0;
  margin-bottom: 16px;
  color: #fff;
  font-size: 18px;
  font-weight: 800;
  letter-spacing: 12px;
  text-indent: 12px;
  display: flex;
  justify-content: center;
  align-items: center;
  cursor: pointer;
  transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
  position: relative;
  overflow: hidden;

  // 光波效果
  &::before {
    content: '';
    position: absolute;
    top: 50%;
    left: 50%;
    width: 0;
    height: 0;
    border-radius: 50%;
    background: rgba(255, 255, 255, 0.4);
    transform: translate(-50%, -50%);
    transition: width 0.6s ease, height 0.6s ease;
  }

  // 上方高光
  &::after {
    content: '';
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 50%;
    background: linear-gradient(180deg, rgba(255, 255, 255, 0.2), transparent);
    border-radius: 12px 12px 0 0;
  }

  span {
    position: relative;
    z-index: 1;
    text-shadow: 0 2px 4px rgba(0, 0, 0, 0.3);
  }

  &:hover {
    background: linear-gradient(135deg, #4A6FE8 0%, #3B7FD9 100%);
    transform: translateY(-2px);
    box-shadow: 0 6px 16px rgba(91, 127, 255, 0.4);

    &::before {
      width: 400px;
      height: 400px;
    }
  }

  &:active {
    transform: translateY(0);
    box-shadow: 0 2px 8px rgba(91, 127, 255, 0.3);
  }

  &.loading {
    background: linear-gradient(135deg, 
      rgba(91, 127, 255, 0.6) 0%, 
      rgba(74, 144, 226, 0.6) 100%
    );
    cursor: not-allowed;
    animation: buttonPulse 1.5s ease-in-out infinite;

    &::before {
      width: 300px;
      height: 300px;
      animation: ripple 1.5s ease-out infinite;
    }
  }
}

@keyframes buttonPulse {
  0%, 100% {
    box-shadow: 
      0 8px 16px rgba(0, 156, 255, 0.3),
      0 0 20px rgba(0, 156, 255, 0.2);
  }
  50% {
    box-shadow: 
      0 8px 16px rgba(0, 156, 255, 0.5),
      0 0 40px rgba(0, 156, 255, 0.4);
  }
}

@keyframes ripple {
  0% {
    width: 0;
    height: 0;
    opacity: 0.6;
  }
  100% {
    width: 400px;
    height: 400px;
    opacity: 0;
  }
}

// Tips提示
.login-tips {
  text-align: center;
  font-size: 13px;
  color: #94a3b8;
  margin-bottom: 12px;
  padding: 0 16px;
  line-height: 1.5;
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
    margin-bottom: 20px;
    margin-top: 0;
  }

  .login-page-main {
    width: 95%;
  }

  .login-page-right {
    width: 100%;
    margin-left: 0;
  }

  .item-body-inner {
    padding: 32px 24px;
  }
}
</style>
