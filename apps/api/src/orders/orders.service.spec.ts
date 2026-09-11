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
  createdAt: new Date('2026-01-01T00:00:00Z'),
  negotiation: {
    id: 3,
    notes: null,
    client: { id: 'c1', name: 'Fulana', status: 'ATIVO', anonymizedAt: null },
    vendedor: { id: 2, name: 'Vendedora' },
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
