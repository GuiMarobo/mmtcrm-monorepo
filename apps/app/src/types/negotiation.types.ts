import type {
  ClientStatus,
  NegotiationStatus,
  OrderStatus,
  PaymentMethod,
  ProductStatus,
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

export interface NegotiationItemProduct {
  id: string
  name: string
  sku: string
  status: ProductStatus
  deleted: boolean
}

export interface NegotiationItem {
  id: number
  product: NegotiationItemProduct
  quantity: number
  unitPrice: number
  subtotal: number
}

export interface NegotiationDetail extends Negotiation {
  items: NegotiationItem[]
}

export interface CreateNegotiationItemPayload {
  productId: string
  quantity: number
}

export interface CreateNegotiationPayload {
  clientId: string
  items: CreateNegotiationItemPayload[]
  notes?: string | null
}

export interface UpdateNegotiationPayload {
  clientId?: string
  totalValue?: number
  notes?: string | null
}
