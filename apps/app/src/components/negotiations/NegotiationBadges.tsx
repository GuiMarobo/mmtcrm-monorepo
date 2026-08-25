import { Badge } from '../ui'
import type { BadgeTone } from '../ui'
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

export function NegotiationStatusBadge({
  status,
}: {
  status: NegotiationStatus
}) {
  return (
    <Badge tone={STATUS_TONE[status]} dot>
      {NEGOTIATION_STATUS_LABELS[status]}
    </Badge>
  )
}

export function OrderStatusBadge({ status }: { status: OrderStatus }) {
  return <Badge tone={ORDER_TONE[status]}>{ORDER_STATUS_LABELS[status]}</Badge>
}
