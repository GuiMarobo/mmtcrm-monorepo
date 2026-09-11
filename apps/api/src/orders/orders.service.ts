import {
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { NOT_DELETED, PrismaService } from '../prisma/prisma.service';

// O Pedido só é lido com o Cliente e o Vendedor (via Negociação de origem), a
// forma de pagamento, o valor e a situação — spec 005 §4/§5.
const orderSelect = {
  id: true,
  code: true,
  status: true,
  paymentMethod: true,
  totalValue: true,
  statusChangedAt: true,
  createdAt: true,
  negotiation: {
    select: {
      id: true,
      notes: true,
      client: { select: { id: true, name: true, status: true } },
      vendedor: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.OrderSelect;

type OrderRow = Prisma.OrderGetPayload<{ select: typeof orderSelect }>;

// Fila de cobrança (RN14/D13): "Aguardando Pagamento" no topo, depois o restante.
// Dentro de cada grupo, o mais antigo primeiro por statusChangedAt.
const QUEUE_PRIORITY: Record<string, number> = {
  EM_NEGOCIACAO: 0,
  COMPRA_APROVADA: 1,
  DESISTENCIA: 2,
};

@Injectable()
export class OrdersService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(order: OrderRow) {
    const { negotiation, ...rest } = order;
    return {
      ...rest,
      totalValue: Number(order.totalValue),
      negotiationId: negotiation.id,
      notes: negotiation.notes,
      client: negotiation.client,
      vendedor: negotiation.vendedor,
    };
  }

  private async ensureExists(id: number) {
    const order = await this.prisma.order.findFirst({
      where: { ...NOT_DELETED, id },
      select: orderSelect,
    });
    if (!order) throw new NotFoundException('Pedido não encontrado');
    return order;
  }

  // RN5/RN14: todos os Pedidos não excluídos, de qualquer Vendedor, na ordem da
  // fila de cobrança. A ordenação é feita aqui (não no banco) porque a
  // prioridade por situação não é a ordem natural do enum.
  async findAll() {
    const orders = await this.prisma.order.findMany({
      where: { ...NOT_DELETED },
      select: orderSelect,
    });

    return orders
      .sort((a, b) => {
        const byQueue =
          (QUEUE_PRIORITY[a.status] ?? 9) - (QUEUE_PRIORITY[b.status] ?? 9);
        if (byQueue !== 0) return byQueue;
        return a.statusChangedAt.getTime() - b.statusChangedAt.getTime();
      })
      .map((order) => this.toResponse(order));
  }

  async findOne(id: number) {
    return this.toResponse(await this.ensureExists(id));
  }

  // RN2: registra o pagamento confirmado. Só a partir de EM_NEGOCIACAO; a
  // anonimização LGPD do Cliente não bloqueia esta transição (RN12/ADR 0012).
  async markAsPaid(id: number) {
    const order = await this.ensureExists(id);

    if (order.status !== 'EM_NEGOCIACAO') {
      throw new ConflictException(
        'Só é possível aprovar um pedido aguardando pagamento',
      );
    }

    const updated = await this.prisma.order.update({
      where: { id },
      data: { status: 'COMPRA_APROVADA', statusChangedAt: new Date() },
      select: orderSelect,
    });

    return this.toResponse(updated);
  }
}
