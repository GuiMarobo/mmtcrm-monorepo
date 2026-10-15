import type { ClientStatus, OrderStatus, PaymentMethod } from './enums'
import type { NegotiationItem } from './negotiation.types'

export interface OrderClient {
  id: string
  name: string
  status: ClientStatus
}

export interface OrderVendedor {
  id: number
  name: string
}

export interface Order {
  id: number
  code: string
  status: OrderStatus
  paymentMethod: PaymentMethod | null
  totalValue: number
  statusChangedAt: string
  negotiationId: number
  notes: string | null
  client: OrderClient | null
  vendedor: OrderVendedor | null
}

export interface OrderTradeIn {
  id: number
  model: string
  serialNumber: string
  tradeInValue: number
}

export interface OrderDetail extends Order {
  items: NegotiationItem[]
  tradeIns: OrderTradeIn[]
  tradeInTotal: number
  amountDue: number
}
