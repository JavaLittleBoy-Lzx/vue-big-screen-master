<template>
  <div class="user-profile-container">
    <div class="profile-card">
      <div class="profile-header">
        <h2>个人信息</h2>
        <button class="close-btn" @click="goBack">✕</button>
      </div>

      <div class="profile-content">
        <!-- 用户头像 -->
        <div class="avatar-section">
          <div class="avatar">👤</div>
          <button class="avatar-change-btn">更换头像</button>
        </div>

        <!-- 用户信息表单 -->
        <div class="info-form">
          <div class="form-group">
            <label>用户ID</label>
            <input type="text" v-model="userInfo.id" disabled class="disabled-input" />
          </div>

          <div class="form-group">
            <label>用户名</label>
            <input type="text" v-model="userInfo.username" disabled class="disabled-input" />
          </div>

          <div class="form-group">
            <label>姓名</label>
            <input 
              type="text" 
              v-model="editForm.name" 
              :disabled="!isEditing"
              :class="{ 'editing': isEditing }"
            />
          </div>

          <div class="form-group">
            <label>角色</label>
            <input type="text" :value="getUserRoleName(userInfo.role)" disabled class="disabled-input" />
          </div>

          <div class="form-group">
            <label>用户状态</label>
            <span class="status-badge" :class="{ 'active': !userInfo.disabled }">
              {{ userInfo.disabled ? '已禁用' : '正常' }}
            </span>
          </div>

          <div class="form-group">
            <label>最后登录时间</label>
            <input type="text" :value="formatDate(userInfo.lastLoginTime)" disabled class="disabled-input" />
          </div>

          <div class="form-group">
            <label>最后登录IP</label>
            <input type="text" v-model="userInfo.lastLoginIp" disabled class="disabled-input" />
          </div>

          <div class="form-group">
            <label>登录次数</label>
            <input type="text" v-model="userInfo.loginCount" disabled class="disabled-input" />
          </div>

          <div class="form-group">
            <label>创建时间</label>
            <input type="text" :value="formatDate(userInfo.createTime)" disabled class="disabled-input" />
          </div>

          <div class="form-group">
            <label>更新时间</label>
            <input type="text" :value="formatDate(userInfo.updateTime)" disabled class="disabled-input" />
          </div>

          <div class="form-group full-width">
            <label>备注</label>
            <textarea 
              v-model="editForm.remark" 
              :disabled="!isEditing"
              :class="{ 'editing': isEditing }"
              rows="3"
            ></textarea>
          </div>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons">
          <button v-if="!isEditing" class="btn btn-primary" @click="startEdit">
            编辑信息
          </button>
          <template v-else>
            <button class="btn btn-success" @click="saveEdit">
              保存修改
            </button>
            <button class="btn btn-cancel" @click="cancelEdit">
              取消
            </button>
          </template>
          <button class="btn btn-warning" @click="changePassword">
            修改密码
          </button>
        </div>
      </div>
    </div>

    <!-- 修改密码弹窗 -->
    <transition name="fade">
      <div v-if="showPasswordModal" class="modal-overlay" @click="closePasswordModal">
        <div class="modal-content" @click.stop>
          <div class="modal-header">
            <h3>修改密码</h3>
            <button class="close-btn" @click="closePasswordModal">✕</button>
          </div>
          <div class="modal-body">
            <div class="form-group">
              <label>旧密码</label>
              <input 
                type="password" 
                v-model="passwordForm.oldPassword" 
                placeholder="请输入旧密码"
                @blur="validateOldPassword"
                :class="{ 'error': errors.oldPassword }"
              />
              <span v-if="errors.oldPassword" class="error-text">{{ errors.oldPassword }}</span>
            </div>
            <div class="form-group">
              <label>新密码</label>
              <input 
                type="password" 
                v-model="passwordForm.newPassword" 
                placeholder="至少6个字符"
                @blur="validateNewPassword"
                :class="{ 'error': errors.newPassword }"
              />
              <span v-if="errors.newPassword" class="error-text">{{ errors.newPassword }}</span>
            </div>
            <div class="form-group">
              <label>确认密码</label>
              <input 
                type="password" 
                v-model="passwordForm.confirmPassword" 
                placeholder="再次输入新密码"
                @blur="validateConfirmPassword"
                :class="{ 'error': errors.confirmPassword }"
              />
              <span v-if="errors.confirmPassword" class="error-text">{{ errors.confirmPassword }}</span>
            </div>
          </div>
          <div class="modal-footer">
            <button class="btn btn-success" @click="submitPasswordChange" :disabled="isSubmitting">
              {{ isSubmitting ? '提交中...' : '确认修改' }}
            </button>
            <button class="btn btn-cancel" @click="closePasswordModal">取消</button>
          </div>
        </div>
      </div>
    </transition>
  </div>
