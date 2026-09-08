import { useState } from 'react'
import { NegotiationsDataGrid } from './NegotiationsDataGrid'
import { SearchField } from '../common/SearchField'
import { SectionCard, SectionToolbar } from '../common/SectionCard'
import type { Negotiation, NegotiationStatus } from '../../types'

interface NegotiationListViewProps {
  items: Negotiation[]
  loading: boolean
  onEdit: (negotiation: Negotiation) => void
  onRequestTransition: (negotiation: Negotiation, target: NegotiationStatus) => void
  onDelete: (negotiation: Negotiation) => void
}

export function NegotiationListView({
  items,
  loading,
  onEdit,
  onRequestTransition,
  onDelete,
}: NegotiationListViewProps) {
  const [query, setQuery] = useState('')

  return (
    <SectionCard>
      <SectionToolbar>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Buscar por cliente, vendedor ou pedido…"
        />
      </SectionToolbar>

      <NegotiationsDataGrid
        rows={items}
        loading={loading}
        quickFilter={query}
        onEdit={onEdit}
        onRequestTransition={onRequestTransition}
        onDelete={onDelete}
      />
    </SectionCard>
  )
}
