import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus, Wallet } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { classroomApi } from '@/api/classroom'
import { financeApi } from '@/api/finance'
import { peopleApi } from '@/api/people'
import { queryKeys } from '@/api/queryKeys'
import type { BalanceView, ChargeView, PaymentView } from '@/api/types'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { ConfirmDialog } from '@/components/ui/ConfirmDialog'
import { Cell, DataTable } from '@/components/ui/DataTable'
import { Check, Field, SelectField } from '@/components/ui/Field'
import { FormActions, FormGrid, FormStack } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner, QueryError } from '@/components/ui/Spinner'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { FilterPills, Toolbar } from '@/components/ui/Toolbar'
import { useToast } from '@/components/ui/Toast'
import { emptyToNull, formatDay, formatMoney, personName, todayIso, useLocale } from '@/lib/format'

const CHARGE_TYPES = ['TUITION', 'ENROLLMENT_FEE', 'MATERIAL', 'OTHER'] as const
const PAYMENT_METHODS = ['CASH', 'CARD', 'BANK_TRANSFER', 'OTHER'] as const

function money(value: number, locale: string) {
  return formatMoney(value, locale)
}

function studentOptions(students: Array<{ id: string; code: string; person: { firstName: string; lastName: string } }>) {
  return students.map((student) => [student.id, `${personName(student.person)} (${student.code})`] as [string, string])
}

function useFinanceInvalidation() {
  const client = useQueryClient()
  return () => client.invalidateQueries({ queryKey: queryKeys.finance })
}

