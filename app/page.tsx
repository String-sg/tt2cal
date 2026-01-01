'use client'

import { useState } from 'react'
import FileUpload from '../components/FileUpload'
import DataEditor from '../components/DataEditor'
import { TimetableData, ProcessingResult } from '../lib/types'
import { generateIcal } from '../lib/ical-generator'

export default function Home() {
  const [isProcessing, setIsProcessing] = useState(false)
  const [timetableData, setTimetableData] = useState<TimetableData | null>(null)
  const [error, setError] = useState<string | null>(null)

  const handleFileUpload = async (file: File) => {
    setIsProcessing(true)
    setError(null)
    setTimetableData(null)

    try {
      const formData = new FormData()
      formData.append('file', file)

      const response = await fetch('/api/process-timetable', {
        method: 'POST',
        body: formData,
      })

      const result: ProcessingResult = await response.json()

      if (result.success && result.data) {
        setTimetableData(result.data)
      } else {
        setError(result.error || 'Failed to process timetable')
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unexpected error occurred')
    } finally {
      setIsProcessing(false)
    }
  }

  const handleDataChange = (data: TimetableData) => {
    setTimetableData(data)
  }

  const handleExport = () => {
    if (!timetableData) return

    try {
      // Use the start of the next week (Monday) as default start date
      const today = new Date()
      const nextMonday = new Date()
      const daysUntilMonday = (8 - today.getDay()) % 7 || 7
      nextMonday.setDate(today.getDate() + daysUntilMonday)

      const icalContent = generateIcal(timetableData, nextMonday)

      // Create and download file
      const blob = new Blob([icalContent], { type: 'text/calendar' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${timetableData.studentName || 'timetable'}_${timetableData.term || 'schedule'}.ics`
      document.body.appendChild(a)
      a.click()
      document.body.removeChild(a)
      URL.revokeObjectURL(url)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to export calendar')
    }
  }

  return (
    <main className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">
            TT2Cal
          </h1>
          <p className="text-lg text-gray-600">
            Convert your timetable images to iCal format
          </p>
        </div>

        {/* Upload Section */}
        {!timetableData && (
          <div className="mb-8">
            <FileUpload onFileUpload={handleFileUpload} isProcessing={isProcessing} />
          </div>
        )}

        {/* Error Display */}
        {error && (
          <div className="mb-6 max-w-xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex">
                <svg className="h-5 w-5 text-red-400 mr-2" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                </svg>
                <div>
                  <h3 className="text-sm font-medium text-red-800">Error</h3>
                  <p className="text-sm text-red-700 mt-1">{error}</p>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Data Editor */}
        {timetableData && (
          <DataEditor
            data={timetableData}
            onDataChange={handleDataChange}
            onExport={handleExport}
          />
        )}

        {/* Instructions */}
        {!timetableData && !isProcessing && (
          <div className="max-w-2xl mx-auto mt-12">
            <div className="bg-white p-6 rounded-lg shadow-sm border">
              <h2 className="text-xl font-semibold mb-4">How it works:</h2>
              <ol className="list-decimal list-inside space-y-2 text-gray-700">
                <li>Upload your timetable image (PNG, JPG, JPEG) or PDF</li>
                <li>AI will extract schedule information from your timetable</li>
                <li>Review and edit the extracted data if needed</li>
                <li>Export as iCal file (.ics) for import into your calendar app</li>
              </ol>

              <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  <strong>Note:</strong> Currently optimized for Singapore school timetables with odd/even week patterns.
                  Make sure to set up your GEMINI_API_KEY in your .env.local file.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Reset Button */}
        {timetableData && (
          <div className="text-center mt-8">
            <button
              onClick={() => {
                setTimetableData(null)
                setError(null)
              }}
              className="px-4 py-2 text-sm text-gray-600 border border-gray-300 rounded-md hover:bg-gray-50 transition-colors"
            >
              Upload Another Timetable
            </button>
          </div>
        )}
      </div>
    </main>
  )
}