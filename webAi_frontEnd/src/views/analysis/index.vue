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

        <el-tab-pane label="职业发展" name="career" keep-alive="True">
          <div class="content">
            <!-- <el-button type="primary" @click="showResume=!showResume">简历修改</el-button> -->
            <!-- <div v-if="showResume">
            </div> -->
            <Resume />
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
    </el-card>
  </div>
</template>

<script setup lang="ts" name="AcademicAnalysis">
import { computed, onMounted, ref } from 'vue'
import Resume from './resume/index.vue'

const activeTab = ref('academic')

const is_show_test_class = computed(()=>{
  return value.value
})

const value = ref(false);
onMounted(()=>{
  setInterval(()=>{ //每一秒切换一次状态，查看动态类刷新的时机
    value.value = !value.value
  },1000)
})

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

.test_class{
  background-color: red;
  font-size: 10rem;
}
</style>
