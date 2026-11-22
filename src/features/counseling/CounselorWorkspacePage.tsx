import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { ChevronLeft, ChevronRight, CalendarDays, Inbox, Sparkles, Trash2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { counselorApi, type StudyPlanView } from '@/api/counseling'
import { Button } from '@/components/ui/Button'
import { Field, SelectField, TextArea } from '@/components/ui/Field'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner, QueryError } from '@/components/ui/Spinner'
import { PageStack, ShellCard, shellInset } from '@/components/ui/Shell'
import { formatDate, todayIso, useLocale } from '@/lib/format'
import {
  gregorianIsoFromJalali,
  isoToJalaliDisplay,
  jalaliFromGregorianIso,
  jalaliMonthLabel,
  jalaliMonthLength,
  jalaliWeekdayIndex,
  jalaliWeekdayLabelsFa,
} from '@/lib/jalali'

type DayItemDraft = { subjectName: string; activityTitle: string; targetMinutes: string }

function buildMonthDays(jy: number, jm: number) {
  const length = jalaliMonthLength(jy, jm)
  const firstIso = gregorianIsoFromJalali(jy, jm, 1)
  const startPad = jalaliWeekdayIndex(firstIso)
  const cells: Array<{ iso: string; jd: number } | null> = []
  for (let i = 0; i < startPad; i += 1) cells.push(null)
  for (let jd = 1; jd <= length; jd += 1) {
    cells.push({ iso: gregorianIsoFromJalali(jy, jm, jd), jd })
  }
  while (cells.length % 7 !== 0) cells.push(null)
  return cells
}

function plannedDatesForStudent(plans: StudyPlanView[], studentId: string) {
  const set = new Set<string>()
  for (const plan of plans) {
    if (plan.studentId !== studentId) continue
    for (const item of plan.items) {
      if (item.plannedDate) set.add(item.plannedDate.slice(0, 10))
    }
  }
  return set
}

type ExistingDayItem = {
  itemId: string
  planTitle: string
  subjectName: string
  activityTitle: string
  targetMinutes: number
  completedMinutes: number | null
}

function existingItemsForDay(plans: StudyPlanView[], studentId: string, iso: string): ExistingDayItem[] {
  const rows: ExistingDayItem[] = []
  for (const plan of plans) {
    if (plan.studentId !== studentId) continue
    for (const item of plan.items) {
      const day = (item.plannedDate ?? plan.startDate)?.slice(0, 10)
      if (day === iso) {
        rows.push({
          itemId: item.id,
          planTitle: plan.title,
          subjectName: item.subjectName,
          activityTitle: item.activityTitle,
          targetMinutes: item.targetMinutes,
          completedMinutes: item.completedMinutes,
        })
      }
    }
  }
  return rows
}

