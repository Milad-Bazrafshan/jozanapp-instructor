import { Search } from 'lucide-react'
import type { ReactNode } from 'react'
import { useTranslation } from 'react-i18next'

export function Toolbar({
  query,
  onQuery,
  placeholder,
  children,
}: {
  query: string
  onQuery: (value: string) => void
  placeholder?: string
  children?: ReactNode
}) {
  const { t } = useTranslation()
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:items-center justify-between">
      <div className="relative flex-1 max-w-xs">
        <Search className="w-4 h-4 text-neutral-400 absolute start-3 top-1/2 -translate-y-1/2" />
        <input
          value={query}
          onChange={(event) => onQuery(event.target.value)}
          placeholder={placeholder || t('common.search')}
          className="w-full ps-9 pe-4 py-2 rounded-lg bg-white border border-neutral-200 text-sm text-neutral-700 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none"
        />
      </div>
      <div className="flex items-center gap-2 flex-wrap">{children}</div>
    </div>
  )
}

export function FilterPills({
  value,
  onChange,
  options,
}: {
  value: string
  onChange: (value: string) => void
  options: Array<{ id: string; label: string }>
}) {
  return (
    <div className="flex items-center gap-1 bg-white border border-neutral-200 rounded-lg p-0.5">
      {options.map((option) => (
        <button
          key={option.id}
          type="button"
          onClick={() => onChange(option.id)}
          className={`px-3 py-1.5 rounded-md text-sm font-medium transition-colors ${
            value === option.id ? 'bg-neutral-900 text-white' : 'text-neutral-500 hover:text-neutral-900'
          }`}
        >
          {option.label}
        </button>
      ))}
    </div>
  )
}
