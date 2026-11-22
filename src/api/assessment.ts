import { api, jsonBody } from './client'
import type { AssessmentView, QuestionView, ResultView } from './types'

export const assessmentApi = {
  questions: () => api<QuestionView[]>('/api/v1/assessment/questions'),
  createQuestion: (body: {
    courseId?: string | null
    code: string
    type: string
    prompt: string
    options: string[]
    correctAnswers: string[]
    explanation?: string | null
    defaultPoints: number
  }) => api<QuestionView>('/api/v1/assessment/questions', { method: 'POST', body: jsonBody(body) }),
  createVersion: (id: string, body: {
    prompt: string
    options: string[]
    correctAnswers: string[]
    explanation?: string | null
    defaultPoints: number
  }) => api<QuestionView>(`/api/v1/assessment/questions/${id}/versions`, { method: 'POST', body: jsonBody(body) }),
  assessments: () => api<AssessmentView[]>('/api/v1/instructor/assessments'),
  createAssessment: (body: {
    courseId?: string | null
    code: string
    title: string
    type: string
    opensAt: string
    closesAt: string
    durationMinutes: number
    attemptsAllowed: number
    randomizeQuestions: boolean
  }) => api<AssessmentView>('/api/v1/assessment/assessments', { method: 'POST', body: jsonBody(body) }),
  addSection: (id: string, body: { title: string; instructions?: string | null; sequenceNumber: number }) =>
    api<AssessmentView>(`/api/v1/assessment/assessments/${id}/sections`, { method: 'POST', body: jsonBody(body) }),
  addQuestion: (id: string, body: {
    sectionId: string
    questionVersionId: string
    points: number
    sequenceNumber: number
  }) => api<AssessmentView>(`/api/v1/assessment/assessments/${id}/questions`, { method: 'POST', body: jsonBody(body) }),
  addTarget: (id: string, classSectionId: string) =>
    api<AssessmentView>(`/api/v1/assessment/assessments/${id}/targets`, { method: 'POST', body: jsonBody({ classSectionId }) }),
  publish: (id: string) =>
    api<AssessmentView>(`/api/v1/assessment/assessments/${id}/publish`, { method: 'POST' }),
  results: (assessmentId: string) =>
    api<ResultView[]>(`/api/v1/instructor/assessments/${assessmentId}/results`),
  grade: (responseId: string, body: { score: number; feedback?: string | null; reason: string }) =>
    api<ResultView>(`/api/v1/assessment/responses/${responseId}/grade`, { method: 'PUT', body: jsonBody(body) }),
  publishResult: (resultId: string) =>
    api<ResultView>(`/api/v1/assessment/results/${resultId}/publish`, { method: 'POST' }),
}
