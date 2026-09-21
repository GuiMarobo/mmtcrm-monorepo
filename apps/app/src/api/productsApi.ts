import { http } from './http'
import type {
  CreateProductPayload,
  CreateStockMovementPayload,
  Product,
  ProductDetail,
  UpdateProductPayload,
  UpdateProductPricePayload,
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

  update(id: string, payload: UpdateProductPayload): Promise<ProductDetail> {
    return http.patch<ProductDetail>(`/products/${id}`, payload)
  },

  updatePrice(
    id: string,
    payload: UpdateProductPricePayload,
  ): Promise<ProductDetail> {
    return http.patch<ProductDetail>(`/products/${id}/price`, payload)
  },

  moveStock(
    id: string,
    payload: CreateStockMovementPayload,
  ): Promise<ProductDetail> {
    return http.post<ProductDetail>(`/products/${id}/stock-movements`, payload)
  },

  discontinue(id: string): Promise<ProductDetail> {
    return http.patch<ProductDetail>(`/products/${id}/discontinue`)
  },

  reactivate(id: string): Promise<ProductDetail> {
    return http.patch<ProductDetail>(`/products/${id}/reactivate`)
  },

  remove(id: string): Promise<void> {
    return http.delete<void>(`/products/${id}`)
  },
}
