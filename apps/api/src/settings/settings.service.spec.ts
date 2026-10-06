import {
  BadRequestException,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { Test } from '@nestjs/testing';
import { RolesGuard } from '../auth/guards/roles.guard';
import { RoleEnum } from '../users/dto/create-user.dto';
import { SettingsController } from './settings.controller';
import { PrismaService } from '../prisma/prisma.service';
import { SettingsService } from './settings.service';
import {
  asPrismaService,
  callArg,
  createMockPrisma,
  MockPrisma,
} from '../../test/prisma.mock';

const decimal = (value: string) => ({ toString: () => value });

const companyRow = (overrides: Record<string, unknown> = {}) => ({
  name: 'MMT Urbana',
  cnpj: '12.345.678/0001-90',
  address: 'Rua das Flores, 100',
  phone: '(11) 99999-0000',
  defaultValidityDays: 10,
  ...overrides,
});

const rateRows = (percents: string[]) =>
  percents.map((percent, index) => ({
    installments: index + 1,
    ratePercent: decimal(percent),
  }));

describe('SettingsService', () => {
  let service: SettingsService;
  let prisma: MockPrisma;

  beforeEach(async () => {
    prisma = createMockPrisma();
    const moduleRef = await Test.createTestingModule({
      providers: [
        SettingsService,
        { provide: PrismaService, useValue: asPrismaService(prisma) },
      ],
    }).compile();
    service = moduleRef.get(SettingsService);
  });

  describe('find', () => {
    it('devolve os dados da loja e as 12 taxas num único payload (RS1)', async () => {
      prisma.companySettings.findUnique.mockResolvedValue(companyRow());
      prisma.installmentRate.findMany.mockResolvedValue(
        rateRows([
          '0.00',
          '3.50',
          '4.99',
          '5.75',
          '6.40',
          '7.10',
          '8.00',
          '8.90',
          '9.60',
          '10.35',
          '11.20',
          '12.00',
        ]),
      );

      const result = await service.find();

      expect(result.company).toEqual({
        name: 'MMT Urbana',
        cnpj: '12.345.678/0001-90',
        address: 'Rua das Flores, 100',
        phone: '(11) 99999-0000',
        defaultValidityDays: 10,
      });
      expect(result.installmentRates).toHaveLength(12);
      expect(result.installmentRates[0]).toEqual({
        installments: 1,
        ratePercent: 0,
      });
      expect(result.installmentRates[9]).toEqual({
        installments: 10,
        ratePercent: 10.35,
      });
    });

    it('sem linha da loja nem taxas, vale 7 dias e 0% de 1x a 12x, sem gravar nada (RQ7)', async () => {
      prisma.companySettings.findUnique.mockResolvedValue(null);
      prisma.installmentRate.findMany.mockResolvedValue([]);

      const result = await service.find();

      expect(result.company).toEqual({
        name: '',
        cnpj: null,
        address: null,
        phone: null,
        defaultValidityDays: 7,
      });
      expect(result.installmentRates).toEqual(
        Array.from({ length: 12 }, (_, index) => ({
          installments: index + 1,
          ratePercent: 0,
        })),
      );
      expect(prisma.companySettings.upsert).not.toHaveBeenCalled();
      expect(prisma.companySettings.create).not.toHaveBeenCalled();
      expect(prisma.installmentRate.upsert).not.toHaveBeenCalled();
      expect(prisma.installmentRate.createMany).not.toHaveBeenCalled();
    });

    it('completa com 0% só as parcelas que faltam na tabela (RQ7)', async () => {
      prisma.companySettings.findUnique.mockResolvedValue(companyRow());
      prisma.installmentRate.findMany.mockResolvedValue([
        { installments: 3, ratePercent: decimal('4.50') },
      ]);

      const result = await service.find();

      expect(result.installmentRates).toHaveLength(12);
      expect(result.installmentRates[2]).toEqual({
        installments: 3,
        ratePercent: 4.5,
      });
      expect(result.installmentRates[11]).toEqual({
        installments: 12,
        ratePercent: 0,
      });
    });
  });

  describe('updateCompany', () => {
    beforeEach(() => {
      prisma.installmentRate.findMany.mockResolvedValue([]);
    });

    it('grava dados da loja e validade padrão na linha única e devolve a configuração completa', async () => {
      const saved = companyRow({
        name: 'MMT Urbana Centro',
        defaultValidityDays: 15,
      });
      prisma.companySettings.upsert.mockResolvedValue(saved);
      prisma.companySettings.findUnique.mockResolvedValue(saved);

      const result = await service.updateCompany({
        name: '  MMT Urbana Centro ',
        cnpj: '12.345.678/0001-90',
        address: 'Rua das Flores, 100',
        phone: '(11) 99999-0000',
        defaultValidityDays: 15,
      });

      expect(prisma.companySettings.upsert).toHaveBeenCalledTimes(1);
      const arg = callArg<{
        where: { id: number };
        update: Record<string, unknown>;
        create: Record<string, unknown>;
      }>(prisma.companySettings.upsert);
      expect(arg.where).toEqual({ id: 1 });
      const expected = {
        name: 'MMT Urbana Centro',
        cnpj: '12.345.678/0001-90',
        address: 'Rua das Flores, 100',
        phone: '(11) 99999-0000',
        defaultValidityDays: 15,
      };
      expect(arg.update).toEqual(expected);
      expect(arg.create).toEqual({ id: 1, ...expected });
      expect(result.company.name).toBe('MMT Urbana Centro');
      expect(result.installmentRates).toHaveLength(12);
    });

    it('grava CNPJ e telefone como texto, sem validar formato, e vazio vira nulo (RS3)', async () => {
      prisma.companySettings.upsert.mockResolvedValue(companyRow());
      prisma.companySettings.findUnique.mockResolvedValue(companyRow());

      await service.updateCompany({
        name: 'MMT Urbana',
        cnpj: 'abc',
        address: '   ',
        phone: null,
        defaultValidityDays: 7,
      });

      const arg = callArg<{ update: Record<string, unknown> }>(
        prisma.companySettings.upsert,
      );
      expect(arg.update.cnpj).toBe('abc');
      expect(arg.update.address).toBeNull();
      expect(arg.update.phone).toBeNull();
    });

    it.each([0, 91, -5])(
      'recusa validade padrão de %p dias com 400, sem gravar (RS3)',
      async (days) => {
        const attempt = service.updateCompany({
          name: 'MMT Urbana',
          defaultValidityDays: days,
        });

        await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
        await expect(attempt).rejects.toThrow(
          'A validade padrão deve ser de 1 a 90 dias',
        );
        expect(prisma.companySettings.upsert).not.toHaveBeenCalled();
      },
    );

    it.each([1, 90])('aceita validade padrão de %p dias', async (days) => {
      prisma.companySettings.upsert.mockResolvedValue(companyRow());
      prisma.companySettings.findUnique.mockResolvedValue(companyRow());

      await service.updateCompany({
        name: 'MMT Urbana',
        defaultValidityDays: days,
      });

      expect(prisma.companySettings.upsert).toHaveBeenCalledTimes(1);
    });

    it('recusa nome da loja em branco com 400, sem gravar', async () => {
      const attempt = service.updateCompany({
        name: '   ',
        defaultValidityDays: 7,
      });

      await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.companySettings.upsert).not.toHaveBeenCalled();
    });
  });

  describe('replaceInstallmentRates', () => {
    const fullTable = (percentOf: (installments: number) => number = () => 0) =>
      Array.from({ length: 12 }, (_, index) => ({
        installments: index + 1,
        ratePercent: percentOf(index + 1),
      }));

    beforeEach(() => {
      prisma.companySettings.findUnique.mockResolvedValue(companyRow());
    });

    it('grava as 12 linhas de uma vez, numa transação, e devolve a configuração completa (RS2)', async () => {
      prisma.installmentRate.upsert.mockResolvedValue({});
      prisma.installmentRate.findMany.mockResolvedValue(
        rateRows([
          '0.00',
          '2.50',
          '3.00',
          '3.50',
          '4.00',
          '4.50',
          '5.00',
          '5.50',
          '6.00',
          '6.50',
          '7.00',
          '99.99',
        ]),
      );
      const rates = fullTable((n) =>
        n === 12 ? 99.99 : n === 1 ? 0 : 1.5 + n / 2,
      );

      const result = await service.replaceInstallmentRates({
        rates: [...rates].reverse(),
      });

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.installmentRate.upsert).toHaveBeenCalledTimes(12);
      const written = prisma.installmentRate.upsert.mock.calls.map(
        ([arg]: [
          { where: { installments: number }; update: { ratePercent: number } },
        ]) => [arg.where.installments, arg.update.ratePercent],
      );
      expect(written).toContainEqual([1, 0]);
      expect(written).toContainEqual([10, 6.5]);
      expect(written).toContainEqual([12, 99.99]);
      const tenX = prisma.installmentRate.upsert.mock.calls
        .map(
          ([arg]: [{ where: { installments: number }; create: unknown }]) =>
            arg,
        )
        .find((arg) => arg.where.installments === 10);
      expect(tenX?.create).toEqual({ installments: 10, ratePercent: 6.5 });
      expect(result.installmentRates[11]).toEqual({
        installments: 12,
        ratePercent: 99.99,
      });
      expect(result.company.name).toBe('MMT Urbana');
    });

    it.each([-0.01, 100.01])(
      'recusa taxa de %p%% com 400, sem gravar nenhuma linha (RS3)',
      async (percent) => {
        const attempt = service.replaceInstallmentRates({
          rates: fullTable((n) => (n === 7 ? percent : 2)),
        });

        await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
        await expect(attempt).rejects.toThrow(
          'A taxa de 7x deve ser de 0 a 100%',
        );
        expect(prisma.installmentRate.upsert).not.toHaveBeenCalled();
      },
    );

    it('aceita as taxas nos limites de 0% e 100%', async () => {
      prisma.installmentRate.upsert.mockResolvedValue({});
      prisma.installmentRate.findMany.mockResolvedValue([]);

      await service.replaceInstallmentRates({
        rates: fullTable((n) => (n === 1 ? 0 : 100)),
      });

      expect(prisma.installmentRate.upsert).toHaveBeenCalledTimes(12);
    });

    it.each([
      ['faltando o 12x', fullTable().slice(0, 11)],
      [
        'com o 5x repetido no lugar do 6x',
        fullTable().map((rate) =>
          rate.installments === 6 ? { ...rate, installments: 5 } : rate,
        ),
      ],
      [
        'com um 13x a mais',
        [...fullTable(), { installments: 13, ratePercent: 0 }],
      ],
      [
        'com 0x no lugar do 1x',
        fullTable().map((rate) =>
          rate.installments === 1 ? { ...rate, installments: 0 } : rate,
        ),
      ],
      ['vazio', []],
    ])(
      'recusa conjunto %s com 400, sem gravar nenhuma linha',
      async (_, rates) => {
        const attempt = service.replaceInstallmentRates({ rates });

        await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
        await expect(attempt).rejects.toThrow(
          'Informe uma taxa para cada parcelamento, de 1x a 12x',
        );
        expect(prisma.installmentRate.upsert).not.toHaveBeenCalled();
      },
    );
  });

  // RS1: a autorização é do RolesGuard global, a partir do @Roles de cada
  // rota. O guard real roda contra os handlers do controller.
  describe('perfis (RS1)', () => {
    const guard = new RolesGuard(new Reflector());

    const canCall = (
      handler: keyof SettingsController,
      role: RoleEnum,
    ): boolean => {
      const context = {
        getHandler: () => SettingsController.prototype[handler],
        getClass: () => SettingsController,
        switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
      } as unknown as ExecutionContext;
      try {
        return guard.canActivate(context);
      } catch (error) {
        if (error instanceof ForbiddenException) return false;
        throw error;
      }
    };

    it('libera a leitura a ADMIN e VENDEDOR, que precisa das taxas para simular', () => {
      expect(canCall('find', RoleEnum.ADMIN)).toBe(true);
      expect(canCall('find', RoleEnum.VENDEDOR)).toBe(true);
      expect(canCall('find', RoleEnum.ATENDENTE)).toBe(false);
      expect(canCall('find', RoleEnum.TECNICO)).toBe(false);
    });

    it.each(['updateCompany', 'replaceInstallmentRates'] as const)(
      'libera %s só ao ADMIN; os demais perfis levam 403',
      (handler) => {
        expect(canCall(handler, RoleEnum.ADMIN)).toBe(true);
        expect(canCall(handler, RoleEnum.VENDEDOR)).toBe(false);
        expect(canCall(handler, RoleEnum.ATENDENTE)).toBe(false);
        expect(canCall(handler, RoleEnum.TECNICO)).toBe(false);
      },
    );
  });
});
