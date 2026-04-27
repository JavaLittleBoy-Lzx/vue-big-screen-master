<template>
  <div id="centreRight2">
    <div class="revenue-container">
      <div class="chart-header">
        <div class="header-left">
          <h3>📊 当日收费分析</h3>
        </div>
      </div>
      <div class="d-flex jc-center body-box">
        <!-- <dv-capsule-chart :config="paymentConfig" style="width: 100%;height:160px" /> -->
        <centreRight2Chart1 :revenueData="revenueData"></centreRight2Chart1>
      </div>
    </div>
  </div>
</template>

<script>
import centreRight2Chart1 from "@/components/echart/centreRight2/centreRight2Chart1";

export default {
  props: {
    revenueData: {
      type: Object,
      default: () => ({
        paymentStats: [],
        revenueByDuration: [],
        summary: {
          totalRevenue: 0,
          avgRevenue: '0.00',
          paidVehicles: 0,
          unpaidVehicles: 0,
          freeVehicles: 0,
          totalVehicles: 0
        }
      })
    }
  },
  computed: {
    paymentConfig() {
      return {
        data: this.revenueData.paymentStats.map(item => ({
          name: item.name,
          value: item.value
        }))
      };
    }
  },
  components: { centreRight2Chart1 },
  mounted() {},
  methods: {}
};
</script>

<style lang="scss">
#centreRight2 {
  padding: clamp(5px, 0.6vh, 8px);
  height: 100%;
  min-height: 0;
  display: flex;
  flex-direction: column;
  border-radius: 5px;
  .revenue-container {
    padding: clamp(5px, 0.8vh, 8px);
    flex: 1;
    min-height: 0;
    display: flex;
    flex-direction: column;
    border-radius: 10px;
    background-color: transparent;
  }
  .chart-header {
    margin-bottom: clamp(10px, 1.2vh, 15px);
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    flex-shrink: 0;
    
    .header-left {
      flex: 1;
      
      h3 {
        margin: 0 0 5px 0;
        font-size: clamp(14px, 1.6vw, 16px);
        color: #ffffff;
        font-weight: bold;
      }
    }
  }
  .text {
    color: #c3cbde;
  }
  .body-box {
    flex: 1;
    display: flex;
    flex-direction: column;
    min-height: 0;
    border-radius: 10px;
    overflow: hidden;
  }
}

</style>