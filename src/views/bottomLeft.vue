<template>
  <div id="bottomLeft">
    <div class="bg-color-black ">
      <div class="d-flex pt-2 pl-2">
        <span style="color:#5cd9e8">
          <icon name="chart-bar"></icon>
        </span>
        <div class="d-flex">
          <span class="fs-xl text mx-2">📊 进出场流量对比分析</span>
        </div>
      </div>
      <div class="chart-box">
        <bottomLeftChart :flowCompareData="flowCompareData" />
      </div>
    </div>
  </div>
</template>

<script>
import bottomLeftChart from "@/components/echart/bottom/bottomLeftChart";
export default {
  props: {
    flowCompareData: {
      type: Object,
      default: () => ({
        channels: [
          { name: '1号门', entry: 45, exit: 32 },
          { name: '2号门', entry: 38, exit: 41 },
          { name: '3号门', entry: 52, exit: 28 },
          { name: '4号门', entry: 29, exit: 35 },
          { name: '5号门', entry: 41, exit: 33 }
        ],
        statistics: {
          balanceRatio: '0.95',
          peakEntryTime: '8:00',
          peakEntryCount: 156,
          peakExitTime: '18:00',
          peakExitCount: 142
        }
      })
    }
  },
  components: {
    bottomLeftChart
  },
  mounted() {
  },
  methods: {}
};
</script>

<style lang="scss">
#bottomLeft {
  padding: 1.5rem 1rem;
  height: 420px;
  min-width: 500px;
  border-radius: 5px;
  .bg-color-black {
    height: 385px;
    border-radius: 10px;
  }
  .text {
    color: #c3cbde;
  }
  .chart-box {
    margin-top: -2rem;
    width: 230px;
    height: 170px;
    .active-ring-name {
      padding-top: 10px;
    }
  }
}
</style>