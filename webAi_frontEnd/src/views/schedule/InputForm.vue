<template>
  <el-form :model="form" label-width="120px">
    <el-form-item label="姓名">
      <el-input v-model="form.name" />
    </el-form-item>

    <el-form-item label="工号">
      <el-input v-model="form.employeeId" />
    </el-form-item>

    <el-form-item label="经济情况">
      <el-select v-model="form.economicStatus">
        <el-option label="无困难" value="none" />
        <el-option label="一般困难" value="normal" />
        <el-option label="特别困难" value="difficult" />
      </el-select>
    </el-form-item>

    <el-form-item label="空闲时段">
      <el-select v-model="form.availableTimes" multiple>
        <el-option
          v-for="time in timeSlots"
          :key="time"
          :label="time"
          :value="time"
        />
      </el-select>
    </el-form-item>

    <el-form-item>
      <el-button type="primary" @click="handleSubmit">提交</el-button>
      <el-button @click="$emit('cancel')">取消</el-button>
    </el-form-item>
  </el-form>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import type { ScheduleForm } from '@/types/schedule'

const emit = defineEmits(['submit', 'cancel'])

const form = ref<ScheduleForm>({
  name: '',
  employeeId: '',
  economicStatus: 'none',
  availableTimes: []
})

const timeSlots = [
  '周一上午', '周一下午',
  '周二上午', '周二下午',
  '周三上午', '周三下午',
  '周四上午', '周四下午',
  '周五上午', '周五下午',
  '周六上午', '周六下午',
  '周日上午', '周日下午'
]

const handleSubmit = () => {
  emit('submit', form.value)
}
</script>
