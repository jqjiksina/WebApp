export interface Employee {
  id: string
  name: string
  employeeId: string
  economicStatus: 'none' | 'normal' | 'difficult'
  availableTimes: string[]
}
