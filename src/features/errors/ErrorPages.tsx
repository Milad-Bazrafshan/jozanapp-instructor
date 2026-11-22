import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'

export function NotFoundPage() {
  const { t } = useTranslation()
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center">
      <p className="text-5xl font-semibold text-neutral-300">404</p>
      <h1 className="text-xl font-semibold">{t('common.notFound')}</h1>
      <Link to="/" className="inline-flex items-center justify-center px-4 py-2 rounded-lg text-sm font-medium bg-neutral-900 text-white hover:bg-neutral-800">
        {t('common.goHome')}
      </Link>
    </main>
  )
}

export function ForbiddenPage() {
  const { t } = useTranslation()
  return (
    <main className="min-h-[60vh] flex flex-col items-center justify-center gap-3 text-center">
      <p className="text-5xl font-semibold text-neutral-300">403</p>
      <h1 className="text-xl font-semibold">{t('common.forbidden')}</h1>
      <Link to="/" className="text-sm text-neutral-600 underline">
        {t('common.goHome')}
      </Link>
    </main>
  )
}
