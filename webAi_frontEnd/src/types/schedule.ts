export interface ScheduleEmployee {
  id: string
  name: string
  employeeId: string
  economicStatus: 'none' | 'normal' | 'difficult'
  availableTimes: string[]
}

export interface Schedule {
  id: string
  timeSlot: string
  employeeId: string
  employeeName: string
}

export interface ScheduleForm {
  name: string
  employeeId: string
  economicStatus: 'none' | 'normal' | 'difficult'
  availableTimes: string[]
}
