import { formatCurrency } from '../../utils/format'
import type { Order } from '../../types'

export interface AwaitingPaymentSummary {
  total: number
  count: number
  label: string
}

export function summarizeAwaitingPayment(orders: Order[]): AwaitingPaymentSummary {
  const awaiting = orders.filter((o) => o.status === 'EM_NEGOCIACAO')
  const total = awaiting.reduce((acc, o) => acc + o.totalValue, 0)
  const count = awaiting.length
  return {
    total,
    count,
    label: `Aguardando pagamento: ${formatCurrency(total)} em ${count} ${
      count === 1 ? 'pedido' : 'pedidos'
    }`,
  }
}
