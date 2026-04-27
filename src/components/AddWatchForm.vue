<template>
  <div class="add-watch-modal">
    <div class="modal-overlay" @click="$emit('close')"></div>
    
    <div class="modal-content" @click.stop>
      <div class="modal-header">
        <span class="modal-title">添加关注对象</span>
        <button class="btn-close" @click="$emit('close')">×</button>
      </div>

      <div class="modal-body">
        <!-- 类型选择 -->
        <div class="type-selector">
          <button 
            class="type-btn"
            :class="{ active: formData.watch_type === 'idcard' }"
            @click="formData.watch_type = 'idcard'">
            <span class="type-icon">👤</span>
            <span>身份证号</span>
          </button>
          <button 
            class="type-btn"
            :class="{ active: formData.watch_type === 'plate' }"
            @click="formData.watch_type = 'plate'">
            <span class="type-icon">🚗</span>
            <span>车牌号</span>
          </button>
        </div>

        <!-- 表单 -->
        <div class="form-content">
          <div class="form-group">
            <label class="form-label">
              {{ formData.watch_type === 'idcard' ? '身份证号' : '车牌号' }}
              <span class="required">*</span>
            </label>
            <input 
              v-model="formData.watch_value"
              :placeholder="formData.watch_type === 'idcard' ? '请输入18位身份证号' : '如：黑A12345'"
              :maxlength="formData.watch_type === 'idcard' ? 18 : 10"
              :class="['form-input', { 'input-error': validationError }]"
              @input="handleInput"
              @blur="validateInput">
            <div v-if="validationError" class="error-message">
              <span class="error-icon">⚠️</span>
              {{ validationError }}
            </div>
          </div>

          <div class="form-group">
            <label class="form-label">备注信息</label>
            <textarea 
              v-model="formData.remark"
              placeholder="选填，如：重点关注人员、领导用车等"
              rows="3"
              maxlength="200"
              class="form-textarea"></textarea>
            <div class="char-count">{{ formData.remark.length }}/200</div>
          </div>
        </div>
      </div>

      <div class="modal-footer">
        <button class="btn-cancel" @click="$emit('close')">取消</button>
        <button 
          class="btn-submit" 
          :disabled="!canSubmit"
          @click="handleSubmit">
          添加关注
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import axios from 'axios';

