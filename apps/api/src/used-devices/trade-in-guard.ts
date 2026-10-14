import { ConflictException } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { NOT_DELETED } from '../prisma/prisma.service';
import { AmountDue, amountDue, Numeric } from './amount-due';

// RD11/RD12: converter em Pedido e emitir Orçamento esperam a troca resolvida
// — nenhum aparelho aguardando avaliação e o Saldo a pagar não negativo. As
// duas recusas são a mesma regra; muda só a ação nomeada na mensagem.
export const findTradeIns = (
  tx: Prisma.TransactionClient,
  negotiationId: number,
) =>
  tx.usedDevice.findMany({
    where: { ...NOT_DELETED, negotiationId },
    select: {
      id: true,
      model: true,
      serialNumber: true,
      evaluationStatus: true,
      estimatedValue: true,
    },
    orderBy: { id: 'asc' },
  });

type TradeIn = Awaited<ReturnType<typeof findTradeIns>>[number];

export function assertNoPendingTradeIn(devices: TradeIn[], action: string) {
  const pending = devices.find(
    (device) => device.evaluationStatus === 'AGUARDANDO',
  );
  if (pending) {
    throw new ConflictException(
      `O aparelho ${pending.model} (série ${pending.serialNumber}) ainda aguarda avaliação; espere a avaliação ou remova-o da troca antes de ${action}`,
    );
  }
}

// A loja não paga o Cliente: troca maior que a compra é recusada.
export function assertAmountDueNotNegative(
  totalValue: Numeric,
  devices: TradeIn[],
  action: string,
): AmountDue {
  const balance = amountDue(totalValue, devices);
  if (balance.amountDueCents < 0) {
    throw new ConflictException(
      `Saldo a pagar negativo: a troca vale mais que a compra. Ajuste os itens ou os aparelhos antes de ${action}`,
    );
  }
  return balance;
}
