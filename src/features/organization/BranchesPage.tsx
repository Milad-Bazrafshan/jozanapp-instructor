import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { organizationApi } from '@/api/organization'
import { queryKeys } from '@/api/queryKeys'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Cell, DataTable } from '@/components/ui/DataTable'
import { Field } from '@/components/ui/Field'
import { FormActions, FormStack } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { SelectField } from '@/components/ui/Field'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PageSpinner, QueryError } from '@/components/ui/Spinner'
import { Toolbar } from '@/components/ui/Toolbar'
import { useToast } from '@/components/ui/Toast'
import { emptyToNull } from '@/lib/format'
import type { BranchView } from '@/api/types'

export function BranchesPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const auth = useAuth()
  const client = useQueryClient()
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [modal, setModal] = useState<null | { mode: 'create' | 'edit'; branch?: BranchView }>(null)
  const canWrite = auth.hasPermission('BRANCH_WRITE')

  const list = useQuery({ queryKey: queryKeys.branches, queryFn: organizationApi.branches })
  const mutation = useMutation({
    mutationFn: async (input: { id?: string; code: string; name: string; phone: string; address: string; status: string }) => {
      if (input.id) {
        return organizationApi.updateBranch(input.id, {
          name: input.name,
          phone: emptyToNull(input.phone),
          address: emptyToNull(input.address),
          status: input.status,
        })
      }
      return organizationApi.createBranch({
        code: input.code,
        name: input.name,
        phone: emptyToNull(input.phone),
        address: emptyToNull(input.address),
      })
    },
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setModal(null)
      await client.invalidateQueries({ queryKey: queryKeys.branches })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })

  const rows = useMemo(() => {
    return (list.data ?? []).filter((item) => {
      const text = `${item.name} ${item.code} ${item.phone ?? ''}`.toLowerCase()
      const matchesQuery = text.includes(query.toLowerCase())
      const matchesFilter = filter === 'all' || item.status === filter
      return matchesQuery && matchesFilter
    })
  }, [list.data, query, filter])

  if (list.isLoading) return <PageSpinner label={t('common.loading')} />
  if (list.error) return <QueryError message={list.error.message} onRetry={() => void list.refetch()} />

  return (
    <div className="space-y-5">
      <Toolbar query={query} onQuery={setQuery}>
        <div className="flex gap-1 bg-white border border-neutral-200 rounded-lg p-0.5">
          {['all', 'ACTIVE', 'INACTIVE'].map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${filter === id ? 'bg-neutral-900 text-white' : 'text-neutral-500'}`}
            >
              {id === 'all' ? t('common.all') : t(`status.${id}`)}
            </button>
          ))}
        </div>
        {canWrite && (
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setModal({ mode: 'create' })}>
            {t('branches.add')}
          </Button>
        )}
      </Toolbar>
      <DataTable
        rows={rows}
        empty={query ? t('common.emptyFiltered') : t('common.empty')}
        columns={[
          { key: 'name', header: t('common.name'), render: (row) => <Cell title={row.name} detail={row.address || t('common.dash')} /> },
          { key: 'code', header: t('common.code'), render: (row) => <span dir="ltr">{row.code}</span> },
          { key: 'phone', header: t('common.phone'), render: (row) => <span dir="ltr">{row.phone || t('common.dash')}</span> },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
          ...(canWrite
            ? [{
                key: 'actions',
                header: t('common.actions'),
                render: (row: BranchView) => (
                  <Button variant="ghost" onClick={() => setModal({ mode: 'edit', branch: row })}>
                    {t('common.edit')}
                  </Button>
                ),
              }]
            : []),
        ]}
      />
      {modal && (
        <BranchForm
          mode={modal.mode}
          branch={modal.branch}
          busy={mutation.isPending}
          onClose={() => setModal(null)}
          onSubmit={(values) => mutation.mutate({ ...values, id: modal.branch?.id })}
        />
      )}
    </div>
  )
}

function BranchForm({
  mode,
  branch,
  busy,
  onClose,
  onSubmit,
}: {
  mode: 'create' | 'edit'
  branch?: BranchView
  busy: boolean
  onClose: () => void
  onSubmit: (values: { code: string; name: string; phone: string; address: string; status: string }) => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    code: branch?.code ?? '',
    name: branch?.name ?? '',
    phone: branch?.phone ?? '',
    address: branch?.address ?? '',
    status: branch?.status ?? 'ACTIVE',
  })
  return (
    <Modal title={mode === 'edit' ? t('branches.edit') : t('branches.add')} onClose={onClose}>
      <FormStack>
        <Field label={t('common.code')} value={form.code} onChange={(code) => setForm({ ...form, code })} disabled={mode === 'edit'} />
        <Field label={t('common.name')} value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <Field label={t('common.phone')} value={form.phone} onChange={(phone) => setForm({ ...form, phone })} required={false} />
        <Field label={t('common.address')} value={form.address} onChange={(address) => setForm({ ...form, address })} required={false} />
        {mode === 'edit' && (
          <SelectField
            label={t('common.status')}
            value={form.status}
            onChange={(status) => setForm({ ...form, status })}
            options={[['ACTIVE', t('status.ACTIVE')], ['INACTIVE', t('status.INACTIVE')]]}
          />
        )}
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="button" disabled={busy} onClick={() => onSubmit(form)}>{t('common.save')}</Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}
