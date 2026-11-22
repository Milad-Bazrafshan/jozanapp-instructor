import { useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { instructorApi } from '@/api/instructor'
import { queryKeys } from '@/api/queryKeys'
import { Button } from '@/components/ui/Button'
import { Cell, DataTable } from '@/components/ui/DataTable'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner, QueryError } from '@/components/ui/Spinner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Toolbar } from '@/components/ui/Toolbar'
import { PageStack } from '@/components/ui/Shell'

export function InstructorClassesPage() {
  const { t } = useTranslation()
  const [selected, setSelected] = useState<string | null>(null)
  const classes = useQuery({ queryKey: queryKeys.instructorClasses, queryFn: instructorApi.classes })
  const detail = useQuery({
    queryKey: queryKeys.instructorClass(selected ?? ''),
    queryFn: () => instructorApi.classDetail(selected!),
    enabled: Boolean(selected),
  })
  if (classes.isLoading) return <PageSpinner label={t('common.loading')} />
  if (classes.error) return <QueryError message={classes.error.message} onRetry={() => void classes.refetch()} />
  return (
    <PageStack>
      <Toolbar query="" onQuery={() => undefined} />
      <DataTable
        rows={classes.data ?? []}
        columns={[
          { key: 'name', header: t('common.name'), render: (row) => <Cell title={row.name} detail={row.courseTitle} /> },
          { key: 'code', header: t('common.code'), render: (row) => <span dir="ltr">{row.code}</span> },
          { key: 'students', header: t('nav.students'), render: (row) => `${row.studentCount} / ${row.capacity}` },
          { key: 'mode', header: t('common.type'), render: (row) => t(`enums.${row.deliveryMode}`, { defaultValue: row.deliveryMode }) },
          { key: 'actions', header: t('common.actions'), render: (row) => <Button variant="ghost" onClick={() => setSelected(row.id)}>{t('common.details')}</Button> },
        ]}
      />
      {selected && (
        <Modal wide title={detail.data?.section.name ?? t('common.details')} onClose={() => setSelected(null)}>
          {detail.isLoading ? <PageSpinner label={t('common.loading')} /> : null}
          {detail.data && (
            <div className="space-y-3">
              {(detail.data.students ?? []).map((student) => (
                <div key={student.id} className="flex items-center justify-between text-sm">
                  <span>{student.studentName}</span>
                  <StatusBadge value={student.status} />
                </div>
              ))}
            </div>
          )}
        </Modal>
      )}
    </PageStack>
  )
}
