import { NegotiationsTable } from './NegotiationsTable'
import { SectionCard } from '../common/SectionCard'
import type { Negotiation, NegotiationDetail, NegotiationStatus } from '../../types'

interface NegotiationListViewProps {
  items: Negotiation[]
  loading: boolean
  loadDetail: (id: number) => Promise<NegotiationDetail>
  onEdit: (negotiation: Negotiation) => void
  onRequestTransition: (negotiation: Negotiation, target: NegotiationStatus) => void
  onDelete: (negotiation: Negotiation) => void
  pageResetKey?: string
}

export function NegotiationListView({
  items,
  loading,
  loadDetail,
  onEdit,
  onRequestTransition,
  onDelete,
  pageResetKey,
}: NegotiationListViewProps) {
  return (
    <SectionCard>
      <NegotiationsTable
        rows={items}
        loading={loading}
        loadDetail={loadDetail}
        onEdit={onEdit}
        onRequestTransition={onRequestTransition}
        onDelete={onDelete}
        pageResetKey={pageResetKey}
      />
    </SectionCard>
  )
}
