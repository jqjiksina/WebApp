<script setup lang="ts">
import { ref } from 'vue'
import { AxiosError } from 'axios'  // 需先安装：npm install axios
import { userApi } from '@/api/userApi'

const formData = ref({
  username: 'test_name',
  email: 'test@emain',
  password: '12345678'
})

const formRegister = async () => {
  console.log('开始提交', formData.value) // 调试点1：确认数据状态

  try {
    const response = await userApi.register(formData.value);
    console.log('完整响应对象:', response)
    console.log('注册成功:', response.data)
  } catch (error) {
    console.error('错误详情:', error)
    if (! (error instanceof AxiosError)) return;
    if (error.response) {
      // 服务器返回了4xx/5xx响应
      console.log('状态码:', error.response.status)
      console.log('响应头:', error.response.headers)
    } else if (error.request) {
      // 请求已发出但无响应
      console.log('请求对象:', error.request)
      alert('服务器未响应，请检查后端是否运行')
    } else {
      // 其他错误（如配置错误）
      console.log('错误信息:', error.message)
    }
  }
}

const formLogin = async () => {
  try {
    const response = await userApi.login(formData.value);
    console.log('完整响应对象:', response)
    console.log('登录成功:', response.data)
  } catch (error) {
    console.error('错误详情:', error)
    if (! (error instanceof AxiosError)) return;
    if (error.response) {
      // 服务器返回了4xx/5xx响应
      console.log('状态码:', error.response.status)
      console.log('响应头:', error.response.headers)
    } else if (error.request) {
      // 请求已发出但无响应
      console.log('请求对象:', error.request)
      alert('服务器未响应，请检查后端是否运行')
    } else {
      // 其他错误（如配置错误）
      console.log('错误信息:', error.message)
    }
  }
}
</script>

<template>
  <div class="log-container">
    <div clss="log-input">
      <input type="text" placeholder="username" v-model='formData.username'  />
      <input type="text" placeholder="email" v-model='formData.email'  />
      <input type="text" placeholder="password" v-model='formData.password'  />
    </div>
    <div class="submit">
      <button @click="formRegister()">Register</button>
      <button @click="formLogin()">Login</button>
    </div>
  </div>
</template>

<style scoped>
.log-input{
  height: 100%;

  display: flex;
  flex-direction: column;
  flex-wrap: nowrap;
  justify-content: center;
}

.submit{
  margin-top: 8px;
  height: 2rem;
  width: 15rem;
  display: flex;
  justify-content: space-around;
}
button{
  margin: 0 2px;
  width:100%;height:100%;
  background-color: rgb(134, 179, 236);
  border-radius: 5px;
  border-top: 0;
  border-left: 0;
  border-bottom: 1px solid rgb(185, 184, 184);
  border-right: 1px solid rgb(185, 184, 184);
}
button:hover{
  background-color: rgb(114,159,216);
  cursor: pointer;
}
button:active{
  border-bottom: 0;
  border-right: 0;
  border-top: 1px solid rgb(185, 184, 184);
  border-left: 1px solid rgb(185, 184, 184);
}

input{
  height: 2rem;
  border-radius: 6px;
  margin: 2px 0;
  background-color: rgb(187, 186, 186);
  display: block; /*关键，取消input的默认inline*/
  font-size: 1.2rem;
}

.log-container{
  height: 100%;
  width: 100%;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-around;
}
</style>
