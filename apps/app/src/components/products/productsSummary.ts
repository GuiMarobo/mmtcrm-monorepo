import { stockLevel } from './productsList'
import type { Product } from '../../types'

export interface CatalogSummary {
  total: number
  activeCount: number
  units: number
  stockValue: number
  outOfStockCount: number
  lowStockCount: number
}

export function summarizeCatalog(products: Product[]): CatalogSummary {
  return products.reduce<CatalogSummary>(
    (acc, p) => {
      const level = stockLevel(p.stock)
      return {
        total: acc.total + 1,
        activeCount: acc.activeCount + (p.status === 'ATIVO' ? 1 : 0),
        units: acc.units + p.stock,
        stockValue: acc.stockValue + p.stock * p.price,
        outOfStockCount: acc.outOfStockCount + (level === 'zerado' ? 1 : 0),
        lowStockCount: acc.lowStockCount + (level === 'baixo' ? 1 : 0),
      }
    },
    {
      total: 0,
      activeCount: 0,
      units: 0,
      stockValue: 0,
      outOfStockCount: 0,
      lowStockCount: 0,
    },
  )
}
