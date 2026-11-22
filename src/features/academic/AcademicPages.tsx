import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { academicApi } from '@/api/academic'
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
import { emptyToNull } from '@/lib/format'

function useAcademic() {
  return useQuery({ queryKey: queryKeys.academic, queryFn: academicApi.list })
}

export function PeriodsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const auth = useAuth()
  const client = useQueryClient()
  const canWrite = auth.hasPermission('ACADEMIC_WRITE')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const catalog = useAcademic()
  const mutation = useMutation({
    mutationFn: academicApi.createPeriod,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setOpen(false)
      await client.invalidateQueries({ queryKey: queryKeys.academic })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const rows = useMemo(
    () => (catalog.data?.periods ?? []).filter((item) => `${item.name} ${item.code}`.toLowerCase().includes(query.toLowerCase())),
    [catalog.data, query],
  )
  if (catalog.isLoading) return <PageSpinner label={t('common.loading')} />
  if (catalog.error) return <QueryError message={catalog.error.message} onRetry={() => void catalog.refetch()} />
  return (
    <div className="space-y-5">
      <Toolbar query={query} onQuery={setQuery}>
        {canWrite && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>{t('academic.addPeriod')}</Button>}
      </Toolbar>
      <DataTable
        rows={rows}
        columns={[
          { key: 'name', header: t('common.name'), render: (row) => <Cell title={row.name} detail={`${row.startsOn} → ${row.endsOn}`} /> },
          { key: 'code', header: t('common.code'), render: (row) => <span dir="ltr">{row.code}</span> },
          { key: 'type', header: t('common.type'), render: (row) => t(`enums.${row.type}`, { defaultValue: row.type }) },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
        ]}
      />
      {open && <PeriodForm busy={mutation.isPending} onClose={() => setOpen(false)} onSubmit={(body) => mutation.mutate(body)} />}
    </div>
  )
}

function PeriodForm({ busy, onClose, onSubmit }: { busy: boolean; onClose: () => void; onSubmit: (body: { code: string; name: string; type: string; startsOn: string; endsOn: string }) => void }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ code: '', name: '', type: 'ACADEMIC_YEAR', startsOn: '', endsOn: '' })
  return (
    <Modal title={t('academic.addPeriod')} onClose={onClose}>
      <FormStack>
        <Field label={t('common.code')} value={form.code} onChange={(code) => setForm({ ...form, code })} />
        <Field label={t('common.name')} value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <SelectField label={t('common.type')} value={form.type} onChange={(type) => setForm({ ...form, type })} options={['ACADEMIC_YEAR', 'TERM', 'SEMESTER', 'QUARTER', 'CUSTOM'].map((id) => [id, t(`enums.${id}`)])} />
        <FormGrid>
          <Field label={t('academic.startsOn')} type="date" value={form.startsOn} onChange={(startsOn) => setForm({ ...form, startsOn })} />
          <Field label={t('academic.endsOn')} type="date" value={form.endsOn} onChange={(endsOn) => setForm({ ...form, endsOn })} />
        </FormGrid>
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="button" disabled={busy} onClick={() => onSubmit(form)}>{t('common.save')}</Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}

export function ProgramsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const auth = useAuth()
  const client = useQueryClient()
  const canWrite = auth.hasPermission('ACADEMIC_WRITE')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const catalog = useAcademic()
  const mutation = useMutation({
    mutationFn: academicApi.createProgram,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setOpen(false)
      await client.invalidateQueries({ queryKey: queryKeys.academic })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const rows = useMemo(
    () => (catalog.data?.programs ?? []).filter((item) => `${item.name} ${item.code}`.toLowerCase().includes(query.toLowerCase())),
    [catalog.data, query],
  )
  if (catalog.isLoading) return <PageSpinner label={t('common.loading')} />
  if (catalog.error) return <QueryError message={catalog.error.message} onRetry={() => void catalog.refetch()} />
  return (
    <div className="space-y-5">
      <Toolbar query={query} onQuery={setQuery}>
        {canWrite && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>{t('academic.addProgram')}</Button>}
      </Toolbar>
      <DataTable
        rows={rows}
        columns={[
          { key: 'name', header: t('common.name'), render: (row) => <Cell title={row.name} detail={row.description || t('common.dash')} /> },
          { key: 'code', header: t('common.code'), render: (row) => <span dir="ltr">{row.code}</span> },
          { key: 'type', header: t('common.type'), render: (row) => t(`enums.${row.type}`, { defaultValue: row.type }) },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
        ]}
      />
      {open && <ProgramForm busy={mutation.isPending} onClose={() => setOpen(false)} onSubmit={(body) => mutation.mutate(body)} />}
    </div>
  )
}

function ProgramForm({ busy, onClose, onSubmit }: { busy: boolean; onClose: () => void; onSubmit: (body: { code: string; name: string; type: string; description: string | null }) => void }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ code: '', name: '', type: 'GENERAL', description: '' })
  return (
    <Modal title={t('academic.addProgram')} onClose={onClose}>
      <FormStack>
        <Field label={t('common.code')} value={form.code} onChange={(code) => setForm({ ...form, code })} />
        <Field label={t('common.name')} value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <SelectField label={t('common.type')} value={form.type} onChange={(type) => setForm({ ...form, type })} options={['SCHOOL_GRADE', 'LANGUAGE_LEVEL', 'EXAM_PREPARATION', 'VOCATIONAL_SKILL', 'GENERAL'].map((id) => [id, t(`enums.${id}`)])} />
        <Field label={t('common.description')} value={form.description} onChange={(description) => setForm({ ...form, description })} required={false} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="button" disabled={busy} onClick={() => onSubmit({ ...form, description: emptyToNull(form.description) })}>{t('common.save')}</Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}

