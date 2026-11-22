import { LoaderCircle } from 'lucide-react'
import { useTranslation } from 'react-i18next'

export function Spinner({ label }: { label?: string }) {
  return (
    <main className="min-h-screen flex flex-col items-center justify-center gap-3 text-neutral-500">
      <LoaderCircle className="w-6 h-6 animate-spin" />
      {label ? <p className="text-sm">{label}</p> : null}
    </main>
  )
}

export function PageSpinner({ label }: { label?: string }) {
  return (
    <div className="flex items-center justify-center py-20 gap-3 text-neutral-500">
      <LoaderCircle className="w-5 h-5 animate-spin" />
      {label ? <p className="text-sm">{label}</p> : null}
    </div>
  )
}

export function QueryError({ message, onRetry }: { message: string; onRetry?: () => void }) {
  const { t } = useTranslation()
  return (
    <div className="bg-rose-50 text-rose-700 rounded-xl border border-rose-100 px-4 py-3 text-sm flex items-center justify-between gap-3">
      <span>{message}</span>
      {onRetry ? (
        <button type="button" className="font-medium underline" onClick={onRetry}>
          {t('common.retry')}
        </button>
      ) : null}
    </div>
  )
}
