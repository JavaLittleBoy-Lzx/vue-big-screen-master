<template>
  <div class="circular-progress">
    <svg class="progress-ring" :width="size" :height="size">
      <!-- 渐变定义 -->
      <defs>
        <linearGradient :id="gradientId" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :style="`stop-color:${gradientColors.start};stop-opacity:1`" />
          <stop offset="50%" :style="`stop-color:${gradientColors.middle};stop-opacity:1`" />
          <stop offset="100%" :style="`stop-color:${gradientColors.end};stop-opacity:1`" />
        </linearGradient>
        <!-- 背景渐变 -->
        <linearGradient :id="`${gradientId}-bg`" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" :style="`stop-color:${backgroundColor};stop-opacity:0.3`" />
          <stop offset="100%" :style="`stop-color:${backgroundColor};stop-opacity:0.1`" />
        </linearGradient>
      </defs>
      
      <!-- 背景圆环 -->
      <circle
        class="progress-ring-background"
        :stroke="`url(#${gradientId}-bg)`"
        :stroke-width="strokeWidth"
        fill="transparent"
        :r="normalizedRadius"
        :cx="center"
        :cy="center"
      />
      <!-- 进度圆环 -->
      <circle
        class="progress-ring-circle"
        :stroke="useGradient ? `url(#${gradientId})` : color"
        :stroke-width="strokeWidth"
        fill="transparent"
        :r="normalizedRadius"
        :cx="center"
        :cy="center"
        :stroke-dasharray="circumference + ' ' + circumference"
        :stroke-dashoffset="strokeDashoffset"
        :style="ringStyle"
      />
    </svg>
    <div class="progress-text">
      <div class="label">{{ label }}</div>
      <div class="value">{{ value }}</div>
    </div>
    <!-- 添加科技感装饰 -->
    <div class="tech-decoration">
      <div class="ring ring-1"></div>
      <div class="ring ring-2"></div>
      <div class="ring ring-3"></div>
    </div>
  </div>
</template>

<script>
export default {
  name: "CircularProgress",
  props: {
    value: {
      type: Number,
      required: true
    },
    total: {
      type: Number,
      required: true
    },
    color: {
      type: String,
      default: '#3b82f6'
    },
    label: {
      type: String,
      default: ''
    },
    size: {
      type: Number,
      default: 120
    },
    strokeWidth: {
      type: Number,
      default: 12
    },
    backgroundColor: {
      type: String,
      default: 'rgba(255, 255, 255, 0.1)'
    },
    // 渐变相关 props
    useGradient: {
      type: Boolean,
      default: true
    },
    gradientColors: {
      type: Object,
      default: () => ({
        start: '#3b82f6',
        middle: '#8b5cf6',
        end: '#ec4899'
      })
    }
  },
  computed: {
    percentage() {
      return (this.value / this.total) * 100;
    },
    center() {
      return this.size / 2;
    },
    normalizedRadius() {
      return this.center - this.strokeWidth / 2;
    },
    circumference() {
      return this.normalizedRadius * 2 * Math.PI;
    },
    strokeDashoffset() {
      return this.circumference - (this.percentage / 100) * this.circumference;
    },
    gradientId() {
      return `gradient-${this._uid}`;
    },
    ringStyle() {
      const shadowColor = this.useGradient ? this.gradientColors.middle : this.color;
      return {
        filter: `drop-shadow(0 0 8px ${shadowColor}80)`,
        transition: 'stroke-dashoffset 0.5s ease-in-out'
      };
    }
  }
};
</script>

<style lang="scss" scoped>
.circular-progress {
  position: relative;
  width: 120px;
  height: 120px;
  display: flex;
  align-items: center;
  justify-content: center;
  
  .progress-ring {
    position: absolute;
    top: 0;
    left: 0;
    transform: rotate(-90deg); // 从顶部开始
    
    .progress-ring-background {
      opacity: 0.3;
      stroke-linecap: round;
    }
    
    .progress-ring-circle {
      stroke-linecap: round;
      transition: stroke-dashoffset 0.5s ease-in-out;
      filter: drop-shadow(0 0 6px currentColor);
    }
  }
  
  .progress-text {
    position: relative;
    z-index: 2;
    text-align: center;
    pointer-events: none;
    
    .label {
      font-size: 12px;
      color: #94a3b8;
      margin-bottom: 4px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }
    
    .value {
      font-size: 24px;
      color: #fff;
      font-weight: bold;
      text-shadow: 0 0 10px rgba(255, 255, 255, 0.3);
      line-height: 1;
    }
  }
  
  .tech-decoration {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    pointer-events: none;
    
    .ring {
      position: absolute;
      border-radius: 50%;
      border: 1px solid;
      animation: rotate 10s linear infinite;
      
      &.ring-1 {
        top: -8px;
        left: -8px;
        right: -8px;
        bottom: -8px;
        border-color: rgba(255, 255, 255, 0.08);
        animation-duration: 15s;
      }
      
      &.ring-2 {
        top: -16px;
        left: -16px;
        right: -16px;
        bottom: -16px;
        border-color: rgba(255, 255, 255, 0.04);
        animation-duration: 20s;
        animation-direction: reverse;
      }
      
      &.ring-3 {
        top: -24px;
        left: -24px;
        right: -24px;
        bottom: -24px;
        border-color: rgba(255, 255, 255, 0.02);
        animation-duration: 25s;
      }
    }
  }
  
  &:hover {
    .progress-ring-circle {
      filter: brightness(1.3) drop-shadow(0 0 12px currentColor);
      stroke-width: calc(var(--stroke-width, 12px) + 2px);
    }
    
    .tech-decoration .ring {
      animation-duration: 5s;
    }
  }
  
  // 渐变动画效果
  &.gradient-animated {
    .progress-ring-circle {
      animation: gradient-shift 3s ease-in-out infinite;
    }
  }
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

@keyframes gradient-shift {
  0%, 100% {
    filter: drop-shadow(0 0 6px currentColor) hue-rotate(0deg);
  }
  50% {
    filter: drop-shadow(0 0 10px currentColor) hue-rotate(20deg);
  }
}
</style>
