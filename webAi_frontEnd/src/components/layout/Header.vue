<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="header-container">
    <div class="left">
      <el-breadcrumb separator="/">
        <el-breadcrumb-item :to="{ path: '/' }">首页</el-breadcrumb-item>
        <el-breadcrumb-item>{{ currentRoute }}</el-breadcrumb-item>
      </el-breadcrumb>
    </div>
    <div class="right">
      <el-dropdown>
        <span class="user-info">
          {{ username }}
          <el-icon><ArrowDown /></el-icon>
        </span>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item @click="handleLogout">退出登录</el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUsersStore } from '@/store/modules/user'
import { ArrowDown } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUsersStore()

const currentRoute = computed(() => {
  const path = route.path
  if (path.startsWith('/schedule')) return '排班系统'
  if (path.startsWith('/education')) return '教学科研'
  if (path.startsWith('/student')) return '学生事务'
  if (path.startsWith('/analysis')) return '学业分析'
  return '首页'
})

const username = computed(() => userStore.getUser?.username || '未登录')

const handleLogout = () => {
  userStore.clearToken()
  router.push('/login')
}
</script>

<style scoped>
.header-container {
  height: 100%;
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0 20px;
}

.user-info {
  display: flex;
  align-items: center;
  cursor: pointer;
}

.el-icon {
  margin-left: 8px;
}
</style>
