import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConvertToOrderModal } from './ConvertToOrderModal'
import { ApiError } from '../../api'
import type { Negotiation } from '../../types'

const negotiation: Negotiation = {
  id: 3,
  clientId: 'c1',
  vendedorId: 2,
  status: 'ABERTA',
  totalValue: 1500,
  notes: null,
  closedAt: null,
  createdAt: '2026-09-01T12:00:00Z',
  updatedAt: '2026-09-01T12:00:00Z',
  client: { id: 'c1', name: 'Fulana', status: 'LEAD' },
  vendedor: { id: 2, name: 'Vendedora' },
  order: null,
}

const SHORT_STOCK =
  'Saldo insuficiente do Produto iPhone 15 Pro: há 2 unidade(s) disponível(is)'
const DELETED_PRODUCT =
  'O Produto AirPods Pro (APP-2) foi excluído do catálogo; remova o item'
const ALL_ITEMS_REMOVED =
  'A Negociação teve todos os itens removidos; adicione ao menos um item antes de converter'

const setup = (onConfirm = vi.fn().mockResolvedValue(undefined)) => {
  const onCancel = vi.fn()
  render(
    <ConvertToOrderModal
      negotiation={negotiation}
      loading={false}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />,
  )
  return { onConfirm, onCancel }
}

const choosePixAndConfirm = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByLabelText(/Forma de pagamento/))
  await user.click(screen.getByRole('option', { name: 'PIX' }))
  await user.click(screen.getByRole('button', { name: 'Converter em pedido' }))
}

describe('ConvertToOrderModal', () => {
  it('confirma com a forma de pagamento escolhida', async () => {
    const user = userEvent.setup()
    const { onConfirm } = setup()

    await choosePixAndConfirm(user)

    expect(onConfirm).toHaveBeenCalledWith('PIX')
    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })

  it.each([
    ['saldo insuficiente', SHORT_STOCK],
    ['Produto excluído', DELETED_PRODUCT],
    ['todos os itens removidos', ALL_ITEMS_REMOVED],
  ])('mostra a recusa do backend (%s) sem fechar o diálogo', async (_, message) => {
    const user = userEvent.setup()
    const { onConfirm, onCancel } = setup(
      vi.fn().mockRejectedValue(new ApiError(409, message)),
    )

    await choosePixAndConfirm(user)

    expect(await screen.findByRole('alert')).toHaveTextContent(message)
    expect(onCancel).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Converter em pedido' })).toBeEnabled()
    expect(onConfirm).toHaveBeenCalledTimes(1)
  })

  it('tentar de novo limpa a recusa anterior', async () => {
    const user = userEvent.setup()
    setup(
      vi
        .fn()
        .mockRejectedValueOnce(new ApiError(409, SHORT_STOCK))
        .mockResolvedValueOnce(undefined),
    )

    await choosePixAndConfirm(user)
    expect(await screen.findByRole('alert')).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Converter em pedido' }))

    expect(screen.queryByRole('alert')).not.toBeInTheDocument()
  })
})
