import { http } from './http'
import type { CreateProductPayload, Product } from '../types'

export const productsApi = {
  list(): Promise<Product[]> {
    return http.get<Product[]>('/products')
  },

  create(payload: CreateProductPayload): Promise<Product> {
    return http.post<Product>('/products', payload)
  },
}
