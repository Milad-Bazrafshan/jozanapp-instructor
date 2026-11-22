import type { InputHTMLAttributes } from 'react'
import { useEffect, useState } from 'react'
import { useLocale } from '@/lib/format'
import { isoToJalaliDisplay, parseJalaliToIso } from '@/lib/jalali'

export function Field({
  label,
  value,
  onChange,
  required = true,
  hint,
  className = '',
  type,
  ...props
}: {
  label: string
  value: string | number
  onChange: (value: string) => void
  required?: boolean
  hint?: string
} & Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange' | 'type'>) {
  const { language } = useLocale()
  const isoValue = String(value)
  const [jalaliText, setJalaliText] = useState(() => isoToJalaliDisplay(isoValue))

  useEffect(() => {
    if (type === 'date' && language === 'fa') setJalaliText(isoToJalaliDisplay(isoValue))
  }, [isoValue, type, language])

  if (type === 'date' && language === 'fa') {
    return (
      <label className="block text-sm font-medium text-neutral-700">
        <span className="mb-1.5 block">{label}</span>
        <input
          value={jalaliText}
          onChange={(event) => setJalaliText(event.target.value)}
          onBlur={() => {
            const parsed = parseJalaliToIso(jalaliText)
            if (parsed) {
              onChange(parsed)
              setJalaliText(isoToJalaliDisplay(parsed))
            } else {
              setJalaliText(isoToJalaliDisplay(isoValue))
            }
          }}
          placeholder="1404/08/15"
          inputMode="numeric"
          required={required}
          className={`w-full px-3 py-2 rounded-lg bg-white border border-neutral-200 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-indigo-400 focus:outline-none focus:ring-2 focus:ring-indigo-100 transition-colors ltr-field ${className}`}
          {...props}
        />
        {hint ? <span className="block mt-1 text-xs text-neutral-400">{hint}</span> : null}
      </label>
    )
  }

  return (
    <label className="block text-sm font-medium text-neutral-700">
      <span className="mb-1.5 block">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className={`w-full px-3 py-2 rounded-lg bg-white border border-neutral-200 text-sm text-neutral-800 placeholder:text-neutral-400 focus:border-neutral-400 focus:outline-none transition-colors ${className}`}
        {...props}
      />
      {hint ? <span className="block mt-1 text-xs text-neutral-400">{hint}</span> : null}
    </label>
  )
}

export function TextArea({
  label,
  value,
  onChange,
  required = true,
  rows = 4,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  required?: boolean
  rows?: number
}) {
  return (
    <label className="block text-sm font-medium text-neutral-700">
      <span className="mb-1.5 block">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        rows={rows}
        className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-200 text-sm text-neutral-800 focus:border-neutral-400 focus:outline-none transition-colors"
      />
    </label>
  )
}

export function SelectField({
  label,
  value,
  onChange,
  options,
  required = true,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: Array<[string, string] | readonly string[]>
  required?: boolean
}) {
  return (
    <label className="block text-sm font-medium text-neutral-700">
      <span className="mb-1.5 block">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        required={required}
        className="w-full px-3 py-2 rounded-lg bg-white border border-neutral-200 text-sm text-neutral-800 focus:border-neutral-400 focus:outline-none transition-colors"
      >
        {options.map(([key, text]) => (
          <option key={key} value={key}>
            {text}
          </option>
        ))}
      </select>
    </label>
  )
}

export function Check({
  label,
  checked,
  onChange,
}: {
  label: string
  checked: boolean
  onChange: (checked: boolean) => void
}) {
  return (
    <label className="flex items-center gap-2 text-sm text-neutral-700">
      <input
        type="checkbox"
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
        className="rounded border-neutral-300"
      />
      {label}
    </label>
  )
}
