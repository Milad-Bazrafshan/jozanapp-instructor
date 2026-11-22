import { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Button } from './Button'
import { Field } from './Field'
import { Modal } from './Modal'

export function ConfirmDialog({
  title,
  message,
  confirmLabel,
  danger,
  requireReason,
  onConfirm,
  onClose,
}: {
  title: string
  message?: string
  confirmLabel?: string
  danger?: boolean
  requireReason?: boolean
  onConfirm: (reason?: string) => void | Promise<unknown>
  onClose: () => void
}) {
  const { t } = useTranslation()
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit() {
    if (requireReason && !reason.trim()) return
    setBusy(true)
    try {
      await onConfirm(reason.trim() || undefined)
    } finally {
      setBusy(false)
    }
  }

  return (
    <Modal title={title} onClose={onClose}>
      {message ? <p className="text-sm text-neutral-600 mb-4">{message}</p> : null}
      {requireReason ? (
        <Field label={t('common.reason')} value={reason} onChange={setReason} />
      ) : null}
      <div className="flex justify-end gap-2 mt-5">
        <Button type="button" variant="secondary" onClick={onClose}>
          {t('common.cancel')}
        </Button>
        <Button type="button" variant={danger ? 'danger' : 'primary'} disabled={busy} onClick={() => void submit()}>
          {confirmLabel || t('common.confirm')}
        </Button>
      </div>
    </Modal>
  )
}
