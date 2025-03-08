<script setup lang="ts">
import { ref } from 'vue'
import axios, { AxiosError } from 'axios'  // 需先安装：npm install axios

const formData = ref({
  username: 'test_name',
  email: 'test@emain',
  password: '12345678'
})

const submitForm = async () => {
  console.log('开始提交', formData.value) // 调试点1：确认数据状态

  try {
    const response = await axios.post(
      'http://localhost:8000/users/',
      formData.value,
      {
        headers: {
          'Content-Type': 'application/json' ,
          'Authorization': 'Bearer <token>'
        },
        timeout: 5000 // 设置超时时间（单位：毫秒）
      }
    )
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
</script>

<template>
  <div class="log-container">
    <div clss="log-input">
      <input type="text" placeholder="Type your username" v-model='formData.username'  />
      <input type="text" placeholder="Type your email" v-model='formData.email'  />
      <input type="text" placeholder="Type your password" v-model='formData.password'  />
    </div>
    <div class="submit">
      <button @click="submitForm()">Send</button>
    </div>
  </div>
</template>

<style scoped>
.log-input{
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  width: 30%;
  height: 100%;
}

.submit{
  display: flex;
  justify-content: center;
  width: 70%;
  height: 100%;
  flex-grow: 1;
}

button{
  height: 100%;
  width: 100%;
}

.log-container{
  display: flex;
  align-items: center;
  justify-content: space-between;
}
</style>
