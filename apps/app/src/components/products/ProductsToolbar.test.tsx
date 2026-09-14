import { describe, expect, it, vi } from 'vitest'
import { fireEvent, render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductsToolbar } from './ProductsToolbar'
import { EMPTY_PRODUCT_FILTERS } from './productsFilter'

describe('ProductsToolbar', () => {
  it('digitar na busca atualiza o texto do filtro, mantendo os demais', () => {
    const onChange = vi.fn()
    render(
      <ProductsToolbar
        filters={{ ...EMPTY_PRODUCT_FILTERS, category: 'MAC' }}
        onChange={onChange}
      />,
    )

    fireEvent.change(screen.getByPlaceholderText(/Buscar por nome ou código/), {
      target: { value: 'air' },
    })

    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_PRODUCT_FILTERS,
      category: 'MAC',
      query: 'air',
    })
  })

  it('escolher uma categoria filtra por ela', async () => {
    const onChange = vi.fn()
    render(<ProductsToolbar filters={EMPTY_PRODUCT_FILTERS} onChange={onChange} />)

    await userEvent.click(screen.getByRole('combobox', { name: 'Categoria' }))
    await userEvent.click(within(screen.getByRole('listbox')).getByText('Áudio'))

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_PRODUCT_FILTERS, category: 'AUDIO' })
  })

  it('escolher uma situação filtra por ela', async () => {
    const onChange = vi.fn()
    render(<ProductsToolbar filters={EMPTY_PRODUCT_FILTERS} onChange={onChange} />)

    await userEvent.click(screen.getByRole('combobox', { name: 'Situação' }))
    await userEvent.click(within(screen.getByRole('listbox')).getByText('Inativo'))

    expect(onChange).toHaveBeenCalledWith({ ...EMPTY_PRODUCT_FILTERS, status: 'INATIVO' })
  })

  it('o seletor de disponibilidade oferece Todos / Em estoque / Sem estoque', async () => {
    const onChange = vi.fn()
    render(<ProductsToolbar filters={EMPTY_PRODUCT_FILTERS} onChange={onChange} />)

    const group = screen.getByRole('group', { name: 'Disponibilidade' })
    expect(within(group).getByRole('button', { name: 'Todos' })).toHaveAttribute(
      'aria-pressed',
      'true',
    )

    await userEvent.click(within(group).getByRole('button', { name: 'Sem estoque' }))

    expect(onChange).toHaveBeenCalledWith({
      ...EMPTY_PRODUCT_FILTERS,
      availability: 'SEM_ESTOQUE',
    })
  })

  it('clicar de novo na disponibilidade já escolhida não a desmarca', async () => {
    const onChange = vi.fn()
    render(<ProductsToolbar filters={EMPTY_PRODUCT_FILTERS} onChange={onChange} />)

    await userEvent.click(screen.getByRole('button', { name: 'Todos' }))

    expect(onChange).not.toHaveBeenCalled()
  })
})