export default {
  name: 'AddWatchForm',
  data() {
    return {
      formData: {
        watch_type: 'plate',
        watch_value: '',
        remark: ''
      },
      submitting: false,
      validationError: ''
    };
  },
  computed: {
    canSubmit() {
      if (!this.formData.watch_value.trim()) {
        return false;
      }
      
      // 格式验证
      if (this.formData.watch_type === 'idcard') {
        return this.validateIdCard(this.formData.watch_value);
      } else {
        return this.validatePlateNumber(this.formData.watch_value);
      }
    }
  },
  watch: {
    // 监听类型切换，自动清空输入内容
    'formData.watch_type'() {
      this.formData.watch_value = '';
      this.formData.remark = '';
      this.validationError = '';
    }
  },
  methods: {
    // 车牌号格式验证
    validatePlateNumber(plate) {
      if (!plate) return false;
      // 中国车牌格式：省份简称(汉字) + 地区代码(字母) + 5-6位数字或字母
      const plateRegex = /^[一-龥]{1}[A-Z]{1}[A-HJ-NP-Z0-9]{5,6}$/;
      return plateRegex.test(plate);
    },
    
    // 身份证号格式验证
    validateIdCard(idCard) {
      if (!idCard || idCard.length !== 18) return false;
      
      // 基本格式：17位数字 + 1位数字或X
      const idCardRegex = /^[1-9]\d{5}(18|19|20)\d{2}(0[1-9]|1[0-2])(0[1-9]|[12]\d|3[01])\d{3}[0-9Xx]$/;
      if (!idCardRegex.test(idCard)) return false;
      
      // 校验码验证
      const factors = [7, 9, 10, 5, 8, 4, 2, 1, 6, 3, 7, 9, 10, 5, 8, 4, 2];
      const checkCodes = ['1', '0', 'X', '9', '8', '7', '6', '5', '4', '3', '2'];
      
      let sum = 0;
      for (let i = 0; i < 17; i++) {
        sum += parseInt(idCard[i]) * factors[i];
      }
      
      const checkCode = checkCodes[sum % 11];
      return checkCode === idCard[17].toUpperCase();
    },
    
    // 输入时验证
    validateInput() {
      const value = this.formData.watch_value.trim();
      if (!value) {
        this.validationError = '';
        return;
      }
      
      if (this.formData.watch_type === 'idcard') {
        if (value.length !== 18) {
          this.validationError = '身份证号必须是18位';
        } else if (!this.validateIdCard(value)) {
          this.validationError = '身份证号格式不正确或校验位错误';
        } else {
          this.validationError = '';
        }
      } else {
        if (value.length < 7) {
          this.validationError = '车牌号至少为7位';
        } else if (!this.validatePlateNumber(value)) {
          this.validationError = '车牌号格式不正确，如：黑A12345';
        } else {
          this.validationError = '';
        }
      }
    },
    
    handleInput() {
      // 车牌号自动转大写
      if (this.formData.watch_type === 'plate') {
        this.formData.watch_value = this.formData.watch_value.toUpperCase();
      }
      // 清除验证错误提示
      this.validationError = '';
    },
    async handleSubmit() {
      // 验证输入
      this.validateInput();
      if (this.validationError || !this.canSubmit || this.submitting) {
        return;
      }
      
      // 如果是身份证号，先提醒用户信息将被加密
      if (this.formData.watch_type === 'idcard') {
        try {
          // 显示弹窗
          const confirmResult = this.$confirm(
            '为保护个人隐私，添加后身份证号将在系统中进行加密显示，仅显示部分数字。是否继续添加？', 
            '隐私保护提醒', 
            {
              confirmButtonText: '确定添加',
              cancelButtonText: '取消',
              type: 'info',
              customClass: 'privacy-confirm-dialog',
              center: false,
              showClose: false
            }
          );
          
          // 多次尝试调整弹窗位置，确保显示在最前面
          setTimeout(() => {
            const adjustPosition = () => {
              // 查找所有可能的弹窗元素
              const dialog = document.querySelector('.privacy-confirm-dialog');
              const wrapper = document.querySelector('.el-message-box__wrapper');
              const msgBoxWrapper = document.querySelector('.el-message-box-wrapper');
              
              // 设置弹窗本体
              if (dialog) {
                dialog.style.cssText = `
                  position: relative !important;
                  z-index: 1 !important;
                  margin: 0 auto !important;
                `;
              }
              
              // 设置Element UI的wrapper
              if (wrapper) {
                wrapper.style.cssText = `
                  position: fixed !important;
                  top: 0 !important;
                  left: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                  z-index: 100000 !important;
                  display: flex !important;
                  align-items: flex-start !important;
                  justify-content: center !important;
                  padding-top: 200px !important;
                  background-color: rgba(0, 0, 0, 0.5) !important;
                `;
              }
              
              // 设置外层wrapper
              if (msgBoxWrapper) {
                msgBoxWrapper.style.cssText = `
                  position: fixed !important;
                  top: 0 !important;
                  left: 0 !important;
                  width: 100% !important;
                  height: 100% !important;
                  z-index: 100000 !important;
                  display: flex !important;
                  align-items: flex-start !important;
                  justify-content: center !important;
                  padding-top: 200px !important;
                  background-color: rgba(0, 0, 0, 0.5) !important;
                `;
              }
            };
            
            adjustPosition();
            setTimeout(adjustPosition, 50);
            setTimeout(adjustPosition, 100);
            setTimeout(adjustPosition, 200);
            setTimeout(adjustPosition, 300);
          }, 10);
          
          await confirmResult;
        } catch {
          // 用户取消，不继续执行
          return;
        }
      }
      
      this.submitting = true;
      
      try {
        console.log('📤 [添加关注] 发送请求:', this.formData);
        const response = await axios.post('http://localhost:8675/parking/focus/watch/add', this.formData);
        
        console.log('📥 [添加关注] 收到响应:', response);
        console.log('📦 [添加关注] 响应数据:', response.data);
        
        // 处理嵌套的响应格式
        // 格式1: {code: "0", data: {code: 200, message: "...", data: {...}}}
        // 格式2: {code: 200, message: "..."}
        let resultCode, resultMessage;
        
        if (response.data.code === "0" && response.data.data) {
          // 嵌套格式
          resultCode = response.data.data.code;
          resultMessage = response.data.data.message;
          console.log('🔍 [添加关注] 使用嵌套格式，业务状态码:', resultCode);
        } else {
          // 直接格式
          resultCode = response.data.code;
          resultMessage = response.data.message;
          console.log('🔍 [添加关注] 使用直接格式，业务状态码:', resultCode);
        }
        
        if (resultCode === 200) {
          console.log('✅ [添加关注] 成功');
          this.$message.success({
            message: '添加成功',
            duration: 1500
          });
          this.$emit('added');
          this.$emit('close');
        } else if (resultCode === 409) {
          console.log('⚠️ [添加关注] 重复添加');
          this.$message.warning({
            message: '该对象已在关注列表中',
            duration: 2000
          });
        } else {
          console.log('❌ [添加关注] 其他错误，状态码:', resultCode);
          this.$message.error(resultMessage || '添加失败');
        }
      } catch (error) {
        console.error('❌ [添加关注] 捕获异常:', error);
        console.error('🔍 [添加关注] 异常详情:', {
          response: error.response,
          data: error.response?.data,
          status: error.response?.status
        });
        
        // 检查是否是重复添加的409错误
        if (error.response && error.response.data) {
          console.log('📦 [添加关注] 异常响应数据:', error.response.data);
          if (error.response.data.code === 409) {
            console.log('⚠️ [添加关注] 从异常中检测到重复添加');
            this.$message.warning('该对象已在关注列表中');
          } else {
            this.$message.error(error.response.data.message || '添加失败');
          }
        } else {
          this.$message.error('添加失败，请检查网络连接');
        }
      } finally {
        this.submitting = false;
      }
    }
  }
};
</script>

