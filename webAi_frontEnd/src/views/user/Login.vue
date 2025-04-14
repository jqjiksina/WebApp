<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="login-container">
    <div class="login-wrapper">
      <div class="login-left">
        <div class="logo">
          <img src="@/assets/logo.svg" alt="Logo">
        </div>
        <h1>HUST_AI系统</h1>
        <p>高效、智能、便捷的HUSTer系统平台</p>
      </div>
      <div class="login-right">
        <el-card class="login-card">
          <template #header>
            <div class="card-header">
              <span>系统登录</span>
            </div>
          </template>

          <el-form :model="form" :rules="rules" ref="formRef">
            <el-form-item prop="username">
              <el-input v-model="form.username" placeholder="用户名">
                <template #prefix>
                  <el-icon><User /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item prop="password">
              <el-input v-model="form.password" type="password" placeholder="密码">
                <template #prefix>
                  <el-icon><Lock /></el-icon>
                </template>
              </el-input>
            </el-form-item>

            <el-form-item>
              <el-button type="primary" @click="handleLogin" :loading="loading" style="width: 100%">
                登录
              </el-button>
            </el-form-item>
          </el-form>
        </el-card>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { useUsersStore } from '@/store/modules/user'
import { userApi } from '@/api/user/userApi'
import { User, Lock } from '@element-plus/icons-vue'
import type { FormInstance } from 'element-plus'

const router = useRouter()
const userStore = useUsersStore()
const formRef = ref<FormInstance>()
const loading = ref(false)

const form = reactive({
  username: '',
  password: '',
  code: 'test'
})

const rules = {
  username: [{ required: true, message: '请输入用户名', trigger: 'blur' }],
  password: [{ required: true, message: '请输入密码', trigger: 'blur' }]
}

const handleLogin = async () => {
  if (!formRef.value) return

  await formRef.value.validate(async (valid) => {
    if (valid) {
      loading.value = true
      try {
        const response = await userApi.login(form)
        userStore.updateToken(response.data.access_token)
        userStore.updateUser(form)
        router.push('/')
      } catch (error) {
        console.error('登录失败:', error)
      } finally {
        loading.value = false
      }
    }
  })
}
</script>

<style scoped>
.login-container {
  height: 100vh;
  display: flex;
  justify-content: center;
  align-items: center;
  background: linear-gradient(135deg, #1e90ff 0%, #70a1ff 100%);
}

.login-wrapper {
  display: flex;
  width: 900px;
  height: 500px;
  background: white;
  border-radius: 10px;
  box-shadow: 0 0 20px rgba(0, 0, 0, 0.1);
  overflow: hidden;
}

.login-left {
  flex: 1;
  background: linear-gradient(135deg, #1e90ff 0%, #70a1ff 100%);
  color: white;
  padding: 40px;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
  text-align: center;
}

.logo {
  width: 120px;
  height: 120px;
  margin-bottom: 30px;
}

.logo img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.login-left h1 {
  font-size: 28px;
  margin-bottom: 20px;
}

.login-left p {
  font-size: 16px;
  opacity: 0.9;
}

.login-right {
  flex: 1;
  padding: 40px;
  display: flex;
  justify-content: center;
  align-items: center;
}

.login-card {
  width: 100%;
  max-width: 400px;
}

.card-header {
  text-align: center;
  font-size: 24px;
  font-weight: bold;
  color: #333;
}

:deep(.el-input__wrapper) {
  box-shadow: 0 0 0 1px #dcdfe6;
}

:deep(.el-input__wrapper:hover) {
  box-shadow: 0 0 0 1px #409eff;
}

:deep(.el-button--primary) {
  background-color: #1e90ff;
  border-color: #1e90ff;
}

:deep(.el-button--primary:hover) {
  background-color: #70a1ff;
  border-color: #70a1ff;
}
</style>
