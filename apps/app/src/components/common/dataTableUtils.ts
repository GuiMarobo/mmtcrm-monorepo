export type SortDirection = 'asc' | 'desc'

export type SortValue = string | number

function compare(left: SortValue, right: SortValue): number {
  if (typeof left === 'number' && typeof right === 'number') return left - right
  return String(left).localeCompare(String(right), 'pt-BR', { numeric: true })
}

export function sortRows<T>(
  rows: readonly T[],
  valueOf: (row: T) => SortValue,
  direction: SortDirection,
): T[] {
  const sign = direction === 'asc' ? 1 : -1
  return [...rows].sort((a, b) => compare(valueOf(a), valueOf(b)) * sign)
}

const normalize = (text: string) =>
  text.normalize('NFD').replace(/[̀-ͯ]/g, '').toLowerCase()

export function matchesQuery(
  values: ReadonlyArray<string | number | null | undefined>,
  query: string,
): boolean {
  const terms = normalize(query).split(/\s+/).filter(Boolean)
  if (terms.length === 0) return true
  const haystack = values
    .filter((value) => value !== null && value !== undefined && value !== '')
    .map((value) => normalize(String(value)))
    .join(' ')
  return terms.every((term) => haystack.includes(term))
}
