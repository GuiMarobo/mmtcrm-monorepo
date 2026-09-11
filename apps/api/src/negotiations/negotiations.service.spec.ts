import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { NegotiationsService } from './negotiations.service';
import { PaymentMethodEnum } from './dto/create-negotiation.dto';
import {
  asPrismaService,
  callArg,
  createMockPrisma,
  MockPrisma,
} from '../../test/prisma.mock';

const negotiationRow = (overrides: Record<string, unknown> = {}) => ({
  id: 3,
  clientId: 'c1',
  vendedorId: 2,
  status: 'ABERTA',
  totalValue: { toString: () => '1500.00' },
  notes: null,
  closedAt: null,
  createdAt: new Date('2026-01-01T00:00:00Z'),
  updatedAt: new Date('2026-01-01T00:00:00Z'),
  client: { id: 'c1', name: 'Fulana', status: 'LEAD' },
  vendedor: { id: 2, name: 'Vendedora' },
  order: null,
  ...overrides,
});

describe('NegotiationsService', () => {
  let service: NegotiationsService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createMockPrisma();
    const moduleRef = await Test.createTestingModule({
      providers: [
        NegotiationsService,
        { provide: PrismaService, useValue: asPrismaService(prisma) },
      ],
    }).compile();
    service = moduleRef.get(NegotiationsService);
  });

  describe('convert', () => {
    beforeEach(() => {
      prisma.client.findFirst.mockResolvedValue({
        id: 'c1',
        status: 'LEAD',
        anonymizedAt: null,
      });
      prisma.order.upsert.mockResolvedValue({});
      prisma.negotiation.update.mockResolvedValue({});
      prisma.client.update.mockResolvedValue({});
    });

    it('cria o Pedido como EM_NEGOCIACAO e grava statusChangedAt (D2/RN1/RN13)', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(negotiationRow());

      const before = Date.now();
      await service.convert(3, PaymentMethodEnum.PIX);
      const after = Date.now();

      const arg = callArg<{
        where: { negotiationId: number };
        create: { status: string; statusChangedAt: Date };
        update: { status: string; statusChangedAt: Date; deletedAt: null };
      }>(prisma.order.upsert);
      expect(arg.where).toEqual({ negotiationId: 3 });
      expect(arg.create.status).toBe('EM_NEGOCIACAO');
      expect(arg.update.status).toBe('EM_NEGOCIACAO');
      expect(arg.update.deletedAt).toBeNull();
      expect(arg.create.statusChangedAt.getTime()).toBeGreaterThanOrEqual(
        before,
      );
      expect(arg.create.statusChangedAt.getTime()).toBeLessThanOrEqual(after);
      expect(arg.update.statusChangedAt.getTime()).toBeGreaterThanOrEqual(
        before,
      );
    });

    it('ativa o Cliente na conversão mesmo com o Pedido ainda EM_NEGOCIACAO (RN7)', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(negotiationRow());

      await service.convert(3, PaymentMethodEnum.PIX);

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { status: 'ATIVO' },
      });
    });
  });

  describe('reopen', () => {
    beforeEach(() => {
      prisma.client.findFirst.mockResolvedValue({
        id: 'c1',
        status: 'ATIVO',
        anonymizedAt: null,
      });
      prisma.negotiation.update.mockResolvedValue({});
      prisma.order.updateMany.mockResolvedValue({});
    });

    it('vindo de GANHA, marca o Pedido como DESISTENCIA e grava statusChangedAt (RN3/RN13)', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(
        negotiationRow({ status: 'GANHA' }),
      );

      const before = Date.now();
      await service.reopen(3);
      const after = Date.now();

      const arg = callArg<{
        where: Record<string, unknown>;
        data: { status: string; statusChangedAt: Date };
      }>(prisma.order.updateMany);
      expect(arg.where).toMatchObject({ deletedAt: null, negotiationId: 3 });
      expect(arg.data.status).toBe('DESISTENCIA');
      expect(arg.data.statusChangedAt.getTime()).toBeGreaterThanOrEqual(before);
      expect(arg.data.statusChangedAt.getTime()).toBeLessThanOrEqual(after);
    });

    it('vindo de PERDIDA não toca em nenhum Pedido', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(
        negotiationRow({ status: 'PERDIDA' }),
      );

      await service.reopen(3);

      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });
  });
});
