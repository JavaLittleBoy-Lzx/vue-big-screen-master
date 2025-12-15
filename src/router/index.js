import Vue from 'vue'
import VueRouter from 'vue-router'
import { isLoggedIn, clearAuth, getUserInfo } from '@/utils/auth'

Vue.use(VueRouter)

const routes = [
  {
    path: '/login',
    name: 'login',
    component: () => import('../views/Login.vue'),
    meta: { 
      title: '登录',
      requiresAuth: false // 登录页不需要认证
    }
  },
  {
    path: '/',
    name: 'index',
    component: () => import('../views/index.vue'),
    meta: { 
      title: '数据可视化平台',
      requiresAuth: true // 需要认证
    }
  },
  {
    path: '/demo3d',
    name: 'demo3d',
    component: () => import('../views/demo3D.vue'),
    meta: { 
      title: '3D演示',
      requiresAuth: true
    }
  },
  {
    path: '/visitor-vip',
    name: 'visitor-vip',
    component: () => import('../views/VisitorVipDemo.vue'),
    meta: { 
      title: '访客VIP',
      requiresAuth: true
    }
  },
  {
    path: '/channel-detail',
    name: 'channel-detail',
    component: () => import('../views/ChannelDetail.vue'),
    meta: { 
      title: '通道详情',
      requiresAuth: true
    }
  },
  {
    path: '/face-visitor',
    name: 'face-visitor',
    component: () => import('../views/FaceVisitorDashboard.vue'),
    meta: { 
      title: '人脸访客',
      requiresAuth: true
    }
  },
  {
    path: '/websocket-test',
    name: 'websocket-test',
    component: () => import('../views/WebSocketTest.vue'),
    meta: { 
      title: 'WebSocket测试',
      requiresAuth: true
    }
  },
  {
    path: '/user-profile',
    name: 'user-profile',
    component: () => import('../views/UserProfile.vue'),
    meta: { 
      title: '个人信息',
      requiresAuth: true
    }
  },
  {
    path: '/user-management',
    name: 'user-management',
    component: () => import('../views/UserManagement.vue'),
    meta: { 
      title: '用户管理',
      requiresAuth: true,
      requiresAdmin: true // 仅管理员可访问
    }
  }
]

const router = new VueRouter({
  mode: "history",
  routes
})

// 全局前置守卫 - 实现路由鉴权
router.beforeEach((to, from, next) => {
  // 设置页面标题
  if (to.meta.title) {
    document.title = to.meta.title + ' - 智慧车行数据可视化平台'
  }

  // 检查路由是否需要认证
  const requiresAuth = to.matched.some(record => record.meta.requiresAuth)
  const requiresAdmin = to.matched.some(record => record.meta.requiresAdmin)

  if (requiresAuth) {
    // 需要认证的路由
    if (isLoggedIn()) {
      // 检查是否需要管理员权限
      if (requiresAdmin) {
        const userInfo = getUserInfo() || {}
        console.log('🔐 路由守卫 - 检查管理员权限')
        console.log('👤 用户信息:', userInfo)
        console.log('🎭 用户角色:', userInfo.role)
        console.log('✅ 是否为admin:', userInfo.role === 'admin')
        
        if (userInfo.role === 'admin') {
          console.log('✅ 管理员权限验证通过')
          next()
        } else {
          console.warn('⚠️ 权限不足，需要管理员权限')
          console.warn('当前角色:', userInfo.role)
          next({ path: '/' })
        }
      } else {
        next()
      }
    } else {
      // 未登录，重定向到登录页
      console.warn('⚠️ 未登录，重定向到登录页')
      next({
        path: '/login',
        query: { redirect: to.fullPath } // 保存目标路径，登录后可以跳转回来
      })
    }
  } else {
    // 不需要认证的路由
    if (to.path === '/login' && isLoggedIn()) {
      // 已登录用户访问登录页，根据角色重定向
      const userInfo = getUserInfo() || {}
      console.log('✅ 已登录，根据角色重定向，用户角色:', userInfo.role)
      if (userInfo.role === 'admin') {
        next({ path: '/user-management' })
      } else {
        next({ path: '/' })
      }
    } else {
      next()
    }
  }
})

// 全局后置钩子
router.afterEach((to, from) => {
  // 页面跳转后的处理
  console.log('🔄 路由切换:', from.path, '→', to.path)
})

// 路由错误处理
router.onError((error) => {
  console.error('❌ 路由错误:', error)
})

export default router