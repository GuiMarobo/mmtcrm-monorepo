import type { Product, ProductCategory, ProductStatus } from '../../types'

export type StockAvailability = 'TODOS' | 'EM_ESTOQUE' | 'SEM_ESTOQUE'

export const STOCK_AVAILABILITY_OPTIONS: { value: StockAvailability; label: string }[] = [
  { value: 'TODOS', label: 'Todos' },
  { value: 'EM_ESTOQUE', label: 'Em estoque' },
  { value: 'SEM_ESTOQUE', label: 'Sem estoque' },
]

export interface ProductFilters {
  query: string
  category: ProductCategory | ''
  status: ProductStatus | ''
  availability: StockAvailability
}

export const EMPTY_PRODUCT_FILTERS: ProductFilters = {
  query: '',
  category: '',
  status: '',
  availability: 'TODOS',
}

export function isAvailable(product: Product): boolean {
  return product.status === 'ATIVO' && product.stock > 0
}

const normalize = (text: string) =>
  text.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase()

export function filterProducts(products: Product[], filters: ProductFilters): Product[] {
  const query = normalize(filters.query)
  return products.filter((p) => {
    if (query && !normalize(p.name).includes(query) && !normalize(p.sku).includes(query)) {
      return false
    }
    if (filters.category && p.category !== filters.category) return false
    if (filters.status && p.status !== filters.status) return false
    if (filters.availability === 'EM_ESTOQUE') return isAvailable(p)
    if (filters.availability === 'SEM_ESTOQUE') return p.stock === 0
    return true
  })
}
