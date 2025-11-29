import Vue from 'vue'
import VueRouter from 'vue-router'

Vue.use(VueRouter)

const routes = [
  {
    path: '/',
    name: 'index',
    component: () => import('../views/index.vue')
  },
  {
    path: '/demo3d',
    name: 'demo3d',
    component: () => import('../views/demo3D.vue')
  },
  {
    path: '/visitor-vip',
    name: 'visitor-vip',
    component: () => import('../views/VisitorVipDemo.vue')
  },
  {
    path: '/channel-detail',
    name: 'channel-detail',
    component: () => import('../views/ChannelDetail.vue')
  },
  {
    path: '/face-visitor',
    name: 'face-visitor',
    component: () => import('../views/FaceVisitorDashboard.vue')
  },
  {
    path: '/websocket-test',
    name: 'websocket-test',
    component: () => import('../views/WebSocketTest.vue')
  }
]
const router = new VueRouter({
  mode: "history",
  routes
})

export default router