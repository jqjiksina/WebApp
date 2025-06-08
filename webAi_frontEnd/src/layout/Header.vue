<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="header-container">
    <div class="left">
      <el-breadcrumb separator="/" class="breadcrumb-container">
        <el-breadcrumb-item 
          v-for="(item,_index) in breadcrumbData"
          :key="item.path"
          :to="item.path"
        >
          {{ item.meta.title }}
        </el-breadcrumb-item>
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
    <div>
      <el-button>

      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useUsersStore } from '@/store/user'
import { ArrowDown } from '@element-plus/icons-vue'

const route = useRoute()
const router = useRouter()
const userStore = useUsersStore()

const breadcrumbData = computed(()=>{
  return route.matched.filter(
    item => item.meta && item.meta.title
  )
})

const username = computed(() => userStore.getUser?.username || '未登录')

const handleLogout = () => {
  userStore.clearToken()  
  router.push('/login')
}
</script>

<style scoped>
:deep(.el-breadcrumb__item .el-breadcrumb__inner) { /*穿透内部组件样式*/
  /* 面包屑项通用样式 */
  color: var(--color-text)
}

:deep(.el-breadcrumb__item:last-child .el-breadcrumb__inner){
  /* 面包屑最后一项样式 */
  color: var(--color-text) !important
}

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
