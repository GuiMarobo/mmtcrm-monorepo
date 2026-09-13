import { http } from './http'
import type {
  CreateProductPayload,
  CreateStockMovementPayload,
  Product,
  ProductDetail,
} from '../types'

export const productsApi = {
  list(): Promise<Product[]> {
    return http.get<Product[]>('/products')
  },

  findOne(id: string): Promise<ProductDetail> {
    return http.get<ProductDetail>(`/products/${id}`)
  },

  create(payload: CreateProductPayload): Promise<Product> {
    return http.post<Product>('/products', payload)
  },

  moveStock(
    id: string,
    payload: CreateStockMovementPayload,
  ): Promise<ProductDetail> {
    return http.post<ProductDetail>(`/products/${id}/stock-movements`, payload)
  },
}
