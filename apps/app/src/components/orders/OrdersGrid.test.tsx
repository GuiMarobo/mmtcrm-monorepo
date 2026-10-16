import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { OrdersGrid } from './OrdersGrid'
import type { Order } from '../../types'

const order = (overrides: Partial<Order> = {}): Order => ({
  id: 1,
  code: 'PED-0001',
  status: 'EM_NEGOCIACAO',
  paymentMethod: 'PIX',
  totalValue: 7999.9,
  statusChangedAt: '2026-09-11T00:00:00Z',
  negotiationId: 1,
  notes: null,
  client: { id: 'c1', name: 'Maria Souza', status: 'ATIVO' },
  vendedor: { id: 1, name: 'João Vendedor' },
  ...overrides,
})

const orders: Order[] = [
  order({ id: 1, code: 'PED-0001', statusChangedAt: '2026-09-10T00:00:00Z' }),
  order({ id: 2, code: 'PED-0002', statusChangedAt: '2026-09-05T00:00:00Z' }),
  order({ id: 3, code: 'PED-0003', statusChangedAt: '2026-09-20T00:00:00Z' }),
  order({
    id: 4,
    code: 'PED-0004',
    status: 'COMPRA_APROVADA',
    statusChangedAt: '2026-09-01T00:00:00Z',
  }),
  order({
    id: 5,
    code: 'PED-0005',
    status: 'COMPRA_APROVADA',
    statusChangedAt: '2026-09-15T00:00:00Z',
  }),
  order({
    id: 6,
    code: 'PED-0006',
    status: 'DESISTENCIA',
    statusChangedAt: '2026-09-12T00:00:00Z',
  }),
]

const noop = () => undefined

const renderGrid = (props: Partial<Parameters<typeof OrdersGrid>[0]> = {}) =>
  render(
    <OrdersGrid
      rows={orders}
      loading={false}
      error={null}
      onRetry={noop}
      onOpen={noop}
      disableVirtualization
      {...props}
    />,
  )

const visibleCodes = () =>
  screen.queryAllByText(/^PED-\d{4}$/).map((cell) => cell.textContent)

const tab = (name: RegExp) => screen.getByRole('tab', { name })

describe('OrdersGrid', () => {
  it('abre na aba Aguardando pagamento, com contador em cada uma das quatro abas', () => {
    renderGrid()

    expect(tab(/Aguardando pagamento/)).toHaveAttribute('aria-selected', 'true')
    expect(within(tab(/Aguardando pagamento/)).getByText('3')).toBeInTheDocument()
    expect(within(tab(/Compra aprovada/)).getByText('2')).toBeInTheDocument()
    expect(within(tab(/Desistência/)).getByText('1')).toBeInTheDocument()
    expect(within(tab(/Todos/)).getByText('6')).toBeInTheDocument()
  })

  it('Aguardando pagamento lista a fila de cobrança, do mais antigo para o mais novo', () => {
    renderGrid()

    expect(visibleCodes()).toEqual(['PED-0002', 'PED-0001', 'PED-0003'])
  })

  it('as outras abas filtram pela situação e listam do mais recente para o mais antigo', async () => {
    renderGrid()

    await userEvent.click(tab(/Compra aprovada/))
    expect(visibleCodes()).toEqual(['PED-0005', 'PED-0004'])

    await userEvent.click(tab(/Desistência/))
    expect(visibleCodes()).toEqual(['PED-0006'])

    await userEvent.click(tab(/Todos/))
    expect(visibleCodes()).toEqual([
      'PED-0003',
      'PED-0005',
      'PED-0006',
      'PED-0001',
      'PED-0002',
      'PED-0004',
    ])
  })

  it('continua permitindo ordenar por coluna', async () => {
    renderGrid()

    await userEvent.click(screen.getByRole('columnheader', { name: /Situação desde/ }))

    expect(visibleCodes()).not.toEqual(['PED-0002', 'PED-0001', 'PED-0003'])
    expect(visibleCodes()).toHaveLength(3)
  })

  it('mostra a coluna Situação só na aba Todos', async () => {
    renderGrid()

    expect(screen.queryByRole('columnheader', { name: 'Situação' })).not.toBeInTheDocument()

    await userEvent.click(tab(/Compra aprovada/))
    expect(screen.queryByRole('columnheader', { name: 'Situação' })).not.toBeInTheDocument()

    await userEvent.click(tab(/Todos/))
    expect(screen.getByRole('columnheader', { name: 'Situação' })).toBeInTheDocument()
    expect(screen.getByText('Desistência', { selector: '.MuiChip-label' })).toBeInTheDocument()
  })

  it('cada aba vazia tem a sua mensagem', async () => {
    renderGrid({ rows: [orders[3]] })

    expect(screen.getByText('Nenhum pedido aguardando pagamento')).toBeInTheDocument()

    await userEvent.click(tab(/Desistência/))
    expect(screen.getByText('Nenhuma desistência')).toBeInTheDocument()
  })

  it('erro ao carregar mostra a mensagem e o botão de tentar de novo', async () => {
    const onRetry = vi.fn()
    renderGrid({ rows: [], error: 'Falha ao carregar pedidos.', onRetry })

    expect(screen.getByText('Falha ao carregar pedidos.')).toBeInTheDocument()
    await userEvent.click(screen.getByRole('button', { name: /Tentar/ }))
    expect(onRetry).toHaveBeenCalledTimes(1)
  })

  it('clicar numa linha abre o detalhe do Pedido daquela linha', async () => {
    const onOpen = vi.fn()
    renderGrid({ onOpen })

    await userEvent.click(screen.getByText('PED-0003'))

    expect(onOpen).toHaveBeenCalledTimes(1)
    expect(onOpen).toHaveBeenCalledWith(expect.objectContaining({ id: 3 }))
  })

  it('não oferece seleção de linhas', () => {
    renderGrid()

    expect(screen.queryByRole('checkbox')).not.toBeInTheDocument()
  })
})
