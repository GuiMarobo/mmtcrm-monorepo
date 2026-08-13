import { http } from './http'
import type {
  CreateNegotiationPayload,
  Negotiation,
  PaymentMethod,
  UpdateNegotiationPayload,
} from '../types'

export const negotiationsApi = {
  list(): Promise<Negotiation[]> {
    return http.get<Negotiation[]>('/negotiations')
  },

  findOne(id: number): Promise<Negotiation> {
    return http.get<Negotiation>(`/negotiations/${id}`)
  },

  create(payload: CreateNegotiationPayload): Promise<Negotiation> {
    return http.post<Negotiation>('/negotiations', payload)
  },

  update(id: number, payload: UpdateNegotiationPayload): Promise<Negotiation> {
    return http.patch<Negotiation>(`/negotiations/${id}`, payload)
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
