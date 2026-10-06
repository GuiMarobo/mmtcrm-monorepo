import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NegotiationFormModal } from './NegotiationFormModal'
import { ApiError } from '../../api'
import type {
  InstallmentRate,
  NegotiationDetail,
  NegotiationItem,
  Quotation,
} from '../../types'

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
  quotations = [],
  onOpenQuotation = vi.fn(),
}: {
  negotiation?: NegotiationDetail
  installmentRates?: InstallmentRate[] | null
  installmentRatesError?: string | null
  quotations?: Quotation[] | null
  onOpenQuotation?: (quotation: Quotation) => void
} = {}) =>
  render(
    <NegotiationFormModal
      isAdmin={false}
      negotiation={negotiation}
      clients={[]}
      products={[]}
      installmentRates={installmentRates}
      installmentRatesError={installmentRatesError}
      quotations={quotations}
      onOpenQuotation={onOpenQuotation}
      onClose={vi.fn()}
      onCreate={vi.fn()}
      onUpdate={vi.fn()}
    />,
  )

const openQuotations = async (user: ReturnType<typeof userEvent.setup>) => {
  await user.click(screen.getByRole('tab', { name: 'Orçamentos' }))
}

const simulationBody = () =>
  within(screen.getByRole('table', { name: 'Simulação de parcelamento' })).getAllByRole(
    'rowgroup',
  )[1]

