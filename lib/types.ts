export interface TimetableEntry {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'
  timeStart: string // '08:00'
  timeEnd: string   // '08:20'
  subject: string   // 'MATH'
  location: string  // 'S2-06'
  weekType: 'odd' | 'even' | 'both'
  title: string     // 'MATH/S2-06'
}

export interface TimetableData {
  studentName?: string
  term?: string
  entries: TimetableEntry[]
}

export interface ProcessingResult {
  success: boolean
  data?: TimetableData
  error?: string
}