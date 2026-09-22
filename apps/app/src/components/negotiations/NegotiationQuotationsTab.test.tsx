import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NegotiationFormModal } from './NegotiationFormModal'
import type { InstallmentRate, NegotiationDetail, NegotiationItem } from '../../types'

const item = (overrides: Partial<NegotiationItem> = {}): NegotiationItem => ({
  id: 10,
  product: { id: 'p1', name: 'iPhone 15 Pro', sku: 'IP15P-256', status: 'ATIVO', deleted: false },
  quantity: 2,
  unitPrice: 600,
  discountType: 'PERCENTUAL',
  discountValue: 10,
  discountAmount: 120,
  subtotal: 1080,
  ...overrides,
})

const negotiationDetail = (overrides: Partial<NegotiationDetail> = {}): NegotiationDetail => ({
  id: 3,
  clientId: 'c1',
  vendedorId: 2,
  status: 'ABERTA',
  totalValue: 1000,
  notes: null,
  closedAt: null,
  createdAt: '2026-09-20T12:00:00Z',
  updatedAt: '2026-09-20T12:00:00Z',
  client: { id: 'c1', name: 'Fulana da Silva', status: 'LEAD' },
  vendedor: { id: 2, name: 'Vendedora' },
  order: null,
  items: [
    item({ quantity: 2, unitPrice: 500, discountType: 'VALOR', discountValue: 0, discountAmount: 0, subtotal: 1000 }),
  ],
  informedValue: null,
  ...overrides,
})

const rates = (overrides: Record<number, number> = {}): InstallmentRate[] =>
  Array.from({ length: 12 }, (_, index) => ({
    installments: index + 1,
    ratePercent: overrides[index + 1] ?? 0,
  }))

const renderModal = ({
  negotiation = negotiationDetail(),
  installmentRates = rates({ 10: 5, 12: 10 }),
  installmentRatesError = null,
}: {
  negotiation?: NegotiationDetail
  installmentRates?: InstallmentRate[] | null
  installmentRatesError?: string | null
} = {}) =>
  render(
    <NegotiationFormModal
      isAdmin={false}
      negotiation={negotiation}
      clients={[]}
      products={[]}
      installmentRates={installmentRates}
      installmentRatesError={installmentRatesError}
      onClose={vi.fn()}
      onCreate={vi.fn()}
      onUpdate={vi.fn()}
    />,
  )

const openQuotations = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('tab', { name: 'Orçamentos' }))
}

const row = (installments: number) =>
  within(screen.getAllByRole('rowgroup')[1]).getAllByRole('row')[installments - 1]

