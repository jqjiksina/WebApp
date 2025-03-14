import '@/assets/main.css'
import { createApp } from 'vue'
import App from '@/App.vue'
import router from '@/router'
import { createPinia } from "pinia";

const pinia = createPinia();  //状态管理库

const app = createApp(App);
app.use(router).use(pinia);
app.mount('#app')
