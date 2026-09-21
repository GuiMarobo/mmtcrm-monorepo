import {
  BadRequestException,
  ConflictException,
  NotFoundException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';
import { MAX_PRICE, ProductCategoryEnum } from './dto/create-product.dto';
import { UpdateProductDto } from './dto/update-product.dto';
import { StockMovementTypeEnum } from './dto/create-stock-movement.dto';
import {
  asPrismaService,
  callArg,
  createMockPrisma,
  MockPrisma,
} from '../../test/prisma.mock';

const productRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'p1',
  name: 'iPhone 15 Pro',
  sku: 'IP15P-256',
  description: null,
  category: 'IPHONE',
  price: { toString: () => '7999.00' },
  stock: 0,
  status: 'ATIVO',
  createdAt: new Date('2026-09-11T00:00:00Z'),
  updatedAt: new Date('2026-09-11T00:00:00Z'),
  ...overrides,
});

const movementRow = (overrides: Record<string, unknown> = {}) => ({
  id: 'm1',
  type: 'ENTRADA',
  quantity: 10,
  note: 'Carga inicial de estoque',
  createdAt: new Date('2026-09-11T00:00:00Z'),
  user: { id: 42, name: 'Admin' },
  ...overrides,
});

const validDto = (overrides: Record<string, unknown> = {}) => ({
  name: 'iPhone 15 Pro',
  sku: 'IP15P-256',
  category: ProductCategoryEnum.IPHONE,
  price: 7999,
  initialStock: 0,
  ...overrides,
});

