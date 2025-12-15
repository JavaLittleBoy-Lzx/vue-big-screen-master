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

                <!-- 表单区域 -->
                <div class="login-form">
                  <div class="form-group" :class="{ focused: usernameFocused, error: errors.username }">
                    <div class="input-wrapper">
                      <span class="input-icon">👤</span>
                      <input
                        type="text"
                        v-model="loginForm.username"
                        @focus="usernameFocused = true"
                        @blur="usernameFocused = false; validateUsername()"
                        placeholder="请输入用户名"
                        autocomplete="username"
                      />
                      <div class="input-border"></div>
                    </div>
                    <transition name="fade">
                      <span v-if="errors.username" class="error-message">{{ errors.username }}</span>
                    </transition>
                  </div>

                  <div class="form-group" :class="{ focused: passwordFocused, error: errors.password }">
                    <div class="input-wrapper">
                      <span class="input-icon">🔒</span>
                      <input
                        :type="showPassword ? 'text' : 'password'"
                        v-model="loginForm.password"
                        @focus="passwordFocused = true"
                        @blur="passwordFocused = false; validatePassword()"
                        @keyup.enter="handleLogin"
                        placeholder="请输入密码"
                        autocomplete="current-password"
                      />
                      <span class="toggle-password" @click="showPassword = !showPassword">
                        {{ showPassword ? '👁️' : '👁️‍🗨️' }}
                      </span>
                      <div class="input-border"></div>
                    </div>
                    <transition name="fade">
                      <span v-if="errors.password" class="error-message">{{ errors.password }}</span>
                    </transition>
                  </div>

                  <div class="form-group" :class="{ focused: captchaFocused, error: errors.captcha }">
                    <div class="input-wrapper captcha-wrapper">
                      <span class="input-icon">🔐</span>
                      <input
                        type="text"
                        v-model="loginForm.captcha"
                        @focus="captchaFocused = true"
                        @blur="captchaFocused = false; validateCaptcha()"
                        @keyup.enter="handleLogin"
                        placeholder="请输入验证码"
                        maxlength="4"
                      />
                      <div class="captcha-code" @click="refreshCaptcha" :title="'点击刷新验证码'">
                        <span v-for="(char, index) in captchaCode" :key="index" :style="getCaptchaStyle(index)">
                          {{ char }}
                        </span>
                      </div>
                      <div class="input-border"></div>
                    </div>
                    <transition name="fade">
                      <span v-if="errors.captcha" class="error-message">{{ errors.captcha }}</span>
                    </transition>
                  </div>

                  <div class="form-options">
                    <label class="remember-me">
                      <input type="checkbox" v-model="loginForm.rememberMe" />
                      <span class="checkbox-custom"></span>
                      <span class="checkbox-label">记住密码</span>
                    </label>
                    <a href="#" class="forgot-password" @click.prevent="handleForgotPassword">忘记密码？</a>
                  </div>

                  <button 
                    class="login-button" 
                    :class="{ loading: loading }"
                    @click="handleLogin"
                    :disabled="loading"
                  >
                    <span v-if="!loading" class="button-text">
                      <span class="button-icon">🚀</span>
                      登录系统
                    </span>
                    <span v-else class="loading-spinner">
                      <span class="spinner"></span>
                      登录中...
                    </span>
                  </button>

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
      errors: {
        username: '',
        password: '',
        captcha: ''
      },
      usernameFocused: false,
      passwordFocused: false,
      captchaFocused: false,
      showPassword: false,
      loading: false,
      captchaCode: '',
      loginMessage: {
        show: false,
        type: 'error',
        text: ''
      }
    }
  },
  mounted() {
    this.initBackgroundAnimation()
    this.refreshCaptcha()
    this.loadRememberedCredentials()
  },
  methods: {
    // 初始化背景动画
    initBackgroundAnimation() {
      const canvas = this.$refs.canvas
      if (!canvas) return
      
      const ctx = canvas.getContext('2d')
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight

      const particles = []
      const particleCount = 100

      // 创建粒子
      for (let i = 0; i < particleCount; i++) {
        particles.push({
          x: Math.random() * canvas.width,
          y: Math.random() * canvas.height,
          vx: (Math.random() - 0.5) * 0.5,
          vy: (Math.random() - 0.5) * 0.5,
          radius: Math.random() * 2 + 1
        })
      }

      // 动画循环
      const animate = () => {
        ctx.clearRect(0, 0, canvas.width, canvas.height)
        
        // 绘制粒子
        particles.forEach((particle, i) => {
          particle.x += particle.vx
          particle.y += particle.vy

          // 边界检测
          if (particle.x < 0 || particle.x > canvas.width) particle.vx *= -1
          if (particle.y < 0 || particle.y > canvas.height) particle.vy *= -1

          // 绘制粒子
          ctx.beginPath()
          ctx.arc(particle.x, particle.y, particle.radius, 0, Math.PI * 2)
          ctx.fillStyle = 'rgba(0, 247, 255, 0.5)'
          ctx.fill()

          // 连接附近的粒子
          particles.forEach((particle2, j) => {
            if (i !== j) {
              const dx = particle.x - particle2.x
              const dy = particle.y - particle2.y
              const distance = Math.sqrt(dx * dx + dy * dy)

              if (distance < 120) {
                ctx.beginPath()
                ctx.moveTo(particle.x, particle.y)
                ctx.lineTo(particle2.x, particle2.y)
                ctx.strokeStyle = `rgba(0, 247, 255, ${0.2 * (1 - distance / 120)})`
                ctx.lineWidth = 0.5
                ctx.stroke()
              }
            }
          })
        })

        requestAnimationFrame(animate)
      }

      animate()

      // 响应窗口大小变化
      window.addEventListener('resize', () => {
        canvas.width = window.innerWidth
        canvas.height = window.innerHeight
      })
    },

    // 生成验证码
    refreshCaptcha() {
      const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'
      let code = ''
      for (let i = 0; i < 4; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      this.captchaCode = code
      this.loginForm.captcha = ''
      this.errors.captcha = ''
    },

    // 验证码样式
    getCaptchaStyle(index) {
      const colors = ['#00f7ff', '#00ff88', '#ff00ff', '#ffaa00']
      const rotations = [-15, 15, -10, 20]
      return {
        color: colors[index % colors.length],
        transform: `rotate(${rotations[index % rotations.length]}deg)`,
        fontSize: `${20 + Math.random() * 8}px`
      }
    },

    // 验证用户名
    validateUsername() {
      if (!this.loginForm.username) {
        this.errors.username = '请输入用户名'
        return false
      }
      if (this.loginForm.username.length < 3) {
        this.errors.username = '用户名至少3个字符'
        return false
      }
      this.errors.username = ''
      return true
    },

    // 验证密码
    validatePassword() {
      if (!this.loginForm.password) {
        this.errors.password = '请输入密码'
        return false
      }
      if (this.loginForm.password.length < 6) {
        this.errors.password = '密码至少6个字符'
        return false
      }
      this.errors.password = ''
      return true
    },

    // 验证验证码
    validateCaptcha() {
      if (!this.loginForm.captcha) {
        this.errors.captcha = '请输入验证码'
        return false
      }
      if (this.loginForm.captcha.toUpperCase() !== this.captchaCode) {
        this.errors.captcha = '验证码错误'
        return false
      }
      this.errors.captcha = ''
      return true
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
      const usernameValid = this.validateUsername()
      const passwordValid = this.validatePassword()
      const captchaValid = this.validateCaptcha()

      if (!usernameValid || !passwordValid || !captchaValid) {
        this.showMessage('error', '请填写完整的登录信息')
        return
      }

      this.loading = true

      try {
        // 调用登录API
        const response = await loginAPI({
          username: this.loginForm.username,
          password: this.loginForm.password
        })

        if (response.code === 0 || response.code === 200) {
          // 保存Token和用户信息
          setToken(response.data.token)
          setUserInfo(response.data.userInfo)

          // 记住密码
          if (this.loginForm.rememberMe) {
            localStorage.setItem('remembered_username', this.loginForm.username)
            localStorage.setItem('remembered_password', btoa(this.loginForm.password)) // 简单编码，实际应用中应该更安全
          } else {
            localStorage.removeItem('remembered_username')
            localStorage.removeItem('remembered_password')
          }

          this.showMessage('success', '登录成功！正在跳转...')

          // 延迟跳转以显示成功消息
          setTimeout(() => {
            this.$router.push('/')
          }, 1000)
        } else {
          this.showMessage('error', response.msg || '登录失败，请检查用户名和密码')
          this.refreshCaptcha()
        }
      } catch (error) {
        console.error('登录错误:', error)
        this.showMessage('error', '网络错误，请稍后重试')
        this.refreshCaptcha()
      } finally {
        this.loading = false
      }
    },

    // 加载记住的凭据
    loadRememberedCredentials() {
      const username = localStorage.getItem('remembered_username')
      const password = localStorage.getItem('remembered_password')
      
      if (username && password) {
        this.loginForm.username = username
        this.loginForm.password = atob(password)
        this.loginForm.rememberMe = true
      }
    },

    // 忘记密码
    handleForgotPassword() {
      alert('请联系系统管理员重置密码')
    }
  }
}
</script>

