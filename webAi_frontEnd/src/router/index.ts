import { createRouter, createWebHistory } from 'vue-router'
import { useUsersStore } from '@/store/user'
import { ElMessage } from 'element-plus'
import { userApi } from '@/api/userApi'

const router = createRouter({
  history: createWebHistory(),
  routes: [{
      path: '/login',
      name: 'Login',
      component: () => import('@/views/Login/index.vue'),
      meta: { requiresAuth: false }
    },{
      path: '/',
      component: () => import('@/views/Home/index.vue'),
      meta: { requiresAuth: true ,title:"首页"}
    },{
      path: '/education',
      name: 'Education',
      component: () => import('@/views/education/index.vue'),
      meta: { requiresAuth: true ,title:"教学科研"}
    },{
      path: '/student',
      name: 'Student',
      component: () => import('@/views/student/index.vue'),
      meta: { requiresAuth: true ,title:"学生事务"}
    },{
      path: '/analysis',
      name: 'Analysis',
      component: () => import('@/views/analysis/index.vue'),
      meta: { requiresAuth: true ,title:"学业分析"},
      children:[{
          path: 'interview',
          name:"Interview",
          component: ()=> import('@/views/analysis/interview/index.vue'),
          meta: {requiresAuth: true ,title:"Ai面试"}
        },{
          path: 'resume',
          name:"Resume",
          component: ()=> import('@/views/analysis/resume/index.vue'),
          meta: {requiresAuth: true ,title:"简历修改"}
        }
      ]
    },{
      path: '/helpDoc',
      name: 'HelpDocument',
      component: () => import('@/views/helpDoc/index.vue'),
      meta: {requireAuth: false, title:"帮助文档"}
    }
  ]
})

// 路由守卫 - 检查登录状态和后端鉴权
router.beforeEach(async (to, _from, next) => {
  const userStore = useUsersStore()
  const token = userStore.getToken

  if (!to.meta.requiresAuth) {// 不需要登录的页面直接放行
    next()
    return
  }
  
  if (!token) { // 检查是否有token
    ElMessage.warning('请先登录')
    next('/login')
    return
  }

  try {
    // 验证token有效性
    const response = await userApi.check_auth()
    if (response.data) {
      next()
    } else { // token无效，清除用户信息并跳转到登录页
      userStore.clearToken()
      ElMessage.warning('登录已过期，请重新登录')
      next('/login')
    }
  } catch (error) {
    console.error('验证token失败:', error) // 验证失败，清除用户信息并跳转到登录页
    userStore.clearToken()
    ElMessage.error('验证失败，请重新登录')
    next('/login')
  }
})

export default router
