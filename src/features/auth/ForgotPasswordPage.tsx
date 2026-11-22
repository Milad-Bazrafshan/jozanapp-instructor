import { useState } from 'react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { authApi } from '@/api/auth'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { LanguageSwitch } from '@/components/layout/LanguageSwitch'

export function ForgotPasswordPage() {
  const { t } = useTranslation()
  const [email, setEmail] = useState('')
  const [message, setMessage] = useState('')
  const [devToken, setDevToken] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setError('')
    setBusy(true)
    try {
      const result = await authApi.forgotPassword(email)
      setMessage(result.message || t('auth.resetSent'))
      setDevToken(import.meta.env.DEV && result.developmentToken ? result.developmentToken : '')
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
            <h1 className="text-2xl font-semibold">{t('page.forgot.title')}</h1>
            <p className="text-sm text-neutral-500 mt-1">{t('page.forgot.subtitle')}</p>
          </div>
          <LanguageSwitch />
        </div>
        <Field label={t('common.email')} type="email" value={email} onChange={setEmail} autoComplete="email" />
        {error ? <p className="text-sm text-rose-600">{error}</p> : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {devToken ? (
          <p className="text-xs text-neutral-500 break-all">
            {t('auth.devToken')}: <code dir="ltr">{devToken}</code>
          </p>
        ) : null}
        <Button type="submit" className="w-full" disabled={busy}>
          {t('auth.sendReset')}
        </Button>
        <Link to="/login" className="block text-sm text-center text-neutral-500 hover:text-neutral-900">
          {t('auth.backToLogin')}
        </Link>
      </form>
    </main>
  )
}