const row = (installments: number) =>
  within(simulationBody()).getAllByRole('row')[installments - 1]

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
    expect(within(simulationBody()).getAllByRole('row')).toHaveLength(12)

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
    expect(
      screen.queryByRole('table', { name: 'Simulação de parcelamento' }),
    ).not.toBeInTheDocument()
  })

  it('falha ao carregar as taxas vira mensagem', async () => {
    const user = userEvent.setup()
    renderModal({ installmentRates: null, installmentRatesError: 'Falha ao carregar as taxas.' })
    await openQuotations(user)

    expect(screen.getByRole('alert')).toHaveTextContent('Falha ao carregar as taxas.')
  })

  it.each(['GANHA', 'PERDIDA'] as const)(
    'Negociação %s sem emitido: aba desabilitada, com o motivo visível (RQ2)',
    (status) => {
      renderModal({ negotiation: negotiationDetail({ status }) })

      expect(screen.getByRole('tab', { name: 'Orçamentos' })).toBeDisabled()
      expect(
        screen.getByText('Simular e emitir orçamento só para negociação em aberto.'),
      ).toBeInTheDocument()
    },
  )

  it('Negociação sem itens e sem emitido: aba desabilitada, com o motivo visível (RQ2)', () => {
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

const quotation = (overrides: Partial<Quotation> = {}): Quotation => ({
  id: 7,
  negotiationId: 3,
  code: 'ORC-7',
  totalValue: 1000,
  installments: 10,
  ratePercent: 5,
  totalWithInterest: 1050,
  installmentValue: 105,
  firstInstallmentValue: 105,
  validUntil: '2026-10-02',
  expired: false,
  createdAt: '2026-09-22T15:00:00Z',
  author: { id: 2, name: 'Vendedora' },
  ...overrides,
})

describe('NegotiationFormModal — emitir Orçamento (spec 011, ticket 03)', () => {
  beforeEach(() => {
    vi.useFakeTimers({ toFake: ['Date'] })
    vi.setSystemTime(new Date(2026, 8, 22, 12))
  })

  afterEach(() => {
    vi.useRealTimers()
  })

  const renderIssuing = ({
    quotations = [] as Quotation[] | null,
    quotationsError = null as string | null,
    onIssueQuotation = vi.fn().mockResolvedValue(quotation()),
  } = {}) => {
    render(
      <NegotiationFormModal
        isAdmin={false}
        negotiation={negotiationDetail()}
        clients={[]}
        products={[]}
        installmentRates={rates({ 10: 5 })}
        installmentRatesError={null}
        defaultValidityDays={10}
        quotations={quotations}
        quotationsError={quotationsError}
        onIssueQuotation={onIssueQuotation}
        onClose={vi.fn()}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />,
    )
    return { onIssueQuotation }
  }

  const issuedRows = () =>
    within(
      within(screen.getByRole('table', { name: 'Orçamentos emitidos' })).getAllByRole(
        'rowgroup',
      )[1],
    ).getAllByRole('row')

  it('lista os emitidos com código, data, condição, total e validade', async () => {
    const user = userEvent.setup()
    renderIssuing({
      quotations: [
        quotation({
          id: 8,
          code: 'ORC-8',
          installments: 3,
          ratePercent: 0,
          totalWithInterest: 1000,
          installmentValue: 333.33,
          firstInstallmentValue: 333.34,
        }),
        quotation(),
      ],
    })
    await openQuotations(user)

    const [newest, oldest] = issuedRows()
    expect(within(newest).getByText('ORC-8')).toBeInTheDocument()
    expect(
      within(newest).getByText(/1ª de R\$\s333,34 \+ 2x de R\$\s333,33/),
    ).toBeInTheDocument()
    expect(within(oldest).getByText('ORC-7')).toBeInTheDocument()
    expect(within(oldest).getByText('22/09/2026')).toBeInTheDocument()
    expect(within(oldest).getByText(/10x de R\$\s105,00 · 5%/)).toBeInTheDocument()
    expect(within(oldest).getByText(/^R\$\s1\.050,00$/)).toBeInTheDocument()
    expect(within(oldest).getByText('02/10/2026')).toBeInTheDocument()
  })

  it('rótulo Vencido só nos emitidos com validade passada (RQ10)', async () => {
    const user = userEvent.setup()
    renderIssuing({
      quotations: [
        quotation({ id: 8, code: 'ORC-8' }),
        quotation({ validUntil: '2026-09-20', expired: true }),
      ],
    })
    await openQuotations(user)

    const [valid, expired] = issuedRows()
    expect(within(valid).queryByText('Vencido')).not.toBeInTheDocument()
    expect(within(expired).getByText('Vencido')).toBeInTheDocument()
  })

  it('sem emitidos, avisa que nenhum orçamento foi emitido', async () => {
    const user = userEvent.setup()
    renderIssuing()
    await openQuotations(user)

    expect(screen.getByText('Nenhum orçamento emitido nesta negociação.')).toBeInTheDocument()
  })

  it('falha ao carregar os emitidos vira mensagem', async () => {
    const user = userEvent.setup()
    renderIssuing({ quotations: null, quotationsError: 'Falha ao carregar os orçamentos.' })
    await openQuotations(user)

    expect(screen.getByText('Falha ao carregar os orçamentos.')).toBeInTheDocument()
  })

  it('validade vem pré-preenchida com hoje + a validade padrão da loja', async () => {
    const user = userEvent.setup()
    renderIssuing()
    await openQuotations(user)

    expect(screen.getByLabelText('Validade')).toHaveValue('2026-10-02')
  })

  it('emitir exige escolher uma condição', async () => {
    const user = userEvent.setup()
    renderIssuing()
    await openQuotations(user)

    expect(screen.getByRole('button', { name: 'Emitir orçamento' })).toBeDisabled()
    await user.click(within(row(10)).getByLabelText('Escolher 10x'))
    expect(screen.getByRole('button', { name: 'Emitir orçamento' })).toBeEnabled()
  })

  it('emite a condição escolhida com a taxa da linha e a validade', async () => {
    const user = userEvent.setup()
    const { onIssueQuotation } = renderIssuing()
    await openQuotations(user)

    await user.click(within(row(10)).getByLabelText('Escolher 10x'))
    await user.click(screen.getByRole('button', { name: 'Emitir orçamento' }))

    expect(onIssueQuotation).toHaveBeenCalledWith({
      installments: 10,
      ratePercent: 5,
      validUntil: '2026-10-02',
    })
  })

  it('emite com a taxa editada e a validade esticada', async () => {
    const user = userEvent.setup()
    const { onIssueQuotation } = renderIssuing()
    await openQuotations(user)

    await user.tripleClick(within(row(10)).getByLabelText('Taxa 10x'))
    await user.keyboard('7.5')
    await user.click(within(row(10)).getByLabelText('Escolher 10x'))
    await user.clear(screen.getByLabelText('Validade'))
    await user.type(screen.getByLabelText('Validade'), '2026-11-30')
    await user.click(screen.getByRole('button', { name: 'Emitir orçamento' }))

    expect(onIssueQuotation).toHaveBeenCalledWith({
      installments: 10,
      ratePercent: 7.5,
      validUntil: '2026-11-30',
    })
  })

  it('validade fora de amanhã a hoje + 90 dias aponta o erro e não emite', async () => {
    const user = userEvent.setup()
    const { onIssueQuotation } = renderIssuing()
    await openQuotations(user)

    await user.click(within(row(10)).getByLabelText('Escolher 10x'))
    await user.clear(screen.getByLabelText('Validade'))
    await user.type(screen.getByLabelText('Validade'), '2026-09-22')

    expect(screen.getByText('De 23/09/2026 a 21/12/2026.')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Emitir orçamento' })).toBeDisabled()
    expect(onIssueQuotation).not.toHaveBeenCalled()
  })

  it('taxa inválida na linha escolhida não emite', async () => {
    const user = userEvent.setup()
    renderIssuing()
    await openQuotations(user)

    await user.click(within(row(10)).getByLabelText('Escolher 10x'))
    await user.tripleClick(within(row(10)).getByLabelText('Taxa 10x'))
    await user.keyboard('101')

    expect(screen.getByRole('button', { name: 'Emitir orçamento' })).toBeDisabled()
  })

  it('recusa do servidor aparece na aba', async () => {
    const user = userEvent.setup()
    renderIssuing({
      onIssueQuotation: vi
        .fn()
        .mockRejectedValue(
          new ApiError(409, 'Só é possível emitir orçamento de uma negociação em aberto'),
        ),
    })
    await openQuotations(user)

    await user.click(within(row(10)).getByLabelText('Escolher 10x'))
    await user.click(screen.getByRole('button', { name: 'Emitir orçamento' }))

    await waitFor(() =>
      expect(screen.getByRole('alert')).toHaveTextContent(
        'Só é possível emitir orçamento de uma negociação em aberto',
      ),
    )
  })
})

describe('NegotiationFormModal — emitidos depois que a Negociação fecha (spec 011, ticket 04)', () => {
  it.each(['GANHA', 'PERDIDA'] as const)(
    'Negociação %s com emitido: a aba abre, lista os emitidos e mostra o motivo, sem simular nem emitir',
    async (status) => {
      const user = userEvent.setup()
      renderModal({
        negotiation: negotiationDetail({ status }),
        quotations: [quotation()],
      })

      const tab = screen.getByRole('tab', { name: 'Orçamentos' })
      expect(tab).toBeEnabled()
      await user.click(tab)

      expect(screen.getByRole('table', { name: 'Orçamentos emitidos' })).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'ORC-7' })).toBeInTheDocument()
      expect(
        screen.getByText('Simular e emitir orçamento só para negociação em aberto.'),
      ).toBeVisible()
      expect(
        screen.queryByRole('table', { name: 'Simulação de parcelamento' }),
      ).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: /Emitir/ })).not.toBeInTheDocument()
    },
  )

  it('Negociação que perdeu os itens, com emitido: a aba abre com a lista e o motivo', async () => {
    const user = userEvent.setup()
    renderModal({
      negotiation: negotiationDetail({ items: [], totalValue: 0 }),
      quotations: [quotation()],
    })

    await user.click(screen.getByRole('tab', { name: 'Orçamentos' }))

    expect(screen.getByRole('button', { name: 'ORC-7' })).toBeInTheDocument()
    expect(
      screen.getByText('Salve ao menos um item na negociação para simular o parcelamento.'),
    ).toBeVisible()
    expect(
      screen.queryByRole('table', { name: 'Simulação de parcelamento' }),
    ).not.toBeInTheDocument()
  })

  it('abrir um emitido da lista leva ao detalhe', async () => {
    const user = userEvent.setup()
    const onOpenQuotation = vi.fn()
    const issued = quotation({ id: 9, code: 'ORC-9' })
    renderModal({
      negotiation: negotiationDetail({ status: 'GANHA' }),
      quotations: [issued],
      onOpenQuotation,
    })

    await user.click(screen.getByRole('tab', { name: 'Orçamentos' }))
    await user.click(screen.getByRole('button', { name: 'ORC-9' }))

    expect(onOpenQuotation).toHaveBeenCalledWith(issued)
  })

  it('Negociação Aberta com itens também abre o detalhe de um emitido', async () => {
    const user = userEvent.setup()
    const onOpenQuotation = vi.fn()
    renderModal({ quotations: [quotation()], onOpenQuotation })

    await user.click(screen.getByRole('tab', { name: 'Orçamentos' }))
    await user.click(screen.getByRole('button', { name: 'ORC-7' }))

    expect(onOpenQuotation).toHaveBeenCalledTimes(1)
  })

  it('Negociação fechada com a lista ainda carregando: a aba abre e avisa que carrega', async () => {
    const user = userEvent.setup()
    renderModal({ negotiation: negotiationDetail({ status: 'GANHA' }), quotations: null })

    await user.click(screen.getByRole('tab', { name: 'Orçamentos' }))

    expect(screen.getByText('Carregando orçamentos…')).toBeInTheDocument()
  })

  it('Negociação fechada com falha ao carregar os emitidos: a aba abre e mostra o erro', async () => {
    const user = userEvent.setup()
    render(
      <NegotiationFormModal
        isAdmin={false}
        negotiation={negotiationDetail({ status: 'PERDIDA' })}
        clients={[]}
        products={[]}
        quotations={null}
        quotationsError="Falha ao carregar os orçamentos."
        onClose={vi.fn()}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
      />,
    )

    await user.click(screen.getByRole('tab', { name: 'Orçamentos' }))

    expect(screen.getByText('Falha ao carregar os orçamentos.')).toBeInTheDocument()
  })
})
