import { createContext } from 'react'
import type { Permission, Session } from '@/api/types'

export type AuthContextValue = {
  session: Session | null
  ready: boolean
  login: (credentials: { tenantSlug: string; email: string; password: string }) => Promise<void>
  logout: () => Promise<void>
  hasPermission: (permission: Permission) => boolean
  hasAnyPermission: (permissions: Permission[]) => boolean
}

export const AuthContext = createContext<AuthContextValue | null>(null)
