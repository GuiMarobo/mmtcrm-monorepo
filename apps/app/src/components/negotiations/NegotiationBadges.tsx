import { ToneChip } from '../common/ToneChip'
import type { BadgeTone } from '../../theme/tones'
import type { NegotiationStatus, OrderStatus } from '../../types'
import { NEGOTIATION_STATUS_LABELS, ORDER_STATUS_LABELS } from '../../types'

const STATUS_TONE: Record<NegotiationStatus, BadgeTone> = {
  ABERTA: 'blue',
  GANHA: 'green',
  PERDIDA: 'gray',
}

const ORDER_TONE: Record<OrderStatus, BadgeTone> = {
  EM_NEGOCIACAO: 'amber',
  COMPRA_APROVADA: 'green',
  DESISTENCIA: 'red',
}

export function NegotiationStatusBadge({ status }: { status: NegotiationStatus }) {
  return (
    <ToneChip tone={STATUS_TONE[status]} dot>
      {NEGOTIATION_STATUS_LABELS[status]}
    </ToneChip>
  )
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <ToneChip tone={ORDER_TONE[status]}>{ORDER_STATUS_LABELS[status]}</ToneChip>
}
