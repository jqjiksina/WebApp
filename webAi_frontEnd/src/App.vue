<script setup lang="ts" name="App">
import { onBeforeMount, ref } from 'vue';
import { RouterView } from 'vue-router';
import { userApi } from './api/user/userApi';
import { useUsersStore } from './store/modules/user';
import type { Request_Login } from './types/formSubmit';
import SideBar from '@/components/layout/SideBar.vue'
import Header from '@/components/layout/Header.vue'

onBeforeMount(async ()=>{
  // const userStore = useUsersStore()
  // const user = userStore.getUser
  const user = useUsersStore()
  if (!user || (!user.phone && !user.email)) {
    console.log("userStore数据空",user)
    return
  }
  console.log("userStore保存的User信息：",user.username,user.password)  
  const request = ref<Request_Login>({username : user.username, password : user.password})

  console.log("开始自动登录...",request)
  const response = await userApi.login(request.value)
  user.updateToken(response.data.access_token)
  console.log("自动登录成功！Response:",response.data)
})

const showSlide = ref(true)

</script>

<template>
  <div class="app-container">
    <template v-if="$route.path === '/login'">
      <div class="login-container">
        <RouterView />
      </div>
    </template>
    <template v-else>
      <el-container class="main-container">
        <Transition name="slide">
          <el-aside v-if="showSlide">
            <SideBar />
          </el-aside>
        </Transition>
        <el-container class="content-container">
          <el-header height="60px">
            <Header />
          </el-header>
          <el-main>
            <div class="page-container">
              <RouterView />
            </div>
          </el-main>
        </el-container>
      </el-container>
    </template>
  </div>
</template>

<style scoped>
@import './assets/theme.css';

.app-container {
  height: 100vh;
  width: 100vw;
  overflow: auto;
}

.login-container {
  height: 100%;
  width: 100%;
  display: flex;
  justify-content: center;
  align-items: center;
}

.main-container {
  height: 100%;
  width: 100%;
}

.content-container {
  height: 100%;
  display: flex;
  flex-direction: column;
}

.page-container {
  height: 100%;
  width: 100%;
  overflow: auto;
}

.el-aside {
  background-color: #304156;
  color: #fff;
  width: 200px;
  height: 100%;
}

.el-header {
  background-color: #fff;
  border-bottom: 1px solid #e6e6e6;
  padding: 0;
  line-height: 60px;
}

.el-main {
  background-color: --background-color;
  padding: 20px;
  flex: 1;
  overflow: hidden;
}

@media (max-width : 480px) {
  .el-aside{
    width: 100px;
    display:none;
  }
}
</style>
