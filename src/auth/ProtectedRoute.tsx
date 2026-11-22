import { Navigate, Outlet } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { Spinner } from '@/components/ui/Spinner'
import { useAuth } from './useAuth'

export function ProtectedRoute() {
  const { t } = useTranslation()
  const auth = useAuth()
  if (!auth.ready) return <Spinner label={t('common.checkingSession')} />
  if (!auth.session) return <Navigate to="/login" replace />
  return <Outlet />
}
