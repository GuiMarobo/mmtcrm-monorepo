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
      discountType: 'VALOR',
      discountValue: 0,
      discountAmount: 0,
      subtotal: 200,
    },
  ],
  informedValue: null,
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
      items: [{ productId: 'p1', quantity: 2, discountType: 'VALOR', discountValue: 0 }],
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

const legacyNegotiation = (overrides: Partial<NegotiationDetail> = {}) =>
  negotiationDetail({
    totalValue: 1500,
    items: [],
    informedValue: 1500,
    ...overrides,
  })

const renderModal = (
  negotiation: NegotiationDetail,
  onUpdate = vi.fn().mockResolvedValue(undefined),
) =>
  render(
    <NegotiationFormModal
      negotiation={negotiation}
      clients={[client()]}
      products={[product()]}
      onClose={vi.fn()}
      onCreate={vi.fn()}
      onUpdate={onUpdate}
    />,
  )

describe('NegotiationFormModal — Negociação antiga ou importada sem itens (ticket 05)', () => {
  it('mostra o valor informado só para leitura e o aviso de substituição', () => {
    renderModal(legacyNegotiation())

    const field = screen.getByLabelText('Valor informado')
    expect((field as HTMLInputElement).value).toMatch(/R\$\s*1\.500,00/)
    expect(field).toHaveAttribute('readonly')
    expect(
      screen.getByText(/adicionar o primeiro item substitui esse valor pela soma dos itens/i),
    ).toBeInTheDocument()
    expect(screen.getByText(/o valor informado não volta/i)).toBeInTheDocument()
  })

  it('Negociação com itens não mostra o valor informado nem o aviso', () => {
    renderModal(negotiationDetail())

    expect(screen.queryByLabelText('Valor informado')).not.toBeInTheDocument()
    expect(screen.queryByText(/o valor informado não volta/i)).not.toBeInTheDocument()
  })

  it('Negociação sem itens e sem valor informado mostra só a lista vazia', () => {
    renderModal(negotiationDetail({ totalValue: 0, items: [], informedValue: null }))

    expect(screen.queryByLabelText('Valor informado')).not.toBeInTheDocument()
    expect(screen.queryByText(/o valor informado não volta/i)).not.toBeInTheDocument()
  })

  it('ao adicionar o primeiro item, confirma antes de salvar que o valor será substituído pela soma', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn().mockResolvedValue(undefined)
    renderModal(legacyNegotiation(), onUpdate)

    await user.click(screen.getByLabelText('Adicionar produto'))
    await user.click(screen.getByRole('option', { name: /iPhone 15 Pro/ }))

    expect(
      screen.getByText(
        /ao salvar, o valor informado de R\$\s*1\.500,00 será substituído por R\$\s*100,00/i,
      ),
    ).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(onUpdate).toHaveBeenCalledWith({
      clientId: 'c1',
      items: [{ productId: 'p1', quantity: 1, discountType: 'VALOR', discountValue: 0 }],
      notes: null,
    })
  })

  it('salvar sem mexer nos itens envia a lista vazia (o backend mantém o valor informado)', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn().mockResolvedValue(undefined)
    renderModal(legacyNegotiation(), onUpdate)

    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(onUpdate).toHaveBeenCalledWith({
      clientId: 'c1',
      items: [],
      notes: null,
    })
  })
})

describe('NegotiationFormModal — validações do item (ticket 06)', () => {
  it('salva mesmo com quantidade acima do saldo: o aviso não bloqueia', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn().mockResolvedValue(undefined)

    render(
      <NegotiationFormModal
        negotiation={negotiationDetail()}
        clients={[client()]}
        products={[product({ stock: 1 })]}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
      />,
    )

    expect(screen.getByText(/Saldo em estoque: 1/)).toBeInTheDocument()
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(onUpdate).toHaveBeenCalledWith({
      clientId: 'c1',
      items: [{ productId: 'p1', quantity: 2, discountType: 'VALOR', discountValue: 0 }],
      notes: null,
    })
  })
})

