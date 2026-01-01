import { GoogleGenerativeAI } from '@google/generative-ai'
import { TimetableData } from './types'
import { mergeConsecutiveTimeBlocks, consolidateWeekTypes, validateTimetableData } from './timeblocks'
import { smartMergeTimeBlocks } from './smart-merge'
import { TwoStageGeminiProcessor } from './two-stage-gemini'

export class GeminiProcessor {
  private genAI: GoogleGenerativeAI
  private apiKey: string

  constructor(apiKey: string) {
    this.apiKey = apiKey
    this.genAI = new GoogleGenerativeAI(apiKey)
  }

  async processTimetableImage(file: File, useTwoStage: boolean = true): Promise<TimetableData> {
    if (useTwoStage) {
      console.log('Using two-stage Gemini processing...')
      const twoStageProcessor = new TwoStageGeminiProcessor(this.apiKey)
      const rawData = await twoStageProcessor.processImageTwoStage(file)

      // Apply the same processing pipeline
      const validation = validateTimetableData(rawData)
      if (!validation.isValid) {
        console.warn('Two-stage validation issues:', validation.issues)
      }

      const consolidatedEntries = consolidateWeekTypes(rawData.entries || [])
      const mergedEntries = smartMergeTimeBlocks(consolidatedEntries)

      console.log(`Two-stage processing pipeline:`)
      console.log(`  Raw entries: ${rawData.entries?.length || 0}`)
      console.log(`  After consolidation: ${consolidatedEntries.length}`)
      console.log(`  After merging: ${mergedEntries.length}`)

      return {
        studentName: rawData.studentName,
        term: rawData.term,
        entries: mergedEntries
      }
    }

    // Fallback to single-stage processing
    const model = this.genAI.getGenerativeModel({ model: 'gemini-2.5-flash-lite' })

    const prompt = `
You are an OCR expert analyzing a school timetable. Extract ALL schedule information and return as JSON.

CRITICAL INSTRUCTIONS:
1. This timetable has time slots in 20-minute intervals (08:00-08:20, 08:20-08:40, etc.)
2. Classes often span MULTIPLE consecutive 20-minute blocks (e.g., a 1-hour class spans 3 blocks)
3. Extract EVERY individual 20-minute time slot that contains content - do NOT merge them yourself
4. There are typically 35-40 entries total (including both odd and even weeks)
5. Each cell shows: Subject/Location format (e.g., "MATH" over "S2-06")

TIMETABLE STRUCTURE:
- Days: Monday through Friday
- Two sections: "Odd" weeks and "Even" weeks
- Time slots: 08:00-08:20, 08:20-08:40, 08:40-09:00, 09:00-09:20, etc.
- Each occupied cell = one 20-minute entry

EXTRACTION RULES:
- Extract EVERY 20-minute slot that has content
- For spanning cells (same subject across multiple time slots), create separate entries for each 20-minute period
- Subject = the main text (MATH, CCE/Assembly, PT MATH, EdTech, MTG/PD)
- Location = the room/code (S2-06, S4-05, MTG, etc.)
- If cell shows "MATH" and "S2-06", then subject="MATH", location="S2-06"
- Week type: "odd" if in odd week section, "even" if in even week section

JSON FORMAT:
{
  "studentName": "Student name from top of timetable",
  "term": "Term info from header (e.g., 2026 Term1)",
  "entries": [
    {
      "day": "Monday|Tuesday|Wednesday|Thursday|Friday",
      "timeStart": "HH:MM",
      "timeEnd": "HH:MM",
      "subject": "Subject name exactly as shown",
      "location": "Room/location exactly as shown",
      "weekType": "odd|even",
      "title": "Subject/Location"
    }
  ]
}

IMPORTANT:
- Extract EVERY single 20-minute time block that contains any content
- Expected result: 30-40 entries minimum
- DO NOT skip any time slots
- DO NOT merge consecutive blocks

Return ONLY valid JSON, no markdown formatting.`

    const fileData = await this.fileToGenerativePart(file)

    const result = await model.generateContent([prompt, fileData])
    const response = await result.response
    const text = response.text()

    try {
      // Clean up the response text by removing markdown code blocks
      let cleanText = text.trim()
      if (cleanText.startsWith('```json')) {
        cleanText = cleanText.replace(/^```json\s*/, '').replace(/\s*```$/, '')
      }
      if (cleanText.startsWith('```')) {
        cleanText = cleanText.replace(/^```\s*/, '').replace(/\s*```$/, '')
      }

      const rawData = JSON.parse(cleanText)

      // Validate the extracted data
      const validation = validateTimetableData(rawData)
      if (!validation.isValid) {
        console.warn('Validation issues found:', validation.issues)
        // Don't throw error, but log issues for debugging
      }

      // Step 1: Consolidate odd/even duplicates into "both"
      const consolidatedEntries = consolidateWeekTypes(rawData.entries || [])

      // Step 2: Merge consecutive time blocks
      const mergedEntries = mergeConsecutiveTimeBlocks(consolidatedEntries)

      const processedData: TimetableData = {
        studentName: rawData.studentName,
        term: rawData.term,
        entries: mergedEntries
      }

      console.log(`Processing pipeline:`)
      console.log(`  Raw entries: ${rawData.entries?.length || 0}`)
      console.log(`  After consolidation: ${consolidatedEntries.length}`)
      console.log(`  After merging: ${mergedEntries.length}`)

      return processedData
    } catch (error) {
      console.error('Failed to parse Gemini response:', text)
      throw new Error(`Failed to parse Gemini response: ${error}`)
    }
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