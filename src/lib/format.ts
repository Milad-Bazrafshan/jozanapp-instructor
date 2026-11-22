import { useTranslation } from 'react-i18next'
import { isoToJalaliDisplay } from './jalali'

export function useLocale() {
  const { i18n } = useTranslation()
  const language = i18n.language.startsWith('en') ? 'en' : 'fa'
  const locale = language === 'fa' ? 'fa-IR' : 'en-US'
  const dir = language === 'fa' ? 'rtl' : 'ltr'
  return { language, locale, dir }
}

export function formatDate(value: string | null | undefined, locale: string) {
  if (!value) return '—'
  if (locale.startsWith('fa') && value.length >= 10) {
    const jalali = isoToJalaliDisplay(value.slice(0, 10))
    if (jalali) {
      if (value.length <= 10) return jalali
      const date = new Date(value)
      if (!Number.isNaN(date.getTime())) {
        const time = date.toLocaleTimeString(locale, { hour: '2-digit', minute: '2-digit' })
        return `${jalali} · ${time}`
      }
      return jalali
    }
  }
  const date = value.length <= 10 ? new Date(`${value}T00:00:00`) : new Date(value)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleString(locale, { dateStyle: 'medium', timeStyle: value.length > 10 ? 'short' : undefined })
}

export function formatDay(value: string | null | undefined, locale: string) {
  if (!value) return '—'
  const date = new Date(`${value}T00:00:00`)
  if (Number.isNaN(date.getTime())) return value
  return date.toLocaleDateString(locale)
}

export function personName(person: { firstName: string; lastName: string }) {
  return `${person.firstName} ${person.lastName}`.trim()
}

export function emptyToNull(value: string | null | undefined) {
  const trimmed = value?.trim()
  return trimmed ? trimmed : null
}

export function initials(name: string) {
  return name
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join('')
    .toUpperCase()
}

export function localDateTimeValue(date = new Date()) {
  return new Date(date.getTime() - date.getTimezoneOffset() * 60000).toISOString().slice(0, 16)
}

export function todayIso() {
  return new Date().toISOString().slice(0, 10)
}

export function formatMoney(value: string | number | null | undefined, locale: string) {
  if (value === null || value === undefined || value === '') return '—'
  const amount = typeof value === 'number' ? value : Number(value)
  if (Number.isNaN(amount)) return String(value)
  const formatted = new Intl.NumberFormat(locale, { maximumFractionDigits: 0 }).format(amount)
  return locale.startsWith('fa') ? `${formatted} ریال` : `${formatted} IRR`
}
