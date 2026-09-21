import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductConfirmDialog } from './ProductConfirmDialog'
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

const setup = (
  props: Partial<Parameters<typeof ProductConfirmDialog>[0]> = {},
) => {
  const handlers = {
    onCancel: vi.fn(),
    onConfirm: vi.fn().mockResolvedValue(undefined),
    onError: vi.fn(),
  }
  render(
    <ProductConfirmDialog
      action="discontinue"
      product={product()}
      {...handlers}
      {...props}
    />,
  )
  return { ...handlers, ...props }
}

describe('ProductConfirmDialog (RP6, RP8)', () => {
  it.each([
    ['discontinue', 'Descontinuar produto?', 'Descontinuar'],
    ['delete', 'Excluir produto?', 'Excluir produto'],
  ] as const)(
    '%s só grava depois da confirmação explícita',
    async (action, title, confirmLabel) => {
      const user = userEvent.setup()
      const { onConfirm } = setup({ action })

      expect(screen.getByText(title)).toBeInTheDocument()
      expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
      expect(onConfirm).not.toHaveBeenCalled()

      await user.click(screen.getByRole('button', { name: confirmLabel }))

      expect(onConfirm).toHaveBeenCalledTimes(1)
    },
  )

  it('cancelar não grava nada', async () => {
    const user = userEvent.setup()
    const { onConfirm, onCancel } = setup({ action: 'delete' })

    await user.click(screen.getByRole('button', { name: 'Cancelar' }))

    expect(onCancel).toHaveBeenCalledTimes(1)
    expect(onConfirm).not.toHaveBeenCalled()
  })

  it('mostra o erro do backend e mantém o diálogo aberto', async () => {
    const user = userEvent.setup()
    const { onError, onCancel } = setup({
      onConfirm: vi
        .fn()
        .mockRejectedValue(new ApiError(409, 'Este produto já está descontinuado')),
    })

    await user.click(screen.getByRole('button', { name: 'Descontinuar' }))

    await waitFor(() =>
      expect(onError).toHaveBeenCalledWith('Este produto já está descontinuado'),
    )
    expect(onCancel).not.toHaveBeenCalled()
    expect(screen.getByRole('button', { name: 'Descontinuar' })).toBeEnabled()
  })
})
