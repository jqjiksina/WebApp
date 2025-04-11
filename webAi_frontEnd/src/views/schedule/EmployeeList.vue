<template>
  <div class="employee-list">
    <el-table :data="employees" style="width: 100%">
      <el-table-column prop="name" label="姓名" width="120" />
      <el-table-column prop="employeeId" label="工号" width="120" />
      <el-table-column prop="economicStatus" label="经济情况" width="120">
        <template #default="{ row }">
          {{ getEconomicStatusText(row.economicStatus) }}
        </template>
      </el-table-column>
      <el-table-column prop="availableTimes" label="空闲时段">
        <template #default="{ row }">
          {{ row.availableTimes.join(', ') }}
        </template>
      </el-table-column>
      <el-table-column label="操作" width="120">
        <template #default="{ row }">
          <el-button type="text" @click="handleDelete(row.id)">
            删除
          </el-button>
        </template>
      </el-table-column>
    </el-table>
  </div>
</template>

<script setup lang="ts">
import type { Employee } from '@/types/employee'

defineProps<{
  employees: Employee[]
}>()

const emit = defineEmits(['delete'])

const getEconomicStatusText = (status: string) => {
  const map = {
    'none': '无困难',
    'normal': '一般困难',
    'difficult': '特别困难'
  }
  return map[status as keyof typeof map] || status
}

const handleDelete = (id: string) => {
  emit('delete', id)
}
</script>

<style scoped>
.employee-list {
  margin-top: 20px;
}
</style>