<style scoped>
.add-watch-modal {
  position: fixed;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  z-index: 10000;
}

.modal-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background: rgba(0, 0, 0, 0.7);
  backdrop-filter: blur(4px);
}

.modal-content {
  position: absolute;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  width: 90%;
  max-width: 600px;
  background: linear-gradient(135deg, #1a1a2e 0%, #16213e 100%);
  border: 2px solid rgba(0, 255, 255, 0.3);
  border-radius: 12px;
  box-shadow: 0 8px 32px rgba(0, 255, 255, 0.2);
}

.modal-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20px 24px;
  border-bottom: 1px solid rgba(0, 255, 255, 0.2);
}

.modal-title {
  font-size: 20px;
  font-weight: bold;
  color: #00ffff;
}

.btn-close {
  width: 36px;
  height: 36px;
  background: rgba(255, 255, 255, 0.1);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  font-size: 24px;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-close:hover {
  background: rgba(255, 0, 0, 0.2);
  border-color: rgba(255, 0, 0, 0.4);
}

.modal-body {
  padding: 24px;
}

.type-selector {
  display: flex;
  gap: 12px;
  margin-bottom: 24px;
}

.type-btn {
  flex: 1;
  padding: 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 2px solid rgba(255, 255, 255, 0.1);
  border-radius: 8px;
  color: rgba(255, 255, 255, 0.7);
  font-size: 16px;
  cursor: pointer;
  transition: all 0.3s;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 8px;
}

.type-btn:hover {
  background: rgba(255, 255, 255, 0.1);
  border-color: rgba(0, 255, 255, 0.3);
}

.type-btn.active {
  background: linear-gradient(135deg, rgba(0, 201, 255, 0.2) 0%, rgba(0, 102, 255, 0.2) 100%);
  border-color: #00c9ff;
  color: #00ffff;
  font-weight: bold;
}

.type-icon {
  font-size: 32px;
}

.form-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.form-label {
  color: rgba(255, 255, 255, 0.8);
  font-size: 14px;
  font-weight: bold;
}

.required {
  color: #ff4d4d;
  margin-left: 4px;
}

.form-input,
.form-textarea {
  padding: 12px 16px;
  background: rgba(255, 255, 255, 0.05);
  border: 1px solid rgba(255, 255, 255, 0.2);
  border-radius: 6px;
  color: white;
  font-size: 14px;
  outline: none;
  transition: all 0.3s ease;
}

.form-input:focus,
.form-textarea:focus {
  border-color: #00c9ff;
  background: rgba(255, 255, 255, 0.1);
}

.form-input::placeholder,
.form-textarea::placeholder {
  color: rgba(255, 255, 255, 0.3);
}

.form-textarea {
  resize: vertical;
  min-height: 80px;
  font-family: inherit;
}

.char-count {
  text-align: right;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.4);
}

