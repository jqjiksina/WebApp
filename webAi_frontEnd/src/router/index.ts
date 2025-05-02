import { createRouter, createWebHistory } from 'vue-router'
import { useUsersStore } from '@/store/modules/user'
import { ElMessage } from 'element-plus'
import { userApi } from '@/api/user/userApi'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login.vue'),
      meta: { requiresAuth: false }
    },
    {
      path: '/',
      component: () => import('@/views/user/Home/index.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/schedule',
      name: 'Schedule',
      component: () => import('@/views/schedule/index.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/education',
      name: 'Education',
      component: () => import('@/views/education/index.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/student',
      name: 'Student',
      component: () => import('@/views/student/index.vue'),
      meta: { requiresAuth: true }
    },
    {
      path: '/analysis',
      name: 'Analysis',
      component: () => import('@/views/analysis/index.vue'),
      meta: { requiresAuth: true }
    }
  ]
})

// 路由守卫 - 检查登录状态和后端鉴权
router.beforeEach(async (to, _from, next) => {
  const userStore = useUsersStore()
  const token = userStore.getToken

  // 不需要登录的页面直接放行
  if (!to.meta.requiresAuth) {
    next()
    return
  }

  // 检查是否有token
  if (!token) {
    ElMessage.warning('请先登录')
    next('/login')
    return
  }

  try {
    // 验证token有效性
    const response = await userApi.check_auth()
    if (response.data) {
      next()
    } else {
      // token无效，清除用户信息并跳转到登录页
      userStore.clearToken()
      ElMessage.warning('登录已过期，请重新登录')
      next('/login')
    }
  } catch (error) {
    console.error('验证token失败:', error)
    // 验证失败，清除用户信息并跳转到登录页
    userStore.clearToken()
    ElMessage.error('验证失败，请重新登录')
    next('/login')
  }
})

export default router
