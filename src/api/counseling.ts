import { api, jsonBody } from './client'

export type DailyLogEntryView = {
  id: string
  activityTitle: string
  subjectName: string | null
  durationMinutes: number
  notes: string | null
}

export type DailyLogView = {
  id: string
  studentId: string
  studentName: string
  logDate: string
  status: string
  daySummary: string | null
  counselorFeedback: string | null
  reviewedAt: string | null
  entries: DailyLogEntryView[]
}

export type StudyPlanItemView = {
  id: string
  subjectName: string
  activityTitle: string
  targetMinutes: number
  plannedDate: string | null
  notes: string | null
  completedMinutes: number | null
  completedAt: string | null
  progressNote: string | null
}

export type StudyPlanView = {
  id: string
  studentId: string
  studentName: string
  title: string
  description: string | null
  startDate: string
  endDate: string
  status: string
  items: StudyPlanItemView[]
}

export type AdminReportView = {
  id: string
  counselorMembershipId: string
  counselorName: string
  title: string
  body: string
  periodLabel: string | null
  status: string
  sentAt: string | null
  createdAt: string
}

export const counselorApi = {
  inbox: () => api<DailyLogView[]>('/api/v1/counselor/counseling/daily-logs/inbox'),
  review: (id: string, feedback: string) =>
    api<DailyLogView>(`/api/v1/counselor/counseling/daily-logs/${id}/review`, { method: 'POST', body: jsonBody({ feedback }) }),
  studyPlans: () => api<StudyPlanView[]>('/api/v1/counselor/counseling/study-plans'),
  createStudyPlan: (body: {
    studentId: string
    title: string
    description?: string
    startDate: string
    endDate: string
    items: { subjectName: string; activityTitle: string; targetMinutes: number; plannedDate?: string; notes?: string }[]
  }) => api<StudyPlanView>('/api/v1/counselor/counseling/study-plans', { method: 'POST', body: jsonBody(body) }),
  deleteStudyPlanItem: (itemId: string) =>
    api<void>(`/api/v1/counselor/counseling/study-plans/items/${itemId}`, { method: 'DELETE' }),
  myAdminReports: () => api<AdminReportView[]>('/api/v1/counselor/counseling/admin-reports/mine'),
  createAdminReport: (body: { title: string; body: string; periodLabel?: string }) =>
    api<AdminReportView>('/api/v1/counselor/counseling/admin-reports', { method: 'POST', body: jsonBody(body) }),
  sendAdminReport: (id: string) =>
    api<AdminReportView>(`/api/v1/counselor/counseling/admin-reports/${id}/send`, { method: 'POST' }),
  assignments: () => api<AssignmentView[]>('/api/v1/counselor/counseling/assignments'),
}

export type AssignmentView = {
  id: string
  counselorMembershipId: string
  counselorName: string
  assignmentType: string
  targetId: string | null
  targetName: string | null
  effectiveFrom: string
  effectiveTo: string | null
  status: string
  note: string | null
}
