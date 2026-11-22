import type { ProblemDetails, Session } from './types'
import { ensureCsrf, readCsrfHeader } from './csrf'

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

export class ApiError extends Error {
  status: number
  code?: string

  constructor(message: string, status: number, code?: string) {
    super(message)
    this.name = 'ApiError'
    this.status = status
    this.code = code
  }
}

type SessionHandlers = {
  getSession: () => Session | null
  setSession: (session: Session | null) => void
  onUnauthorized: () => void
}

let handlers: SessionHandlers = {
  getSession: () => null,
  setSession: () => undefined,
  onUnauthorized: () => undefined,
}

let refreshPromise: Promise<Session | null> | null = null

export function bindSessionHandlers(next: SessionHandlers) {
  handlers = next
}

function readErrorMessage(payload: ProblemDetails | null, status: number) {
  const fieldErrors = payload?.errors?.map((item) => item.message).filter(Boolean)
  if (fieldErrors?.length) return fieldErrors.join('; ')
  return payload?.detail || payload?.title || `Request failed (${status})`
}

async function parseBody(response: Response) {
  if (response.status === 204) return null
  const text = await response.text()
  if (!text) return null
  try {
    return JSON.parse(text) as unknown
  } catch {
    return null
  }
}

function buildHeaders(session: Session | null, body?: BodyInit | null, extra?: HeadersInit) {
  return {
    Accept: 'application/json',
    ...(body ? { 'Content-Type': 'application/json' } : {}),
    ...readCsrfHeader(),
    ...(session ? { 'X-Tenant-Id': session.user.tenantId } : {}),
    ...extra,
  }
}

async function refreshSession(): Promise<Session | null> {
  if (refreshPromise) return refreshPromise
  refreshPromise = (async () => {
    await ensureCsrf()
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      credentials: 'include',
      headers: buildHeaders(handlers.getSession(), '{}'),
      body: '{}',
    })
    const payload = (await parseBody(response)) as Session | ProblemDetails | null
    if (!response.ok) {
      handlers.onUnauthorized()
      return null
    }
    const session = payload as Session
    handlers.setSession(session)
    return session
  })().finally(() => {
    refreshPromise = null
  })
  return refreshPromise
}

type RequestOptions = RequestInit & {
  auth?: boolean
  retry?: boolean
}

export async function api<T>(path: string, options: RequestOptions = {}): Promise<T> {
  const { auth = true, retry = true, headers, body, ...rest } = options
  const session = handlers.getSession()
  if (body && rest.method && rest.method !== 'GET' && rest.method !== 'HEAD') {
    await ensureCsrf()
  }
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    body,
    credentials: 'include',
    headers: buildHeaders(auth ? session : null, body, headers),
  })

  if (response.status === 401 && auth && retry) {
    const refreshed = await refreshSession()
    if (refreshed) return api<T>(path, { ...options, retry: false })
    throw new ApiError('Session expired', 401, 'UNAUTHORIZED')
  }

  const payload = await parseBody(response)
  if (!response.ok) {
    const problem = payload as ProblemDetails | null
    throw new ApiError(readErrorMessage(problem, response.status), response.status, problem?.code)
  }
  return payload as T
}

export function jsonBody(value: unknown) {
  return JSON.stringify(value)
}

export async function apiHtml(path: string, options: RequestOptions = {}): Promise<string> {
  const { auth = true, retry = true, headers, ...rest } = options
  const session = handlers.getSession()
  const response = await fetch(`${API_BASE_URL}${path}`, {
    ...rest,
    credentials: 'include',
    headers: {
      Accept: 'text/html,application/json',
      ...readCsrfHeader(),
      ...(auth && session ? { 'X-Tenant-Id': session.user.tenantId } : {}),
      ...headers,
    },
  })
  if (response.status === 401 && auth && retry) {
    const refreshed = await refreshSession()
    if (refreshed) return apiHtml(path, { ...options, retry: false })
    throw new ApiError('Session expired', 401, 'UNAUTHORIZED')
  }
  const text = await response.text()
  if (!response.ok) {
    let problem: ProblemDetails | null = null
    try {
      problem = text ? (JSON.parse(text) as ProblemDetails) : null
    } catch {
      problem = null
    }
    throw new ApiError(readErrorMessage(problem, response.status), response.status, problem?.code)
  }
  return text
}

export function openPrintWindow(): Window | null {
  return window.open('', '_blank')
}

function writePrintWindow(popup: Window, html: string) {
  popup.document.open()
  popup.document.write(html)
  popup.document.close()
  popup.focus()
  popup.print()
}

export function printHtml(html: string) {
  const popup = openPrintWindow()
  if (!popup) return false
  writePrintWindow(popup, html)
  return true
}

export async function printFromFetch(load: () => Promise<string>) {
  const popup = openPrintWindow()
  if (!popup) return false
  writePrintWindow(popup, '<html dir="rtl"><body style="font-family:Tahoma;padding:24px">…</body></html>')
  try {
    writePrintWindow(popup, await load())
    return true
  } catch (error) {
    popup.close()
    throw error
  }
}
