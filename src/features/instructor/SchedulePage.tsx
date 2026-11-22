import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { instructorApi } from '@/api/instructor'
import { queryKeys } from '@/api/queryKeys'
import type { SessionView } from '@/api/types'
import { Button } from '@/components/ui/Button'
import { Cell, DataTable } from '@/components/ui/DataTable'
import { Field } from '@/components/ui/Field'
import { FormActions, FormStack } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner, QueryError } from '@/components/ui/Spinner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'
import { PageStack } from '@/components/ui/Shell'
import { formatDate, useLocale } from '@/lib/format'

export function InstructorSchedulePage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const toast = useToast()
  const client = useQueryClient()
  const [cancelItem, setCancelItem] = useState<SessionView | null>(null)
  const [reason, setReason] = useState('')
  const sessions = useQuery({ queryKey: queryKeys.instructorSessions, queryFn: instructorApi.sessions })
  const cancelMutation = useMutation({
    mutationFn: () => instructorApi.cancel(cancelItem!.id, reason),
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setCancelItem(null)
      setReason('')
      await client.invalidateQueries({ queryKey: queryKeys.instructorSessions })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const joinMutation = useMutation({
    mutationFn: instructorApi.joinMeeting,
    onSuccess: (data) => window.open(data.joinUrl, '_blank', 'noopener,noreferrer'),
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  if (sessions.isLoading) return <PageSpinner label={t('common.loading')} />
  if (sessions.error) return <QueryError message={sessions.error.message} onRetry={() => void sessions.refetch()} />
  return (
    <PageStack>
      <DataTable
        rows={sessions.data ?? []}
        columns={[
          { key: 'class', header: t('nav.classes'), render: (row) => <Cell title={row.className} detail={row.courseTitle} /> },
          { key: 'when', header: t('common.date'), render: (row) => formatDate(row.plannedStartAt, locale) },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
          {
            key: 'actions',
            header: t('common.actions'),
            render: (row) => (
              <div className="flex gap-2">
                <Button variant="ghost" onClick={() => joinMutation.mutate(row.id)}>{t('meetings.join')}</Button>
                {['PLANNED', 'CONFIRMED'].includes(row.status) ? (
                  <Button variant="ghost" onClick={() => setCancelItem(row)}>{t('schedule.cancelSession')}</Button>
                ) : null}
              </div>
            ),
          },
        ]}
      />
      {cancelItem && (
        <Modal title={t('schedule.cancelSession')} onClose={() => setCancelItem(null)}>
          <FormStack>
            <Field label={t('common.reason')} value={reason} onChange={setReason} />
            <FormActions>
              <Button variant="secondary" onClick={() => setCancelItem(null)}>{t('common.cancel')}</Button>
              <Button disabled={!reason || cancelMutation.isPending} onClick={() => cancelMutation.mutate()}>{t('common.confirm')}</Button>
            </FormActions>
          </FormStack>
        </Modal>
      )}
    </PageStack>
  )
}
