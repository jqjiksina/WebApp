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
            <h3>课程管理系统</h3>
            <p>管理课程信息、教学计划和课程资源</p>
          </div>
        </el-tab-pane>

        <el-tab-pane label="科研项目" name="research">
          <div class="content">
            <h3>科研项目管理</h3>
            <p>管理科研项目、论文发表和科研成果</p>
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
