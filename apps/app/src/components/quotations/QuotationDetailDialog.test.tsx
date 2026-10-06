import { afterEach, describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { QuotationDetailDialog } from './QuotationDetailDialog'
import type { CompanySettings, QuotationDetail, QuotationItem } from '../../types'

const item = (overrides: Partial<QuotationItem> = {}): QuotationItem => ({
  id: 100,
  product: { id: 'p1', name: 'iPhone 15 Pro', sku: 'IP15P-256', status: 'ATIVO', deleted: false },
  quantity: 2,
  unitPrice: 6000,
  discountType: 'PERCENTUAL',
  discountValue: 10,
  discountAmount: 1200,
  subtotal: 10800,
  ...overrides,
})

const quotation = (overrides: Partial<QuotationDetail> = {}): QuotationDetail => ({
  id: 7,
  negotiationId: 3,
  code: 'ORC-7',
  totalValue: 11350,
  installments: 12,
  ratePercent: 0,
  totalWithInterest: 11349.96,
  installmentValue: 945.83,
  firstInstallmentValue: 945.83,
  validUntil: '2026-10-02',
  expired: false,
  createdAt: '2026-09-22T15:00:00Z',
  author: { id: 5, name: 'Outra Vendedora' },
  items: [
    item(),
    item({
      id: 101,
      product: { id: 'p2', name: 'AirPods Pro', sku: 'APP-2', status: 'INATIVO', deleted: false },
      quantity: 1,
      unitPrice: 600,
      discountType: 'VALOR',
      discountValue: 50,
      discountAmount: 50,
      subtotal: 550,
    }),
  ],
  client: { id: 'c1', name: 'Fulana de Tal', anonymized: false },
  seller: { id: 2, name: 'Vendedora Responsável' },
  ...overrides,
})

const company = (overrides: Partial<CompanySettings> = {}): CompanySettings => ({
  name: 'MMT Urbana',
  cnpj: '12.345.678/0001-90',
  address: 'Rua das Flores, 100 — Curitiba/PR',
  phone: '(41) 99999-0000',
  defaultValidityDays: 7,
  ...overrides,
})

const renderDetail = ({
  detail = quotation() as QuotationDetail | null,
  settings = company() as CompanySettings | null,
  error = null as string | null,
  onClose = vi.fn(),
} = {}) => {
  render(
    <QuotationDetailDialog quotation={detail} company={settings} error={error} onClose={onClose} />,
  )
  return { onClose }
}

const itemRows = () =>
  within(
    within(screen.getByRole('table', { name: 'Itens do orçamento' })).getAllByRole('rowgroup')[1],
  ).getAllByRole('row')

describe('QuotationDetailDialog', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('cabeçalho com nome, CNPJ, endereço e telefone da loja, código e data de emissão', () => {
    renderDetail()

    expect(screen.getByText('MMT Urbana')).toBeInTheDocument()
    expect(screen.getByText(/12\.345\.678\/0001-90/)).toBeInTheDocument()
    expect(screen.getByText('Rua das Flores, 100 — Curitiba/PR')).toBeInTheDocument()
    expect(screen.getByText(/\(41\) 99999-0000/)).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Orçamento ORC-7' })).toBeInTheDocument()
    expect(screen.getByText('Emitido em 22/09/2026')).toBeInTheDocument()
  })

  it('Cliente e vendedor responsável lidos pela Negociação', () => {
    renderDetail()

    expect(screen.getByText('Fulana de Tal')).toBeInTheDocument()
    expect(screen.getByText('Vendedora Responsável')).toBeInTheDocument()
    expect(screen.queryByText('Outra Vendedora')).not.toBeInTheDocument()
  })

  it('mostra os itens congelados linha a linha, com quantidade, preço praticado e desconto', () => {
    renderDetail()

    const [first, second] = itemRows()
    expect(first).toHaveTextContent('iPhone 15 Pro')
    expect(first).toHaveTextContent('IP15P-256')
    expect(within(first).getByText('2')).toBeInTheDocument()
    expect(first).toHaveTextContent('R$ 6.000,00')
    expect(first).toHaveTextContent('10%')
    expect(first).toHaveTextContent('R$ 10.800,00')
    expect(second).toHaveTextContent('AirPods Pro')
    expect(second).toHaveTextContent('R$ 50,00')
    expect(second).toHaveTextContent('R$ 550,00')
  })

  it('mostra o total à vista, a validade e a condição sem resíduo', () => {
    renderDetail()

    expect(screen.getByText('R$ 11.350,00')).toBeInTheDocument()
    expect(screen.getByText('12x de R$ 945,83')).toBeInTheDocument()
    expect(screen.getByText('Válido até 02/10/2026')).toBeInTheDocument()
  })

  it('condição com resíduo sai como "1ª de … + 11x de …"', () => {
    renderDetail({
      detail: quotation({
        firstInstallmentValue: 945.9,
        installmentValue: 945.83,
        totalWithInterest: 11350.03,
      }),
    })

    expect(screen.getByText('1ª de R$ 945,90 + 11x de R$ 945,83')).toBeInTheDocument()
    expect(screen.getByText('R$ 11.350,03')).toBeInTheDocument()
  })

  it('o total parcelado impresso é sempre a soma exata das parcelas', () => {
    renderDetail({
      detail: quotation({
        firstInstallmentValue: 945.9,
        installmentValue: 945.83,
        totalWithInterest: 11350,
      }),
    })

    expect(screen.getByText('R$ 11.350,03')).toBeInTheDocument()
  })

  it('taxa aplicada aparece junto da condição', () => {
    renderDetail({ detail: quotation({ ratePercent: 3.5 }) })

    expect(screen.getByText(/3,5%/)).toBeInTheDocument()
  })

  it('Orçamento vencido abre normalmente, com o rótulo Vencido e o botão Imprimir', () => {
    renderDetail({ detail: quotation({ expired: true, validUntil: '2026-09-01' }) })

    expect(screen.getByText('Vencido')).toBeInTheDocument()
    expect(screen.getByText('Válido até 01/09/2026')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Imprimir' })).toBeEnabled()
  })

  it('no prazo, sem rótulo Vencido', () => {
    renderDetail()

    expect(screen.queryByText('Vencido')).not.toBeInTheDocument()
  })

  it('Cliente anonimizado pela LGPD aparece anonimizado', () => {
    renderDetail({
      detail: quotation({ client: { id: 'c1', name: 'Titular removido', anonymized: true } }),
    })

    expect(screen.getByText('Titular removido')).toBeInTheDocument()
    expect(screen.queryByText('Fulana de Tal')).not.toBeInTheDocument()
  })

  it('Imprimir chama a impressão do navegador', async () => {
    const user = userEvent.setup()
    const print = vi.spyOn(window, 'print').mockImplementation(() => undefined)
    renderDetail()

    await user.click(screen.getByRole('button', { name: 'Imprimir' }))

    expect(print).toHaveBeenCalledTimes(1)
  })

  it('Fechar devolve para a Negociação', async () => {
    const user = userEvent.setup()
    const { onClose } = renderDetail()

    await user.click(screen.getByRole('button', { name: 'Fechar' }))

    expect(onClose).toHaveBeenCalledTimes(1)
  })

  it('enquanto carrega, avisa e não oferece Imprimir', () => {
    renderDetail({ detail: null })

    expect(screen.getByText('Carregando orçamento…')).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Imprimir' })).toBeDisabled()
  })

  it('falha ao carregar vira mensagem', () => {
    renderDetail({ detail: null, error: 'Orçamento não encontrado' })

    expect(screen.getByRole('alert')).toHaveTextContent('Orçamento não encontrado')
    expect(screen.getByRole('button', { name: 'Imprimir' })).toBeDisabled()
  })

  it('sem os dados da loja, avisa antes de imprimir', () => {
    renderDetail({ settings: null })

    expect(screen.getByText(/Dados da loja indisponíveis/)).toBeInTheDocument()
  })

  it('com os dados da loja, não avisa nada', () => {
    renderDetail()

    expect(screen.queryByText(/Dados da loja indisponíveis/)).not.toBeInTheDocument()
  })
})