export function CoursesPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const auth = useAuth()
  const client = useQueryClient()
  const canWrite = auth.hasPermission('ACADEMIC_WRITE')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const catalog = useAcademic()
  const createMutation = useMutation({
    mutationFn: academicApi.createCourse,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setOpen(false)
      await client.invalidateQueries({ queryKey: queryKeys.academic })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const attachMutation = useMutation({
    mutationFn: academicApi.attachCourse,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setLinkOpen(false)
      await client.invalidateQueries({ queryKey: queryKeys.academic })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const rows = useMemo(
    () => (catalog.data?.courses ?? []).filter((item) => `${item.title} ${item.code}`.toLowerCase().includes(query.toLowerCase())),
    [catalog.data, query],
  )
  if (catalog.isLoading) return <PageSpinner label={t('common.loading')} />
  if (catalog.error) return <QueryError message={catalog.error.message} onRetry={() => void catalog.refetch()} />
  return (
    <div className="space-y-5">
      <Toolbar query={query} onQuery={setQuery}>
        {canWrite && (
          <>
            <Button variant="secondary" onClick={() => setLinkOpen(true)}>{t('academic.attachCourse')}</Button>
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>{t('academic.addCourse')}</Button>
          </>
        )}
      </Toolbar>
      <DataTable
        rows={rows}
        columns={[
          { key: 'title', header: t('common.name'), render: (row) => <Cell title={row.title} detail={row.description || t('common.dash')} /> },
          { key: 'code', header: t('common.code'), render: (row) => <span dir="ltr">{row.code}</span> },
          { key: 'duration', header: t('academic.duration'), render: (row) => row.durationMinutes ?? t('common.dash') },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
        ]}
      />
      <DataTable
        rows={catalog.data?.programCourses ?? []}
        columns={[
          { key: 'program', header: t('academic.program'), render: (row) => row.programName },
          { key: 'course', header: t('academic.course'), render: (row) => row.courseTitle },
          { key: 'seq', header: t('academic.sequence'), render: (row) => row.sequenceNumber },
          { key: 'req', header: t('academic.requiredCourse'), render: (row) => (row.required ? t('common.yes') : t('common.no')) },
        ]}
      />
      {open && <CourseForm busy={createMutation.isPending} onClose={() => setOpen(false)} onSubmit={(body) => createMutation.mutate(body)} />}
      {linkOpen && catalog.data && (
        <AttachForm
          programs={catalog.data.programs}
          courses={catalog.data.courses}
          busy={attachMutation.isPending}
          onClose={() => setLinkOpen(false)}
          onSubmit={(body) => attachMutation.mutate(body)}
        />
      )}
    </div>
  )
}

function CourseForm({ busy, onClose, onSubmit }: { busy: boolean; onClose: () => void; onSubmit: (body: { code: string; title: string; description: string | null; durationMinutes: number | null }) => void }) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ code: '', title: '', description: '', durationMinutes: '' })
  return (
    <Modal title={t('academic.addCourse')} onClose={onClose}>
      <FormStack>
        <Field label={t('common.code')} value={form.code} onChange={(code) => setForm({ ...form, code })} />
        <Field label={t('common.name')} value={form.title} onChange={(title) => setForm({ ...form, title })} />
        <Field label={t('academic.duration')} type="number" value={form.durationMinutes} onChange={(durationMinutes) => setForm({ ...form, durationMinutes })} required={false} />
        <Field label={t('common.description')} value={form.description} onChange={(description) => setForm({ ...form, description })} required={false} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="button" disabled={busy} onClick={() => onSubmit({ code: form.code, title: form.title, description: emptyToNull(form.description), durationMinutes: form.durationMinutes ? Number(form.durationMinutes) : null })}>{t('common.save')}</Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}

function AttachForm({
  programs,
  courses,
  busy,
  onClose,
  onSubmit,
}: {
  programs: Array<{ id: string; name: string }>
  courses: Array<{ id: string; title: string }>
  busy: boolean
  onClose: () => void
  onSubmit: (body: { programId: string; courseId: string; sequenceNumber: number; required: boolean }) => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ programId: programs[0]?.id ?? '', courseId: courses[0]?.id ?? '', sequenceNumber: '1', required: true })
  return (
    <Modal title={t('academic.attachCourse')} onClose={onClose}>
      <FormStack>
        <SelectField label={t('academic.program')} value={form.programId} onChange={(programId) => setForm({ ...form, programId })} options={programs.map((item) => [item.id, item.name])} />
        <SelectField label={t('academic.course')} value={form.courseId} onChange={(courseId) => setForm({ ...form, courseId })} options={courses.map((item) => [item.id, item.title])} />
        <Field label={t('academic.sequence')} type="number" value={form.sequenceNumber} onChange={(sequenceNumber) => setForm({ ...form, sequenceNumber })} />
        <Check label={t('academic.requiredCourse')} checked={form.required} onChange={(required) => setForm({ ...form, required })} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="button" disabled={busy} onClick={() => onSubmit({ ...form, sequenceNumber: Number(form.sequenceNumber) })}>{t('common.save')}</Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}