describe('NegotiationFormModal — desconto do item (ticket 08)', () => {
  it('carrega forma e número do desconto do detalhe e os devolve ao salvar', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn().mockResolvedValue(undefined)

    render(
      <NegotiationFormModal
        negotiation={negotiationDetail({
          totalValue: 180,
          items: [
            {
              id: 10,
              product: { id: 'p1', name: 'iPhone 15 Pro', sku: 'IP15P-256', status: 'ATIVO', deleted: false },
              quantity: 2,
              unitPrice: 100,
              discountType: 'PERCENTUAL',
              discountValue: 10,
              discountAmount: 20,
              subtotal: 180,
            },
          ],
        })}
        clients={[client()]}
        products={[product()]}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
      />,
    )

    expect(screen.getByRole('button', { name: '%' })).toHaveAttribute('aria-pressed', 'true')
    expect(screen.getByLabelText('Desconto')).toHaveValue(10)
    expect(screen.getAllByText(/R\$\s*180,00/)).toHaveLength(2)

    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(onUpdate).toHaveBeenCalledWith({
      clientId: 'c1',
      items: [{ productId: 'p1', quantity: 2, discountType: 'PERCENTUAL', discountValue: 10 }],
      notes: null,
    })
  })
})

describe('NegotiationFormModal — item de Produto descontinuado ou excluído (RI2, ticket 07)', () => {
  const withItemProduct = (productOverrides: Partial<NegotiationDetail['items'][number]['product']>) =>
    negotiationDetail({
      items: [
        {
          id: 10,
          product: {
            id: 'p1',
            name: 'iPhone 15 Pro',
            sku: 'IP15P-256',
            status: 'ATIVO',
            deleted: false,
            ...productOverrides,
          },
          quantity: 2,
          unitPrice: 100,
          discountType: 'VALOR',
          discountValue: 0,
          discountAmount: 0,
          subtotal: 200,
        },
      ],
    })

  const renderWithCatalog = (
    negotiation: NegotiationDetail,
    products: Product[],
    onUpdate = vi.fn().mockResolvedValue(undefined),
  ) =>
    render(
      <NegotiationFormModal
        negotiation={negotiation}
        clients={[client()]}
        products={products}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
      />,
    )

  it('item de Produto excluído aparece marcado, com a quantidade desabilitada e só o remover', () => {
    renderWithCatalog(withItemProduct({ deleted: true }), [])

    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
    expect(screen.getByText('Excluído do catálogo')).toBeInTheDocument()
    expect(screen.getByLabelText('Qtd.')).toBeDisabled()
    expect(screen.getByLabelText('Qtd.')).toHaveValue(2)
    expect(screen.getByLabelText('Remover iPhone 15 Pro')).toBeEnabled()
    expect(screen.getAllByText(/R\$\s*200,00/)).toHaveLength(2)
  })

  it('manter o item de Produto excluído envia o item sem alteração', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn().mockResolvedValue(undefined)
    renderWithCatalog(withItemProduct({ deleted: true }), [], onUpdate)

    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(onUpdate).toHaveBeenCalledWith({
      clientId: 'c1',
      items: [{ productId: 'p1', quantity: 2, discountType: 'VALOR', discountValue: 0 }],
      notes: null,
    })
  })

  it('remover o item de Produto excluído o tira da lista enviada', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn().mockResolvedValue(undefined)
    renderWithCatalog(withItemProduct({ deleted: true }), [], onUpdate)

    await user.click(screen.getByLabelText('Remover iPhone 15 Pro'))
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(onUpdate).toHaveBeenCalledWith({ clientId: 'c1', items: [], notes: null })
  })

  it('item de Produto descontinuado continua editável e sem a marca de excluído', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn().mockResolvedValue(undefined)
    renderWithCatalog(
      withItemProduct({ status: 'INATIVO' }),
      [product({ status: 'INATIVO' })],
      onUpdate,
    )

    expect(screen.queryByText('Excluído do catálogo')).not.toBeInTheDocument()
    const quantity = screen.getByLabelText('Qtd.')
    expect(quantity).toBeEnabled()
    await user.tripleClick(quantity)
    await user.keyboard('3')
    await user.click(screen.getByRole('button', { name: 'Salvar alterações' }))

    expect(onUpdate).toHaveBeenCalledWith({
      clientId: 'c1',
      items: [{ productId: 'p1', quantity: 3, discountType: 'VALOR', discountValue: 0 }],
      notes: null,
    })
  })
})
