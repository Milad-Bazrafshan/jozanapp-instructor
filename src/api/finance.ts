import { api, jsonBody } from './client'
import type {
  BalanceView,
  ChargeView,
  FinanceOverview,
  FinanceStatement,
  InvoiceView,
  PaymentView,
} from './types'

export type ChargeInput = {
  studentId: string
  classSectionId?: string | null
  enrollmentId?: string | null
  type: string
  title: string
  amount: number
  discount?: number
  dueOn: string
  notes?: string | null
  code?: string | null
}

export type PlanInput = {
  studentId: string
  classSectionId?: string | null
  enrollmentId?: string | null
  type: string
  title: string
  amount: number
  discount?: number
  firstDueOn: string
  installmentCount: number
  intervalDays: number
  notes?: string | null
}

export type InvoiceInput = {
  studentId: string
  dueOn: string
  notes?: string | null
  chargeIds: string[]
  code?: string | null
}

export type AllocationInput = {
  chargeId: string
  amount: number
}

export type PaymentInput = {
  studentId: string
  amount: number
  method: string
  provider?: string | null
  externalReference?: string | null
  notes?: string | null
  receiptNumber?: string | null
  allocations?: AllocationInput[]
}

export const financeApi = {
  overview: () => api<FinanceOverview>('/api/v1/finance/overview'),
  charges: () => api<ChargeView[]>('/api/v1/finance/charges'),
  createCharge: (body: ChargeInput) => api<ChargeView>('/api/v1/finance/charges', { method: 'POST', body: jsonBody(body) }),
  createPlan: (body: PlanInput) => api<ChargeView[]>('/api/v1/finance/charges/plans', { method: 'POST', body: jsonBody(body) }),
  voidCharge: (id: string) => api<ChargeView>(`/api/v1/finance/charges/${id}/void`, { method: 'POST' }),
  invoices: () => api<InvoiceView[]>('/api/v1/finance/invoices'),
  createInvoice: (body: InvoiceInput) => api<InvoiceView>('/api/v1/finance/invoices', { method: 'POST', body: jsonBody(body) }),
  issueInvoice: (id: string) => api<InvoiceView>(`/api/v1/finance/invoices/${id}/issue`, { method: 'POST' }),
  voidInvoice: (id: string) => api<InvoiceView>(`/api/v1/finance/invoices/${id}/void`, { method: 'POST' }),
  payments: () => api<PaymentView[]>('/api/v1/finance/payments'),
  createPayment: (body: PaymentInput) => api<PaymentView>('/api/v1/finance/payments', { method: 'POST', body: jsonBody(body) }),
  allocate: (id: string, allocations: AllocationInput[]) =>
    api<PaymentView>(`/api/v1/finance/payments/${id}/allocations`, { method: 'POST', body: jsonBody({ allocations }) }),
  balances: () => api<BalanceView[]>('/api/v1/finance/balances'),
  statement: (studentId: string) => api<FinanceStatement>(`/api/v1/finance/students/${studentId}/statement`),
}
