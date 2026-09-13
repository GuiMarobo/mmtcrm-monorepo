import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductPriceModal } from './ProductPriceModal'
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

const setup = (props: Partial<Parameters<typeof ProductPriceModal>[0]> = {}) => {
  const handlers = {
    onClose: vi.fn(),
    onSave: vi.fn().mockResolvedValue(undefined),
    onError: vi.fn(),
  }
  render(<ProductPriceModal product={product()} {...handlers} {...props} />)
  return { ...handlers, ...props }
}

describe('ProductPriceModal (RP4)', () => {
  it('abre com o preço atual e envia só o novo preço', async () => {
    const user = userEvent.setup()
    const { onSave } = setup()

    const price = screen.getByLabelText(/Novo preço/)
    expect(price).toHaveValue(7999.9)
    await user.clear(price)
    await user.type(price, '8499.5')
    await user.click(screen.getByRole('button', { name: 'Atualizar preço' }))

    expect(onSave).toHaveBeenCalledWith({ price: 8499.5 })
  })

  it('mostra o preço atual formatado', () => {
    setup()

    expect(screen.getByText(/Preço atual: R\$ 7\.999,90/)).toBeInTheDocument()
  })

  it.each([
    ['-1', 'O preço não pode ser negativo.'],
    ['', 'Informe o preço de venda.'],
  ])('não envia o preço %p', async (value, message) => {
    const user = userEvent.setup()
    const { onSave } = setup()

    const price = screen.getByLabelText(/Novo preço/)
    await user.clear(price)
    if (value) await user.type(price, value)
    await user.click(screen.getByRole('button', { name: 'Atualizar preço' }))

    expect(onSave).not.toHaveBeenCalled()
    expect(screen.getByText(message)).toBeInTheDocument()
  })

  it('mostra o erro do backend e mantém o diálogo aberto', async () => {
    const user = userEvent.setup()
    const { onError, onClose } = setup({
      onSave: vi.fn().mockRejectedValue(new ApiError(404, 'Produto não encontrado')),
    })

    await user.click(screen.getByRole('button', { name: 'Atualizar preço' }))

    await waitFor(() => expect(onError).toHaveBeenCalledWith('Produto não encontrado'))
    expect(onClose).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Atualizar preço' })).toBeEnabled()
  })
})
