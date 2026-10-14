import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ConvertToOrderModal } from './ConvertToOrderModal'
import { ApiError } from '../../api'
import type { Negotiation, UsedDevice } from '../../types'

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

const device = (overrides: Partial<UsedDevice>): UsedDevice => ({
  id: 9,
  negotiationId: 3,
  model: 'iPhone 12 128 GB',
  serialNumber: 'F2LXK0ABCD',
  imei: null,
  evaluationStatus: 'AGUARDANDO',
  condition: null,
  estimatedValue: null,
  report: null,
  icloudUnlocked: null,
  evaluatedAt: null,
  evaluator: null,
  createdAt: '2026-10-05T12:00:00Z',
  createdBy: null,
  ...overrides,
})

const setup = (
  onConfirm = vi.fn().mockResolvedValue(undefined),
  { tradeIns = [], tradeInsError = null }: { tradeIns?: UsedDevice[] | null; tradeInsError?: string | null } = {},
) => {
  const onCancel = vi.fn()
  render(
    <ConvertToOrderModal
      negotiation={negotiation}
      tradeIns={tradeIns}
      tradeInsError={tradeInsError}
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

  describe('aparelhos na troca (RD11)', () => {
    const amountDueLine = () => screen.getByText('Saldo a pagar').nextSibling

    it('mostra o Saldo a pagar com o total das trocas avaliadas', () => {
      setup(undefined, {
        tradeIns: [
          device({ id: 1, evaluationStatus: 'AVALIADO', estimatedValue: 400 }),
          device({ id: 2, evaluationStatus: 'RECUSADO', report: 'iCloud' }),
        ],
      })

      expect(screen.getByText('Total das trocas').nextSibling).toHaveTextContent('400,00')
      expect(amountDueLine()).toHaveTextContent('1.100,00')
    })

    it('com aparelho aguardando, mostra o motivo e não deixa converter', async () => {
      const user = userEvent.setup()
      const { onConfirm } = setup(undefined, {
        tradeIns: [device({ model: 'iPhone 13 Pro', serialNumber: 'G7ABC' })],
      })

      expect(screen.getByText(/iPhone 13 Pro \(série G7ABC\) ainda aguarda avaliação/)).toBeInTheDocument()
      await user.click(screen.getByLabelText(/Forma de pagamento/))
      await user.click(screen.getByRole('option', { name: 'PIX' }))
      expect(screen.getByRole('button', { name: 'Converter em pedido' })).toBeDisabled()
      expect(onConfirm).not.toHaveBeenCalled()
    })

    it('com Saldo a pagar negativo, mostra o motivo e não deixa converter', async () => {
      const user = userEvent.setup()
      setup(undefined, {
        tradeIns: [device({ evaluationStatus: 'AVALIADO', estimatedValue: 1600 })],
      })

      expect(amountDueLine()).toHaveTextContent('-R$')
      expect(screen.getByText(/Saldo a pagar negativo/)).toBeInTheDocument()
      await user.click(screen.getByLabelText(/Forma de pagamento/))
      await user.click(screen.getByRole('option', { name: 'PIX' }))
      expect(screen.getByRole('button', { name: 'Converter em pedido' })).toBeDisabled()
    })

    it('aparelho recusado não bloqueia', async () => {
      const user = userEvent.setup()
      const { onConfirm } = setup(undefined, {
        tradeIns: [device({ evaluationStatus: 'RECUSADO', report: 'Tela trincada' })],
      })

      await choosePixAndConfirm(user)

      expect(onConfirm).toHaveBeenCalledWith('PIX')
    })

    it('enquanto carrega os aparelhos, não deixa converter', () => {
      setup(undefined, { tradeIns: null })

      expect(screen.getByText(/Carregando aparelhos na troca/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Converter em pedido' })).toBeDisabled()
    })

    it('se a troca não carregar, avisa e deixa o backend decidir', async () => {
      const user = userEvent.setup()
      const { onConfirm } = setup(undefined, { tradeIns: null, tradeInsError: 'Falha' })

      expect(screen.getByText(/Não foi possível carregar a troca/)).toBeInTheDocument()
      await choosePixAndConfirm(user)

      expect(onConfirm).toHaveBeenCalledWith('PIX')
    })
  })
})
