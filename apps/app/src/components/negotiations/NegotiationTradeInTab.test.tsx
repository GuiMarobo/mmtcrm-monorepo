import { describe, expect, it, vi } from 'vitest'
import { render, screen, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { NegotiationTradeInTab } from './NegotiationTradeInTab'
import { ApiError } from '../../api'
import type { CreatedUsedDevice, UsedDevice } from '../../types'

const device = (overrides: Partial<UsedDevice> = {}): UsedDevice => ({
  id: 9,
  negotiationId: 3,
  model: 'iPhone 12 128 GB',
  serialNumber: 'F2LXK0ABCD',
  imei: '356789012345678',
  evaluationStatus: 'AGUARDANDO',
  condition: null,
  estimatedValue: null,
  report: null,
  icloudUnlocked: null,
  evaluatedAt: null,
  evaluator: null,
  createdAt: '2026-10-05T12:00:00Z',
  createdBy: { id: 2, name: 'Vendedora' },
  ...overrides,
})

const created = (overrides: Partial<CreatedUsedDevice> = {}): CreatedUsedDevice => ({
  ...device(),
  serialSeenBefore: 0,
  ...overrides,
})

const renderTab = ({
  devices = [device()],
  totalValue = 3000,
  error = null,
  readOnly = false,
  onCreate = vi.fn().mockResolvedValue(created()),
  onUpdate = vi.fn().mockResolvedValue(device()),
  onRemove = vi.fn().mockResolvedValue(device()),
}: {
  devices?: UsedDevice[] | null
  totalValue?: number
  error?: string | null
  readOnly?: boolean
  onCreate?: ReturnType<typeof vi.fn>
  onUpdate?: ReturnType<typeof vi.fn>
  onRemove?: ReturnType<typeof vi.fn>
} = {}) => {
  render(
    <NegotiationTradeInTab
      devices={devices}
      totalValue={totalValue}
      error={error}
      readOnly={readOnly}
      onCreate={onCreate}
      onUpdate={onUpdate}
      onRemove={onRemove}
    />,
  )
  return { onCreate, onUpdate, onRemove }
}

const threeDevices = () => [
  device({ id: 1, model: 'iPhone 11', evaluationStatus: 'AGUARDANDO' }),
  device({ id: 2, model: 'iPhone 12', evaluationStatus: 'AVALIADO' }),
  device({ id: 3, model: 'Apple Watch S6', imei: null, evaluationStatus: 'RECUSADO' }),
]

describe('NegotiationTradeInTab', () => {
  it('lista modelo, série, IMEI e o chip de situação de cada aparelho', () => {
    renderTab({ devices: threeDevices() })

    const rows = screen.getAllByRole('row').slice(1)
    expect(within(rows[0]).getByText('iPhone 11')).toBeInTheDocument()
    expect(within(rows[0]).getByText('F2LXK0ABCD')).toBeInTheDocument()
    expect(within(rows[0]).getByText('356789012345678')).toBeInTheDocument()
    expect(within(rows[0]).getByText('Aguardando avaliação')).toBeInTheDocument()
    expect(within(rows[1]).getByText('Avaliado')).toBeInTheDocument()
    expect(within(rows[2]).getByText('Recusado')).toBeInTheDocument()
    expect(within(rows[2]).getByText('—')).toBeInTheDocument()
  })

  it('mostra condição, valor de troca, laudo, avaliador e data dos avaliados', () => {
    renderTab({
      devices: [
        device({
          evaluationStatus: 'AVALIADO',
          condition: 'BOM',
          estimatedValue: 2000,
          report: 'Bateria 87%',
          icloudUnlocked: true,
          evaluatedAt: '2026-10-05T15:00:00Z',
          evaluator: { id: 5, name: 'Técnico A' },
        }),
      ],
    })

    const row = screen.getAllByRole('row')[1]
    expect(within(row).getByText(/Bom/)).toBeInTheDocument()
    expect(within(row).getByText(/R\$\s?2\.000,00/)).toBeInTheDocument()
    expect(within(row).getByText('Bateria 87%')).toBeInTheDocument()
    expect(within(row).getByText(/Técnico A em 05\/10\/2026/)).toBeInTheDocument()
  })

  it('mostra o motivo dos recusados, sem valor', () => {
    renderTab({
      devices: [
        device({
          evaluationStatus: 'RECUSADO',
          report: 'iCloud bloqueado',
          evaluatedAt: '2026-10-05T15:00:00Z',
          evaluator: { id: 5, name: 'Técnico A' },
        }),
      ],
    })

    const row = screen.getAllByRole('row')[1]
    expect(within(row).getByText(/Motivo: iCloud bloqueado/)).toBeInTheDocument()
    expect(within(row).queryByText(/R\$/)).not.toBeInTheDocument()
  })

  it('edita só o aparelho aguardando avaliação, e remove qualquer um', () => {
    renderTab({ devices: threeDevices() })

    expect(screen.getByRole('button', { name: 'Editar iPhone 11' })).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Editar iPhone 12' })).not.toBeInTheDocument()
    expect(
      screen.queryByRole('button', { name: 'Editar Apple Watch S6' }),
    ).not.toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remover iPhone 11' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remover iPhone 12' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Remover Apple Watch S6' })).toBeInTheDocument()
  })

  it('fora de Aberta é só consulta: sem cadastrar, editar nem remover', () => {
    renderTab({ devices: threeDevices(), readOnly: true })

    expect(screen.getByText('iPhone 11')).toBeInTheDocument()
    expect(screen.queryByRole('button', { name: 'Cadastrar aparelho' })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Editar/ })).not.toBeInTheDocument()
    expect(screen.queryByRole('button', { name: /^Remover/ })).not.toBeInTheDocument()
    expect(screen.getByText(/somente consulta/i)).toBeInTheDocument()
  })

  it('cadastra com modelo, série e IMEI em branco como nulo, e fecha sem série repetida', async () => {
    const user = userEvent.setup()
    const { onCreate } = renderTab({ devices: [] })

    await user.click(screen.getByRole('button', { name: 'Cadastrar aparelho' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText(/Modelo/), 'iPhone 8 64 GB')
    await user.type(within(dialog).getByLabelText(/Número de série/), 'c39abc')
    await user.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))

    expect(onCreate).toHaveBeenCalledWith({
      model: 'iPhone 8 64 GB',
      serialNumber: 'c39abc',
      imei: null,
    })
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
  })

  it('avisa, sem impedir, quando a série já apareceu antes na loja', async () => {
    const user = userEvent.setup()
    renderTab({
      devices: [],
      onCreate: vi.fn().mockResolvedValue(created({ serialSeenBefore: 2 })),
    })

    await user.click(screen.getByRole('button', { name: 'Cadastrar aparelho' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText(/Modelo/), 'iPhone 12')
    await user.type(within(dialog).getByLabelText(/Número de série/), 'F2LXK0ABCD')
    await user.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))

    const warning = await within(screen.getByRole('dialog')).findByText(
      /já apareceu 2 vezes na loja/,
    )
    expect(warning).toBeInTheDocument()
    expect(screen.getByText(/aparelho foi cadastrado/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: 'Concluir' }))
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument()
  })

  it('não envia com IMEI que não tenha 15 dígitos', async () => {
    const user = userEvent.setup()
    const { onCreate } = renderTab({ devices: [] })

    await user.click(screen.getByRole('button', { name: 'Cadastrar aparelho' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText(/Modelo/), 'iPhone 12')
    await user.type(within(dialog).getByLabelText(/Número de série/), 'F2LX')
    await user.type(within(dialog).getByLabelText(/IMEI/), '1234')
    await user.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))

    expect(within(dialog).getByText('O IMEI tem 15 dígitos.')).toBeInTheDocument()
    expect(onCreate).not.toHaveBeenCalled()
  })

  it('mostra a recusa do backend dentro do diálogo', async () => {
    const user = userEvent.setup()
    renderTab({
      devices: [],
      onCreate: vi
        .fn()
        .mockRejectedValue(
          new ApiError(409, 'Só é possível cadastrar aparelho na troca de uma negociação em aberto'),
        ),
    })

    await user.click(screen.getByRole('button', { name: 'Cadastrar aparelho' }))
    const dialog = screen.getByRole('dialog')
    await user.type(within(dialog).getByLabelText(/Modelo/), 'iPhone 12')
    await user.type(within(dialog).getByLabelText(/Número de série/), 'F2LX')
    await user.click(within(dialog).getByRole('button', { name: 'Cadastrar' }))

    expect(
      await within(dialog).findByText(/negociação em aberto/),
    ).toBeInTheDocument()
  })

  it('corrige o aparelho aguardando com os dados já preenchidos', async () => {
    const user = userEvent.setup()
    const { onUpdate } = renderTab()

    await user.click(screen.getByRole('button', { name: 'Editar iPhone 12 128 GB' }))
    const dialog = screen.getByRole('dialog')
    const model = within(dialog).getByLabelText(/Modelo/)
    expect(model).toHaveValue('iPhone 12 128 GB')
    await user.clear(model)
    await user.type(model, 'iPhone 13 128 GB')
    await user.clear(within(dialog).getByLabelText(/IMEI/))
    await user.click(within(dialog).getByRole('button', { name: 'Salvar' }))

    expect(onUpdate).toHaveBeenCalledWith(9, {
      model: 'iPhone 13 128 GB',
      serialNumber: 'F2LXK0ABCD',
      imei: null,
    })
  })

  it('remove depois de confirmar', async () => {
    const user = userEvent.setup()
    const { onRemove } = renderTab()

    await user.click(screen.getByRole('button', { name: 'Remover iPhone 12 128 GB' }))
    await user.click(screen.getByRole('button', { name: 'Remover' }))

    expect(onRemove).toHaveBeenCalledWith(9)
  })

  it('trata carregando, vazio e erro', () => {
    const { unmount } = render(
      <NegotiationTradeInTab
        devices={null}
        totalValue={3000}
        error={null}
        readOnly={false}
        onCreate={vi.fn()}
        onUpdate={vi.fn()}
        onRemove={vi.fn()}
      />,
    )
    expect(screen.getByText(/Carregando aparelhos/)).toBeInTheDocument()
    unmount()

    renderTab({ devices: [] })
    expect(screen.getByText(/Nenhum aparelho na troca/)).toBeInTheDocument()
  })

  it('mostra o erro de carregamento', () => {
    renderTab({ devices: null, error: 'Falha ao carregar os aparelhos.' })

    expect(screen.getByText('Falha ao carregar os aparelhos.')).toBeInTheDocument()
  })

  describe('rodapé do Saldo a pagar', () => {
    const footer = () => within(screen.getByRole('region', { name: 'Saldo a pagar' }))

    it('mostra o total, o total das trocas só dos avaliados e o saldo', () => {
      renderTab({
        totalValue: 3000,
        devices: [
          device({ id: 1, evaluationStatus: 'AVALIADO', condition: 'BOM', estimatedValue: 1200 }),
          device({ id: 2 }),
          device({ id: 3, evaluationStatus: 'RECUSADO', report: 'Tela' }),
        ],
      })

      expect(footer().getByText('Total da negociação').nextSibling).toHaveTextContent('3.000,00')
      expect(footer().getByText('Total das trocas').nextSibling).toHaveTextContent('1.200,00')
      expect(footer().getByText('Saldo a pagar').nextSibling).toHaveTextContent('1.800,00')
      expect(screen.queryByText(/troca vale mais que a compra/)).not.toBeInTheDocument()
    })

    it('alerta, sem bloquear, quando a troca passa do total', () => {
      renderTab({
        totalValue: 1500,
        devices: [device({ evaluationStatus: 'AVALIADO', condition: 'BOM', estimatedValue: 1600 })],
      })

      expect(footer().getByText('Saldo a pagar').nextSibling).toHaveTextContent('-R$')
      expect(screen.getByText(/troca vale mais que a compra/)).toBeInTheDocument()
      expect(screen.getByRole('button', { name: 'Cadastrar aparelho' })).toBeEnabled()
    })

    it('sem aparelhos, o saldo é o total', () => {
      renderTab({ totalValue: 1500, devices: [] })

      expect(footer().getByText('Saldo a pagar').nextSibling).toHaveTextContent('1.500,00')
    })

    it('some enquanto a lista carrega ou falha', () => {
      renderTab({ devices: null })
      expect(screen.queryByRole('region', { name: 'Saldo a pagar' })).not.toBeInTheDocument()
    })
  })
})
