import type { NegotiationItem } from './negotiation.types'

export interface QuotationAuthor {
  id: number
  name: string
}

export interface Quotation {
  id: number
  negotiationId: number
  code: string
  totalValue: number
  installments: number
  ratePercent: number
  totalWithInterest: number
  installmentValue: number
  firstInstallmentValue: number
  validUntil: string
  expired: boolean
  createdAt: string
  author: QuotationAuthor | null
}

export type QuotationItem = NegotiationItem

export interface QuotationWithItems extends Quotation {
  items: QuotationItem[]
}

export interface QuotationClient {
  id: string
  name: string
  anonymized: boolean
}

export interface QuotationSeller {
  id: number
  name: string
}

export interface QuotationDetail extends QuotationWithItems {
  client: QuotationClient
  seller: QuotationSeller | null
}

export interface IssueQuotationPayload {
  installments: number
  ratePercent: number
  validUntil: string
}
