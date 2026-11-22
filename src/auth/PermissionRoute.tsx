import { Navigate, Outlet } from 'react-router-dom'
import type { Permission } from '@/api/types'
import { useAuth } from './useAuth'

export function PermissionRoute({ anyOf }: { anyOf: Permission[] }) {
  const auth = useAuth()
  if (!auth.hasAnyPermission(anyOf)) return <Navigate to="/forbidden" replace />
  return <Outlet />
}
