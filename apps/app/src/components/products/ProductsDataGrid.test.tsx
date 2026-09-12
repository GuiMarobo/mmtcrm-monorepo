import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductsDataGrid } from './ProductsDataGrid'
import type { Product } from '../../types'

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'iPhone 15 Pro',
  sku: 'IP15P-256',
  description: null,
  category: 'IPHONE',
  price: 7999.9,
  stock: 5,
  status: 'ATIVO',
  createdAt: '2026-09-11T00:00:00Z',
  updatedAt: '2026-09-11T00:00:00Z',
  ...overrides,
})

const noop = () => undefined

describe('ProductsDataGrid', () => {
  it('mostra as colunas do catálogo com os rótulos em pt-BR', () => {
    render(<ProductsDataGrid rows={[product()]} loading={false} onOpen={noop} />)

    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
    expect(screen.getByText('IP15P-256')).toBeInTheDocument()
    expect(screen.getByText('iPhone')).toBeInTheDocument()
    expect(screen.getByText('R$ 7.999,90')).toBeInTheDocument()
    expect(screen.getByText('5')).toBeInTheDocument()
  })

  it('exibe a situação como rótulo em pt-BR, não como valor do enum', () => {
    render(
      <ProductsDataGrid
        rows={[product({ status: 'INATIVO' })]}
        loading={false}
        onOpen={noop}
      />,
    )

    expect(screen.getByText('Inativo')).toBeInTheDocument()
    expect(screen.queryByText('INATIVO')).not.toBeInTheDocument()
  })

  it('clicar numa linha abre o detalhe do Produto daquela linha', async () => {
    const onOpen = vi.fn()
    render(
      <ProductsDataGrid rows={[product()]} loading={false} onOpen={onOpen} />,
    )

    await userEvent.click(screen.getByText('iPhone 15 Pro'))

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }))
  })
})
