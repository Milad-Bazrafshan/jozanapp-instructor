import type { ReactNode } from 'react'

/** Shared glass panel styling (counselor workspace and app-wide). */
export const shellCard =
  'rounded-2xl border border-white/60 bg-white/90 backdrop-blur-sm shadow-card'

export const shellInset = 'rounded-xl border border-slate-100 bg-slate-50/80'

export function ShellCard({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`${shellCard} ${className}`}>{children}</div>
}

export function PageStack({ className = '', children }: { className?: string; children: ReactNode }) {
  return <div className={`space-y-6 ${className}`}>{children}</div>
}
