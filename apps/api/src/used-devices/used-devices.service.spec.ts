import {
  BadRequestException,
  ConflictException,
  ExecutionContext,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoleEnum } from '../users/dto/create-user.dto';
import { PrismaService } from '../prisma/prisma.service';
import { UsedDevicesController } from './used-devices.controller';
import { UsedDevicesService } from './used-devices.service';
import { CreateUsedDeviceDto } from './dto/create-used-device.dto';
import { UpdateUsedDeviceDto } from './dto/update-used-device.dto';
import {
  DeviceConditionEnum,
  EvaluateUsedDeviceDto,
} from './dto/evaluate-used-device.dto';
import { ListUsedDevicesQueryDto } from './dto/list-used-devices-query.dto';
import { plainToInstance } from 'class-transformer';
import { validate } from 'class-validator';
import {
  asPrismaService,
  callArg,
  createMockPrisma,
  MockPrisma,
} from '../../test/prisma.mock';

const negotiationRow = (overrides: Record<string, unknown> = {}) => ({
  id: 3,
  status: 'ABERTA',
  totalValue: { toString: () => '3000.00' },
  ...overrides,
});

// Aparelho como o banco o devolve pelo select do service: os campos da
// avaliação nulos enquanto aguarda.
const deviceRow = (overrides: Record<string, unknown> = {}) => ({
  id: 9,
  negotiationId: 3,
  model: 'iPhone 12 128 GB',
  serialNumber: 'F2LXK0ABCD',
  imei: null,
  evaluationStatus: 'AGUARDANDO',
  condition: null,
  estimatedValue: null,
  report: null,
  icloudUnlocked: null,
  evaluatedAt: null,
  createdAt: new Date('2026-10-05T12:00:00Z'),
  evaluator: null,
  createdBy: { id: 2, name: 'Vendedora' },
  negotiation: { status: 'ABERTA' },
  ...overrides,
});

type CreateArg = {
  data: {
    negotiationId: number;
    model: string;
    serialNumber: string;
    imei: string | null;
    createdById: number;
  };
};

type UpdateArg = {
  where: { id: number };
  data: Record<string, unknown>;
};

type FindManyArg = {
  where: Record<string, unknown>;
  select: { negotiation: { select: Record<string, unknown> } };
  orderBy: unknown;
};

// Aparelho como a fila o lê: com o Cliente, o Vendedor e a situação da
// Negociação, e nada dos itens nem dos valores dela (RD16).
const queueRow = (overrides: Record<string, unknown> = {}) =>
  deviceRow({
    negotiation: {
      id: 3,
      status: 'ABERTA',
      client: { id: 'c-1', name: 'Ana Cliente' },
      vendedor: { id: 2, name: 'Vendedora' },
    },
    ...overrides,
  });

