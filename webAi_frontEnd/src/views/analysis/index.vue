<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="analysis-container">
    <el-card class="analysis-card">
      <template #header>
        <div class="card-header">
          <span>学业分析</span>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="学业分析" name="academic">
          <div class="content">
            <h3>学业分析系统</h3>
            <p>构建多源数据融合分析体系，定位学业薄弱环节</p>
          </div>
        </el-tab-pane>

        <el-tab-pane label="职业发展" name="career">
          <div class="content">
            <h3>职业发展支持</h3>
            <p>提供简历智能修改与评分服务，实现能力画像与岗位需求匹配</p>
          </div>
        </el-tab-pane>

        <el-tab-pane label="心理预警" name="psychological">
          <div class="content">
            <h3>心理风险识别</h3>
            <p>构建动态心理预警模型，整合多维度数据进行分析</p>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts" name="AcademicAnalysis">
import { ref } from 'vue'

const activeTab = ref('academic')
</script>

<style scoped>
.analysis-container {
  padding: 20px;
}

.analysis-card {
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
