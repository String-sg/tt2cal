import { TimetableEntry } from './types'

/**
 * Merges consecutive timetable entries that represent the same event into single, longer blocks.
 *
 * Entries are first sorted by day, week type, and start time to ensure deterministic processing.
 * Adjacent entries are merged when they share the same day, weekType, subject, and location,
 * and the end time of the current entry exactly matches the start time of the next entry.
 * This produces cleaner calendar entries by collapsing multiple contiguous time slots for
 * the same class into one combined `TimetableEntry`.
 *
 * @param entries - The raw timetable entries to normalize and merge.
 * @returns A new array of `TimetableEntry` objects with consecutive blocks merged.
 */
export function mergeConsecutiveTimeBlocks(entries: TimetableEntry[]): TimetableEntry[] {
  // Sort entries by day, weekType, timeStart for consistent processing
  const sortedEntries = [...entries].sort((a, b) => {
    const dayOrder = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
    const dayComparison = dayOrder.indexOf(a.day) - dayOrder.indexOf(b.day)
    if (dayComparison !== 0) return dayComparison

    const weekComparison = a.weekType.localeCompare(b.weekType)
    if (weekComparison !== 0) return weekComparison

    return a.timeStart.localeCompare(b.timeStart)
  })

  const mergedEntries: TimetableEntry[] = []
  let currentBlock: TimetableEntry | null = null

  for (const entry of sortedEntries) {
    if (!currentBlock) {
      // Start a new block
      currentBlock = { ...entry }
    } else if (
      // Check if this entry can be merged with the current block
      currentBlock.day === entry.day &&
      currentBlock.weekType === entry.weekType &&
      currentBlock.subject === entry.subject &&
      currentBlock.location === entry.location &&
      currentBlock.timeEnd === entry.timeStart
    ) {
      // Merge: extend the end time
      currentBlock.timeEnd = entry.timeEnd
      currentBlock.title = `${currentBlock.subject}/${currentBlock.location}`
    } else {
      // Can't merge - save current block and start a new one
      mergedEntries.push(currentBlock)
      currentBlock = { ...entry }
    }
  }

  // Add the final block
  if (currentBlock) {
    mergedEntries.push(currentBlock)
  }

  return mergedEntries
}

export function validateTimetableData(data: any): { isValid: boolean; issues: string[] } {
  const issues: string[] = []

  // Check basic structure
  if (!data.entries || !Array.isArray(data.entries)) {
    issues.push('No entries array found')
    return { isValid: false, issues }
  }

  // Check entry count (expecting 30-40 for complete extraction)
  if (data.entries.length < 20) {
    issues.push(`Too few entries extracted (${data.entries.length}). Expected 30-40 entries.`)
  }

  // Check for required fields in entries
  const requiredFields = ['day', 'timeStart', 'timeEnd', 'subject', 'location', 'weekType']
  const invalidEntries = data.entries.filter((entry: any) =>
    requiredFields.some(field => !entry[field])
  )

  if (invalidEntries.length > 0) {
    issues.push(`${invalidEntries.length} entries missing required fields`)
  }

  // Check for reasonable time format
  const timePattern = /^([01]\d|2[0-3]):([0-5]\d)$/
  const badTimes = data.entries.filter((entry: any) =>
    !timePattern.test(entry.timeStart) || !timePattern.test(entry.timeEnd)
  )

  if (badTimes.length > 0) {
    issues.push(`${badTimes.length} entries have invalid time format`)
  }

  // Check week type values
  const invalidWeekTypes = data.entries.filter((entry: any) =>
    !['odd', 'even', 'both'].includes(entry.weekType)
  )

  if (invalidWeekTypes.length > 0) {
    issues.push(`${invalidWeekTypes.length} entries have invalid weekType`)
  }

  // Check day values
  const validDays = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday']
  const invalidDays = data.entries.filter((entry: any) =>
    !validDays.includes(entry.day)
  )

  if (invalidDays.length > 0) {
    issues.push(`${invalidDays.length} entries have invalid day`)
  }

  return {
    isValid: issues.length === 0,
    issues
  }
}