/* 输入错误样式 */
.input-error {
  border-color: #ff4d4d !important;
  background: rgba(255, 77, 77, 0.1) !important;
  animation: shake 0.3s ease-in-out;
}

@keyframes shake {
  0%, 100% { transform: translateX(0); }
  25% { transform: translateX(-5px); }
  75% { transform: translateX(5px); }
}

.error-message {
  display: flex;
  align-items: center;
  gap: 6px;
  color: #ff4d4d;
  font-size: 12px;
  margin-top: -4px;
  animation: fadeIn 0.3s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; transform: translateY(-5px); }
  to { opacity: 1; transform: translateY(0); }
}

.error-icon {
  font-size: 14px;
}

.modal-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
  padding: 20px 24px;
  border-top: 1px solid rgba(0, 255, 255, 0.2);
}

.btn-cancel,
.btn-submit {
  padding: 10px 24px;
  border: none;
  border-radius: 6px;
  font-size: 14px;
  font-weight: bold;
  cursor: pointer;
  transition: all 0.3s;
}

.btn-cancel {
  background: rgba(255, 255, 255, 0.1);
  color: rgba(255, 255, 255, 0.8);
  border: 1px solid rgba(255, 255, 255, 0.2);
}

.btn-cancel:hover {
  background: rgba(255, 255, 255, 0.15);
}

.btn-submit {
  background: linear-gradient(135deg, #00c9ff 0%, #0066ff 100%);
  color: white;
}

.btn-submit:hover:not(:disabled) {
  transform: translateY(-2px);
  box-shadow: 0 4px 12px rgba(0, 201, 255, 0.4);
}

.btn-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

/* 隐私保护弹窗样式 - 全局覆盖 */
.privacy-confirm-dialog.top-position {
  position: fixed !important;
  top: 10vh !important;
  left: 50% !important;
  transform: translateX(-50%) !important;
  z-index: 9999 !important;
  margin: 0 !important;
}

.privacy-confirm-dialog .el-message-box {
  background: rgba(26, 35, 56, 0.95) !important;
  border: 1px solid rgba(0, 255, 255, 0.3) !important;
  border-radius: 12px !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.6) !important;
  backdrop-filter: blur(10px) !important;
}

.privacy-confirm-dialog .el-message-box__header {
  background: linear-gradient(135deg, rgba(0, 201, 255, 0.2) 0%, rgba(0, 102, 255, 0.2) 100%) !important;
  border-bottom: 1px solid rgba(0, 255, 255, 0.2) !important;
  padding: 20px 24px 16px !important;
}

.privacy-confirm-dialog .el-message-box__title {
  color: #00ffff !important;
  font-size: 16px !important;
  font-weight: bold !important;
}

.privacy-confirm-dialog .el-message-box__content {
  padding: 20px 24px !important;
  color: rgba(255, 255, 255, 0.9) !important;
  line-height: 1.6 !important;
}

.privacy-confirm-dialog .el-message-box__btns {
  padding: 16px 24px 20px !important;
  border-top: 1px solid rgba(0, 255, 255, 0.2) !important;
}

.privacy-confirm-dialog .el-button--primary {
  background: linear-gradient(135deg, #00c9ff 0%, #0066ff 100%) !important;
  border: none !important;
  color: white !important;
  font-weight: bold !important;
  padding: 10px 20px !important;
  border-radius: 6px !important;
}

.privacy-confirm-dialog .el-button--default {
  background: rgba(255, 255, 255, 0.1) !important;
  border: 1px solid rgba(255, 255, 255, 0.2) !important;
  color: rgba(255, 255, 255, 0.8) !important;
  font-weight: bold !important;
  padding: 10px 20px !important;
  border-radius: 6px !important;
}

.privacy-confirm-dialog .el-button--primary:hover {
  transform: translateY(-2px) !important;
  box-shadow: 0 4px 12px rgba(0, 201, 255, 0.4) !important;
}

.privacy-confirm-dialog .el-button--default:hover {
  background: rgba(255, 255, 255, 0.15) !important;
}
</style>
