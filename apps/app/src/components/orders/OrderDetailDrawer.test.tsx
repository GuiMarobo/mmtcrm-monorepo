import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderDetailDrawer } from './OrderDetailDrawer'
import type { NegotiationItem, Order, OrderTradeIn } from '../../types'

const order = (overrides: Partial<Order> = {}): Order => ({
  id: 7,
  code: 'PED-7',
  status: 'EM_NEGOCIACAO',
  paymentMethod: 'PIX',
  totalValue: 2500,
  statusChangedAt: '2026-02-01T00:00:00Z',
  negotiationId: 3,
  notes: null,
  client: { id: 'c1', name: 'Fulana de Tal', status: 'ATIVO', anonymizedAt: null },
  vendedor: { id: 2, name: 'Vendedora' },
  ...overrides,
})

const item = (overrides: Partial<NegotiationItem> = {}): NegotiationItem => ({
  id: 11,
  product: { id: 'p1', name: 'Painel', sku: 'PNL-1', status: 'ATIVO', deleted: false },
  quantity: 3,
  unitPrice: 100,
  discountType: 'PERCENTUAL',
  discountValue: 10,
  discountAmount: 30,
  subtotal: 270,
  ...overrides,
})

const tradeIn = (overrides: Partial<OrderTradeIn> = {}): OrderTradeIn => ({
  id: 41,
  model: 'iPhone 12 128 GB',
  serialNumber: 'F2LXK0ABCD',
  tradeInValue: 1200.1,
  ...overrides,
})

const noop = () => undefined

