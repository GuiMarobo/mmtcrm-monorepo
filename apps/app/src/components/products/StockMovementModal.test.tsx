import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { StockMovementModal } from './StockMovementModal'
import { ApiError } from '../../api'
import type { Product } from '../../types'

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'iPhone 15 Pro',
  sku: 'IP15P-256',
  description: null,
  category: 'IPHONE',
  price: 7999.9,
  stock: 2,
  status: 'ATIVO',
  createdAt: '2026-09-11T12:00:00Z',
  updatedAt: '2026-09-11T12:00:00Z',
  ...overrides,
})

const setup = (props: Partial<Parameters<typeof StockMovementModal>[0]> = {}) => {
  const handlers = {
    onClose: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    onError: vi.fn(),
  }
  render(<StockMovementModal product={product()} {...handlers} {...props} />)
  return { ...handlers, ...props }
}

describe('StockMovementModal', () => {
  it('envia tipo, quantidade e observação preenchidos', async () => {
    const user = userEvent.setup()
    const { onSave } = setup()

    await user.click(screen.getByRole('button', { name: 'Saída' }))
    await user.type(screen.getByLabelText(/Quantidade/), '2')
    await user.type(screen.getByLabelText('Observação'), 'Venda de balcão')
    await user.click(screen.getByRole('button', { name: 'Registrar movimento' }))

    expect(onSave).toHaveBeenCalledWith({
      type: 'SAIDA',
      quantity: 2,
      note: 'Venda de balcão',
    })
  })

  it('começa em Entrada e omite a observação vazia', async () => {
    const user = userEvent.setup()
    const { onSave } = setup()

    await user.type(screen.getByLabelText(/Quantidade/), '5')
    await user.click(screen.getByRole('button', { name: 'Registrar movimento' }))

    expect(onSave).toHaveBeenCalledWith({ type: 'ENTRADA', quantity: 5 })
  })

  it.each(['0', '-3', '1.5'])(
    'não envia quantidade %s: precisa ser inteiro maior que zero',
    async (quantity) => {
      const user = userEvent.setup()
      const { onSave } = setup()

      await user.type(screen.getByLabelText(/Quantidade/), quantity)
      await user.click(screen.getByRole('button', { name: 'Registrar movimento' }))

      expect(onSave).not.toHaveBeenCalled()
      expect(
        screen.getByText('A quantidade deve ser um número inteiro maior que zero.'),
      ).toBeInTheDocument()
    },
  )

  it('mostra o erro do backend e mantém o diálogo aberto quando a saída é recusada', async () => {
    const user = userEvent.setup()
    const { onSave, onError, onClose } = setup({
      onSave: vi
        .fn()
        .mockRejectedValue(
          new ApiError(409, 'Saldo insuficiente: há 2 unidade(s) disponível(is)'),
        ),
    })

    await user.click(screen.getByRole('button', { name: 'Saída' }))
    await user.type(screen.getByLabelText(/Quantidade/), '3')
    await user.click(screen.getByRole('button', { name: 'Registrar movimento' }))

    expect(onSave).toHaveBeenCalled()
    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith(
        'Saldo insuficiente: há 2 unidade(s) disponível(is)',
      ),
    )
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Registrar movimento' }),
    ).toBeEnabled()
  })

  it('informa o saldo atual do Produto', () => {
    setup()

    expect(screen.getByText(/Saldo atual: 2/)).toBeInTheDocument()
  })
})
