import type { Session } from '@/api/types'

export const SESSION_KEY = 'orix-school-admin-session'
const IDLE_MS = 30 * 60 * 1000

export function loadSession(): Session | null {
  try {
    const raw = localStorage.getItem(SESSION_KEY)
    if (!raw) return null
    return JSON.parse(raw) as Session
  } catch {
    return null
  }
}

export function saveSession(session: Session | null) {
  if (session) localStorage.setItem(SESSION_KEY, JSON.stringify(session))
  else localStorage.removeItem(SESSION_KEY)
}

export function startIdleTimer(onIdle: () => void) {
  let timer = 0
  const reset = () => {
    window.clearTimeout(timer)
    timer = window.setTimeout(onIdle, IDLE_MS)
  }
  const events = ['mousemove', 'keydown', 'click', 'scroll', 'touchstart'] as const
  events.forEach((event) => window.addEventListener(event, reset, { passive: true }))
  reset()
  return () => {
    window.clearTimeout(timer)
    events.forEach((event) => window.removeEventListener(event, reset))
  }
}
