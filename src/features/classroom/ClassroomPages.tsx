import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { academicApi } from '@/api/academic'
import { classroomApi } from '@/api/classroom'
import { organizationApi } from '@/api/organization'
import { peopleApi } from '@/api/people'
import { queryKeys } from '@/api/queryKeys'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Cell, DataTable } from '@/components/ui/DataTable'
import { Check, Field, SelectField } from '@/components/ui/Field'
import { FormActions, FormGrid, FormStack } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner, QueryError } from '@/components/ui/Spinner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Toolbar } from '@/components/ui/Toolbar'
import { useToast } from '@/components/ui/Toast'
import { emptyToNull, personName, todayIso } from '@/lib/format'

export function OfferingsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const auth = useAuth()
  const client = useQueryClient()
  const canWrite = auth.hasPermission('CLASS_WRITE')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const classroom = useQuery({ queryKey: queryKeys.classroom, queryFn: classroomApi.list })
  const academic = useQuery({ queryKey: queryKeys.academic, queryFn: academicApi.list, enabled: open })
  const branches = useQuery({ queryKey: queryKeys.branches, queryFn: organizationApi.branches, enabled: open })
  const mutation = useMutation({
    mutationFn: classroomApi.createOffering,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setOpen(false)
      await client.invalidateQueries({ queryKey: queryKeys.classroom })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const rows = useMemo(
    () => (classroom.data?.offerings ?? []).filter((item) => `${item.courseTitle} ${item.code}`.toLowerCase().includes(query.toLowerCase())),
    [classroom.data, query],
  )
  if (classroom.isLoading) return <PageSpinner label={t('common.loading')} />
  if (classroom.error) return <QueryError message={classroom.error.message} onRetry={() => void classroom.refetch()} />
  return (
    <div className="space-y-5">
      <Toolbar query={query} onQuery={setQuery}>
        {canWrite && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>{t('classes.addOffering')}</Button>}
      </Toolbar>
      <DataTable
        rows={rows}
        columns={[
          { key: 'course', header: t('academic.course'), render: (row) => <Cell title={row.courseTitle} detail={`${row.academicPeriodName} · ${row.branchName}`} /> },
          { key: 'code', header: t('common.code'), render: (row) => <span dir="ltr">{row.code}</span> },
          { key: 'window', header: t('classes.enrollmentWindow'), render: (row) => `${row.enrollmentStartsOn || t('common.dash')} → ${row.enrollmentEndsOn || t('common.dash')}` },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
        ]}
      />
      {open && (
        <OfferingForm
          periods={academic.data?.periods ?? []}
          courses={academic.data?.courses ?? []}
          branches={branches.data ?? []}
          busy={mutation.isPending}
          onClose={() => setOpen(false)}
          onSubmit={(body) => mutation.mutate(body)}
        />
      )}
    </div>
  )
}

function OfferingForm({
  periods,
  courses,
  branches,
  busy,
  onClose,
  onSubmit,
}: {
  periods: Array<{ id: string; name: string }>
  courses: Array<{ id: string; title: string }>
  branches: Array<{ id: string; name: string }>
  busy: boolean
  onClose: () => void
  onSubmit: (body: { academicPeriodId: string; courseId: string; branchId: string; code: string; enrollmentStartsOn: string | null; enrollmentEndsOn: string | null }) => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    academicPeriodId: periods[0]?.id ?? '',
    courseId: courses[0]?.id ?? '',
    branchId: branches[0]?.id ?? '',
    code: '',
    enrollmentStartsOn: '',
    enrollmentEndsOn: '',
  })
  return (
    <Modal title={t('classes.addOffering')} onClose={onClose}>
      <FormStack>
        <SelectField label={t('classes.period')} value={form.academicPeriodId} onChange={(academicPeriodId) => setForm({ ...form, academicPeriodId })} options={periods.map((item) => [item.id, item.name])} />
        <SelectField label={t('academic.course')} value={form.courseId} onChange={(courseId) => setForm({ ...form, courseId })} options={courses.map((item) => [item.id, item.title])} />
        <SelectField label={t('classes.branch')} value={form.branchId} onChange={(branchId) => setForm({ ...form, branchId })} options={branches.map((item) => [item.id, item.name])} />
        <Field label={t('common.code')} value={form.code} onChange={(code) => setForm({ ...form, code })} />
        <FormGrid>
          <Field label={t('academic.startsOn')} type="date" value={form.enrollmentStartsOn} onChange={(enrollmentStartsOn) => setForm({ ...form, enrollmentStartsOn })} required={false} />
          <Field label={t('academic.endsOn')} type="date" value={form.enrollmentEndsOn} onChange={(enrollmentEndsOn) => setForm({ ...form, enrollmentEndsOn })} required={false} />
        </FormGrid>
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="button" disabled={busy} onClick={() => onSubmit({ ...form, enrollmentStartsOn: emptyToNull(form.enrollmentStartsOn), enrollmentEndsOn: emptyToNull(form.enrollmentEndsOn) })}>{t('common.save')}</Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}

export function SectionsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const auth = useAuth()
  const client = useQueryClient()
  const canWrite = auth.hasPermission('CLASS_WRITE')
  const [query, setQuery] = useState('')
  const [sectionOpen, setSectionOpen] = useState(false)
  const [assignOpen, setAssignOpen] = useState(false)
  const classroom = useQuery({ queryKey: queryKeys.classroom, queryFn: classroomApi.list })
  const people = useQuery({ queryKey: queryKeys.people, queryFn: peopleApi.list, enabled: assignOpen })
  const sectionMutation = useMutation({
    mutationFn: classroomApi.createSection,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setSectionOpen(false)
      await client.invalidateQueries({ queryKey: queryKeys.classroom })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const assignMutation = useMutation({
    mutationFn: classroomApi.assignInstructor,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setAssignOpen(false)
      await client.invalidateQueries({ queryKey: queryKeys.classroom })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const rows = useMemo(
    () => (classroom.data?.sections ?? []).filter((item) => `${item.name} ${item.code}`.toLowerCase().includes(query.toLowerCase())),
    [classroom.data, query],
  )
  if (classroom.isLoading) return <PageSpinner label={t('common.loading')} />
  if (classroom.error) return <QueryError message={classroom.error.message} onRetry={() => void classroom.refetch()} />
  return (
    <div className="space-y-5">
      <Toolbar query={query} onQuery={setQuery}>
        {canWrite && (
          <>
            <Button variant="secondary" onClick={() => setAssignOpen(true)}>{t('classes.assignInstructor')}</Button>
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setSectionOpen(true)}>{t('classes.addSection')}</Button>
          </>
        )}
      </Toolbar>
      <DataTable
        rows={rows}
        columns={[
          { key: 'name', header: t('classes.className'), render: (row) => <Cell title={row.name} detail={`${row.courseTitle} · ${row.branchName}`} /> },
          { key: 'code', header: t('common.code'), render: (row) => <span dir="ltr">{row.code}</span> },
          { key: 'capacity', header: t('classes.capacity'), render: (row) => row.capacity },
          { key: 'mode', header: t('classes.deliveryMode'), render: (row) => t(`enums.${row.deliveryMode}`, { defaultValue: row.deliveryMode }) },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
        ]}
      />
      <DataTable
        rows={classroom.data?.instructors ?? []}
        columns={[
          { key: 'instructor', header: t('schedule.instructor'), render: (row) => <Cell title={row.instructorName} detail={row.className} /> },
          { key: 'role', header: t('classes.role'), render: (row) => t(`enums.${row.role}`, { defaultValue: row.role }) },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
        ]}
      />
      {sectionOpen && classroom.data && (
        <SectionForm
          offerings={classroom.data.offerings}
          busy={sectionMutation.isPending}
          onClose={() => setSectionOpen(false)}
          onSubmit={(body) => sectionMutation.mutate(body)}
        />
      )}
      {assignOpen && classroom.data && (
        <AssignForm
          sections={classroom.data.sections}
          instructors={people.data?.instructors ?? []}
          busy={assignMutation.isPending}
          onClose={() => setAssignOpen(false)}
          onSubmit={(body) => assignMutation.mutate(body)}
        />
      )}
    </div>
  )
}

function SectionForm({
  offerings,
  busy,
  onClose,
  onSubmit,
}: {
  offerings: Array<{ id: string; courseTitle: string; branchName: string }>
  busy: boolean
  onClose: () => void
  onSubmit: (body: { offeringId: string; code: string; name: string; capacity: number; deliveryMode: string }) => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ offeringId: offerings[0]?.id ?? '', code: '', name: '', capacity: '20', deliveryMode: 'IN_PERSON' })
  return (
    <Modal title={t('classes.addSection')} onClose={onClose}>
      <FormStack>
        <SelectField label={t('nav.offerings')} value={form.offeringId} onChange={(offeringId) => setForm({ ...form, offeringId })} options={offerings.map((item) => [item.id, `${item.courseTitle} · ${item.branchName}`])} />
        <FormGrid>
          <Field label={t('common.code')} value={form.code} onChange={(code) => setForm({ ...form, code })} />
          <Field label={t('classes.className')} value={form.name} onChange={(name) => setForm({ ...form, name })} />
        </FormGrid>
        <Field label={t('classes.capacity')} type="number" value={form.capacity} onChange={(capacity) => setForm({ ...form, capacity })} />
        <SelectField label={t('classes.deliveryMode')} value={form.deliveryMode} onChange={(deliveryMode) => setForm({ ...form, deliveryMode })} options={['IN_PERSON', 'ONLINE', 'HYBRID'].map((id) => [id, t(`enums.${id}`)])} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="button" disabled={busy} onClick={() => onSubmit({ ...form, capacity: Number(form.capacity) })}>{t('common.save')}</Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}

function AssignForm({
  sections,
  instructors,
  busy,
  onClose,
  onSubmit,
}: {
  sections: Array<{ id: string; name: string }>
  instructors: Array<{ id: string; person: { firstName: string; lastName: string } }>
  busy: boolean
  onClose: () => void
  onSubmit: (body: { classSectionId: string; instructorId: string; role: string; primary: boolean; effectiveFrom: string; effectiveTo: string | null }) => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    classSectionId: sections[0]?.id ?? '',
    instructorId: instructors[0]?.id ?? '',
    role: 'PRIMARY_INSTRUCTOR',
    primary: true,
    effectiveFrom: todayIso(),
    effectiveTo: '',
  })
  return (
    <Modal title={t('classes.assignInstructor')} onClose={onClose}>
      <FormStack>
        <SelectField label={t('enrollments.class')} value={form.classSectionId} onChange={(classSectionId) => setForm({ ...form, classSectionId })} options={sections.map((item) => [item.id, item.name])} />
        <SelectField label={t('schedule.instructor')} value={form.instructorId} onChange={(instructorId) => setForm({ ...form, instructorId })} options={instructors.map((item) => [item.id, personName(item.person)])} />
        <SelectField
          label={t('classes.role')}
          value={form.role}
          onChange={(role) => setForm({ ...form, role, primary: role === 'PRIMARY_INSTRUCTOR' })}
          options={['PRIMARY_INSTRUCTOR', 'ASSISTANT_INSTRUCTOR', 'SUBSTITUTE_INSTRUCTOR', 'GUEST_INSTRUCTOR', 'EXAMINER'].map((id) => [id, t(`enums.${id}`)])}
        />
        <FormGrid>
          <Field label={t('classes.effectiveFrom')} type="date" value={form.effectiveFrom} onChange={(effectiveFrom) => setForm({ ...form, effectiveFrom })} />
          <Field label={t('classes.effectiveTo')} type="date" value={form.effectiveTo} onChange={(effectiveTo) => setForm({ ...form, effectiveTo })} required={false} />
        </FormGrid>
        <Check label={t('classes.primary')} checked={form.primary} onChange={(primary) => setForm({ ...form, primary })} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="button" disabled={busy} onClick={() => onSubmit({ ...form, effectiveTo: emptyToNull(form.effectiveTo) })}>{t('common.save')}</Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}
