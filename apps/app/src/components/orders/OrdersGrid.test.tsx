import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
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
  client: { id: 'c1', name: 'Maria Souza', status: 'ATIVO', anonymizedAt: null },
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

  describe('leitura da linha', () => {
    const NOW = new Date('2026-09-20T12:00:00Z')
    const daysAgo = (days: number) =>
      new Date(NOW.getTime() - days * 24 * 60 * 60 * 1000).toISOString()

    const rowOf = (code: string) => {
      const row = screen.getByText(code).closest('[role="row"]')
      if (!(row instanceof HTMLElement)) throw new Error(`linha ${code} não encontrada`)
      return row
    }

    beforeEach(() => {
      vi.useFakeTimers({ now: NOW, toFake: ['Date'] })
    })

    afterEach(() => {
      vi.useRealTimers()
    })

    it('Cliente mostra avatar com iniciais, o nome e o vendedor embaixo; Vendedor e Forma de pagamento não são mais colunas', () => {
      renderGrid({ rows: [order({ code: 'PED-0001' })] })

      const row = rowOf('PED-0001')
      expect(within(row).getByText('MS')).toBeInTheDocument()
      expect(within(row).getByText('Maria Souza')).toBeInTheDocument()
      expect(within(row).getByText('Vendedor: João Vendedor')).toBeInTheDocument()
      expect(within(row).queryByText('Anonimizado')).not.toBeInTheDocument()
      expect(screen.queryByRole('columnheader', { name: 'Vendedor' })).not.toBeInTheDocument()
      expect(
        screen.queryByRole('columnheader', { name: 'Forma de pagamento' }),
      ).not.toBeInTheDocument()
    })

    it('Cliente anonimizado ganha o chip Anonimizado', () => {
      renderGrid({
        rows: [
          order({
            code: 'PED-0001',
            client: {
              id: 'c1',
              name: 'Titular removido',
              status: 'INATIVO',
              anonymizedAt: '2026-08-01T00:00:00Z',
            },
          }),
        ],
      })

      const row = rowOf('PED-0001')
      expect(within(row).getByText('TR')).toBeInTheDocument()
      expect(within(row).getByText('Anonimizado')).toBeInTheDocument()
    })

    it('Valor mostra o valor formatado com a forma de pagamento embaixo, ou "-" sem forma', () => {
      renderGrid({
        rows: [
          order({ id: 1, code: 'PED-0001', statusChangedAt: daysAgo(1) }),
          order({
            id: 2,
            code: 'PED-0002',
            paymentMethod: null,
            totalValue: 150,
            statusChangedAt: daysAgo(2),
          }),
        ],
      })

      const withMethod = rowOf('PED-0001')
      expect(within(withMethod).getByText('R$ 7.999,90')).toBeInTheDocument()
      expect(within(withMethod).getByText('PIX')).toBeInTheDocument()

      const withoutMethod = rowOf('PED-0002')
      expect(within(withoutMethod).getByText('R$ 150,00')).toBeInTheDocument()
      expect(within(withoutMethod).getByText('-')).toBeInTheDocument()
    })

    it('Situação desde aparece em tempo relativo, com a data exata na dica', async () => {
      renderGrid({ rows: [order({ code: 'PED-0001', statusChangedAt: daysAgo(3) })] })

      const relative = within(rowOf('PED-0001')).getByText('há 3 dias')
      await userEvent.hover(relative)

      expect(await screen.findByRole('tooltip')).toHaveTextContent('17/09/2026')
    })

    it('alerta de cobrança na aba Aguardando: nada abaixo de 3 dias, âmbar a partir de 3, vermelho a partir de 7', () => {
      renderGrid({
        rows: [
          order({ id: 1, code: 'PED-0001', statusChangedAt: daysAgo(2.9) }),
          order({ id: 2, code: 'PED-0002', statusChangedAt: daysAgo(3) }),
          order({ id: 3, code: 'PED-0003', statusChangedAt: daysAgo(6.9) }),
          order({ id: 4, code: 'PED-0004', statusChangedAt: daysAgo(7) }),
        ],
      })

      expect(within(rowOf('PED-0001')).queryByRole('img', { name: /Alerta de cobrança/ })).not.toBeInTheDocument()

      for (const code of ['PED-0002', 'PED-0003']) {
        const alert = within(rowOf(code)).getByRole('img', {
          name: 'Alerta de cobrança: 3 dias ou mais',
        })
        expect(alert).toHaveClass('MuiSvgIcon-colorWarning')
      }

      const red = within(rowOf('PED-0004')).getByRole('img', {
        name: 'Alerta de cobrança: 7 dias ou mais',
      })
      expect(red).toHaveClass('MuiSvgIcon-colorError')
    })

    it('sem alerta de cobrança fora da aba Aguardando, mesmo em pedido parado há muito tempo', async () => {
      renderGrid({
        rows: [
          order({ id: 1, code: 'PED-0001', statusChangedAt: daysAgo(10) }),
          order({
            id: 2,
            code: 'PED-0002',
            status: 'COMPRA_APROVADA',
            statusChangedAt: daysAgo(10),
          }),
          order({
            id: 3,
            code: 'PED-0003',
            status: 'DESISTENCIA',
            statusChangedAt: daysAgo(10),
          }),
        ],
      })

      await userEvent.click(tab(/Compra aprovada/))
      expect(screen.queryByRole('img', { name: /Alerta de cobrança/ })).not.toBeInTheDocument()

      await userEvent.click(tab(/Desistência/))
      expect(screen.queryByRole('img', { name: /Alerta de cobrança/ })).not.toBeInTheDocument()

      await userEvent.click(tab(/Todos/))
      expect(screen.queryByRole('img', { name: /Alerta de cobrança/ })).not.toBeInTheDocument()
    })
  })
})
