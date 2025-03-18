<script setup lang="ts">
import { ref } from 'vue'
import { AxiosError } from 'axios'  // 需先安装：npm install axios
import { userApi } from '@/api/userApi'

const formData = ref({
  phone: 'test_phone',
  username: 'test_name',
  password: '12345678',
  password_again: '12345678',
  email: 'test@emain',
  validation_code: 'test'
})

const formRegister = async () => {
  console.log('开始提交', formData.value) // 调试点1：确认数据状态

  try {
    const response = await userApi.register(formData.value);
    console.log('注册成功:', response?.data)
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
    <form class="log-form">
      <div class="log-input">
        <input type="text" placeholder="phone" v-model='formData.phone'  />
        <input type="text" placeholder="username" v-model='formData.username'  />
        <input type="password" placeholder="password" v-model='formData.password'  />
        <input type="password" placeholder="password" v-model='formData.password_again'  />
        <input type="text" placeholder="email" v-model='formData.email'  />
        <input type="text" placeholder="code" v-model='formData.validation_code'  />
      </div>
      <div class='submit'>
        <input type='submit' @click="formRegister()" value="Register"/>
        <input type='submit' @click="formLogin()" value="Login"/>
      </div>
    </form>
  </div>
</template>

<style scoped>
:root{
  --input-box-radius: 8px;
  --input-height : 1.5rem;
}

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
input[type='submit']{
  margin: 0 2px;
  width:100%;height:100%;
  background-color: rgb(134, 179, 236);
  border-radius: 5px;
  border-top: 0;
  border-left: 0;
  border-bottom: 1px solid rgb(185, 184, 184);
  border-right: 1px solid rgb(185, 184, 184);
  &:hover{
    background-color: rgb(114,159,216);
    cursor: pointer;
  }
  &:active{
    border-bottom: 0;
    border-right: 0;
    border-top: 1px solid rgb(185, 184, 184);
    border-left: 1px solid rgb(185, 184, 184);
  }
}

input[type='text'],input[type='password']{
  height: var(--input-height,1.2rem);
  border-radius: var(--input-box-radius,6px);
  margin: 2px 0;
  background-color: rgb(187, 186, 186);
  font-size: calc(var(--input-height,1.2rem) - 0.2rem);
  display: block; /*关键，取消input的默认inline*/
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
