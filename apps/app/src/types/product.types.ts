import type {
  ProductCategory,
  ProductStatus,
  StockMovementType,
} from './enums'

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

export interface StockMovement {
  id: string
  type: StockMovementType
  quantity: number
  note: string | null
  createdAt: string
  user: { id: number; name: string } | null
}

export interface ProductDetail extends Product {
  stockMovements: StockMovement[]
}

export interface CreateProductPayload {
  name: string
  sku: string
  description?: string | null
  category: ProductCategory
  price: number
  initialStock?: number
}

export interface CreateStockMovementPayload {
  type: StockMovementType
  quantity: number
  note?: string
}
