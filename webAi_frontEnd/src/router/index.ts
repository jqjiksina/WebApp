import { createRouter, createWebHistory } from 'vue-router'
import { useUsersStore } from '@/store/modules/user'
import type { Params_Login } from '@/types/formSubmit'

const router = createRouter({
  history: createWebHistory(),
  routes: [
    {
      path: '/login',
      name: 'Login',
      component: () => import('@/views/user/Login.vue')
    },
    {
      path: '/',
      component: () => import('@/views/user/Home/index.vue')
    },
    {
      path: '/schedule',
      name: 'Schedule',
      component: () => import('@/views/schedule/index.vue')
    },
    {
      path: '/education',
      name: 'Education',
      component: () => import('@/views/education/index.vue'),
      // children: [
      //   {
      //     path: 'resume',
      //     name: 'Resume',
      //     component: () => import('@/views/education/resume/index.vue')
      //   }
      // ]
    },
    {
      path: '/student',
      name: 'Student',
      component: () => import('@/views/student/index.vue')
    },
    {
      path: '/analysis',
      name: 'Analysis',
      component: () => import('@/views/analysis/index.vue')
    }
  ]
})

// 路由守卫 - 模拟正常登录状态
router.beforeEach((to, from, next) => {
  const userStore = useUsersStore()
  if (to.path === '/login') {
    next()
    return
  }
  // 模拟有效的token
  if (!userStore.getToken) {
    userStore.updateToken('mock_token')
    const mockUser: Params_Login = {
      username: 'test_user',
      password: 'test_password',
      code: 'test'
    }
    userStore.updateUser(mockUser)
  }

  next()
})

export default router
