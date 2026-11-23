import { describe, expect, it } from 'vitest'
import { render, screen } from '@testing-library/react'
import { ProductStats } from './ProductStats'
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

const list = [
  product({ id: 'p1', price: 1000, stock: 10 }),
  product({ id: 'p2', price: 500, stock: 2 }),
  product({ id: 'p3', price: 200, stock: 0, status: 'INATIVO' }),
]

const card = (label: string) => screen.getByRole('group', { name: label })

describe('ProductStats', () => {
  it('mostra os quatro cards com os números calculados da lista', () => {
    render(<ProductStats list={list} loading={false} />)

    expect(card('Total de produtos')).toHaveTextContent('3')
    expect(card('Total de produtos')).toHaveTextContent('2 ativos')
    expect(card('Unidades em estoque')).toHaveTextContent('12')
    expect(card('Valor do estoque')).toHaveTextContent(/R\$\s11\.000,00/)
    expect(card('Sem estoque / baixo')).toHaveTextContent('1 / 1')
    expect(card('Sem estoque / baixo')).toHaveTextContent('1 zerado · 1 baixo (até 3 un.)')
  })

  it('enquanto a lista carrega, os quatro cards mostram "—" e nenhum número', () => {
    render(<ProductStats list={list} loading />)

    for (const label of [
      'Total de produtos',
      'Unidades em estoque',
      'Valor do estoque',
      'Sem estoque / baixo',
    ]) {
      expect(card(label)).toHaveTextContent(new RegExp(`^${label}—$`))
    }
  })
})