export function FinanceBalancesPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const [query, setQuery] = useState('')
  const [selected, setSelected] = useState<BalanceView | null>(null)
  const overview = useQuery({ queryKey: queryKeys.finance, queryFn: financeApi.overview })
  const statement = useQuery({
    queryKey: queryKeys.financeStatement(selected?.studentId ?? ''),
    queryFn: () => financeApi.statement(selected!.studentId),
    enabled: Boolean(selected),
  })
  if (overview.isLoading) return <PageSpinner label={t('common.loading')} />
  if (overview.error) return <QueryError message={overview.error.message} onRetry={() => void overview.refetch()} />
  const rows = (overview.data?.balances ?? [])
    .filter((item) => `${item.studentName} ${item.studentCode}`.toLowerCase().includes(query.toLowerCase()))
    .map((item) => ({ ...item, id: item.studentId }))
  return (
    <div className="space-y-5">
      <section className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={Wallet} label={t('finance.outstanding')} value={money(overview.data?.outstanding ?? 0, locale)} />
        <StatCard icon={Wallet} label={t('finance.collected')} value={money(overview.data?.collected ?? 0, locale)} />
        <StatCard icon={Wallet} label={t('finance.overdueCount')} value={overview.data?.overdueCount ?? 0} />
      </section>
      <Toolbar query={query} onQuery={setQuery} />
      <DataTable
        rows={rows}
        columns={[
          { key: 'student', header: t('finance.student'), render: (row) => <Cell title={row.studentName} detail={row.studentCode} /> },
          { key: 'charged', header: t('finance.charged'), render: (row) => money(row.charged, locale) },
          { key: 'paid', header: t('finance.paid'), render: (row) => money(row.paid, locale) },
          { key: 'outstanding', header: t('finance.outstanding'), render: (row) => money(row.outstanding, locale) },
          { key: 'overdue', header: t('finance.overdue'), render: (row) => money(row.overdue, locale) },
          {
            key: 'actions',
            header: t('common.actions'),
            render: (row) => (
              <Button variant="ghost" onClick={() => setSelected(row)}>
                {t('common.details')}
              </Button>
            ),
          },
        ]}
      />
      {selected && (
        <Modal wide title={selected.studentName} eyebrow={selected.studentCode} onClose={() => setSelected(null)}>
          {statement.isLoading ? <PageSpinner label={t('common.loading')} /> : null}
          {statement.error ? <QueryError message={statement.error.message} /> : null}
          {statement.data && (
            <div className="space-y-4">
              <p className="text-sm text-neutral-600">
                {t('finance.outstanding')}: {money(statement.data.balance.outstanding, locale)}
              </p>
              <ul className="space-y-2">
                {statement.data.charges.map((charge) => (
                  <li key={charge.id} className="flex items-center justify-between gap-3 text-sm">
                    <span>
                      {charge.title} · {formatDay(charge.dueOn, locale)}
                    </span>
                    <span className="flex items-center gap-2">
                      {money(charge.remaining, locale)}
                      <StatusBadge value={charge.status} />
                    </span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </Modal>
      )}
    </div>
  )
}

export function FinanceChargesPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const toast = useToast()
  const auth = useAuth()
  const canWrite = auth.hasPermission('FINANCE_WRITE')
  const invalidate = useFinanceInvalidation()
  const [query, setQuery] = useState('')
  const [status, setStatus] = useState('ALL')
  const [open, setOpen] = useState(false)
  const [planOpen, setPlanOpen] = useState(false)
  const [voidItem, setVoidItem] = useState<ChargeView | null>(null)
  const charges = useQuery({ queryKey: [...queryKeys.finance, 'charges'], queryFn: financeApi.charges })
  const people = useQuery({ queryKey: queryKeys.people, queryFn: peopleApi.list, enabled: open || planOpen })
  const classroom = useQuery({ queryKey: queryKeys.classroom, queryFn: classroomApi.list, enabled: open || planOpen })
  const createMutation = useMutation({
    mutationFn: financeApi.createCharge,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setOpen(false)
      await invalidate()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const planMutation = useMutation({
    mutationFn: financeApi.createPlan,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setPlanOpen(false)
      await invalidate()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const voidMutation = useMutation({
    mutationFn: (id: string) => financeApi.voidCharge(id),
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setVoidItem(null)
      await invalidate()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const rows = useMemo(
    () =>
      (charges.data ?? []).filter((item) => {
        const match = `${item.studentName} ${item.title} ${item.code}`.toLowerCase().includes(query.toLowerCase())
        return match && (status === 'ALL' || item.status === status)
      }),
    [charges.data, query, status],
  )
  if (charges.isLoading) return <PageSpinner label={t('common.loading')} />
  if (charges.error) return <QueryError message={charges.error.message} onRetry={() => void charges.refetch()} />
  const students = people.data?.students ?? []
  const sections = classroom.data?.sections ?? []
  return (
    <div className="space-y-5">
      <Toolbar query={query} onQuery={setQuery}>
        <FilterPills
          value={status}
          onChange={setStatus}
          options={[
            { id: 'ALL', label: t('common.all') },
            { id: 'OPEN', label: t('status.OPEN') },
            { id: 'PARTIALLY_PAID', label: t('status.PARTIALLY_PAID') },
            { id: 'PAID', label: t('status.PAID') },
          ]}
        />
        {canWrite && (
          <>
            <Button variant="secondary" onClick={() => setPlanOpen(true)}>
              {t('finance.addPlan')}
            </Button>
            <Button icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>
              {t('finance.addCharge')}
            </Button>
          </>
        )}
      </Toolbar>
      <DataTable
        rows={rows}
        columns={[
          { key: 'student', header: t('finance.student'), render: (row) => <Cell title={row.studentName} detail={row.studentCode} /> },
          { key: 'title', header: t('finance.titleField'), render: (row) => <Cell title={row.title} detail={row.code} /> },
          { key: 'type', header: t('common.type'), render: (row) => t(`enums.${row.type}`, { defaultValue: row.type }) },
          { key: 'due', header: t('finance.dueOn'), render: (row) => formatDay(row.dueOn, locale) },
          { key: 'net', header: t('finance.net'), render: (row) => money(row.netAmount, locale) },
          { key: 'remaining', header: t('finance.remaining'), render: (row) => money(row.remaining, locale) },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
          {
            key: 'actions',
            header: t('common.actions'),
            render: (row) =>
              canWrite && row.status === 'OPEN' ? (
                <Button variant="ghost" onClick={() => setVoidItem(row)}>
                  {t('finance.void')}
                </Button>
              ) : null,
          },
        ]}
      />
      {open && (
        <ChargeForm
          students={studentOptions(students)}
          sections={sections.map((section) => [section.id, section.name] as [string, string])}
          types={CHARGE_TYPES.map((type) => [type, t(`enums.${type}`)] as [string, string])}
          submitting={createMutation.isPending}
          onClose={() => setOpen(false)}
          onSubmit={(values) => createMutation.mutate(values)}
        />
      )}
      {planOpen && (
        <PlanForm
          students={studentOptions(students)}
          sections={sections.map((section) => [section.id, section.name] as [string, string])}
          types={CHARGE_TYPES.map((type) => [type, t(`enums.${type}`)] as [string, string])}
          submitting={planMutation.isPending}
          onClose={() => setPlanOpen(false)}
          onSubmit={(values) => planMutation.mutate(values)}
        />
      )}
      {voidItem && (
        <ConfirmDialog
          title={t('finance.voidCharge')}
          message={voidItem.title}
          danger
          onClose={() => setVoidItem(null)}
          onConfirm={() => voidMutation.mutate(voidItem.id)}
        />
      )}
    </div>
  )
}

export function FinanceInvoicesPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const toast = useToast()
  const auth = useAuth()
  const canWrite = auth.hasPermission('FINANCE_WRITE')
  const invalidate = useFinanceInvalidation()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const invoices = useQuery({ queryKey: [...queryKeys.finance, 'invoices'], queryFn: financeApi.invoices })
  const charges = useQuery({ queryKey: [...queryKeys.finance, 'charges'], queryFn: financeApi.charges, enabled: open })
  const people = useQuery({ queryKey: queryKeys.people, queryFn: peopleApi.list, enabled: open })
  const createMutation = useMutation({
    mutationFn: financeApi.createInvoice,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setOpen(false)
      await invalidate()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const issueMutation = useMutation({
    mutationFn: financeApi.issueInvoice,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      await invalidate()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const voidMutation = useMutation({
    mutationFn: financeApi.voidInvoice,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      await invalidate()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const rows = useMemo(
    () => (invoices.data ?? []).filter((item) => `${item.studentName} ${item.code}`.toLowerCase().includes(query.toLowerCase())),
    [invoices.data, query],
  )
  if (invoices.isLoading) return <PageSpinner label={t('common.loading')} />
  if (invoices.error) return <QueryError message={invoices.error.message} onRetry={() => void invoices.refetch()} />
  return (
    <div className="space-y-5">
      <Toolbar query={query} onQuery={setQuery}>
        {canWrite && (
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>
            {t('finance.addInvoice')}
          </Button>
        )}
      </Toolbar>
      <DataTable
        rows={rows}
        columns={[
          { key: 'student', header: t('finance.student'), render: (row) => <Cell title={row.studentName} detail={row.code} /> },
          { key: 'due', header: t('finance.dueOn'), render: (row) => formatDay(row.dueOn, locale) },
          { key: 'total', header: t('finance.total'), render: (row) => money(row.total, locale) },
          { key: 'remaining', header: t('finance.remaining'), render: (row) => money(row.remaining, locale) },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
          { key: 'settlement', header: t('finance.settlement'), render: (row) => <StatusBadge value={row.settlementStatus} /> },
          {
            key: 'actions',
            header: t('common.actions'),
            render: (row) =>
              canWrite && row.status === 'DRAFT' ? (
                <div className="flex gap-2">
                  <Button variant="ghost" onClick={() => issueMutation.mutate(row.id)}>
                    {t('finance.issue')}
                  </Button>
                  <Button variant="ghost" onClick={() => voidMutation.mutate(row.id)}>
                    {t('finance.void')}
                  </Button>
                </div>
              ) : null,
          },
        ]}
      />
      {open && (
        <InvoiceForm
          students={studentOptions(people.data?.students ?? [])}
          charges={charges.data ?? []}
          submitting={createMutation.isPending}
          onClose={() => setOpen(false)}
          onSubmit={(values) => createMutation.mutate(values)}
        />
      )}
    </div>
  )
}

export function FinancePaymentsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const toast = useToast()
  const auth = useAuth()
  const canWrite = auth.hasPermission('PAYMENT_WRITE')
  const invalidate = useFinanceInvalidation()
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const [allocateItem, setAllocateItem] = useState<PaymentView | null>(null)
  const payments = useQuery({ queryKey: [...queryKeys.finance, 'payments'], queryFn: financeApi.payments })
  const charges = useQuery({ queryKey: [...queryKeys.finance, 'charges'], queryFn: financeApi.charges, enabled: open || Boolean(allocateItem) })
  const people = useQuery({ queryKey: queryKeys.people, queryFn: peopleApi.list, enabled: open })
  const createMutation = useMutation({
    mutationFn: financeApi.createPayment,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setOpen(false)
      await invalidate()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const allocateMutation = useMutation({
    mutationFn: ({ id, allocations }: { id: string; allocations: Array<{ chargeId: string; amount: number }> }) => financeApi.allocate(id, allocations),
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setAllocateItem(null)
      await invalidate()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const rows = useMemo(
    () => (payments.data ?? []).filter((item) => `${item.studentName} ${item.receiptNumber}`.toLowerCase().includes(query.toLowerCase())),
    [payments.data, query],
  )
  if (payments.isLoading) return <PageSpinner label={t('common.loading')} />
  if (payments.error) return <QueryError message={payments.error.message} onRetry={() => void payments.refetch()} />
  return (
    <div className="space-y-5">
      <Toolbar query={query} onQuery={setQuery}>
        {canWrite && (
          <Button icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>
            {t('finance.addPayment')}
          </Button>
        )}
      </Toolbar>
      <DataTable
        rows={rows}
        columns={[
          { key: 'student', header: t('finance.student'), render: (row) => <Cell title={row.studentName} detail={row.receiptNumber} /> },
          { key: 'method', header: t('finance.method'), render: (row) => t(`enums.${row.method}`, { defaultValue: row.method }) },
          { key: 'amount', header: t('finance.amount'), render: (row) => money(row.amount, locale) },
          { key: 'unallocated', header: t('finance.unallocated'), render: (row) => money(row.unallocated, locale) },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
          {
            key: 'actions',
            header: t('common.actions'),
            render: (row) =>
              canWrite && Number(row.unallocated) > 0 ? (
                <Button variant="ghost" onClick={() => setAllocateItem(row)}>
                  {t('finance.allocate')}
                </Button>
              ) : null,
          },
        ]}
      />
      {open && (
        <PaymentForm
          students={studentOptions(people.data?.students ?? [])}
          charges={charges.data ?? []}
          methods={PAYMENT_METHODS.map((method) => [method, t(`enums.${method}`)] as [string, string])}
          submitting={createMutation.isPending}
          onClose={() => setOpen(false)}
          onSubmit={(values) => createMutation.mutate(values)}
        />
      )}
      {allocateItem && (
        <AllocateForm
          payment={allocateItem}
          charges={(charges.data ?? []).filter((item) => item.studentId === allocateItem.studentId)}
          submitting={allocateMutation.isPending}
          onClose={() => setAllocateItem(null)}
          onSubmit={(allocations) => allocateMutation.mutate({ id: allocateItem.id, allocations })}
        />
      )}
    </div>
  )
}

function ChargeForm({
  students,
  sections,
  types,
  submitting,
  onClose,
  onSubmit,
}: {
  students: Array<[string, string]>
  sections: Array<[string, string]>
  types: Array<[string, string]>
  submitting: boolean
  onClose: () => void
  onSubmit: (values: { studentId: string; classSectionId: string | null; type: string; title: string; amount: number; discount: number; dueOn: string; notes: string | null }) => void
}) {
  const { t } = useTranslation()
  const [studentId, setStudentId] = useState(students[0]?.[0] ?? '')
  const [classSectionId, setClassSectionId] = useState('')
  const [type, setType] = useState('TUITION')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [discount, setDiscount] = useState('0')
  const [dueOn, setDueOn] = useState(todayIso())
  const [notes, setNotes] = useState('')
  return (
    <Modal title={t('finance.addCharge')} onClose={onClose}>
      <FormStack>
        <SelectField label={t('finance.student')} value={studentId} onChange={setStudentId} options={students} />
        <SelectField label={t('finance.class')} value={classSectionId} onChange={setClassSectionId} required={false} options={[['', t('common.none')], ...sections]} />
        <SelectField label={t('common.type')} value={type} onChange={setType} options={types} />
        <Field label={t('finance.titleField')} value={title} onChange={setTitle} />
        <FormGrid>
          <Field label={t('finance.amount')} type="number" min="0" value={amount} onChange={setAmount} />
          <Field label={t('finance.discount')} type="number" min="0" required={false} value={discount} onChange={setDiscount} />
        </FormGrid>
        <Field label={t('finance.dueOn')} type="date" value={dueOn} onChange={setDueOn} />
        <Field label={t('common.description')} required={false} value={notes} onChange={setNotes} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={submitting} onClick={(event) => {
            event.preventDefault()
            onSubmit({
              studentId,
              classSectionId: emptyToNull(classSectionId),
              type,
              title,
              amount: Number(amount),
              discount: Number(discount || '0'),
              dueOn,
              notes: emptyToNull(notes),
            })
          }}>
            {t('common.save')}
          </Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}

function PlanForm({
  students,
  sections,
  types,
  submitting,
  onClose,
  onSubmit,
}: {
  students: Array<[string, string]>
  sections: Array<[string, string]>
  types: Array<[string, string]>
  submitting: boolean
  onClose: () => void
  onSubmit: (values: { studentId: string; classSectionId: string | null; type: string; title: string; amount: number; discount: number; firstDueOn: string; installmentCount: number; intervalDays: number; notes: string | null }) => void
}) {
  const { t } = useTranslation()
  const [studentId, setStudentId] = useState(students[0]?.[0] ?? '')
  const [classSectionId, setClassSectionId] = useState('')
  const [type, setType] = useState('TUITION')
  const [title, setTitle] = useState('')
  const [amount, setAmount] = useState('')
  const [discount, setDiscount] = useState('0')
  const [firstDueOn, setFirstDueOn] = useState(todayIso())
  const [installmentCount, setInstallmentCount] = useState('3')
  const [intervalDays, setIntervalDays] = useState('30')
  const [notes, setNotes] = useState('')
  return (
    <Modal title={t('finance.addPlan')} onClose={onClose}>
      <FormStack>
        <SelectField label={t('finance.student')} value={studentId} onChange={setStudentId} options={students} />
        <SelectField label={t('finance.class')} value={classSectionId} onChange={setClassSectionId} required={false} options={[['', t('common.none')], ...sections]} />
        <SelectField label={t('common.type')} value={type} onChange={setType} options={types} />
        <Field label={t('finance.titleField')} value={title} onChange={setTitle} />
        <FormGrid>
          <Field label={t('finance.amount')} type="number" min="0" value={amount} onChange={setAmount} />
          <Field label={t('finance.discount')} type="number" min="0" required={false} value={discount} onChange={setDiscount} />
        </FormGrid>
        <FormGrid>
          <Field label={t('finance.installments')} type="number" min="2" max="24" value={installmentCount} onChange={setInstallmentCount} />
          <Field label={t('finance.intervalDays')} type="number" min="1" value={intervalDays} onChange={setIntervalDays} />
        </FormGrid>
        <Field label={t('finance.firstDueOn')} type="date" value={firstDueOn} onChange={setFirstDueOn} />
        <Field label={t('common.description')} required={false} value={notes} onChange={setNotes} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={submitting} onClick={(event) => {
            event.preventDefault()
            onSubmit({
              studentId,
              classSectionId: emptyToNull(classSectionId),
              type,
              title,
              amount: Number(amount),
              discount: Number(discount || '0'),
              firstDueOn,
              installmentCount: Number(installmentCount),
              intervalDays: Number(intervalDays),
              notes: emptyToNull(notes),
            })
          }}>
            {t('common.save')}
          </Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}

function InvoiceForm({
  students,
  charges,
  submitting,
  onClose,
  onSubmit,
}: {
  students: Array<[string, string]>
  charges: ChargeView[]
  submitting: boolean
  onClose: () => void
  onSubmit: (values: { studentId: string; dueOn: string; notes: string | null; chargeIds: string[] }) => void
}) {
  const { t } = useTranslation()
  const [studentId, setStudentId] = useState(students[0]?.[0] ?? '')
  const [dueOn, setDueOn] = useState(todayIso())
  const [notes, setNotes] = useState('')
  const [selected, setSelected] = useState<string[]>([])
  const available = charges.filter((item) => item.studentId === studentId && !item.invoiceId && item.status !== 'VOID')
  return (
    <Modal title={t('finance.addInvoice')} onClose={onClose}>
      <FormStack>
        <SelectField label={t('finance.student')} value={studentId} onChange={(value) => { setStudentId(value); setSelected([]) }} options={students} />
        <Field label={t('finance.dueOn')} type="date" value={dueOn} onChange={setDueOn} />
        <div className="space-y-2">
          <p className="text-sm font-medium text-neutral-700">{t('finance.charges')}</p>
          {available.length === 0 ? <p className="text-sm text-neutral-500">{t('finance.noOpenCharges')}</p> : null}
          {available.map((charge) => (
            <Check
              key={charge.id}
              label={`${charge.title} · ${charge.code}`}
              checked={selected.includes(charge.id)}
              onChange={(checked) => setSelected((current) => (checked ? [...current, charge.id] : current.filter((id) => id !== charge.id)))}
            />
          ))}
        </div>
        <Field label={t('common.description')} required={false} value={notes} onChange={setNotes} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={submitting || selected.length === 0} onClick={(event) => {
            event.preventDefault()
            onSubmit({ studentId, dueOn, notes: emptyToNull(notes), chargeIds: selected })
          }}>
            {t('common.save')}
          </Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}

function fifoAllocations(amount: number, charges: ChargeView[]) {
  let remaining = Math.round(amount * 100) / 100
  const items: Array<{ chargeId: string; amount: number }> = []
  const open = [...charges]
    .filter((item) => item.status === 'OPEN' || item.status === 'PARTIALLY_PAID')
    .sort((left, right) => left.dueOn.localeCompare(right.dueOn))
  for (const charge of open) {
    if (remaining <= 0) break
    const take = Math.min(remaining, Number(charge.remaining))
    if (take > 0) {
      items.push({ chargeId: charge.id, amount: Math.round(take * 100) / 100 })
      remaining = Math.round((remaining - take) * 100) / 100
    }
  }
  return items
}

function PaymentForm({
  students,
  charges,
  methods,
  submitting,
  onClose,
  onSubmit,
}: {
  students: Array<[string, string]>
  charges: ChargeView[]
  methods: Array<[string, string]>
  submitting: boolean
  onClose: () => void
  onSubmit: (values: { studentId: string; amount: number; method: string; notes: string | null; allocations: Array<{ chargeId: string; amount: number }> }) => void
}) {
  const { t } = useTranslation()
  const [studentId, setStudentId] = useState(students[0]?.[0] ?? '')
  const [amount, setAmount] = useState('')
  const [method, setMethod] = useState('CASH')
  const [notes, setNotes] = useState('')
  const [autoAllocate, setAutoAllocate] = useState(true)
  return (
    <Modal title={t('finance.addPayment')} onClose={onClose}>
      <FormStack>
        <SelectField label={t('finance.student')} value={studentId} onChange={setStudentId} options={students} />
        <SelectField label={t('finance.method')} value={method} onChange={setMethod} options={methods} />
        <Field label={t('finance.amount')} type="number" min="0" value={amount} onChange={setAmount} />
        <Check label={t('finance.autoAllocate')} checked={autoAllocate} onChange={setAutoAllocate} />
        <Field label={t('common.description')} required={false} value={notes} onChange={setNotes} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>
            {t('common.cancel')}
          </Button>
          <Button type="submit" disabled={submitting} onClick={(event) => {
            event.preventDefault()
            const value = Number(amount)
            onSubmit({
              studentId,
              amount: value,
              method,
              notes: emptyToNull(notes),
              allocations: autoAllocate ? fifoAllocations(value, charges.filter((item) => item.studentId === studentId)) : [],
            })
          }}>
            {t('common.save')}
          </Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}

function AllocateForm({
  payment,
  charges,
  submitting,
  onClose,
  onSubmit,
}: {
  payment: PaymentView
  charges: ChargeView[]
  submitting: boolean
  onClose: () => void
  onSubmit: (allocations: Array<{ chargeId: string; amount: number }>) => void
}) {
  const { t } = useTranslation()
  const allocations = fifoAllocations(Number(payment.unallocated), charges)
  return (
    <Modal title={t('finance.allocate')} onClose={onClose}>
      <p className="text-sm text-neutral-600 mb-4">{t('finance.autoAllocateHint')}</p>
      <ul className="space-y-2 mb-5">
        {allocations.map((item) => {
          const charge = charges.find((row) => row.id === item.chargeId)
          return (
            <li key={item.chargeId} className="flex justify-between text-sm">
              <span>{charge?.title}</span>
              <span>{item.amount}</span>
            </li>
          )
        })}
      </ul>
      <FormActions>
        <Button type="button" variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button disabled={submitting || allocations.length === 0} onClick={() => onSubmit(allocations)}>
          {t('common.save')}
        </Button>
      </FormActions>
    </Modal>
  )
}
