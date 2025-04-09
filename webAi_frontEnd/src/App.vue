<script setup lang="ts" name="App">
import { onBeforeMount, ref } from 'vue';
import { RouterView } from 'vue-router';
import { userApi } from './api/userApi';
import { useUsersStore } from './store/user';
import type { Request_Login } from './types/formSubmit';

onBeforeMount(async ()=>{
  // const userStore = useUsersStore()
  // const user = userStore.getUser
  const user = useUsersStore()
  if (!user || (!user.phone && !user.email)) {
    console.log("userStore数据空",user)
    return
  }
  console.log("userStore保存的User信息：",user.phone,user.password)
  const request = ref<Request_Login>({username : "", password : ""})
  if (user.phone)
    request.value = {username : user.phone, password : user.password}
  else if (user.email)
    request.value = {username : user.email, password : user.password}

  console.log("开始自动登录...",request)
  const response = await userApi.login(request.value)
  user.updateToken(response.data.access_token)
  console.log("自动登录成功！Response:",response.data)
})
</script>

<template>
  <RouterView/>
</template>
