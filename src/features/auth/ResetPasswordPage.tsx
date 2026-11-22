import { useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { LanguageSwitch } from '@/components/layout/LanguageSwitch'

export function ResetPasswordPage() {
  const { t } = useTranslation()
  const [params] = useSearchParams()
  const token = params.get('token') || ''
  const [password, setPassword] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [done, setDone] = useState(false)
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    if (!token) {
      setError(t('auth.tokenMissing'))
      return
    }
    if (password !== confirm) {
      setError(t('auth.passwordMismatch'))
      return
    }
    setBusy(true)
    try {
      await authApi.resetPassword(token, password)
      setDone(true)
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('common.retry'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <main className="min-h-screen bg-neutral-50 flex items-center justify-center p-6">
      <form onSubmit={submit} className="w-full max-w-md bg-white border border-neutral-200 rounded-xl p-6 space-y-4">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{t('page.reset.title')}</h1>
            <p className="text-sm text-neutral-500 mt-1">{t('page.reset.subtitle')}</p>
          </div>
          <LanguageSwitch />
        </div>
        <Field label={t('auth.newPassword')} type="password" value={password} onChange={setPassword} autoComplete="new-password" minLength={10} />
        <Field label={t('auth.confirmPassword')} type="password" value={confirm} onChange={setConfirm} autoComplete="new-password" minLength={10} />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {done ? <p className="text-sm text-emerald-700">{t('auth.resetDone')}</p> : null}
        <Button type="submit" className="w-full" disabled={busy || done}>
          {t('auth.resetNow')}
        </Button>
        <Link to="/login" className="block text-sm text-center text-neutral-500 hover:text-neutral-900">
          {t('auth.backToLogin')}
        </Link>
      </form>
    </main>
  )
}
