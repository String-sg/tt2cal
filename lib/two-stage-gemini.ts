import { GoogleGenerativeAI } from '@google/generative-ai'
import { TimetableData, TimetableEntry } from './types'

export interface GridDataPoint {
  day: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday'
  weekSection: 'odd' | 'even'
  timeColumn: number // Column number (8-31)
  timeSlot: string // '08:00-08:20'
  content: string // Raw cell content
  confidence: number // 0-1
}

export interface ValidationCorrection {
  originalEntry: any
  correctedEntry: any
  reason: string
}

export interface ValidationResult {
  corrections: ValidationCorrection[]
  confidence: number
}

export class TwoStageGeminiProcessor {
  private genAI: GoogleGenerativeAI

  constructor(apiKey: string) {
    this.genAI = new GoogleGenerativeAI(apiKey)
  }

  async processImageTwoStage(file: File): Promise<TimetableData> {
    console.log('Starting two-stage Gemini processing...')

    try {
      // Stage 1: Raw grid extraction
      const gridData = await this.stage1_GridExtraction(file)
      console.log(`Stage 1 completed: ${gridData.length} grid points extracted`)

      // Convert grid data to initial entries
      const initialEntries = this.convertGridToEntries(gridData)
      console.log(`Converted to ${initialEntries.length} initial entries`)

      // Stage 2: Validation and correction (temporarily disabled due to API limits)
      let correctedEntries = initialEntries
      try {
        const validationResult = await this.stage2_ValidationCorrection(file, initialEntries)
        console.log(`Stage 2 completed: ${validationResult.corrections.length} corrections applied`)
        correctedEntries = this.applyCorrections(initialEntries, validationResult.corrections)
      } catch (error) {
        console.warn('Stage 2 failed, proceeding with Stage 1 results:', error.message)
        correctedEntries = initialEntries
      }

      return {
        studentName: 'Liu Yi Jie', // TODO: Extract from image
        term: '2026 Term1', // TODO: Extract from image
        entries: correctedEntries
      }
    } catch (error) {
      console.error('Two-stage processing failed:', error)
      throw error
    }
  }

  private async stage1_GridExtraction(file: File): Promise<GridDataPoint[]> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    const prompt = `
You are analyzing a school timetable grid. Extract EVERY cell that contains content as individual data points.

GRID STRUCTURE:
- Time columns are numbered 8-31 (representing time slots from 08:00 to 18:00)
- Each column = 20-minute slot: Column 8 = 08:00-08:20, Column 9 = 08:20-08:40, etc.
- Rows are days: Monday, Tuesday, Wednesday, Thursday, Friday
- Two main sections: "Odd" weeks and "Even" weeks

EXTRACTION STRATEGY:
1. Go column by column (8, 9, 10, ... 31)
2. For each column, check both Odd and Even sections
3. For each day (Mon, Tue, Wed, Thu, Fri), extract any content found
4. Record the exact column number and content

IMPORTANT:
- Extract EVERY occupied cell individually
- Do NOT merge spanning cells - record each column separately
- If a cell spans multiple columns, create separate entries for each column
- Include empty content as null for completeness

Return JSON array of data points:
[
  {
    "day": "Monday",
    "weekSection": "odd",
    "timeColumn": 8,
    "timeSlot": "08:00-08:20",
    "content": "MTG/PD",
    "confidence": 0.95
  },
  {
    "day": "Monday",
    "weekSection": "odd",
    "timeColumn": 9,
    "timeSlot": "08:20-08:40",
    "content": "MTG/PD",
    "confidence": 0.95
  }
]

Focus on ACCURACY over speed. Record confidence (0-1) for each extraction.
Return ONLY valid JSON array, no markdown.`

    const fileData = await this.fileToGenerativePart(file)
    const result = await model.generateContent([prompt, fileData])
    const response = await result.response
    const text = response.text()

