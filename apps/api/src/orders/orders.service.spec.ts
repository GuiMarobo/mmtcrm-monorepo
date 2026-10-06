import { ConflictException, NotFoundException } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { OrdersService } from './orders.service';
import {
  asPrismaService,
  callArg,
  createMockPrisma,
  MockPrisma,
} from '../../test/prisma.mock';

const orderRow = (overrides: Record<string, unknown> = {}) => ({
  id: 7,
  code: 'PED-7',
  status: 'EM_NEGOCIACAO',
  paymentMethod: 'PIX',
  totalValue: { toString: () => '1500.00' },
  statusChangedAt: new Date('2026-01-01T00:00:00Z'),
  negotiation: {
    id: 3,
    notes: null,
    client: { id: 'c1', name: 'Fulana', status: 'ATIVO' },
    vendedor: { id: 2, name: 'Vendedora' },
    items: [],
  },
  ...overrides,
});

describe('OrdersService.markAsPaid', () => {
  let service: OrdersService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createMockPrisma();
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: asPrismaService(prisma) },
      ],
    }).compile();
    service = moduleRef.get(OrdersService);
  });

  it('aplica EM_NEGOCIACAO -> COMPRA_APROVADA e grava statusChangedAt (RN2/RN13)', async () => {
    prisma.order.findFirst.mockResolvedValue(orderRow());
    prisma.order.update.mockResolvedValue(
      orderRow({ status: 'COMPRA_APROVADA' }),
    );

    const before = Date.now();
    const result = await service.markAsPaid(7);
    const after = Date.now();

    expect(prisma.order.update).toHaveBeenCalledTimes(1);
    const arg = callArg<{
      where: { id: number };
      data: { status: string; statusChangedAt: Date };
    }>(prisma.order.update);
    expect(arg.where).toEqual({ id: 7 });
    expect(arg.data.status).toBe('COMPRA_APROVADA');
    expect(arg.data.statusChangedAt.getTime()).toBeGreaterThanOrEqual(before);
    expect(arg.data.statusChangedAt.getTime()).toBeLessThanOrEqual(after);
    expect(result.status).toBe('COMPRA_APROVADA');
    expect(result.totalValue).toBe(1500);
  });

  it('recusa aprovar um pedido fora de EM_NEGOCIACAO com 409 (RN9)', async () => {
    prisma.order.findFirst.mockResolvedValue(
      orderRow({ status: 'COMPRA_APROVADA' }),
    );

    await expect(service.markAsPaid(7)).rejects.toBeInstanceOf(
      ConflictException,
    );
    await expect(service.markAsPaid(7)).rejects.toThrow(
      'Só é possível aprovar um pedido aguardando pagamento',
    );
    expect(prisma.order.update).not.toHaveBeenCalled();
  });

  it('404 quando o pedido não existe ou está excluído logicamente', async () => {
    prisma.order.findFirst.mockResolvedValue(null);

    await expect(service.markAsPaid(99)).rejects.toBeInstanceOf(
      NotFoundException,
    );
    await expect(service.markAsPaid(99)).rejects.toThrow(
      'Pedido não encontrado',
    );
  });

  it('só consulta pedidos não excluídos (deletedAt: null)', async () => {
    prisma.order.findFirst.mockResolvedValue(orderRow());
    prisma.order.update.mockResolvedValue(
      orderRow({ status: 'COMPRA_APROVADA' }),
    );

    await service.markAsPaid(7);

    const { where } = callArg<{ where: Record<string, unknown> }>(
      prisma.order.findFirst,
    );
    expect(where).toMatchObject({ deletedAt: null, id: 7 });
  });

  it('não checa anonimização do Cliente — aprova Cliente anonimizado (RN12)', async () => {
    prisma.order.findFirst.mockResolvedValue(
      orderRow({
        negotiation: {
          id: 3,
          notes: null,
          client: {
            id: 'c1',
            name: 'Titular removido',
            status: 'ATIVO',
            anonymizedAt: new Date('2026-02-01T00:00:00Z'),
          },
          vendedor: { id: 2, name: 'Vendedora' },
        },
      }),
    );
    prisma.order.update.mockResolvedValue(
      orderRow({ status: 'COMPRA_APROVADA' }),
    );

    await expect(service.markAsPaid(7)).resolves.toMatchObject({
      status: 'COMPRA_APROVADA',
    });
    expect(prisma.client.findFirst).not.toHaveBeenCalled();
    expect(prisma.client.findUnique).not.toHaveBeenCalled();
  });
});