</template>

<script>
import { getUserInfo, setUserInfo } from '@/utils/auth'
import { changePasswordAPI, verifyOldPasswordAPI } from '@/services/authService'

export default {
  name: 'UserProfile',
  data() {
    return {
      userInfo: {},
      editForm: {
        name: '',
        remark: ''
      },
      isEditing: false,
      showPasswordModal: false,
      passwordForm: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      errors: {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      },
      isSubmitting: false
    }
  },
  mounted() {
    this.loadUserInfo()
  },
  methods: {
    loadUserInfo() {
      const userInfoStr = getUserInfo()
      if (userInfoStr) {
        this.userInfo = JSON.parse(userInfoStr)
        this.editForm.name = this.userInfo.name || ''
        this.editForm.remark = this.userInfo.remark || ''
      } else {
        this.$router.push('/login')
      }
    },
    
    getUserRoleName(role) {
      const roleMap = {
        'admin': '管理员',
        'user': '普通用户',
        'guest': '访客'
      }
      return roleMap[role] || role
    },
    
    formatDate(dateString) {
      if (!dateString) return '-'
      const date = new Date(dateString)
      return date.toLocaleString('zh-CN')
    },
    
    startEdit() {
      this.isEditing = true
    },
    
    cancelEdit() {
      this.isEditing = false
      this.editForm.name = this.userInfo.name || ''
      this.editForm.remark = this.userInfo.remark || ''
    },
    
    async saveEdit() {
      // 更新用户信息
      this.userInfo.name = this.editForm.name
      this.userInfo.remark = this.editForm.remark
      this.userInfo.updateTime = new Date().toISOString()
      
      // 保存到LocalStorage
      setUserInfo(this.userInfo)
      
      this.isEditing = false
      this.$message?.success('信息已更新')
      
      // 通知父组件刷新
      this.$emit('user-updated', this.userInfo)
    },
    
    changePassword() {
      this.showPasswordModal = true
      this.resetPasswordForm()
    },
    
    closePasswordModal() {
      this.showPasswordModal = false
      this.resetPasswordForm()
    },
    
    resetPasswordForm() {
      this.passwordForm = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
      this.errors = {
        oldPassword: '',
        newPassword: '',
        confirmPassword: ''
      }
    },
    
    async validateOldPassword() {
      this.errors.oldPassword = ''
      if (!this.passwordForm.oldPassword) {
        this.errors.oldPassword = '请输入旧密码'
        return false
      }
      
      // 实时验证旧密码是否正确
      try {
        await verifyOldPasswordAPI(this.passwordForm.oldPassword)
        return true
      } catch (error) {
        this.errors.oldPassword = error.message || '旧密码错误'
        return false
      }
    },
    
    validateNewPassword() {
      this.errors.newPassword = ''
      if (!this.passwordForm.newPassword) {
        this.errors.newPassword = '请输入新密码'
        return false
      }
      if (this.passwordForm.newPassword.length < 6) {
        this.errors.newPassword = '新密码至少6个字符'
        return false
      }
      return true
    },
    
    validateConfirmPassword() {
      this.errors.confirmPassword = ''
      if (!this.passwordForm.confirmPassword) {
        this.errors.confirmPassword = '请确认新密码'
        return false
      }
      if (this.passwordForm.confirmPassword !== this.passwordForm.newPassword) {
        this.errors.confirmPassword = '两次密码输入不一致'
        return false
      }
      return true
    },
    
    async submitPasswordChange() {
      // 验证所有字段
      const valid = await this.validateOldPassword() && 
                   this.validateNewPassword() && 
                   this.validateConfirmPassword()
      
      if (!valid) return
      
      this.isSubmitting = true
      
      try {
        const response = await changePasswordAPI({
          oldPassword: this.passwordForm.oldPassword,
          newPassword: this.passwordForm.newPassword
        })
        
        if (response.code === 0 || response.code === '0') {
          alert('密码修改成功！请重新登录')
          this.$router.push('/login')
        } else {
          alert(response.msg || '密码修改失败')
        }
      } catch (error) {
        console.error('修改密码失败:', error)
        alert('修改密码失败，请稍后重试')
      } finally {
        this.isSubmitting = false
      }
    },
    
    goBack() {
      this.$router.go(-1)
    }
  }
}
</script>

