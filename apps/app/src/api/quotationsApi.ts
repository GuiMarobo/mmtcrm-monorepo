import { http } from './http'
import type {
  IssueQuotationPayload,
  Quotation,
  QuotationDetail,
  QuotationWithItems,
} from '../types'

export const quotationsApi = {
  listByNegotiation(negotiationId: number): Promise<Quotation[]> {
    return http.get<Quotation[]>(`/negotiations/${negotiationId}/quotations`)
  },

  issue(negotiationId: number, payload: IssueQuotationPayload): Promise<QuotationWithItems> {
    return http.post<QuotationWithItems>(`/negotiations/${negotiationId}/quotations`, payload)
  },

  findOne(id: number): Promise<QuotationDetail> {
    return http.get<QuotationDetail>(`/quotations/${id}`)
  },
}
