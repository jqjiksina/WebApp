<!-- eslint-disable vue/multi-word-component-names -->
<template>
  <div class="schedule-container">
    <el-card class="schedule-card">
      <template #header>
        <div class="card-header">
          <span class="title">排班系统</span>
          <el-button type="primary" @click="showInputForm = true">添加员工</el-button>
        </div>
      </template>

      <el-tabs v-model="activeTab" class="schedule-tabs">
        <el-tab-pane label="排班表" name="schedule">
          <div class="tab-content">
            <ScheduleTable :schedule-data="scheduleData" />
          </div>
        </el-tab-pane>
        <el-tab-pane label="员工列表" name="employees">
          <div class="tab-content">
            <EmployeeList :employees="employees" @delete="handleDelete" />
          </div>
        </el-tab-pane>
      </el-tabs>
    </el-card>

    <el-dialog v-model="showInputForm" title="添加员工" width="50%">
      <InputForm @submit="handleSubmit" @cancel="showInputForm = false" />
    </el-dialog>
  </div>
</template>

<script setup lang="ts" name="ScheduleIndex">
import { ref } from 'vue'
import ScheduleTable from './ScheduleTable.vue'
import EmployeeList from './EmployeeList.vue'
import InputForm from './InputForm.vue'
import { useScheduleStore } from '@/store/modules/schedule'
import type { Schedule } from '@/types/schedule'
import type { Employee } from '@/types/employee'

const scheduleStore = useScheduleStore()
const activeTab = ref('schedule')
const showInputForm = ref(false)
const scheduleData = ref<Schedule[]>([])
const employees = ref<Employee[]>([])

const handleSubmit = async (formData: Employee) => {
  await scheduleStore.addEmployee(formData)
  showInputForm.value = false
  // 刷新数据
  scheduleData.value = (await scheduleStore.getSchedules()).data
  employees.value = (await scheduleStore.getEmployees()).data
}

const handleDelete = async (id: string) => {
  await scheduleStore.deleteEmployee(Number(id))
  // 刷新数据
  scheduleData.value = (await scheduleStore.getSchedules()).data
  employees.value = (await scheduleStore.getEmployees()).data
}
</script>

<style scoped>
.schedule-container {
  height: calc(100% - 40px); /* 减去 padding */
  display: flex;
  flex-direction: column;
  margin: 20px;
}

.schedule-card {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.title {
  font-size: 18px;
  font-weight: bold;
}

.schedule-tabs {
  flex: 1;
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

:deep(.el-tabs__content) {
  flex: 1;
  overflow: hidden;
}

.tab-content {
  height: 100%;
  overflow: auto;
  padding: 20px;
}

:deep(.el-tab-pane) {
  height: 100%;
}
</style>
