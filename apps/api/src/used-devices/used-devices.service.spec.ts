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
  asPrismaService,
  callArg,
  createMockPrisma,
  MockPrisma,
} from '../../test/prisma.mock';

const negotiationRow = (overrides: Record<string, unknown> = {}) => ({
  id: 3,
  status: 'ABERTA',
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
  });
});
