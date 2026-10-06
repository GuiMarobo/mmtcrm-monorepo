import { describe, expect, it } from 'vitest'
import { simulateInstallment, sumCashTotal } from './installmentSimulation'

describe('sumCashTotal', () => {
  it('soma os subtotais dos itens ao centavo', () => {
    expect(sumCashTotal([{ subtotal: 0.1 }, { subtotal: 0.2 }])).toBe(0.3)
  })

  it('lista vazia soma zero', () => {
    expect(sumCashTotal([])).toBe(0)
  })
})

describe('simulateInstallment', () => {
  it('1x com 0%: total com juros é o total à vista, parcela única', () => {
    expect(simulateInstallment(1234.56, 1, 0)).toEqual({
      installments: 1,
      ratePercent: 0,
      cashTotal: 1234.56,
      totalWithInterest: 1234.56,
      surcharge: 0,
      installmentValue: 1234.56,
      firstInstallment: 1234.56,
    })
  })

  it('aplica a taxa como acréscimo direto sobre o total à vista', () => {
    expect(simulateInstallment(1000, 10, 5)).toMatchObject({
      totalWithInterest: 1050,
      surcharge: 50,
      installmentValue: 105,
      firstInstallment: 105,
    })
  })

  it('arredonda o total com juros ao centavo, meio para cima', () => {
    expect(simulateInstallment(10.1, 2, 2.5).totalWithInterest).toBe(10.35)
    expect(simulateInstallment(0.3, 1, 2.5).totalWithInterest).toBe(0.31)
    expect(simulateInstallment(0.2, 1, 2.5).totalWithInterest).toBe(0.21)
  })

  it('trunca a parcela base e joga o resíduo na primeira parcela', () => {
    expect(simulateInstallment(100, 3, 0)).toMatchObject({
      totalWithInterest: 100,
      installmentValue: 33.33,
      firstInstallment: 33.34,
    })
  })

  it('valor que não divide por 12: 1ª de R$ 945,90 + 11x de R$ 945,83', () => {
    expect(simulateInstallment(11350.03, 12, 0)).toMatchObject({
      totalWithInterest: 11350.03,
      installmentValue: 945.83,
      firstInstallment: 945.9,
    })
  })

  it('divisão exata por 12 não tem resíduo', () => {
    expect(simulateInstallment(11349.96, 12, 0)).toMatchObject({
      installmentValue: 945.83,
      firstInstallment: 945.83,
    })
  })

  it('a soma das parcelas é sempre exatamente o total com juros', () => {
    for (const cashTotal of [0.01, 7.77, 999.99, 1234.56, 11350.03, 87654.32]) {
      for (let installments = 1; installments <= 12; installments += 1) {
        for (const ratePercent of [0, 1.99, 3.5, 12.49, 100]) {
          const result = simulateInstallment(cashTotal, installments, ratePercent)
          const cents =
            Math.round(result.firstInstallment * 100) +
            Math.round(result.installmentValue * 100) * (installments - 1)
          expect(cents).toBe(Math.round(result.totalWithInterest * 100))
        }
      }
    }
  })

  it('taxa com duas casas não sofre erro de ponto flutuante', () => {
    expect(simulateInstallment(1000, 12, 1.15).totalWithInterest).toBe(1011.5)
    expect(simulateInstallment(1000, 12, 1.15).surcharge).toBe(11.5)
  })
})
