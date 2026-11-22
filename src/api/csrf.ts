const API_BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

let csrfReady = false

export async function ensureCsrf(): Promise<void> {
  if (csrfReady) return
  await fetch(`${API_BASE_URL}/api/v1/auth/csrf`, {
    method: 'GET',
    credentials: 'include',
  })
  csrfReady = true
}

export function readCsrfHeader(): Record<string, string> {
  const token = document.cookie
    .split('; ')
    .find((row) => row.startsWith('XSRF-TOKEN='))
    ?.split('=')
    .slice(1)
    .join('=')
  if (!token) return {}
  return { 'X-XSRF-TOKEN': decodeURIComponent(token) }
}

export function resetCsrfState() {
  csrfReady = false
}

export function purgeAuthArtifacts() {
  resetCsrfState()
  const secure = typeof window !== 'undefined' && window.location.protocol === 'https:'
  const expired = 'XSRF-TOKEN=; Max-Age=0; path=/'
  document.cookie = expired
  if (secure) {
    document.cookie = `${expired}; Secure`
  }
}
