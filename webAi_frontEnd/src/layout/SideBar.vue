<template>
  <el-menu
    :default-active="activeMenu"
    class="sidebar-menu"
    background-color="#304156"
    text-color="#bfcbd9"
    active-text-color="#409EFF"
    router
  >
    <el-menu-item index="/" style="border-bottom: 2px; border-color: blue;">
      <el-icon><HomeFilled /></el-icon>
      <span>首页</span>
    </el-menu-item>

    <el-menu-item index="/education">
      <el-icon><Reading /></el-icon>
      <span>教学科研</span>
    </el-menu-item>

    <el-menu-item index="/student">
      <el-icon><User /></el-icon>
      <span>学生事务</span>
    </el-menu-item>

    <!-- <el-menu-item index="/analysis">
      <el-icon><DataAnalysis /></el-icon>
      <span>职业发展</span>
    </el-menu-item> -->

    <el-sub-menu index="1">
      <template #title>
        <el-icon><DataAnalysis /></el-icon>
        <span>职业发展</span>
      </template>
      <el-menu-item index="/analysis/interview">Ai面试</el-menu-item>
      <el-menu-item index="/analysis/resume">简历修改</el-menu-item>
    </el-sub-menu>

    <el-menu-item index="/helpDoc">
      <el-icon><DataAnalysis /></el-icon>
      <span>帮助文档</span>
    </el-menu-item>

    <el-menu-item index="/TestDoc">
      <el-icon><DataAnalysis /></el-icon>
      <span>测试页面</span>
    </el-menu-item>

    <el-sub-menu index="2">
      <template #title>知识图谱</template>
        <el-menu-item index="/maganism">
          电磁场与电磁波
        </el-menu-item>
        <el-menu-item index="/integral">
          微积分
        </el-menu-item>
        <el-menu-item index="/function">
          数理方程与特殊函数
        </el-menu-item>
    </el-sub-menu>
  </el-menu>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { Reading, User, DataAnalysis, HomeFilled } from '@element-plus/icons-vue'

const route = useRoute()
// const router = useRouter()
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
