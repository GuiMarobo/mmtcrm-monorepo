import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { ErasureService } from './erasure.service';
import {
  asPrismaService,
  callArg,
  createMockPrisma,
  MockPrisma,
} from '../../test/prisma.mock';

describe('ErasureService.eraseClient', () => {
  let service: ErasureService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createMockPrisma();
    const moduleRef = await Test.createTestingModule({
      providers: [
        ErasureService,
        { provide: PrismaService, useValue: asPrismaService(prisma) },
      ],
    }).compile();
    service = moduleRef.get(ErasureService);
    prisma.client.findUnique.mockResolvedValue({
      id: 'c1',
      anonymizedAt: null,
    });
    prisma.dataErasureLog.create.mockResolvedValue({});
  });

  it('sem histórico: elimina de fato o Cliente (ADR 0009)', async () => {
    prisma.negotiation.count.mockResolvedValue(0);
    prisma.client.delete.mockResolvedValue({});

    const result = await service.eraseClient('c1', 1);

    expect(result.action).toBe('ELIMINADO');
    expect(prisma.client.delete).toHaveBeenCalledWith({ where: { id: 'c1' } });
    expect(prisma.client.update).not.toHaveBeenCalled();
  });

  it('com histórico: anonimiza e zera as notes de Negociações e Pedidos do titular, inclusive excluídos (RN12)', async () => {
    prisma.negotiation.count.mockResolvedValue(2);
    prisma.client.update.mockResolvedValue({});
    prisma.negotiation.findMany.mockResolvedValue([{ id: 3 }, { id: 4 }]);
    prisma.negotiation.updateMany.mockResolvedValue({ count: 2 });
    prisma.order.updateMany.mockResolvedValue({ count: 1 });

    const result = await service.eraseClient('c1', 1);

    expect(result.action).toBe('ANONIMIZADO');

    const negWhere = callArg<{
      where: Record<string, unknown>;
      data: Record<string, unknown>;
    }>(prisma.negotiation.updateMany);
    expect(negWhere.where).toEqual({ clientId: 'c1' });
    expect(negWhere.data).toEqual({ notes: null });

    const orderCall = callArg<{
      where: { negotiationId: { in: number[] } };
      data: Record<string, unknown>;
    }>(prisma.order.updateMany);
    expect(orderCall.where.negotiationId.in).toEqual([3, 4]);
    expect(orderCall.data).toEqual({ notes: null });
  });

  it('zera as notes na mesma transação da anonimização', async () => {
    prisma.negotiation.count.mockResolvedValue(1);
    prisma.client.update.mockResolvedValue({});
    prisma.negotiation.findMany.mockResolvedValue([{ id: 3 }]);
    prisma.negotiation.updateMany.mockResolvedValue({ count: 1 });
    prisma.order.updateMany.mockResolvedValue({ count: 1 });

    await service.eraseClient('c1', 1);

    expect(prisma.$transaction).toHaveBeenCalledTimes(1);
  });
});
