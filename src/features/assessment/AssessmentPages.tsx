import { useMemo, useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { Plus } from 'lucide-react'
import { Link, useNavigate, useParams } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import { academicApi } from '@/api/academic'
import { assessmentApi } from '@/api/assessment'
import { classroomApi } from '@/api/classroom'
import { queryKeys } from '@/api/queryKeys'
import type { AssessmentView, QuestionView, ResponseGradeView } from '@/api/types'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Cell, DataTable } from '@/components/ui/DataTable'
import { Check, Field, SelectField, TextArea } from '@/components/ui/Field'
import { FormActions, FormGrid, FormStack } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner, QueryError } from '@/components/ui/Spinner'
import { StatusBadge } from '@/components/ui/StatusBadge'
import { Toolbar } from '@/components/ui/Toolbar'
import { useToast } from '@/components/ui/Toast'
import { emptyToNull, formatDate, localDateTimeValue, useLocale } from '@/lib/format'

export function QuestionsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const auth = useAuth()
  const client = useQueryClient()
  const canWrite = auth.hasPermission('QUESTION_WRITE')
  const [query, setQuery] = useState('')
  const [editor, setEditor] = useState<null | { kind: 'question' } | { kind: 'version'; question: QuestionView }>(null)
  const questions = useQuery({ queryKey: queryKeys.questions, queryFn: assessmentApi.questions })
  const academic = useQuery({ queryKey: queryKeys.academic, queryFn: academicApi.list, enabled: Boolean(editor) })
  const createMutation = useMutation({
    mutationFn: assessmentApi.createQuestion,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setEditor(null)
      await client.invalidateQueries({ queryKey: queryKeys.questions })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const versionMutation = useMutation({
    mutationFn: ({ id, body }: { id: string; body: Parameters<typeof assessmentApi.createVersion>[1] }) => assessmentApi.createVersion(id, body),
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setEditor(null)
      await client.invalidateQueries({ queryKey: queryKeys.questions })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const rows = useMemo(
    () => (questions.data ?? []).filter((item) => `${item.code} ${item.prompt}`.toLowerCase().includes(query.toLowerCase())),
    [questions.data, query],
  )
  if (questions.isLoading) return <PageSpinner label={t('common.loading')} />
  if (questions.error) return <QueryError message={questions.error.message} onRetry={() => void questions.refetch()} />
  return (
    <div className="space-y-5">
      <Toolbar query={query} onQuery={setQuery}>
        {canWrite && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setEditor({ kind: 'question' })}>{t('questions.add')}</Button>}
      </Toolbar>
      <DataTable
        rows={rows}
        columns={[
          { key: 'code', header: t('common.code'), render: (row) => <span dir="ltr">{row.code}</span> },
          { key: 'prompt', header: t('questions.prompt'), render: (row) => <Cell title={row.prompt} detail={row.courseTitle || t('common.general')} /> },
          { key: 'type', header: t('common.type'), render: (row) => t(`enums.${row.type}`, { defaultValue: row.type }) },
          { key: 'version', header: t('questions.version'), render: (row) => `v${row.versionNumber}` },
          ...(canWrite
            ? [{
                key: 'actions',
                header: t('common.actions'),
                render: (row: QuestionView) => (
                  <Button variant="ghost" onClick={() => setEditor({ kind: 'version', question: row })}>{t('questions.newVersion')}</Button>
                ),
              }]
            : []),
        ]}
      />
      {editor && (
        <QuestionForm
          editor={editor}
          courses={academic.data?.courses ?? []}
          busy={createMutation.isPending || versionMutation.isPending}
          onClose={() => setEditor(null)}
          onSubmit={(payload) => {
            if (editor.kind === 'version') versionMutation.mutate({ id: editor.question.id, body: payload.version })
            else createMutation.mutate(payload.create)
          }}
        />
      )}
    </div>
  )
}

function QuestionForm({
  editor,
  courses,
  busy,
  onClose,
  onSubmit,
}: {
  editor: { kind: 'question' } | { kind: 'version'; question: QuestionView }
  courses: Array<{ id: string; title: string }>
  busy: boolean
  onClose: () => void
  onSubmit: (payload: {
    create: Parameters<typeof assessmentApi.createQuestion>[0]
    version: Parameters<typeof assessmentApi.createVersion>[1]
  }) => void
}) {
  const { t } = useTranslation()
  const source = editor.kind === 'version' ? editor.question : null
  const [form, setForm] = useState({
    courseId: source?.courseId ?? '',
    code: source?.code ?? '',
    type: source?.type ?? 'SINGLE_CHOICE',
    prompt: source?.prompt ?? '',
    options: source?.options?.join('\n') ?? '',
    correctAnswers: source?.correctAnswers?.join('\n') ?? '',
    explanation: source?.explanation ?? '',
    defaultPoints: String(source?.defaultPoints ?? 1),
  })
  const version = {
    prompt: form.prompt,
    options: form.options.split('\n').filter(Boolean),
    correctAnswers: form.correctAnswers.split('\n').filter(Boolean),
    explanation: emptyToNull(form.explanation),
    defaultPoints: Number(form.defaultPoints),
  }
  return (
    <Modal title={editor.kind === 'version' ? t('questions.newVersion') : t('questions.add')} onClose={onClose} wide>
      <FormStack>
        {editor.kind !== 'version' && (
          <>
            <SelectField label={t('academic.course')} value={form.courseId} onChange={(courseId) => setForm({ ...form, courseId })} options={[['', t('common.general')], ...courses.map((item) => [item.id, item.title])]} required={false} />
            <FormGrid>
              <Field label={t('common.code')} value={form.code} onChange={(code) => setForm({ ...form, code })} />
              <SelectField label={t('common.type')} value={form.type} onChange={(type) => setForm({ ...form, type })} options={['SINGLE_CHOICE', 'MULTIPLE_CHOICE', 'TRUE_FALSE', 'SHORT_ANSWER', 'ESSAY'].map((id) => [id, t(`enums.${id}`)])} />
            </FormGrid>
          </>
        )}
        <TextArea label={t('questions.prompt')} value={form.prompt} onChange={(prompt) => setForm({ ...form, prompt })} />
        <TextArea label={t('questions.options')} value={form.options} onChange={(options) => setForm({ ...form, options })} required={false} />
        <TextArea label={t('questions.correctAnswers')} value={form.correctAnswers} onChange={(correctAnswers) => setForm({ ...form, correctAnswers })} required={false} />
        <Field label={t('questions.points')} type="number" value={form.defaultPoints} onChange={(defaultPoints) => setForm({ ...form, defaultPoints })} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() => onSubmit({ create: { ...version, courseId: emptyToNull(form.courseId), code: form.code, type: form.type }, version })}
          >
            {t('common.save')}
          </Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}

export function AssessmentsPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const toast = useToast()
  const navigate = useNavigate()
  const auth = useAuth()
  const client = useQueryClient()
  const canWrite = auth.hasPermission('ASSESSMENT_WRITE')
  const [query, setQuery] = useState('')
  const [open, setOpen] = useState(false)
  const assessments = useQuery({ queryKey: queryKeys.assessments, queryFn: assessmentApi.assessments })
  const academic = useQuery({ queryKey: queryKeys.academic, queryFn: academicApi.list, enabled: open })
  const mutation = useMutation({
    mutationFn: assessmentApi.createAssessment,
    onSuccess: async (created) => {
      toast.success(t('common.saved'))
      setOpen(false)
      await client.invalidateQueries({ queryKey: queryKeys.assessments })
      navigate(`/assessments/${created.id}`)
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const rows = useMemo(
    () => (assessments.data ?? []).filter((item) => `${item.title} ${item.code}`.toLowerCase().includes(query.toLowerCase())),
    [assessments.data, query],
  )
  if (assessments.isLoading) return <PageSpinner label={t('common.loading')} />
  if (assessments.error) return <QueryError message={assessments.error.message} onRetry={() => void assessments.refetch()} />
  return (
    <div className="space-y-5">
      <Toolbar query={query} onQuery={setQuery}>
        {canWrite && <Button icon={<Plus className="w-4 h-4" />} onClick={() => setOpen(true)}>{t('assessments.add')}</Button>}
      </Toolbar>
      <DataTable
        rows={rows}
        columns={[
          { key: 'title', header: t('assessments.titleField'), render: (row) => <Cell title={row.title} detail={`${row.code} · ${row.courseTitle || t('common.general')}`} /> },
          { key: 'window', header: t('common.date'), render: (row) => `${formatDate(row.opensAt, locale)} → ${formatDate(row.closesAt, locale)}` },
          { key: 'status', header: t('common.status'), render: (row) => <StatusBadge value={row.status} /> },
          {
            key: 'actions',
            header: t('common.actions'),
            render: (row) => (
              <Button variant="ghost" onClick={() => navigate(`/assessments/${row.id}`)}>{t('common.details')}</Button>
            ),
          },
        ]}
      />
      {open && (
        <AssessmentForm
          courses={academic.data?.courses ?? []}
          busy={mutation.isPending}
          onClose={() => setOpen(false)}
          onSubmit={(body) => mutation.mutate(body)}
        />
      )}
    </div>
  )
}

function AssessmentForm({
  courses,
  busy,
  onClose,
  onSubmit,
}: {
  courses: Array<{ id: string; title: string }>
  busy: boolean
  onClose: () => void
  onSubmit: (body: Parameters<typeof assessmentApi.createAssessment>[0]) => void
}) {
  const { t } = useTranslation()
  const later = new Date(Date.now() + 86400000)
  const [form, setForm] = useState({
    courseId: '',
    code: '',
    title: '',
    type: 'EXAM',
    opensAt: localDateTimeValue(),
    closesAt: localDateTimeValue(later),
    durationMinutes: '60',
    attemptsAllowed: '1',
    randomizeQuestions: false,
  })
  return (
    <Modal title={t('assessments.add')} onClose={onClose}>
      <FormStack>
        <SelectField label={t('academic.course')} value={form.courseId} onChange={(courseId) => setForm({ ...form, courseId })} options={[['', t('common.general')], ...courses.map((item) => [item.id, item.title])]} required={false} />
        <FormGrid>
          <Field label={t('common.code')} value={form.code} onChange={(code) => setForm({ ...form, code })} />
          <Field label={t('assessments.titleField')} value={form.title} onChange={(title) => setForm({ ...form, title })} />
        </FormGrid>
        <SelectField label={t('common.type')} value={form.type} onChange={(type) => setForm({ ...form, type })} options={['EXAM', 'QUIZ', 'ASSIGNMENT'].map((id) => [id, t(`enums.${id}`)])} />
        <FormGrid>
          <Field label={t('assessments.opensAt')} type="datetime-local" value={form.opensAt} onChange={(opensAt) => setForm({ ...form, opensAt })} />
          <Field label={t('assessments.closesAt')} type="datetime-local" value={form.closesAt} onChange={(closesAt) => setForm({ ...form, closesAt })} />
        </FormGrid>
        <FormGrid>
          <Field label={t('assessments.duration')} type="number" value={form.durationMinutes} onChange={(durationMinutes) => setForm({ ...form, durationMinutes })} />
          <Field label={t('assessments.attempts')} type="number" value={form.attemptsAllowed} onChange={(attemptsAllowed) => setForm({ ...form, attemptsAllowed })} />
        </FormGrid>
        <Check label={t('assessments.randomize')} checked={form.randomizeQuestions} onChange={(randomizeQuestions) => setForm({ ...form, randomizeQuestions })} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button
            type="button"
            disabled={busy}
            onClick={() =>
              onSubmit({
                courseId: emptyToNull(form.courseId),
                code: form.code,
                title: form.title,
                type: form.type,
                opensAt: new Date(form.opensAt).toISOString(),
                closesAt: new Date(form.closesAt).toISOString(),
                durationMinutes: Number(form.durationMinutes),
                attemptsAllowed: Number(form.attemptsAllowed),
                randomizeQuestions: form.randomizeQuestions,
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

export function AssessmentDetailPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const toast = useToast()
  const { id = '' } = useParams()
  const auth = useAuth()
  const client = useQueryClient()
  const canWrite = auth.hasPermission('ASSESSMENT_WRITE')
  const canPublish = auth.hasPermission('ASSESSMENT_PUBLISH')
  const [sectionTitle, setSectionTitle] = useState('')
  const [sectionId, setSectionId] = useState('')
  const [questionVersionId, setQuestionVersionId] = useState('')
  const [classSectionId, setClassSectionId] = useState('')
  const assessments = useQuery({ queryKey: queryKeys.assessments, queryFn: assessmentApi.assessments })
  const questions = useQuery({ queryKey: queryKeys.questions, queryFn: assessmentApi.questions, enabled: canWrite })
  const classroom = useQuery({ queryKey: queryKeys.classroom, queryFn: classroomApi.list, enabled: canWrite })
  const item = assessments.data?.find((row) => row.id === id)
  const invalidate = () => client.invalidateQueries({ queryKey: queryKeys.assessments })
  const addSection = useMutation({
    mutationFn: () => assessmentApi.addSection(id, { title: sectionTitle, instructions: null, sequenceNumber: (item?.sections.length ?? 0) + 1 }),
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setSectionTitle('')
      await invalidate()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const attachQuestion = useMutation({
    mutationFn: () => {
      const question = questions.data?.find((row) => row.currentVersionId === questionVersionId)
      return assessmentApi.addQuestion(id, {
        sectionId,
        questionVersionId,
        points: question?.defaultPoints ?? 1,
        sequenceNumber: (item?.questions.filter((row) => row.sectionId === sectionId).length ?? 0) + 1,
      })
    },
    onSuccess: async () => {
      toast.success(t('common.saved'))
      await invalidate()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const addTarget = useMutation({
    mutationFn: () => assessmentApi.addTarget(id, classSectionId),
    onSuccess: async () => {
      toast.success(t('common.saved'))
      await invalidate()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const publish = useMutation({
    mutationFn: () => assessmentApi.publish(id),
    onSuccess: async () => {
      toast.success(t('common.saved'))
      await invalidate()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  if (assessments.isLoading) return <PageSpinner label={t('common.loading')} />
  if (!item) return <QueryError message={t('common.notFound')} />
  const draft = item.status === 'DRAFT'
  return (
    <div className="space-y-5">
      <div className="shell-card p-5 flex flex-col md:flex-row md:items-start justify-between gap-4">
        <div>
          <p className="text-xs text-neutral-400" dir="ltr">{item.code}</p>
          <h2 className="text-xl font-semibold">{item.title}</h2>
          <p className="text-sm text-neutral-500 mt-1">
            {item.courseTitle || t('common.general')} · {formatDate(item.opensAt, locale)} → {formatDate(item.closesAt, locale)}
          </p>
          <p className="text-sm text-neutral-500">
            {item.sections.length} {t('assessments.sections')} · {item.questions.length} {t('assessments.questions')} · {item.targets.length} {t('assessments.targets')} · {item.participantCount} {t('assessments.participants')}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <StatusBadge value={item.status} />
          {auth.hasPermission('GRADING_READ') && item.status !== 'DRAFT' && (
            <Link to={`/assessments/${item.id}/grading`} className="text-sm underline">{t('nav.grading')}</Link>
          )}
        </div>
      </div>
      <section className="shell-card p-5 space-y-3">
        <h3 className="font-semibold">{t('assessments.sections')}</h3>
        {item.sections.map((section) => (
          <div key={section.id} className="flex justify-between text-sm border-b border-neutral-50 py-2">
            <span>{section.title}</span>
            <span className="text-neutral-400">{section.sequenceNumber}</span>
          </div>
        ))}
        {draft && canWrite && (
          <div className="flex gap-2">
            <input value={sectionTitle} onChange={(event) => setSectionTitle(event.target.value)} placeholder={t('assessments.sectionTitle')} className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm" />
            <Button disabled={!sectionTitle} onClick={() => addSection.mutate()}>{t('assessments.addSection')}</Button>
          </div>
        )}
      </section>
      <section className="shell-card p-5 space-y-3">
        <h3 className="font-semibold">{t('assessments.questions')}</h3>
        {item.questions.map((question) => (
          <div key={question.id} className="text-sm py-2 border-b border-neutral-50">
            <p className="font-medium">{question.prompt}</p>
            <p className="text-neutral-500" dir="ltr">{question.questionCode} · {question.points}</p>
          </div>
        ))}
        {draft && canWrite && (
          <div className="grid sm:grid-cols-3 gap-2">
            <select value={sectionId} onChange={(event) => setSectionId(event.target.value)} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm">
              <option value="">{t('assessments.addSection')}</option>
              {item.sections.map((section) => <option key={section.id} value={section.id}>{section.title}</option>)}
            </select>
            <select value={questionVersionId} onChange={(event) => setQuestionVersionId(event.target.value)} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm">
              <option value="">{t('nav.questions')}</option>
              {(questions.data ?? []).map((question) => <option key={question.currentVersionId} value={question.currentVersionId}>{question.code} · {question.prompt}</option>)}
            </select>
            <Button disabled={!sectionId || !questionVersionId} onClick={() => attachQuestion.mutate()}>{t('assessments.attachQuestion')}</Button>
          </div>
        )}
      </section>
      <section className="shell-card p-5 space-y-3">
        <h3 className="font-semibold">{t('assessments.targets')}</h3>
        {item.targets.map((target) => (
          <div key={target.id} className="text-sm py-2 border-b border-neutral-50">{target.className} · {target.branchName}</div>
        ))}
        {draft && canWrite && (
          <div className="flex gap-2">
            <select value={classSectionId} onChange={(event) => setClassSectionId(event.target.value)} className="flex-1 rounded-lg border border-neutral-200 px-3 py-2 text-sm">
              <option value="">{t('enrollments.class')}</option>
              {(classroom.data?.sections ?? []).map((section) => <option key={section.id} value={section.id}>{section.name}</option>)}
            </select>
            <Button disabled={!classSectionId} onClick={() => addTarget.mutate()}>{t('assessments.addTarget')}</Button>
          </div>
        )}
      </section>
      {draft && canPublish && (
        <div className="flex justify-end">
          <Button onClick={() => publish.mutate()}>{t('assessments.publish')}</Button>
        </div>
      )}
    </div>
  )
}

export function GradingPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const { assessmentId: routeId } = useParams()
  const auth = useAuth()
  const [assessmentId, setAssessmentId] = useState(routeId ?? '')
  const [gradeItem, setGradeItem] = useState<ResponseGradeView | null>(null)
  const assessments = useQuery({ queryKey: queryKeys.assessments, queryFn: assessmentApi.assessments })
  const results = useQuery({
    queryKey: queryKeys.results(assessmentId),
    queryFn: () => assessmentApi.results(assessmentId),
    enabled: Boolean(assessmentId),
  })
  const gradeMutation = useMutation({
    mutationFn: (body: { score: number; feedback: string | null; reason: string }) => assessmentApi.grade(gradeItem!.id, body),
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setGradeItem(null)
      await results.refetch()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const publishMutation = useMutation({
    mutationFn: assessmentApi.publishResult,
    onSuccess: async () => {
      toast.success(t('common.saved'))
      await results.refetch()
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  const published = (assessments.data ?? []).filter((item) => item.status !== 'DRAFT')
  return (
    <div className="space-y-5">
      <div className="flex flex-col sm:flex-row gap-3">
        <select value={assessmentId} onChange={(event) => setAssessmentId(event.target.value)} className="rounded-lg border border-neutral-200 px-3 py-2 text-sm bg-white">
          <option value="">{t('grading.selectAssessment')}</option>
          {published.map((item) => <option key={item.id} value={item.id}>{item.title}</option>)}
        </select>
      </div>
      {results.isLoading && <PageSpinner label={t('common.loading')} />}
      {results.data && results.data.length === 0 && <p className="text-sm text-neutral-500">{t('grading.noResults')}</p>}
      <div className="space-y-4">
        {(results.data ?? []).map((result) => (
          <article key={result.id} className="shell-card p-5 space-y-3">
            <header className="flex items-start justify-between gap-3">
              <div>
                <p className="font-semibold">{result.studentName}</p>
                <p className="text-sm text-neutral-500" dir="ltr">{result.studentCode} · {result.totalScore ?? t('grading.waiting')} / {result.maxScore}</p>
              </div>
              <StatusBadge value={result.status} />
            </header>
            <div className="space-y-2">
              {result.responses.map((response) => (
                <div key={response.id} className="text-sm border-b border-neutral-50 pb-2">
                  <p>{response.prompt}</p>
                  <p className="text-neutral-500">{t('grading.answer')}: {response.answer.join(', ') || t('common.dash')} · {t('grading.score')}: {response.manualScore ?? response.autoScore ?? t('grading.waiting')}</p>
                  {response.type === 'ESSAY' && auth.hasPermission('GRADING_WRITE') && (
                    <Button variant="ghost" onClick={() => setGradeItem(response)}>{t('grading.grade')}</Button>
                  )}
                </div>
              ))}
            </div>
            {result.status === 'READY' && auth.hasPermission('RESULT_PUBLISH') && (
              <Button onClick={() => publishMutation.mutate(result.id)}>{t('grading.publishResult')}</Button>
            )}
          </article>
        ))}
      </div>
      {gradeItem && (
        <GradeForm
          item={gradeItem}
          busy={gradeMutation.isPending}
          onClose={() => setGradeItem(null)}
          onSubmit={(body) => gradeMutation.mutate(body)}
        />
      )}
    </div>
  )
}

function GradeForm({
  item,
  busy,
  onClose,
  onSubmit,
}: {
  item: ResponseGradeView
  busy: boolean
  onClose: () => void
  onSubmit: (body: { score: number; feedback: string | null; reason: string }) => void
}) {
  const { t } = useTranslation()
  const [form, setForm] = useState({ score: String(item.manualScore ?? ''), feedback: item.feedback ?? '', reason: '' })
  return (
    <Modal title={t('grading.grade')} onClose={onClose}>
      <FormStack>
        <Field label={`${t('grading.score')} / ${item.points}`} type="number" value={form.score} onChange={(score) => setForm({ ...form, score })} />
        <Field label={t('grading.feedback')} value={form.feedback} onChange={(feedback) => setForm({ ...form, feedback })} required={false} />
        <Field label={t('common.reason')} value={form.reason} onChange={(reason) => setForm({ ...form, reason })} />
        <FormActions>
          <Button type="button" variant="secondary" onClick={onClose}>{t('common.cancel')}</Button>
          <Button type="button" disabled={busy} onClick={() => onSubmit({ score: Number(form.score), feedback: emptyToNull(form.feedback), reason: form.reason })}>{t('common.save')}</Button>
        </FormActions>
      </FormStack>
    </Modal>
  )
}

export type { AssessmentView }
