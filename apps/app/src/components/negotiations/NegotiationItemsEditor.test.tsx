import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NegotiationItemsEditor } from './NegotiationItemsEditor'
import type { Product } from '../../types'

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'iPhone 15 Pro',
  sku: 'IP15P-256',
  description: null,
  category: 'IPHONE',
  price: 100,
  stock: 5,
  status: 'ATIVO',
  createdAt: '2026-09-11T12:00:00Z',
  updatedAt: '2026-09-11T12:00:00Z',
  ...overrides,
})

describe('NegotiationItemsEditor', () => {
  it('adiciona um item selecionado no seletor com quantidade 1', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <NegotiationItemsEditor products={[product()]} items={[]} onChange={onChange} />,
    )

    await user.click(screen.getByLabelText('Adicionar produto'))
    await user.click(screen.getByRole('option', { name: /iPhone 15 Pro/ }))

    expect(onChange).toHaveBeenCalledWith([{ productId: 'p1', quantity: 1 }])
  })

  it('esconde do seletor um Produto já adicionado, mas mantém a linha dele na lista', async () => {
    const user = userEvent.setup()
    render(
      <NegotiationItemsEditor
        products={[product(), product({ id: 'p2', name: 'AirPods Pro', sku: 'APP2' })]}
        items={[{ productId: 'p1', quantity: 1 }]}
        onChange={vi.fn()}
      />,
    )

    await user.click(screen.getByLabelText('Adicionar produto'))

    expect(
      screen.queryByRole('option', { name: /iPhone 15 Pro/ }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('option', { name: /AirPods Pro/ })).toBeInTheDocument()
    expect(screen.getAllByText('iPhone 15 Pro')).toHaveLength(1)
  })

  it('soma o total dos itens sem edição no rodapé', () => {
    render(
      <NegotiationItemsEditor
        products={[
          product({ id: 'p1', price: 100 }),
          product({ id: 'p2', price: 50, name: 'AirPods Pro', sku: 'APP2' }),
        ]}
        items={[
          { productId: 'p1', quantity: 2 },
          { productId: 'p2', quantity: 1 },
        ]}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByText(/R\$\s*250,00/)).toBeInTheDocument()
  })

  it('mostra aviso quando a quantidade passa do saldo, sem bloquear', () => {
    render(
      <NegotiationItemsEditor
        products={[product({ stock: 1 })]}
        items={[{ productId: 'p1', quantity: 3 }]}
        onChange={vi.fn()}
      />,
    )

    expect(screen.getByText(/Saldo em estoque: 1/)).toBeInTheDocument()
  })

  it('remove um item ao clicar no botão de remover', async () => {
    const user = userEvent.setup()
    const onChange = vi.fn()

    render(
      <NegotiationItemsEditor
        products={[product()]}
        items={[{ productId: 'p1', quantity: 1 }]}
        onChange={onChange}
      />,
    )

    await user.click(screen.getByLabelText('Remover iPhone 15 Pro'))

    expect(onChange).toHaveBeenCalledWith([])
  })
})
