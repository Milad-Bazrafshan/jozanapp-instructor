import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { bindSessionHandlers } from '@/api/client'
import { authApi } from '@/api/auth'
import { ensureCsrf, purgeAuthArtifacts } from '@/api/csrf'
import type { Permission, Session } from '@/api/types'
import { AuthContext } from './AuthContext'
import { loadSession, saveSession, startIdleTimer } from './session'

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(loadSession)
  const [ready, setReady] = useState(false)
  const sessionRef = useRef(session)
  sessionRef.current = session

  useEffect(() => {
    bindSessionHandlers({
      getSession: () => sessionRef.current,
      setSession: (next) => {
        saveSession(next)
        setSession(next)
      },
      onUnauthorized: () => {
        purgeAuthArtifacts()
        saveSession(null)
        setSession(null)
      },
    })
  }, [])

  useEffect(() => {
    void (async () => {
      await ensureCsrf()
      try {
        const restored = await authApi.refresh()
        saveSession(restored)
        setSession(restored)
      } catch {
        saveSession(null)
        setSession(null)
      } finally {
        setReady(true)
      }
    })()
  }, [])

  useEffect(() => {
    if (!session) return
    return startIdleTimer(() => {
      void (async () => {
        try {
          await authApi.logout()
        } finally {
          purgeAuthArtifacts()
          saveSession(null)
          setSession(null)
        }
      })()
    })
  }, [session])

  const value = useMemo(
    () => ({
      session,
      ready,
      async login(credentials: { tenantSlug: string; email: string; password: string }) {
        const result = await authApi.login(credentials)
        saveSession(result)
        setSession(result)
      },
      async logout() {
        try {
          await authApi.logout()
        } finally {
          purgeAuthArtifacts()
          saveSession(null)
          setSession(null)
        }
      },
      hasPermission(permission: Permission) {
        return Boolean(session?.permissions?.includes(permission))
      },
      hasAnyPermission(permissions: Permission[]) {
        return permissions.some((permission) => session?.permissions?.includes(permission))
      },
    }),
    [session, ready],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
