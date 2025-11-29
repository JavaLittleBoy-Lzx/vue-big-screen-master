<template>
  <div id="bottomRight">
    <div class="bg-color-black">
      <div class="d-flex pt-2 pl-2">
        <span style="color:#5cd9e8">
          <icon name="chart-area"></icon>
        </span>
        <div class="d-flex">
          <span class="fs-xl text mx-2">👤 人脸访客异常监控中心</span>
          <div class="decoration2">
            <dv-decoration-2 :reverse="true" style="width:5px;height:410px;" />
          </div>
        </div>
      </div>
      <div>
        <bottomRightChart :anomalyData="anomalyData" />
      </div>
    </div>
  </div>
</template>

<script>
import bottomRightChart from "@/components/echart/bottom/bottomRightChart";
export default {
  props: {
    anomalyData: {
      type: Object,
      default: () => ({
        alertStats: {
          emergency: 2,    // 紧急：黑名单人员
          warning: 6,      // 警告：陌生人闯入
          info: 10,        // 信息：识别失败
          processed: 35,   // 已处理
          processing: 8    // 处理中
        },
        anomalyDistribution: [
          { name: '识别失败', value: 10 },
          { name: '陌生人闯入', value: 6 },
          { name: '黑名单人员', value: 2 },
          { name: '异常停留', value: 4 },
          { name: '重复进入', value: 3 },
          { name: '未授权访问', value: 2 },
          { name: '人脸遮挡', value: 2 },
          { name: '光线异常', value: 1 }
        ],
        riskPersons: [
          { personId: 'P001', name: '张三', type: '黑名单', riskLevel: '🔴高', status: '已处理' },
          { personId: 'P002', name: '李四', type: '陌生人', riskLevel: '🟡中', status: '处理中' },
          { personId: 'P003', name: '王五', type: '异常停留', riskLevel: '🟡中', status: '处理中' }
        ],
        totalAlerts: 25,
        processingEfficiency: '78',
        avgResponseTime: '2.8分钟',
        weeklyImprovement: -12,
        bestProcessor: '李老师(38件)'
      })
    }
  },
  components: {
    bottomRightChart
  },
  mounted() {},
  methods: {}
};
</script>

<style lang="scss">
#bottomRight {
  padding: 1rem 1rem 0rem;
  height: 400px;
  min-width: 300px;
  border-radius: 5px;
  .bg-color-black {
    height: 382px;
    border-radius: 10px;
  }
  .text {
    color: #c3cbde;
  } //下滑线动态
  .decoration2 {
    position: absolute;
    right: 10px;
  }
  .chart-box {
    margin-top: 1rem;
    width: 170px;
    height: 170px;
    .active-ring-name {
      padding-top: 10px;
    }
  }
}
</style>