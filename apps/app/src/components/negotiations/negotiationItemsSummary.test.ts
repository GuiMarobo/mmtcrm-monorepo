import { describe, expect, it } from 'vitest'
import { calculateItemSubtotal, sumNegotiationItems } from './negotiationItemsSummary'

describe('calculateItemSubtotal', () => {
  it('multiplica quantidade pelo preço praticado', () => {
    expect(calculateItemSubtotal({ quantity: 3, unitPrice: 799.9 })).toBeCloseTo(2399.7)
  })

  it('quantidade 1 devolve o próprio preço', () => {
    expect(calculateItemSubtotal({ quantity: 1, unitPrice: 100 })).toBe(100)
  })
})

describe('sumNegotiationItems', () => {
  it('soma o subtotal de vários itens (RI7)', () => {
    const total = sumNegotiationItems([
      { quantity: 2, unitPrice: 100 },
      { quantity: 3, unitPrice: 50 },
    ])

    expect(total).toBe(350)
  })

  it('lista vazia soma zero (RI8: negociação nasce com total R$ 0,00)', () => {
    expect(sumNegotiationItems([])).toBe(0)
  })
})
