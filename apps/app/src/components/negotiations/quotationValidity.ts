import { formatIsoDate } from '../../utils/format'

export const MAX_VALIDITY_AHEAD_DAYS = 90

const pad = (value: number) => String(value).padStart(2, '0')

export function validityDateFrom(today: Date, days: number): string {
  const date = new Date(today.getFullYear(), today.getMonth(), today.getDate() + days)
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`
}

export function validUntilError(value: string, today: Date): string | undefined {
  if (!value) return 'Informe a validade.'
  const earliest = validityDateFrom(today, 1)
  const latest = validityDateFrom(today, MAX_VALIDITY_AHEAD_DAYS)
  if (value < earliest || value > latest) {
    return `De ${formatIsoDate(earliest)} a ${formatIsoDate(latest)}.`
  }
  return undefined
}
