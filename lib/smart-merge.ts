import { TimetableEntry } from './types'

/**
 * Smart merging algorithm that prevents over-merging by considering class boundaries
 */
export function smartMergeTimeBlocks(entries: TimetableEntry[]): TimetableEntry[] {
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
    } else if (canMerge(currentBlock, entry)) {
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

  console.log(`Smart merge: ${sortedEntries.length} entries → ${mergedEntries.length} merged entries`)

  return mergedEntries
}

function canMerge(current: TimetableEntry, next: TimetableEntry): boolean {
  // Basic merge criteria
  const basicMatch =
    current.day === next.day &&
    current.weekType === next.weekType &&
    current.subject === next.subject &&
    current.location === next.location &&
    current.timeEnd === next.timeStart

  if (!basicMatch) return false

  // Additional smart merge rules to prevent over-merging

  // Rule 1: Don't merge across lunch breaks (12:00-13:00)
  if (isLunchBreak(current.timeEnd)) {
    return false
  }

  // Rule 2: Don't merge if duration would exceed reasonable class length (2+ hours)
  const totalDuration = getMinutesDifference(current.timeStart, next.timeEnd)
  if (totalDuration > 120) { // 2 hours
    return false
  }

  // Rule 3: Don't merge across major time gaps (>40 minutes between slots)
  const gap = getMinutesDifference(current.timeEnd, next.timeStart)
  if (gap > 0) { // There's a gap
    return false
  }

  // Rule 4: Don't merge different subject types (e.g., MATH vs PT MATH)
  if (isDifferentSubjectType(current.subject, next.subject)) {
    return false
  }

  return true
}

function isLunchBreak(time: string): boolean {
  const lunchTimes = ['12:00', '12:20', '12:40', '13:00']
  return lunchTimes.includes(time)
}

function getMinutesDifference(timeStart: string, timeEnd: string): number {
  const [startHour, startMin] = timeStart.split(':').map(Number)
  const [endHour, endMin] = timeEnd.split(':').map(Number)

  const startMinutes = startHour * 60 + startMin
  const endMinutes = endHour * 60 + endMin

  return endMinutes - startMinutes
}

function isDifferentSubjectType(subject1: string, subject2: string): boolean {
  // Normalize subjects to compare types
  const normalize = (s: string) => s.replace(/\s*\([^)]*\)/g, '').trim().toUpperCase()
  const norm1 = normalize(subject1)
  const norm2 = normalize(subject2)

  // Different if one is PT (Physical Training) and other isn't
  const isPT1 = norm1.startsWith('PT ')
  const isPT2 = norm2.startsWith('PT ')

  if (isPT1 !== isPT2) return true

  // Different if base subject is different
  const base1 = norm1.replace(/^PT\s+/, '')
  const base2 = norm2.replace(/^PT\s+/, '')

  return base1 !== base2
}