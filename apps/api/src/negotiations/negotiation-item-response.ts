import { Prisma } from '../../generated/prisma/client';
import { NOT_DELETED } from '../prisma/prisma.service';
import { priceItem } from './negotiation-item-pricing';

// UC3 §4.1 / UC6 §7: os itens como o detalhe os mostra — o da Negociação e o
// do Pedido (RB7: o Pedido não tem itens próprios, lê os da Negociação pelo
// vínculo 1:1). RI2: nome e código vêm sempre do catálogo, nunca copiados para
// o item; "deleted" avisa a tela que o Produto sumiu.
export const negotiationItemsSelect = {
  where: NOT_DELETED,
  select: {
    id: true,
    quantity: true,
    unitPrice: true,
    discountType: true,
    discountValue: true,
    product: {
      select: {
        id: true,
        name: true,
        sku: true,
        status: true,
        deletedAt: true,
      },
    },
  },
  orderBy: { id: 'asc' },
} satisfies Prisma.NegotiationSelect['items'];

type NegotiationItemRow = Prisma.NegotiationItemGetPayload<{
  select: typeof negotiationItemsSelect.select;
}>;

export const fromCents = (cents: number) => cents / 100;

// Forma e número como gravados; desconto em R$ e subtotal derivados na hora
// (ADR 0015), nunca guardados.
export function toItemResponse(item: NegotiationItemRow) {
  const pricing = priceItem(item);
  return {
    id: item.id,
    product: {
      id: item.product.id,
      name: item.product.name,
      sku: item.product.sku,
      status: item.product.status,
      deleted: item.product.deletedAt !== null,
    },
    quantity: item.quantity,
    unitPrice: Number(item.unitPrice),
    discountType: item.discountType,
    discountValue: Number(item.discountValue),
    discountAmount: fromCents(pricing.discountCents),
    subtotal: fromCents(pricing.subtotalCents),
  };
}
