import { formatCurrency } from '../../utils/format'
import { toCents } from '../negotiations/negotiationItemsSummary'

export interface InstallmentCondition {
  installments: number
  installmentValue: number
  firstInstallment: number
}

export function describeCondition({
  installments,
  installmentValue,
  firstInstallment,
}: InstallmentCondition): string {
  if (firstInstallment === installmentValue) {
    return `${installments}x de ${formatCurrency(installmentValue)}`
  }
  return `1ª de ${formatCurrency(firstInstallment)} + ${installments - 1}x de ${formatCurrency(installmentValue)}`
}

export function sumInstallments({
  installments,
  installmentValue,
  firstInstallment,
}: InstallmentCondition): number {
  return (toCents(firstInstallment) + toCents(installmentValue) * (installments - 1)) / 100
}
