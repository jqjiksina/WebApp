<template>
  <div class="student-container">
    <el-card class="student-card">
      <template #header>
        <div class="card-header">
          <span>学生事务</span>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="请假审批" name="leave">
          <div class="content">
            <h3>请假审批流程</h3>
            <p>提供7×24小时高频事务智能应答服务</p>
          </div>
        </el-tab-pane>

        <el-tab-pane label="医保政策" name="insurance">
          <div class="content">
            <h3>大学生医保政策</h3>
            <p>提供医保政策咨询和申请指南</p>
          </div>
        </el-tab-pane>

        <el-tab-pane label="资助申请" name="funding">
          <div class="content">
            <h3>资助申请指南</h3>
            <p>提供各类资助项目的申请流程和注意事项</p>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref('leave')
</script>

<style scoped>
.student-container {
  padding: 20px;
}

.student-card {
  margin-bottom: 20px;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.content {
  padding: 20px;
}

h3 {
  margin-bottom: 10px;
}
</style>
