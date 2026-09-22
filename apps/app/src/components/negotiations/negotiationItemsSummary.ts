import type { DiscountType } from '../../types'

export interface NegotiationItemDraft {
  productId: string
  quantity: number
  unitPrice: number
  discountType?: DiscountType
  discountValue?: number
}

type PricedItem = Omit<NegotiationItemDraft, 'productId'>

export interface ItemCalculation {
  line: number
  discountAmount: number
  subtotal: number
}

const toCents = (value: number) => Math.round(value * 100)

function calculateItemCents(item: PricedItem) {
  const lineCents = toCents(item.unitPrice) * item.quantity
  const discountValue = item.discountValue ?? 0
  const discountCents =
    item.discountType === 'PERCENTUAL'
      ? Math.floor((lineCents * toCents(discountValue) + 5_000) / 10_000)
      : toCents(discountValue)
  return { lineCents, discountCents, subtotalCents: lineCents - discountCents }
}

export function calculateItem(item: PricedItem): ItemCalculation {
  const { lineCents, discountCents, subtotalCents } = calculateItemCents(item)
  return {
    line: lineCents / 100,
    discountAmount: discountCents / 100,
    subtotal: subtotalCents / 100,
  }
}

export function calculateItemSubtotal(item: PricedItem): number {
  return calculateItem(item).subtotal
}

export function itemDiscountError(item: PricedItem): string | null {
  const discountValue = item.discountValue ?? 0
  if (item.discountType === 'PERCENTUAL') {
    return discountValue < 0 || discountValue > 100 ? 'Entre 0 e 100%' : null
  }
  if (discountValue < 0) return 'Não pode ser negativo'
  return calculateItemCents(item).subtotalCents < 0 ? 'Maior que a linha' : null
}

export const SELLER_DISCOUNT_LIMIT_PERCENT = 15

type SavedDiscount = Pick<PricedItem, 'quantity' | 'discountType' | 'discountValue'>

function isChanged(item: PricedItem, saved: SavedDiscount | undefined) {
  return (
    !saved ||
    saved.quantity !== item.quantity ||
    (saved.discountType ?? 'VALOR') !== (item.discountType ?? 'VALOR') ||
    (saved.discountValue ?? 0) !== (item.discountValue ?? 0)
  )
}

export function sellerDiscountLimitError(
  item: PricedItem,
  saved: SavedDiscount | undefined,
): string | null {
  if (!isChanged(item, saved)) return null
  const { lineCents, discountCents } = calculateItemCents(item)
  return discountCents * 100 > lineCents * SELLER_DISCOUNT_LIMIT_PERCENT
    ? `Acima de ${SELLER_DISCOUNT_LIMIT_PERCENT}% exige administrador`
    : null
}

export function findItemOverSellerLimit<T extends Omit<NegotiationItemDraft, 'unitPrice'> & { unitPrice?: number }>(
  items: T[],
  savedItems: (SavedDiscount & { productId: string })[],
  products: { id: string; price: number }[],
): T | undefined {
  const savedById = new Map(savedItems.map((item) => [item.productId, item]))
  const priceById = new Map(products.map((p) => [p.id, p.price]))
  return items.find((item) => {
    const unitPrice = item.unitPrice ?? priceById.get(item.productId)
    return (
      unitPrice !== undefined &&
      sellerDiscountLimitError({ ...item, unitPrice }, savedById.get(item.productId)) !== null
    )
  })
}

export function sumNegotiationItems(items: PricedItem[]): number {
  const cents = items.reduce(
    (total, item) => total + calculateItemCents(item).subtotalCents,
    0,
  )
  return cents / 100
}

export function sumItemsAtPracticedPrice(
  items: (Omit<NegotiationItemDraft, 'unitPrice'> & { unitPrice?: number })[],
  products: { id: string; price: number }[],
): number {
  const priceById = new Map(products.map((p) => [p.id, p.price]))
  return sumNegotiationItems(
    items.flatMap((item) => {
      const unitPrice = item.unitPrice ?? priceById.get(item.productId)
      return unitPrice === undefined ? [] : [{ ...item, unitPrice }]
    }),
  )
}
