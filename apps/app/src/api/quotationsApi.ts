import { http } from './http'
import type { IssueQuotationPayload, Quotation, QuotationWithItems } from '../types'

export const quotationsApi = {
  listByNegotiation(negotiationId: number): Promise<Quotation[]> {
    return http.get<Quotation[]>(`/negotiations/${negotiationId}/quotations`)
  },

  issue(negotiationId: number, payload: IssueQuotationPayload): Promise<QuotationWithItems> {
    return http.post<QuotationWithItems>(`/negotiations/${negotiationId}/quotations`, payload)
  },
}
