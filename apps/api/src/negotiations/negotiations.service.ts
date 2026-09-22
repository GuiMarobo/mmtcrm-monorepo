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
  // RI8/RI9: conta também os itens excluídos — só quem nunca teve item
  // ainda guarda o valor informado; já tendo tido, ele não volta.
  _count: { select: { items: true } },
} satisfies Prisma.NegotiationSelect;

type NegotiationDetailRow = Prisma.NegotiationGetPayload<{
  select: typeof negotiationDetailSelect;
}>;

type ItemProduct = { name: string; sku: string; deletedAt: Date | null };

const productLabel = (product: Pick<ItemProduct, 'name' | 'sku'>) =>
  `Produto ${product.name} (${product.sku})`;

// RI5: quantidade é inteiro >= 1. O teto técnico da coluna fica no DTO.
const isValidQuantity = (quantity: number) =>
  Number.isInteger(quantity) && quantity >= 1;

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
    const { items, _count, ...rest } = negotiation;
    const response = this.toResponse(rest);
    // Antiga ou importada: a tela mostra o valor informado só para leitura e
    // avisa que o primeiro item o substitui. Com R$ 0,00 (Negociação nova
    // criada vazia) não há o que preservar.
    const informedValue =
      _count.items === 0 && response.totalValue > 0
        ? response.totalValue
        : null;
    return {
      ...response,
      informedValue,
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

  // Só o caminho de recusa lê o Produto sem filtro: a mensagem nomeia o
  // Produto e diz o motivo, mesmo que ele esteja descontinuado ou excluído.
  private findItemProduct(tx: Prisma.TransactionClient, productId: string) {
    return tx.product.findFirst({
      where: { id: productId },
      select: { name: true, sku: true, deletedAt: true },
    });
  }

  private async rejectItem(
    tx: Prisma.TransactionClient,
    productId: string,
    reason: (product: ItemProduct) => string,
  ): Promise<never> {
    const product = await this.findItemProduct(tx, productId);
    throw new BadRequestException(
      product
        ? reason(product)
        : `O Produto ${productId} não existe no catálogo`,
    );
  }

  // RI3/RI5: um Produto não aparece duas vezes no mesmo envio e toda
  // quantidade é inteiro >= 1 — vale para itens novos e já gravados.
  private async assertValidItems(
    tx: Prisma.TransactionClient,
    items: CreateNegotiationItemDto[],
  ) {
    const seen = new Set<string>();
    for (const item of items) {
      if (seen.has(item.productId)) {
        await this.rejectItem(
          tx,
          item.productId,
          (product) =>
            `O ${productLabel(product)} aparece mais de uma vez — aumente a quantidade em vez de repetir o Produto`,
        );
      }
      seen.add(item.productId);
    }

    const invalid = items.find((item) => !isValidQuantity(item.quantity));
    if (invalid) {
      await this.rejectItem(
        tx,
        invalid.productId,
        (product) =>
          `Quantidade inválida para o ${productLabel(product)}: informe um número inteiro maior ou igual a 1`,
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
    if (items.length === 0) return [];

    const products = await tx.product.findMany({
      where: {
        ...NOT_DELETED,
        id: { in: items.map((item) => item.productId) },
        status: 'ATIVO',
      },
      select: { id: true, price: true },
    });
    const productById = new Map(products.map((p) => [p.id, p]));

    // RI2: explica por que o Produto ficou fora da consulta acima.
    const unavailable = items.find((item) => !productById.has(item.productId));
    if (unavailable) {
      await this.rejectItem(
        tx,
        unavailable.productId,
        (product) =>
          `O ${productLabel(product)} ${product.deletedAt ? 'foi excluído do catálogo' : 'está descontinuado'} e não pode ser adicionado`,
      );
    }

    return items.map((item) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: productById.get(item.productId)!.price,
    }));
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

  // RI3/RI4/RI9/RI10: compara a lista recebida com os itens não excluídos já
  // gravados, por Produto. Novo copia o preço na hora; mesma quantidade não é
  // regravado (preço preservado); quantidade alterada só atualiza a
  // quantidade; o que saiu da lista é excluído logicamente. Devolve o novo
  // totalValue quando há algo a recalcular, ou undefined quando a Negociação
  // nunca teve itens e continua sem eles (RI8: o valor informado fica como
  // está).
  private async syncItems(
    tx: Prisma.TransactionClient,
    negotiationId: number,
    items: CreateNegotiationItemDto[],
  ): Promise<number | undefined> {
    await this.assertValidItems(tx, items);

    const current = await tx.negotiationItem.findMany({
      where: { negotiationId, ...NOT_DELETED },
      select: { id: true, productId: true, quantity: true, unitPrice: true },
    });
    const currentByProduct = new Map(current.map((i) => [i.productId, i]));
    const incomingProductIds = new Set(items.map((item) => item.productId));

    const toCreateDtos = items.filter(
      (item) => !currentByProduct.has(item.productId),
    );
    const created = await this.buildItemsData(tx, toCreateDtos);

    const kept = items.filter((item) => currentByProduct.has(item.productId));
    for (const item of kept) {
      const existing = currentByProduct.get(item.productId)!;
      if (existing.quantity !== item.quantity) {
        await tx.negotiationItem.update({
          where: { id: existing.id },
          data: { quantity: item.quantity },
        });
      }
    }

    const removed = current.filter(
      (item) => !incomingProductIds.has(item.productId),
    );
    if (removed.length > 0) {
      await tx.negotiationItem.updateMany({
        where: { id: { in: removed.map((item) => item.id) } },
        data: { deletedAt: new Date() },
      });
    }

    if (created.length > 0) {
      await tx.negotiationItem.createMany({
        data: created.map((item) => ({ ...item, negotiationId })),
      });
    }

    const hadItemsBefore = current.length > 0;
    const finalCount = kept.length + created.length;
    if (finalCount === 0 && !hadItemsBefore) return undefined;

    const finalItems = [
      ...kept.map((item) => ({
        quantity: item.quantity,
        unitPrice: currentByProduct.get(item.productId)!.unitPrice,
      })),
      ...created,
    ];
    return this.sumSubtotals(finalItems);
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
      await this.assertValidItems(tx, dto.items);
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

  // RI7: o total é recalculado e gravado na mesma transação da escrita dos
  // itens — nunca em dois passos separados.
  async replace(id: number, dto: ReplaceNegotiationDto) {
    const current = await this.ensureExists(id);
    this.ensureOpen(current);
    if (dto.clientId !== current.clientId) {
      await this.ensureClientEditable(dto.clientId);
    }

    const negotiation = await this.prisma.$transaction(async (tx) => {
      const totalValue = await this.syncItems(tx, id, dto.items);
      return tx.negotiation.update({
        where: { id },
        data: {
          clientId: dto.clientId,
          notes: dto.notes ?? null,
          ...(totalValue !== undefined ? { totalValue } : {}),
        },
        select: negotiationSelect,
      });
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
