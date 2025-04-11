<template>
  <div class="education-container">
    <el-card class="education-card">
      <template #header>
        <div class="card-header">
          <span>教学科研</span>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="教学辅助" name="teaching">
          <div class="content">
            <h3>知识图谱系统</h3>
            <p>与聂彦老师团队合作，整合知识图谱技术与 DeepSeek 问答系统</p>
          </div>
        </el-tab-pane>

        <el-tab-pane label="科研辅助" name="research">
          <div class="content">
            <h3>AI 优化工具链</h3>
            <p>基于 Circuit Training RL 框架的本地部署实践</p>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'

const activeTab = ref('teaching')
</script>

<style scoped>
.education-container {
  padding: 20px;
}

.education-card {
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