describe('OrdersService leitura', () => {
  let service: OrdersService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createMockPrisma();
    const moduleRef = await Test.createTestingModule({
      providers: [
        OrdersService,
        { provide: PrismaService, useValue: asPrismaService(prisma) },
      ],
    }).compile();
    service = moduleRef.get(OrdersService);
  });

  describe('findAll', () => {
    it('só lista Pedidos não excluídos (RN5) e não filtra por Vendedor (RN14)', async () => {
      prisma.order.findMany.mockResolvedValue([orderRow()]);

      await service.findAll();

      const arg = callArg<{ where: Record<string, unknown> }>(
        prisma.order.findMany,
      );
      expect(arg.where).toEqual({ deletedAt: null });
    });

    it('ordena pela fila de cobrança: EM_NEGOCIACAO primeiro, mais antigo primeiro (RN14/D13)', async () => {
      prisma.order.findMany.mockResolvedValue([
        orderRow({
          id: 1,
          status: 'COMPRA_APROVADA',
          statusChangedAt: new Date('2026-01-01T00:00:00Z'),
        }),
        orderRow({
          id: 2,
          status: 'EM_NEGOCIACAO',
          statusChangedAt: new Date('2026-03-01T00:00:00Z'),
        }),
        orderRow({
          id: 3,
          status: 'EM_NEGOCIACAO',
          statusChangedAt: new Date('2026-02-01T00:00:00Z'),
        }),
        orderRow({
          id: 4,
          status: 'DESISTENCIA',
          statusChangedAt: new Date('2026-01-15T00:00:00Z'),
        }),
      ]);

      const result = await service.findAll();

      expect(result.map((o) => o.id)).toEqual([3, 2, 1, 4]);
    });

    it('converte o Decimal do valor para number', async () => {
      prisma.order.findMany.mockResolvedValue([orderRow()]);

      const [first] = await service.findAll();

      expect(first.totalValue).toBe(1500);
      expect(first.client).toEqual({
        id: 'c1',
        name: 'Fulana',
        status: 'ATIVO',
      });
    });
  });

  describe('findOne', () => {
    it('devolve o Pedido com Cliente e Negociação de origem', async () => {
      prisma.order.findFirst.mockResolvedValue(orderRow());

      const result = await service.findOne(7);

      expect(result).toMatchObject({
        id: 7,
        code: 'PED-7',
        negotiationId: 3,
        client: { id: 'c1', name: 'Fulana' },
        vendedor: { id: 2, name: 'Vendedora' },
      });
    });

    it('inclui os itens da Negociação de origem, no shape do detalhe da Negociação (RB7)', async () => {
      prisma.order.findFirst.mockResolvedValue(
        orderRow({
          negotiation: {
            ...orderRow().negotiation,
            items: [
              {
                id: 11,
                quantity: 3,
                unitPrice: { toString: () => '100.00' },
                discountType: 'PERCENTUAL',
                discountValue: { toString: () => '10' },
                product: {
                  id: 'p1',
                  name: 'Painel',
                  sku: 'PNL-1',
                  status: 'ATIVO',
                  deletedAt: null,
                },
              },
              {
                id: 12,
                quantity: 2,
                unitPrice: { toString: () => '50.00' },
                discountType: 'VALOR',
                discountValue: { toString: () => '0' },
                product: {
                  id: 'p2',
                  name: 'Cabo',
                  sku: 'CAB-2',
                  status: 'DESCONTINUADO',
                  deletedAt: new Date('2026-03-01T00:00:00Z'),
                },
              },
            ],
          },
        }),
      );

      const result = await service.findOne(7);

      expect(result.items).toEqual([
        {
          id: 11,
          product: {
            id: 'p1',
            name: 'Painel',
            sku: 'PNL-1',
            status: 'ATIVO',
            deleted: false,
          },
          quantity: 3,
          unitPrice: 100,
          discountType: 'PERCENTUAL',
          discountValue: 10,
          discountAmount: 30,
          subtotal: 270,
        },
        {
          id: 12,
          product: {
            id: 'p2',
            name: 'Cabo',
            sku: 'CAB-2',
            status: 'DESCONTINUADO',
            deleted: true,
          },
          quantity: 2,
          unitPrice: 50,
          discountType: 'VALOR',
          discountValue: 0,
          discountAmount: 0,
          subtotal: 100,
        },
      ]);
      expect(result).not.toHaveProperty('negotiation');
    });

    it('lê os itens não excluídos da Negociação, em ordem de inclusão', async () => {
      prisma.order.findFirst.mockResolvedValue(orderRow());

      await service.findOne(7);

      const { select } = callArg<{
        select: {
          negotiation: {
            select: { items: { where: unknown; orderBy: unknown } };
          };
        };
      }>(prisma.order.findFirst);
      expect(select.negotiation.select.items.where).toEqual({
        deletedAt: null,
      });
      expect(select.negotiation.select.items.orderBy).toEqual({ id: 'asc' });
    });

    it('Negociação sem itens (antiga ou importada) devolve lista vazia', async () => {
      prisma.order.findFirst.mockResolvedValue(orderRow());

      const result = await service.findOne(7);

      expect(result.items).toEqual([]);
    });

    it('404 quando inexistente ou excluído', async () => {
      prisma.order.findFirst.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.findOne(99)).rejects.toThrow(
        'Pedido não encontrado',
      );
    });
  });
});
