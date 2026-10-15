import { toCents } from './negotiationItemsSummary'
import type { UsedDevice } from '../../types'

type TradeInDevice = Pick<UsedDevice, 'model' | 'serialNumber' | 'evaluationStatus' | 'estimatedValue'>

export interface AmountDueSummary {
  totalValue: number
  tradeInTotal: number
  amountDue: number
  negative: boolean
}

const tradeInCents = (device: TradeInDevice) =>
  device.evaluationStatus === 'AVALIADO' && device.estimatedValue !== null
    ? toCents(device.estimatedValue)
    : 0

export function summarizeAmountDue(totalValue: number, devices: TradeInDevice[]): AmountDueSummary {
  return balance(totalValue, devices.map(tradeInCents))
}

export function summarizeTradeIns(totalValue: number, tradeInValues: number[]): AmountDueSummary {
  return balance(totalValue, tradeInValues.map(toCents))
}

function balance(totalValue: number, tradeInCentsList: number[]): AmountDueSummary {
  const tradeInTotalCents = tradeInCentsList.reduce((total, cents) => total + cents, 0)
  const amountDueCents = toCents(totalValue) - tradeInTotalCents
  return {
    totalValue,
    tradeInTotal: tradeInTotalCents / 100,
    amountDue: amountDueCents / 100,
    negative: amountDueCents < 0,
  }
}

function tradeInBlockedReason(
  totalValue: number,
  devices: TradeInDevice[],
  action: string,
): string | null {
  const pending = devices.find((device) => device.evaluationStatus === 'AGUARDANDO')
  if (pending) {
    return `O aparelho ${pending.model} (série ${pending.serialNumber}) ainda aguarda avaliação; espere a avaliação ou remova-o da troca antes de ${action}.`
  }
  if (summarizeAmountDue(totalValue, devices).negative) {
    return `Saldo a pagar negativo: a troca vale mais que a compra. Ajuste os itens ou os aparelhos antes de ${action}.`
  }
  return null
}

export function conversionBlockedReason(
  totalValue: number,
  devices: TradeInDevice[],
): string | null {
  return tradeInBlockedReason(totalValue, devices, 'converter')
}

export function quotationBlockedReason(
  totalValue: number,
  devices: TradeInDevice[],
): string | null {
  return tradeInBlockedReason(totalValue, devices, 'simular ou emitir o orçamento')
}
