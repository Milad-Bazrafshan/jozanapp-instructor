import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { attendanceApi } from '@/api/attendance'
import { queryKeys } from '@/api/queryKeys'
import type { AttendanceRecordView } from '@/api/types'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Cell, DataTable } from '@/components/ui/DataTable'
import { Field } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner, QueryError } from '@/components/ui/Spinner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Toolbar } from '@/components/ui/Toolbar'
import { useToast } from '@/components/ui/Toast'
import { formatDate, useLocale } from '@/lib/format'

type DraftRow = {
  studentId: string
  studentCode: string
  studentName: string
  status: string
  deliveryMode: string
  lateMinutes: string
  note: string
}

export function AttendancePage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const navigate = useNavigate()
  const auth = useAuth()
  const canWrite = auth.hasPermission('ATTENDANCE_WRITE')
  const [query, setQuery] = useState('')
  const list = useQuery({ queryKey: queryKeys.attendance, queryFn: attendanceApi.list })
  const rows = useMemo(
    () => (list.data ?? []).filter((item) => `${item.className} ${item.courseTitle}`.toLowerCase().includes(query.toLowerCase())),
    [list.data, query],
  )
  if (list.isLoading) return <PageSpinner label={t('common.loading')} />
  if (list.error) return <QueryError message={list.error.message} onRetry={() => void list.refetch()} />
  return (
    <div className="space-y-5">
      <Toolbar query={query} onQuery={setQuery} />
      <DataTable
        rows={rows.map((item) => ({ ...item, id: item.sessionId }))}
        columns={[
          { key: 'class', header: t('enrollments.class'), render: (row) => <Cell title={row.className} detail={row.courseTitle} /> },
          { key: 'date', header: t('common.date'), render: (row) => formatDate(row.plannedStartAt, locale) },
          { key: 'sheet', header: t('attendance.sheetStatus'), render: (row) => t(`status.${row.sheetStatus}`, { defaultValue: row.sheetStatus }) },
          { key: 'marked', header: t('attendance.marked'), render: (row) => `${row.markedCount} / ${row.absentCount}` },
          {
            key: 'actions',
            header: t('common.actions'),
            render: (row) => (
              <Button variant="ghost" onClick={() => navigate(`/attendance/${row.sessionId}`)}>
                {canWrite ? t('attendance.mark') : t('common.view')}
              </Button>
            ),
          },
        ]}
      />
    </div>
  )
}

