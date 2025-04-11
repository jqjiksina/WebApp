<template>
  <el-menu
    :default-active="activeMenu"
    class="sidebar-menu"
    background-color="#304156"
    text-color="#bfcbd9"
    active-text-color="#409EFF"
    router
  >
    <el-menu-item index="/schedule">
      <el-icon><Calendar /></el-icon>
      <span>排班系统</span>
    </el-menu-item>

    <el-menu-item index="/education">
      <el-icon><Reading /></el-icon>
      <span>教学科研</span>
    </el-menu-item>

    <el-menu-item index="/student">
      <el-icon><User /></el-icon>
      <span>学生事务</span>
    </el-menu-item>

    <el-menu-item index="/analysis">
      <el-icon><DataAnalysis /></el-icon>
      <span>学业分析</span>
    </el-menu-item>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Calendar, Reading, User, DataAnalysis } from '@element-plus/icons-vue'

const route = useRoute()
const activeMenu = computed(() => route.path)
</script>

<style scoped>
.sidebar-menu {
  height: 100%;
  border-right: none;
}

.el-menu-item {
  display: flex;
  align-items: center;
  height: 50px;
  line-height: 50px;
  font-size: 14px;
}

.el-icon {
  margin-right: 8px;
  font-size: 16px;
}

:deep(.el-menu-item span) {
  font-size: 14px;
}
</style>
