import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { classroomApi } from '@/api/classroom'
import { enrollmentApi } from '@/api/enrollment'
import { peopleApi } from '@/api/people'
import { queryKeys } from '@/api/queryKeys'
import type { EnrollmentView } from '@/api/types'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Cell, DataTable } from '@/components/ui/DataTable'
import { Check, Field, SelectField } from '@/components/ui/Field'
import { FormActions, FormStack } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner, QueryError } from '@/components/ui/Spinner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Toolbar } from '@/components/ui/Toolbar'
import { useToast } from '@/components/ui/Toast'
import { emptyToNull, personName } from '@/lib/format'

export function EnrollmentsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const auth = useAuth()
  const client = useQueryClient()
  const canWrite = auth.hasPermission('ENROLLMENT_WRITE')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [cancelItem, setCancelItem] = useState<EnrollmentView | null>(null)
  const [transferItem, setTransferItem] = useState<EnrollmentView | null>(null)
  const enrollments = useQuery({ queryKey: queryKeys.enrollments, queryFn: enrollmentApi.list })
  const classroom = useQuery({ queryKey: queryKeys.classroom, queryFn: classroomApi.list })
  const people = useQuery({ queryKey: queryKeys.people, queryFn: peopleApi.list, enabled: open })
  const invalidate = () => client.invalidateQueries({ queryKey: queryKeys.enrollments })
  const createMutation = useMutation({
    mutationFn: enrollmentApi.create,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setOpen(false)
      await invalidate()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => enrollmentApi.cancel(id, reason),
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setCancelItem(null)
      await invalidate()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const transferMutation = useMutation({
    mutationFn: ({ id, targetClassSectionId, transferOn, reason }: { id: string; targetClassSectionId: string; transferOn: string | null; reason: string }) =>
      enrollmentApi.transfer(id, { targetClassSectionId, transferOn, reason }),
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setTransferItem(null)
      await invalidate()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const rows = useMemo(
    () => (enrollments.data ?? []).filter((item) => `${item.studentName} ${item.className}`.toLowerCase().includes(query.toLowerCase())),
    [enrollments.data, query],
  )
  if (enrollments.isLoading) return <PageSpinner label={t('common.loading')} />
  if (enrollments.error) return <QueryError message={enrollments.error.message} onRetry={() => void enrollments.refetch()} />
  const sections = classroom.data?.sections ?? []
  return (
    <div className="space-y-5">
      <Toolbar query={query} onQuery={setQuery}>
        {canWrite && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>{t('enrollments.add')}</Button>}
      </Toolbar>
      <DataTable
        rows={rows}
        columns={[
          { key: 'student', header: t('enrollments.student'), render: (row) => <Cell title={row.studentName} detail={row.studentCode} /> },
          { key: 'class', header: t('enrollments.class'), render: (row) => <Cell title={row.className} detail={`${row.courseTitle} · ${row.branchName}`} /> },
          { key: 'started', header: t('enrollments.startedOn'), render: (row) => row.startedOn || t('common.dash') },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
          ...(canWrite
            ? [{
                key: 'actions',
                header: t('common.actions'),
                render: (row: EnrollmentView) =>
                  ['ACTIVE', 'WAITLISTED', 'SUSPENDED'].includes(row.status) ? (
                    <div className="flex gap-1">
                      <Button variant="ghost" onClick={() => setTransferItem(row)}>{t('enrollments.transfer')}</Button>
                      <Button variant="ghost" onClick={() => setCancelItem(row)}>{t('enrollments.cancel')}</Button>
                    </div>
                  ) : t('common.dash'),
              }]
            : []),
        ]}
      />
      {open && (
        <EnrollForm
          students={people.data?.students ?? []}
          sections={sections}
          busy={createMutation.isPending}
          onClose={() => setOpen(false)}
          onSubmit={(body) => createMutation.mutate(body)}
        />
      )}
      {cancelItem && (
        <ConfirmDialog
          title={t('enrollments.cancel')}
          danger
          requireReason
          onClose={() => setCancelItem(null)}
          onConfirm={(reason) => cancelMutation.mutateAsync({ id: cancelItem.id, reason: reason || '' })}
        />
      )}
      {transferItem && (
        <TransferForm
          sections={sections.filter((item) => item.id !== transferItem.classSectionId)}
          busy={transferMutation.isPending}
          onClose={() => setTransferItem(null)}
          onSubmit={(body) => transferMutation.mutate({ id: transferItem.id, ...body })}
        />
      )}
    </div>
  )
}

function EnrollForm({
  students,
  sections,
  busy,
  onClose,
  onSubmit,
}: {
  students: Array<{ id: string; code: string; person: { firstName: string; lastName: string } }>
  sections: Array<{ id: string; name: string; courseTitle: string }>
  busy: boolean
  onClose: () => void
  onSubmit: (body: { studentId: string; classSectionId: string; startedOn: string | null; allowWaitlist: boolean; reason: string | null }) => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    studentId: students[0]?.id ?? '',
    classSectionId: sections[0]?.id ?? '',
    startedOn: '',
    allowWaitlist: true,
    reason: '',
  })
  return (
    <Modal title={t('enrollments.add')} onClose={onClose}>
      <FormStack>
        <SelectField label={t('enrollments.student')} value={form.studentId} onChange={(studentId) => setForm({ ...form, studentId })} options={students.map((item) => [item.id, `${personName(item.person)} · ${item.code}`])} />
        <SelectField label={t('enrollments.class')} value={form.classSectionId} onChange={(classSectionId) => setForm({ ...form, classSectionId })} options={sections.map((item) => [item.id, `${item.name} · ${item.courseTitle}`])} />
        <Field label={t('enrollments.startedOn')} type="date" value={form.startedOn} onChange={(startedOn) => setForm({ ...form, startedOn })} required={false} />
        <Field label={t('common.reason')} value={form.reason} onChange={(reason) => setForm({ ...form, reason })} required={false} />
        <Check label={t('enrollments.allowWaitlist')} checked={form.allowWaitlist} onChange={(allowWaitlist) => setForm({ ...form, allowWaitlist })} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="button" disabled={busy} onClick={() => onSubmit({ ...form, startedOn: emptyToNull(form.startedOn), reason: emptyToNull(form.reason) })}>{t('common.save')}</Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}

function TransferForm({
  sections,
  busy,
  onClose,
  onSubmit,
}: {
  sections: Array<{ id: string; name: string }>
  busy: boolean
  onClose: () => void
  onSubmit: (body: { targetClassSectionId: string; transferOn: string | null; reason: string }) => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ targetClassSectionId: sections[0]?.id ?? '', transferOn: '', reason: '' })
  return (
    <Modal title={t('enrollments.transfer')} onClose={onClose}>
      <FormStack>
        <SelectField label={t('enrollments.targetClass')} value={form.targetClassSectionId} onChange={(targetClassSectionId) => setForm({ ...form, targetClassSectionId })} options={sections.map((item) => [item.id, item.name])} />
        <Field label={t('enrollments.transferOn')} type="date" value={form.transferOn} onChange={(transferOn) => setForm({ ...form, transferOn })} required={false} />
        <Field label={t('common.reason')} value={form.reason} onChange={(reason) => setForm({ ...form, reason })} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="button" disabled={busy} onClick={() => onSubmit({ ...form, transferOn: emptyToNull(form.transferOn) })}>{t('common.save')}</Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}
