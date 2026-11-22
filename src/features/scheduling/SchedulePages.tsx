import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { classroomApi } from '@/api/classroom'
import { organizationApi } from '@/api/organization'
import { peopleApi } from '@/api/people'
import { schedulingApi } from '@/api/scheduling'
import { queryKeys } from '@/api/queryKeys'
import type { RuleView, SessionView } from '@/api/types'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Cell, DataTable } from '@/components/ui/DataTable'
import { Field, SelectField } from '@/components/ui/Field'
import { FormActions, FormGrid, FormStack } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner, QueryError } from '@/components/ui/Spinner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Toolbar } from '@/components/ui/Toolbar'
import { useToast } from '@/components/ui/Toast'
import { emptyToNull, formatDate, personName, todayIso, useLocale } from '@/lib/format'

function useSchedule() {
  return useQuery({ queryKey: queryKeys.scheduling, queryFn: schedulingApi.list })
}

export function LocationsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const auth = useAuth()
  const client = useQueryClient()
  const canWrite = auth.hasPermission('SCHEDULE_WRITE')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const catalog = useSchedule()
  const branches = useQuery({ queryKey: queryKeys.branches, queryFn: organizationApi.branches, enabled: open })
  const mutation = useMutation({
    mutationFn: schedulingApi.createLocation,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setOpen(false)
      await client.invalidateQueries({ queryKey: queryKeys.scheduling })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const rows = useMemo(
    () => (catalog.data?.locations ?? []).filter((item) => `${item.name} ${item.code}`.toLowerCase().includes(query.toLowerCase())),
    [catalog.data, query],
  )
  if (catalog.isLoading) return <PageSpinner label={t('common.loading')} />
  if (catalog.error) return <QueryError message={catalog.error.message} onRetry={() => void catalog.refetch()} />
  return (
    <div className="space-y-5">
      <Toolbar query={query} onQuery={setQuery}>
        {canWrite && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>{t('schedule.addLocation')}</Button>}
      </Toolbar>
      <DataTable
        rows={rows}
        columns={[
          { key: 'name', header: t('common.name'), render: (row) => <Cell title={row.name} detail={row.branchName} /> },
          { key: 'code', header: t('common.code'), render: (row) => <span dir="ltr">{row.code}</span> },
          { key: 'type', header: t('common.type'), render: (row) => t(`enums.${row.type}`, { defaultValue: row.type }) },
          { key: 'capacity', header: t('classes.capacity'), render: (row) => row.capacity ?? t('common.dash') },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
        ]}
      />
      {open && (
        <LocationForm
          branches={branches.data ?? []}
          busy={mutation.isPending}
          onClose={() => setOpen(false)}
          onSubmit={(body) => mutation.mutate(body)}
        />
      )}
    </div>
  )
}

function LocationForm({
  branches,
  busy,
  onClose,
  onSubmit,
}: {
  branches: Array<{ id: string; name: string }>
  busy: boolean
  onClose: () => void
  onSubmit: (body: { branchId: string; code: string; name: string; type: string; capacity: number }) => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ branchId: branches[0]?.id ?? '', code: '', name: '', type: 'CLASSROOM', capacity: '20' })
  return (
    <Modal title={t('schedule.addLocation')} onClose={onClose}>
      <FormStack>
        <SelectField label={t('classes.branch')} value={form.branchId} onChange={(branchId) => setForm({ ...form, branchId })} options={branches.map((item) => [item.id, item.name])} />
        <FormGrid>
          <Field label={t('common.code')} value={form.code} onChange={(code) => setForm({ ...form, code })} />
          <Field label={t('common.name')} value={form.name} onChange={(name) => setForm({ ...form, name })} />
        </FormGrid>
        <SelectField label={t('common.type')} value={form.type} onChange={(type) => setForm({ ...form, type })} options={['CLASSROOM', 'LAB', 'HALL', 'ONLINE'].map((id) => [id, t(`enums.${id}`)])} />
        <Field label={t('classes.capacity')} type="number" value={form.capacity} onChange={(capacity) => setForm({ ...form, capacity })} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="button" disabled={busy} onClick={() => onSubmit({ ...form, capacity: Number(form.capacity) })}>{t('common.save')}</Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}

export function RulesPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const auth = useAuth()
  const client = useQueryClient()
  const canWrite = auth.hasPermission('SCHEDULE_WRITE')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [generateRule, setGenerateRule] = useState<RuleView | null>(null)
  const catalog = useSchedule()
  const classroom = useQuery({ queryKey: queryKeys.classroom, queryFn: classroomApi.list, enabled: open })
  const people = useQuery({ queryKey: queryKeys.people, queryFn: peopleApi.list, enabled: open })
  const createMutation = useMutation({
    mutationFn: schedulingApi.createRule,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setOpen(false)
      await client.invalidateQueries({ queryKey: queryKeys.scheduling })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const generateMutation = useMutation({
    mutationFn: ({ id, throughDate }: { id: string; throughDate: string }) => schedulingApi.generate(id, throughDate),
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setGenerateRule(null)
      await client.invalidateQueries({ queryKey: queryKeys.scheduling })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const rows = useMemo(
    () => (catalog.data?.rules ?? []).filter((item) => `${item.className} ${item.code}`.toLowerCase().includes(query.toLowerCase())),
    [catalog.data, query],
  )
  if (catalog.isLoading) return <PageSpinner label={t('common.loading')} />
  if (catalog.error) return <QueryError message={catalog.error.message} onRetry={() => void catalog.refetch()} />
  return (
    <div className="space-y-5">
      <Toolbar query={query} onQuery={setQuery}>
        {canWrite && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>{t('schedule.addRule')}</Button>}
      </Toolbar>
      <DataTable
        rows={rows}
        columns={[
          { key: 'class', header: t('enrollments.class'), render: (row) => <Cell title={row.className} detail={`${row.startsAt} – ${row.endsAt}`} /> },
          { key: 'code', header: t('common.code'), render: (row) => <span dir="ltr">{row.code}</span> },
          { key: 'recurrence', header: t('schedule.recurrence'), render: (row) => t(`enums.${row.recurrenceType}`, { defaultValue: row.recurrenceType }) },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
          ...(canWrite
            ? [{
                key: 'actions',
                header: t('common.actions'),
                render: (row: RuleView) => (
                  <Button variant="ghost" onClick={() => setGenerateRule(row)}>{t('schedule.generate')}</Button>
                ),
              }]
            : []),
        ]}
      />
      {open && catalog.data && (
        <RuleForm
          sections={classroom.data?.sections ?? []}
          instructors={people.data?.instructors ?? []}
          locations={catalog.data.locations}
          busy={createMutation.isPending}
          onClose={() => setOpen(false)}
          onSubmit={(body) => createMutation.mutate(body)}
        />
      )}
      {generateRule && (
        <GenerateForm
          busy={generateMutation.isPending}
          onClose={() => setGenerateRule(null)}
          onSubmit={(throughDate) => generateMutation.mutate({ id: generateRule.id, throughDate })}
        />
      )}
    </div>
  )
}

function RuleForm({
  sections,
  instructors,
  locations,
  busy,
  onClose,
  onSubmit,
}: {
  sections: Array<{ id: string; name: string }>
  instructors: Array<{ id: string; person: { firstName: string; lastName: string } }>
  locations: Array<{ id: string; name: string }>
  busy: boolean
  onClose: () => void
  onSubmit: (body: {
    classSectionId: string
    code: string
    recurrenceType: string
    startsOn: string
    endsOn: string
    dayOfWeek: string | null
    startsAt: string
    endsAt: string
    timeZone: string
    intervalWeeks: number
    locationId: string | null
    instructorIds: string[]
  }) => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    classSectionId: sections[0]?.id ?? '',
    instructorId: instructors[0]?.id ?? '',
    locationId: locations[0]?.id ?? '',
    code: '',
    recurrenceType: 'WEEKLY',
    startsOn: todayIso(),
    endsOn: todayIso(),
    dayOfWeek: 'SATURDAY',
    startsAt: '09:00',
    endsAt: '10:30',
    timeZone: 'Asia/Tehran',
    intervalWeeks: '1',
  })
  return (
    <Modal title={t('schedule.addRule')} onClose={onClose}>
      <FormStack>
        <SelectField label={t('enrollments.class')} value={form.classSectionId} onChange={(classSectionId) => setForm({ ...form, classSectionId })} options={sections.map((item) => [item.id, item.name])} />
        <SelectField label={t('schedule.instructor')} value={form.instructorId} onChange={(instructorId) => setForm({ ...form, instructorId })} options={instructors.map((item) => [item.id, personName(item.person)])} />
        <SelectField label={t('schedule.location')} value={form.locationId} onChange={(locationId) => setForm({ ...form, locationId })} options={[[' ', t('common.none')], ...locations.map((item) => [item.id, item.name])]} required={false} />
        <Field label={t('common.code')} value={form.code} onChange={(code) => setForm({ ...form, code })} />
        <SelectField label={t('schedule.recurrence')} value={form.recurrenceType} onChange={(recurrenceType) => setForm({ ...form, recurrenceType })} options={[['WEEKLY', t('enums.WEEKLY')], ['ONCE', t('enums.ONCE')]]} />
        {form.recurrenceType === 'WEEKLY' && (
          <SelectField label={t('schedule.dayOfWeek')} value={form.dayOfWeek} onChange={(dayOfWeek) => setForm({ ...form, dayOfWeek })} options={['SATURDAY', 'SUNDAY', 'MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY'].map((id) => [id, t(`enums.${id}`)])} />
        )}
        <FormGrid>
          <Field label={t('academic.startsOn')} type="date" value={form.startsOn} onChange={(startsOn) => setForm({ ...form, startsOn })} />
          <Field label={t('academic.endsOn')} type="date" value={form.endsOn} onChange={(endsOn) => setForm({ ...form, endsOn })} required={form.recurrenceType === 'WEEKLY'} />
        </FormGrid>
        <FormGrid>
          <Field label={t('schedule.startsAt')} type="time" value={form.startsAt} onChange={(startsAt) => setForm({ ...form, startsAt })} />
          <Field label={t('schedule.endsAt')} type="time" value={form.endsAt} onChange={(endsAt) => setForm({ ...form, endsAt })} />
        </FormGrid>
        <Field label={t('schedule.intervalWeeks')} type="number" value={form.intervalWeeks} onChange={(intervalWeeks) => setForm({ ...form, intervalWeeks })} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() =>
              onSubmit({
                classSectionId: form.classSectionId,
                code: form.code,
                recurrenceType: form.recurrenceType,
                startsOn: form.startsOn,
                endsOn: form.recurrenceType === 'ONCE' ? form.startsOn : form.endsOn,
                dayOfWeek: form.recurrenceType === 'WEEKLY' ? form.dayOfWeek : null,
                startsAt: form.startsAt,
                endsAt: form.endsAt,
                timeZone: form.timeZone,
                intervalWeeks: Number(form.intervalWeeks),
                locationId: emptyToNull(form.locationId.trim()),
                instructorIds: form.instructorId ? [form.instructorId] : [],
              })
            }
          >
            {t('common.save')}
          </Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}

function GenerateForm({ busy, onClose, onSubmit }: { busy: boolean; onClose: () => void; onSubmit: (throughDate: string) => void }) {
  const { t } = useTranslation()
  const defaultDate = new Date(Date.now() + 90 * 86400000).toISOString().slice(0, 10)
  const [throughDate, setThroughDate] = useState(defaultDate)
  return (
    <Modal title={t('schedule.generate')} onClose={onClose}>
      <FormStack>
        <Field label={t('schedule.throughDate')} type="date" value={throughDate} onChange={setThroughDate} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="button" disabled={busy} onClick={() => onSubmit(throughDate)}>{t('common.save')}</Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}

export function SessionsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const { locale } = useLocale()
  const auth = useAuth()
  const client = useQueryClient()
  const canWrite = auth.hasPermission('SCHEDULE_WRITE')
  const [query, setQuery] = useState('')
  const [cancelItem, setCancelItem] = useState<SessionView | null>(null)
  const [rescheduleItem, setRescheduleItem] = useState<SessionView | null>(null)
  const catalog = useSchedule()
  const cancelMutation = useMutation({
    mutationFn: ({ id, reason }: { id: string; reason: string }) => schedulingApi.cancel(id, reason),
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setCancelItem(null)
      await client.invalidateQueries({ queryKey: queryKeys.scheduling })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const rescheduleMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: { sessionDate: string; startsAt: string; endsAt: string; timeZone: string; reason: string } }) =>
      schedulingApi.reschedule(id, body),
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setRescheduleItem(null)
      await client.invalidateQueries({ queryKey: queryKeys.scheduling })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const rows = useMemo(
    () => (catalog.data?.sessions ?? []).filter((item) => `${item.className} ${item.courseTitle}`.toLowerCase().includes(query.toLowerCase())),
    [catalog.data, query],
  )
  if (catalog.isLoading) return <PageSpinner label={t('common.loading')} />
  if (catalog.error) return <QueryError message={catalog.error.message} onRetry={() => void catalog.refetch()} />
  return (
    <div className="space-y-5">
      <Toolbar query={query} onQuery={setQuery} />
      <DataTable
        rows={rows}
        columns={[
          { key: 'class', header: t('enrollments.class'), render: (row) => <Cell title={row.className} detail={`${row.courseTitle} · ${row.locationName || t('common.dash')}`} /> },
          { key: 'when', header: t('common.date'), render: (row) => formatDate(row.plannedStartAt, locale) },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
          ...(canWrite
            ? [{
                key: 'actions',
                header: t('common.actions'),
                render: (row: SessionView) =>
                  ['PLANNED', 'CONFIRMED'].includes(row.status) ? (
                    <div className="flex gap-1">
                      <Button variant="ghost" onClick={() => setRescheduleItem(row)}>{t('schedule.reschedule')}</Button>
                      <Button variant="ghost" onClick={() => setCancelItem(row)}>{t('schedule.cancelSession')}</Button>
                    </div>
                  ) : t('common.dash'),
              }]
            : []),
        ]}
      />
      {cancelItem && (
        <ConfirmDialog
          title={t('schedule.cancelSession')}
          danger
          requireReason
          onClose={() => setCancelItem(null)}
          onConfirm={(reason) => cancelMutation.mutateAsync({ id: cancelItem.id, reason: reason || '' })}
        />
      )}
      {rescheduleItem && (
        <RescheduleForm
          session={rescheduleItem}
          busy={rescheduleMutation.isPending}
          onClose={() => setRescheduleItem(null)}
          onSubmit={(body) => rescheduleMutation.mutate({ id: rescheduleItem.id, body })}
        />
      )}
    </div>
  )
}

function RescheduleForm({
  session,
  busy,
  onClose,
  onSubmit,
}: {
  session: SessionView
  busy: boolean
  onClose: () => void
  onSubmit: (body: { sessionDate: string; startsAt: string; endsAt: string; timeZone: string; reason: string }) => void
}) {
  const { t } = useTranslation()
  const time = (value: string) => new Date(value).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', timeZone: 'Asia/Tehran' })
  const [form, setForm] = useState({
    sessionDate: session.sessionDate,
    startsAt: time(session.plannedStartAt),
    endsAt: time(session.plannedEndAt),
    timeZone: 'Asia/Tehran',
    reason: '',
  })
  return (
    <Modal title={t('schedule.reschedule')} onClose={onClose}>
      <FormStack>
        <Field label={t('schedule.sessionDate')} type="date" value={form.sessionDate} onChange={(sessionDate) => setForm({ ...form, sessionDate })} />
        <FormGrid>
          <Field label={t('schedule.startsAt')} type="time" value={form.startsAt} onChange={(startsAt) => setForm({ ...form, startsAt })} />
          <Field label={t('schedule.endsAt')} type="time" value={form.endsAt} onChange={(endsAt) => setForm({ ...form, endsAt })} />
        </FormGrid>
        <Field label={t('common.reason')} value={form.reason} onChange={(reason) => setForm({ ...form, reason })} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="button" disabled={busy} onClick={() => onSubmit(form)}>{t('common.save')}</Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}
