import { useNavigate } from 'react-router-dom'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { instructorApi } from '@/api/instructor'
import { queryKeys } from '@/api/queryKeys'
import { Button } from '@/components/ui/Button'
import { Cell, DataTable } from '@/components/ui/DataTable'
import { PageSpinner, QueryError } from '@/components/ui/Spinner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { formatDate, useLocale } from '@/lib/format'

export function InstructorAssessmentsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const navigate = useNavigate()
  const list = useQuery({ queryKey: queryKeys.assessments, queryFn: instructorApi.assessments })
  if (list.isLoading) return <PageSpinner label={t('common.loading')} />
  if (list.error) return <QueryError message={list.error.message} onRetry={() => void list.refetch()} />
  return (
    <DataTable
      rows={list.data ?? []}
      columns={[
        { key: 'title', header: t('common.name'), render: (row) => <Cell title={row.title} detail={row.code} /> },
        { key: 'window', header: t('common.date'), render: (row) => formatDate(row.opensAt, locale) },
        { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
        { key: 'actions', header: t('common.actions'), render: (row) => <Button variant="ghost" onClick={() => navigate(`/assessments/${row.id}/grading`)}>{t('nav.grading')}</Button> },
      ]}
    />
  )
}
