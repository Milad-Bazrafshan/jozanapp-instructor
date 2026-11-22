import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { peopleApi } from '@/api/people'
import { queryKeys } from '@/api/queryKeys'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Cell, DataTable } from '@/components/ui/DataTable'
import { Check, Field, SelectField } from '@/components/ui/Field'
import { FormActions, FormStack } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner, QueryError } from '@/components/ui/Spinner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Toolbar } from '@/components/ui/Toolbar'
import { useToast } from '@/components/ui/Toast'
import { emptyToNull, personName, todayIso } from '@/lib/format'
import { emptyPerson, PersonFields } from './PersonFields'
import { sanitizePerson } from './StudentsPage'

export function GuardiansPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const auth = useAuth()
  const client = useQueryClient()
  const canWrite = auth.hasPermission('PEOPLE_WRITE')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [linkOpen, setLinkOpen] = useState(false)
  const people = useQuery({ queryKey: queryKeys.people, queryFn: peopleApi.list })
  const createMutation = useMutation({
    mutationFn: peopleApi.createGuardian,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setOpen(false)
      await client.invalidateQueries({ queryKey: queryKeys.people })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const linkMutation = useMutation({
    mutationFn: peopleApi.linkGuardian,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setLinkOpen(false)
      await client.invalidateQueries({ queryKey: queryKeys.people })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const rows = useMemo(
    () => (people.data?.guardians ?? []).filter((item) => personName(item.person).toLowerCase().includes(query.toLowerCase())),
    [people.data, query],
  )
  const links = people.data?.relationships ?? []
  if (people.isLoading) return <PageSpinner label={t('common.loading')} />
  if (people.error) return <QueryError message={people.error.message} onRetry={() => void people.refetch()} />

  return (
    <div className="space-y-5">
      <Toolbar query={query} onQuery={setQuery}>
        {canWrite && (
          <>
            <Button variant="secondary" onClick={() => setLinkOpen(true)}>{t('people.linkGuardian')}</Button>
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>{t('people.addGuardian')}</Button>
          </>
        )}
      </Toolbar>
      <DataTable
        rows={rows}
        columns={[
          { key: 'name', header: t('common.name'), render: (row) => <Cell title={personName(row.person)} detail={row.occupation || t('common.dash')} /> },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
        ]}
      />
      <div className="shell-card p-5">
        <h3 className="font-semibold mb-4">{t('people.links')}</h3>
        <DataTable
          rows={links}
          columns={[
            { key: 'student', header: t('enrollments.student'), render: (row) => personName(row.student.person) },
            { key: 'guardian', header: t('nav.guardians'), render: (row) => personName(row.guardian.person) },
            { key: 'rel', header: t('people.relationship'), render: (row) => t(`enums.${row.relationshipType}`, { defaultValue: row.relationshipType }) },
            { key: 'from', header: t('people.effectiveFrom'), render: (row) => row.effectiveFrom },
          ]}
        />
      </div>
      {open && (
        <GuardianForm busy={createMutation.isPending} onClose={() => setOpen(false)} onSubmit={(body) => createMutation.mutate(body)} />
      )}
      {linkOpen && people.data && (
        <LinkForm
          students={people.data.students}
          guardians={people.data.guardians}
          busy={linkMutation.isPending}
          onClose={() => setLinkOpen(false)}
          onSubmit={(body) => linkMutation.mutate(body)}
        />
      )}
    </div>
  )
}

function GuardianForm({
  busy,
  onClose,
  onSubmit,
}: {
  busy: boolean
  onClose: () => void
  onSubmit: (body: { occupation: string | null; person: ReturnType<typeof sanitizePerson> }) => void
}) {
  const { t } = useTranslation()
  const [occupation, setOccupation] = useState('')
  const [person, setPerson] = useState(emptyPerson)
  return (
    <Modal title={t('people.addGuardian')} onClose={onClose}>
      <FormStack>
        <Field label={t('people.occupation')} value={occupation} onChange={setOccupation} required={false} />
        <PersonFields person={person} onChange={setPerson} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="button" disabled={busy} onClick={() => onSubmit({ occupation: emptyToNull(occupation), person: sanitizePerson(person) })}>
            {t('common.save')}
          </Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}

function LinkForm({
  students,
  guardians,
  busy,
  onClose,
  onSubmit,
}: {
  students: Array<{ id: string; person: { firstName: string; lastName: string }; code: string }>
  guardians: Array<{ id: string; person: { firstName: string; lastName: string } }>
  busy: boolean
  onClose: () => void
  onSubmit: (body: {
    studentId: string
    guardianId: string
    relationshipType: string
    primary: boolean
    academicAccess: boolean
    financialAccess: boolean
    pickupPermission: boolean
    receivesNotifications: boolean
    effectiveFrom: string
  }) => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    studentId: students[0]?.id ?? '',
    guardianId: guardians[0]?.id ?? '',
    relationshipType: 'FATHER',
    primary: false,
    academicAccess: true,
    financialAccess: false,
    pickupPermission: false,
    receivesNotifications: true,
    effectiveFrom: todayIso(),
  })
  return (
    <Modal title={t('people.linkGuardian')} onClose={onClose}>
      <FormStack>
        <SelectField label={t('enrollments.student')} value={form.studentId} onChange={(studentId) => setForm({ ...form, studentId })} options={students.map((item) => [item.id, `${personName(item.person)} · ${item.code}`])} />
        <SelectField label={t('nav.guardians')} value={form.guardianId} onChange={(guardianId) => setForm({ ...form, guardianId })} options={guardians.map((item) => [item.id, personName(item.person)])} />
        <SelectField
          label={t('people.relationship')}
          value={form.relationshipType}
          onChange={(relationshipType) => setForm({ ...form, relationshipType })}
          options={['FATHER', 'MOTHER', 'LEGAL_GUARDIAN', 'OTHER'].map((id) => [id, t(`enums.${id}`)])}
        />
        <Field label={t('people.effectiveFrom')} type="date" value={form.effectiveFrom} onChange={(effectiveFrom) => setForm({ ...form, effectiveFrom })} />
        <div className="grid sm:grid-cols-2 gap-2">
          <Check label={t('people.primary')} checked={form.primary} onChange={(primary) => setForm({ ...form, primary })} />
          <Check label={t('people.academicAccess')} checked={form.academicAccess} onChange={(academicAccess) => setForm({ ...form, academicAccess })} />
          <Check label={t('people.financialAccess')} checked={form.financialAccess} onChange={(financialAccess) => setForm({ ...form, financialAccess })} />
          <Check label={t('people.pickupPermission')} checked={form.pickupPermission} onChange={(pickupPermission) => setForm({ ...form, pickupPermission })} />
          <Check label={t('people.receivesNotifications')} checked={form.receivesNotifications} onChange={(receivesNotifications) => setForm({ ...form, receivesNotifications })} />
        </div>
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="button" disabled={busy} onClick={() => onSubmit(form)}>{t('common.save')}</Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}
