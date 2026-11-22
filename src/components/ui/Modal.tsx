import { useEffect, type ReactNode } from 'react'
import { X } from 'lucide-react'
import { shellCard } from './Shell'

export function Modal({
  title,
  eyebrow,
  onClose,
  children,
  wide,
}: {
  title: string
  eyebrow?: string
  onClose: () => void
  children: ReactNode
  wide?: boolean
}) {
  useEffect(() => {
    const onKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [onClose])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4" onMouseDown={onClose}>
      <div className="absolute inset-0 bg-slate-900/40 backdrop-blur-sm" />
      <div
        className={`relative ${shellCard} shadow-soft w-full ${wide ? 'max-w-3xl' : 'max-w-lg'} max-h-[90vh] overflow-y-auto`}
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
      >
        <header className="flex items-start justify-between gap-4 px-5 py-4 border-b border-slate-100">
          <div>
            {eyebrow ? <span className="text-xs uppercase tracking-wide text-slate-400">{eyebrow}</span> : null}
            <h2 id="modal-title" className="text-lg font-semibold text-slate-900">
              {title}
            </h2>
          </div>
          <button type="button" onClick={onClose} className="p-2 rounded-xl text-slate-500 hover:bg-slate-100">
            <X className="w-4 h-4" />
          </button>
        </header>
        <div className="p-5">{children}</div>
      </div>
    </div>
  )
}
