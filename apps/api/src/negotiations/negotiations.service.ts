import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleEnum } from '../users/dto/create-user.dto';
import { Prisma } from '../../generated/prisma/client';
import { NegotiationStatus } from '../../generated/prisma/enums';
import { NOT_DELETED, PrismaService } from '../prisma/prisma.service';
import {
  CreateNegotiationDto,
  PaymentMethodEnum,
} from './dto/create-negotiation.dto';
import { CreateNegotiationItemDto } from './dto/create-negotiation-item.dto';
import { UpdateNegotiationDto } from './dto/update-negotiation.dto';
import { ReplaceNegotiationDto } from './dto/replace-negotiation.dto';

const negotiationSelect = {
  id: true,
  clientId: true,
  vendedorId: true,
  status: true,
  totalValue: true,
  notes: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  client: { select: { id: true, name: true, status: true } },
  vendedor: { select: { id: true, name: true } },
  order: {
    select: {
      id: true,
      code: true,
      status: true,
      paymentMethod: true,
      totalValue: true,
      deletedAt: true,
    },
  },
} satisfies Prisma.NegotiationSelect;

type NegotiationRow = Prisma.NegotiationGetPayload<{
  select: typeof negotiationSelect;
}>;

// UC3 §4.1 / UC6 §7: o detalhe carrega os itens — a lista (quadro, Pipeline)
// continua enxuta e não os traz. RI2: nome e código vêm sempre do catálogo,
// nunca copiados para o item; "deleted" avisa a tela que o Produto sumiu.
const negotiationDetailSelect = {
  ...negotiationSelect,
  items: {
    where: NOT_DELETED,
    select: {
      id: true,
      quantity: true,
      unitPrice: true,
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
  },
} satisfies Prisma.NegotiationSelect;

type NegotiationDetailRow = Prisma.NegotiationGetPayload<{
  select: typeof negotiationDetailSelect;
}>;

const ITEM_NOT_ACTIVE =
  'Só é possível adicionar Produtos ativos e não excluídos do catálogo';

const ITEM_DUPLICATED =
  'Um Produto não pode aparecer duas vezes na mesma negociação';

// A maquina de estados da spec 001 tem exatamente estas quatro arestas.
// Converter em pedido e o que torna a negociacao GANHA; nao existe "concluir".
const ALLOWED_TRANSITIONS: Record<NegotiationStatus, NegotiationStatus[]> = {
  ABERTA: ['GANHA', 'PERDIDA'],
  GANHA: ['ABERTA'],
  PERDIDA: ['ABERTA'],
};

@Injectable()
export class NegotiationsService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(negotiation: NegotiationRow) {
    const { order, ...rest } = negotiation;
    return {
      ...rest,
      totalValue: Number(negotiation.totalValue),
      // O pedido so acompanha negociacao excluida logicamente; fora disso nunca
      // vem marcado. O guarda existe para o contrato nao mentir se vier.
      order:
        order && !order.deletedAt
          ? {
              id: order.id,
              code: order.code,
              status: order.status,
              paymentMethod: order.paymentMethod,
              totalValue: Number(order.totalValue),
            }
          : null,
    };
  }

  private toDetailResponse(negotiation: NegotiationDetailRow) {
    const { items, ...rest } = negotiation;
    return {
      ...this.toResponse(rest),
      items: items.map((item) => {
        const unitPrice = Number(item.unitPrice);
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
          unitPrice,
          subtotal: unitPrice * item.quantity,
        };
      }),
    };
  }

  private assertTransition(from: NegotiationStatus, to: NegotiationStatus) {
    if (!ALLOWED_TRANSITIONS[from].includes(to)) {
      throw new ConflictException(
        `Não é possível passar de ${from} para ${to}. Reabra a negociação antes.`,
      );
    }
  }

  // RI2/RI3: valida a lista recebida e copia o preço praticado de cada Produto
  // ativo e não excluído. tx: a mesma transação da escrita dos itens, para que
  // a checagem de status/existência não fique defasada entre a leitura e a
  // gravação.
  private async buildItemsData(
    tx: Prisma.TransactionClient,
    items: CreateNegotiationItemDto[],
  ) {
    const productIds = items.map((item) => item.productId);
    if (new Set(productIds).size !== productIds.length) {
      throw new BadRequestException(ITEM_DUPLICATED);
    }
    if (productIds.length === 0) return [];

    const products = await tx.product.findMany({
      where: { ...NOT_DELETED, id: { in: productIds }, status: 'ATIVO' },
      select: { id: true, price: true },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    return items.map((item) => {
      const product = productById.get(item.productId);
      if (!product) throw new BadRequestException(ITEM_NOT_ACTIVE);

      return {
        productId: item.productId,
        quantity: item.quantity,
        unitPrice: product.price,
      };
    });
  }

  // RI7: soma dos subtotais dos itens não excluídos (sem desconto ainda —
  // ticket 08). Soma em centavos (inteiro) para não acumular erro de ponto
  // flutuante entre itens, e só volta a reais no fim.
  private sumSubtotals(
    items: { quantity: number; unitPrice: Prisma.Decimal }[],
  ) {
    const cents = items.reduce(
      (total, item) =>
        total + Math.round(Number(item.unitPrice) * 100) * item.quantity,
      0,
    );
    return cents / 100;
  }

  private async ensureExists(id: number) {
    const negotiation = await this.prisma.negotiation.findFirst({
      where: { ...NOT_DELETED, id },
      select: negotiationSelect,
    });
    if (!negotiation) throw new NotFoundException('Negociação não encontrada');
    return negotiation;
  }

  // Cliente anonimizado (LGPD): o cadastro pessoal e imutavel e nenhuma
  // Negociacao nova pode ser aberta ou transferida para ele. As transicoes e a
  // edicao de uma Negociacao existente NAO passam por aqui — a anonimizacao nao
  // congela o ciclo comercial (RN12 / ADR 0012). So `create` e a troca de
  // clientId chamam este guarda.
  private async ensureClientEditable(clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { ...NOT_DELETED, id: clientId },
      select: { id: true, status: true, anonymizedAt: true },
    });
    if (!client) throw new NotFoundException('Cliente não encontrado');
    if (client.anonymizedAt) {
      throw new ConflictException(
        'Cliente com dados pessoais eliminados (LGPD) não pode ter negociações alteradas',
      );
    }
    return client;
  }

  private ensureOpen(negotiation: NegotiationRow) {
    if (negotiation.status !== 'ABERTA') {
      throw new ConflictException(
        'Só é possível alterar os dados de uma negociação em aberto',
      );
    }
  }

  // RI4/RI7: dentro da mesma transação, valida e precifica os itens, soma o
  // total e cria a Negociação com os dois já resolvidos — o total nunca
  // existe sem os itens que o explicam.
  async create(dto: CreateNegotiationDto, vendedorId: number) {
    await this.ensureClientEditable(dto.clientId);

    const negotiation = await this.prisma.$transaction(async (tx) => {
      const itemsData = await this.buildItemsData(tx, dto.items);
      const totalValue = this.sumSubtotals(itemsData);

      return tx.negotiation.create({
        data: {
          clientId: dto.clientId,
          vendedorId,
          status: 'ABERTA',
          totalValue,
          notes: dto.notes,
          items: { create: itemsData },
        },
        select: negotiationSelect,
      });
    });

    return this.toResponse(negotiation);
  }

  async findAll() {
    const negotiations = await this.prisma.negotiation.findMany({
      where: { ...NOT_DELETED },
      select: negotiationSelect,
      orderBy: { updatedAt: 'desc' },
    });
    return negotiations.map((negotiation) => this.toResponse(negotiation));
  }

  async findOne(id: number) {
    const negotiation = await this.prisma.negotiation.findFirst({
      where: { ...NOT_DELETED, id },
      select: negotiationDetailSelect,
    });
    if (!negotiation) throw new NotFoundException('Negociação não encontrada');
    return this.toDetailResponse(negotiation);
  }

  async replace(id: number, dto: ReplaceNegotiationDto) {
    const current = await this.ensureExists(id);
    this.ensureOpen(current);
    if (dto.clientId !== current.clientId) {
      await this.ensureClientEditable(dto.clientId);
    }

    const negotiation = await this.prisma.negotiation.update({
      where: { id },
      data: {
        clientId: dto.clientId,
        totalValue: dto.totalValue,
        notes: dto.notes ?? null,
      },
      select: negotiationSelect,
    });

    return this.toResponse(negotiation);
  }

  async updatePartial(id: number, dto: UpdateNegotiationDto) {
    if (!dto || Object.keys(dto).length === 0) {
      throw new BadRequestException('PATCH requer ao menos um campo');
    }

    const current = await this.ensureExists(id);
    this.ensureOpen(current);
    if (dto.clientId && dto.clientId !== current.clientId) {
      await this.ensureClientEditable(dto.clientId);
    }

    const negotiation = await this.prisma.negotiation.update({
      where: { id },
      data: dto,
      select: negotiationSelect,
    });

    return this.toResponse(negotiation);
  }

  async remove(id: number) {
    const negotiation = await this.ensureExists(id);
    const result = this.toResponse(negotiation);
    const deletedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.order.updateMany({
        where: { ...NOT_DELETED, negotiationId: id },
        data: { deletedAt },
      });
      await tx.negotiation.update({ where: { id }, data: { deletedAt } });
    });

    return result;
  }

  async cancel(id: number) {
    const negotiation = await this.ensureExists(id);
    this.assertTransition(negotiation.status, 'PERDIDA');

    const updated = await this.prisma.negotiation.update({
      where: { id },
      data: { status: 'PERDIDA', closedAt: new Date() },
      select: negotiationSelect,
    });

    return this.toResponse(updated);
  }

  // userId: autor da baixa de venda gravada na transação de conversão (ticket
  // 11 da spec 010). Ainda não usado aqui — este ticket só faz o dado chegar.
  async convert(id: number, paymentMethod: PaymentMethodEnum, userId: number) {
    void userId;
    const negotiation = await this.ensureExists(id);
    // RN12: converter não passa por `ensureClientEditable` — a anonimização não
    // congela o ciclo. O Cliente vem no próprio select da Negociação.
    const client = negotiation.client;
    this.assertTransition(negotiation.status, 'GANHA');

    const closedAt = new Date();
    // D2/RN1: o Pedido nasce EM_NEGOCIACAO ("Aguardando Pagamento"). O faturamento
    // do Cliente só sobe quando alguém aprova a compra (RN6) — converter deixa de
    // faturar na hora. statusChangedAt marca a entrada na situação (RN13).
    const statusChangedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      // upsert, e nao create: reabrir preserva o pedido como DESISTENCIA, entao
      // reconverter reaproveita a mesma linha em vez de colidir com o @unique
      // (RN4), devolvendo-a para EM_NEGOCIACAO.
      await tx.order.upsert({
        where: { negotiationId: id },
        create: {
          negotiationId: id,
          code: `PED-${id}`,
          status: 'EM_NEGOCIACAO',
          paymentMethod,
          totalValue: negotiation.totalValue,
          statusChangedAt,
        },
        update: {
          status: 'EM_NEGOCIACAO',
          paymentMethod,
          totalValue: negotiation.totalValue,
          statusChangedAt,
          deletedAt: null,
        },
      });

      await tx.negotiation.update({
        where: { id },
        data: { status: 'GANHA', closedAt },
      });

      // Invariante do dominio: cliente com faturamento e, por definicao, ATIVO.
      if (client.status !== 'ATIVO') {
        await tx.client.update({
          where: { id: client.id },
          data: { status: 'ATIVO' },
        });
      }
    });

    return this.findOne(id);
  }

  // userId: autor da devolução de venda gravada na transação de reabertura
  // (ticket 14 da spec 010). Ainda não usado aqui — este ticket só faz o dado
  // chegar.
  async reopen(id: number, actorRole: RoleEnum, userId: number) {
    void userId;
    const negotiation = await this.ensureExists(id);
    this.assertTransition(negotiation.status, 'ABERTA');

    const wasWon = negotiation.status === 'GANHA';

    // RN11/D10: reabrir tira do faturamento uma venda já paga. Com o Pedido em
    // COMPRA_APROVADA isso é exclusivo do ADMIN — o VENDEDOR só reabre enquanto
    // o Pedido está EM_NEGOCIACAO. A máquina de estados não muda: só quem dispara.
    if (
      negotiation.order?.status === 'COMPRA_APROVADA' &&
      actorRole !== RoleEnum.ADMIN
    ) {
      throw new ForbiddenException(
        'Venda com pagamento confirmado só pode ser reaberta por um administrador',
      );
    }

    await this.prisma.$transaction(async (tx) => {
      if (wasWon) {
        // RN3: reabrir desfaz o Pedido a partir de EM_NEGOCIACAO ou de
        // COMPRA_APROVADA. Sem filtro de status: os dois viram DESISTENCIA.
        await tx.order.updateMany({
          where: { ...NOT_DELETED, negotiationId: id },
          data: { status: 'DESISTENCIA', statusChangedAt: new Date() },
        });
      }

      await tx.negotiation.update({
        where: { id },
        data: { status: 'ABERTA', closedAt: null },
      });
    });

    return this.findOne(id);
  }
}
