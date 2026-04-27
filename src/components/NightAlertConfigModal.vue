<template>
  <div class="config-modal">
    <!-- 遮罩 -->
    <div class="modal-overlay" @click="closeModal"></div>

    <!-- 弹窗内容 -->
    <div class="modal-content" @click.stop>
      <!-- 头部 -->
      <div class="modal-header">
        <span class="header-icon">⚙️</span>
        <span class="header-title">夜间提醒配置</span>
        <button class="btn-close" @click="closeModal">×</button>
      </div>

      <!-- 表单内容 -->
      <div class="modal-body">
        <div class="form-item">
          <label class="form-label">
            <span class="label-icon">🔔</span>
            启用夜间提醒
          </label>
          <div class="switch-wrapper">
            <label class="switch">
              <input type="checkbox" v-model="config.enabled" :true-value="1" :false-value="0" />
              <span class="slider"></span>
            </label>
            <span class="switch-text">{{ config.enabled === 1 ? '已启用' : '已禁用' }}</span>
          </div>
        </div>

        <div class="form-item time-row">
          <div class="time-field">
            <label class="form-label">
              <span class="label-icon">🌙</span>
              夜间开始时间
            </label>
            <div class="time-input-wrapper">
              <input
                type="time"
                v-model="config.nightStartTime"
                class="time-input"
              />
            </div>
          </div>
          <div class="time-field">
            <label class="form-label">
              <span class="label-icon">☀️</span>
              夜间结束时间
            </label>
            <div class="time-input-wrapper">
              <input
                type="time"
                v-model="config.nightEndTime"
                class="time-input"
              />
            </div>
          </div>
        </div>

        <div class="form-item">
          <label class="form-label">
            <span class="label-icon">🚪</span>
            提醒出口通道
          </label>
          <div class="channel-select-wrapper">
            <!-- 通道选择网格 -->
            <div class="channel-grid" v-if="channelList.length > 0">
              <div
                v-for="ch in channelList"
                :key="ch"
                class="channel-chip"
                :class="{ 'selected': config.alertChannels.includes(ch) }"
                @click="toggleChannel(ch)"
              >
                <span class="channel-check" v-if="config.alertChannels.includes(ch)">✓</span>
                <span class="channel-name">{{ ch }}</span>
              </div>
            </div>
            <div v-else class="channel-empty">暂无可用通道</div>
            <div class="selected-channels" v-if="config.alertChannels && config.alertChannels.length > 0">
              已选择 {{ config.alertChannels.length }} 个通道：{{ config.alertChannels.join(', ') }}
            </div>
          </div>
        </div>

        <div class="info-box">
          <span class="info-icon">💡</span>
          <div class="info-content">
            <p><strong>夜间时间段说明：</strong></p>
            <p>• 如果开始时间晚于结束时间（如22:00-06:00），表示跨天</p>
            <p>• 在此时段内，学生出校时将触发提醒</p>
            <p>• 提醒会通过WebSocket实时推送到前端</p>
          </div>
        </div>
      </div>

      <!-- 底部按钮 -->
      <div class="modal-footer">
        <button class="btn-cancel" @click="closeModal">取消</button>
        <button class="btn-save" @click="saveConfig" :disabled="saving">
          <span v-if="saving">保存中...</span>
          <span v-else>保存配置</span>
        </button>
      </div>
    </div>
  </div>
</template>

<script>
import nightAlertService from '@/services/nightAlertService';

