import type { NegotiationStatus } from '../../types'

const RECEIVED_LABELS: Record<NegotiationStatus, string> = {
  ABERTA: 'Em negociação',
  GANHA: 'Recebido',
  PERDIDA: 'Não recebido',
}

export const receivedLabel = (status: NegotiationStatus) => RECEIVED_LABELS[status]
