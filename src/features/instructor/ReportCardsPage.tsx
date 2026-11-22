import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { instructorApi } from '@/api/instructor'
import { queryKeys } from '@/api/queryKeys'
import { Button } from '@/components/ui/Button'
import { Cell, DataTable } from '@/components/ui/DataTable'
import { Check, Field, SelectField } from '@/components/ui/Field'
import { FormActions, FormStack } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner, QueryError } from '@/components/ui/Spinner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { useToast } from '@/components/ui/Toast'

export function InstructorReportCardsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const client = useQueryClient()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [classSectionId, setClassSectionId] = useState('')
  const [includeRank, setIncludeRank] = useState(true)
  const [runId, setRunId] = useState<string | null>(null)
  const classes = useQuery({ queryKey: queryKeys.instructorClasses, queryFn: instructorApi.classes })
  const runs = useQuery({ queryKey: queryKeys.reportCards, queryFn: instructorApi.reportRuns })
  const cards = useQuery({
    queryKey: [...queryKeys.reportCards, runId],
    queryFn: () => instructorApi.reportCards(runId!),
    enabled: Boolean(runId),
  })
  const selectedClass = (classes.data ?? []).find((item) => item.id === classSectionId)
  const generate = useMutation({
    mutationFn: () => instructorApi.generateReport({
      academicPeriodId: selectedClass!.academicPeriodId,
      classSectionId,
      title,
      includeRank,
    }),
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setOpen(false)
      await client.invalidateQueries({ queryKey: queryKeys.reportCards })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  if (runs.isLoading) return <PageSpinner label={t('common.loading')} />
  if (runs.error) return <QueryError message={runs.error.message} onRetry={() => void runs.refetch()} />
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>{t('reportCards.generate')}</Button>
      </div>
      <DataTable
        rows={runs.data ?? []}
        columns={[
          { key: 'title', header: t('common.name'), render: (row) => <Cell title={row.title} detail={row.className} /> },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
          { key: 'count', header: t('common.count', { count: 0 }), render: (row) => row.cardCount },
          { key: 'actions', header: t('common.actions'), render: (row) => <Button variant="ghost" onClick={() => setRunId(row.id)}>{t('common.view')}</Button> },
        ]}
      />
      {runId && (
        <Modal wide title={t('page.reportCards.title')} onClose={() => setRunId(null)}>
          {(cards.data ?? []).map((card) => (
            <div key={card.id} className="flex items-center justify-between gap-3 py-2 border-b border-neutral-100">
              <div>
                <p className="font-medium">{card.studentName}</p>
                <p className="text-sm text-neutral-500">{card.overallScore ?? t('common.dash')}</p>
              </div>
              <Button variant="ghost" onClick={() => void instructorApi.printCard(card.id)}>{t('common.print')}</Button>
            </div>
          ))}
        </Modal>
      )}
      {open && (
        <Modal title={t('reportCards.generate')} onClose={() => setOpen(false)}>
          <FormStack>
            <Field label={t('common.name')} value={title} onChange={setTitle} />
            <SelectField
              label={t('nav.classes')}
              value={classSectionId}
              onChange={setClassSectionId}
              options={(classes.data ?? []).map((item) => [item.id, item.name] as [string, string])}
            />
            <Check label={t('reportCards.includeRank')} checked={includeRank} onChange={setIncludeRank} />
            <FormActions>
              <Button variant="secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
              <Button disabled={!title || !classSectionId || generate.isPending} onClick={() => generate.mutate()}>{t('common.save')}</Button>
            </FormActions>
          </FormStack>
        </Modal>
      )}
    </div>
  )
}
