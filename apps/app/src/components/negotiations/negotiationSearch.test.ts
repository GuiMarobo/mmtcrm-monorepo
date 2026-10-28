import { describe, expect, it } from 'vitest'
import { filterNegotiations } from './negotiationSearch'
import type { Negotiation } from '../../types'

const negotiation = (id: number, clientName: string, overrides: Partial<Negotiation> = {}): Negotiation => ({
  id,
  clientId: `c-${id}`,
  vendedorId: 1,
  status: 'GANHA',
  totalValue: 5000,
  notes: null,
  closedAt: null,
  createdAt: '2026-10-01T12:00:00Z',
  updatedAt: '2026-10-01T12:00:00Z',
  client: { id: `c-${id}`, name: clientName, status: 'ATIVO' },
  vendedor: { id: 1, name: 'Carla Vendas' },
  order: null,
  ...overrides,
})

describe('filterNegotiations', () => {
  const items = [
    negotiation(1, 'João Gonçalves'),
    negotiation(2, 'Maria Souza', {
      order: { id: 7, code: 'PED-0042', status: 'COMPRA_APROVADA', paymentMethod: null, totalValue: 5000 },
    }),
    negotiation(3, 'Ana Lima', { vendedor: { id: 2, name: 'Pedro Loja' } }),
  ]

  it('devolve tudo quando a busca está vazia', () => {
    expect(filterNegotiations(items, '   ')).toHaveLength(3)
  })

  it('encontra o cliente ignorando acento e maiúscula', () => {
    expect(filterNegotiations(items, 'joao goncalves').map((n) => n.id)).toEqual([1])
  })

  it('encontra pelo código do pedido e pelo vendedor', () => {
    expect(filterNegotiations(items, 'ped-0042').map((n) => n.id)).toEqual([2])
    expect(filterNegotiations(items, 'pedro').map((n) => n.id)).toEqual([3])
  })
})
