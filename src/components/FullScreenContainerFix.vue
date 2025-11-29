<template>
  <div id="dv-full-screen-container" ref="container">
    <slot v-if="ready"></slot>
  </div>
</template>

<script>
export default {
  name: 'FullScreenContainerFix',
  data() {
    return {
      ready: false,
      baseWidth: 0,
    };
  },
  mounted() {
    this.initConfig();
    this.setScale();
    this.ready = true;
    window.addEventListener('resize', this.setScale, { passive: true });
  },
  beforeDestroy() {
    window.removeEventListener('resize', this.setScale);
  },
  methods: {
    initConfig() {
      const el = this.$refs.container;
      const width = window.innerWidth;
      const height = window.innerHeight;
      this.baseWidth = document.documentElement.clientWidth || width;
      el.style.width = `${width}px`;
      el.style.height = `${height}px`;
    },
    setScale() {
      const el = this.$refs.container;
      if (!el) return;
      const currentWidth = document.documentElement.clientWidth || window.innerWidth;
      const scale = this.baseWidth ? currentWidth / this.baseWidth : 1;
      el.style.transform = `scale(${scale})`;
    }
  }
};
</script>

<style lang="scss" scoped>
#dv-full-screen-container {
  position: fixed;
  top: 0px;
  left: 0px;
  overflow: hidden;
  transform-origin: left top;
  z-index: 999;
}
</style>


