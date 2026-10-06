import { describe, expect, it } from 'vitest'
import { describeCondition, sumInstallments } from './quotationCondition'

const spoken = (condition: Parameters<typeof describeCondition>[0]) =>
  describeCondition(condition).replace(/\s/g, ' ')

describe('describeCondition', () => {
  it('sem resíduo: "12x de …"', () => {
    expect(
      spoken({ installments: 12, installmentValue: 945.83, firstInstallment: 945.83 }),
    ).toBe('12x de R$ 945,83')
  })

  it('com resíduo: "1ª de … + 11x de …"', () => {
    expect(
      spoken({ installments: 12, installmentValue: 945.83, firstInstallment: 945.9 }),
    ).toBe('1ª de R$ 945,90 + 11x de R$ 945,83')
  })

  it('1x é o valor à vista', () => {
    expect(
      spoken({ installments: 1, installmentValue: 1100, firstInstallment: 1100 }),
    ).toBe('1x de R$ 1.100,00')
  })
})

describe('sumInstallments', () => {
  it('soma a primeira com as demais, em centavos exatos', () => {
    expect(
      sumInstallments({ installments: 12, installmentValue: 945.83, firstInstallment: 945.9 }),
    ).toBe(11350.03)
  })

  it('sem resíduo é parcela × número de parcelas', () => {
    expect(
      sumInstallments({ installments: 3, installmentValue: 0.1, firstInstallment: 0.1 }),
    ).toBe(0.3)
  })
})
