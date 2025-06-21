<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="analysis-container">
    <template v-if="$route.path != '/analysis'">
      <RouterView/>
    </template>

    <template v-else>
      <div class="analysis-module">
        <el-button 
          style="height: 100%; width: 100%; font-size: 3rem;"
          @click="router.push({name:'Interview'})">
          <el-icon><ChatDotRound/></el-icon>
          <span>面试模块</span>
        </el-button>
      </div>

      <div class="analysis-module">
        <el-button 
          style="height: 100%; width: 100%; font-size: 3rem;"
          @click="router.push({name:'Resume'})">
          <el-icon><Files /></el-icon>
          <span>简历模块</span>
        </el-button>
      </div>
    </template>

    <!-- <el-card class="analysis-card">
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

        <el-tab-pane label="职业发展" name="career" keep-alive="True">
          <div class="content">
            <Resume />
          </div>
        </el-tab-pane>

        <el-tab-pane label="Ai面试" name="interview" keep-alive="True">
          <div class="content">
            <Interview/>
          </div>
        </el-tab-pane>

        <el-tab-pane label="心理预警" name="psychological">
          <div class="content">
            <h3>心理风险识别</h3>
            <p>构建动态心理预警模型，整合多维度数据进行分析</p>
          </div>
        </el-tab-pane>
        <el-tab-pane label="测试动态类" name="test">
          <div :class = "{test_class : is_show_test_class}">
            <h3>测试动态类</h3>
            <p>看我看我</p>
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card> -->
  </div>
</template>

<script setup lang="ts" name="AcademicAnalysis">
// import Resume from './resume/index.vue'
// import Interview from './interview/index.vue'
import {ChatDotRound,Files} from '@element-plus/icons-vue'
import { RouterView } from 'vue-router'
import { useRouter } from 'vue-router';

const router = useRouter()

</script>

<style scoped>
.analysis-container {
  width:100%;height: 100%;
  /* padding: 20px; */
  display: flex;
  flex-direction: row;
  flex-wrap: wrap;
}

.analysis-module{
  font-size: 3rem;
  margin: 5px;
  /* width: 300px;
  height: 100px; */
  height: 100px;
  border: 2px solid blue;
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

.test_class{
  background-color: red;
  font-size: 10rem;
}
</style>
