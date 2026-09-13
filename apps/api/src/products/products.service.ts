import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { NOT_DELETED, PrismaService } from '../prisma/prisma.service';
import { CreateProductDto, MAX_PRICE } from './dto/create-product.dto';
import {
  CreateStockMovementDto,
  MAX_STOCK_QUANTITY,
  StockMovementTypeEnum,
} from './dto/create-stock-movement.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { UpdateProductPriceDto } from './dto/update-product-price.dto';

const productSelect = {
  id: true,
  name: true,
  sku: true,
  description: true,
  category: true,
  price: true,
  stock: true,
  status: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.ProductSelect;

type ProductRow = Prisma.ProductGetPayload<{ select: typeof productSelect }>;

// UC6 §2.3: o detalhe carrega o histórico que explica o saldo — do mais recente
// para o mais antigo, já com o autor de cada movimento. RP9: o filtro de
// excluídos vale também para os movimentos, por associação ao Produto.
const productDetailSelect = {
  ...productSelect,
  stockMovements: {
    where: NOT_DELETED,
    select: {
      id: true,
      type: true,
      quantity: true,
      note: true,
      createdAt: true,
      // SetNull no schema: o autor excluído deixa o movimento com user nulo, e
      // o histórico continua de pé.
      user: { select: { id: true, name: true } },
    },
    orderBy: { createdAt: 'desc' },
  },
} satisfies Prisma.ProductSelect;

type ProductDetailRow = Prisma.ProductGetPayload<{
  select: typeof productDetailSelect;
}>;

// RP2: o código de referência é comparado e gravado sem espaços nas pontas e em
// maiúsculas, para que "ip15p " e "IP15P" nunca virem dois cadastros.
export const normalizeSku = (sku: string) => sku.trim().toUpperCase();

const INITIAL_LOAD_NOTE = 'Carga inicial de estoque';

const SKU_TAKEN = 'Já existe um produto com este código de referência';

const NOT_FOUND = 'Produto não encontrado';

const INVALID_QUANTITY =
  'A quantidade deve ser um número inteiro maior que zero';

const INVALID_PRICE =
  'O preço de venda deve ser um valor maior ou igual a zero';

const insufficientStock = (stock: number) =>
  `Saldo insuficiente: há ${stock} unidade(s) disponível(is)`;

// P2002 = violação de índice único. Só o índice parcial de sku
// (products_sku_unique_active) pode disparar isso aqui, e ele é a rede que pega
// duas requisições simultâneas com o mesmo código: sem isto, a segunda viraria
// 500 em vez do 409 amigável que a checagem prévia entrega no caso comum.
const isSkuConflict = (err: unknown) =>
  err instanceof Prisma.PrismaClientKnownRequestError && err.code === 'P2002';

@Injectable()
export class ProductsService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(product: ProductRow) {
    return { ...product, price: Number(product.price) };
  }

  private toDetailResponse(product: ProductDetailRow) {
    const { stockMovements, ...rest } = product;
    return { ...this.toResponse(rest), stockMovements };
  }

  // RP1/RP2: recusa o sku duplicado antes de abrir a transação e, quando a
  // quantidade inicial é maior que zero, grava o Produto e o movimento de
  // Entrada juntos — o saldo nunca existe sem a linha de histórico que o
  // explica (ADR 0013).
  async create(dto: CreateProductDto, userId: number) {
    const sku = normalizeSku(dto.sku);

    const existing = await this.prisma.product.findFirst({
      where: { ...NOT_DELETED, sku },
      select: { id: true },
    });
    if (existing) throw new ConflictException(SKU_TAKEN);

    const initialStock = dto.initialStock ?? 0;

    try {
      const product = await this.prisma.$transaction(async (tx) => {
        const created = await tx.product.create({
          data: {
            name: dto.name,
            sku,
            description: dto.description,
            category: dto.category,
            price: dto.price,
            stock: initialStock,
            status: 'ATIVO',
          },
          select: productSelect,
        });

        if (initialStock > 0) {
          await tx.stockMovement.create({
            data: {
              productId: created.id,
              type: 'ENTRADA',
              quantity: initialStock,
              note: INITIAL_LOAD_NOTE,
              userId,
            },
          });
        }

        return created;
      });

      return this.toResponse(product);
    } catch (err) {
      if (isSkuConflict(err)) throw new ConflictException(SKU_TAKEN);
      throw err;
    }
  }

  // RP9: só os não excluídos, do mais recente para o mais antigo.
  async findAll() {
    const products = await this.prisma.product.findMany({
      where: { ...NOT_DELETED },
      select: productSelect,
      orderBy: { createdAt: 'desc' },
    });

    return products.map((product) => this.toResponse(product));
  }

  // UC6 §2.3: detalhe do Produto com o histórico de movimentações. RP8: um
  // Produto excluído logicamente é 404, como se nunca tivesse existido.
  // O histórico só é carregado aqui: as escritas conferem a existência por um
  // select enxuto, sem arrastar a lista de movimentos.
  async findOne(id: string) {
    const product = await this.prisma.product.findFirst({
      where: { ...NOT_DELETED, id },
      select: productDetailSelect,
    });
    if (!product) throw new NotFoundException(NOT_FOUND);

    return this.toDetailResponse(product);
  }

  // RP5 / ADR 0013: o único caminho de escrita do saldo. O movimento e o saldo
  // mudam na mesma transação. A Saída só decrementa onde stock >= quantidade,
  // numa única escrita condicional — duas saídas simultâneas não conseguem
  // passar ambas por uma checagem lida antes. Nenhuma linha afetada significa
  // Produto inexistente/excluído (404) ou saldo insuficiente (409); o throw
  // desfaz a transação, então nada é gravado.
  async moveStock(id: string, dto: CreateStockMovementDto, userId: number) {
    // O DTO já barra isto na borda HTTP; repetido aqui porque o service é o
    // guardião da invariante "saldo nunca negativo", seja quem for o chamador.
    if (
      !Number.isInteger(dto.quantity) ||
      dto.quantity <= 0 ||
      dto.quantity > MAX_STOCK_QUANTITY
    ) {
      throw new BadRequestException(INVALID_QUANTITY);
    }

    const isOut = dto.type === StockMovementTypeEnum.SAIDA;

    await this.prisma.$transaction(async (tx) => {
      const { count } = await tx.product.updateMany({
        where: {
          ...NOT_DELETED,
          id,
          ...(isOut && { stock: { gte: dto.quantity } }),
        },
        data: {
          stock: isOut
            ? { decrement: dto.quantity }
            : { increment: dto.quantity },
        },
      });

      if (count === 0) {
        const product = await tx.product.findFirst({
          where: { ...NOT_DELETED, id },
          select: { stock: true },
        });
        if (!product) throw new NotFoundException(NOT_FOUND);
        throw new ConflictException(insufficientStock(product.stock));
      }

      await tx.stockMovement.create({
        data: {
          productId: id,
          type: dto.type,
          quantity: dto.quantity,
          note: dto.note,
          userId,
        },
      });
    });

    return this.findOne(id);
  }

  // RP3: editar mexe só nos dados cadastrais. O `data` é montado campo a campo
  // — nunca um spread do DTO — para que preço e saldo fiquem fora mesmo que o
  // chamador não passe pelo whitelist do ValidationPipe. RP2: trocar o código
  // de referência reaplica a unicidade normalizada, sem contar o próprio
  // Produto.
  async update(id: string, dto: UpdateProductDto) {
    const sku = dto.sku === undefined ? undefined : normalizeSku(dto.sku);

    if (sku !== undefined) {
      const existing = await this.prisma.product.findFirst({
        where: { ...NOT_DELETED, sku, id: { not: id } },
        select: { id: true },
      });
      if (existing) throw new ConflictException(SKU_TAKEN);
    }

    const data = {
      ...(dto.name !== undefined && { name: dto.name }),
      ...(sku !== undefined && { sku }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.category !== undefined && { category: dto.category }),
    } satisfies Prisma.ProductUpdateManyMutationInput;

    try {
      const { count } = await this.prisma.product.updateMany({
        where: { ...NOT_DELETED, id },
        data,
      });
      if (count === 0) throw new NotFoundException(NOT_FOUND);
    } catch (err) {
      if (isSkuConflict(err)) throw new ConflictException(SKU_TAKEN);
      throw err;
    }

    return this.findOne(id);
  }

  // RP4: grava o novo preço e nada mais. Negociações e pedidos já registrados
  // não leem daqui o preço praticado, então não há o que retroagir.
  async updatePrice(id: string, dto: UpdateProductPriceDto) {
    // Mesma defesa em profundidade de moveStock: o DTO já recusa, mas o
    // service é quem garante que nenhum preço negativo chega à coluna.
    if (!Number.isFinite(dto.price) || dto.price < 0 || dto.price > MAX_PRICE) {
      throw new BadRequestException(INVALID_PRICE);
    }

    const { count } = await this.prisma.product.updateMany({
      where: { ...NOT_DELETED, id },
      data: { price: dto.price },
    });
    if (count === 0) throw new NotFoundException(NOT_FOUND);

    return this.findOne(id);
  }
}
