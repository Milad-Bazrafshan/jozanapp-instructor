import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { organizationApi } from '@/api/organization'
import { queryKeys } from '@/api/queryKeys'
import type { OrgUserView } from '@/api/types'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Cell, DataTable } from '@/components/ui/DataTable'
import { Field, SelectField } from '@/components/ui/Field'
import { FormActions, FormGrid, FormStack } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner, QueryError } from '@/components/ui/Spinner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Toolbar } from '@/components/ui/Toolbar'
import { useToast } from '@/components/ui/Toast'
import { emptyToNull } from '@/lib/format'

export function UsersPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const auth = useAuth()
  const client = useQueryClient()
  const canWrite = auth.hasPermission('USER_WRITE')
  const [query, setQuery] = useState('')
  const [filter, setFilter] = useState('all')
  const [createOpen, setCreateOpen] = useState(false)
  const [statusUser, setStatusUser] = useState<OrgUserView | null>(null)
  const [grantUser, setGrantUser] = useState<OrgUserView | null>(null)

  const users = useQuery({ queryKey: queryKeys.users, queryFn: organizationApi.users })
  const roles = useQuery({ queryKey: queryKeys.roles, queryFn: organizationApi.roles })
  const branches = useQuery({ queryKey: queryKeys.branches, queryFn: organizationApi.branches })

  const invalidate = () => client.invalidateQueries({ queryKey: queryKeys.users })

  const createMutation = useMutation({
    mutationFn: organizationApi.createUser,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setCreateOpen(false)
      await invalidate()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const statusMutation = useMutation({
    mutationFn: ({ id, membershipStatus, accountStatus }: { id: string; membershipStatus: string; accountStatus: string }) =>
      organizationApi.changeUserStatus(id, { membershipStatus, accountStatus }),
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setStatusUser(null)
      await invalidate()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const grantMutation = useMutation({
    mutationFn: ({ id, roleId, scopeType, scopeId }: { id: string; roleId: string; scopeType: 'TENANT' | 'BRANCH'; scopeId: string | null }) =>
      organizationApi.addGrant(id, { roleId, scopeType, scopeId }),
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setGrantUser(null)
      await invalidate()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })

  const rows = useMemo(
    () =>
      (users.data ?? []).filter((item) => {
        const text = `${item.firstName} ${item.lastName} ${item.email}`.toLowerCase()
        return text.includes(query.toLowerCase()) && (filter === 'all' || item.membershipStatus === filter)
      }),
    [users.data, query, filter],
  )

  if (users.isLoading) return <PageSpinner label={t('common.loading')} />
  if (users.error) return <QueryError message={users.error.message} onRetry={() => void users.refetch()} />

  return (
    <div className="space-y-5">
      <Toolbar query={query} onQuery={setQuery}>
        <div className="flex gap-1 bg-white border border-neutral-200 rounded-lg p-0.5">
          {['all', 'ACTIVE', 'SUSPENDED', 'INACTIVE'].map((id) => (
            <button
              key={id}
              type="button"
              onClick={() => setFilter(id)}
              className={`px-3 py-1.5 rounded-md text-sm font-medium ${filter === id ? 'bg-neutral-900 text-white' : 'text-neutral-500'}`}
            >
              {id === 'all' ? t('common.all') : t(`status.${id}`, { defaultValue: id })}
            </button>
          ))}
        </div>
        {canWrite && (
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setCreateOpen(true)}>
            {t('users.add')}
          </Button>
        )}
      </Toolbar>
      <DataTable
        rows={rows.map((item) => ({ ...item, id: item.membershipId }))}
        columns={[
          { key: 'name', header: t('common.name'), render: (row) => <Cell title={`${row.firstName} ${row.lastName}`} detail={row.mobile || t('common.dash')} /> },
          { key: 'email', header: t('common.email'), render: (row) => <span dir="ltr">{row.email}</span> },
          { key: 'grants', header: t('users.grants'), render: (row) => row.grants.map((grant) => grant.roleName).join(', ') || t('common.dash') },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.membershipStatus} /> },
          ...(canWrite
            ? [{
                key: 'actions',
                header: t('common.actions'),
                render: (row: OrgUserView & { id: string }) => (
                  <div className="flex flex-wrap gap-1">
                    <Button variant="ghost" onClick={() => setStatusUser(row)}>{t('users.changeStatus')}</Button>
                    <Button variant="ghost" onClick={() => setGrantUser(row)}>{t('users.addGrant')}</Button>
                  </div>
                ),
              }]
            : []),
        ]}
      />
      {createOpen && (
        <UserCreateForm
          roles={roles.data ?? []}
          branches={branches.data ?? []}
          busy={createMutation.isPending}
          onClose={() => setCreateOpen(false)}
          onSubmit={(body) => createMutation.mutate(body)}
        />
      )}
      {statusUser && (
        <StatusForm
          user={statusUser}
          busy={statusMutation.isPending}
          onClose={() => setStatusUser(null)}
          onSubmit={(body) => statusMutation.mutate({ id: statusUser.membershipId, ...body })}
        />
      )}
      {grantUser && (
        <GrantForm
          roles={roles.data ?? []}
          branches={branches.data ?? []}
          busy={grantMutation.isPending}
          onClose={() => setGrantUser(null)}
          onSubmit={(body) => grantMutation.mutate({ id: grantUser.membershipId, ...body })}
        />
      )}
    </div>
  )
}

