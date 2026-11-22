import { api, jsonBody } from './client'
import type { AcademicCatalog, CourseView, PeriodView, ProgramCourseView, ProgramView } from './types'

export const academicApi = {
  list: () => api<AcademicCatalog>('/api/v1/academic'),
  createPeriod: (body: { code: string; name: string; type: string; startsOn: string; endsOn: string }) =>
    api<PeriodView>('/api/v1/academic/periods', { method: 'POST', body: jsonBody(body) }),
  createProgram: (body: { code: string; name: string; type: string; description?: string | null }) =>
    api<ProgramView>('/api/v1/academic/programs', { method: 'POST', body: jsonBody(body) }),
  createCourse: (body: { code: string; title: string; description?: string | null; durationMinutes?: number | null }) =>
    api<CourseView>('/api/v1/academic/courses', { method: 'POST', body: jsonBody(body) }),
  attachCourse: (body: { programId: string; courseId: string; sequenceNumber: number; required: boolean }) =>
    api<ProgramCourseView>('/api/v1/academic/program-courses', { method: 'POST', body: jsonBody(body) }),
}
