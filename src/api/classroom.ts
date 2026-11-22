import { api, jsonBody } from './client'
import type { ClassInstructorView, ClassroomCatalog, OfferingView, SectionView } from './types'

export const classroomApi = {
  list: () => api<ClassroomCatalog>('/api/v1/classroom'),
  createOffering: (body: {
    academicPeriodId: string
    courseId: string
    branchId: string
    code: string
    enrollmentStartsOn?: string | null
    enrollmentEndsOn?: string | null
  }) => api<OfferingView>('/api/v1/classroom/offerings', { method: 'POST', body: jsonBody(body) }),
  createSection: (body: {
    offeringId: string
    code: string
    name: string
    capacity: number
    deliveryMode: string
  }) => api<SectionView>('/api/v1/classroom/sections', { method: 'POST', body: jsonBody(body) }),
  assignInstructor: (body: {
    classSectionId: string
    instructorId: string
    role: string
    primary: boolean
    effectiveFrom: string
    effectiveTo?: string | null
  }) => api<ClassInstructorView>('/api/v1/classroom/instructors', { method: 'POST', body: jsonBody(body) }),
}
