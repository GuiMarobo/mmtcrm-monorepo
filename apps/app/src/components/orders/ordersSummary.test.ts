import { describe, expect, it } from 'vitest'
import { summarizeAwaitingPayment } from './ordersSummary'
import type { Order } from '../../types'

const order = (overrides: Partial<Order>): Order => ({
  id: 1,
  code: 'PED-1',
  status: 'EM_NEGOCIACAO',
  paymentMethod: 'PIX',
  totalValue: 1000,
  statusChangedAt: '2026-01-01T00:00:00Z',
  negotiationId: 1,
  notes: null,
  client: null,
  vendedor: null,
  ...overrides,
})

describe('summarizeAwaitingPayment', () => {
  it('soma só os pedidos EM_NEGOCIACAO (D13)', () => {
    const result = summarizeAwaitingPayment([
      order({ id: 1, status: 'EM_NEGOCIACAO', totalValue: 1500 }),
      order({ id: 2, status: 'EM_NEGOCIACAO', totalValue: 500 }),
      order({ id: 3, status: 'COMPRA_APROVADA', totalValue: 9999 }),
      order({ id: 4, status: 'DESISTENCIA', totalValue: 777 }),
    ])

    expect(result.total).toBe(2000)
    expect(result.count).toBe(2)
    expect(result.label).toContain('em 2 pedidos')
    expect(result.label).toContain('R$')
  })

  it('usa o singular quando há um só pedido aguardando', () => {
    const result = summarizeAwaitingPayment([
      order({ id: 1, status: 'EM_NEGOCIACAO', totalValue: 300 }),
    ])

    expect(result.label).toContain('em 1 pedido')
    expect(result.label).not.toContain('em 1 pedidos')
  })

  it('lista vazia: zero em zero pedidos', () => {
    const result = summarizeAwaitingPayment([])
    expect(result).toMatchObject({ total: 0, count: 0 })
  })
})
