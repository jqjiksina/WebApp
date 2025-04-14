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

        <el-tab-pane label="职业发展" name="career" keep-alive="True">
          <div class="content">
            <h3>职业发展支持</h3>
            <p>提供简历智能修改与评分服务，实现能力画像与岗位需求匹配</p>
            <el-button type="primary" @click="showResume=!showResume">简历修改</el-button>
            <div v-if="showResume">
              <Resume />
            </div>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>
  </div>
</template>

<script setup lang="ts" name="EducationPage">
import { ref } from 'vue'
import Resume from './resume/index.vue'
//import { useRouter } from 'vue-router'

//const router = useRouter()
const showResume = ref(false)
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
