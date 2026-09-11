import { ToneChip } from './ToneChip'
import type { BadgeTone } from '../../theme/tones'
import type { OrderStatus } from '../../types'
import { ORDER_STATUS_LABELS } from '../../types'

const ORDER_TONE: Record<OrderStatus, BadgeTone> = {
  EM_NEGOCIACAO: 'amber',
  COMPRA_APROVADA: 'green',
  DESISTENCIA: 'red',
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <ToneChip tone={ORDER_TONE[status]}>{ORDER_STATUS_LABELS[status]}</ToneChip>
}
