<template>
  <div class="schedule-table">
    <el-table
      :data="mockData"
      style="width: 100%"
      border
      stripe
      size="small"
    >
      <el-table-column prop="date" label="日期" width="120" align="center" />
      <el-table-column prop="timeSlot" label="时段" width="180" align="center" />
      <el-table-column prop="employeeName" label="值班人员" align="center" />
      <el-table-column label="操作" width="120" align="center">
        <template #default="{ row }">
          <el-button
            type="primary"
            size="small"
            @click="handleSwap(row)"
          >
            换班
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { Schedule } from '@/types/schedule'

defineProps<{
  scheduleData: Schedule[]
}>()

const emit = defineEmits(['swap'])

// 模拟数据
const mockData = ref([
  {
    date: '2024-03-20',
    timeSlot: '08:00-12:00',
    employeeName: '张三',
    employeeId: 1
  },
  {
    date: '2024-03-20',
    timeSlot: '12:00-16:00',
    employeeName: '李四',
    employeeId: 2
  },
  {
    date: '2024-03-20',
    timeSlot: '16:00-20:00',
    employeeName: '王五',
    employeeId: 3
  }
])

const handleSwap = (schedule: Schedule) => {
  emit('swap', schedule)
}
</script>

<style scoped>
.schedule-table {
  margin-top: 20px;
  height: 100%;
  overflow: auto;
}

:deep(.el-table) {
  font-size: 14px;
  height: 100%;
}

:deep(.el-table th) {
  background-color: #f5f7fa;
  color: #606266;
  font-weight: bold;
  padding: 8px 0;
}

:deep(.el-table td) {
  padding: 8px 0;
}

:deep(.el-table--striped .el-table__body tr.el-table__row--striped td) {
  background: #fafafa;
}

:deep(.el-button--small) {
  padding: 5px 10px;
  font-size: 12px;
}
</style>
