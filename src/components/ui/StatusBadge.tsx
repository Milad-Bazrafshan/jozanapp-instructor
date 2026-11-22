import { useTranslation } from 'react-i18next'

const variantStyles: Record<string, string> = {
  success: 'bg-emerald-50 text-emerald-700',
  warning: 'bg-amber-50 text-amber-700',
  danger: 'bg-rose-50 text-rose-700',
  info: 'bg-sky-50 text-sky-700',
  neutral: 'bg-neutral-100 text-neutral-600',
}

const statusVariant: Record<string, string> = {
  ACTIVE: 'success',
  PUBLISHED: 'success',
  CONFIRMED: 'success',
  FINALIZED: 'success',
  COMPLETED: 'success',
  PRESENT: 'success',
  DRAFT: 'warning',
  PLANNED: 'warning',
  PENDING_GRADING: 'warning',
  WAITLISTED: 'warning',
  LATE: 'warning',
  READY: 'info',
  INACTIVE: 'neutral',
  CLOSED: 'neutral',
  NOT_STARTED: 'neutral',
  EXCUSED: 'info',
  SUSPENDED: 'danger',
  CANCELLED: 'danger',
  ABSENT: 'danger',
  RESCHEDULED: 'info',
  TRANSFERRED: 'info',
  PAID: 'success',
  OPEN: 'warning',
  PARTIALLY_PAID: 'warning',
  ISSUED: 'info',
  SUCCEEDED: 'success',
  PENDING: 'warning',
  FAILED: 'danger',
  VOID: 'neutral',
  OVERDUE: 'danger',
}

export function StatusBadge({ value }: { value?: string | null }) {
  const { t } = useTranslation()
  if (!value) return <span className="text-neutral-400">{t('common.dash')}</span>
  const variant = statusVariant[value] ?? 'neutral'
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-medium ${variantStyles[variant]}`}>
      <span className="w-1.5 h-1.5 rounded-full bg-current opacity-60" />
      {t(`status.${value}`, { defaultValue: value })}
    </span>
  )
}