describe('OrderDetailDrawer', () => {
  it('em "Aguardando Pagamento" mostra "Aprovar Compra" e o aviso do quadro (RN9/D9)', () => {
    render(
      <OrderDetailDrawer
        order={order()}
        items={[]}
        tradeIns={[]}
        approving={false}
        onApprove={noop}
        onGoToNegotiations={noop}
        onClose={noop}
      />,
    )

    expect(
      screen.getByRole('button', { name: 'Aprovar Compra' }),
    ).toBeInTheDocument()
    expect(screen.getByText(/Reabra a negociação no quadro/i)).toBeInTheDocument()
  })

  it('fora de "Aguardando Pagamento" esconde "Aprovar Compra" e o aviso (§9)', () => {
    render(
      <OrderDetailDrawer
        order={order({ status: 'COMPRA_APROVADA' })}
        items={[]}
        tradeIns={[]}
        approving={false}
        onApprove={noop}
        onGoToNegotiations={noop}
        onClose={noop}
      />,
    )

    expect(
      screen.queryByRole('button', { name: 'Aprovar Compra' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByText(/Reabra a negociação no quadro/i),
    ).not.toBeInTheDocument()
  })

  it('o atalho leva ao quadro de Negociações sem escrever nada (D9)', async () => {
    const onGoToNegotiations = vi.fn()
    render(
      <OrderDetailDrawer
        order={order()}
        items={[]}
        tradeIns={[]}
        approving={false}
        onApprove={noop}
        onGoToNegotiations={onGoToNegotiations}
        onClose={noop}
      />,
    )

    await userEvent.click(
      screen.getByRole('button', { name: /quadro de Negociações/i }),
    )

    expect(onGoToNegotiations).toHaveBeenCalledTimes(1)
  })

  it('mostra os itens vendidos com quantidade, preço, desconto e subtotal (história 40)', () => {
    render(
      <OrderDetailDrawer
        order={order()}
        items={[
          item(),
          item({
            id: 12,
            product: { id: 'p2', name: 'Cabo', sku: 'CAB-2', status: 'ATIVO', deleted: false },
            quantity: 2,
            unitPrice: 50,
            discountType: 'VALOR',
            discountValue: 15,
            discountAmount: 15,
            subtotal: 85,
          }),
        ]}
        tradeIns={[]}
        approving={false}
        onApprove={noop}
        onGoToNegotiations={noop}
        onClose={noop}
      />,
    )

    const list = screen.getByRole('list', { name: 'Itens' })
    const [painel, cabo] = within(list).getAllByRole('listitem')
    expect(within(painel).getByText('Painel')).toBeInTheDocument()
    expect(within(painel).getByText(/3 × R\$\s100,00/)).toBeInTheDocument()
    expect(within(painel).getByText(/Desconto 10% · -R\$\s30,00/)).toBeInTheDocument()
    expect(within(painel).getByText(/R\$\s270,00/)).toBeInTheDocument()
    expect(within(cabo).getByText('Cabo')).toBeInTheDocument()
    expect(within(cabo).getByText(/Desconto -R\$\s15,00/)).toBeInTheDocument()
    expect(within(cabo).getByText(/R\$\s85,00/)).toBeInTheDocument()
  })

  it('item sem desconto não mostra linha de desconto', () => {
    render(
      <OrderDetailDrawer
        order={order()}
        items={[item({ discountType: 'VALOR', discountValue: 0, discountAmount: 0, subtotal: 300 })]}
        tradeIns={[]}
        approving={false}
        onApprove={noop}
        onGoToNegotiations={noop}
        onClose={noop}
      />,
    )

    const list = screen.getByRole('list', { name: 'Itens' })
    expect(within(list).queryByText(/Desconto/)).not.toBeInTheDocument()
  })

  it('avisa quando o Produto do item foi excluído do catálogo (RI2)', () => {
    render(
      <OrderDetailDrawer
        order={order()}
        items={[
          item({
            product: { id: 'p1', name: 'Painel', sku: 'PNL-1', status: 'ATIVO', deleted: true },
          }),
        ]}
        tradeIns={[]}
        approving={false}
        onApprove={noop}
        onGoToNegotiations={noop}
        onClose={noop}
      />,
    )

    expect(screen.getByText('Excluído do catálogo')).toBeInTheDocument()
  })

  it('Negociação sem itens (antiga ou importada) não mostra a seção de itens', () => {
    render(
      <OrderDetailDrawer
        order={order()}
        items={[]}
        tradeIns={[]}
        approving={false}
        onApprove={noop}
        onGoToNegotiations={noop}
        onClose={noop}
      />,
    )

    expect(screen.queryByRole('list', { name: 'Itens' })).not.toBeInTheDocument()
    expect(screen.queryByText('Itens')).not.toBeInTheDocument()
  })

  it('enquanto os itens carregam, avisa em vez de parecer um Pedido sem itens', () => {
    render(
      <OrderDetailDrawer
        order={order()}
        items={null}
        tradeIns={[]}
        approving={false}
        onApprove={noop}
        onGoToNegotiations={noop}
        onClose={noop}
      />,
    )

    expect(screen.getByText('Carregando itens…')).toBeInTheDocument()
    expect(screen.queryByRole('list', { name: 'Itens' })).not.toBeInTheDocument()
  })

  it('com troca mostra os aparelhos, o total, o total das trocas e o Saldo a pagar (história 45)', () => {
    render(
      <OrderDetailDrawer
        order={order()}
        items={[]}
        tradeIns={[
          tradeIn(),
          tradeIn({ id: 42, model: 'Galaxy S21', serialNumber: 'R58N123', tradeInValue: 99.9 }),
        ]}
        approving={false}
        onApprove={noop}
        onGoToNegotiations={noop}
        onClose={noop}
      />,
    )

    const list = screen.getByRole('list', { name: 'Aparelhos na troca' })
    const [iphone, galaxy] = within(list).getAllByRole('listitem')
    expect(within(iphone).getByText('iPhone 12 128 GB')).toBeInTheDocument()
    expect(within(iphone).getByText(/Série F2LXK0ABCD/)).toBeInTheDocument()
    expect(within(iphone).getByText(/R\$\s1\.200,10/)).toBeInTheDocument()
    expect(within(galaxy).getByText('Galaxy S21')).toBeInTheDocument()
    expect(within(galaxy).getByText(/R\$\s99,90/)).toBeInTheDocument()

    expect(screen.getByText('Total do pedido').nextSibling).toHaveTextContent(/R\$\s2\.500,00/)
    expect(screen.getByText('Total das trocas').nextSibling).toHaveTextContent(/R\$\s1\.300,00/)
    expect(screen.getByText('Saldo a pagar').nextSibling).toHaveTextContent(/R\$\s1\.200,00/)
  })

  it('sem troca não mostra o bloco de troca nem o Saldo a pagar', () => {
    render(
      <OrderDetailDrawer
        order={order()}
        items={[]}
        tradeIns={[]}
        approving={false}
        onApprove={noop}
        onGoToNegotiations={noop}
        onClose={noop}
      />,
    )

    expect(screen.queryByRole('list', { name: 'Aparelhos na troca' })).not.toBeInTheDocument()
    expect(screen.queryByText('Saldo a pagar')).not.toBeInTheDocument()
    expect(screen.queryByText('Total das trocas')).not.toBeInTheDocument()
  })

  it('enquanto a troca não carrega, não deixa aprovar sem saber o Saldo a pagar', () => {
    render(
      <OrderDetailDrawer
        order={order()}
        items={null}
        tradeIns={null}
        approving={false}
        onApprove={noop}
        onGoToNegotiations={noop}
        onClose={noop}
      />,
    )

    expect(screen.getByRole('button', { name: 'Aprovar Compra' })).toBeDisabled()
  })

  it('se a troca não carregou, avisa e não deixa aprovar', () => {
    render(
      <OrderDetailDrawer
        order={order()}
        items={[]}
        tradeIns={null}
        approving={false}
        onApprove={noop}
        onGoToNegotiations={noop}
        onClose={noop}
      />,
    )

    expect(screen.getByText(/Não foi possível carregar a troca/)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Aprovar Compra' })).toBeDisabled()
  })

  it('sem troca, aprovar continua disponível', () => {
    render(
      <OrderDetailDrawer
        order={order()}
        items={[]}
        tradeIns={[]}
        approving={false}
        onApprove={noop}
        onGoToNegotiations={noop}
        onClose={noop}
      />,
    )

    expect(screen.getByRole('button', { name: 'Aprovar Compra' })).toBeEnabled()
  })
})
