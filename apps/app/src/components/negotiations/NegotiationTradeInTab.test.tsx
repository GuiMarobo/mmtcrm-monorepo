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
  error = null,
  readOnly = false,
  onCreate = vi.fn().mockResolvedValue(created()),
  onUpdate = vi.fn().mockResolvedValue(device()),
  onRemove = vi.fn().mockResolvedValue(device()),
}: {
  devices?: UsedDevice[] | null
  error?: string | null
  readOnly?: boolean
  onCreate?: ReturnType<typeof vi.fn>
  onUpdate?: ReturnType<typeof vi.fn>
  onRemove?: ReturnType<typeof vi.fn>
} = {}) => {
  render(
    <NegotiationTradeInTab
      devices={devices}
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
})
