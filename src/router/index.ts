import { createRouter, createWebHashHistory } from "vue-router"
//引入路由器模式
import { createWebHistory } from "vue-router";

//创建路由器，路由与组件绑定
const router = createRouter({
  history:createWebHistory(),
  //管理路由
   routes:[{
      path: "/",
      name: 'Home',
      component: () => import('@/views/Home/index.vue')
    },{
      path: "/log/:logKey",
      name: 'log',
      component: () => import('@/views/ChatLog/index.vue'),
      props: true
    },{
      path: "/:patchMatch(.*)*",
      name: '404',
      component: () => import('@/views/error/index.vue'),
      meta:{title:'404'}
    }
   ]
})


export default router;
