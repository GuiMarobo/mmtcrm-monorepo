import { matchesQuery } from '../common/dataTableUtils'
import { formatCurrency, formatDate } from '../../utils/format'
import type { Negotiation } from '../../types'
import { NEGOTIATION_STATUS_LABELS } from '../../types'

const searchValues = (negotiation: Negotiation) => [
  negotiation.client?.name,
  negotiation.vendedor?.name,
  negotiation.order?.code,
  NEGOTIATION_STATUS_LABELS[negotiation.status],
  formatCurrency(negotiation.totalValue),
  formatDate(negotiation.updatedAt),
  negotiation.notes,
]

export function filterNegotiations(items: Negotiation[], query: string): Negotiation[] {
  return items.filter((negotiation) => matchesQuery(searchValues(negotiation), query))
}
