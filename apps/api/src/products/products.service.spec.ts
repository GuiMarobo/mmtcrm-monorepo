import { ConflictException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ProductsService } from './products.service';
import { ProductCategoryEnum } from './dto/create-product.dto';
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
});
