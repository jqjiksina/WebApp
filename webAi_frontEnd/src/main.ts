import '@/assets/main.css'
import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router'
import { createPinia } from "pinia";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

const app = createApp(App);

import hljs from 'highlight.js';
import 'highlight.js/styles/atom-one-dark.css' //样式

//创建v-highlight全局指令
app.directive('highlight',function (el) {
  let blocks = el.querySelectorAll('pre code');
  blocks.forEach((block: HTMLElement)=>{
    hljs.highlightBlock(block)
  })
})

//挂载方法
app.config.globalProperties['$assert']=(exp:boolean)=>{
if(!exp) throw Error("error");
};

// 创建pinia并添加持久化插件
const pinia = createPinia()
pinia.use(piniaPluginPersistedstate)

app.use(pinia)
  .use(router)
  .use(ElementPlus)

app.mount('#app')

import { useUsersStore } from './store/user'
import { userApi } from './api/userApi';
import type{Request_Login} from '@/api/userApi'
import axios from 'axios';
const userStore = useUsersStore()

axios.interceptors.request.use(config => {
  const token = userStore.getToken
  console.log("axio interpret! token: ",token)
  if (token) {
  config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
  });

// 每 10 分钟刷新一次 Token
setInterval(async () => {
  const token = userStore.getToken
  if (token) {
    try {
      const username = userStore.username
      const password = userStore.password
      console.log("refresh token! user:",username,password,"token:",token)
      const request : Request_Login = {username : username,password : password}
      const response = await userApi.login(request)
      userStore.updateToken(response.data.access_token)
      console.log("refresh token done:",response.data.access_token)
    } catch (error) {
      console.log("refresh token error!")
    }
  }
}, 600_000) // 10分钟