describe('ProductsService', () => {
  let service: ProductsService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createMockPrisma();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ProductsService,
        { provide: PrismaService, useValue: asPrismaService(prisma) },
      ],
    }).compile();
    service = moduleRef.get(ProductsService);
  });

  describe('create — normalização e unicidade de sku (RP2)', () => {
    it('grava o sku normalizado: sem espaços nas pontas e em maiúsculas', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue(productRow());

      await service.create(validDto({ sku: '  ip15p-256  ' }), 1);

      const arg = callArg<{ data: { sku: string } }>(prisma.product.create);
      expect(arg.data.sku).toBe('IP15P-256');
    });

    it('compara a duplicidade pelo sku normalizado, não pelo texto cru', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue(productRow());

      await service.create(validDto({ sku: ' ip15p-256 ' }), 1);

      const arg = callArg<{ where: { sku: string; deletedAt: null } }>(
        prisma.product.findFirst,
      );
      expect(arg.where.sku).toBe('IP15P-256');
      expect(arg.where.deletedAt).toBeNull();
    });

    it('traduz a colisão do índice único (P2002) para o mesmo 409 amigável', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      prisma.product.create.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(service.create(validDto(), 1)).rejects.toBeInstanceOf(
        ConflictException,
      );
      await expect(service.create(validDto(), 1)).rejects.toThrow(
        'Já existe um produto com este código de referência',
      );
    });

    it('recusa sku já usado com 409 e não grava nada', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'outro' });

      await expect(service.create(validDto(), 1)).rejects.toBeInstanceOf(
        ConflictException,
      );
      await expect(service.create(validDto(), 1)).rejects.toThrow(
        'Já existe um produto com este código de referência',
      );
      expect(prisma.product.create).not.toHaveBeenCalled();
      expect(prisma.stockMovement.create).not.toHaveBeenCalled();
    });
  });

  describe('create — carga inicial de estoque (RP1)', () => {
    it('quantidade inicial > 0 grava o produto e o movimento de Entrada na mesma transação', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue(productRow({ stock: 10 }));
      prisma.stockMovement.create.mockResolvedValue({ id: 'm1' });

      const result = await service.create(validDto({ initialStock: 10 }), 42);

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(typeof callArg<unknown>(prisma.$transaction)).toBe('function');

      const productArg = callArg<{ data: { stock: number } }>(
        prisma.product.create,
      );
      expect(productArg.data.stock).toBe(10);

      const movementArg = callArg<{
        data: {
          productId: string;
          type: string;
          quantity: number;
          userId: number;
        };
      }>(prisma.stockMovement.create);
      expect(movementArg.data.productId).toBe('p1');
      expect(movementArg.data.type).toBe('ENTRADA');
      expect(movementArg.data.quantity).toBe(10);
      expect(movementArg.data.userId).toBe(42);

      expect(result.stock).toBe(10);
    });

    it('quantidade inicial zero não grava movimento algum', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue(productRow({ stock: 0 }));

      await service.create(validDto({ initialStock: 0 }), 1);

      expect(prisma.stockMovement.create).not.toHaveBeenCalled();
    });

    it('produto nasce Ativo (RP1)', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue(productRow());

      await service.create(validDto(), 1);

      const arg = callArg<{ data: { status: string } }>(prisma.product.create);
      expect(arg.data.status).toBe('ATIVO');
    });

    it('converte o Decimal do preço para number na borda da resposta', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      prisma.product.create.mockResolvedValue(productRow());

      const result = await service.create(validDto(), 1);

      expect(result.price).toBe(7999);
    });
  });

  describe('findAll — NOT_DELETED (RP9)', () => {
    it('lista só os produtos não excluídos', async () => {
      prisma.product.findMany.mockResolvedValue([productRow()]);

      await service.findAll();

      const arg = callArg<{ where: { deletedAt: null } }>(
        prisma.product.findMany,
      );
      expect(arg.where.deletedAt).toBeNull();
    });

    it('converte o preço de cada linha para number', async () => {
      prisma.product.findMany.mockResolvedValue([
        productRow(),
        productRow({ id: 'p2', price: { toString: () => '199.90' } }),
      ]);

      const result = await service.findAll();

      expect(result.map((p) => p.price)).toEqual([7999, 199.9]);
    });
  });

  describe('findOne — detalhe com histórico de estoque (UC6 §2.3)', () => {
    it('devolve o Produto com os movimentos de estoque associados', async () => {
      prisma.product.findFirst.mockResolvedValue({
        ...productRow({ stock: 10 }),
        stockMovements: [movementRow()],
      });

      const result = await service.findOne('p1');

      expect(result.id).toBe('p1');
      expect(result.stockMovements).toHaveLength(1);
      expect(result.stockMovements[0]).toMatchObject({
        id: 'm1',
        type: 'ENTRADA',
        quantity: 10,
        note: 'Carga inicial de estoque',
        user: { id: 42, name: 'Admin' },
      });
    });

    it('pede os movimentos do mais recente para o mais antigo', async () => {
      prisma.product.findFirst.mockResolvedValue({
        ...productRow(),
        stockMovements: [],
      });

      await service.findOne('p1');

      const arg = callArg<{
        select: {
          stockMovements: { orderBy: { createdAt: string } };
        };
      }>(prisma.product.findFirst);
      expect(arg.select.stockMovements.orderBy).toEqual({ createdAt: 'desc' });
    });

    it('filtra NOT_DELETED no Produto e nos movimentos (RP9)', async () => {
      prisma.product.findFirst.mockResolvedValue({
        ...productRow(),
        stockMovements: [],
      });

      await service.findOne('p1');

      const arg = callArg<{
        where: { id: string; deletedAt: null };
        select: { stockMovements: { where: { deletedAt: null } } };
      }>(prisma.product.findFirst);
      expect(arg.where.id).toBe('p1');
      expect(arg.where.deletedAt).toBeNull();
      expect(arg.select.stockMovements.where.deletedAt).toBeNull();
    });

    it('converte o Decimal do preço para number', async () => {
      prisma.product.findFirst.mockResolvedValue({
        ...productRow(),
        stockMovements: [],
      });

      const result = await service.findOne('p1');

      expect(result.price).toBe(7999);
    });

    it('404 quando o Produto não existe ou foi excluído logicamente (RP8)', async () => {
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(service.findOne('fantasma')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.findOne('fantasma')).rejects.toThrow(
        'Produto não encontrado',
      );
    });

    it('preserva o movimento cujo autor foi excluído (user nulo)', async () => {
      prisma.product.findFirst.mockResolvedValue({
        ...productRow(),
        stockMovements: [movementRow({ user: null })],
      });

      const result = await service.findOne('p1');

      expect(result.stockMovements[0].user).toBeNull();
    });
  });

  describe('moveStock — movimentar estoque (RP5)', () => {
    const detailAfter = (stock: number) => ({
      ...productRow({ stock }),
      stockMovements: [movementRow()],
    });

    it('Entrada soma a quantidade ao saldo e grava o movimento na mesma transação', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 1 });
      prisma.stockMovement.create.mockResolvedValue({ id: 'm2' });
      prisma.product.findFirst.mockResolvedValue(detailAfter(15));

      const result = await service.moveStock(
        'p1',
        { type: StockMovementTypeEnum.ENTRADA, quantity: 5, note: 'Reposição' },
        42,
      );

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      const update = callArg<{
        where: { id: string; deletedAt: null };
        data: { stock: { increment: number } };
      }>(prisma.product.updateMany);
      expect(update.where.id).toBe('p1');
      expect(update.where.deletedAt).toBeNull();
      expect(update.data.stock).toEqual({ increment: 5 });

      const movement = callArg<{
        data: Record<string, unknown>;
      }>(prisma.stockMovement.create);
      expect(movement.data).toMatchObject({
        productId: 'p1',
        type: 'ENTRADA',
        quantity: 5,
        note: 'Reposição',
        userId: 42,
      });

      expect(result.stock).toBe(15);
      expect(result.stockMovements).toHaveLength(1);
    });

    it('Saída subtrai do saldo só se houver saldo suficiente, na mesma escrita', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 1 });
      prisma.stockMovement.create.mockResolvedValue({ id: 'm2' });
      prisma.product.findFirst.mockResolvedValue(detailAfter(7));

      const result = await service.moveStock(
        'p1',
        { type: StockMovementTypeEnum.SAIDA, quantity: 3 },
        42,
      );

      const update = callArg<{
        where: { id: string; stock: { gte: number } };
        data: { stock: { decrement: number } };
      }>(prisma.product.updateMany);
      expect(update.where.stock).toEqual({ gte: 3 });
      expect(update.data.stock).toEqual({ decrement: 3 });

      const movement = callArg<{ data: Record<string, unknown> }>(
        prisma.stockMovement.create,
      );
      expect(movement.data).toMatchObject({ type: 'SAIDA', quantity: 3 });
      expect(result.stock).toBe(7);
    });

    it('recusa Saída maior que o saldo com 409 e não grava o movimento', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 0 });
      prisma.product.findFirst.mockResolvedValue({ id: 'p1', stock: 2 });

      await expect(
        service.moveStock(
          'p1',
          { type: StockMovementTypeEnum.SAIDA, quantity: 3 },
          42,
        ),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.stockMovement.create).not.toHaveBeenCalled();
    });

    it('a mensagem do 409 informa o saldo disponível', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 0 });
      prisma.product.findFirst.mockResolvedValue({ id: 'p1', stock: 2 });

      await expect(
        service.moveStock(
          'p1',
          { type: StockMovementTypeEnum.SAIDA, quantity: 3 },
          42,
        ),
      ).rejects.toThrow('Saldo insuficiente: há 2 unidade(s) disponível(is)');
    });

    it('404 quando o Produto não existe ou foi excluído, sem gravar movimento', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 0 });
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(
        service.moveStock(
          'fantasma',
          { type: StockMovementTypeEnum.ENTRADA, quantity: 1 },
          42,
        ),
      ).rejects.toBeInstanceOf(NotFoundException);
      expect(prisma.stockMovement.create).not.toHaveBeenCalled();
    });

    it.each([0, -4, 2.5, 2_147_483_648])(
      'recusa quantidade %p com 400, sem tocar no banco',
      async (quantity) => {
        await expect(
          service.moveStock(
            'p1',
            { type: StockMovementTypeEnum.ENTRADA, quantity },
            42,
          ),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(prisma.$transaction).not.toHaveBeenCalled();
        expect(prisma.product.updateMany).not.toHaveBeenCalled();
        expect(prisma.stockMovement.create).not.toHaveBeenCalled();
      },
    );
  });

  describe('recordStockMovement — caminho compartilhado (prefactor spec 010)', () => {
    it('grava o movimento e atualiza o saldo recebendo um tx externo, com orderId', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 1 });
      prisma.stockMovement.create.mockResolvedValue({ id: 'm3' });

      await service.recordStockMovement(asPrismaService(prisma), {
        productId: 'p1',
        type: StockMovementTypeEnum.SAIDA,
        quantity: 2,
        orderId: 7,
      });

      const update = callArg<{
        where: { id: string; stock: { gte: number } };
        data: { stock: { decrement: number } };
      }>(prisma.product.updateMany);
      expect(update.where.stock).toEqual({ gte: 2 });
      expect(update.data.stock).toEqual({ decrement: 2 });

      const movement = callArg<{ data: Record<string, unknown> }>(
        prisma.stockMovement.create,
      );
      expect(movement.data).toMatchObject({
        productId: 'p1',
        type: 'SAIDA',
        quantity: 2,
        orderId: 7,
      });
    });

    it('recusa saldo insuficiente sem gravar o movimento, mesmo com tx externo', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 0 });
      prisma.product.findFirst.mockResolvedValue({ id: 'p1', stock: 1 });

      await expect(
        service.recordStockMovement(asPrismaService(prisma), {
          productId: 'p1',
          type: StockMovementTypeEnum.SAIDA,
          quantity: 5,
          orderId: 7,
        }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.stockMovement.create).not.toHaveBeenCalled();
    });
  });

  describe('update — editar dados do Produto (RP3)', () => {
    const detailAfter = (overrides: Record<string, unknown> = {}) => ({
      ...productRow(overrides),
      stockMovements: [],
    });

    it('grava nome, sku normalizado, descrição e categoria', async () => {
      prisma.product.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(
          detailAfter({ name: 'iPhone 15', sku: 'IP15-128' }),
        );
      prisma.product.updateMany.mockResolvedValue({ count: 1 });

      const result = await service.update('p1', {
        name: 'iPhone 15',
        sku: ' ip15-128 ',
        description: 'Azul',
        category: ProductCategoryEnum.IPHONE,
      });

      const arg = callArg<{
        where: { id: string; deletedAt: null };
        data: Record<string, unknown>;
      }>(prisma.product.updateMany);
      expect(arg.where.id).toBe('p1');
      expect(arg.where.deletedAt).toBeNull();
      expect(arg.data).toEqual({
        name: 'iPhone 15',
        sku: 'IP15-128',
        description: 'Azul',
        category: 'IPHONE',
      });
      expect(result.sku).toBe('IP15-128');
    });

    it('ignora price e stock que venham no corpo: editar não toca preço nem saldo', async () => {
      prisma.product.findFirst.mockResolvedValue(detailAfter());
      prisma.product.updateMany.mockResolvedValue({ count: 1 });

      await service.update('p1', {
        name: 'iPhone 15',
        price: 1,
        stock: 999,
        initialStock: 5,
        status: 'INATIVO',
      } as unknown as UpdateProductDto);

      const arg = callArg<{ data: Record<string, unknown> }>(
        prisma.product.updateMany,
      );
      expect(arg.data).not.toHaveProperty('price');
      expect(arg.data).not.toHaveProperty('stock');
      expect(arg.data).not.toHaveProperty('initialStock');
      expect(arg.data).not.toHaveProperty('status');
      expect(prisma.stockMovement.create).not.toHaveBeenCalled();
    });

    it('reaplica a unicidade normalizada do sku, desconsiderando o próprio Produto (RP2)', async () => {
      prisma.product.findFirst
        .mockResolvedValueOnce(null)
        .mockResolvedValueOnce(detailAfter());
      prisma.product.updateMany.mockResolvedValue({ count: 1 });

      await service.update('p1', { sku: ' ip15p-256 ' });

      const arg = callArg<{
        where: { sku: string; id: { not: string }; deletedAt: null };
      }>(prisma.product.findFirst);
      expect(arg.where.sku).toBe('IP15P-256');
      expect(arg.where.id).toEqual({ not: 'p1' });
      expect(arg.where.deletedAt).toBeNull();
    });

    it('recusa sku de outro Produto com 409 e não grava nada', async () => {
      prisma.product.findFirst.mockResolvedValue({ id: 'outro' });

      await expect(service.update('p1', { sku: 'IP15P-256' })).rejects.toThrow(
        'Já existe um produto com este código de referência',
      );
      expect(prisma.product.updateMany).not.toHaveBeenCalled();
    });

    it('traduz a colisão do índice único (P2002) para o mesmo 409 amigável', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      prisma.product.updateMany.mockRejectedValue(
        new Prisma.PrismaClientKnownRequestError('Unique constraint failed', {
          code: 'P2002',
          clientVersion: 'test',
        }),
      );

      await expect(
        service.update('p1', { sku: 'IP15P-256' }),
      ).rejects.toBeInstanceOf(ConflictException);
    });

    it('sem sku no corpo, não consulta duplicidade', async () => {
      prisma.product.findFirst.mockResolvedValue(detailAfter());
      prisma.product.updateMany.mockResolvedValue({ count: 1 });

      await service.update('p1', { name: 'iPhone 15' });

      expect(prisma.product.findFirst).toHaveBeenCalledTimes(1);
      const arg = callArg<{ data: Record<string, unknown> }>(
        prisma.product.updateMany,
      );
      expect(arg.data).toEqual({ name: 'iPhone 15' });
    });

    it('null em campo obrigatório conta como ausente; na descrição, limpa o campo', async () => {
      prisma.product.findFirst.mockResolvedValue(detailAfter());
      prisma.product.updateMany.mockResolvedValue({ count: 1 });

      await service.update('p1', {
        name: null,
        sku: null,
        category: null,
        description: null,
      } as unknown as UpdateProductDto);

      expect(prisma.product.findFirst).toHaveBeenCalledTimes(1);
      const arg = callArg<{ data: Record<string, unknown> }>(
        prisma.product.updateMany,
      );
      expect(arg.data).toEqual({ description: null });
    });

    it('404 quando o Produto não existe ou foi excluído', async () => {
      prisma.product.findFirst.mockResolvedValue(null);
      prisma.product.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.update('fantasma', { name: 'X' }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe('updatePrice — atualizar preço de venda (RP4)', () => {
    it('grava só o novo preço e devolve o detail com o preço em number', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 1 });
      prisma.product.findFirst.mockResolvedValue({
        ...productRow({ price: { toString: () => '8499.90' } }),
        stockMovements: [],
      });

      const result = await service.updatePrice('p1', { price: 8499.9 });

      const arg = callArg<{
        where: { id: string; deletedAt: null };
        data: Record<string, unknown>;
      }>(prisma.product.updateMany);
      expect(arg.where.id).toBe('p1');
      expect(arg.where.deletedAt).toBeNull();
      expect(arg.data).toEqual({ price: 8499.9 });
      expect(result.price).toBe(8499.9);
    });

    it('aceita preço zero', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 1 });
      prisma.product.findFirst.mockResolvedValue({
        ...productRow({ price: { toString: () => '0' } }),
        stockMovements: [],
      });

      await expect(
        service.updatePrice('p1', { price: 0 }),
      ).resolves.toMatchObject({ price: 0 });
    });

    it.each([-0.01, -100, Number.NaN, MAX_PRICE + 1])(
      'recusa preço %p com 400, sem tocar no banco',
      async (price) => {
        await expect(
          service.updatePrice('p1', { price }),
        ).rejects.toBeInstanceOf(BadRequestException);
        expect(prisma.product.updateMany).not.toHaveBeenCalled();
      },
    );

    it('404 quando o Produto não existe ou foi excluído', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 0 });

      await expect(
        service.updatePrice('fantasma', { price: 10 }),
      ).rejects.toBeInstanceOf(NotFoundException);
    });
  });

  describe.each([
    {
      action: 'discontinue' as const,
      rule: 'RP6',
      from: 'ATIVO',
      to: 'INATIVO',
    },
    {
      action: 'reactivate' as const,
      rule: 'RP7',
      from: 'INATIVO',
      to: 'ATIVO',
    },
  ])('$action — troca de situação ($rule)', ({ action, from, to }) => {
    it(`muda a situação de ${from} para ${to} e devolve o detalhe`, async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 1 });
      prisma.product.findFirst.mockResolvedValue({
        ...productRow({ status: to }),
        stockMovements: [],
      });

      const result = await service[action]('p1');

      const arg = callArg<{
        where: Record<string, unknown>;
        data: Record<string, unknown>;
      }>(prisma.product.updateMany);
      expect(arg.where).toEqual({ deletedAt: null, id: 'p1', status: from });
      expect(arg.data).toEqual({ status: to });
      expect(result.status).toBe(to);
    });

    it(`recusa com 409 um Produto que já está ${to}`, async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 0 });
      prisma.product.findFirst.mockResolvedValue({ id: 'p1' });

      await expect(service[action]('p1')).rejects.toBeInstanceOf(
        ConflictException,
      );
    });

    it('404 quando o Produto não existe ou foi excluído', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 0 });
      prisma.product.findFirst.mockResolvedValue(null);

      await expect(service[action]('fantasma')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      const arg = callArg<{ where: Record<string, unknown> }>(
        prisma.product.findFirst,
      );
      expect(arg.where).toMatchObject({ deletedAt: null, id: 'fantasma' });
    });
  });

  describe('remove — exclusão lógica (RP8)', () => {
    it('marca deletedAt no Produto não excluído e nunca apaga a linha', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 1 });

      await service.remove('p1');

      const arg = callArg<{
        where: Record<string, unknown>;
        data: { deletedAt: unknown };
      }>(prisma.product.updateMany);
      expect(arg.where).toEqual({ deletedAt: null, id: 'p1' });
      expect(arg.data.deletedAt).toBeInstanceOf(Date);
      expect(prisma.product.delete).not.toHaveBeenCalled();
      expect(prisma.stockMovement.delete).not.toHaveBeenCalled();
    });

    it('404 quando o Produto não existe ou já foi excluído', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 0 });

      await expect(service.remove('fantasma')).rejects.toBeInstanceOf(
        NotFoundException,
      );
    });

    it('depois de excluído, o detalhe é 404: o NOT_DELETED passa a filtrá-lo', async () => {
      prisma.product.updateMany.mockResolvedValue({ count: 1 });
      await service.remove('p1');

      prisma.product.findFirst.mockResolvedValue(null);

      await expect(service.findOne('p1')).rejects.toBeInstanceOf(
        NotFoundException,
      );
      const arg = callArg<{ where: Record<string, unknown> }>(
        prisma.product.findFirst,
      );
      expect(arg.where).toMatchObject({ deletedAt: null, id: 'p1' });
    });
  });
});
