import { DiscountType } from '../../generated/prisma/enums';

// Aceita number ou Prisma.Decimal (lido do banco): os dois viram número por
// Number().
type Numeric = number | { toString(): string };

export interface ItemPricingInput {
  quantity: number;
  unitPrice: Numeric;
  discountType: DiscountType;
  discountValue: Numeric;
}

export interface ItemPricing {
  lineCents: number;
  discountCents: number;
  subtotalCents: number;
}

const toCents = (value: Numeric) => Math.round(Number(value) * 100);

// §Cálculo do item (spec 010) / ADR 0015: tudo em centavos inteiros para não
// acumular erro de ponto flutuante. O desconto é sempre sobre a linha
// (quantidade × preço praticado). Percentual: linha × % ÷ 100, arredondado ao
// centavo, meio para cima — o % também vira inteiro (centésimos de ponto) para
// a divisão ser exata. Valor: o número informado direto. Quem chama confere a
// RI5 (desconto nunca maior que a linha) antes de gravar.
export function priceItem(item: ItemPricingInput): ItemPricing {
  const lineCents = toCents(item.unitPrice) * item.quantity;
  const discountCents =
    item.discountType === 'PERCENTUAL'
      ? Math.floor((lineCents * toCents(item.discountValue) + 5_000) / 10_000)
      : toCents(item.discountValue);
  return {
    lineCents,
    discountCents,
    subtotalCents: lineCents - discountCents,
  };
}
