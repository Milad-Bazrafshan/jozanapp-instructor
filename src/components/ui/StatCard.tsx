import type { LucideIcon } from 'lucide-react'
import { shellCard } from './Shell'

export function StatCard({
  icon: Icon,
  label,
  value,
}: {
  icon: LucideIcon
  label: string
  value: string | number
}) {
  return (
    <div className={`${shellCard} p-5 hover:shadow-soft hover:border-indigo-100 transition-all duration-200 group`}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-indigo-50 flex items-center justify-center group-hover:bg-indigo-100 transition-colors">
          <Icon className="w-5 h-5 text-indigo-700" strokeWidth={2} />
        </div>
      </div>
      <p className="text-2xl font-bold text-slate-900 tracking-tight" dir="ltr">
        {value}
      </p>
      <p className="text-sm text-slate-500 mt-1">{label}</p>
    </div>
  )
}