<style lang="scss" scoped>
.user-profile-container {
  min-height: 100vh;
  background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
  padding: 40px 20px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.profile-card {
  width: 100%;
  max-width: 800px;
  background: rgba(255, 255, 255, 0.95);
  border-radius: 16px;
  box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
  overflow: hidden;
}

.profile-header {
  background: linear-gradient(135deg, #5B7FFF, #4A90E2);
  color: white;
  padding: 24px 32px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h2 {
    margin: 0;
    font-size: 24px;
  }
  
  .close-btn {
    background: rgba(255, 255, 255, 0.2);
    border: none;
    color: white;
    width: 32px;
    height: 32px;
    border-radius: 50%;
    cursor: pointer;
    font-size: 20px;
    transition: all 0.3s ease;
    
    &:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: rotate(90deg);
    }
  }
}

.profile-content {
  padding: 32px;
}

.avatar-section {
  text-align: center;
  margin-bottom: 32px;
  
  .avatar {
    width: 100px;
    height: 100px;
    border-radius: 50%;
    background: linear-gradient(135deg, #667eea, #764ba2);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    font-size: 48px;
    margin-bottom: 16px;
  }
  
  .avatar-change-btn {
    background: #f0f0f0;
    border: none;
    padding: 8px 16px;
    border-radius: 20px;
    cursor: pointer;
    font-size: 14px;
    color: #666;
    transition: all 0.3s ease;
    
    &:hover {
      background: #e0e0e0;
    }
  }
}

.info-form {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 20px;
  
  .form-group {
    display: flex;
    flex-direction: column;
    
    &.full-width {
      grid-column: 1 / -1;
    }
    
    label {
      font-size: 14px;
      color: #666;
      margin-bottom: 8px;
      font-weight: 500;
    }
    
    input, textarea {
      padding: 12px;
      border: 1px solid #ddd;
      border-radius: 8px;
      font-size: 14px;
      transition: all 0.3s ease;
      
      &:focus {
        outline: none;
        border-color: #5B7FFF;
        box-shadow: 0 0 0 3px rgba(91, 127, 255, 0.1);
      }
      
      &.disabled-input {
        background: #f5f5f5;
        color: #999;
        cursor: not-allowed;
      }
      
      &.editing {
        border-color: #5B7FFF;
        background: #f0f4ff;
      }
      
      &.error {
        border-color: #ef4444;
        background: rgba(254, 226, 226, 0.5);
      }
    }
    
    textarea {
      resize: vertical;
      min-height: 80px;
    }
    
    .status-badge {
      padding: 8px 16px;
      border-radius: 20px;
      font-size: 14px;
      display: inline-block;
      width: fit-content;
      
      &.active {
        background: #d4edda;
        color: #155724;
      }
      
      &:not(.active) {
        background: #f8d7da;
        color: #721c24;
      }
    }
    
    .error-text {
      color: #ef4444;
      font-size: 12px;
      margin-top: 4px;
    }
  }
}

.action-buttons {
  margin-top: 32px;
  display: flex;
  gap: 12px;
  justify-content: center;
}

.btn {
  padding: 12px 32px;
  border: none;
  border-radius: 8px;
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
  font-weight: 500;
  
  &.btn-primary {
    background: #5B7FFF;
    color: white;
    
    &:hover {
      background: #4A6FE8;
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(91, 127, 255, 0.3);
    }
  }
  
  &.btn-success {
    background: #10b981;
    color: white;
    
    &:hover {
      background: #059669;
    }
  }
  
  &.btn-warning {
    background: #f59e0b;
    color: white;
    
    &:hover {
      background: #d97706;
    }
  }
  
  &.btn-cancel {
    background: #e5e7eb;
    color: #666;
    
    &:hover {
      background: #d1d5db;
    }
  }
  
  &:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }
}

// 模态框样式
.modal-overlay {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 1000;
}

.modal-content {
  background: white;
  border-radius: 16px;
  width: 90%;
  max-width: 500px;
  max-height: 90vh;
  overflow-y: auto;
}

.modal-header {
  padding: 24px;
  border-bottom: 1px solid #e5e7eb;
  display: flex;
  justify-content: space-between;
  align-items: center;
  
  h3 {
    margin: 0;
    font-size: 20px;
  }
}

.modal-body {
  padding: 24px;
  
  .form-group {
    margin-bottom: 20px;
  }
}

.modal-footer {
  padding: 24px;
  border-top: 1px solid #e5e7eb;
  display: flex;
  gap: 12px;
  justify-content: flex-end;
}

// 动画
.fade-enter-active, .fade-leave-active {
  transition: opacity 0.3s ease;
}

.fade-enter-from, .fade-leave-to {
  opacity: 0;
}

// 响应式
@media (max-width: 768px) {
  .info-form {
    grid-template-columns: 1fr;
  }
  
  .action-buttons {
    flex-direction: column;
  }
  
  .btn {
    width: 100%;
  }
}
</style>
