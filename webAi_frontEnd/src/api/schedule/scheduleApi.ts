import request from '@/utils/request'
import type { Schedule, ScheduleForm, ScheduleEmployee } from '@/types/schedule'

export const scheduleApi = {
  // 获取排班列表
  getSchedules: () => request.get<Schedule[]>('/api/schedules'),

  // 创建排班
  createSchedule: (data: ScheduleForm) => request.post<Schedule>('/api/schedules', data as unknown as Record<string, unknown>),

  // 更新排班
  updateSchedule: (id: number, data: ScheduleForm) => request.put<Schedule>(`/api/schedules/${id}`, data as unknown as Record<string, unknown>),

  // 删除排班
  deleteSchedule: (id: number) => request.delete(`/api/schedules/${id}`),

  // 获取员工列表
  getEmployees: () => request.get<ScheduleEmployee[]>('/api/employees'),

  // 添加员工
  addEmployee: (employee: ScheduleEmployee) => request.post<ScheduleEmployee>('/api/employees', employee as unknown as Record<string, unknown>),

  // 更新员工
  updateEmployee: (id: number, employee: ScheduleEmployee) => request.put<ScheduleEmployee>(`/api/employees/${id}`, employee as unknown as Record<string, unknown>),

  // 删除员工
  deleteEmployee: (id: number) => request.delete(`/api/employees/${id}`),

  // 生成排班
  generateSchedule: () => request.post<Schedule[]>('/api/schedules/generate')
}
