import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { peopleApi } from '@/api/people'
import { queryKeys } from '@/api/queryKeys'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Cell, DataTable } from '@/components/ui/DataTable'
import { Field } from '@/components/ui/Field'
import { FormActions, FormStack } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner, QueryError } from '@/components/ui/Spinner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Toolbar } from '@/components/ui/Toolbar'
import { useToast } from '@/components/ui/Toast'
import { emptyToNull, personName } from '@/lib/format'
import { emptyPerson, PersonFields } from './PersonFields'

export function StudentsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const auth = useAuth()
  const client = useQueryClient()
  const canWrite = auth.hasPermission('PEOPLE_WRITE')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const people = useQuery({ queryKey: queryKeys.people, queryFn: peopleApi.list })
  const mutation = useMutation({
    mutationFn: peopleApi.createStudent,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setOpen(false)
      await client.invalidateQueries({ queryKey: queryKeys.people })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const rows = useMemo(
    () =>
      (people.data?.students ?? []).filter((item) =>
        `${personName(item.person)} ${item.code}`.toLowerCase().includes(query.toLowerCase()),
      ),
    [people.data, query],
  )
  if (people.isLoading) return <PageSpinner label={t('common.loading')} />
  if (people.error) return <QueryError message={people.error.message} onRetry={() => void people.refetch()} />

  return (
    <div className="space-y-5">
      <Toolbar query={query} onQuery={setQuery}>
        {canWrite && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>{t('people.addStudent')}</Button>}
      </Toolbar>
      <DataTable
        rows={rows}
        columns={[
          { key: 'name', header: t('common.name'), render: (row) => <Cell title={personName(row.person)} detail={row.person.mobile || t('common.dash')} /> },
          { key: 'code', header: t('common.code'), render: (row) => <span dir="ltr">{row.code}</span> },
          { key: 'admission', header: t('people.admissionDate'), render: (row) => row.admissionDate || t('common.dash') },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
        ]}
      />
      {open && <StudentForm busy={mutation.isPending} onClose={() => setOpen(false)} onSubmit={(body) => mutation.mutate(body)} />}
    </div>
  )
}

function StudentForm({
  busy,
  onClose,
  onSubmit,
}: {
  busy: boolean
  onClose: () => void
  onSubmit: (body: { code: string; admissionDate: string | null; person: ReturnType<typeof sanitizePerson> }) => void
}) {
  const { t } = useTranslation()
  const [code, setCode] = useState('')
  const [admissionDate, setAdmissionDate] = useState('')
  const [person, setPerson] = useState(emptyPerson)
  return (
    <Modal title={t('people.addStudent')} onClose={onClose}>
      <FormStack>
        <Field label={t('common.code')} value={code} onChange={setCode} />
        <Field label={t('people.admissionDate')} type="date" value={admissionDate} onChange={setAdmissionDate} required={false} />
        <PersonFields person={person} onChange={setPerson} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="button" disabled={busy} onClick={() => onSubmit({ code, admissionDate: emptyToNull(admissionDate), person: sanitizePerson(person) })}>
            {t('common.save')}
          </Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}

export function sanitizePerson(person: typeof emptyPerson) {
  return {
    firstName: person.firstName,
    lastName: person.lastName,
    nationalId: emptyToNull(person.nationalId),
    mobile: emptyToNull(person.mobile),
    email: emptyToNull(person.email),
    initialPassword: emptyToNull(person.initialPassword),
  }
}
