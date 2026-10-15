import { EvaluationStatus } from '../../generated/prisma/enums';

// Aceita number ou Prisma.Decimal (lido do banco): os dois viram número por
// Number().
export type Numeric = number | { toString(): string };

export interface TradeInInput {
  evaluationStatus: EvaluationStatus;
  estimatedValue: Numeric | null;
}

export interface AmountDue {
  tradeInTotalCents: number;
  amountDueCents: number;
}

const toCents = (value: Numeric) => Math.round(Number(value) * 100);

// RD10: o valor de troca é o valor estimado, e só do aparelho avaliado.
// Aguardando e recusado contam zero.
export const tradeInValueCents = (device: TradeInInput) =>
  device.evaluationStatus === 'AVALIADO' && device.estimatedValue !== null
    ? toCents(device.estimatedValue)
    : 0;

// §Saldo a pagar (spec 007) / ADR 0018: a troca é parte do pagamento, não
// desconto — o total fica como está e o saldo é derivado, nunca gravado. Pode
// ser negativo (troca maior que a compra); quem chama decide se isso bloqueia.
// Tudo em centavos inteiros, como installment-pricing.ts.
export function amountDue(
  totalValue: Numeric,
  devices: TradeInInput[],
): AmountDue {
  return balance(totalValue, devices.map(tradeInValueCents));
}

// RD12: o Orçamento emitido guarda só os avaliados, com o valor de troca já
// copiado — o saldo dele sai dessas linhas congeladas, pela mesma conta.
export function frozenAmountDue(
  totalValue: Numeric,
  tradeInValues: Numeric[],
): AmountDue {
  return balance(totalValue, tradeInValues.map(toCents));
}

function balance(totalValue: Numeric, tradeInCents: number[]): AmountDue {
  const tradeInTotalCents = tradeInCents.reduce(
    (total, cents) => total + cents,
    0,
  );
  return {
    tradeInTotalCents,
    amountDueCents: toCents(totalValue) - tradeInTotalCents,
  };
}