describe('UsedDevicesService', () => {
  let service: UsedDevicesService;
  let prisma: MockPrisma;

  const create = (dto: Partial<CreateUsedDeviceDto> = {}, negotiationId = 3) =>
    service.create(
      negotiationId,
      {
        model: 'iPhone 12 128 GB',
        serialNumber: 'F2LXK0ABCD',
        ...dto,
      } as CreateUsedDeviceDto,
      2,
    );

  beforeEach(async () => {
    prisma = createMockPrisma();
    const moduleRef = await Test.createTestingModule({
      providers: [
        UsedDevicesService,
        { provide: PrismaService, useValue: asPrismaService(prisma) },
      ],
    }).compile();
    service = moduleRef.get(UsedDevicesService);

    prisma.negotiation.findFirst.mockResolvedValue(negotiationRow());
    prisma.usedDevice.count.mockResolvedValue(0);
    prisma.usedDevice.create.mockImplementation((arg: CreateArg) =>
      Promise.resolve(
        deviceRow({
          model: arg.data.model,
          serialNumber: arg.data.serialNumber,
          imei: arg.data.imei,
        }),
      ),
    );
    prisma.usedDevice.findFirst.mockResolvedValue(deviceRow());
    prisma.usedDevice.update.mockImplementation((arg: UpdateArg) =>
      Promise.resolve(deviceRow(arg.data)),
    );
  });

  describe('create (RD1–RD3)', () => {
    it('cadastra na Negociação Aberta, nascendo aguardando avaliação e com o autor', async () => {
      const device = await create({ imei: '356789012345678' });

      const { data } = callArg<CreateArg>(prisma.usedDevice.create);
      expect(data).toEqual({
        negotiationId: 3,
        model: 'iPhone 12 128 GB',
        serialNumber: 'F2LXK0ABCD',
        imei: '356789012345678',
        createdById: 2,
      });
      expect(device).toMatchObject({
        id: 9,
        negotiationId: 3,
        evaluationStatus: 'AGUARDANDO',
        condition: null,
        estimatedValue: null,
        createdBy: { id: 2, name: 'Vendedora' },
      });
    });

    it('grava a série normalizada: sem espaços nas pontas e em maiúsculas', async () => {
      await create({ serialNumber: '  f2lxk0abcd ' });

      const { data } = callArg<CreateArg>(prisma.usedDevice.create);
      expect(data.serialNumber).toBe('F2LXK0ABCD');
    });

    it('grava o modelo sem espaços nas pontas', async () => {
      await create({ model: '  iPhone 8 64 GB ' });

      const { data } = callArg<CreateArg>(prisma.usedDevice.create);
      expect(data.model).toBe('iPhone 8 64 GB');
    });

    it('IMEI ausente ou em branco é gravado como nulo (iPad Wi-Fi, Mac, Watch)', async () => {
      await create({ imei: '  ' });
      await create({});

      expect(callArg<CreateArg>(prisma.usedDevice.create, 0).data.imei).toBe(
        null,
      );
      expect(callArg<CreateArg>(prisma.usedDevice.create, 1).data.imei).toBe(
        null,
      );
    });

    it('devolve serialSeenBefore: quantos aparelhos não excluídos já tiveram a série normalizada', async () => {
      prisma.usedDevice.count.mockResolvedValue(2);

      const device = await create({ serialNumber: ' f2lxk0abcd' });

      expect(prisma.usedDevice.count).toHaveBeenCalledWith({
        where: {
          deletedAt: null,
          serialNumber: 'F2LXK0ABCD',
          negotiation: { deletedAt: null },
        },
      });
      expect(device.serialSeenBefore).toBe(2);
    });

    it('série repetida não bloqueia o cadastro (RD3)', async () => {
      prisma.usedDevice.count.mockResolvedValue(1);

      await expect(create()).resolves.toMatchObject({ serialSeenBefore: 1 });
      expect(prisma.usedDevice.create).toHaveBeenCalled();
    });

    it.each(['GANHA', 'PERDIDA'])(
      'Negociação %s: 409, sem gravar (RD1)',
      async (status) => {
        prisma.negotiation.findFirst.mockResolvedValue(
          negotiationRow({ status }),
        );

        await expect(create()).rejects.toThrow(ConflictException);
        expect(prisma.usedDevice.create).not.toHaveBeenCalled();
      },
    );

    it('Negociação inexistente ou excluída: 404', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(null);

      await expect(create()).rejects.toThrow(NotFoundException);
      expect(prisma.usedDevice.create).not.toHaveBeenCalled();
    });

    it.each([
      ['modelo vazio', { model: '' }],
      ['modelo só com espaços', { model: '   ' }],
      ['série vazia', { serialNumber: '' }],
      ['série só com espaços', { serialNumber: '  ' }],
      ['IMEI com 14 dígitos', { imei: '35678901234567' }],
      ['IMEI com 16 dígitos', { imei: '3567890123456789' }],
      ['IMEI com letras', { imei: '35678901234567A' }],
    ])('%s: 400, sem gravar (RD2)', async (_case, dto) => {
      await expect(create(dto)).rejects.toThrow(BadRequestException);
      expect(prisma.usedDevice.create).not.toHaveBeenCalled();
    });
  });

  describe('findByNegotiation', () => {
    it('lista os aparelhos não excluídos da Negociação, do mais antigo para o mais novo', async () => {
      prisma.usedDevice.findMany.mockResolvedValue([
        deviceRow(),
        deviceRow({ id: 10, model: 'Apple Watch S6' }),
      ]);

      const result = await service.findByNegotiation(3);

      const arg = callArg<{ where: unknown; orderBy: unknown }>(
        prisma.usedDevice.findMany,
      );
      expect(arg.where).toEqual({ deletedAt: null, negotiationId: 3 });
      expect(arg.orderBy).toEqual({ id: 'asc' });
      expect(result.devices.map((device) => device.id)).toEqual([9, 10]);
    });

    it('converte o valor estimado para número na borda da resposta', async () => {
      prisma.usedDevice.findMany.mockResolvedValue([
        deviceRow({
          evaluationStatus: 'AVALIADO',
          condition: 'BOM',
          estimatedValue: { toString: () => '2000.00' },
        }),
      ]);

      const { devices } = await service.findByNegotiation(3);

      expect(devices[0].estimatedValue).toBe(2000);
    });

    it('traz o total das trocas e o Saldo a pagar, só com os avaliados', async () => {
      prisma.usedDevice.findMany.mockResolvedValue([
        deviceRow({
          evaluationStatus: 'AVALIADO',
          condition: 'BOM',
          estimatedValue: { toString: () => '1200.50' },
        }),
        deviceRow({ id: 10 }),
        deviceRow({ id: 11, evaluationStatus: 'RECUSADO', report: 'Tela' }),
      ]);

      const result = await service.findByNegotiation(3);

      expect(result.tradeInTotal).toBe(1200.5);
      expect(result.amountDue).toBe(1799.5);
    });

    it('o Saldo a pagar pode ficar negativo', async () => {
      prisma.usedDevice.findMany.mockResolvedValue([
        deviceRow({
          evaluationStatus: 'AVALIADO',
          estimatedValue: { toString: () => '3000.01' },
        }),
      ]);

      const result = await service.findByNegotiation(3);

      expect(result.amountDue).toBe(-0.01);
    });

    it('sem aparelhos, o saldo é o total da Negociação', async () => {
      prisma.usedDevice.findMany.mockResolvedValue([]);

      const result = await service.findByNegotiation(3);

      expect(result).toEqual({ devices: [], tradeInTotal: 0, amountDue: 3000 });
    });

    it('Negociação inexistente: 404', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(null);

      await expect(service.findByNegotiation(3)).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('update (RD4)', () => {
    const update = (dto: Partial<UpdateUsedDeviceDto>) =>
      service.update(9, dto as UpdateUsedDeviceDto);

    it('corrige modelo, série e IMEI enquanto aguarda, com a série normalizada', async () => {
      await update({
        model: ' iPhone 13 ',
        serialNumber: ' g7abc ',
        imei: '356789012345678',
      });

      const arg = callArg<UpdateArg>(prisma.usedDevice.update);
      expect(arg.where).toEqual({ id: 9 });
      expect(arg.data).toEqual({
        model: 'iPhone 13',
        serialNumber: 'G7ABC',
        imei: '356789012345678',
      });
    });

    it('só mexe no que veio: PATCH parcial', async () => {
      await update({ model: 'iPhone 13' });

      expect(callArg<UpdateArg>(prisma.usedDevice.update).data).toEqual({
        model: 'iPhone 13',
      });
    });

    it('IMEI em branco ou null limpa o IMEI', async () => {
      await update({ imei: '' });
      await update({ imei: null as unknown as string });

      expect(callArg<UpdateArg>(prisma.usedDevice.update, 0).data).toEqual({
        imei: null,
      });
      expect(callArg<UpdateArg>(prisma.usedDevice.update, 1).data).toEqual({
        imei: null,
      });
    });

    it.each([
      ['modelo em branco', { model: '  ' }],
      ['série em branco', { serialNumber: '' }],
      ['IMEI inválido', { imei: '123' }],
    ])('%s: 400, sem gravar', async (_case, dto) => {
      await expect(update(dto)).rejects.toThrow(BadRequestException);
      expect(prisma.usedDevice.update).not.toHaveBeenCalled();
    });

    it.each(['AVALIADO', 'RECUSADO'])(
      'aparelho %s: 409, sem gravar',
      async (evaluationStatus) => {
        prisma.usedDevice.findFirst.mockResolvedValue(
          deviceRow({ evaluationStatus }),
        );

        await expect(update({ model: 'iPhone 13' })).rejects.toThrow(
          ConflictException,
        );
        expect(prisma.usedDevice.update).not.toHaveBeenCalled();
      },
    );

    it.each(['GANHA', 'PERDIDA'])(
      'Negociação %s: 409, sem gravar',
      async (status) => {
        prisma.usedDevice.findFirst.mockResolvedValue(
          deviceRow({ negotiation: { status } }),
        );

        await expect(update({ model: 'iPhone 13' })).rejects.toThrow(
          ConflictException,
        );
        expect(prisma.usedDevice.update).not.toHaveBeenCalled();
      },
    );

    it('aparelho inexistente, excluído ou de Negociação excluída: 404', async () => {
      prisma.usedDevice.findFirst.mockResolvedValue(null);

      await expect(update({ model: 'iPhone 13' })).rejects.toThrow(
        NotFoundException,
      );
      expect(
        callArg<{ where: unknown }>(prisma.usedDevice.findFirst).where,
      ).toEqual({ id: 9, deletedAt: null, negotiation: { deletedAt: null } });
    });
  });

  describe('remove (RD5)', () => {
    it.each(['AGUARDANDO', 'AVALIADO', 'RECUSADO'])(
      'aparelho %s com a Negociação Aberta: exclusão lógica',
      async (evaluationStatus) => {
        prisma.usedDevice.findFirst.mockResolvedValue(
          deviceRow({ evaluationStatus }),
        );

        await service.remove(9);

        expect(prisma.usedDevice.update).toHaveBeenCalledWith(
          expect.objectContaining({
            where: { id: 9 },
            data: { deletedAt: expect.any(Date) as Date },
          }),
        );
      },
    );

    it.each(['GANHA', 'PERDIDA'])(
      'Negociação %s: 409, sem excluir',
      async (status) => {
        prisma.usedDevice.findFirst.mockResolvedValue(
          deviceRow({ negotiation: { status } }),
        );

        await expect(service.remove(9)).rejects.toThrow(ConflictException);
        expect(prisma.usedDevice.update).not.toHaveBeenCalled();
      },
    );

    it('aparelho inexistente: 404', async () => {
      prisma.usedDevice.findFirst.mockResolvedValue(null);

      await expect(service.remove(9)).rejects.toThrow(NotFoundException);
    });
  });

  describe('findQueue (RD15, RD16)', () => {
    const queue = (status?: string) =>
      service.findQueue({ status } as ListUsedDevicesQueryDto);

    it('padrão: só aguardando de Negociações Abertas, do mais antigo para o mais novo', async () => {
      prisma.usedDevice.findMany.mockResolvedValue([queueRow()]);

      await queue();

      const arg = callArg<FindManyArg>(prisma.usedDevice.findMany);
      expect(arg.where).toEqual({
        deletedAt: null,
        evaluationStatus: 'AGUARDANDO',
        negotiation: { deletedAt: null, status: 'ABERTA' },
      });
      expect(arg.orderBy).toEqual([{ createdAt: 'asc' }, { id: 'asc' }]);
    });

    it('AGUARDANDO explícito é o mesmo filtro padrão', async () => {
      prisma.usedDevice.findMany.mockResolvedValue([]);

      await queue('AGUARDANDO');

      expect(callArg<FindManyArg>(prisma.usedDevice.findMany).where).toEqual({
        deletedAt: null,
        evaluationStatus: 'AGUARDANDO',
        negotiation: { deletedAt: null, status: 'ABERTA' },
      });
    });

    it.each(['AVALIADO', 'RECUSADO'])(
      '%s: o resultado pedido, de qualquer situação da Negociação, o mais recente primeiro',
      async (status) => {
        prisma.usedDevice.findMany.mockResolvedValue([]);

        await queue(status);

        const arg = callArg<FindManyArg>(prisma.usedDevice.findMany);
        expect(arg.where).toEqual({
          deletedAt: null,
          evaluationStatus: status,
          negotiation: { deletedAt: null },
        });
        expect(arg.orderBy).toEqual([{ createdAt: 'desc' }, { id: 'desc' }]);
      },
    );

    it('TODOS: qualquer resultado e qualquer situação da Negociação', async () => {
      prisma.usedDevice.findMany.mockResolvedValue([]);

      await queue('TODOS');

      expect(callArg<FindManyArg>(prisma.usedDevice.findMany).where).toEqual({
        deletedAt: null,
        negotiation: { deletedAt: null },
      });
    });

    it('cada linha traz Cliente, Vendedor e situação da Negociação, e nenhum item ou valor dela', async () => {
      prisma.usedDevice.findMany.mockResolvedValue([
        queueRow({
          evaluationStatus: 'AVALIADO',
          condition: 'BOM',
          estimatedValue: { toString: () => '2000.00' },
        }),
      ]);

      const { devices } = await queue('TODOS');

      const negotiationSelect = callArg<FindManyArg>(prisma.usedDevice.findMany)
        .select.negotiation.select;
      expect(Object.keys(negotiationSelect).sort()).toEqual([
        'client',
        'id',
        'status',
        'vendedor',
      ]);
      expect(devices[0]).toMatchObject({
        id: 9,
        model: 'iPhone 12 128 GB',
        estimatedValue: 2000,
        negotiation: {
          id: 3,
          status: 'ABERTA',
          client: { id: 'c-1', name: 'Ana Cliente' },
          vendedor: { id: 2, name: 'Vendedora' },
        },
      });
      expect(devices[0].negotiation).not.toHaveProperty('totalValue');
      expect(devices[0].negotiation).not.toHaveProperty('items');
    });

    it('filtro fora da lista é recusado pela validação do DTO', async () => {
      const errors = await validate(
        plainToInstance(ListUsedDevicesQueryDto, { status: 'QUALQUER' }),
      );

      expect(errors).toHaveLength(1);
    });
  });

  describe('findOne (histórico da série)', () => {
    it('traz o aparelho com a Negociação resumida e os outros aparelhos não excluídos da mesma série', async () => {
      prisma.usedDevice.findFirst.mockResolvedValue(queueRow());
      prisma.usedDevice.findMany.mockResolvedValue([
        {
          id: 4,
          createdAt: new Date('2025-03-01T12:00:00Z'),
          evaluatedAt: new Date('2025-03-02T12:00:00Z'),
          evaluationStatus: 'AVALIADO',
          condition: 'REGULAR',
          estimatedValue: { toString: () => '1500.00' },
        },
        {
          id: 6,
          createdAt: new Date('2025-08-01T12:00:00Z'),
          evaluatedAt: new Date('2025-08-01T15:00:00Z'),
          evaluationStatus: 'RECUSADO',
          condition: null,
          estimatedValue: null,
        },
      ]);

      const device = await service.findOne(9);

      expect(
        callArg<{ where: unknown }>(prisma.usedDevice.findFirst).where,
      ).toEqual({ id: 9, deletedAt: null, negotiation: { deletedAt: null } });
      const historyArg = callArg<{ where: unknown; orderBy: unknown }>(
        prisma.usedDevice.findMany,
      );
      expect(historyArg.where).toEqual({
        deletedAt: null,
        negotiation: { deletedAt: null },
        serialNumber: 'F2LXK0ABCD',
        id: { not: 9 },
      });
      expect(historyArg.orderBy).toEqual([
        { createdAt: 'desc' },
        { id: 'desc' },
      ]);
      expect(device).toMatchObject({
        id: 9,
        negotiation: { id: 3, status: 'ABERTA' },
      });
      expect(device.negotiation).not.toHaveProperty('totalValue');
      expect(device.serialHistory).toEqual([
        {
          id: 4,
          createdAt: new Date('2025-03-01T12:00:00Z'),
          evaluatedAt: new Date('2025-03-02T12:00:00Z'),
          evaluationStatus: 'AVALIADO',
          condition: 'REGULAR',
          estimatedValue: 1500,
        },
        {
          id: 6,
          createdAt: new Date('2025-08-01T12:00:00Z'),
          evaluatedAt: new Date('2025-08-01T15:00:00Z'),
          evaluationStatus: 'RECUSADO',
          condition: null,
          estimatedValue: null,
        },
      ]);
    });

    it('aparelho inexistente: 404', async () => {
      prisma.usedDevice.findFirst.mockResolvedValue(null);

      await expect(service.findOne(9)).rejects.toThrow(NotFoundException);
    });
  });

  describe('evaluate (RD6, RD8, RD9)', () => {
    const evaluate = (
      dto: Partial<EvaluateUsedDeviceDto> = {},
      evaluatorId = 5,
    ) =>
      service.evaluate(
        9,
        {
          condition: 'BOM',
          estimatedValue: 2000,
          report: '  Bateria 87%  ',
          icloudUnlocked: true,
          ...dto,
        } as EvaluateUsedDeviceDto,
        evaluatorId,
      );

    it('grava a avaliação com o avaliador e a data, e o laudo sem espaços nas pontas', async () => {
      const device = await evaluate();

      const arg = callArg<UpdateArg>(prisma.usedDevice.update);
      expect(arg.where).toEqual({ id: 9 });
      expect(arg.data).toEqual({
        evaluationStatus: 'AVALIADO',
        condition: 'BOM',
        estimatedValue: 2000,
        report: 'Bateria 87%',
        icloudUnlocked: true,
        evaluatedAt: expect.any(Date) as Date,
        evaluatorId: 5,
      });
      expect(device).toMatchObject({ evaluationStatus: 'AVALIADO' });
    });

    it('laudo é opcional: ausente ou em branco grava nulo', async () => {
      await evaluate({ report: undefined });
      await evaluate({ report: '   ' });

      expect(callArg<UpdateArg>(prisma.usedDevice.update, 0).data.report).toBe(
        null,
      );
      expect(callArg<UpdateArg>(prisma.usedDevice.update, 1).data.report).toBe(
        null,
      );
    });

    it.each([
      ['ausente', undefined],
      ['falso', false],
    ])(
      'iCloud %s: 400 orientando a recusar, sem gravar',
      async (_case, icloudUnlocked) => {
        await expect(
          evaluate({ icloudUnlocked: icloudUnlocked as boolean }),
        ).rejects.toThrow(/recus/i);
        await expect(
          evaluate({ icloudUnlocked: icloudUnlocked as boolean }),
        ).rejects.toThrow(BadRequestException);
        expect(prisma.usedDevice.update).not.toHaveBeenCalled();
      },
    );

    it.each([0, -10])('valor %s: 400, sem gravar', async (estimatedValue) => {
      await expect(evaluate({ estimatedValue })).rejects.toThrow(
        BadRequestException,
      );
      expect(prisma.usedDevice.update).not.toHaveBeenCalled();
    });

    it('condição fora da lista é recusada pela validação do DTO', async () => {
      const errors = await validate(
        plainToInstance(EvaluateUsedDeviceDto, {
          condition: 'NOVO',
          estimatedValue: 2000,
          icloudUnlocked: true,
        }),
      );

      expect(errors.map((error) => error.property)).toEqual(['condition']);
    });

    it.each(['AVALIADO', 'RECUSADO'])(
      'reavaliar um aparelho %s sobrescreve e grava o novo avaliador',
      async (evaluationStatus) => {
        prisma.usedDevice.findFirst.mockResolvedValue(
          deviceRow({
            evaluationStatus,
            evaluator: { id: 5, name: 'Técnico A' },
          }),
        );

        await evaluate(
          { estimatedValue: 1800, condition: DeviceConditionEnum.REGULAR },
          7,
        );

        expect(callArg<UpdateArg>(prisma.usedDevice.update).data).toMatchObject(
          {
            evaluationStatus: 'AVALIADO',
            condition: 'REGULAR',
            estimatedValue: 1800,
            evaluatorId: 7,
          },
        );
      },
    );

    it.each(['GANHA', 'PERDIDA'])(
      'Negociação %s: 409, sem gravar',
      async (status) => {
        prisma.usedDevice.findFirst.mockResolvedValue(
          deviceRow({ negotiation: { status } }),
        );

        await expect(evaluate()).rejects.toThrow(ConflictException);
        expect(prisma.usedDevice.update).not.toHaveBeenCalled();
      },
    );

    it('aparelho inexistente: 404', async () => {
      prisma.usedDevice.findFirst.mockResolvedValue(null);

      await expect(evaluate()).rejects.toThrow(NotFoundException);
    });
  });

  describe('refuse (RD7, RD8, RD9)', () => {
    const refuse = (report: string, evaluatorId = 5) =>
      service.refuse(9, { report }, evaluatorId);

    it('grava a recusa com o motivo, o avaliador e a data, e limpa condição e valor', async () => {
      prisma.usedDevice.findFirst.mockResolvedValue(
        deviceRow({ evaluationStatus: 'AVALIADO', condition: 'BOM' }),
      );

      const device = await refuse('  iCloud bloqueado  ');

      const arg = callArg<UpdateArg>(prisma.usedDevice.update);
      expect(arg.where).toEqual({ id: 9 });
      expect(arg.data).toEqual({
        evaluationStatus: 'RECUSADO',
        condition: null,
        estimatedValue: null,
        report: 'iCloud bloqueado',
        icloudUnlocked: null,
        evaluatedAt: expect.any(Date) as Date,
        evaluatorId: 5,
      });
      expect(device).toMatchObject({ evaluationStatus: 'RECUSADO' });
    });

    it.each(['', '   '])('laudo "%s": 400, sem gravar', async (report) => {
      await expect(refuse(report)).rejects.toThrow(BadRequestException);
      expect(prisma.usedDevice.update).not.toHaveBeenCalled();
    });

    it.each(['GANHA', 'PERDIDA'])(
      'Negociação %s: 409, sem gravar',
      async (status) => {
        prisma.usedDevice.findFirst.mockResolvedValue(
          deviceRow({ negotiation: { status } }),
        );

        await expect(refuse('iCloud bloqueado')).rejects.toThrow(
          ConflictException,
        );
        expect(prisma.usedDevice.update).not.toHaveBeenCalled();
      },
    );
  });

  // A autorização é do RolesGuard global, a partir do @Roles do controller.
  describe('perfis', () => {
    const guard = new RolesGuard(new Reflector());

    const canCall = (
      handler: keyof UsedDevicesController,
      role: RoleEnum,
    ): boolean => {
      const context = {
        getHandler: () => UsedDevicesController.prototype[handler],
        getClass: () => UsedDevicesController,
        switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
      } as unknown as ExecutionContext;
      try {
        return guard.canActivate(context);
      } catch (error) {
        if (error instanceof ForbiddenException) return false;
        throw error;
      }
    };

    it.each(['create', 'findByNegotiation', 'update', 'remove'] as const)(
      '%s: ADMIN e VENDEDOR passam; ATENDENTE e TECNICO levam 403',
      (handler) => {
        expect(canCall(handler, RoleEnum.ADMIN)).toBe(true);
        expect(canCall(handler, RoleEnum.VENDEDOR)).toBe(true);
        expect(canCall(handler, RoleEnum.ATENDENTE)).toBe(false);
        expect(canCall(handler, RoleEnum.TECNICO)).toBe(false);
      },
    );

    it.each(['findQueue', 'findOne', 'evaluate', 'refuse'] as const)(
      '%s: ADMIN e TECNICO passam; VENDEDOR e ATENDENTE levam 403',
      (handler) => {
        expect(canCall(handler, RoleEnum.ADMIN)).toBe(true);
        expect(canCall(handler, RoleEnum.TECNICO)).toBe(true);
        expect(canCall(handler, RoleEnum.VENDEDOR)).toBe(false);
        expect(canCall(handler, RoleEnum.ATENDENTE)).toBe(false);
      },
    );
  });
});