export function AttendanceSheetPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const toast = useToast()
  const navigate = useNavigate()
  const { sessionId = '' } = useParams()
  const auth = useAuth()
  const canWrite = auth.hasPermission('ATTENDANCE_WRITE')
  const client = useQueryClient()
  const [rows, setRows] = useState<DraftRow[] | null>(null)
  const [correctionOpen, setCorrectionOpen] = useState(false)
  const [pendingFinalize, setPendingFinalize] = useState(false)
  const [correctionReason, setCorrectionReason] = useState('')
  const sheet = useQuery({
    queryKey: queryKeys.attendanceSheet(sessionId),
    queryFn: () => attendanceApi.sheet(sessionId),
    enabled: Boolean(sessionId),
  })

  const drafts = rows ?? toDrafts(sheet.data?.records ?? [])

  const saveMutation = useMutation({
    mutationFn: (input: { finalizeSheet: boolean; correctionReason?: string | null }) =>
      attendanceApi.save(sessionId, {
        finalizeSheet: input.finalizeSheet,
        correctionReason: input.correctionReason,
        records: drafts.map((row) => ({
          studentId: row.studentId,
          status: row.status,
          deliveryMode: row.deliveryMode,
          lateMinutes: row.status === 'LATE' ? Number(row.lateMinutes) || 0 : null,
          note: row.note || null,
        })),
      }),
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setCorrectionOpen(false)
      await client.invalidateQueries({ queryKey: queryKeys.attendance })
      await client.invalidateQueries({ queryKey: queryKeys.attendanceSheet(sessionId) })
      navigate('/attendance')
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })

  function requestSave(finalizeSheet: boolean) {
    if (sheet.data?.status === 'FINALIZED') {
      setPendingFinalize(finalizeSheet)
      setCorrectionOpen(true)
      return
    }
    saveMutation.mutate({ finalizeSheet })
  }

  if (sheet.isLoading) return <PageSpinner label={t('common.loading')} />
  if (sheet.error) return <QueryError message={sheet.error.message} onRetry={() => void sheet.refetch()} />
  if (!sheet.data) return null

  return (
    <div className="space-y-5">
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-xs text-neutral-400">{sheet.data.courseTitle}</p>
          <h2 className="text-xl font-semibold">{sheet.data.className}</h2>
          <p className="text-sm text-neutral-500">{formatDate(sheet.data.plannedStartAt, locale)}</p>
        </div>
        <StatusBadge value={sheet.data.status} />
      </div>
      <div className="shell-card overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-neutral-100 text-neutral-500">
              <th className="text-start font-medium px-5 py-3">{t('enrollments.student')}</th>
              <th className="text-start font-medium px-5 py-3">{t('attendance.presence')}</th>
              <th className="text-start font-medium px-5 py-3">{t('attendance.delivery')}</th>
              <th className="text-start font-medium px-5 py-3">{t('attendance.lateMinutes')}</th>
              <th className="text-start font-medium px-5 py-3">{t('attendance.note')}</th>
            </tr>
          </thead>
          <tbody>
            {drafts.map((row) => (
              <tr key={row.studentId} className="border-b border-neutral-50">
                <td className="px-5 py-3"><Cell title={row.studentName} detail={row.studentCode} /></td>
                <td className="px-5 py-3">
                  <select disabled={!canWrite} value={row.status} onChange={(event) => updateRow(row.studentId, 'status', event.target.value)} className="rounded-lg border border-neutral-200 px-2 py-1.5">
                    {['PRESENT', 'ABSENT', 'LATE', 'EXCUSED'].map((id) => <option key={id} value={id}>{t(`enums.${id}`)}</option>)}
                  </select>
                </td>
                <td className="px-5 py-3">
                  <select disabled={!canWrite} value={row.deliveryMode} onChange={(event) => updateRow(row.studentId, 'deliveryMode', event.target.value)} className="rounded-lg border border-neutral-200 px-2 py-1.5">
                    {['IN_PERSON', 'ONLINE', 'HYBRID'].map((id) => <option key={id} value={id}>{t(`enums.${id}`)}</option>)}
                  </select>
                </td>
                <td className="px-5 py-3">
                  <input type="number" min={0} disabled={!canWrite || row.status !== 'LATE'} value={row.lateMinutes} onChange={(event) => updateRow(row.studentId, 'lateMinutes', event.target.value)} className="w-20 rounded-lg border border-neutral-200 px-2 py-1.5" />
                </td>
                <td className="px-5 py-3">
                  <input disabled={!canWrite} value={row.note} onChange={(event) => updateRow(row.studentId, 'note', event.target.value)} className="w-full rounded-lg border border-neutral-200 px-2 py-1.5" />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="secondary" onClick={() => navigate('/attendance')}>{t('common.back')}</Button>
        {canWrite && (
          <>
            <Button variant="secondary" onClick={() => requestSave(false)}>{t('attendance.saveDraft')}</Button>
            <Button onClick={() => requestSave(true)}>{t('attendance.finalize')}</Button>
          </>
        )}
      </div>
      {correctionOpen && (
        <Modal title={t('attendance.correctionReason')} onClose={() => setCorrectionOpen(false)}>
          <Field label={t('common.reason')} value={correctionReason} onChange={setCorrectionReason} />
          <div className="flex justify-end gap-2 mt-4">
            <Button variant="secondary" onClick={() => setCorrectionOpen(false)}>{t('common.cancel')}</Button>
            <Button disabled={!correctionReason.trim()} onClick={() => saveMutation.mutate({ finalizeSheet: pendingFinalize, correctionReason })}>
              {t('common.save')}
            </Button>
          </div>
        </Modal>
      )}
    </div>
  )

  function updateRow(studentId: string, key: keyof DraftRow, value: string) {
    setRows(drafts.map((item) => (item.studentId === studentId ? { ...item, [key]: value } : item)))
  }
}

function toDrafts(records: AttendanceRecordView[]): DraftRow[] {
  return records.map((item) => ({
    studentId: item.studentId,
    studentCode: item.studentCode,
    studentName: item.studentName,
    status: item.status || 'PRESENT',
    deliveryMode: item.deliveryMode || 'IN_PERSON',
    lateMinutes: item.lateMinutes != null ? String(item.lateMinutes) : '',
    note: item.note || '',
  }))
}
