import { defineStore } from 'pinia'
import { scheduleApi } from '@/api/schedule/scheduleApi'
import type { Schedule, ScheduleEmployee } from '@/types/schedule'

interface ScheduleState {
  schedules: Schedule[]
  employees: ScheduleEmployee[]
  loading: boolean
  error: string | null
}

export const useScheduleStore = defineStore('schedule', {
  state: (): ScheduleState => ({
    schedules: [],
    employees: [],
    loading: false,
    error: null
  }),

  actions: {
    async addEmployee(employee: ScheduleEmployee) {
      await scheduleApi.addEmployee(employee)
      await this.fetchEmployees()
    },

    async deleteEmployee(id: number) {
      await scheduleApi.deleteEmployee(id)
      await this.fetchEmployees()
    },

    async generateSchedule() {
      this.schedules = (await scheduleApi.generateSchedule()).data
    },

    async fetchEmployees() {
      this.employees = (await scheduleApi.getEmployees()).data
    },

    async getSchedules() {
      return await scheduleApi.getSchedules()
    },

    async getEmployees() {
      return await scheduleApi.getEmployees()
    }
  }
})
