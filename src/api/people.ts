import { api, jsonBody } from './client'
import type {
  GuardianView,
  InstructorView,
  PeopleDirectory,
  PersonInput,
  RelationshipView,
  StudentView,
} from './types'

export const peopleApi = {
  list: () => api<PeopleDirectory>('/api/v1/people'),
  createStudent: (body: { code: string; admissionDate?: string | null; person: PersonInput }) =>
    api<StudentView>('/api/v1/people/students', { method: 'POST', body: jsonBody(body) }),
  createInstructor: (body: { code: string; title?: string | null; specialization?: string | null; person: PersonInput }) =>
    api<InstructorView>('/api/v1/people/instructors', { method: 'POST', body: jsonBody(body) }),
  createGuardian: (body: { occupation?: string | null; person: PersonInput }) =>
    api<GuardianView>('/api/v1/people/guardians', { method: 'POST', body: jsonBody(body) }),
  linkGuardian: (body: {
    studentId: string
    guardianId: string
    relationshipType: string
    primary: boolean
    academicAccess: boolean
    financialAccess: boolean
    pickupPermission: boolean
    receivesNotifications: boolean
    effectiveFrom: string
  }) => api<RelationshipView>('/api/v1/people/guardian-links', { method: 'POST', body: jsonBody(body) }),
}
