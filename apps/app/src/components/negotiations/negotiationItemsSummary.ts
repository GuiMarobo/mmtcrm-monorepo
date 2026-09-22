export interface NegotiationItemDraft {
  productId: string
  quantity: number
  unitPrice: number
}

export function calculateItemSubtotal(
  item: Pick<NegotiationItemDraft, 'quantity' | 'unitPrice'>,
): number {
  return item.quantity * item.unitPrice
}

export function sumNegotiationItems(
  items: Pick<NegotiationItemDraft, 'quantity' | 'unitPrice'>[],
): number {
  return items.reduce((total, item) => total + calculateItemSubtotal(item), 0)
}

export function sumItemsAtPracticedPrice(
  items: (Omit<NegotiationItemDraft, 'unitPrice'> & { unitPrice?: number })[],
  products: { id: string; price: number }[],
): number {
  const priceById = new Map(products.map((p) => [p.id, p.price]))
  return sumNegotiationItems(
    items.flatMap((item) => {
      const unitPrice = item.unitPrice ?? priceById.get(item.productId)
      return unitPrice === undefined ? [] : [{ quantity: item.quantity, unitPrice }]
    }),
  )
}
