// Academic Calendar for Singapore Schools 2025
// Based on MOE academic calendar - hardcoded for 2025

export interface AcademicWeek {
  weekStart: string // YYYY-MM-DD format
  weekType: 'odd' | 'even'
  termWeek: number
}

// 2025 Academic Calendar - Singapore Schools
export const ACADEMIC_CALENDAR_2025: AcademicWeek[] = [
  // Term 1 (Jan-Mar)
  { weekStart: '2025-01-06', weekType: 'odd', termWeek: 1 },
  { weekStart: '2025-01-13', weekType: 'even', termWeek: 2 },
  { weekStart: '2025-01-20', weekType: 'odd', termWeek: 3 },
  { weekStart: '2025-01-27', weekType: 'even', termWeek: 4 },
  { weekStart: '2025-02-03', weekType: 'odd', termWeek: 5 },
  { weekStart: '2025-02-10', weekType: 'even', termWeek: 6 },
  { weekStart: '2025-02-17', weekType: 'odd', termWeek: 7 },
  { weekStart: '2025-02-24', weekType: 'even', termWeek: 8 },
  { weekStart: '2025-03-03', weekType: 'odd', termWeek: 9 },
  { weekStart: '2025-03-10', weekType: 'even', termWeek: 10 },

  // Term 2 (Mar-May)
  { weekStart: '2025-03-17', weekType: 'odd', termWeek: 1 },
  { weekStart: '2025-03-24', weekType: 'even', termWeek: 2 },
  { weekStart: '2025-03-31', weekType: 'odd', termWeek: 3 },
  { weekStart: '2025-04-07', weekType: 'even', termWeek: 4 },
  { weekStart: '2025-04-14', weekType: 'odd', termWeek: 5 },
  { weekStart: '2025-04-21', weekType: 'even', termWeek: 6 },
  { weekStart: '2025-04-28', weekType: 'odd', termWeek: 7 },
  { weekStart: '2025-05-05', weekType: 'even', termWeek: 8 },
  { weekStart: '2025-05-12', weekType: 'odd', termWeek: 9 },
  { weekStart: '2025-05-19', weekType: 'even', termWeek: 10 },

  // Term 3 (Jun-Aug)
  { weekStart: '2025-06-23', weekType: 'odd', termWeek: 1 },
  { weekStart: '2025-06-30', weekType: 'even', termWeek: 2 },
  { weekStart: '2025-07-07', weekType: 'odd', termWeek: 3 },
  { weekStart: '2025-07-14', weekType: 'even', termWeek: 4 },
  { weekStart: '2025-07-21', weekType: 'odd', termWeek: 5 },
  { weekStart: '2025-07-28', weekType: 'even', termWeek: 6 },
  { weekStart: '2025-08-04', weekType: 'odd', termWeek: 7 },
  { weekStart: '2025-08-11', weekType: 'even', termWeek: 8 },
  { weekStart: '2025-08-18', weekType: 'odd', termWeek: 9 },
  { weekStart: '2025-08-25', weekType: 'even', termWeek: 10 },

  // Term 4 (Sep-Nov)
  { weekStart: '2025-09-01', weekType: 'odd', termWeek: 1 },
  { weekStart: '2025-09-08', weekType: 'even', termWeek: 2 },
  { weekStart: '2025-09-15', weekType: 'odd', termWeek: 3 },
  { weekStart: '2025-09-22', weekType: 'even', termWeek: 4 },
  { weekStart: '2025-09-29', weekType: 'odd', termWeek: 5 },
  { weekStart: '2025-10-06', weekType: 'even', termWeek: 6 },
  { weekStart: '2025-10-13', weekType: 'odd', termWeek: 7 },
  { weekStart: '2025-10-20', weekType: 'even', termWeek: 8 },
  { weekStart: '2025-10-27', weekType: 'odd', termWeek: 9 },
  { weekStart: '2025-11-03', weekType: 'even', termWeek: 10 }
]

export function getWeekType(date: Date): 'odd' | 'even' | null {
  const dateStr = date.toISOString().split('T')[0] // YYYY-MM-DD

  // Find the week that contains this date
  const targetWeek = ACADEMIC_CALENDAR_2025.find(week => {
    const weekStart = new Date(week.weekStart)
    const weekEnd = new Date(weekStart)
    weekEnd.setDate(weekStart.getDate() + 6) // End of week is 6 days later

    return date >= weekStart && date <= weekEnd
  })

  return targetWeek?.weekType || null
}

export function getNextMondayWeekType(date: Date = new Date()): { monday: Date; weekType: 'odd' | 'even' | null } {
  const nextMonday = new Date(date)
  const daysUntilMonday = (8 - nextMonday.getDay()) % 7 || 7
  nextMonday.setDate(nextMonday.getDate() + daysUntilMonday)

  const weekType = getWeekType(nextMonday)

  return {
    monday: nextMonday,
    weekType
  }
}