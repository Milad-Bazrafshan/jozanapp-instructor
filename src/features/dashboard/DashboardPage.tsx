import { Link } from 'react-router-dom'
import { useMutation, useQuery } from '@tanstack/react-query'
import { BookOpenCheck, CalendarDays, ClipboardCheck, GraduationCap, Sparkles, Video } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { instructorApi } from '@/api/instructor'
import { queryKeys } from '@/api/queryKeys'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { PageStack, ShellCard, shellCard, shellInset } from '@/components/ui/Shell'
import { StatCard } from '@/components/ui/StatCard'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { PageSpinner, QueryError } from '@/components/ui/Spinner'
import { formatDate, useLocale } from '@/lib/format'

export function DashboardPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const auth = useAuth()
  const home = useQuery({ queryKey: queryKeys.instructorHome, queryFn: instructorApi.home })
  const classes = useQuery({ queryKey: queryKeys.instructorClasses, queryFn: instructorApi.classes })
  const join = useMutation({
    mutationFn: instructorApi.joinMeeting,
    onSuccess: (data) => window.open(data.joinUrl, '_blank', 'noopener,noreferrer'),
  })
  if (home.isLoading) return <PageSpinner label={t('common.loading')} />
  if (home.error) return <QueryError message={home.error.message} onRetry={() => void home.refetch()} />
  const data = home.data
  const today = data?.todaySessions ?? []
  const attendance = data?.incompleteAttendance ?? []
  const grading = data?.assessments ?? []

  return (
    <PageStack className="space-y-8">
      <ShellCard className="p-6 md:p-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 via-violet-400/5 to-transparent pointer-events-none" />
        <div className="relative">
          <p className="inline-flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-indigo-700 mb-2">
            <Sparkles className="w-4 h-4" />
            {t('brand.admin')}
          </p>
          <h2 className="text-2xl md:text-3xl font-semibold text-slate-900 tracking-tight">{data?.instructorName || auth.session?.user.fullName}</h2>
          <p className="text-sm text-slate-600 mt-2 max-w-2xl">{t('instructor.guide')}</p>
          <p className="text-xs text-slate-400 mt-3" dir="ltr">{data?.instructorCode}</p>
        </div>
      </ShellCard>

      <section className="grid sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <Link to="/schedule" className="block"><StatCard icon={CalendarDays} label={t('instructor.todaySessions')} value={today.length} /></Link>
        <Link to="/attendance" className="block"><StatCard icon={ClipboardCheck} label={t('instructor.incompleteAttendance')} value={attendance.length} /></Link>
        <Link to="/grading" className="block"><StatCard icon={BookOpenCheck} label={t('instructor.gradingQueue')} value={grading.length} /></Link>
        <Link to="/classes" className="block"><StatCard icon={GraduationCap} label={t('nav.classes')} value={classes.data?.length ?? 0} /></Link>
      </section>

      <section className="grid md:grid-cols-3 gap-3">
        <StartCard to="/attendance" title={t('instructor.doAttendance')} hint={t('instructor.doAttendanceHint')} count={attendance.length} />
        <StartCard to="/grading" title={t('instructor.doGrading')} hint={t('instructor.doGradingHint')} count={grading.length} />
        <StartCard to="/announcements" title={t('instructor.doAnnounce')} hint={t('instructor.doAnnounceHint')} />
      </section>

      <ShellCard className="p-5">
        <div className="flex items-center justify-between gap-3 mb-4">
          <h3 className="font-semibold text-slate-900">{t('instructor.todaySessions')}</h3>
          <Link to="/schedule" className="text-sm text-indigo-700 hover:underline">{t('instructor.viewSchedule')}</Link>
        </div>
        {today.length === 0 ? <p className="text-sm text-slate-500">{t('dashboard.noSessions')}</p> : null}
        <ul className="space-y-3">
          {today.map((session) => (
            <li key={session.id} className={`flex flex-col sm:flex-row sm:items-center justify-between gap-3 py-3 border-b border-slate-100 last:border-0`}>
              <div>
                <p className="font-medium text-slate-900">{session.className}</p>
                <p className="text-sm text-slate-500">
                  {session.courseTitle} · {formatDate(session.plannedStartAt, locale)}
                </p>
              </div>
              <div className="flex items-center gap-2">
                <StatusBadge value={session.status} />
                <Link
                  to={`/attendance/${session.id}`}
                  className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-white text-slate-700 border border-slate-200 hover:bg-slate-50"
                >
                  {t('instructor.markAttendance')}
                </Link>
                <Button variant="secondary" onClick={() => join.mutate(session.id)}>
                  <Video className="w-4 h-4" />
                  {t('meetings.join')}
                </Button>
              </div>
            </li>
          ))}
        </ul>
      </ShellCard>

      <section className="grid md:grid-cols-2 gap-4">
        <ShellCard className="p-5 space-y-3">
          <h3 className="font-semibold text-slate-900">{t('instructor.incompleteAttendance')}</h3>
          {attendance.length === 0 ? <p className="text-sm text-slate-500">{t('instructor.noAttendance')}</p> : null}
          {attendance.slice(0, 5).map((item) => (
            <Link key={item.sessionId} to={`/attendance/${item.sessionId}`} className={`block text-sm hover:text-indigo-700 ${shellInset} px-3 py-2`}>
              <span className="flex items-center justify-between gap-3">
                <span>{item.className}</span>
                <StatusBadge value={item.sheetStatus} />
              </span>
            </Link>
          ))}
        </ShellCard>
        <ShellCard className="p-5 space-y-3">
          <h3 className="font-semibold text-slate-900">{t('instructor.gradingQueue')}</h3>
          {grading.length === 0 ? <p className="text-sm text-slate-500">{t('instructor.noGrading')}</p> : null}
          {grading.slice(0, 5).map((item) => (
            <Link key={item.id} to={`/assessments/${item.id}/grading`} className={`block text-sm hover:text-indigo-700 ${shellInset} px-3 py-2`}>
              {item.title}
            </Link>
          ))}
          <Link to="/grading" className="inline-flex items-center justify-center gap-2 px-4 py-2 rounded-xl text-sm font-medium bg-indigo-50 text-indigo-800 border border-indigo-100 hover:bg-indigo-100">
            {t('nav.grading')}
          </Link>
        </ShellCard>
      </section>
    </PageStack>
  )
}

function StartCard({ to, title, hint, count }: { to: string; title: string; hint: string; count?: number }) {
  return (
    <Link to={to} className={`${shellCard} p-4 hover:border-indigo-200 hover:shadow-soft transition-all block`}>
      <div className="flex items-start justify-between gap-3">
        <p className="font-semibold text-slate-900">{title}</p>
        {typeof count === 'number' && count > 0 ? (
          <span className="min-w-6 h-6 px-1.5 rounded-full bg-indigo-600 text-white text-xs font-semibold flex items-center justify-center">{count}</span>
        ) : null}
      </div>
      <p className="text-sm text-slate-500 mt-1 leading-6">{hint}</p>
    </Link>
  )
}