<style lang="scss" scoped>
.login-container {
  position: relative;
  width: 100vw;
  height: 100vh;
  overflow: hidden;
  display: flex;
  align-items: center;
  justify-content: center;
  background: linear-gradient(135deg, #0a0e27 0%, #1a1f3a 50%, #0a0e27 100%);
}

// 背景动画
.tech-background {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;

  .background-canvas {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
  }

  .grid-lines {
    position: absolute;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-image: 
      linear-gradient(rgba(0, 247, 255, 0.03) 1px, transparent 1px),
      linear-gradient(90deg, rgba(0, 247, 255, 0.03) 1px, transparent 1px);
    background-size: 50px 50px;
    animation: gridMove 20s linear infinite;
  }
}

@keyframes gridMove {
  0% { transform: translate(0, 0); }
  100% { transform: translate(50px, 50px); }
}

// 登录卡片
.login-card {
  position: relative;
  width: 480px;
  background: rgba(10, 14, 39, 0.85);
  backdrop-filter: blur(20px);
  border-radius: 24px;
  padding: 48px 40px;
  box-shadow: 
    0 8px 32px rgba(0, 247, 255, 0.1),
    0 0 0 1px rgba(0, 247, 255, 0.2);
  z-index: 10;
  animation: cardFloat 3s ease-in-out infinite;
}

@keyframes cardFloat {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-10px); }
}

