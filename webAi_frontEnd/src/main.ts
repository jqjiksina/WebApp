import '@/assets/main.css'
import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router'
import { createPinia } from "pinia";
import piniaPluginPersistedstate from 'pinia-plugin-persistedstate'
import axios from 'axios';
import ElementPlus from 'element-plus'
import 'element-plus/dist/index.css'

// // 初始化自动登录
// const initAuth = async () => {
//   const token = userStore.getToken
//   if (token) {
//     try {
//       // ✅ 验证 Token 有效性（需要后端配合接口）
//       await axios.get(`${import.meta.env.VITE_BACK_END_URL}/auth/validate`, {
//         headers: { Authorization: `Bearer ${token}` }
//       })
//     } catch (error) {
//       authHelper.clearToken()
//       router.replace('/login')
//     }
//   }
// }


const app = createApp(App);

//挂载方法
app.config.globalProperties['$assert']=(exp:boolean)=>{
if(!exp) throw Error("error");
};


app.use(createPinia().use(piniaPluginPersistedstate))
  .use(router)
  .use(ElementPlus)

app.mount('#app')

import { useUsersStore } from './store/modules/user'
import { userApi } from './api/user/userApi';
import type{Request_Login} from '@/types/formSubmit'
const userStore = useUsersStore()
// 每 5 分钟刷新一次 Token
setInterval(async () => {
  console.log("refresh token!")
  const token = userStore.getToken
  if (token) {
    try {
      const user = userStore.getUser
      const request : Request_Login = {username : user.username.value,password : user.password.value}
      const response = await userApi.login(request)
      userStore.updateToken(response.data.access_token)
    } catch (error) {
      userStore.clearToken()
    }
  }
}, 300_000) // 5分钟
