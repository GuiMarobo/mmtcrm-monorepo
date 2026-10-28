import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BOARD_PAGE_SIZE, NegotiationBoard } from './NegotiationBoard'
import type { Negotiation } from '../../types'

const won = (id: number): Negotiation => ({
  id,
  clientId: `c-${id}`,
  vendedorId: 1,
  status: 'GANHA',
  totalValue: 1000,
  notes: null,
  closedAt: null,
  createdAt: '2026-10-01T12:00:00Z',
  updatedAt: '2026-10-01T12:00:00Z',
  client: { id: `c-${id}`, name: `Cliente ${id}`, status: 'ATIVO' },
  vendedor: { id: 1, name: 'Carla Vendas' },
  order: null,
})

const renderBoard = (items: Negotiation[]) =>
  render(
    <NegotiationBoard
      items={items}
      onMove={vi.fn().mockResolvedValue(true)}
      onRefuse={vi.fn()}
      onEdit={vi.fn()}
      onDelete={vi.fn()}
    />,
  )

const wonColumn = () => within(screen.getByRole('region', { name: 'Ganha' }))

describe('NegotiationBoard', () => {
  it('mostra uma página por coluna e conta o total no cabeçalho', () => {
    renderBoard(Array.from({ length: 25 }, (_, i) => won(i + 1)))

    expect(wonColumn().getByText('25')).toBeInTheDocument()
    expect(wonColumn().getAllByLabelText(/^Negociação de/)).toHaveLength(BOARD_PAGE_SIZE)
    expect(wonColumn().getByText('Cliente 1')).toBeInTheDocument()
    expect(wonColumn().queryByText('Cliente 25')).not.toBeInTheDocument()
  })

  it('pula direto para a última página da coluna', async () => {
    renderBoard(Array.from({ length: 25 }, (_, i) => won(i + 1)))

    await userEvent.click(wonColumn().getByRole('button', { name: 'Página 9' }))

    expect(wonColumn().getAllByLabelText(/^Negociação de/)).toHaveLength(1)
    expect(wonColumn().getByText('Cliente 25')).toBeInTheDocument()
  })

  it('não mostra paginação quando a coluna cabe numa página', () => {
    renderBoard([won(1), won(2)])

    expect(screen.queryByRole('navigation')).not.toBeInTheDocument()
  })
})