// 头部
.login-header {
  text-align: center;
  margin-bottom: 40px;

  .logo-section {
    .logo-circle {
      width: 80px;
      height: 80px;
      margin: 0 auto 20px;
      border-radius: 50%;
      background: linear-gradient(135deg, #00f7ff, #00ff88);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 0 30px rgba(0, 247, 255, 0.5);
      animation: logoGlow 2s ease-in-out infinite;

      .logo-inner {
        font-size: 40px;
        animation: logoRotate 4s linear infinite;
      }
    }

    .title {
      font-size: 24px;
      font-weight: 700;
      color: #ffffff;
      margin: 0 0 8px;
      text-shadow: 0 0 20px rgba(0, 247, 255, 0.5);
    }

    .subtitle {
      font-size: 12px;
      color: #00f7ff;
      letter-spacing: 2px;
      text-transform: uppercase;
      margin: 0;
      opacity: 0.8;
    }
  }
}

@keyframes logoGlow {
  0%, 100% { box-shadow: 0 0 30px rgba(0, 247, 255, 0.5); }
  50% { box-shadow: 0 0 50px rgba(0, 247, 255, 0.8); }
}

@keyframes logoRotate {
  0% { transform: rotateY(0deg); }
  100% { transform: rotateY(360deg); }
}

// 表单
.login-form {
  .form-group {
    margin-bottom: 24px;
    position: relative;

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: rgba(255, 255, 255, 0.05);
      border-radius: 12px;
      padding: 0 16px;
      transition: all 0.3s ease;

      &:hover {
        background: rgba(255, 255, 255, 0.08);
      }

      .input-icon {
        font-size: 20px;
        margin-right: 12px;
        opacity: 0.6;
      }

      input {
        flex: 1;
        height: 50px;
        background: transparent;
        border: none;
        outline: none;
        color: #ffffff;
        font-size: 14px;

        &::placeholder {
          color: rgba(255, 255, 255, 0.4);
        }
      }

      .toggle-password {
        cursor: pointer;
        font-size: 18px;
        opacity: 0.6;
        transition: opacity 0.3s;

        &:hover {
          opacity: 1;
        }
      }

      .input-border {
        position: absolute;
        bottom: 0;
        left: 0;
        width: 0;
        height: 2px;
        background: linear-gradient(90deg, #00f7ff, #00ff88);
        transition: width 0.3s ease;
        border-radius: 2px;
      }
    }

    &.focused .input-wrapper {
      background: rgba(0, 247, 255, 0.1);
      box-shadow: 0 0 0 1px rgba(0, 247, 255, 0.3);

      .input-border {
        width: 100%;
      }

      .input-icon {
        opacity: 1;
      }
    }

    &.error .input-wrapper {
      background: rgba(255, 0, 0, 0.1);
      box-shadow: 0 0 0 1px rgba(255, 0, 0, 0.3);
    }

    .error-message {
      display: block;
      margin-top: 8px;
      color: #ff4444;
      font-size: 12px;
      padding-left: 16px;
    }
  }

  // 验证码特殊样式
  .captcha-wrapper {
    .captcha-code {
      display: flex;
      align-items: center;
      justify-content: center;
      background: rgba(255, 255, 255, 0.1);
      border-radius: 8px;
      padding: 8px 16px;
      margin-left: 12px;
      cursor: pointer;
      user-select: none;
      min-width: 100px;
      height: 36px;
      transition: all 0.3s;

      &:hover {
        background: rgba(255, 255, 255, 0.15);
        transform: scale(1.05);
      }

      span {
        display: inline-block;
        font-weight: 700;
        font-size: 20px;
        margin: 0 2px;
        text-shadow: 2px 2px 4px rgba(0, 0, 0, 0.5);
      }
    }
  }

  // 表单选项
  .form-options {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 32px;
    font-size: 13px;

    .remember-me {
      display: flex;
      align-items: center;
      cursor: pointer;
      color: rgba(255, 255, 255, 0.7);

      input[type="checkbox"] {
        display: none;

        &:checked + .checkbox-custom {
          background: linear-gradient(135deg, #00f7ff, #00ff88);
          border-color: #00f7ff;

          &::after {
            opacity: 1;
            transform: scale(1);
          }
        }
      }

      .checkbox-custom {
        position: relative;
        width: 18px;
        height: 18px;
        border: 2px solid rgba(255, 255, 255, 0.3);
        border-radius: 4px;
        margin-right: 8px;
        transition: all 0.3s;

        &::after {
          content: '✓';
          position: absolute;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) scale(0);
          color: #ffffff;
          font-size: 12px;
          font-weight: 700;
          opacity: 0;
          transition: all 0.3s;
        }
      }

      &:hover .checkbox-custom {
        border-color: #00f7ff;
      }
    }

    .forgot-password {
      color: #00f7ff;
      text-decoration: none;
      transition: color 0.3s;

      &:hover {
        color: #00ff88;
      }
    }
  }

  // 登录按钮
  .login-button {
    width: 100%;
    height: 52px;
    background: linear-gradient(135deg, #00f7ff, #00ff88);
    border: none;
    border-radius: 12px;
    color: #0a0e27;
    font-size: 16px;
    font-weight: 700;
    cursor: pointer;
    transition: all 0.3s ease;
    box-shadow: 0 4px 20px rgba(0, 247, 255, 0.4);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.3);
      transform: translate(-50%, -50%);
      transition: width 0.6s, height 0.6s;
    }

    &:hover {
      transform: translateY(-2px);
      box-shadow: 0 6px 30px rgba(0, 247, 255, 0.6);

      &::before {
        width: 300px;
        height: 300px;
      }
    }

    &:active {
      transform: translateY(0);
    }

    &.loading {
      background: rgba(0, 247, 255, 0.5);
      cursor: not-allowed;
    }

    &:disabled {
      opacity: 0.6;
      cursor: not-allowed;
    }

    .button-text {
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      z-index: 1;

      .button-icon {
        margin-right: 8px;
        font-size: 18px;
      }
    }

    .loading-spinner {
      display: flex;
      align-items: center;
      justify-content: center;

      .spinner {
        display: inline-block;
        width: 18px;
        height: 18px;
        border: 2px solid rgba(10, 14, 39, 0.3);
        border-top-color: #0a0e27;
        border-radius: 50%;
        animation: spin 0.8s linear infinite;
        margin-right: 8px;
      }
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
}

@keyframes spin {
  to { transform: rotate(360deg); }
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

// 底部
.login-footer {
  margin-top: 32px;
  padding-top: 24px;
  border-top: 1px solid rgba(255, 255, 255, 0.1);

  .footer-info {
    display: flex;
    align-items: center;
    justify-content: center;
    color: rgba(255, 255, 255, 0.5);
    font-size: 12px;
    margin-bottom: 12px;

    span {
      margin: 0 8px;
    }
  }

  .footer-tips {
    text-align: center;
    color: rgba(0, 247, 255, 0.6);
    font-size: 12px;

    p {
      margin: 4px 0;
    }
  }
}

// 装饰元素
.decorations {
  .corner-decoration {
    position: absolute;
    width: 200px;
    height: 200px;
    opacity: 0.3;

    &::before,
    &::after {
      content: '';
      position: absolute;
      background: linear-gradient(135deg, #00f7ff, transparent);
    }

    &.top-left {
      top: 0;
      left: 0;
      
      &::before {
        top: 0;
        left: 0;
        width: 2px;
        height: 100px;
      }

      &::after {
        top: 0;
        left: 0;
        width: 100px;
        height: 2px;
      }
    }

    &.top-right {
      top: 0;
      right: 0;
      
      &::before {
        top: 0;
        right: 0;
        width: 2px;
        height: 100px;
      }

      &::after {
        top: 0;
        right: 0;
        width: 100px;
        height: 2px;
      }
    }

    &.bottom-left {
      bottom: 0;
      left: 0;
      
      &::before {
        bottom: 0;
        left: 0;
        width: 2px;
        height: 100px;
      }

      &::after {
        bottom: 0;
        left: 0;
        width: 100px;
        height: 2px;
      }
    }

    &.bottom-right {
      bottom: 0;
      right: 0;
      
      &::before {
        bottom: 0;
        right: 0;
        width: 2px;
        height: 100px;
      }

      &::after {
        bottom: 0;
        right: 0;
        width: 100px;
        height: 2px;
      }
    }
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
@media (max-width: 768px) {
  .login-card {
    width: 90%;
    padding: 32px 24px;
  }
}
</style>
