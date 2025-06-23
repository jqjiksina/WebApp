<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="education-container">
    <el-card class="education-card">
      <template #header>
        <div class="card-header">
          <span>教学科研</span>
        </div>
      </template>

      <el-tabs v-model="activeTab">
        <el-tab-pane label="课程管理" name="courses">
          <div class="content">
            <h3>知识图谱</h3>
            <p>知识图谱，用户可以在此查看相关课程的知识点构建图谱。</p>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts" name="EducationPage">
import { ref } from 'vue'
//import { useRouter } from 'vue-router'

//const router = useRouter()
const activeTab = ref('courses')

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

p {
  margin-bottom: 20px;
}
</style>
