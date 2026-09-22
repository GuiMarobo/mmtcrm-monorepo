import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NegotiationFormModal } from './NegotiationFormModal'
import type { Client, NegotiationDetail, Product } from '../../types'

const client = (overrides: Partial<Client> = {}): Client => ({
  id: 'c1',
  name: 'Fulana da Silva',
  email: null,
  phone: null,
  cpf: null,
  address: null,
  status: 'LEAD',
  qualification: 'QUALIFICADO',
  origin: null,
  notes: null,
  lastContactAt: null,
  createdAt: '2026-09-11T12:00:00Z',
  updatedAt: '2026-09-11T12:00:00Z',
  anonymizedAt: null,
  negotiationsCount: 0,
  ordersCount: 0,
  revenue: 0,
  ...overrides,
})

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

const negotiationDetail = (
  overrides: Partial<NegotiationDetail> = {},
): NegotiationDetail => ({
  id: 3,
  clientId: 'c1',
  vendedorId: 2,
  status: 'ABERTA',
  totalValue: 200,
  notes: null,
  closedAt: null,
  createdAt: '2026-09-20T12:00:00Z',
  updatedAt: '2026-09-20T12:00:00Z',
  client: { id: 'c1', name: 'Fulana da Silva', status: 'LEAD' },
  vendedor: { id: 2, name: 'Vendedora' },
  order: null,
  items: [
    {
      id: 10,
      product: { id: 'p1', name: 'iPhone 15 Pro', sku: 'IP15P-256', status: 'ATIVO', deleted: false },
      quantity: 2,
      unitPrice: 100,
      subtotal: 200,
    },
  ],
  ...overrides,
})

describe('NegotiationFormModal — editar itens de Negociação Aberta (ticket 04)', () => {
  it('carrega os itens existentes do detalhe, com o preço praticado congelado', () => {
    render(
      <NegotiationFormModal
        negotiation={negotiationDetail()}
        clients={[client()]}
        products={[product({ price: 500 })]}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />,
    )

    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
    expect(screen.getByText(/IP15P-256 · R\$\s*100,00/)).toBeInTheDocument()
    expect(screen.getAllByText(/R\$\s*200,00/)).toHaveLength(2)
  })

  it('envia a lista completa de itens (sem totalValue) ao salvar', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn().mockResolvedValue(undefined)

    render(
      <NegotiationFormModal
        negotiation={negotiationDetail()}
        clients={[client()]}
        products={[product()]}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
      />,
    )

    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(onUpdate).toHaveBeenCalledWith({
      clientId: 'c1',
      items: [{ productId: 'p1', quantity: 2 }],
      notes: null,
    })
  })

  it('remover o último item deixa a lista vazia e o rodapé em R$ 0,00', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn().mockResolvedValue(undefined)

    render(
      <NegotiationFormModal
        negotiation={negotiationDetail()}
        clients={[client()]}
        products={[product()]}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
      />,
    )

    await user.click(screen.getByLabelText('Remover iPhone 15 Pro'))
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(onUpdate).toHaveBeenCalledWith({
      clientId: 'c1',
      items: [],
      notes: null,
    })
  })
})
