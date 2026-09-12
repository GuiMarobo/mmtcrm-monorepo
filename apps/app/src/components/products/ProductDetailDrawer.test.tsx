import { describe, expect, it, vi } from 'vitest'
import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { ProductDetailDrawer } from './ProductDetailDrawer'
import type { Product, StockMovement } from '../../types'

const product = (overrides: Partial<Product> = {}): Product => ({
  id: 'p1',
  name: 'iPhone 15 Pro',
  sku: 'IP15P-256',
  description: 'Titânio natural, 256 GB, lacrado.',
  category: 'IPHONE',
  price: 7999.9,
  stock: 5,
  status: 'ATIVO',
  createdAt: '2026-09-11T12:00:00Z',
  updatedAt: '2026-09-11T12:00:00Z',
  ...overrides,
})

const movement = (overrides: Partial<StockMovement> = {}): StockMovement => ({
  id: 'm1',
  type: 'ENTRADA',
  quantity: 10,
  note: 'Carga inicial de estoque',
  createdAt: '2026-09-11T12:00:00Z',
  user: { id: 42, name: 'Ana Admin' },
  ...overrides,
})

const noop = () => undefined

const setup = (props: Partial<Parameters<typeof ProductDetailDrawer>[0]> = {}) =>
  render(
    <ProductDetailDrawer
      product={product()}
      movements={[movement()]}
      movementsLoading={false}
      movementsError={null}
      isAdmin
      onClose={noop}
      {...props}
    />,
  )

describe('ProductDetailDrawer', () => {
  it('mostra todos os dados do Produto, inclusive a descrição completa (UC6 §2.3)', () => {
    setup()

    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
    expect(screen.getByText('IP15P-256')).toBeInTheDocument()
    expect(
      screen.getByText('Titânio natural, 256 GB, lacrado.'),
    ).toBeInTheDocument()
    expect(screen.getByText('iPhone')).toBeInTheDocument()
    expect(screen.getByText('R$ 7.999,90')).toBeInTheDocument()
    expect(screen.getByText('Ativo')).toBeInTheDocument()
    expect(screen.getByLabelText('Saldo atual')).toHaveTextContent('5')
  })

  it('renderiza cada movimento com data, tipo, quantidade, autor e observação', () => {
    setup({
      movements: [
        movement({
          id: 'm2',
          type: 'SAIDA',
          quantity: 3,
          note: 'Venda de balcão',
          createdAt: '2026-09-12T12:00:00Z',
          user: { id: 7, name: 'Bruno Vendedor' },
        }),
        movement(),
      ],
    })

    const rows = screen.getAllByRole('listitem')
    expect(rows).toHaveLength(2)

    expect(rows[0]).toHaveTextContent('12/09/2026')
    expect(rows[0]).toHaveTextContent('Saída')
    expect(rows[0]).toHaveTextContent('3')
    expect(rows[0]).toHaveTextContent('Bruno Vendedor')
    expect(rows[0]).toHaveTextContent('Venda de balcão')

    expect(rows[1]).toHaveTextContent('11/09/2026')
    expect(rows[1]).toHaveTextContent('Entrada')
    expect(rows[1]).toHaveTextContent('Ana Admin')
    expect(rows[1]).toHaveTextContent('Carga inicial de estoque')
  })

  it('preserva o movimento cujo autor foi excluído', () => {
    setup({ movements: [movement({ user: null })] })

    expect(screen.getByRole('listitem')).toHaveTextContent('Autor removido')
  })

  it('avisa quando o Produto ainda não tem movimentação', () => {
    setup({ movements: [] })

    expect(screen.getByText('Nenhuma movimentação ainda')).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })

  it('para o ADMIN reserva os dois botões de ação e o menu ⋮ (tickets 04-06)', () => {
    setup()

    expect(
      screen.getByRole('button', { name: 'Atualizar Preço' }),
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: 'Movimentar Estoque' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Ações' })).toBeInTheDocument()
  })

  it('para o VENDEDOR mostra só os dados — sem botões de ação nem menu ⋮ (RP10)', () => {
    setup({ isAdmin: false })

    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
    expect(screen.getByRole('listitem')).toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Atualizar Preço' }),
    ).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Movimentar Estoque' }),
    ).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Ações' })).not.toBeInTheDocument()
  })

  it('o menu do ADMIN oferece Editar, Descontinuar e Excluir num Produto Ativo (RP6)', async () => {
    setup()

    await userEvent.click(screen.getByRole('button', { name: 'Ações' }))

    expect(screen.getByRole('menuitem', { name: 'Editar' })).toBeInTheDocument()
    expect(
      screen.getByRole('menuitem', { name: 'Descontinuar' }),
    ).toBeInTheDocument()
    expect(screen.getByRole('menuitem', { name: 'Excluir' })).toBeInTheDocument()
    expect(
      screen.queryByRole('menuitem', { name: 'Reativar' }),
    ).not.toBeInTheDocument()
  })

  it('num Produto Inativo o menu troca Descontinuar por Reativar (RP7)', async () => {
    setup({ product: product({ status: 'INATIVO' }) })

    await userEvent.click(screen.getByRole('button', { name: 'Ações' }))

    expect(screen.getByRole('menuitem', { name: 'Reativar' })).toBeInTheDocument()
    expect(
      screen.queryByRole('menuitem', { name: 'Descontinuar' }),
    ).not.toBeInTheDocument()
  })

  it('as ações ainda sem handler ficam desabilitadas, sem prometer o que não faz', () => {
    setup()

    expect(screen.getByRole('button', { name: 'Atualizar Preço' })).toBeDisabled()
    expect(
      screen.getByRole('button', { name: 'Movimentar Estoque' }),
    ).toBeDisabled()
  })

  it('com handler, o botão chama a ação do ticket que o ligou', async () => {
    const onMoveStock = vi.fn()
    setup({ onMoveStock })

    await userEvent.click(
      screen.getByRole('button', { name: 'Movimentar Estoque' }),
    )

    expect(onMoveStock).toHaveBeenCalledTimes(1)
  })

  it('informa a falha de carregamento do histórico sem esconder os dados', () => {
    setup({ movements: [], movementsError: 'Falha ao carregar o histórico.' })

    expect(screen.getByText('Falha ao carregar o histórico.')).toBeInTheDocument()
    expect(screen.getByText('iPhone 15 Pro')).toBeInTheDocument()
  })

  it('fecha pelo botão de fechar', async () => {
    const onClose = vi.fn()
    setup({ onClose })

    await userEvent.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('avisa saldo zerado, porque sem saldo o Produto não é disponível', () => {
    setup({ product: product({ stock: 0 }) })

    expect(
      screen.getByText(/Sem saldo em estoque/i),
    ).toBeInTheDocument()
  })

  it('com saldo não mostra o aviso de estoque', () => {
    setup({ product: product({ stock: 5 }) })

    expect(screen.queryByText(/Sem saldo em estoque/i)).not.toBeInTheDocument()
  })

  it('com o histórico em erro não mostra movimento algum junto do aviso', () => {
    setup({
      movements: [movement()],
      movementsError: 'Falha ao carregar o histórico.',
    })

    expect(screen.getByText('Falha ao carregar o histórico.')).toBeInTheDocument()
    expect(screen.queryByRole('listitem')).not.toBeInTheDocument()
  })
})
