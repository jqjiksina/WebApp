import '@/assets/main.css'
import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router'
import { createPinia } from "pinia";

const app = createApp(App);

//挂载方法
app.config.globalProperties['$assert']=(exp:boolean)=>{
  if(!exp) throw Error("error");
};


const pinia = createPinia();
app.use(pinia).use(router);
app.mount('#app')
