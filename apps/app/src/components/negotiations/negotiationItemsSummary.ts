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
