import { toCents } from './negotiationItemsSummary'

export const MAX_INSTALLMENTS = 12

export interface InstallmentSimulation {
  installments: number
  ratePercent: number
  cashTotal: number
  totalWithInterest: number
  surcharge: number
  installmentValue: number
  firstInstallment: number
}

export function sumCashTotal(items: { subtotal: number }[]): number {
  return items.reduce((total, item) => total + toCents(item.subtotal), 0) / 100
}

export function simulateInstallment(
  cashTotal: number,
  installments: number,
  ratePercent: number,
): InstallmentSimulation {
  const cashCents = toCents(cashTotal)
  const rateHundredths = toCents(ratePercent)
  const totalCents = Math.floor((cashCents * (10_000 + rateHundredths) + 5_000) / 10_000)
  const baseCents = Math.floor(totalCents / installments)
  const residualCents = totalCents - baseCents * installments
  return {
    installments,
    ratePercent,
    cashTotal: cashCents / 100,
    totalWithInterest: totalCents / 100,
    surcharge: (totalCents - cashCents) / 100,
    installmentValue: baseCents / 100,
    firstInstallment: (baseCents + residualCents) / 100,
  }
}
