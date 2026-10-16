import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductsTable } from './ProductsTable'
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

describe('ProductsTable', () => {
  it('mostra as colunas do catálogo com os rótulos em pt-BR', () => {
    render(
      <ProductsTable rows={[product()]} loading={false} onOpen={noop} />,
    )

    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
    expect(screen.getByText('IP15P-256')).toBeInTheDocument()
    expect(screen.getByText('iPhone')).toBeInTheDocument()
    expect(screen.getByText('R$ 7.999,90')).toBeInTheDocument()
    expect(screen.getByText('5 un.')).toBeInTheDocument()
  })

  it('exibe a situação como rótulo em pt-BR, não como valor do enum', () => {
    render(
      <ProductsTable
        rows={[product({ status: 'INATIVO' })]}
        loading={false}
        onOpen={noop}
       
      />,
    )

    expect(screen.getByText('Inativo')).toBeInTheDocument()
    expect(screen.queryByText('INATIVO')).not.toBeInTheDocument()
  })

  it('é uma tabela densa', () => {
    const { container } = render(
      <ProductsTable rows={[product()]} loading={false} onOpen={noop} />,
    )

    expect(container.querySelector('.MuiTableCell-sizeSmall')).not.toBeNull()
  })

  it('mostra o saldo como chip: unidades em estoque ou "Sem estoque"', () => {
    render(
      <ProductsTable
        rows={[product(), product({ id: 'p2', name: 'AirPods', stock: 0 })]}
        loading={false}
        onOpen={noop}
      />,
    )

    expect(screen.getByText('5 un.')).toBeInTheDocument()
    expect(screen.getByText('Sem estoque')).toBeInTheDocument()
  })

  it('clicar numa linha abre o detalhe do Produto daquela linha', async () => {
    const onOpen = vi.fn()
    render(<ProductsTable rows={[product()]} loading={false} onOpen={onOpen} />)

    await userEvent.click(screen.getByText('iPhone 15 Pro'))

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 'p1' }))
  })

  describe('no telefone', () => {
    afterEach(() => {
      vi.unstubAllGlobals()
    })

    it('esconde as colunas menos essenciais', () => {
      vi.stubGlobal('matchMedia', (query: string) => ({
        matches: true,
        media: query,
        onchange: null,
        addListener: noop,
        removeListener: noop,
        addEventListener: noop,
        removeEventListener: noop,
        dispatchEvent: () => false,
      }))

      render(
        <ProductsTable rows={[product()]} loading={false} onOpen={noop} />,
      )

      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
      expect(screen.getByText('Ativo')).toBeInTheDocument()
      expect(screen.queryByText('IP15P-256')).not.toBeInTheDocument()
      expect(screen.queryByText('Categoria')).not.toBeInTheDocument()
    })
  })
})
