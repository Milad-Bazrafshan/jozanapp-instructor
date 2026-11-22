import { useState } from 'react'
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { useTranslation } from 'react-i18next'
import { instructorApi } from '@/api/instructor'
import { queryKeys } from '@/api/queryKeys'
import { useAuth } from '@/auth/useAuth'
import { Button } from '@/components/ui/Button'
import { Field } from '@/components/ui/Field'
import { PageSpinner, QueryError } from '@/components/ui/Spinner'
import { ShellCard } from '@/components/ui/Shell'
import { formatDate, useLocale } from '@/lib/format'

export function InstructorChatPage() {
  const { t } = useTranslation()
  const { locale } = useLocale()
  const auth = useAuth()
  const client = useQueryClient()
  const [roomId, setRoomId] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
  const rooms = useQuery({ queryKey: queryKeys.chat, queryFn: instructorApi.chatRooms })
  const partners = useQuery({ queryKey: [...queryKeys.chat, 'partners'], queryFn: instructorApi.chatPartners })
  const messages = useQuery({
    queryKey: [...queryKeys.chat, roomId],
    queryFn: () => instructorApi.messages(roomId!),
    enabled: Boolean(roomId),
  })
  const open = useMutation({
    mutationFn: instructorApi.openChat,
    onSuccess: async (room) => {
      setRoomId(room.id)
      await client.invalidateQueries({ queryKey: queryKeys.chat })
    },
  })
  const send = useMutation({
    mutationFn: () => instructorApi.sendMessage(roomId!, draft),
    onSuccess: async () => {
      setDraft('')
      await messages.refetch()
    },
  })
  if (rooms.isLoading) return <PageSpinner label={t('common.loading')} />
  if (rooms.error) return <QueryError message={rooms.error.message} onRetry={() => void rooms.refetch()} />
  const me = auth.session?.user.membershipId
  return (
    <div className="grid lg:grid-cols-[280px_1fr] gap-4 min-h-[480px]">
      <ShellCard className="p-3 space-y-2">
        {(rooms.data ?? []).map((room) => (
          <button key={room.id} type="button" onClick={() => setRoomId(room.id)} className={`w-full text-start rounded-xl px-3 py-2 ${roomId === room.id ? 'bg-indigo-50 text-indigo-900' : 'hover:bg-slate-50'}`}>
            <p className="font-medium text-sm">{room.studentName}</p>
            <p className="text-xs text-slate-500">{room.className}</p>
          </button>
        ))}
        <p className="text-xs text-slate-400 pt-2">{t('chat.new')}</p>
        {(partners.data ?? []).map((partner) => (
          <Button
            key={`${partner.studentId}-${partner.guardianMembershipId}`}
            variant="ghost"
            className="w-full justify-start"
            onClick={() => open.mutate({ studentId: partner.studentId, guardianMembershipId: partner.guardianMembershipId, instructorMembershipId: partner.instructorMembershipId })}
          >
            {partner.studentName} · {partner.guardianName}
          </Button>
        ))}
      </ShellCard>
      <ShellCard className="p-4 flex flex-col min-h-[480px]">
        <div className="flex-1 space-y-3 overflow-y-auto">
          {(messages.data ?? []).map((item) => (
            <div key={item.id} className={`max-w-[80%] rounded-xl px-3 py-2 text-sm ${item.senderMembershipId === me ? 'ms-auto bg-indigo-600 text-white' : 'bg-slate-100 text-slate-800'}`}>
              <p>{item.body}</p>
              <p className={`text-[11px] mt-1 ${item.senderMembershipId === me ? 'text-indigo-100' : 'text-slate-400'}`}>{formatDate(item.createdAt, locale)}</p>
            </div>
          ))}
        </div>
        {roomId ? (
          <form className="mt-4 flex gap-2" onSubmit={(event) => { event.preventDefault(); if (draft.trim()) send.mutate() }}>
            <Field label="" value={draft} onChange={setDraft} />
            <Button type="submit" disabled={send.isPending}>{t('chat.send')}</Button>
          </form>
        ) : <p className="text-sm text-slate-500">{t('chat.pick')}</p>}
      </ShellCard>
    </div>
  )
}
