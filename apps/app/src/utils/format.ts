export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleDateString('pt-BR')
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  return d.toLocaleString('pt-BR', { dateStyle: 'short', timeStyle: 'short' })
}

const MINUTE_MS = 60 * 1000
const HOUR_MS = 60 * MINUTE_MS
export const DAY_MS = 24 * HOUR_MS

const RELATIVE_UNITS: [Intl.RelativeTimeFormatUnit, number][] = [
  ['year', 365 * DAY_MS],
  ['month', 30 * DAY_MS],
  ['day', DAY_MS],
  ['hour', HOUR_MS],
  ['minute', MINUTE_MS],
]

const relativeTimeFormat = new Intl.RelativeTimeFormat('pt-BR', { numeric: 'auto' })

export function formatRelativeTime(iso: string | null | undefined, now: Date = new Date()): string {
  if (!iso) return '-'
  const d = new Date(iso)
  if (Number.isNaN(d.getTime())) return '-'
  const elapsed = now.getTime() - d.getTime()
  const match = RELATIVE_UNITS.find(([, size]) => Math.abs(elapsed) >= size)
  if (!match) return 'agora'
  const [unit, size] = match
  return relativeTimeFormat.format(-Math.trunc(elapsed / size), unit)
}

export function formatIsoDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-')
  return `${day}/${month}/${year}`
}

export function plural(count: number, one: string, many: string): string {
  return count === 1 ? one : many
}

export function formatCurrency(value: number): string {
  return value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

export function formatPercent(value: number): string {
  return `${value.toLocaleString('pt-BR')}%`
}

export function onlyDigits(value: string | null | undefined): string {
  return (value ?? '').replace(/\D/g, '')
}

export const MAX_MONEY = 9_999_999_999.99

export const MAX_INTEGER = 2_147_483_647

export function parseCurrencyInput(raw: string): number | null {
  const digits = onlyDigits(raw).replace(/^0+/, '')
  return digits ? Number(digits) / 100 : null
}

export function sanitizeInteger(raw: string): string {
  return onlyDigits(raw).replace(/^0+(?=\d)/, '').slice(0, 10)
}

export function sanitizeDecimal(raw: string, decimals = 2): string {
  const cleaned = raw.replace(/[^\d.,]/g, '').replace(/^0+(?=\d)/, '')
  const separator = cleaned.search(/[.,]/)
  if (separator === -1) return cleaned
  const integer = cleaned.slice(0, separator)
  const fraction = onlyDigits(cleaned.slice(separator + 1)).slice(0, decimals)
  return `${integer}${cleaned[separator]}${fraction}`
}

export function parseDecimal(raw: string): number {
  return raw.trim() ? Number(raw.replace(',', '.')) : Number.NaN
}

export function maskPhone(value: string | null | undefined): string {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length === 0) return ''
  if (d.length <= 2) return `(${d}`
  if (d.length <= 6) return `(${d.slice(0, 2)}) ${d.slice(2)}`
  if (d.length <= 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`
  return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7, 11)}`
}

export function maskCnpj(value: string | null | undefined): string {
  const d = onlyDigits(value).slice(0, 14)
  if (d.length === 0) return ''
  let out = d.slice(0, 2)
  if (d.length > 2) out += '.' + d.slice(2, 5)
  if (d.length > 5) out += '.' + d.slice(5, 8)
  if (d.length > 8) out += '/' + d.slice(8, 12)
  if (d.length > 12) out += '-' + d.slice(12, 14)
  return out
}

export function maskCpf(value: string | null | undefined): string {
  const d = onlyDigits(value).slice(0, 11)
  if (d.length === 0) return ''
  let out = d.slice(0, 3)
  if (d.length > 3) out += '.' + d.slice(3, 6)
  if (d.length > 6) out += '.' + d.slice(6, 9)
  if (d.length > 9) out += '-' + d.slice(9, 11)
  return out
}