    return this.parseGridResponse(text)
  }

  private async stage2_ValidationCorrection(
    file: File,
    initialEntries: TimetableEntry[]
  ): Promise<ValidationResult> {
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    const prompt = `
You are validating timetable extraction results against the original image.

EXTRACTED ENTRIES:
${JSON.stringify(initialEntries, null, 2)}

VALIDATION TASKS:
1. Check if time slots are correctly mapped to grid columns
2. Identify spanning cells that should be merged (same subject across consecutive times)
3. Detect positioning errors (wrong start/end times)
4. Flag missing entries or incorrect subject/location mappings

COMMON ERRORS TO DETECT:
- Time misalignment (e.g., 12:40-14:00 vs 11:40-12:40)
- Spanning cells incorrectly split
- Missing entries in the grid
- Subject/location mismatches

Return corrections as JSON:
{
  "corrections": [
    {
      "originalEntry": {original entry object},
      "correctedEntry": {corrected entry object},
      "reason": "Cell spans columns 16-19, not 14-16"
    }
  ],
  "confidence": 0.92
}

Return ONLY valid JSON, no markdown.`

    const fileData = await this.fileToGenerativePart(file)
    const result = await model.generateContent([prompt, fileData])
    const response = await result.response
    const text = response.text()

    return this.parseValidationResponse(text)
  }

  private convertGridToEntries(gridData: GridDataPoint[]): TimetableEntry[] {
    const entries: TimetableEntry[] = []

    for (const point of gridData) {
      if (!point.content || point.content.trim() === '') continue

      const [timeStart, timeEnd] = point.timeSlot.split('-')
      const [subject, location] = this.parseContent(point.content)

      entries.push({
        day: point.day,
        timeStart: timeStart.trim(),
        timeEnd: timeEnd.trim(),
        subject: subject,
        location: location,
        weekType: point.weekSection as 'odd' | 'even',
        title: `${subject}/${location}`
      })
    }

    return entries
  }

  private parseContent(content: string): [string, string] {
    // Parse content like "MATH\nS2-06" or "MTG/PD"
    const lines = content.split('\n').map(l => l.trim())
    if (lines.length >= 2) {
      return [lines[0], lines[1]]
    }

    // Handle single line formats like "MTG/PD"
    if (content.includes('/')) {
      const [subject, location] = content.split('/')
      return [subject.trim(), location.trim()]
    }

    return [content.trim(), '']
  }

  private applyCorrections(
    entries: TimetableEntry[],
    corrections: ValidationCorrection[]
  ): TimetableEntry[] {
    let correctedEntries = [...entries]

    for (const correction of corrections) {
      const index = correctedEntries.findIndex(entry =>
        this.entriesMatch(entry, correction.originalEntry)
      )

      if (index !== -1) {
        correctedEntries[index] = correction.correctedEntry
        console.log(`Applied correction: ${correction.reason}`)
      }
    }

    return correctedEntries
  }

  private entriesMatch(entry1: any, entry2: any): boolean {
    return entry1.day === entry2.day &&
           entry1.timeStart === entry2.timeStart &&
           entry1.subject === entry2.subject &&
           entry1.weekType === entry2.weekType
  }

  private parseGridResponse(text: string): GridDataPoint[] {
    const cleanText = this.cleanJsonResponse(text)
    try {
      return JSON.parse(cleanText)
    } catch (error) {
      console.error('Failed to parse grid response:', text)
      throw new Error(`Stage 1 parsing failed: ${error}`)
    }
  }

  private parseValidationResponse(text: string): ValidationResult {
    const cleanText = this.cleanJsonResponse(text)
    try {
      return JSON.parse(cleanText)
    } catch (error) {
      console.error('Failed to parse validation response:', text)
      // Return empty result on parsing failure
      return { corrections: [], confidence: 0.5 }
    }
  }

  private cleanJsonResponse(text: string): string {
    let cleanText = text.trim()
    if (cleanText.startsWith('```json')) {
      cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
    }
    if (cleanText.startsWith('```')) {
      cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '')
    }
    return cleanText
  }

  private async fileToGenerativePart(file: File) {
    return {
      inlineData: {
        data: Buffer.from(await file.arrayBuffer()).toString('base64'),
        mimeType: file.type,
      },
    }
  }
}