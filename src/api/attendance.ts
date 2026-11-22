import { api, jsonBody } from './client'
import type { AttendanceSheet, AttendanceSummary } from './types'

export const attendanceApi = {
  list: () => api<AttendanceSummary[]>('/api/v1/attendance'),
  sheet: (id: string) => api<AttendanceSheet>(`/api/v1/attendance/sessions/${id}`),
  save: (id: string, body: {
    finalizeSheet: boolean
    correctionReason?: string | null
    records: Array<{
      studentId: string
      status: string
      deliveryMode: string
      lateMinutes?: number | null
      note?: string | null
    }>
  }) => api<AttendanceSheet>(`/api/v1/attendance/sessions/${id}`, { method: 'PUT', body: jsonBody(body) }),
}
