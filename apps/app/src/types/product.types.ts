import type { ProductCategory, ProductStatus } from './enums'

export interface Product {
  id: string
  name: string
  sku: string
  description: string | null
  category: ProductCategory
  price: number
  stock: number
  status: ProductStatus
  createdAt: string
  updatedAt: string
}

export interface CreateProductPayload {
  name: string
  sku: string
  description?: string | null
  category: ProductCategory
  price: number
  initialStock?: number
}