function UserCreateForm({
  roles,
  branches,
  busy,
  onClose,
  onSubmit,
}: {
  roles: Array<{ id: string; name: string }>
  branches: Array<{ id: string; name: string }>
  busy: boolean
  onClose: () => void
  onSubmit: (body: {
    email: string
    initialPassword?: string | null
    firstName: string
    lastName: string
    nationalId?: string | null
    mobile?: string | null
    roleId: string
    scopeType: 'TENANT' | 'BRANCH'
    scopeId?: string | null
  }) => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    initialPassword: '',
    nationalId: '',
    mobile: '',
    roleId: roles[0]?.id ?? '',
    scopeType: 'TENANT' as 'TENANT' | 'BRANCH',
    scopeId: branches[0]?.id ?? '',
  })
  return (
    <Modal title={t('users.add')} onClose={onClose}>
      <FormStack>
        <FormGrid>
          <Field label={t('users.firstName')} value={form.firstName} onChange={(firstName) => setForm({ ...form, firstName })} />
          <Field label={t('users.lastName')} value={form.lastName} onChange={(lastName) => setForm({ ...form, lastName })} />
        </FormGrid>
        <Field label={t('common.email')} type="email" value={form.email} onChange={(email) => setForm({ ...form, email })} />
        <Field label={t('users.initialPassword')} type="password" value={form.initialPassword} onChange={(initialPassword) => setForm({ ...form, initialPassword })} minLength={10} />
        <Field label={t('users.nationalId')} value={form.nationalId} onChange={(nationalId) => setForm({ ...form, nationalId })} required={false} />
        <Field label={t('users.mobile')} value={form.mobile} onChange={(mobile) => setForm({ ...form, mobile })} required={false} />
        <SelectField label={t('users.role')} value={form.roleId} onChange={(roleId) => setForm({ ...form, roleId })} options={roles.map((role) => [role.id, role.name])} />
        <SelectField
          label={t('users.scope')}
          value={form.scopeType}
          onChange={(scopeType) => setForm({ ...form, scopeType: scopeType as 'TENANT' | 'BRANCH' })}
          options={[['TENANT', t('users.tenant')], ['BRANCH', t('users.branch')]]}
        />
        {form.scopeType === 'BRANCH' && (
          <SelectField label={t('classes.branch')} value={form.scopeId} onChange={(scopeId) => setForm({ ...form, scopeId })} options={branches.map((item) => [item.id, item.name])} />
        )}
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() =>
              onSubmit({
                ...form,
                nationalId: emptyToNull(form.nationalId),
                mobile: emptyToNull(form.mobile),
                initialPassword: emptyToNull(form.initialPassword),
                scopeId: form.scopeType === 'BRANCH' ? form.scopeId : null,
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

function StatusForm({
  user,
  busy,
  onClose,
  onSubmit,
}: {
  user: OrgUserView
  busy: boolean
  onClose: () => void
  onSubmit: (body: { membershipStatus: string; accountStatus: string }) => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ membershipStatus: user.membershipStatus, accountStatus: user.accountStatus })
  const options = [
    ['ACTIVE', t('status.ACTIVE')],
    ['SUSPENDED', t('status.SUSPENDED')],
    ['INACTIVE', t('status.INACTIVE')],
  ]
  return (
    <Modal title={t('users.changeStatus')} onClose={onClose}>
      <FormStack>
        <SelectField label={t('users.membershipStatus')} value={form.membershipStatus} onChange={(membershipStatus) => setForm({ ...form, membershipStatus })} options={options} />
        <SelectField label={t('users.accountStatus')} value={form.accountStatus} onChange={(accountStatus) => setForm({ ...form, accountStatus })} options={options} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="button" disabled={busy} onClick={() => onSubmit(form)}>{t('common.save')}</Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}

function GrantForm({
  roles,
  branches,
  busy,
  onClose,
  onSubmit,
}: {
  roles: Array<{ id: string; name: string }>
  branches: Array<{ id: string; name: string }>
  busy: boolean
  onClose: () => void
  onSubmit: (body: { roleId: string; scopeType: 'TENANT' | 'BRANCH'; scopeId: string | null }) => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState({
    roleId: roles[0]?.id ?? '',
    scopeType: 'TENANT' as 'TENANT' | 'BRANCH',
    scopeId: branches[0]?.id ?? '',
  })
  return (
    <Modal title={t('users.addGrant')} onClose={onClose}>
      <FormStack>
        <SelectField label={t('users.role')} value={form.roleId} onChange={(roleId) => setForm({ ...form, roleId })} options={roles.map((role) => [role.id, role.name])} />
        <SelectField
          label={t('users.scope')}
          value={form.scopeType}
          onChange={(scopeType) => setForm({ ...form, scopeType: scopeType as 'TENANT' | 'BRANCH' })}
          options={[['TENANT', t('users.tenant')], ['BRANCH', t('users.branch')]]}
        />
        {form.scopeType === 'BRANCH' && (
          <SelectField label={t('classes.branch')} value={form.scopeId} onChange={(scopeId) => setForm({ ...form, scopeId })} options={branches.map((item) => [item.id, item.name])} />
        )}
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="button" disabled={busy} onClick={() => onSubmit({ ...form, scopeId: form.scopeType === 'BRANCH' ? form.scopeId : null })}>
            {t('common.save')}
          </Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}
