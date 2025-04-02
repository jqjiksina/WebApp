import { useUsersStore } from "@/store/user";
import { createRouter} from "vue-router"
//引入路由器模式
import { createWebHistory } from "vue-router";

//创建路由器，路由与组件绑定
const router = createRouter({
  history:createWebHistory(),
  //管理路由
   routes:[{
      path: "/",
      name: 'root',
      component: () => import('@/views/Root/index.vue'),
      children:[
        {
          path: "",
          name: "home",
          component: () => import('@/views/Home/index.vue')
        },{
          path: "/session/:session_id",
          name: 'log',
          component: () => import('@/views/ChatLog/index.vue'),
          props: true
        },{
          path: "/:patchMatch(.*)*",
          redirect: '/'
        }
      ]
    },
   ]
})

// // 全局前置守卫
// router.beforeEach(async (to) => {
//   const isPublicRoute = ['/auth/login', '/auth/register'].includes(to.path)
//   const isAuthenticated = !!useUsersStore().getToken

//   console.log("router guard! isPublicRoute:",isPublicRoute,"isAuthenticated:",isAuthenticated)

//   // 已登录用户访问公开路由 → 重定向到首页
//   if (isAuthenticated && isPublicRoute) {
//     return '/'
//   }

//   // 未登录用户访问私有路由 → 重定向到登录页
//   if (!isAuthenticated && !isPublicRoute) {
//     return '/login'
//   }

//   return
// })

export default router;
