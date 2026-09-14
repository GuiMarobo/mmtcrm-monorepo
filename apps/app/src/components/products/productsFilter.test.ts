import { describe, expect, it } from 'vitest'
import {
  EMPTY_PRODUCT_FILTERS,
  filterProducts,
  isAvailable,
} from './productsFilter'
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
  product({ id: 'iphone', name: 'iPhone 15 Pro', sku: 'IP15P-256', category: 'IPHONE', stock: 5 }),
  product({ id: 'airpods', name: 'AirPods Pro', sku: 'APP-2', category: 'AUDIO', stock: 0 }),
  product({ id: 'capa', name: 'Capa MagSafe', sku: 'CAPA-MS', category: 'ACESSORIOS', status: 'INATIVO', stock: 8 }),
  product({ id: 'fone', name: 'Fone Lightning', sku: 'FONE-LT', category: 'AUDIO', stock: 3 }),
]

const ids = (products: Product[]) => products.map((p) => p.id)

describe('isAvailable', () => {
  it('é disponível só o Produto Ativo com saldo maior que zero', () => {
    expect(isAvailable(product({ status: 'ATIVO', stock: 1 }))).toBe(true)
    expect(isAvailable(product({ status: 'ATIVO', stock: 0 }))).toBe(false)
    expect(isAvailable(product({ status: 'INATIVO', stock: 10 }))).toBe(false)
  })
})

describe('filterProducts', () => {
  it('sem filtros devolve a lista inteira, na mesma ordem', () => {
    expect(ids(filterProducts(catalog, EMPTY_PRODUCT_FILTERS))).toEqual([
      'iphone',
      'airpods',
      'capa',
      'fone',
    ])
  })

  it('busca por nome ignorando caixa e espaços nas pontas', () => {
    const result = filterProducts(catalog, { ...EMPTY_PRODUCT_FILTERS, query: '  airpods ' })
    expect(ids(result)).toEqual(['airpods'])
  })

  it('busca pelo código de referência', () => {
    const result = filterProducts(catalog, { ...EMPTY_PRODUCT_FILTERS, query: 'capa-ms' })
    expect(ids(result)).toEqual(['capa'])
  })

  it('busca ignora acentos', () => {
    const result = filterProducts(
      [product({ id: 'x', name: 'Cabo Elétrico', sku: 'CB-1' })],
      { ...EMPTY_PRODUCT_FILTERS, query: 'eletrico' },
    )
    expect(ids(result)).toEqual(['x'])
  })

  it('filtra por categoria', () => {
    const result = filterProducts(catalog, { ...EMPTY_PRODUCT_FILTERS, category: 'AUDIO' })
    expect(ids(result)).toEqual(['airpods', 'fone'])
  })

  it('filtra por situação', () => {
    const result = filterProducts(catalog, { ...EMPTY_PRODUCT_FILTERS, status: 'INATIVO' })
    expect(ids(result)).toEqual(['capa'])
  })

  it('"Em estoque" mostra só os disponíveis (Ativo e saldo > 0)', () => {
    const result = filterProducts(catalog, { ...EMPTY_PRODUCT_FILTERS, availability: 'EM_ESTOQUE' })
    expect(ids(result)).toEqual(['iphone', 'fone'])
  })

  it('"Sem estoque" mostra os de saldo zerado, qualquer que seja a situação', () => {
    const zeroed = [
      ...catalog,
      product({ id: 'watch', name: 'Apple Watch', sku: 'AW-9', status: 'INATIVO', stock: 0 }),
    ]
    const result = filterProducts(zeroed, { ...EMPTY_PRODUCT_FILTERS, availability: 'SEM_ESTOQUE' })
    expect(ids(result)).toEqual(['airpods', 'watch'])
  })

  it('busca e filtros combinam entre si', () => {
    const result = filterProducts(catalog, {
      query: 'o',
      category: 'AUDIO',
      status: 'ATIVO',
      availability: 'EM_ESTOQUE',
    })
    expect(ids(result)).toEqual(['fone'])
  })
})
