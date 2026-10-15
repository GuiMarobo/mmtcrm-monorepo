import { describe, expect, it, vi } from 'vitest'
import { render, screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { UsedDeviceEvaluationDialog } from './UsedDeviceEvaluationDialog'
import type { QueueUsedDevice, UsedDeviceDetail } from '../../types'

const device = (overrides: Partial<QueueUsedDevice> = {}): QueueUsedDevice => ({
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
  negotiation: {
    id: 3,
    status: 'ABERTA',
    client: { id: 'c1', name: 'Ana Cliente' },
    vendedor: { id: 2, name: 'Vendedora' },
  },
  ...overrides,
})

const detail = (overrides: Partial<UsedDeviceDetail> = {}): UsedDeviceDetail => ({
  ...device(),
  serialHistory: [],
  ...overrides,
})

const noop = () => Promise.resolve()

const renderDialog = (
  props: Partial<Parameters<typeof UsedDeviceEvaluationDialog>[0]> = {},
) =>
  render(
    <UsedDeviceEvaluationDialog
      device={device()}
      detail={detail()}
      onEvaluate={noop}
      onRefuse={noop}
      onClose={() => undefined}
      {...props}
    />,
  )

describe('UsedDeviceEvaluationDialog', () => {
  it('"Avaliar" fica desabilitado até confirmar o iCloud liberado (RD6)', async () => {
    renderDialog()

    const evaluate = screen.getByRole('button', { name: 'Avaliar' })
    expect(evaluate).toBeDisabled()

    await userEvent.click(screen.getByRole('checkbox', { name: /iCloud liberado/ }))

    expect(evaluate).toBeEnabled()
  })

  it('avalia com condição, valor, laudo e iCloud', async () => {
    const onEvaluate = vi.fn(noop)
    renderDialog({ onEvaluate })

    await userEvent.click(screen.getByRole('combobox', { name: /Condição/ }))
    await userEvent.click(screen.getByRole('option', { name: 'Bom' }))
    await userEvent.type(screen.getByLabelText(/Valor estimado/), '2000')
    await userEvent.type(screen.getByLabelText(/Laudo/), '  Bateria 87%  ')
    await userEvent.click(screen.getByRole('checkbox', { name: /iCloud liberado/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Avaliar' }))

    expect(onEvaluate).toHaveBeenCalledWith({
      condition: 'BOM',
      estimatedValue: 2000,
      report: 'Bateria 87%',
      icloudUnlocked: true,
    })
  })

  it('não avalia sem condição ou com valor zero', async () => {
    const onEvaluate = vi.fn(noop)
    renderDialog({ onEvaluate })

    await userEvent.type(screen.getByLabelText(/Valor estimado/), '0')
    await userEvent.click(screen.getByRole('checkbox', { name: /iCloud liberado/ }))
    await userEvent.click(screen.getByRole('button', { name: 'Avaliar' }))

    expect(onEvaluate).not.toHaveBeenCalled()
    expect(screen.getByText('Informe a condição.')).toBeInTheDocument()
    expect(screen.getByText('O valor deve ser maior que zero.')).toBeInTheDocument()
  })

  it('"Recusar" exige o laudo (RD7)', async () => {
    const onRefuse = vi.fn(noop)
    renderDialog({ onRefuse })

    const refuse = screen.getByRole('button', { name: 'Recusar' })
    expect(refuse).toBeDisabled()

    await userEvent.type(screen.getByLabelText(/Laudo/), '   ')
    expect(refuse).toBeDisabled()

    await userEvent.type(screen.getByLabelText(/Laudo/), 'iCloud bloqueado')
    await userEvent.click(refuse)

    expect(onRefuse).toHaveBeenCalledWith({ report: 'iCloud bloqueado' })
  })

  it('mostra o histórico da série: data, resultado, condição e valor', () => {
    renderDialog({
      detail: detail({
        serialHistory: [
          {
            id: 4,
            createdAt: '2025-03-01T12:00:00Z',
            evaluatedAt: '2025-03-02T12:00:00Z',
            evaluationStatus: 'AVALIADO',
            condition: 'REGULAR',
            estimatedValue: 1500,
          },
          {
            id: 6,
            createdAt: '2025-08-01T12:00:00Z',
            evaluatedAt: '2025-08-01T15:00:00Z',
            evaluationStatus: 'RECUSADO',
            condition: null,
            estimatedValue: null,
          },
        ],
      }),
    })

    const history = screen.getByRole('table', { name: 'Histórico da série' })
    const rows = within(history).getAllByRole('row').slice(1)
    expect(rows).toHaveLength(2)
    expect(within(rows[0]).getByText('02/03/2025')).toBeInTheDocument()
    expect(within(rows[0]).getByText('Avaliado')).toBeInTheDocument()
    expect(within(rows[0]).getByText('Regular')).toBeInTheDocument()
    expect(within(rows[0]).getByText(/1\.500,00/)).toBeInTheDocument()
    expect(within(rows[1]).getByText('Recusado')).toBeInTheDocument()
  })

  it('série sem histórico avisa que é a primeira vez', () => {
    renderDialog()

    expect(screen.getByText(/primeira vez que esta série aparece/i)).toBeInTheDocument()
  })

  it('falha ao carregar o histórico mostra o erro, sem afirmar que a série é inédita', () => {
    renderDialog({ detail: null, historyError: 'Falha ao carregar o histórico da série.' })

    expect(screen.getByText('Falha ao carregar o histórico da série.')).toBeInTheDocument()
    expect(screen.queryByText(/primeira vez/i)).not.toBeInTheDocument()
  })

  it('reavaliação parte da avaliação atual', () => {
    renderDialog({
      device: device({
        evaluationStatus: 'AVALIADO',
        condition: 'BOM',
        estimatedValue: 2000,
        report: 'Bateria 87%',
        icloudUnlocked: true,
        evaluatedAt: '2026-10-05T13:00:00Z',
        evaluator: { id: 5, name: 'Técnico A' },
      }),
    })

    expect(screen.getByLabelText(/Valor estimado/)).toHaveValue(2000)
    expect(screen.getByLabelText(/Laudo/)).toHaveValue('Bateria 87%')
    expect(screen.getByRole('button', { name: 'Avaliar' })).toBeEnabled()
    expect(screen.getByText(/Técnico A/)).toBeInTheDocument()
  })

  it.each(['GANHA', 'PERDIDA'] as const)(
    'Negociação %s: só consulta, sem avaliar nem recusar (RD9)',
    (status) => {
      renderDialog({
        device: device({ negotiation: { ...device().negotiation, status } }),
      })

      expect(screen.queryByRole('button', { name: 'Avaliar' })).not.toBeInTheDocument()
      expect(screen.queryByRole('button', { name: 'Recusar' })).not.toBeInTheDocument()
      expect(screen.getByText(/negociação fechada/i)).toBeInTheDocument()
    },
  )
})
