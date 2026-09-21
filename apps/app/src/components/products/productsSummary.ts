import type { Product } from '../../types'

export interface CatalogSummary {
  total: number
  activeCount: number
  units: number
  stockValue: number
}

export function summarizeCatalog(products: Product[]): CatalogSummary {
  return products.reduce<CatalogSummary>(
    (acc, p) => ({
      total: acc.total + 1,
      activeCount: acc.activeCount + (p.status === 'ATIVO' ? 1 : 0),
      units: acc.units + p.stock,
      stockValue: acc.stockValue + p.stock * p.price,
    }),
    { total: 0, activeCount: 0, units: 0, stockValue: 0 },
  )
}
