import { api, jsonBody } from './client'
import type { EnrollmentView } from './types'

export const enrollmentApi = {
  list: () => api<EnrollmentView[]>('/api/v1/enrollments'),
  create: (body: {
    studentId: string
    classSectionId: string
    startedOn?: string | null
    allowWaitlist: boolean
    reason?: string | null
  }) => api<EnrollmentView>('/api/v1/enrollments', { method: 'POST', body: jsonBody(body) }),
  cancel: (id: string, reason: string) =>
    api<EnrollmentView>(`/api/v1/enrollments/${id}/cancel`, { method: 'POST', body: jsonBody({ reason }) }),
  transfer: (id: string, body: { targetClassSectionId: string; transferOn?: string | null; reason: string }) =>
    api<EnrollmentView>(`/api/v1/enrollments/${id}/transfer`, { method: 'POST', body: jsonBody(body) }),
}
