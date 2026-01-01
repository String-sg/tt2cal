import ical from 'ical-generator'
import { TimetableData, TimetableEntry } from './types'

export function generateIcal(timetableData: TimetableData, startDate: Date): string {
  const calendar = ical({
    name: `${timetableData.studentName || 'Student'} Timetable`,
    description: `${timetableData.term || 'Academic'} Timetable`,
    timezone: 'Asia/Singapore'
  })

  // Get the Monday of the week containing startDate
  const monday = new Date(startDate)
  const dayOfWeek = monday.getDay()
  const daysToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
  monday.setDate(monday.getDate() + daysToMonday)

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

    // Create recurring rule based on week type
    let rrule: any = {
      freq: 'WEEKLY',
      count: 20 // Assume semester is about 20 weeks
    }

    if (entry.weekType === 'odd') {
      rrule.interval = 2
    } else if (entry.weekType === 'even') {
      rrule.interval = 2
      // Start from the second week
      const evenStartDate = new Date(startDateTime)
      evenStartDate.setDate(evenStartDate.getDate() + 7)
      startDateTime.setTime(evenStartDate.getTime())
      endDateTime.setTime(endDateTime.getTime() + 7 * 24 * 60 * 60 * 1000)
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