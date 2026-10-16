import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { RowActionsMenu } from './RowActionsMenu'
import type { RowAction } from './RowActionsMenu'

const REASON = 'O Pedido já teve a Compra aprovada'

const disabledReopen = (onClick = vi.fn()): RowAction => ({
  key: 'reopen',
  label: 'Reabrir negociação',
  icon: null,
  onClick,
  disabledReason: REASON,
})

function setup(actions: RowAction[]) {
  const user = userEvent.setup()
  render(<RowActionsMenu label="Ações do pedido" actions={actions} />)
  return user
}

describe('RowActionsMenu', () => {
  it('dispara a ação e fecha o menu ao clicar num item habilitado', async () => {
    const onClick = vi.fn()
    const user = setup([{ key: 'edit', label: 'Editar', icon: null, onClick }])

    await user.click(screen.getByRole('button', { name: 'Ações do pedido' }))
    await user.click(screen.getByRole('menuitem', { name: 'Editar' }))

    expect(onClick).toHaveBeenCalledOnce()
    expect(screen.queryByRole('menu')).not.toBeInTheDocument()
  })

  it('mostra o item desabilitado sem disparar a ação ao clicar', async () => {
    const onClick = vi.fn()
    const user = setup([disabledReopen(onClick)])

    await user.click(screen.getByRole('button', { name: 'Ações do pedido' }))
    const item = screen.getByRole('menuitem', { name: 'Reabrir negociação' })
    expect(item).toHaveAttribute('aria-disabled', 'true')

    await user.click(item)

    expect(onClick).not.toHaveBeenCalled()
    expect(screen.getByRole('menu')).toBeInTheDocument()
  })

  it('alcança o item desabilitado pelas setas, mostra a dica e não dispara a ação', async () => {
    const onClick = vi.fn()
    const user = setup([
      { key: 'edit', label: 'Editar', icon: null, onClick: vi.fn() },
      disabledReopen(onClick),
    ])

    screen.getByRole('button', { name: 'Ações do pedido' }).focus()
    await user.keyboard('{Enter}')
    expect(screen.getByRole('menuitem', { name: 'Editar' })).toHaveFocus()
    await user.keyboard('{ArrowDown}')

    expect(screen.getByRole('menuitem', { name: 'Reabrir negociação' })).toHaveFocus()
    expect(await screen.findByRole('tooltip')).toHaveTextContent(REASON)

    await user.keyboard('{Enter}')

    expect(onClick).not.toHaveBeenCalled()
  })

  it('expõe a dica do item desabilitado como descrição acessível', async () => {
    const user = setup([disabledReopen()])

    await user.click(screen.getByRole('button', { name: 'Ações do pedido' }))

    expect(screen.getByRole('menuitem', { name: 'Reabrir negociação' })).toHaveAccessibleDescription(REASON)
  })

  it('mostra a dica ao passar o mouse sobre o item desabilitado', async () => {
    const user = setup([disabledReopen()])

    await user.click(screen.getByRole('button', { name: 'Ações do pedido' }))
    await user.hover(screen.getByRole('menuitem', { name: 'Reabrir negociação' }))

    expect(await screen.findByRole('tooltip')).toHaveTextContent(REASON)
  })

  it('mantém o item sem marcação habilitado e sem descrição', async () => {
    const user = setup([{ key: 'edit', label: 'Editar', icon: null, onClick: vi.fn() }])

    await user.click(screen.getByRole('button', { name: 'Ações do pedido' }))
    const item = screen.getByRole('menuitem', { name: 'Editar' })

    expect(item).not.toHaveAttribute('aria-disabled')
    expect(item).not.toHaveAccessibleDescription()
  })
})
