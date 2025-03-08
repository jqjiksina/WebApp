import './assets/main.css'

// import App from './App.vue'
import { createApp } from 'vue'
import MyApp from './MyApp.vue'
import router from './router'

// createApp(App).mount('#app')
// MyApp.use(Vue3SeamlessScroll);

const app = createApp(MyApp);
app.use(router);
app.mount('#app');
