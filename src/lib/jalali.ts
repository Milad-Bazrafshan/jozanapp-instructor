/** Jalali ↔ Gregorian conversion (jalaali algorithm, local calendar dates). */

export type JalaliParts = { jy: number; jm: number; jd: number }
export type GregorianParts = { gy: number; gm: number; gd: number }

function div(a: number, b: number) {
  return Math.trunc(a / b)
}

function mod(a: number, b: number) {
  return a - div(a, b) * b
}

export function toJalaali(gy: number, gm: number, gd: number): JalaliParts {
  const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let jy = gy <= 1600 ? 0 : 979
  gy -= gy <= 1600 ? 621 : 1600
  const gy2 = gm > 2 ? gy + 1 : gy
  let days =
    365 * gy +
    div(gy2 + 3, 4) -
    div(gy2 + 99, 100) +
    div(gy2 + 399, 400) -
    80 +
    gd +
    gDaysInMonth.slice(0, gm - 1).reduce((sum, n) => sum + n, 0)
  jy += 33 * div(days, 12053)
  days = mod(days, 12053)
  jy += 4 * div(days, 1461)
  days = mod(days, 1461)
  jy += div(days - 1, 365)
  if (days > 365) days = (days - 1) % 365
  const jm = days < 186 ? 1 + div(days, 31) : 7 + div(days - 186, 30)
  const jd = 1 + mod(days, jm < 7 ? 31 : 30)
  return { jy, jm, jd }
}

export function toGregorian(jy: number, jm: number, jd: number): GregorianParts {
  let gy = jy <= 979 ? 621 : 1600
  jy -= jy <= 979 ? 0 : 979
  let days = 365 * jy + div(jy, 33) * 8 + div(mod(jy, 33) + 3, 4)
  for (let i = 0; i < jm - 1; i += 1) days += i < 6 ? 31 : 30
  days += jd
  gy += 400 * div(days, 146097)
  days = mod(days, 146097)
  if (days > 36524) {
    gy += 100 * div(--days, 36524)
    days = mod(days, 36524)
    if (days >= 365) days += 1
  }
  gy += 4 * div(days, 1461)
  days = mod(days, 1461)
  if (days > 365) {
    gy += div(days - 1, 365)
    days = (days - 1) % 365
  }
  const gDaysInMonth = [31, 28, 31, 30, 31, 30, 31, 31, 30, 31, 30, 31]
  let gm = 0
  while (gm < 12 && days >= gDaysInMonth[gm]) {
    days -= gDaysInMonth[gm]
    gm += 1
  }
  return { gy, gm: gm + 1, gd: days + 1 }
}

export function jalaliMonthLength(jy: number, jm: number) {
  if (jm <= 6) return 31
  if (jm <= 11) return 30
  return isJalaliLeap(jy) ? 30 : 29
}

export function isJalaliLeap(jy: number) {
  const r = mod(mod(jy + 38, 33) + 1, 4)
  return r === 0 || r === 1
}

export function isoToJalaliDisplay(iso: string): string {
  if (!iso || iso.length < 10) return ''
  const gy = Number(iso.slice(0, 4))
  const gm = Number(iso.slice(5, 7))
  const gd = Number(iso.slice(8, 10))
  if (Number.isNaN(gy) || Number.isNaN(gm) || Number.isNaN(gd)) return ''
  const j = toJalaali(gy, gm, gd)
  return `${j.jy}/${String(j.jm).padStart(2, '0')}/${String(j.jd).padStart(2, '0')}`
}

export function parseJalaliToIso(input: string): string | null {
  const normalized = input.trim().replace(/-/g, '/').replace(/\s+/g, '')
  const match = normalized.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/)
  if (!match) return null
  const jy = Number(match[1])
  const jm = Number(match[2])
  const jd = Number(match[3])
  if (jm < 1 || jm > 12 || jd < 1 || jd > jalaliMonthLength(jy, jm)) return null
  const g = toGregorian(jy, jm, jd)
  return `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`
}

export function gregorianIsoFromJalali(jy: number, jm: number, jd: number): string {
  const g = toGregorian(jy, jm, jd)
  return `${g.gy}-${String(g.gm).padStart(2, '0')}-${String(g.gd).padStart(2, '0')}`
}

export function jalaliFromGregorianIso(iso: string): JalaliParts | null {
  if (!iso || iso.length < 10) return null
  return toJalaali(Number(iso.slice(0, 4)), Number(iso.slice(5, 7)), Number(iso.slice(8, 10)))
}

export const jalaliWeekdayLabelsFa = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] as const

/** Saturday = 0 … Friday = 6 (Iran week). */
export function jalaliWeekdayIndex(iso: string): number {
  const date = new Date(`${iso.slice(0, 10)}T12:00:00`)
  return (date.getDay() + 1) % 7
}

export function jalaliMonthLabel(jy: number, jm: number, locale: string) {
  const monthNamesFa = [
    'فروردین', 'اردیبهشت', 'خرداد', 'تیر', 'مرداد', 'شهریور',
    'مهر', 'آبان', 'آذر', 'دی', 'بهمن', 'اسفند',
  ]
  if (locale.startsWith('fa')) return `${monthNamesFa[jm - 1]} ${jy}`
  return `${jy}/${String(jm).padStart(2, '0')}`
}
