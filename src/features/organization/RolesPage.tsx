import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { organizationApi } from '@/api/organization'
import { queryKeys } from '@/api/queryKeys'
import type { RoleView } from '@/api/types'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Check, Field, SelectField } from '@/components/ui/Field'
import { Cell, DataTable } from '@/components/ui/DataTable'
import { FormActions, FormStack } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner, QueryError } from '@/components/ui/Spinner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Toolbar } from '@/components/ui/Toolbar'
import { useToast } from '@/components/ui/Toast'

export function RolesPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const auth = useAuth()
  const client = useQueryClient()
  const canWrite = auth.hasPermission('ROLE_WRITE')
  const [query, setQuery] = useState('')
  const [modal, setModal] = useState<null | { mode: 'create' | 'edit'; role?: RoleView }>(null)

  const roles = useQuery({ queryKey: queryKeys.roles, queryFn: organizationApi.roles })
  const permissions = useQuery({ queryKey: queryKeys.permissions, queryFn: organizationApi.permissions })

  const mutation = useMutation({
    mutationFn: async (input: { id?: string; code: string; name: string; description: string; permissions: string[]; status: string }) => {
      if (input.id) {
        return organizationApi.updateRole(input.id, {
          name: input.name,
          description: input.description || null,
          permissions: input.permissions,
          status: input.status,
        })
      }
      return organizationApi.createRole({
        code: input.code,
        name: input.name,
        description: input.description || null,
        permissions: input.permissions,
      })
    },
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setModal(null)
      await client.invalidateQueries({ queryKey: queryKeys.roles })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })

  const rows = useMemo(
    () => (roles.data ?? []).filter((item) => `${item.name} ${item.code}`.toLowerCase().includes(query.toLowerCase())),
    [roles.data, query],
  )

  if (roles.isLoading || permissions.isLoading) return <PageSpinner label={t('common.loading')} />
  if (roles.error) return <QueryError message={roles.error.message} onRetry={() => void roles.refetch()} />

  return (
    <div className="space-y-5">
      <Toolbar query={query} onQuery={setQuery}>
        {canWrite && (
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setModal({ mode: 'create' })}>
            {t('roles.add')}
          </Button>
        )}
      </Toolbar>
      <DataTable
        rows={rows}
        columns={[
          { key: 'name', header: t('common.name'), render: (row) => <Cell title={row.name} detail={row.description || t('common.dash')} /> },
          { key: 'code', header: t('common.code'), render: (row) => <span dir="ltr">{row.code}</span> },
          { key: 'permissions', header: t('roles.permissions'), render: (row) => t('roles.permissionCount', { count: row.permissions.length }) },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
          ...(canWrite
            ? [{
                key: 'actions',
                header: t('common.actions'),
                render: (row: RoleView) => (
                  <Button variant="ghost" disabled={row.systemRole} onClick={() => setModal({ mode: 'edit', role: row })}>
                    {t('common.edit')}
                  </Button>
                ),
              }]
            : []),
        ]}
      />
      {modal && (
        <RoleForm
          mode={modal.mode}
          role={modal.role}
          permissionOptions={permissions.data ?? []}
          busy={mutation.isPending}
          onClose={() => setModal(null)}
          onSubmit={(values) => mutation.mutate({ ...values, id: modal.role?.id })}
        />
      )}
    </div>
  )
}

function RoleForm({
  mode,
  role,
  permissionOptions,
  busy,
  onClose,
  onSubmit,
}: {
  mode: 'create' | 'edit'
  role?: RoleView
  permissionOptions: Array<{ code: string; description: string; module: string }>
  busy: boolean
  onClose: () => void
  onSubmit: (values: { code: string; name: string; description: string; permissions: string[]; status: string }) => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    code: role?.code ?? '',
    name: role?.name ?? '',
    description: role?.description ?? '',
    permissions: role?.permissions ?? [],
    status: role?.status ?? 'ACTIVE',
  })
  return (
    <Modal title={mode === 'edit' ? t('roles.edit') : t('roles.add')} onClose={onClose} wide>
      <FormStack>
        <Field label={t('common.code')} value={form.code} onChange={(code) => setForm({ ...form, code })} disabled={mode === 'edit'} />
        <Field label={t('common.name')} value={form.name} onChange={(name) => setForm({ ...form, name })} />
        <Field label={t('common.description')} value={form.description} onChange={(description) => setForm({ ...form, description })} required={false} />
        {mode === 'edit' && (
          <SelectField
            label={t('common.status')}
            value={form.status}
            onChange={(status) => setForm({ ...form, status })}
            options={[['ACTIVE', t('status.ACTIVE')], ['INACTIVE', t('status.INACTIVE')]]}
          />
        )}
        <fieldset className="space-y-2">
          <legend className="text-sm font-medium">{t('roles.permissions')}</legend>
          <div className="grid sm:grid-cols-2 gap-2 max-h-64 overflow-y-auto border border-neutral-100 rounded-lg p-3">
            {permissionOptions.map((item) => (
              <Check
                key={item.code}
                label={`${item.code} — ${item.description}`}
                checked={form.permissions.includes(item.code)}
                onChange={(checked) =>
                  setForm({
                    ...form,
                    permissions: checked ? [...form.permissions, item.code] : form.permissions.filter((code) => code !== item.code),
                  })
                }
              />
            ))}
          </div>
        </fieldset>
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="button" disabled={busy} onClick={() => onSubmit(form)}>{t('common.save')}</Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}
