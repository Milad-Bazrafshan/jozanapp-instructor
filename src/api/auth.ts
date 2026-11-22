import { api, jsonBody } from './client'
import { ensureCsrf } from './csrf'
import type { AuthUser, ForgotPasswordResponse, Session } from './types'

export const authApi = {
  login: async (credentials: { tenantSlug: string; email: string; password: string }) => {
    await ensureCsrf()
    return api<Session>('/api/v1/auth/login', { method: 'POST', body: jsonBody(credentials), auth: false })
  },
  refresh: async () => {
    await ensureCsrf()
    return api<Session>('/api/v1/auth/refresh', { method: 'POST', body: '{}', auth: false })
  },
  logout: async () => {
    await ensureCsrf()
    return api<null>('/api/v1/auth/logout', { method: 'POST', body: '{}', auth: false })
  },
  me: () => api<AuthUser>('/api/v1/auth/me'),
  forgotPassword: (email: string) =>
    api<ForgotPasswordResponse>('/api/v1/auth/forgot-password', {
      method: 'POST',
      body: jsonBody({ email }),
      auth: false,
    }),
  resetPassword: (token: string, newPassword: string) =>
    api<null>('/api/v1/auth/reset-password', {
      method: 'POST',
      body: jsonBody({ token, newPassword }),
      auth: false,
    }),
}