export default {
  name: 'NightAlertConfigModal',
  data() {
    return {
      config: {
        enabled: 1,
        nightStartTime: '22:00',
        nightEndTime: '06:00',
        alertChannels: []  // 修改为数组类型
      },
      channelList: [],  // 可用通道列表
      customChannels: '',  // 手动输入的通道
      saving: false
    };
  },
  mounted() {
    this.loadConfig();
    this.loadChannels();
  },
  methods: {
    /**
     * 加载通道列表
     */
    async loadChannels() {
      try {
        const response = await nightAlertService.getChannels();
        const result = response.data;

        if (result.code === 200 || result.code === '0') {
          const allChannels = result.data?.channels || [];
          // 只显示出口通道
          this.channelList = allChannels.filter(ch => ch.includes('出口'));
          console.log('📋 [夜间提醒配置] 出口通道列表加载成功', this.channelList);
          // 默认全选所有出口通道
          this.config.alertChannels = [...this.channelList];
        }
      } catch (error) {
        console.error('❌ [夜间提醒配置] 加载通道列表失败', error);
      }
    },

    /**
     * 同步手动输入的通道到配置
     */
    syncCustomChannels() {
      if (this.customChannels && this.customChannels.trim()) {
        // 将手动输入的通道添加到配置中
        const inputChannels = this.customChannels.split(',').map(ch => ch.trim()).filter(ch => ch !== '');
        // 合并已有的选择和手动输入
        const merged = [...new Set([...this.config.alertChannels, ...inputChannels])];
        this.config.alertChannels = merged;
      }
    },

    /**
     * 切换通道选择状态
     */
    toggleChannel(channel) {
      const index = this.config.alertChannels.indexOf(channel);
      if (index > -1) {
        this.config.alertChannels.splice(index, 1);
      } else {
        this.config.alertChannels.push(channel);
      }
    },

    /**
     * 加载配置
     */
    async loadConfig() {
      try {
        const response = await nightAlertService.getConfig();
        const result = response.data;

        if (result.code === 200 || result.code === '0') {
          const data = result.data || {};
          // 将逗号分隔的字符串转为数组
          let alertChannels = [];
          if (data.alertChannels && data.alertChannels !== '') {
            alertChannels = data.alertChannels.split(',').map(ch => ch.trim()).filter(ch => ch !== '');
          }
          this.config = {
            enabled: data.enabled ?? 1,
            nightStartTime: data.nightStartTime || '22:00',
            nightEndTime: data.nightEndTime || '06:00',
            alertChannels: alertChannels
          };
          this.customChannels = data.alertChannels || '';
          console.log('⚙️ [夜间提醒配置] 加载成功', this.config);
        }
      } catch (error) {
        console.error('❌ [夜间提醒配置] 加载失败', error);
        this.$message.error('加载配置失败');
      }
    },

    /**
     * 保存配置
     */
    async saveConfig() {
      this.saving = true;
      try {
        // 将数组转为逗号分隔的字符串
        const configToSave = {
          ...this.config,
          alertChannels: this.config.alertChannels.join(',')
        };
        const response = await nightAlertService.updateConfig(configToSave);
        const result = response.data;

        if (result.code === 200 || result.code === '0') {
          console.log('✅ [夜间提醒配置] 保存成功', this.config);
          this.$message.success('配置保存成功');
          this.$emit('updated');
          this.closeModal();
        } else {
          this.$message.error(result.message || '保存配置失败');
        }
      } catch (error) {
        console.error('❌ [夜间提醒配置] 保存失败', error);
        this.$message.error('保存配置失败');
      } finally {
        this.saving = false;
      }
    },

    /**
     * 关闭弹窗
     */
    closeModal() {
      this.$emit('close');
    }
  }
};
</script>

