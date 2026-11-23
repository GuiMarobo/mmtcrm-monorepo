import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { BulkActionsBar } from './BulkActionsBar'

describe('BulkActionsBar', () => {
  it.each([
    [1, '1 selecionado'],
    [3, '3 selecionados'],
  ])('com %i na seleção anuncia "%s" numa região própria', (count, text) => {
    render(<BulkActionsBar count={count} actions={[]} onClear={vi.fn()} />)

    const bar = screen.getByRole('region', { name: 'Ações em massa' })
    expect(within(bar).getByRole('status')).toHaveTextContent(text)
    expect(within(bar).getByRole('status')).toHaveAttribute('aria-live', 'polite')
  })

  it('mostra as ações recebidas, na ordem, e cada uma dispara o seu clique', async () => {
    const archive = vi.fn()
    const remove = vi.fn()
    render(
      <BulkActionsBar
        count={2}
        actions={[
          { key: 'archive', label: 'Arquivar', onClick: archive },
          { key: 'remove', label: 'Excluir', onClick: remove, danger: true },
        ]}
        onClear={vi.fn()}
      />,
    )

    const toolbar = screen.getByRole('region', { name: 'Ações em massa' })
    expect(
      Array.from(toolbar.querySelectorAll('button')).map((button) => button.textContent),
    ).toEqual(['Arquivar', 'Excluir', ''])

    await userEvent.click(screen.getByRole('button', { name: 'Excluir' }))
    expect(remove).toHaveBeenCalledOnce()
    expect(archive).not.toHaveBeenCalled()
  })

  it('✕ limpa a seleção', async () => {
    const onClear = vi.fn()
    render(<BulkActionsBar count={2} actions={[]} onClear={onClear} />)

    await userEvent.click(screen.getByRole('button', { name: 'Limpar seleção' }))

    expect(onClear).toHaveBeenCalledOnce()
  })
})
