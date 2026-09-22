import { http } from './http'
import type { Order, OrderDetail } from '../types'

export const ordersApi = {
  list(): Promise<Order[]> {
    return http.get<Order[]>('/orders')
  },

  findOne(id: number): Promise<OrderDetail> {
    return http.get<OrderDetail>(`/orders/${id}`)
  },

  approve(id: number): Promise<Order> {
    return http.patch<Order>(`/orders/${id}/approve`)
  },
}
