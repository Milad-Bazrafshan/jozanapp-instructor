import { api, apiHtml, jsonBody, printFromFetch } from './client'
import type { AssessmentView, ResultView, SessionView } from './types'

export type InstructorHome = {
  instructorName: string
  instructorCode: string
  todaySessions: SessionView[]
  incompleteAttendance: Array<{
    sessionId: string
    className: string
    courseTitle: string
    sessionDate: string
    plannedStartAt: string
    sheetStatus: string
    markedCount: number
    absentCount: number
  }>
  assessments: AssessmentView[]
}

export type InstructorClass = {
  id: string
  code: string
  name: string
  courseTitle: string
  branchName: string
  academicPeriodId: string
  periodName: string
  capacity: number
  studentCount: number
  deliveryMode: string
  role: string
}

export type InstructorClassDetail = {
  section: InstructorClass
  students: Array<{
    id: string
    studentId: string
    studentCode: string
    studentName: string
    classSectionId: string
    className: string
    courseTitle: string
    branchName: string
    status: string
    source: string
    startedOn: string | null
    endedOn: string | null
  }>
  sessions: SessionView[]
}

export type AnnouncementView = {
  id: string
  title: string
  body: string
  audienceType: string
  audienceRef: string | null
  channel: string
  status: string
  scheduledAt: string | null
  sentAt: string | null
  classSectionId: string | null
  deliveryCount: number
}

export type InboxView = {
  unread: number
  items: Array<{ id: string; title: string; body: string; readAt: string | null; createdAt: string }>
}

export type ReportCardRun = {
  id: string
  title: string
  academicPeriodId: string
  periodName: string
  classSectionId: string
  className: string
  status: string
  includeRank: boolean
  publishedAt: string | null
  cardCount: number
}

export type ReportCardView = {
  id: string
  runId: string
  runTitle: string
  studentId: string
  studentCode: string
  studentName: string
  className: string
  periodName: string
  status: string
  attendancePercent: number | null
  absenceCount: number | null
  overallScore: number | null
  rankInClass: number | null
  verificationToken: string
  lines: Array<{ id: string; lineType: string; title: string; score: number | null; maxScore: number | null; note: string | null }>
}

export type ChatRoomView = {
  id: string
  studentId: string
  studentName: string
  className: string
  guardianMembershipId: string
  instructorMembershipId: string
}

export type ChatPartnerView = {
  studentId: string
  studentName: string
  className: string
  guardianMembershipId: string
  guardianName: string
  instructorMembershipId: string
  instructorName: string
}

export type ChatMessageView = {
  id: string
  roomId: string
  senderMembershipId: string
  body: string
  fileId: string | null
  readAt: string | null
  createdAt: string
}

export type MeetingJoin = { meetingId: string; provider: string; joinUrl: string }

export const instructorApi = {
  home: () => api<InstructorHome>('/api/v1/instructor/home'),
  classes: () => api<InstructorClass[]>('/api/v1/instructor/classes'),
  classDetail: (id: string) => api<InstructorClassDetail>(`/api/v1/instructor/classes/${id}`),
  sessions: () => api<SessionView[]>('/api/v1/instructor/sessions'),
  cancel: (id: string, reason: string) =>
    api<SessionView>(`/api/v1/instructor/sessions/${id}/cancel`, { method: 'POST', body: jsonBody({ reason }) }),
  reschedule: (id: string, body: { sessionDate: string; startsAt: string; endsAt: string; timeZone: string; reason: string }) =>
    api<SessionView>(`/api/v1/instructor/sessions/${id}/reschedule`, { method: 'POST', body: jsonBody(body) }),
  assessments: () => api<AssessmentView[]>('/api/v1/instructor/assessments'),
  results: (id: string) => api<ResultView[]>(`/api/v1/instructor/assessments/${id}/results`),
  announcements: () => api<AnnouncementView[]>('/api/v1/announcements'),
  createAnnouncement: (body: {
    title: string
    body: string
    audienceType: string
    audienceRef?: string | null
    channel: string
    scheduledAt?: string | null
  }) => api<AnnouncementView>('/api/v1/instructor/announcements', { method: 'POST', body: jsonBody(body) }),
  inbox: () => api<InboxView>('/api/v1/notifications'),
  markRead: (id: string) => api(`/api/v1/notifications/${id}/read`, { method: 'POST' }),
  reportRuns: () => api<ReportCardRun[]>('/api/v1/report-cards/runs'),
  generateReport: (body: { academicPeriodId: string; classSectionId: string; title: string; includeRank: boolean }) =>
    api<ReportCardRun>('/api/v1/instructor/report-cards/runs', { method: 'POST', body: jsonBody(body) }),
  reportCards: (runId: string) => api<ReportCardView[]>(`/api/v1/report-cards/runs/${runId}/cards`),
  printCard: (id: string) => printFromFetch(() => apiHtml(`/api/v1/report-cards/${id}/print`)),
  chatRooms: () => api<ChatRoomView[]>('/api/v1/chat/rooms'),
  chatPartners: () => api<ChatPartnerView[]>('/api/v1/chat/partners'),
  openChat: (body: { studentId: string; instructorMembershipId?: string; guardianMembershipId?: string }) =>
    api<ChatRoomView>('/api/v1/chat/rooms', { method: 'POST', body: jsonBody(body) }),
  messages: (id: string) => api<ChatMessageView[]>(`/api/v1/chat/rooms/${id}/messages`),
  sendMessage: (id: string, body: string) =>
    api<ChatMessageView>(`/api/v1/chat/rooms/${id}/messages`, { method: 'POST', body: jsonBody({ body }) }),
  markChatRead: (id: string) => api(`/api/v1/chat/rooms/${id}/read`, { method: 'POST' }),
  joinMeeting: (sessionId: string) =>
    api<MeetingJoin>(`/api/v1/meetings/sessions/${sessionId}/join?role=INSTRUCTOR`, { method: 'POST' }),
}
