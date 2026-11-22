import { api, jsonBody } from './client'
import type { LocationView, RuleView, SchedulingCatalog, SessionView } from './types'

export const schedulingApi = {
  list: () => api<SchedulingCatalog>('/api/v1/scheduling'),
  createLocation: (body: { branchId: string; code: string; name: string; type: string; capacity: number }) =>
    api<LocationView>('/api/v1/scheduling/locations', { method: 'POST', body: jsonBody(body) }),
  createRule: (body: {
    classSectionId: string
    code: string
    recurrenceType: string
    startsOn: string
    endsOn: string
    dayOfWeek?: string | null
    startsAt: string
    endsAt: string
    timeZone: string
    intervalWeeks: number
    locationId?: string | null
    instructorIds: string[]
  }) => api<RuleView>('/api/v1/scheduling/rules', { method: 'POST', body: jsonBody(body) }),
  generate: (id: string, throughDate: string) =>
    api<SessionView[]>(`/api/v1/scheduling/rules/${id}/generate`, { method: 'POST', body: jsonBody({ throughDate }) }),
  cancel: (id: string, reason: string) =>
    api<SessionView>(`/api/v1/scheduling/sessions/${id}/cancel`, { method: 'POST', body: jsonBody({ reason }) }),
  reschedule: (id: string, body: {
    sessionDate: string
    startsAt: string
    endsAt: string
    timeZone: string
    reason: string
  }) => api<SessionView>(`/api/v1/scheduling/sessions/${id}/reschedule`, { method: 'POST', body: jsonBody(body) }),
}
