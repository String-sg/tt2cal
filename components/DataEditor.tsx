'use client'

import { useState, useEffect } from 'react'
import { TimetableData, TimetableEntry } from '../lib/types'

interface DataEditorProps {
  data: TimetableData
  onDataChange: (data: TimetableData) => void
  onExport: () => void
}

export default function DataEditor({ data, onDataChange, onExport }: DataEditorProps) {
  const [editableData, setEditableData] = useState<TimetableData>(data)

  useEffect(() => {
    setEditableData(data)
  }, [data])

  const handleEntryChange = (index: number, field: keyof TimetableEntry, value: string) => {
    const updatedEntries = [...editableData.entries]
    updatedEntries[index] = { ...updatedEntries[index], [field]: value }

    // Update title when subject or location changes
    if (field === 'subject' || field === 'location') {
      const entry = updatedEntries[index]
      updatedEntries[index].title = `${field === 'subject' ? value : entry.subject}/${field === 'location' ? value : entry.location}`
    }

    const updatedData = { ...editableData, entries: updatedEntries }
    setEditableData(updatedData)
    onDataChange(updatedData)
  }

  const handleStudentNameChange = (value: string) => {
    const updatedData = { ...editableData, studentName: value }
    setEditableData(updatedData)
    onDataChange(updatedData)
  }

  const handleTermChange = (value: string) => {
    const updatedData = { ...editableData, term: value }
    setEditableData(updatedData)
    onDataChange(updatedData)
  }

  const removeEntry = (index: number) => {
    const updatedEntries = editableData.entries.filter((_, i) => i !== index)
    const updatedData = { ...editableData, entries: updatedEntries }
    setEditableData(updatedData)
    onDataChange(updatedData)
  }

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header Info */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <h2 className="text-xl font-semibold mb-4">Timetable Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Student Name
            </label>
            <input
              type="text"
              value={editableData.studentName || ''}
              onChange={(e) => handleStudentNameChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter student name"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Term
            </label>
            <input
              type="text"
              value={editableData.term || ''}
              onChange={(e) => handleTermChange(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Enter term (e.g., 2026 Term1)"
            />
          </div>
        </div>
      </div>

      {/* Timetable Entries */}
      <div className="bg-white p-6 rounded-lg shadow-sm border">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold">Schedule Entries ({editableData.entries.length})</h3>
          <button
            onClick={onExport}
            className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
          >
            Export to iCal
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full table-auto">
            <thead>
              <tr className="bg-gray-50">
                <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Day</th>
                <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Start</th>
                <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">End</th>
                <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Subject</th>
                <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Location</th>
                <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Week</th>
                <th className="px-3 py-2 text-left text-sm font-medium text-gray-700">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {editableData.entries.map((entry, index) => (
                <tr key={index} className="hover:bg-gray-50">
                  <td className="px-3 py-2">
                    <select
                      value={entry.day}
                      onChange={(e) => handleEntryChange(index, 'day', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="Monday">Monday</option>
                      <option value="Tuesday">Tuesday</option>
                      <option value="Wednesday">Wednesday</option>
                      <option value="Thursday">Thursday</option>
                      <option value="Friday">Friday</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="time"
                      value={entry.timeStart}
                      onChange={(e) => handleEntryChange(index, 'timeStart', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="time"
                      value={entry.timeEnd}
                      onChange={(e) => handleEntryChange(index, 'timeEnd', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={entry.subject}
                      onChange={(e) => handleEntryChange(index, 'subject', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g., MATH"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <input
                      type="text"
                      value={entry.location}
                      onChange={(e) => handleEntryChange(index, 'location', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                      placeholder="e.g., S2-06"
                    />
                  </td>
                  <td className="px-3 py-2">
                    <select
                      value={entry.weekType}
                      onChange={(e) => handleEntryChange(index, 'weekType', e.target.value)}
                      className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500"
                    >
                      <option value="both">Both</option>
                      <option value="odd">Odd</option>
                      <option value="even">Even</option>
                    </select>
                  </td>
                  <td className="px-3 py-2">
                    <button
                      onClick={() => removeEntry(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {editableData.entries.length === 0 && (
          <div className="text-center py-8 text-gray-500">
            No schedule entries found. Please upload a timetable image.
          </div>
        )}
      </div>
    </div>
  )
}