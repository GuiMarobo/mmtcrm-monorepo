import { describe, expect, it } from 'vitest'
import {
  LOW_STOCK_LIMIT,
  countProductsByTab,
  productsInTab,
  searchProducts,
  stockLevel,
} from './productsList'
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

const catalog = [
  product({ id: 'iphone', name: 'iPhone 15 Pro', sku: 'IP15P-256', stock: 5 }),
  product({ id: 'airpods', name: 'AirPods Pro', sku: 'APP-2', category: 'AUDIO', stock: 0 }),
  product({ id: 'capa', name: 'Capa MagSafe', sku: 'CAPA-MS', status: 'INATIVO', stock: 8 }),
  product({ id: 'watch', name: 'Apple Watch', sku: 'AW-9', status: 'INATIVO', stock: 0 }),
]

const ids = (products: Product[]) => products.map((p) => p.id)

describe('productsInTab', () => {
  it('Todos devolve a lista inteira, na mesma ordem', () => {
    expect(ids(productsInTab(catalog, 'todos'))).toEqual(['iphone', 'airpods', 'capa', 'watch'])
  })

  it('Ativos e Inativos filtram pela situação', () => {
    expect(ids(productsInTab(catalog, 'ativos'))).toEqual(['iphone', 'airpods'])
    expect(ids(productsInTab(catalog, 'inativos'))).toEqual(['capa', 'watch'])
  })

  it('Sem estoque traz os de saldo zero ou negativo, em qualquer situação', () => {
    const list = [...catalog, product({ id: 'negativo', stock: -1 })]
    expect(ids(productsInTab(list, 'sem-estoque'))).toEqual(['airpods', 'watch', 'negativo'])
  })
})

describe('searchProducts', () => {
  it('busca vazia ou só com espaços devolve a lista inteira', () => {
    expect(ids(searchProducts(catalog, '   '))).toEqual(['iphone', 'airpods', 'capa', 'watch'])
  })

  it('busca por nome ignorando caixa e espaços nas pontas', () => {
    expect(ids(searchProducts(catalog, '  AIRPODS '))).toEqual(['airpods'])
  })

  it('busca pelo Código de Referência', () => {
    expect(ids(searchProducts(catalog, 'capa-ms'))).toEqual(['capa'])
  })

  it('busca ignora acentos, no texto digitado e no produto', () => {
    const list = [product({ id: 'x', name: 'Cabo Elétrico', sku: 'CB-1' })]
    expect(ids(searchProducts(list, 'eletrico'))).toEqual(['x'])
    expect(ids(searchProducts(list, 'ELÉTRICO'))).toEqual(['x'])
  })
})

describe('countProductsByTab', () => {
  it('conta cada aba sobre a lista recebida', () => {
    expect(countProductsByTab(catalog)).toEqual({
      todos: 4,
      ativos: 2,
      inativos: 2,
      'sem-estoque': 2,
    })
  })

  it('conta zero em todas as abas com a lista vazia', () => {
    expect(countProductsByTab([])).toEqual({
      todos: 0,
      ativos: 0,
      inativos: 0,
      'sem-estoque': 0,
    })
  })
})

describe('stockLevel', () => {
  it('estoque baixo vai até 3 unidades', () => {
    expect(LOW_STOCK_LIMIT).toBe(3)
  })

  it('0 é zerado, 1 a 3 é baixo, acima disso é normal', () => {
    expect(stockLevel(0)).toBe('zerado')
    expect(stockLevel(1)).toBe('baixo')
    expect(stockLevel(LOW_STOCK_LIMIT)).toBe('baixo')
    expect(stockLevel(LOW_STOCK_LIMIT + 1)).toBe('normal')
  })
})
