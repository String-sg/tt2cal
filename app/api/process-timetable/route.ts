import { NextRequest, NextResponse } from 'next/server'
import { GeminiProcessor } from '../../../lib/gemini'

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData()
    const file = formData.get('file') as File

    if (!file) {
      return NextResponse.json({ error: 'No file provided' }, { status: 400 })
    }

    const apiKey = process.env.GEMINI_API_KEY
    if (!apiKey) {
      return NextResponse.json({ error: 'Gemini API key not configured' }, { status: 500 })
    }

    // Validate file type
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg', 'application/pdf']
    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json({
        error: 'Invalid file type. Please upload PNG, JPG, JPEG, or PDF files.'
      }, { status: 400 })
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json({
        error: 'File too large. Please upload files smaller than 10MB.'
      }, { status: 400 })
    }

    const processor = new GeminiProcessor(apiKey)
    const timetableData = await processor.processTimetableImage(file)

    return NextResponse.json({
      success: true,
      data: timetableData
    })

  } catch (error) {
    console.error('Error processing timetable:', error)
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    }, { status: 500 })
  }
}