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
import { sanitizePerson } from './StudentsPage'

export function InstructorsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const auth = useAuth()
  const client = useQueryClient()
  const canWrite = auth.hasPermission('PEOPLE_WRITE')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const people = useQuery({ queryKey: queryKeys.people, queryFn: peopleApi.list })
  const mutation = useMutation({
    mutationFn: peopleApi.createInstructor,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setOpen(false)
      await client.invalidateQueries({ queryKey: queryKeys.people })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const rows = useMemo(
    () => (people.data?.instructors ?? []).filter((item) => `${personName(item.person)} ${item.code}`.toLowerCase().includes(query.toLowerCase())),
    [people.data, query],
  )
  if (people.isLoading) return <PageSpinner label={t('common.loading')} />
  if (people.error) return <QueryError message={people.error.message} onRetry={() => void people.refetch()} />

  return (
    <div className="space-y-5">
      <Toolbar query={query} onQuery={setQuery}>
        {canWrite && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>{t('people.addInstructor')}</Button>}
      </Toolbar>
      <DataTable
        rows={rows}
        columns={[
          { key: 'name', header: t('common.name'), render: (row) => <Cell title={personName(row.person)} detail={row.specialization || t('common.dash')} /> },
          { key: 'code', header: t('common.code'), render: (row) => <span dir="ltr">{row.code}</span> },
          { key: 'title', header: t('people.title'), render: (row) => row.title || t('common.dash') },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
        ]}
      />
      {open && <InstructorForm busy={mutation.isPending} onClose={() => setOpen(false)} onSubmit={(body) => mutation.mutate(body)} />}
    </div>
  )
}

function InstructorForm({
  busy,
  onClose,
  onSubmit,
}: {
  busy: boolean
  onClose: () => void
  onSubmit: (body: { code: string; title: string | null; specialization: string | null; person: ReturnType<typeof sanitizePerson> }) => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ code: '', title: '', specialization: '', person: emptyPerson })
  return (
    <Modal title={t('people.addInstructor')} onClose={onClose}>
      <FormStack>
        <Field label={t('common.code')} value={form.code} onChange={(code) => setForm({ ...form, code })} />
        <Field label={t('people.title')} value={form.title} onChange={(title) => setForm({ ...form, title })} required={false} />
        <Field label={t('people.specialization')} value={form.specialization} onChange={(specialization) => setForm({ ...form, specialization })} required={false} />
        <PersonFields person={form.person} onChange={(person) => setForm({ ...form, person })} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() =>
              onSubmit({
                code: form.code,
                title: emptyToNull(form.title),
                specialization: emptyToNull(form.specialization),
                person: sanitizePerson(form.person),
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
