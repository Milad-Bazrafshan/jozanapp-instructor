import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { instructorApi } from '@/api/instructor'
import { queryKeys } from '@/api/queryKeys'
import { Button } from '@/components/ui/Button'
import { Cell, DataTable } from '@/components/ui/DataTable'
import { Field, SelectField, TextArea } from '@/components/ui/Field'
import { FormActions, FormStack } from '@/components/ui/Form'
import { Modal } from '@/components/ui/Modal'
import { PageSpinner, QueryError } from '@/components/ui/Spinner'
import { useToast } from '@/components/ui/Toast'

export function InstructorAnnouncementsPage() {
  const { t } = useTranslation()
  const toast = useToast()
  const client = useQueryClient()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [body, setBody] = useState('')
  const [classSectionId, setClassSectionId] = useState('')
  const [channel, setChannel] = useState('IN_APP')
  const classes = useQuery({ queryKey: queryKeys.instructorClasses, queryFn: instructorApi.classes })
  const list = useQuery({ queryKey: queryKeys.announcements, queryFn: instructorApi.announcements })
  const create = useMutation({
    mutationFn: () => instructorApi.createAnnouncement({
      title,
      body,
      audienceType: 'CLASS',
      audienceRef: classSectionId,
      channel,
    }),
    onSuccess: async () => {
      toast.success(t('common.saved'))
      setOpen(false)
      setTitle('')
      setBody('')
      await client.invalidateQueries({ queryKey: queryKeys.announcements })
    },
    onError: (error) => toast.error(error instanceof Error ? error.message : t('common.retry')),
  })
  if (list.isLoading) return <PageSpinner label={t('common.loading')} />
  if (list.error) return <QueryError message={list.error.message} onRetry={() => void list.refetch()} />
  return (
    <div className="space-y-5">
      <div className="flex justify-end">
        <Button onClick={() => setOpen(true)}>{t('announcements.write')}</Button>
      </div>
      <DataTable
        rows={list.data ?? []}
        columns={[
          { key: 'title', header: t('common.name'), render: (row) => <Cell title={row.title} detail={row.body} /> },
          { key: 'channel', header: t('common.type'), render: (row) => row.channel },
          { key: 'status', header: t('common.status'), render: (row) => row.status },
        ]}
      />
      {open && (
        <Modal title={t('announcements.write')} onClose={() => setOpen(false)}>
          <FormStack>
            <Field label={t('common.name')} value={title} onChange={setTitle} />
            <TextArea label={t('common.description')} value={body} onChange={setBody} />
            <SelectField
              label={t('nav.classes')}
              value={classSectionId}
              onChange={setClassSectionId}
              options={(classes.data ?? []).map((item) => [item.id, item.name] as [string, string])}
            />
            <SelectField
              label={t('announcements.channel')}
              value={channel}
              onChange={setChannel}
              options={[['IN_APP', 'IN_APP'], ['SMS', 'SMS'], ['BOTH', 'BOTH']]}
            />
            <FormActions>
              <Button variant="secondary" onClick={() => setOpen(false)}>{t('common.cancel')}</Button>
              <Button disabled={!title || !body || !classSectionId || create.isPending} onClick={() => create.mutate()}>{t('common.submit')}</Button>
            </FormActions>
          </FormStack>
        </Modal>
      )}
    </div>
  )
}
