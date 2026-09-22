import { http } from './http'
import type {
  CreateNegotiationPayload,
  Negotiation,
  NegotiationDetail,
  PaymentMethod,
  ReplaceNegotiationPayload,
} from '../types'

export const negotiationsApi = {
  list(): Promise<Negotiation[]> {
    return http.get<Negotiation[]>('/negotiations')
  },

  findOne(id: number): Promise<NegotiationDetail> {
    return http.get<NegotiationDetail>(`/negotiations/${id}`)
  },

  create(payload: CreateNegotiationPayload): Promise<Negotiation> {
    return http.post<Negotiation>('/negotiations', payload)
  },

  replace(id: number, payload: ReplaceNegotiationPayload): Promise<Negotiation> {
    return http.put<Negotiation>(`/negotiations/${id}`, payload)
  },

  remove(id: number): Promise<Negotiation> {
    return http.delete<Negotiation>(`/negotiations/${id}`)
  },

  cancel(id: number): Promise<Negotiation> {
    return http.patch<Negotiation>(`/negotiations/${id}/cancel`)
  },

  convert(id: number, paymentMethod: PaymentMethod): Promise<Negotiation> {
    return http.post<Negotiation>(`/negotiations/${id}/convert`, {
      paymentMethod,
    })
  },

  reopen(id: number): Promise<Negotiation> {
    return http.patch<Negotiation>(`/negotiations/${id}/reopen`)
  },
}