describe('NegotiationFormModal — aba Orçamentos (spec 011, ticket 02)', () => {
  it('abre na aba Itens, com a tela de hoje', () => {
    renderModal()

    expect(screen.getByRole('tab', { name: 'Itens' })).toHaveAttribute('aria-selected', 'true')
    expect(screen.getByText('Itens da negociação')).toBeInTheDocument()
  })

  it('parte do total à vista dos itens salvos, já com os descontos', async () => {
    const user = userEvent.setup()
    renderModal({
      negotiation: negotiationDetail({
        items: [
          item(),
          item({
            id: 11,
            product: { id: 'p2', name: 'Capa', sku: 'CAP-1', status: 'ATIVO', deleted: false },
            quantity: 1,
            unitPrice: 30,
            discountType: 'VALOR',
            discountValue: 10,
            discountAmount: 10,
            subtotal: 20,
          }),
        ],
      }),
    })

    await openQuotations(user)

    expect(screen.getByText(/Total à vista/)).toHaveTextContent(/R\$\s1\.100,00/)
    expect(within(row(10)).getByText(/10x de R\$\s115,50/)).toBeInTheDocument()
  })

  it('mostra de 1x a 12x com taxa, parcela, total e acréscimo', async () => {
    const user = userEvent.setup()
    renderModal()

    await openQuotations(user)

    expect(screen.getByText(/Total à vista/)).toHaveTextContent(/R\$\s1\.000,00/)
    const body = screen.getAllByRole('rowgroup')[1]
    expect(within(body).getAllByRole('row')).toHaveLength(12)

    expect(within(row(1)).getByLabelText('Taxa 1x')).toHaveValue(0)
    expect(within(row(1)).getByText(/1x de R\$\s1\.000,00/)).toBeInTheDocument()

    expect(within(row(10)).getByLabelText('Taxa 10x')).toHaveValue(5)
    expect(within(row(10)).getByText(/10x de R\$\s105,00/)).toBeInTheDocument()
    expect(within(row(10)).getByText(/^R\$\s1\.050,00$/)).toBeInTheDocument()
    expect(within(row(10)).getByText(/\+R\$\s50,00/)).toBeInTheDocument()
  })

  it('valor que não divide mostra o resíduo na primeira parcela', async () => {
    const user = userEvent.setup()
    renderModal({ installmentRates: rates() })

    await openQuotations(user)

    expect(within(row(3)).getByText(/1ª de R\$\s333,34 \+ 2x de R\$\s333,33/)).toBeInTheDocument()
  })

  it('editar a taxa recalcula a linha na hora, sem gravar nada', async () => {
    const user = userEvent.setup()
    const onUpdate = vi.fn()
    render(
      <NegotiationFormModal
        isAdmin={false}
        negotiation={negotiationDetail()}
        clients={[]}
        products={[]}
        installmentRates={rates({ 10: 5 })}
        installmentRatesError={null}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        onUpdate={onUpdate}
      />,
    )
    await openQuotations(user)

    const rate = within(row(10)).getByLabelText('Taxa 10x')
    await user.tripleClick(rate)
    await user.keyboard('8')

    expect(within(row(10)).getByText(/10x de R\$\s108,00/)).toBeInTheDocument()
    expect(within(row(10)).getByText(/^R\$\s1\.080,00$/)).toBeInTheDocument()
    expect(within(row(10)).getByText(/\+R\$\s80,00/)).toBeInTheDocument()
    expect(within(row(12)).getByLabelText('Taxa 12x')).toHaveValue(0)
    expect(onUpdate).not.toHaveBeenCalled()
  })

  it('a taxa editada sobrevive à troca de aba', async () => {
    const user = userEvent.setup()
    renderModal()
    await openQuotations(user)

    await user.tripleClick(within(row(10)).getByLabelText('Taxa 10x'))
    await user.keyboard('8')
    await user.click(screen.getByRole('tab', { name: 'Itens' }))
    await openQuotations(user)

    expect(within(row(10)).getByLabelText('Taxa 10x')).toHaveValue(8)
  })

  it('na aba Orçamentos não há botão de salvar: simular não grava nada (RQ1)', async () => {
    const user = userEvent.setup()
    renderModal()
    expect(screen.getByRole('button', { name: 'Salvar alterações' })).toBeInTheDocument()

    await openQuotations(user)

    expect(screen.queryByRole('button', { name: 'Salvar alterações' })).not.toBeInTheDocument()
  })

  it('taxa inválida aponta o erro e não mostra valor na linha', async () => {
    const user = userEvent.setup()
    renderModal()
    await openQuotations(user)

    const rate = within(row(2)).getByLabelText('Taxa 2x')
    await user.tripleClick(rate)
    await user.keyboard('101')

    expect(within(row(2)).getByText('De 0 a 100%.')).toBeInTheDocument()
    expect(within(row(2)).queryByText(/R\$/)).not.toBeInTheDocument()
  })

  it('enquanto as taxas carregam, avisa em vez de mostrar a tabela', async () => {
    const user = userEvent.setup()
    renderModal({ installmentRates: null })
    await openQuotations(user)

    expect(screen.getByText('Carregando taxas…')).toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
  })

  it('falha ao carregar as taxas vira mensagem', async () => {
    const user = userEvent.setup()
    renderModal({ installmentRates: null, installmentRatesError: 'Falha ao carregar as taxas.' })
    await openQuotations(user)

    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao carregar as taxas.')
  })

  it('Negociação fora de Aberta: aba desabilitada, com o motivo visível (RQ2)', () => {
    renderModal({ negotiation: negotiationDetail({ status: 'GANHA' }) })

    expect(screen.getByRole('tab', { name: 'Orçamentos' })).toBeDisabled()
    expect(screen.getByText('Orçamentos só para negociação em aberto.')).toBeInTheDocument()
  })

  it('Negociação sem itens: aba desabilitada, com o motivo visível (RQ2)', () => {
    renderModal({ negotiation: negotiationDetail({ items: [], totalValue: 0 }) })

    expect(screen.getByRole('tab', { name: 'Orçamentos' })).toBeDisabled()
    expect(
      screen.getByText('Salve ao menos um item na negociação para simular o parcelamento.'),
    ).toBeInTheDocument()
  })

  it('Negociação Aberta com itens não mostra motivo de bloqueio', () => {
    renderModal()

    expect(screen.getByRole('tab', { name: 'Orçamentos' })).toBeEnabled()
    expect(screen.queryByText(/para simular o parcelamento/)).not.toBeInTheDocument()
    expect(screen.queryByText(/só para negociação em aberto/)).not.toBeInTheDocument()
  })

  it('nova negociação não tem abas', () => {
    render(
      <NegotiationFormModal
        isAdmin={false}
        negotiation={null}
        clients={[]}
        products={[]}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />,
    )

    expect(screen.queryByRole('tab')).not.toBeInTheDocument()
  })
})
