import type { ClientStatus, OrderStatus, PaymentMethod } from './enums'

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
