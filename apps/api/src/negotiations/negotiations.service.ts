import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { RoleEnum } from '../users/dto/create-user.dto';
import { Prisma } from '../../generated/prisma/client';
import { DiscountType, NegotiationStatus } from '../../generated/prisma/enums';
import { NOT_DELETED, PrismaService } from '../prisma/prisma.service';
import { StockMovementTypeEnum } from '../products/dto/create-stock-movement.dto';
import { ProductsService } from '../products/products.service';
import {
  CreateNegotiationDto,
  PaymentMethodEnum,
} from './dto/create-negotiation.dto';
import { CreateNegotiationItemDto } from './dto/create-negotiation-item.dto';
import { UpdateNegotiationDto } from './dto/update-negotiation.dto';
import { ReplaceNegotiationDto } from './dto/replace-negotiation.dto';
import {
  exceedsSellerDiscountLimit,
  ItemPricingInput,
  priceItem,
  SELLER_DISCOUNT_LIMIT_PERCENT,
} from './negotiation-item-pricing';
import {
  fromCents,
  negotiationItemsSelect,
  toItemResponse,
} from './negotiation-item-response';

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
// continua enxuta e não os traz.
const negotiationDetailSelect = {
  ...negotiationSelect,
  items: negotiationItemsSelect,
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

// ADR 0015: item sem desconto é gravado como forma Valor, número zero.
const discountOf = (
  item: CreateNegotiationItemDto,
): { discountType: DiscountType; discountValue: number } => ({
  discountType: item.discountType ?? 'VALOR',
  discountValue: item.discountValue ?? 0,
});

// RI5: percentual entre 0 e 100; desconto em reais >= 0. O teto "nunca maior
// que a linha" depende do preço e é conferido depois de precificar.
const discountRangeError = (item: CreateNegotiationItemDto) => {
  const { discountType, discountValue } = discountOf(item);
  if (discountType === 'PERCENTUAL') {
    return discountValue < 0 || discountValue > 100
      ? 'o percentual deve estar entre 0 e 100'
      : null;
  }
  return discountValue < 0 ? 'o desconto em reais não pode ser negativo' : null;
};

type PricedItem = ItemPricingInput & { productId: string };

// A maquina de estados da spec 001 tem exatamente estas quatro arestas.
// Converter em pedido e o que torna a negociacao GANHA; nao existe "concluir".
const ALLOWED_TRANSITIONS: Record<NegotiationStatus, NegotiationStatus[]> = {
  ABERTA: ['GANHA', 'PERDIDA'],
  GANHA: ['ABERTA'],
  PERDIDA: ['ABERTA'],
};

@Injectable()
export class NegotiationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly products: ProductsService,
  ) {}

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
      items: items.map(toItemResponse),
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
    Exception: new (message: string) => Error = BadRequestException,
  ): Promise<never> {
    const product = await this.findItemProduct(tx, productId);
    throw new Exception(
      product
        ? reason(product)
        : `O Produto ${productId} não existe no catálogo`,
    );
  }

  // RI3/RI5: um Produto não aparece duas vezes no mesmo envio, toda
  // quantidade é inteiro >= 1 e todo desconto está na faixa da sua forma —
  // vale para itens novos e já gravados.
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

    for (const item of items) {
      const error = discountRangeError(item);
      if (error) {
        await this.rejectItem(
          tx,
          item.productId,
          (product) =>
            `Desconto inválido para o ${productLabel(product)}: ${error}`,
        );
      }
    }
  }

  // RI5: o desconto nunca deixa o subtotal negativo. Conferido sobre a lista
  // final já precificada e antes de qualquer escrita, para recusar sem gravar
  // nada — inclusive um item mantido cuja quantidade caiu abaixo de um
  // desconto em R$.
  private async assertDiscountsWithinLine(
    tx: Prisma.TransactionClient,
    items: PricedItem[],
  ) {
    const exceeding = items.find((item) => priceItem(item).subtotalCents < 0);
    if (exceeding) {
      await this.rejectItem(
        tx,
        exceeding.productId,
        (product) =>
          `Desconto inválido para o ${productLabel(product)}: o desconto não pode ser maior que o valor da linha`,
      );
    }
  }

  // RI6: o VENDEDOR não passa de 15% de percentual efetivo nos itens que ele
  // incluiu ou alterou nesta gravação — quem chama passa só esses. Os demais
  // (ex.: 20% dado antes por um ADMIN) não são conferidos, e remover nunca é
  // barrado porque item removido não chega aqui. ADMIN não tem limite.
  private async assertWithinDiscountLimit(
    tx: Prisma.TransactionClient,
    touched: PricedItem[],
    actorRole: RoleEnum,
  ) {
    if (actorRole === RoleEnum.ADMIN) return;
    const exceeding = touched.find(exceedsSellerDiscountLimit);
    if (exceeding) {
      await this.rejectItem(
        tx,
        exceeding.productId,
        (product) =>
          `Desconto acima de ${SELLER_DISCOUNT_LIMIT_PERCENT}% exige administrador: o desconto do ${productLabel(product)} passa de ${SELLER_DISCOUNT_LIMIT_PERCENT}% da linha`,
        ForbiddenException,
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
      ...discountOf(item),
    }));
  }

  // RI7: soma dos subtotais dos itens não excluídos, já com desconto. Soma em
  // centavos (inteiro) para não acumular erro de ponto flutuante entre itens,
  // e só volta a reais no fim.
  private sumSubtotals(items: ItemPricingInput[]) {
    return fromCents(
      items.reduce((total, item) => total + priceItem(item).subtotalCents, 0),
    );
  }

  // RI3/RI4/RI9/RI10: compara a lista recebida com os itens não excluídos já
  // gravados, por Produto. Novo copia o preço na hora; mesma quantidade e
  // mesmo desconto não é regravado (preço preservado); quantidade ou desconto
  // alterado atualiza só esses campos — a forma e o número são regravados como
  // informados, então um % continua % e um R$ continua R$ (ADR 0015); o que
  // saiu da lista é excluído logicamente. Devolve o novo
  // totalValue quando há algo a recalcular, ou undefined quando a Negociação
  // nunca teve itens e continua sem eles (RI8: o valor informado fica como
  // está).
  private async syncItems(
    tx: Prisma.TransactionClient,
    negotiationId: number,
    items: CreateNegotiationItemDto[],
    actorRole: RoleEnum,
  ): Promise<number | undefined> {
    await this.assertValidItems(tx, items);

    const current = await tx.negotiationItem.findMany({
      where: { negotiationId, ...NOT_DELETED },
      select: {
        id: true,
        productId: true,
        quantity: true,
        unitPrice: true,
        discountType: true,
        discountValue: true,
        product: { select: { name: true, sku: true, deletedAt: true } },
      },
    });
    const currentByProduct = new Map(current.map((i) => [i.productId, i]));
    const incomingProductIds = new Set(items.map((item) => item.productId));

    const toCreateDtos = items.filter(
      (item) => !currentByProduct.has(item.productId),
    );
    const created = await this.buildItemsData(tx, toCreateDtos);

    const kept = items.filter((item) => currentByProduct.has(item.productId));
    const changed = kept
      .map((item) => ({
        item,
        existing: currentByProduct.get(item.productId)!,
      }))
      .filter(({ item, existing }) => {
        const discount = discountOf(item);
        return (
          existing.quantity !== item.quantity ||
          existing.discountType !== discount.discountType ||
          Number(existing.discountValue) !== discount.discountValue
        );
      });

    // RI2: item de Produto excluído do catálogo só pode ser mantido como está
    // ou removido. Confere antes de qualquer escrita, para recusar sem gravar
    // nada. Descontinuado não entra aqui: continua alterável.
    const frozen = changed.find(({ existing }) => existing.product.deletedAt);
    if (frozen) {
      throw new BadRequestException(
        `O ${productLabel(frozen.existing.product)} foi excluído do catálogo: o item só pode ser mantido como está ou removido`,
      );
    }

    const priceKept = ({ item, existing }: (typeof changed)[number]) => ({
      productId: item.productId,
      quantity: item.quantity,
      unitPrice: existing.unitPrice,
      ...discountOf(item),
    });
    const finalItems = [
      ...kept.map((item) =>
        priceKept({ item, existing: currentByProduct.get(item.productId)! }),
      ),
      ...created,
    ];
    await this.assertDiscountsWithinLine(tx, finalItems);
    await this.assertWithinDiscountLimit(
      tx,
      [...changed.map(priceKept), ...created],
      actorRole,
    );

    for (const { item, existing } of changed) {
      await tx.negotiationItem.update({
        where: { id: existing.id },
        data: { quantity: item.quantity, ...discountOf(item) },
      });
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
    if (finalItems.length === 0 && !hadItemsBefore) return undefined;

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
  async create(
    dto: CreateNegotiationDto,
    vendedorId: number,
    actorRole: RoleEnum,
  ) {
    await this.ensureClientEditable(dto.clientId);

    const negotiation = await this.prisma.$transaction(async (tx) => {
      await this.assertValidItems(tx, dto.items);
      const itemsData = await this.buildItemsData(tx, dto.items);
      await this.assertDiscountsWithinLine(tx, itemsData);
      await this.assertWithinDiscountLimit(tx, itemsData, actorRole);
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
  async replace(id: number, dto: ReplaceNegotiationDto, actorRole: RoleEnum) {
    const current = await this.ensureExists(id);
    this.ensureOpen(current);
    if (dto.clientId !== current.clientId) {
      await this.ensureClientEditable(dto.clientId);
    }

    const negotiation = await this.prisma.$transaction(async (tx) => {
      const totalValue = await this.syncItems(tx, id, dto.items, actorRole);
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

  async convert(id: number, paymentMethod: PaymentMethodEnum, userId: number) {
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
      const order = await tx.order.upsert({
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
        select: { id: true },
      });

      // RB1 / ADR 0016: baixa de venda — uma Saída por item não excluído,
      // ligada ao Pedido e com o autor da conversão, pelo mesmo caminho do
      // movimento manual (ADR 0013). Negociação sem itens não mexe no estoque.
      const items = await tx.negotiationItem.findMany({
        where: { ...NOT_DELETED, negotiationId: id },
        select: { productId: true, quantity: true },
      });
      for (const item of items) {
        await this.products.recordStockMovement(tx, {
          productId: item.productId,
          type: StockMovementTypeEnum.SAIDA,
          quantity: item.quantity,
          userId,
          orderId: order.id,
        });
      }

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
