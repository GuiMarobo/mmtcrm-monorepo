import type {
  ClientStatus,
  NegotiationStatus,
  OrderStatus,
  PaymentMethod,
} from './enums'

export interface NegotiationOrder {
  id: number
  code: string
  status: OrderStatus
  paymentMethod: PaymentMethod | null
  totalValue: number
}

export interface NegotiationClient {
  id: string
  name: string
  status: ClientStatus
}

export interface NegotiationVendedor {
  id: number
  name: string
}

export interface Negotiation {
  id: number
  clientId: string
  vendedorId: number | null
  status: NegotiationStatus
  totalValue: number
  notes: string | null
  closedAt: string | null
  createdAt: string
  updatedAt: string
  client: NegotiationClient | null
  vendedor: NegotiationVendedor | null
  order: NegotiationOrder | null
}

export interface CreateNegotiationPayload {
  clientId: string
  totalValue: number
  notes?: string | null
}

export type UpdateNegotiationPayload = Partial<CreateNegotiationPayload>
