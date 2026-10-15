import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrdersTable } from './OrdersTable'
import type { Order } from '../../types'

const order = (overrides: Partial<Order> = {}): Order => ({
  id: 1,
  code: 'PED-0001',
  status: 'EM_NEGOCIACAO',
  paymentMethod: null,
  totalValue: 7999.9,
  statusChangedAt: '2026-09-11T00:00:00Z',
  negotiationId: 1,
  notes: null,
  client: { id: 'c1', name: 'Maria Souza' } as Order['client'],
  vendedor: { id: 1, name: 'João Vendedor' } as Order['vendedor'],
  ...overrides,
})

const noop = () => undefined

describe('OrdersTable', () => {
  it('mostra as colunas do pedido com os rótulos em pt-BR', () => {
    render(
      <OrdersTable rows={[order()]} loading={false} onOpen={noop} />,
    )

    expect(screen.getByText('PED-0001')).toBeInTheDocument()
    expect(screen.getByText('Maria Souza')).toBeInTheDocument()
    expect(screen.getByText('R$ 7.999,90')).toBeInTheDocument()
    expect(screen.queryByText('EM_NEGOCIACAO')).not.toBeInTheDocument()
  })

  it('clicar numa linha abre o detalhe do Pedido daquela linha', async () => {
    const onOpen = vi.fn()
    render(<OrdersTable rows={[order()]} loading={false} onOpen={onOpen} />)

    await userEvent.click(screen.getByText('Maria Souza'))

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 1 }))
  })
})
