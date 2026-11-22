import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { AuthLayout } from './AuthLayout'

const demoAccounts = import.meta.env.DEV
  ? [
      { email: 'instructor@example.com', labelKey: 'auth.demoInstructor' },
      { email: 'counselor@example.com', labelKey: 'auth.demoCounselor' },
    ]
  : []

export function LoginPage() {
  const { t } = useTranslation()
  const auth = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    tenantSlug: import.meta.env.DEV ? 'demo-school' : '',
    email: import.meta.env.DEV ? 'instructor@example.com' : '',
    password: '',
  })
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  if (auth.session) return <Navigate to="/" replace />

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      await auth.login(form)
      navigate('/')
    } catch (reason) {
      setError(reason instanceof Error ? reason.message : t('common.retry'))
    } finally {
      setBusy(false)
    }
  }

  return (
    <AuthLayout eyebrow={t('page.login.title')} title={t('auth.welcome')} subtitle={t('page.login.subtitle')}>
      <form onSubmit={submit} className="space-y-5">
        <Field
          label={t('auth.tenantSlug')}
          value={form.tenantSlug}
          onChange={(tenantSlug) => setForm({ ...form, tenantSlug })}
          autoComplete="organization"
          className="ltr-field"
        />
        <Field
          label={t('common.email')}
          type="email"
          value={form.email}
          onChange={(email) => setForm({ ...form, email })}
          autoComplete="username"
        />
        <Field
          label={t('auth.password')}
          type="password"
          value={form.password}
          onChange={(password) => setForm({ ...form, password })}
          autoComplete="current-password"
        />
        {error ? <p className="text-sm text-rose-600 bg-rose-50 border border-rose-100 rounded-xl px-3 py-2">{error}</p> : null}
        <Button type="submit" className="w-full !py-2.5" disabled={busy}>
          {busy ? t('auth.signingIn') : t('auth.signIn')}
        </Button>
        <Link to="/forgot-password" className="block text-sm text-slate-500 hover:text-indigo-700 text-center pt-1">
          {t('auth.forgotLink')}
        </Link>
        {demoAccounts.length ? (
          <div className="pt-2 space-y-2 border-t border-slate-100">
            <p className="text-xs text-slate-400">{t('auth.demoHint')}</p>
            <div className="flex flex-wrap gap-2">
              {demoAccounts.map((account) => (
                <button
                  key={account.email}
                  type="button"
                  onClick={() => setForm((current) => ({ ...current, email: account.email }))}
                  className="px-3 py-1.5 rounded-full bg-indigo-50 border border-indigo-100 text-xs font-medium text-indigo-800 hover:bg-indigo-100 transition-colors"
                >
                  {t(account.labelKey)}
                </button>
              ))}
            </div>
          </div>
        ) : null}
      </form>
    </AuthLayout>
  )
}
