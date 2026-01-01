import ical from 'ical-generator'
import { TimetableData, TimetableEntry } from './types'
import { getNextMondayWeekType, getWeekType } from './academic-calendar'

export function generateIcal(timetableData: TimetableData, startDate?: Date): string {
  const calendar = ical({
    name: `${timetableData.studentName || 'Student'} Timetable`,
    description: `${timetableData.term || 'Academic'} Timetable`,
    timezone: 'Asia/Singapore'
  })

  // Use next Monday if no start date provided, or calculate from provided date
  const { monday } = startDate
    ? { monday: startDate }
    : getNextMondayWeekType()

  timetableData.entries.forEach(entry => {
    const dayOffset = getDayOffset(entry.day)
    const eventDate = new Date(monday)
    eventDate.setDate(monday.getDate() + dayOffset)

    const [startHour, startMinute] = entry.timeStart.split(':').map(Number)
    const [endHour, endMinute] = entry.timeEnd.split(':').map(Number)

    const startDateTime = new Date(eventDate)
    startDateTime.setHours(startHour, startMinute, 0, 0)

    const endDateTime = new Date(eventDate)
    endDateTime.setHours(endHour, endMinute, 0, 0)

    // Create recurring rule based on week type using academic calendar
    let rrule: any = {
      freq: 'WEEKLY',
      count: 40 // Full academic year
    }

    // Use academic calendar to determine actual start dates
    const currentWeekType = getWeekType(startDateTime)

    if (entry.weekType === 'odd') {
      rrule.interval = 2
      // If current week doesn't match, find the next odd week
      if (currentWeekType !== 'odd') {
        const nextOddWeek = getNextMondayWeekType(startDateTime)
        if (nextOddWeek.weekType === 'odd') {
          const adjustment = Math.floor((nextOddWeek.monday.getTime() - monday.getTime()) / (7 * 24 * 60 * 60 * 1000))
          startDateTime.setDate(startDateTime.getDate() + adjustment * 7)
          endDateTime.setDate(endDateTime.getDate() + adjustment * 7)
        }
      }
    } else if (entry.weekType === 'even') {
      rrule.interval = 2
      // If current week doesn't match, find the next even week
      if (currentWeekType !== 'even') {
        const nextEvenWeek = getNextMondayWeekType(startDateTime)
        if (nextEvenWeek.weekType === 'even') {
          const adjustment = Math.floor((nextEvenWeek.monday.getTime() - monday.getTime()) / (7 * 24 * 60 * 60 * 1000))
          startDateTime.setDate(startDateTime.getDate() + adjustment * 7)
          endDateTime.setDate(endDateTime.getDate() + adjustment * 7)
        }
      }
    }

    calendar.createEvent({
      start: startDateTime,
      end: endDateTime,
      summary: entry.title,
      description: `Subject: ${entry.subject}\nLocation: ${entry.location}`,
      location: entry.location,
      repeating: rrule
    })
  })

  return calendar.toString()
}

function getDayOffset(day: string): number {
  const days = {
    'Monday': 0,
    'Tuesday': 1,
    'Wednesday': 2,
    'Thursday': 3,
    'Friday': 4
  }
  return days[day as keyof typeof days] || 0
}