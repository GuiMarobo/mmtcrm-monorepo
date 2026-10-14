import { describe, expect, it } from 'vitest'
import { conversionBlockedReason, summarizeAmountDue } from './amountDue'
import type { UsedDevice } from '../../types'

const device = (overrides: Partial<UsedDevice>): UsedDevice => ({
  id: 1,
  negotiationId: 3,
  model: 'iPhone 12 128 GB',
  serialNumber: 'F2LXK0ABCD',
  imei: null,
  evaluationStatus: 'AGUARDANDO',
  condition: null,
  estimatedValue: null,
  report: null,
  icloudUnlocked: null,
  evaluatedAt: null,
  evaluator: null,
  createdAt: '2026-10-05T12:00:00Z',
  createdBy: null,
  ...overrides,
})

describe('summarizeAmountDue', () => {
  it('soma só os avaliados: aguardando e recusado contam zero', () => {
    const result = summarizeAmountDue(3000, [
      device({ id: 1, evaluationStatus: 'AVALIADO', estimatedValue: 1200.1 }),
      device({ id: 2, evaluationStatus: 'AGUARDANDO' }),
      device({ id: 3, evaluationStatus: 'RECUSADO', report: 'Tela' }),
      device({ id: 4, evaluationStatus: 'AVALIADO', estimatedValue: 0.2 }),
    ])

    expect(result.totalValue).toBe(3000)
    expect(result.tradeInTotal).toBe(1200.3)
    expect(result.amountDue).toBe(1799.7)
    expect(result.negative).toBe(false)
  })

  it('o saldo pode ficar negativo', () => {
    const result = summarizeAmountDue(1500, [
      device({ evaluationStatus: 'AVALIADO', estimatedValue: 1600 }),
    ])

    expect(result.amountDue).toBe(-100)
    expect(result.negative).toBe(true)
  })

  it('saldo zerado não é negativo', () => {
    const result = summarizeAmountDue(1500, [
      device({ evaluationStatus: 'AVALIADO', estimatedValue: 1500 }),
    ])

    expect(result.amountDue).toBe(0)
    expect(result.negative).toBe(false)
  })

  it('Negociação sem aparelhos: o saldo é o total', () => {
    expect(summarizeAmountDue(1500, [])).toEqual({
      totalValue: 1500,
      tradeInTotal: 0,
      amountDue: 1500,
      negative: false,
    })
  })
})

describe('conversionBlockedReason', () => {
  it('aparelho aguardando bloqueia, nomeando modelo e série', () => {
    const reason = conversionBlockedReason(3000, [
      device({ id: 1, evaluationStatus: 'AVALIADO', estimatedValue: 500 }),
      device({ id: 2, model: 'iPhone 13 Pro', serialNumber: 'G7ABC' }),
    ])

    expect(reason).toMatch(/iPhone 13 Pro \(série G7ABC\) ainda aguarda avaliação/)
  })

  it('saldo negativo bloqueia', () => {
    const reason = conversionBlockedReason(1500, [
      device({ evaluationStatus: 'AVALIADO', estimatedValue: 1500.01 }),
    ])

    expect(reason).toMatch(/Saldo a pagar negativo/)
  })

  it('aparelho recusado não bloqueia', () => {
    expect(
      conversionBlockedReason(1500, [device({ evaluationStatus: 'RECUSADO', report: 'iCloud' })]),
    ).toBeNull()
  })

  it('sem aparelhos não bloqueia', () => {
    expect(conversionBlockedReason(1500, [])).toBeNull()
  })
})