export function CounselorWorkspacePage() {
  const { t } = useTranslation()
  const { locale, language } = useLocale()
  const client = useQueryClient()
  const today = todayIso()
  const todayJ = jalaliFromGregorianIso(today) ?? { jy: 1403, jm: 1, jd: 1 }

  const [feedback, setFeedback] = useState<Record<string, string>>({})
  const [studentId, setStudentId] = useState('')
  const [viewJy, setViewJy] = useState(todayJ.jy)
  const [viewJm, setViewJm] = useState(todayJ.jm)
  const [dayModalIso, setDayModalIso] = useState<string | null>(null)
  const [planTitle, setPlanTitle] = useState('')
  const [dayItems, setDayItems] = useState<DayItemDraft[]>([{ subjectName: '', activityTitle: '', targetMinutes: '60' }])

  const inbox = useQuery({ queryKey: ['counselor', 'inbox'], queryFn: counselorApi.inbox })
  const plans = useQuery({ queryKey: ['counselor', 'plans'], queryFn: counselorApi.studyPlans })
  const assigned = useQuery({ queryKey: ['counselor', 'assignments'], queryFn: counselorApi.assignments })

  const studentOptions = (assigned.data ?? [])
    .filter((row) => row.assignmentType === 'STUDENT' && row.targetId)
    .map((row) => [row.targetId!, `${row.targetName ?? row.targetId}`] as const)

  const selectedStudent = studentId || studentOptions[0]?.[0] || ''

  const markedDays = useMemo(
    () => (selectedStudent ? plannedDatesForStudent(plans.data ?? [], selectedStudent) : new Set<string>()),
    [plans.data, selectedStudent],
  )

  const monthCells = useMemo(() => buildMonthDays(viewJy, viewJm), [viewJy, viewJm])

  const existingForModal = useMemo(() => {
    if (!dayModalIso || !selectedStudent) return []
    return existingItemsForDay(plans.data ?? [], selectedStudent, dayModalIso)
  }, [dayModalIso, selectedStudent, plans.data])

  const review = useMutation({
    mutationFn: ({ id, text }: { id: string; text: string }) => counselorApi.review(id, text),
    onSuccess: () => client.invalidateQueries({ queryKey: ['counselor', 'inbox'] }),
  })

  const createPlan = useMutation({
    mutationFn: (payload: { iso: string; title: string; items: DayItemDraft[] }) =>
      counselorApi.createStudyPlan({
        studentId: selectedStudent,
        title: payload.title,
        startDate: payload.iso,
        endDate: payload.iso,
        items: payload.items
          .filter((row) => row.activityTitle.trim())
          .map((row) => ({
            subjectName: row.subjectName.trim() || '—',
            activityTitle: row.activityTitle.trim(),
            targetMinutes: Number(row.targetMinutes) || 60,
            plannedDate: payload.iso,
          })),
      }),
    onSuccess: () => {
      setDayItems([{ subjectName: '', activityTitle: '', targetMinutes: '60' }])
      void client.invalidateQueries({ queryKey: ['counselor', 'plans'] })
    },
  })

  const removeItem = useMutation({
    mutationFn: (itemId: string) => counselorApi.deleteStudyPlanItem(itemId),
    onSuccess: () => void client.invalidateQueries({ queryKey: ['counselor', 'plans'] }),
  })

  const shiftMonth = (delta: number) => {
    let jm = viewJm + delta
    let jy = viewJy
    while (jm < 1) {
      jm += 12
      jy -= 1
    }
    while (jm > 12) {
      jm -= 12
      jy += 1
    }
    setViewJy(jy)
    setViewJm(jm)
  }

  const openDay = (iso: string) => {
    const j = jalaliFromGregorianIso(iso)
    setPlanTitle(j ? t('counseling.dayPlanTitle', { date: isoToJalaliDisplay(iso) }) : t('counseling.newPlan'))
    setDayItems([{ subjectName: '', activityTitle: '', targetMinutes: '60' }])
    setDayModalIso(iso)
  }

  if (inbox.isLoading || plans.isLoading) return <PageSpinner label={t('common.loading')} />
  if (inbox.error) return <QueryError message={inbox.error.message} />

  const inboxCount = (inbox.data ?? []).length
  const planCount = (plans.data ?? []).filter((p) => p.studentId === selectedStudent).length

  return (
    <PageStack className="space-y-8">
      <ShellCard className="p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-violet-400/5 to-transparent pointer-events-none" />
        <div className="relative flex flex-col md:flex-row md:items-end md:justify-between gap-4">
          <div>
            <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-2">
              <Sparkles className="w-4 h-4" />
              {t('counseling.pageTitle')}
            </p>
            <h1 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">{t('counseling.workspaceHeadline')}</h1>
            <p className="mt-2 text-sm text-slate-600 max-w-xl">{t('counseling.workspaceSubtitle')}</p>
          </div>
          <div className="flex gap-3">
            <div className="rounded-xl bg-indigo-50 border border-indigo-100 px-4 py-3 min-w-[7rem]">
              <p className="text-xs text-indigo-700">{t('counseling.inboxTitle')}</p>
              <p className="text-2xl font-semibold text-indigo-900">{inboxCount}</p>
            </div>
            <div className="rounded-xl bg-slate-50 border border-slate-200 px-4 py-3 min-w-[7rem]">
              <p className="text-xs text-slate-600">{t('counseling.plansTitle')}</p>
              <p className="text-2xl font-semibold text-slate-900">{planCount}</p>
            </div>
          </div>
        </div>
      </ShellCard>

      <div className="grid xl:grid-cols-5 gap-6">
        <ShellCard className="xl:col-span-2 p-5 space-y-4">
          <div className="flex items-center gap-2 text-slate-800">
            <Inbox className="w-5 h-5 text-indigo-600" />
            <h2 className="font-semibold">{t('counseling.inboxTitle')}</h2>
          </div>
          {(inbox.data ?? []).length ? (
            <div className="space-y-3 max-h-[32rem] overflow-y-auto pe-1">
              {(inbox.data ?? []).map((log) => (
                <article key={log.id} className={`${shellInset} p-4 space-y-2`}>
                  <p className="font-medium text-slate-900">
                    {log.studentName} · {formatDate(log.logDate, locale)}
                  </p>
                  {log.daySummary ? <p className="text-sm text-slate-600">{log.daySummary}</p> : null}
                  <ul className="text-sm list-disc ps-5 text-slate-700">
                    {log.entries.map((entry) => (
                      <li key={entry.id}>
                        {entry.activityTitle} ({entry.subjectName ?? '—'}) — {entry.durationMinutes} {t('counseling.minShort')}
                      </li>
                    ))}
                  </ul>
                  <TextArea
                    label={t('counseling.feedback')}
                    value={feedback[log.id] ?? ''}
                    onChange={(value) => setFeedback((prev) => ({ ...prev, [log.id]: value }))}
                  />
                  <Button
                    disabled={!feedback[log.id]?.trim() || review.isPending}
                    onClick={() => review.mutate({ id: log.id, text: feedback[log.id]! })}
                  >
                    {t('counseling.sendFeedback')}
                  </Button>
                </article>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-500">{t('counseling.inboxEmptyHint')}</p>
          )}
        </ShellCard>

        <ShellCard className="xl:col-span-3 p-5 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-center gap-2 text-slate-800">
              <CalendarDays className="w-5 h-5 text-indigo-600" />
              <h2 className="font-semibold">{t('counseling.calendarTitle')}</h2>
            </div>
            {studentOptions.length ? (
              <SelectField
                label={t('counseling.student')}
                value={selectedStudent}
                onChange={setStudentId}
                options={studentOptions}
              />
            ) : (
              <p className="text-sm text-amber-700 bg-amber-50 border border-amber-100 rounded-lg px-3 py-2">{t('counseling.noStudentsAssigned')}</p>
            )}
          </div>

          <div className="flex items-center justify-between">
            <Button variant="ghost" icon={<ChevronRight className="w-4 h-4" />} onClick={() => shiftMonth(-1)} aria-label={t('counseling.prevMonth')} />
            <p className="font-semibold text-slate-900">{jalaliMonthLabel(viewJy, viewJm, locale)}</p>
            <Button variant="ghost" icon={<ChevronLeft className="w-4 h-4" />} onClick={() => shiftMonth(1)} aria-label={t('counseling.nextMonth')} />
          </div>

          <div className="grid grid-cols-7 gap-1 text-center text-xs font-medium text-slate-500 mb-1">
            {(language === 'fa' ? jalaliWeekdayLabelsFa : ['Sa', 'Su', 'Mo', 'Tu', 'We', 'Th', 'Fr']).map((label) => (
              <span key={label}>{label}</span>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1.5">
            {monthCells.map((cell, index) =>
              cell ? (
                <button
                  key={cell.iso}
                  type="button"
                  disabled={!selectedStudent}
                  onClick={() => openDay(cell.iso)}
                  className={`relative aspect-square rounded-xl text-sm font-medium transition ${
                    cell.iso === today
                      ? 'bg-indigo-600 text-white shadow-md shadow-indigo-200'
                      : markedDays.has(cell.iso)
                        ? 'bg-indigo-50 text-indigo-900 border border-indigo-200 hover:bg-indigo-100'
                        : 'bg-white border border-slate-100 text-slate-800 hover:border-indigo-200 hover:bg-indigo-50/50'
                  } disabled:opacity-40`}
                >
                  {cell.jd}
                  {markedDays.has(cell.iso) ? (
                    <span className="absolute bottom-1 inset-x-0 mx-auto w-1 h-1 rounded-full bg-indigo-500" />
                  ) : null}
                </button>
              ) : (
                <span key={`pad-${index}`} />
              ),
            )}
          </div>
          <p className="text-xs text-slate-500">{t('counseling.calendarHint')}</p>

          {(plans.data ?? []).filter((p) => p.studentId === selectedStudent).length ? (
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <h3 className="text-sm font-semibold text-slate-800">{t('counseling.recentPlans')}</h3>
              {(plans.data ?? [])
                .filter((p) => p.studentId === selectedStudent)
                .slice(0, 4)
                .map((plan) => (
                  <div key={plan.id} className="flex justify-between text-sm rounded-lg bg-slate-50 px-3 py-2">
                    <span className="font-medium text-slate-800">{plan.title}</span>
                    <span className="text-slate-500">{plan.items.length} {t('counseling.items')}</span>
                  </div>
                ))}
            </div>
          ) : null}
        </ShellCard>
      </div>

      {dayModalIso && (
        <Modal title={planTitle} onClose={() => setDayModalIso(null)}>
          <div className="space-y-5">
            {existingForModal.length > 0 ? (
              <div className={`${shellInset} p-3 space-y-3`}>
                <h3 className="text-sm font-semibold text-slate-900">{t('counseling.registeredActivities')}</h3>
                <ul className="space-y-2">
                  {existingForModal.map((row) => (
                    <li key={row.itemId} className="flex items-start justify-between gap-3 text-sm border-b border-slate-200/80 last:border-0 pb-3 last:pb-0">
                      <div className="min-w-0">
                        <p className="font-medium text-slate-900">{row.activityTitle}</p>
                        <p className="text-slate-600">
                          {row.subjectName} · {row.targetMinutes} {t('counseling.minShort')}
                        </p>
                        <p className="text-xs text-slate-500 mt-0.5">{row.planTitle}</p>
                        {row.completedMinutes != null ? (
                          <p className="text-xs text-indigo-700 mt-1">{t('counseling.progressDone', { count: row.completedMinutes })}</p>
                        ) : null}
                      </div>
                      <Button
                        variant="ghost"
                        className="shrink-0 text-rose-600 hover:bg-rose-50 px-2.5"
                        disabled={removeItem.isPending}
                        onClick={() => {
                          if (window.confirm(t('counseling.deleteActivityConfirm'))) {
                            removeItem.mutate(row.itemId)
                          }
                        }}
                        icon={<Trash2 className="w-4 h-4" />}
                      >
                        {t('common.delete')}
                      </Button>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            <div className="space-y-3">
              <p className="text-sm font-medium text-slate-800">{t('counseling.addNewActivities')}</p>
              <p className="text-sm text-slate-600">{t('counseling.dayPlanHint')}</p>
            </div>
            {dayItems.map((row, index) => (
              <div key={index} className="rounded-xl border border-slate-100 p-3 space-y-3 bg-slate-50/50">
                <Field label={t('counseling.subject')} value={row.subjectName} onChange={(subjectName) => {
                  setDayItems((prev) => prev.map((item, i) => (i === index ? { ...item, subjectName } : item)))
                }} required={false} />
                <Field label={t('counseling.activity')} value={row.activityTitle} onChange={(activityTitle) => {
                  setDayItems((prev) => prev.map((item, i) => (i === index ? { ...item, activityTitle } : item)))
                }} />
                <Field label={t('counseling.targetMinutes')} value={row.targetMinutes} onChange={(targetMinutes) => {
                  setDayItems((prev) => prev.map((item, i) => (i === index ? { ...item, targetMinutes } : item)))
                }} />
              </div>
            ))}
            <div className="flex flex-col sm:flex-row flex-wrap gap-3 pt-1">
              <Button variant="secondary" onClick={() => setDayItems((prev) => [...prev, { subjectName: '', activityTitle: '', targetMinutes: '60' }])}>
                {t('counseling.addActivity')}
              </Button>
              <Button
                disabled={!selectedStudent || !dayItems.some((row) => row.activityTitle.trim()) || createPlan.isPending}
                onClick={() => {
                  createPlan.mutate(
                    { iso: dayModalIso, title: planTitle, items: dayItems },
                    { onSuccess: () => setDayModalIso(null) },
                  )
                }}
              >
                {t('common.save')}
              </Button>
              <Button variant="ghost" onClick={() => setDayModalIso(null)}>
                {t('common.cancel')}
              </Button>
            </div>
          </div>
        </Modal>
      )}
    </PageStack>
  )
}
