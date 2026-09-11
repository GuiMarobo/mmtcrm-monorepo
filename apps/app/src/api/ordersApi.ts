import { http } from './http'
import type { Order } from '../types'

export const ordersApi = {
  list(): Promise<Order[]> {
    return http.get<Order[]>('/orders')
  },

  findOne(id: number): Promise<Order> {
    return http.get<Order>(`/orders/${id}`)
  },

  approve(id: number): Promise<Order> {
    return http.patch<Order>(`/orders/${id}/approve`)
  },
}
