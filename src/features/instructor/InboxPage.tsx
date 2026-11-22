import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { instructorApi } from '@/api/instructor'
import { queryKeys } from '@/api/queryKeys'
import { Button } from '@/components/ui/Button'
import { PageSpinner, QueryError } from '@/components/ui/Spinner'
import { PageStack, ShellCard } from '@/components/ui/Shell'
import { formatDate, useLocale } from '@/lib/format'

export function InstructorInboxPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const client = useQueryClient()
  const inbox = useQuery({ queryKey: queryKeys.inbox, queryFn: instructorApi.inbox })
  const read = useMutation({
    mutationFn: instructorApi.markRead,
    onSuccess: () => client.invalidateQueries({ queryKey: queryKeys.inbox }),
  })
  if (inbox.isLoading) return <PageSpinner label={t('common.loading')} />
  if (inbox.error) return <QueryError message={inbox.error.message} onRetry={() => void inbox.refetch()} />
  const items = inbox.data?.items ?? []
  return (
    <PageStack className="space-y-3">
      <p className="text-sm text-slate-500">{t('inbox.unread', { count: inbox.data?.unread ?? 0 })}</p>
      {items.length === 0 ? <p className="text-sm text-slate-500">{t('common.empty')}</p> : null}
      {items.map((item) => (
        <ShellCard key={item.id} className={`p-4 ${item.readAt ? '' : 'ring-2 ring-indigo-100 border-indigo-100'}`}>
          <div className="flex items-start justify-between gap-3">
            <div>
              <h3 className="font-semibold text-slate-900">{item.title}</h3>
              <p className="text-sm text-slate-600 mt-1 whitespace-pre-wrap">{item.body}</p>
              <p className="text-xs text-slate-400 mt-2">{formatDate(item.createdAt, locale)}</p>
            </div>
            {!item.readAt ? <Button variant="ghost" onClick={() => read.mutate(item.id)}>{t('inbox.markRead')}</Button> : null}
          </div>
        </ShellCard>
      ))}
    </PageStack>
  )
}