<style lang="scss" scoped>
.config-modal {
  position: fixed;
  inset: 0;
  z-index: 10000;
  display: flex;
  align-items: center;
  justify-content: center;

  .modal-overlay {
    position: absolute;
    inset: 0;
    background: rgba(0, 0, 0, 0.7);
    backdrop-filter: blur(5px);
  }

  .modal-content {
    position: relative;
    width: 90%;
    max-width: 650px;
    background: rgba(11, 19, 42, 0.98);
    border: 1px solid #1e3a8a;
    border-radius: 12px;
    overflow: hidden;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 15px 20px;
    border-bottom: 1px solid #1e3a8a;
    background: rgba(11, 19, 42, 0.9);

    .header-icon {
      font-size: 20px;
    }

    .header-title {
      flex: 1;
      font-size: 18px;
      font-weight: bold;
      color: #fff;
    }

    .btn-close {
      width: 32px;
      height: 32px;
      border: none;
      border-radius: 6px;
      background: rgba(239, 68, 68, 0.2);
      color: #ef4444;
      font-size: 18px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s;

      &:hover {
        background: rgba(239, 68, 68, 0.4);
      }
    }
  }

  .modal-body {
    padding: 20px;

    .form-item {
      margin-bottom: 20px;
      display: flex;
      flex-direction: column;

      &.time-row {
        flex-direction: row;
        gap: 20px;
        align-items: flex-start;

        .time-field {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 8px;
        }
      }

      .form-label {
        display: flex;
        align-items: center;
        gap: 8px;
        font-size: 14px;
        font-weight: bold;
        color: #e2e8f0;
        margin-bottom: 8px;

        .label-icon {
          font-size: 16px;
        }
      }

      .switch-wrapper {
        display: flex;
        align-items: center;
        gap: 12px;

        .switch {
          position: relative;
          width: 50px;
          height: 26px;

          input {
            opacity: 0;
            width: 0;
            height: 0;

            &:checked + .slider {
              background: #3b82f6;

              &:before {
                transform: translateX(24px);
              }
            }
          }

          .slider {
            position: absolute;
            cursor: pointer;
            inset: 0;
            background: #374151;
            border-radius: 26px;
            transition: all 0.3s;

            &:before {
              content: '';
              position: absolute;
              height: 20px;
              width: 20px;
              left: 3px;
              bottom: 3px;
              background: #fff;
              border-radius: 50%;
              transition: all 0.3s;
            }
          }
        }

        .switch-text {
          font-size: 13px;
          color: #94a3b8;
        }
      }

      .time-input-wrapper {
        display: flex;
        flex-direction: column;
        gap: 5px;

        .time-input {
          background: rgba(11, 19, 42, 0.9);
          border: 1px solid #1e3a8a;
          border-radius: 8px;
          color: #fff;
          padding: 10px 15px;
          font-size: 16px;
          font-weight: bold;
          font-family: 'Microsoft YaHei', 'PingFang SC', sans-serif;
          transition: all 0.3s;

          &:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
          }
        }

        /* Chrome/Safari/Edge 时间选择器箭头颜色 */
        &::-webkit-calendar-picker-indicator {
          filter: invert(0.7);
          cursor: pointer;
        }
      }

      .channel-select-wrapper {
        display: flex;
        flex-direction: column;
        gap: 8px;

        .channel-grid {
          display: flex;
          flex-wrap: wrap;
          gap: 8px;
          max-height: 220px;
          overflow-y: auto;
          padding: 10px;
          background: rgba(11, 19, 42, 0.6);
          border: 1px solid #1e3a8a;
          border-radius: 8px;

          &::-webkit-scrollbar {
            width: 6px;
          }
          &::-webkit-scrollbar-track {
            background: rgba(11, 19, 42, 0.9);
            border-radius: 3px;
          }
          &::-webkit-scrollbar-thumb {
            background: #1e3a8a;
            border-radius: 3px;
            &:hover {
              background: #3b82f6;
            }
          }
        }

        .channel-chip {
          display: flex;
          align-items: center;
          gap: 4px;
          padding: 6px 12px;
          background: rgba(30, 58, 138, 0.3);
          border: 1px solid #1e3a8a;
          border-radius: 16px;
          cursor: pointer;
          transition: all 0.2s;
          font-size: 12px;
          color: #94a3b8;

          .channel-check {
            color: #3b82f6;
            font-weight: bold;
          }

          .channel-name {
            white-space: nowrap;
          }

          &:hover {
            background: rgba(59, 130, 246, 0.2);
            border-color: #3b82f6;
          }

          &.selected {
            background: rgba(59, 130, 246, 0.3);
            border-color: #3b82f6;
            color: #fff;

            .channel-check {
              color: #60a5fa;
            }
          }
        }

        .channel-empty {
          padding: 20px;
          text-align: center;
          color: #64748b;
          background: rgba(11, 19, 42, 0.6);
          border: 1px dashed #1e3a8a;
          border-radius: 8px;
          font-size: 13px;
        }

        .time-input {
          background: rgba(11, 19, 42, 0.9);
          border: 1px solid #1e3a8a;
          border-radius: 8px;
          color: #fff;
          padding: 10px 15px;
          font-size: 14px;
          transition: all 0.3s;

          &:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
          }
        }

        .time-hint {
          font-size: 11px;
          color: #64748b;
        }

        .channel-input {
          background: rgba(11, 19, 42, 0.9);
          border: 1px solid #1e3a8a;
          border-radius: 8px;
          color: #fff;
          padding: 10px 15px;
          font-size: 13px;
          transition: all 0.3s;

          &::placeholder {
            color: #64748b;
          }

          &:focus {
            outline: none;
            border-color: #3b82f6;
            box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.2);
          }
        }

        .selected-channels {
          font-size: 11px;
          color: #3b82f6;
          background: rgba(59, 130, 246, 0.1);
          padding: 8px 12px;
          border-radius: 6px;
          word-break: break-all;
          line-height: 1.4;
        }
      }
    }

    .info-box {
      display: flex;
      gap: 12px;
      padding: 15px;
      background: rgba(59, 130, 246, 0.1);
      border: 1px solid rgba(59, 130, 246, 0.3);
      border-radius: 8px;
      margin-top: 20px;

      .info-icon {
        font-size: 20px;
        flex-shrink: 0;
      }

      .info-content {
        p {
          margin: 0 0 5px 0;
          font-size: 12px;
          color: #94a3b8;
          line-height: 1.5;

          &:last-child {
            margin-bottom: 0;
          }

          strong {
            color: #e2e8f0;
          }
        }
      }
    }
  }

  .modal-footer {
    display: flex;
    justify-content: flex-end;
    gap: 12px;
    padding: 15px 20px;
    border-top: 1px solid #1e3a8a;
    background: rgba(11, 19, 42, 0.9);

    .btn-cancel,
    .btn-save {
      padding: 10px 20px;
      border-radius: 8px;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.3s;
    }

    .btn-cancel {
      background: transparent;
      border: 1px solid #475569;
      color: #94a3b8;

      &:hover {
        background: rgba(71, 85, 105, 0.2);
        border-color: #64748b;
      }
    }

    .btn-save {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border: none;
      color: #fff;

      &:hover:not(:disabled) {
        background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
        box-shadow: 0 4px 15px rgba(59, 130, 246, 0.4);
      }

      &:disabled {
        opacity: 0.6;
        cursor: not-allowed;
      }
    }
  }
}
</style>
