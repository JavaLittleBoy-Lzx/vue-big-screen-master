<template>
  <section class="cloud-bed">
    <div ref="box" class="cloud-box">
      <span
        v-for="(item, index) in words"
        :key="index"
        :style="{
          color: item.color,
          background: item.bgColor,
          fontSize: getFontSize(item) + 'px'
        }"
        @click="$emit('word-click', item)"
      >
        {{ item.name }}
      </span>
    </div>
  </section>
</template>

<script>
// 3D 词云：参考 CSDN 文中思路（球面分布+旋转），来源: https://blog.csdn.net/LS_952754/article/details/126619072
export default {
  name: "WordCloud3D",
  props: {
    words: {
      type: Array,
      default: () => []
    },
    activeName: {
      type: String,
      default: null
    },
    autoRotateSpeed: {
      type: Number,
      default: 0.55
    },
    updateInterval: {
      // 刷新间隔（毫秒），更小更流畅也更快
      type: Number,
      default: 18
    },
    minFont: {
      type: Number,
      default: 11
    },
    maxFont: {
      type: Number,
      default: 26
    },
    sphereScale: {
      // 球半径相对容器较小边的比例（更小 => 球更小）
      type: Number,
      default: 0.34
    },
    irregularMotion: {
      // 是否启用无规则轨迹
      type: Boolean,
      default: true
    },
    jitterAmplitude: {
      // 无规则扰动幅度（弧度），值越大越“乱”
      type: Number,
      default: 0.1
    },
    jitterSpeed: {
      // 无规则扰动速度倍数（影响抖动频率）
      type: Number,
      default: 0.4
    }
  },
  data() {
    return {
      timer: null,
      radius: 0,
      dtr: Math.PI / 180,
      active: true,
      lasta: 0,
      lastb: 0.3,
      tspeed: 0,
      mouseX: 0,
      mouseY: 0,
      dragging: false,
      lastMouseX: 0,
      lastMouseY: 0,
      onWindowMouseUp: null,
      tags: [],
      elSpans: null,
      box: null,
      sinA: 0,
      cosA: 0,
      sinB: 0,
      cosB: 0,
      sinC: 0,
      cosC: 0
    };
  },
  mounted() {
    this.$nextTick(() => {
      const w = this.$refs.box.offsetWidth;
      const h = this.$refs.box.offsetHeight;
      const shorter = Math.min(w, h) || w;
      this.radius = shorter * this.sphereScale;
      this.init();
    });
  },
  beforeDestroy() {
    if (this.timer) clearInterval(this.timer);
    if (this.onWindowMouseUp) {
      window.removeEventListener("mouseup", this.onWindowMouseUp);
      this.onWindowMouseUp = null;
    }
  },
  methods: {
    getFontSize(item) {
      // 更强对比度：严格按比例映射，并拉大范围
      const total = this.words.reduce((acc, w) => acc + (Number(w.value) || 0), 0);
      if (!total) return this.minFont;
      const ratio = Math.max(0, (Number(item.value) || 0) / total);
      // 动态放大 maxFont，使最大词显著放大
      const dynamicMax = Math.max(this.maxFont, this.minFont + (this.maxFont - this.minFont) * 1.4);
      return Math.round(this.minFont + ratio * (dynamicMax - this.minFont));
    },
    init() {
      this.box = this.$refs.box;
      this.elSpans = this.box.getElementsByTagName("span");
      this.tags = [];
      // 初始化无规则轨迹所需的随机相位与时间
      this._tNoise = 0;
      this._phaseA1 = Math.random() * Math.PI * 2;
      this._phaseA2 = Math.random() * Math.PI * 2;
      this._phaseB1 = Math.random() * Math.PI * 2;
      this._phaseB2 = Math.random() * Math.PI * 2;
      for (let i = 0; i < this.elSpans.length; i++) {
        const el = this.elSpans[i];
        this.tags.push({
          el,
          offsetWidth: el.offsetWidth,
          offsetHeight: el.offsetHeight
        });
      }
      this.sineCosine(0, 0, 0);
      this.positionAll();
      this.bindHover();
      this.timer = setInterval(this.update.bind(this), this.updateInterval);
    },
    bindHover() {
      this.box.onmousedown = (e) => {
        this.dragging = true;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      };
      this.onWindowMouseUp = () => {
        this.dragging = false;
      };
      window.addEventListener("mouseup", this.onWindowMouseUp);
      this.box.onmousemove = (e) => {
        if (!this.dragging) return;
        const dx = e.clientX - this.lastMouseX;
        const dy = e.clientY - this.lastMouseY;
        this.mouseX = dx;
        this.mouseY = dy;
        this.lastMouseX = e.clientX;
        this.lastMouseY = e.clientY;
      };
    },
    update() {
      let a, b;
      if (this.dragging) {
        a = -(Math.min(Math.max(-this.mouseY, -200), 200) / this.radius) * 0.1;
        b = (Math.min(Math.max(-this.mouseX, -200), 200) / this.radius) * 0.1;
      } else {
        // 未拖拽时自动旋转：支持无规则轨迹
        if (this.irregularMotion) {
          // 时间推进（依据刷新间隔与速度倍率）
          this._tNoise += (this.updateInterval / 1000) * this.jitterSpeed;
          const amp = this.jitterAmplitude;
          // 使用多频率正弦叠加形成“类噪声”的平滑随机轨迹
          a = 0.5 * amp * (Math.sin(this._tNoise * 0.9 + this._phaseA1) + Math.sin(this._tNoise * 1.7 + this._phaseA2));
          b = this.autoRotateSpeed + 0.5 * amp * (Math.sin(this._tNoise * 1.3 + this._phaseB1) + Math.sin(this._tNoise * 2.1 + this._phaseB2));
        } else {
          a = 0;
          b = this.autoRotateSpeed;
        }
      }
      this.lasta = a;
      this.lastb = b;
      if (Math.abs(a) < 0.0001 && Math.abs(b) < 0.0001) return;
      this.sineCosine(a, b, 0);
      for (let i = 0; i < this.tags.length; i++) {
        const tag = this.tags[i];
        const rx1 = tag.cx * this.cosA + tag.cz * -this.sinA;
        const ry1 = tag.cy;
        const rz1 = tag.cx * this.sinA + tag.cz * this.cosA;
        const rx2 = rx1;
        const ry2 = ry1 * this.cosB + rz1 * this.sinB;
        const rz2 = ry1 * -this.sinB + rz1 * this.cosB;
        tag.cx = rx2;
        tag.cy = ry2;
        tag.cz = rz2;

        const per = 300 / (300 + rz2);
        const x = tag.cx * per + this.box.offsetWidth / 2 - tag.offsetWidth / 2;
        const y = tag.cy * per + this.box.offsetHeight / 2 - tag.offsetHeight / 2;
        const word = this.words[i] || {};
        const isActive = !!this.activeName && word.name === this.activeName;
        const scale = isActive ? 1.18 : 1.0;
        const baseOpacity = (per - 0.4) / (1 - 0.4);
        const opacity = Math.max(0, Math.min(1, isActive ? baseOpacity : baseOpacity * 0.75));
        tag.el.style.transform = `translate3d(${x}px, ${y}px, 0) scale(${scale})`;
        tag.el.style.opacity = String(opacity);
        tag.el.style.zIndex = String(~~(per * 100));
        if (isActive) {
          tag.el.style.boxShadow = "0 0 0 2px rgba(255,255,255,0.35) inset";
          tag.el.style.fontWeight = "700";
        } else {
          tag.el.style.boxShadow = "none";
          tag.el.style.fontWeight = "500";
        }
      }
    },
    positionAll() {
      const l = this.tags.length;
      for (let i = 0; i < l; i++) {
        const phi = Math.acos(-1 + (2 * (i + 1) - 1) / l);
        const theta = Math.sqrt(l * Math.PI) * phi;
        const x = this.radius * Math.cos(theta) * Math.sin(phi);
        const y = this.radius * Math.sin(theta) * Math.sin(phi);
        const z = this.radius * Math.cos(phi);
        const tag = this.tags[i];
        tag.cx = x;
        tag.cy = y;
        tag.cz = z;
        tag.el.style.position = "absolute";
        tag.el.style.left = "0";
        tag.el.style.top = "0";
      }
    },
    sineCosine(a, b, c) {
      this.sinA = Math.sin(a);
      this.cosA = Math.cos(a);
      this.sinB = Math.sin(b);
      this.cosB = Math.cos(b);
      this.sinC = Math.sin(c);
      this.cosC = Math.cos(c);
    }
  }
};
</script>

<style scoped>
.cloud-bed {
  width: 150%;
  height: 100%;
  position: relative;
}
.cloud-box {
  width: 120%;
  height: 100%;
  position: relative;
  overflow: hidden;
}
.cloud-box span {
  display: inline-block;
  padding: 2px 7px;
  border-radius: 12px;
  font-size: 11px;
  cursor: pointer;
  user-select: none;
  transition: transform 0.2s ease;
  white-space: nowrap;
}
.cloud-box span:hover {
  transform: scale(1.08);
}
</style>


