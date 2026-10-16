import { useMemo, useState } from 'react'
import { NegotiationsTable } from './NegotiationsTable'
import { matchesQuery } from '../common/dataTableUtils'
import { SearchField } from '../common/SearchField'
import { SectionCard, SectionToolbar } from '../common/SectionCard'
import { formatCurrency, formatDate } from '../../utils/format'
import type { Negotiation, NegotiationDetail, NegotiationStatus } from '../../types'
import { NEGOTIATION_STATUS_LABELS } from '../../types'

interface NegotiationListViewProps {
  items: Negotiation[]
  loading: boolean
  loadDetail: (id: number) => Promise<NegotiationDetail>
  onEdit: (negotiation: Negotiation) => void
  onRequestTransition: (negotiation: Negotiation, target: NegotiationStatus) => void
  onDelete: (negotiation: Negotiation) => void
}

const searchValues = (negotiation: Negotiation) => [
  negotiation.client?.name,
  negotiation.vendedor?.name,
  negotiation.order?.code,
  NEGOTIATION_STATUS_LABELS[negotiation.status],
  formatCurrency(negotiation.totalValue),
  formatDate(negotiation.updatedAt),
  negotiation.notes,
]

export function NegotiationListView({
  items,
  loading,
  loadDetail,
  onEdit,
  onRequestTransition,
  onDelete,
}: NegotiationListViewProps) {
  const [query, setQuery] = useState('')
  const visible = useMemo(
    () => items.filter((negotiation) => matchesQuery(searchValues(negotiation), query)),
    [items, query],
  )

  return (
    <SectionCard>
      <SectionToolbar>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Buscar por cliente, vendedor ou pedido…"
        />
      </SectionToolbar>

      <NegotiationsTable
        rows={visible}
        loading={loading}
        loadDetail={loadDetail}
        onEdit={onEdit}
        onRequestTransition={onRequestTransition}
        onDelete={onDelete}
      />
    </SectionCard>
  )
}
