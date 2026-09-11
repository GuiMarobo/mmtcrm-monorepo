import { ToneChip } from '../common/ToneChip'
import type { BadgeTone } from '../../theme/tones'
import type { NegotiationStatus } from '../../types'
import { NEGOTIATION_STATUS_LABELS } from '../../types'

export { OrderStatusBadge } from '../common/OrderStatusBadge'

const STATUS_TONE: Record<NegotiationStatus, BadgeTone> = {
  ABERTA: 'blue',
  GANHA: 'green',
  PERDIDA: 'gray',
}

export function NegotiationStatusBadge({ status }: { status: NegotiationStatus }) {
  return (
    <ToneChip tone={STATUS_TONE[status]} dot>
      {NEGOTIATION_STATUS_LABELS[status]}
    </ToneChip>
  )
}
