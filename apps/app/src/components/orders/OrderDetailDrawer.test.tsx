import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrderDetailDrawer } from './OrderDetailDrawer'
import type { Order } from '../../types'

const order = (overrides: Partial<Order> = {}): Order => ({
  id: 7,
  code: 'PED-7',
  status: 'EM_NEGOCIACAO',
  paymentMethod: 'PIX',
  totalValue: 2500,
  statusChangedAt: '2026-02-01T00:00:00Z',
  createdAt: '2026-01-01T00:00:00Z',
  negotiationId: 3,
  notes: null,
  client: { id: 'c1', name: 'Fulana de Tal', status: 'ATIVO' },
  vendedor: { id: 2, name: 'Vendedora' },
  ...overrides,
})

const noop = () => undefined

describe('OrderDetailDrawer', () => {
  it('em "Aguardando Pagamento" mostra "Aprovar Compra" e o aviso do quadro (RN9/D9)', () => {
    render(
      <OrderDetailDrawer
        order={order()}
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
})
