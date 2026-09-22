import { describe, expect, it } from 'vitest'
import {
  calculateItem,
  calculateItemSubtotal,
  itemDiscountError,
  sellerDiscountLimitError,
  sumItemsAtPracticedPrice,
  sumNegotiationItems,
} from './negotiationItemsSummary'

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

describe('sumItemsAtPracticedPrice', () => {
  const products = [
    { id: 'p1', price: 500 },
    { id: 'p2', price: 50 },
  ]

  it('usa o preço praticado do item e, sem ele, o preço atual do catálogo', () => {
    const total = sumItemsAtPracticedPrice(
      [
        { productId: 'p1', quantity: 2, unitPrice: 100 },
        { productId: 'p2', quantity: 3 },
      ],
      products,
    )

    expect(total).toBe(350)
  })

  it('ignora item cujo Produto não está no catálogo carregado', () => {
    expect(
      sumItemsAtPracticedPrice([{ productId: 'p9', quantity: 1 }], products),
    ).toBe(0)
  })
})

describe('calculateItem — desconto do item (ADR 0015, ticket 08)', () => {
  it('desconto percentual sobre a linha inteira', () => {
    expect(
      calculateItem({ quantity: 2, unitPrice: 100, discountType: 'PERCENTUAL', discountValue: 10 }),
    ).toEqual({ line: 200, discountAmount: 20, subtotal: 180 })
  })

  it('desconto em reais abatido direto da linha', () => {
    expect(
      calculateItem({ quantity: 2, unitPrice: 100, discountType: 'VALOR', discountValue: 50 }),
    ).toEqual({ line: 200, discountAmount: 50, subtotal: 150 })
  })

  it('sem forma nem número, é sem desconto', () => {
    expect(calculateItem({ quantity: 3, unitPrice: 799.9 })).toEqual({
      line: 2399.7,
      discountAmount: 0,
      subtotal: 2399.7,
    })
  })

  it('arredonda o percentual ao centavo, meio para cima, como o backend', () => {
    expect(
      calculateItem({ quantity: 1, unitPrice: 10.05, discountType: 'PERCENTUAL', discountValue: 10 }),
    ).toEqual({ line: 10.05, discountAmount: 1.01, subtotal: 9.04 })
  })

  it('mudar a quantidade mantém o percentual e muda o desconto em R$ (história 16)', () => {
    const item = { unitPrice: 100, discountType: 'PERCENTUAL' as const, discountValue: 10 }
    expect(calculateItem({ ...item, quantity: 2 }).discountAmount).toBe(20)
    expect(calculateItem({ ...item, quantity: 4 }).discountAmount).toBe(40)
  })

  it('mudar a quantidade mantém o desconto em R$ (história 16)', () => {
    const item = { unitPrice: 100, discountType: 'VALOR' as const, discountValue: 20 }
    expect(calculateItem({ ...item, quantity: 2 }).subtotal).toBe(180)
    expect(calculateItem({ ...item, quantity: 4 }).subtotal).toBe(380)
  })
})

describe('sumNegotiationItems com desconto', () => {
  it('soma os subtotais já descontados', () => {
    expect(
      sumNegotiationItems([
        { quantity: 2, unitPrice: 100, discountType: 'PERCENTUAL', discountValue: 10 },
        { quantity: 1, unitPrice: 50, discountType: 'VALOR', discountValue: 5 },
      ]),
    ).toBe(225)
  })
})

describe('itemDiscountError (RI5, só para UX — o backend decide)', () => {
  it.each([
    [{ quantity: 1, unitPrice: 100, discountType: 'PERCENTUAL' as const, discountValue: 100.01 }, 'Entre 0 e 100%'],
    [{ quantity: 1, unitPrice: 100, discountType: 'PERCENTUAL' as const, discountValue: -1 }, 'Entre 0 e 100%'],
    [{ quantity: 1, unitPrice: 100, discountType: 'VALOR' as const, discountValue: -1 }, 'Não pode ser negativo'],
    [{ quantity: 2, unitPrice: 100, discountType: 'VALOR' as const, discountValue: 200.01 }, 'Maior que a linha'],
  ])('recusa %o', (item, message) => {
    expect(itemDiscountError(item)).toBe(message)
  })

  it.each([
    { quantity: 2, unitPrice: 100, discountType: 'VALOR' as const, discountValue: 200 },
    { quantity: 1, unitPrice: 100, discountType: 'PERCENTUAL' as const, discountValue: 100 },
    { quantity: 1, unitPrice: 100 },
  ])('aceita %o', (item) => {
    expect(itemDiscountError(item)).toBeNull()
  })
})

describe('sellerDiscountLimitError (RI6, só para UX — o backend decide)', () => {
  const item = (discountType: 'PERCENTUAL' | 'VALOR', discountValue: number, quantity = 2) => ({
    quantity,
    unitPrice: 100,
    discountType,
    discountValue,
  })

  it('aponta item novo com percentual efetivo acima de 15%', () => {
    expect(sellerDiscountLimitError(item('PERCENTUAL', 20), undefined)).toBe(
      'Acima de 15% exige administrador',
    )
  })

  it('usa o percentual efetivo também no desconto em R$', () => {
    expect(sellerDiscountLimitError(item('VALOR', 30.01), undefined)).not.toBeNull()
    expect(sellerDiscountLimitError(item('VALOR', 30), undefined)).toBeNull()
  })

  it('aceita exatamente 15%', () => {
    expect(sellerDiscountLimitError(item('PERCENTUAL', 15), undefined)).toBeNull()
  })

  it('não confere item gravado que não foi alterado, mesmo acima de 15%', () => {
    expect(sellerDiscountLimitError(item('PERCENTUAL', 20), item('PERCENTUAL', 20))).toBeNull()
  })

  it('confere item gravado cuja quantidade mudou', () => {
    expect(
      sellerDiscountLimitError(item('PERCENTUAL', 20, 3), item('PERCENTUAL', 20)),
    ).not.toBeNull()
  })

  it('confere item gravado cujo desconto mudou', () => {
    expect(
      sellerDiscountLimitError(item('PERCENTUAL', 18), item('PERCENTUAL', 20)),
    ).not.toBeNull()
  })
})
