import { describe, expect, it } from 'vitest'
import { summarizeCatalog } from './productsSummary'
import type { Product } from '../../types'

const product = (overrides: Partial<Product>): Product => ({
  id: 'p1',
  name: 'iPhone 15 Pro',
  sku: 'IP15P-256',
  description: null,
  category: 'IPHONE',
  price: 1000,
  stock: 1,
  status: 'ATIVO',
  createdAt: '2026-09-11T00:00:00Z',
  updatedAt: '2026-09-11T00:00:00Z',
  ...overrides,
})

describe('summarizeCatalog', () => {
  it('lista vazia: zero ativos, zero unidades, valor zero', () => {
    expect(summarizeCatalog([])).toEqual({
      total: 0,
      activeCount: 0,
      units: 0,
      stockValue: 0,
    })
  })

  it('soma unidades e valor do estoque a preço de venda', () => {
    const result = summarizeCatalog([
      product({ id: 'p1', price: 7999.9, stock: 2 }),
      product({ id: 'p2', price: 150, stock: 10 }),
    ])

    expect(result.activeCount).toBe(2)
    expect(result.units).toBe(12)
    expect(result.stockValue).toBeCloseTo(17499.8, 2)
  })

  it('com inativos misturados: conta só os ativos, mas o saldo físico deles entra nas unidades e no valor', () => {
    const result = summarizeCatalog([
      product({ id: 'p1', status: 'ATIVO', price: 100, stock: 3 }),
      product({ id: 'p2', status: 'INATIVO', price: 50, stock: 4 }),
      product({ id: 'p3', status: 'INATIVO', price: 999, stock: 0 }),
    ])

    expect(result.total).toBe(3)
    expect(result.activeCount).toBe(1)
    expect(result.units).toBe(7)
    expect(result.stockValue).toBe(500)
  })

  it('com saldo zerado: o Produto ativo conta, mas não soma unidades nem valor', () => {
    const result = summarizeCatalog([
      product({ id: 'p1', price: 4500, stock: 0 }),
      product({ id: 'p2', price: 200, stock: 5 }),
    ])

    expect(result.activeCount).toBe(2)
    expect(result.units).toBe(5)
    expect(result.stockValue).toBe(1000)
  })
})
