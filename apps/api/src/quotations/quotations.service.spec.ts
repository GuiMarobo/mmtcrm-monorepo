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
import { SettingsService } from '../settings/settings.service';
import { QuotationsController } from './quotations.controller';
import { QuotationsService } from './quotations.service';
import { IssueQuotationDto } from './dto/issue-quotation.dto';
import {
  asPrismaService,
  callArg,
  createMockPrisma,
  MockPrisma,
} from '../../test/prisma.mock';

const decimal = (value: string) => ({ toString: () => value });

// 12h em Brasília: "hoje" é 2026-09-22 para a loja.
const NOW = new Date('2026-09-22T15:00:00Z');

const negotiationRow = (overrides: Record<string, unknown> = {}) => ({
  id: 3,
  status: 'ABERTA',
  ...overrides,
});

const product = (id: string, name: string) => ({
  id,
  name,
  sku: `${id.toUpperCase()}-SKU`,
  status: 'ATIVO',
  deletedAt: null,
});

// Os dois itens da Negociação 3: 2 × R$ 600,00 com 10% (subtotal 1.080,00) e
// 1 × R$ 30,00 com R$ 10,00 de desconto (subtotal 20,00). Total à vista 1.100,00.
const negotiationItemRows = () => [
  {
    id: 10,
    productId: 'p1',
    quantity: 2,
    unitPrice: decimal('600.00'),
    discountType: 'PERCENTUAL',
    discountValue: decimal('10.00'),
    product: product('p1', 'iPhone 15 Pro'),
  },
  {
    id: 11,
    productId: 'p2',
    quantity: 1,
    unitPrice: decimal('30.00'),
    discountType: 'VALOR',
    discountValue: decimal('10.00'),
    product: product('p2', 'Capa'),
  },
];

type CreatedItem = {
  productId: string;
  quantity: number;
  unitPrice: unknown;
  discountType: string;
  discountValue: unknown;
};

type CreateArg = {
  data: {
    negotiationId: number;
    code: string;
    totalValue: number;
    installments: number;
    ratePercent: number;
    totalWithInterest: number;
    validUntil: Date;
    authorId: number;
    items: { create: CreatedItem[] };
  };
};

const asDecimal = (value: unknown) =>
  typeof value === 'number' ? decimal(value.toFixed(2)) : value;

describe('QuotationsService', () => {
  let service: QuotationsService;
  let prisma: MockPrisma;

  // O banco devolve o que foi gravado: a linha lida depois da criação é
  // montada a partir do `data` do create, com o id que o banco daria.
  const storeCreatedQuotation = (id = 7) => {
    prisma.quotation.create.mockImplementation(() => Promise.resolve({ id }));
    prisma.quotation.update.mockImplementation(
      (arg: { where: { id: number }; data: { code: string } }) => {
        const { data } = callArg<CreateArg>(prisma.quotation.create);
        return Promise.resolve({
          id: arg.where.id,
          negotiationId: data.negotiationId,
          code: arg.data.code,
          totalValue: asDecimal(data.totalValue),
          installments: data.installments,
          ratePercent: asDecimal(data.ratePercent),
          totalWithInterest: asDecimal(data.totalWithInterest),
          validUntil: data.validUntil,
          createdAt: NOW,
          author: { id: data.authorId, name: 'Vendedora' },
          items: data.items.create.map((item, index) => ({
            id: 100 + index,
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            discountType: item.discountType,
            discountValue: item.discountValue,
            product: product(item.productId, `Produto ${item.productId}`),
          })),
        });
      },
    );
  };

  const issue = (dto: Partial<IssueQuotationDto> = {}, negotiationId = 3) =>
    service.issue(
      negotiationId,
      { installments: 10, ...dto } as IssueQuotationDto,
      2,
    );

  beforeEach(async () => {
    jest.useFakeTimers({ now: NOW, doNotFake: ['nextTick', 'setImmediate'] });
    prisma = createMockPrisma();
    const moduleRef = await Test.createTestingModule({
      providers: [
        QuotationsService,
        SettingsService,
        { provide: PrismaService, useValue: asPrismaService(prisma) },
      ],
    }).compile();
    service = moduleRef.get(QuotationsService);

    prisma.negotiation.findFirst.mockResolvedValue(negotiationRow());
    prisma.negotiationItem.findMany.mockResolvedValue(negotiationItemRows());
    prisma.companySettings.findUnique.mockResolvedValue({
      name: 'MMT Urbana',
      cnpj: null,
      address: null,
      phone: null,
      defaultValidityDays: 10,
    });
    prisma.installmentRate.findMany.mockResolvedValue(
      Array.from({ length: 12 }, (_, index) => ({
        installments: index + 1,
        ratePercent: decimal(index + 1 === 10 ? '5.00' : '0.00'),
      })),
    );
    storeCreatedQuotation();
  });

  afterEach(() => {
    jest.useRealTimers();
  });

  describe('issue', () => {
    it('congela os itens copiando preço praticado e desconto, sem recalcular do catálogo', async () => {
      await issue();

      const { data } = callArg<CreateArg>(prisma.quotation.create);
      expect(
        data.items.create.map((item) => ({
          ...item,
          unitPrice: String(item.unitPrice),
          discountValue: String(item.discountValue),
        })),
      ).toEqual([
        {
          productId: 'p1',
          quantity: 2,
          unitPrice: '600.00',
          discountType: 'PERCENTUAL',
          discountValue: '10.00',
        },
        {
          productId: 'p2',
          quantity: 1,
          unitPrice: '30.00',
          discountType: 'VALOR',
          discountValue: '10.00',
        },
      ]);
      expect(prisma.product.findMany).not.toHaveBeenCalled();
      expect(prisma.product.findFirst).not.toHaveBeenCalled();
    });

    it('só lê os itens não excluídos da Negociação', async () => {
      await issue();

      const { where } = callArg<{ where: Record<string, unknown> }>(
        prisma.negotiationItem.findMany,
      );
      expect(where).toMatchObject({ deletedAt: null, negotiationId: 3 });
    });

    it('calcula os totais no backend e devolve o Orçamento completo com código ORC-id', async () => {
      const result = await issue({ installments: 10 });

      const { data } = callArg<CreateArg>(prisma.quotation.create);
      expect(data.negotiationId).toBe(3);
      expect(data.totalValue).toBe(1100);
      expect(data.installments).toBe(10);
      expect(data.ratePercent).toBe(5);
      expect(data.totalWithInterest).toBe(1155);
      expect(data.authorId).toBe(2);

      expect(
        callArg<{ data: { code: string } }>(prisma.quotation.update).data,
      ).toEqual({ code: 'ORC-7' });
      expect(result).toMatchObject({
        id: 7,
        code: 'ORC-7',
        negotiationId: 3,
        totalValue: 1100,
        installments: 10,
        ratePercent: 5,
        totalWithInterest: 1155,
        installmentValue: 115.5,
        firstInstallmentValue: 115.5,
        validUntil: '2026-10-02',
        expired: false,
        author: { id: 2, name: 'Vendedora' },
      });
      expect(result.items).toHaveLength(2);
      expect(result.items[0]).toMatchObject({
        quantity: 2,
        unitPrice: 600,
        discountType: 'PERCENTUAL',
        discountValue: 10,
        discountAmount: 120,
        subtotal: 1080,
      });
    });

    it('ignora qualquer total vindo do cliente (RQ4)', async () => {
      await issue({
        installments: 1,
        totalValue: 1,
        totalWithInterest: 2,
      } as Partial<IssueQuotationDto>);

      const { data } = callArg<CreateArg>(prisma.quotation.create);
      expect(data.totalValue).toBe(1100);
      expect(data.totalWithInterest).toBe(1100);
    });

    it('arredonda o total com juros meio para cima e põe o resíduo na primeira parcela', async () => {
      prisma.negotiationItem.findMany.mockResolvedValue([
        {
          ...negotiationItemRows()[1],
          unitPrice: decimal('999.99'),
          discountValue: decimal('0.00'),
        },
      ]);

      const result = await issue({ installments: 12, ratePercent: 3.33 });

      const { data } = callArg<CreateArg>(prisma.quotation.create);
      // 999,99 × 1,0333 = 1.033,289667 → 1.033,29
      expect(data.totalWithInterest).toBe(1033.29);
      // 103.329 ÷ 12 = 8.610 centavos, resíduo 9
      expect(result.installmentValue).toBe(86.1);
      expect(result.firstInstallmentValue).toBe(86.19);
    });

    it('sugere a taxa da tabela e a validade padrão da loja', async () => {
      await issue({ installments: 10 });

      const { data } = callArg<CreateArg>(prisma.quotation.create);
      expect(data.ratePercent).toBe(5);
      expect(data.validUntil.toISOString().slice(0, 10)).toBe('2026-10-02');
    });

    it('a taxa e a validade do payload sobrescrevem as sugeridas (RQ6)', async () => {
      const result = await issue({
        installments: 10,
        ratePercent: 8,
        validUntil: '2026-11-30',
      });

      const { data } = callArg<CreateArg>(prisma.quotation.create);
      expect(data.ratePercent).toBe(8);
      expect(data.totalWithInterest).toBe(1188);
      expect(data.validUntil.toISOString().slice(0, 10)).toBe('2026-11-30');
      expect(result.validUntil).toBe('2026-11-30');
    });

    it('taxa 0 no payload vale, mesmo com taxa sugerida maior', async () => {
      await issue({ installments: 10, ratePercent: 0 });

      const { data } = callArg<CreateArg>(prisma.quotation.create);
      expect(data.ratePercent).toBe(0);
      expect(data.totalWithInterest).toBe(1100);
    });

    it('sem configuração cadastrada não falha: 0% de taxa e 7 dias de validade (RQ7)', async () => {
      prisma.companySettings.findUnique.mockResolvedValue(null);
      prisma.installmentRate.findMany.mockResolvedValue([]);

      await issue({ installments: 10 });

      const { data } = callArg<CreateArg>(prisma.quotation.create);
      expect(data.ratePercent).toBe(0);
      expect(data.totalWithInterest).toBe(1100);
      expect(data.validUntil.toISOString().slice(0, 10)).toBe('2026-09-29');
    });

    it('"hoje" é o dia da loja em Brasília, não o do servidor em UTC', async () => {
      // 22h de 22/09 em Brasília = 01h de 23/09 em UTC.
      jest.setSystemTime(new Date('2026-09-23T01:00:00Z'));

      await expect(issue({ validUntil: '2026-09-23' })).resolves.toMatchObject({
        validUntil: '2026-09-23',
      });
    });

    it('recusa com 404 Negociação inexistente ou excluída, sem gravar', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(null);

      await expect(issue()).rejects.toBeInstanceOf(NotFoundException);
      await expect(issue()).rejects.toThrow('Negociação não encontrada');
      expect(
        callArg<{ where: Record<string, unknown> }>(
          prisma.negotiation.findFirst,
        ).where,
      ).toMatchObject({ deletedAt: null, id: 3 });
      expect(prisma.quotation.create).not.toHaveBeenCalled();
    });

    it.each(['GANHA', 'PERDIDA'])(
      'recusa com 409 Negociação %s, sem gravar (RQ2)',
      async (status) => {
        prisma.negotiation.findFirst.mockResolvedValue(
          negotiationRow({ status }),
        );

        await expect(issue()).rejects.toBeInstanceOf(ConflictException);
        await expect(issue()).rejects.toThrow(
          'Só é possível emitir orçamento de uma negociação em aberto',
        );
        expect(prisma.quotation.create).not.toHaveBeenCalled();
      },
    );

    it('recusa com 409 Negociação sem item não excluído, sem gravar (RQ2)', async () => {
      prisma.negotiationItem.findMany.mockResolvedValue([]);

      await expect(issue()).rejects.toBeInstanceOf(ConflictException);
      await expect(issue()).rejects.toThrow(
        'Adicione ao menos um item à negociação antes de emitir o orçamento',
      );
      expect(prisma.quotation.create).not.toHaveBeenCalled();
    });

    it.each([0, 13, 2.5])(
      'recusa com 400 %s parcelas (RQ5)',
      async (installments) => {
        await expect(issue({ installments })).rejects.toBeInstanceOf(
          BadRequestException,
        );
        await expect(issue({ installments })).rejects.toThrow(
          'O parcelamento deve ser de 1x a 12x',
        );
        expect(prisma.quotation.create).not.toHaveBeenCalled();
      },
    );

    it.each([-0.01, 100.01])(
      'recusa com 400 taxa de %s%% (RQ5)',
      async (ratePercent) => {
        await expect(issue({ ratePercent })).rejects.toBeInstanceOf(
          BadRequestException,
        );
        await expect(issue({ ratePercent })).rejects.toThrow(
          'A taxa deve ser de 0 a 100%',
        );
        expect(prisma.quotation.create).not.toHaveBeenCalled();
      },
    );

    it('aceita taxa de 100%', async () => {
      await issue({ installments: 2, ratePercent: 100 });

      expect(
        callArg<CreateArg>(prisma.quotation.create).data.totalWithInterest,
      ).toBe(2200);
    });

    it.each(['2026-09-22', '2026-09-21', '2026-12-22', '2026-02-30'])(
      'recusa com 400 validade %s: só de amanhã a hoje+90 dias (RQ5)',
      async (validUntil) => {
        await expect(issue({ validUntil })).rejects.toBeInstanceOf(
          BadRequestException,
        );
        await expect(issue({ validUntil })).rejects.toThrow(
          'A validade deve ser de 23/09/2026 a 21/12/2026',
        );
        expect(prisma.quotation.create).not.toHaveBeenCalled();
      },
    );

    it.each(['2026-09-23', '2026-12-21'])(
      'aceita validade no limite: %s',
      async (validUntil) => {
        await expect(issue({ validUntil })).resolves.toMatchObject({
          validUntil,
        });
      },
    );

    it('grava tudo numa transação e não mexe em Negociação, Pedido nem estoque (RQ11)', async () => {
      await issue();

      expect(prisma.$transaction).toHaveBeenCalledTimes(1);
      expect(prisma.negotiation.update).not.toHaveBeenCalled();
      expect(prisma.negotiationItem.update).not.toHaveBeenCalled();
      expect(prisma.negotiationItem.updateMany).not.toHaveBeenCalled();
      expect(prisma.order.upsert).not.toHaveBeenCalled();
      expect(prisma.order.update).not.toHaveBeenCalled();
      expect(prisma.product.update).not.toHaveBeenCalled();
      expect(prisma.product.updateMany).not.toHaveBeenCalled();
      expect(prisma.stockMovement.create).not.toHaveBeenCalled();
    });

    it('não copia nome nem CPF do Cliente para o Orçamento', async () => {
      await issue();

      const { data } = callArg<CreateArg>(prisma.quotation.create);
      expect(Object.keys(data)).not.toEqual(
        expect.arrayContaining(['clientName', 'clientCpf', 'clientId']),
      );
      expect(JSON.stringify(data)).not.toMatch(/Fulana|cpf/i);
    });

    it('duas emissões na mesma Negociação geram dois Orçamentos sem invalidar nada (RQ9)', async () => {
      storeCreatedQuotation(7);
      const first = await issue({ installments: 10 });
      storeCreatedQuotation(8);
      prisma.quotation.update.mockClear();
      prisma.quotation.create.mockClear();
      const second = await issue({ installments: 3 });

      expect(first.code).toBe('ORC-7');
      expect(second.code).toBe('ORC-8');
      expect(prisma.quotation.update).toHaveBeenCalledTimes(1);
      expect(
        callArg<{ where: { id: number } }>(prisma.quotation.update).where,
      ).toEqual({ id: 8 });
      expect(prisma.quotation.updateMany).not.toHaveBeenCalled();
      expect(prisma.quotation.delete).not.toHaveBeenCalled();
    });
  });

  describe('findByNegotiation', () => {
    const quotationRow = (overrides: Record<string, unknown> = {}) => ({
      id: 7,
      negotiationId: 3,
      code: 'ORC-7',
      totalValue: decimal('1100.00'),
      installments: 3,
      ratePercent: decimal('0.00'),
      totalWithInterest: decimal('1100.00'),
      validUntil: new Date('2026-10-02T00:00:00Z'),
      createdAt: new Date('2026-09-22T12:00:00Z'),
      author: { id: 2, name: 'Vendedora' },
      ...overrides,
    });

    it('lista os emitidos da Negociação, mais novo primeiro, com a parcela derivada', async () => {
      prisma.quotation.findMany.mockResolvedValue([quotationRow()]);

      const result = await service.findByNegotiation(3);

      const arg = callArg<{
        where: Record<string, unknown>;
        orderBy: unknown;
      }>(prisma.quotation.findMany);
      expect(arg.where).toEqual({ negotiationId: 3 });
      expect(arg.orderBy).toEqual({ id: 'desc' });
      expect(result).toEqual([
        {
          id: 7,
          negotiationId: 3,
          code: 'ORC-7',
          totalValue: 1100,
          installments: 3,
          ratePercent: 0,
          totalWithInterest: 1100,
          installmentValue: 366.66,
          firstInstallmentValue: 366.68,
          validUntil: '2026-10-02',
          expired: false,
          createdAt: new Date('2026-09-22T12:00:00Z'),
          author: { id: 2, name: 'Vendedora' },
        },
      ]);
    });

    it('rótulo Vencido derivado na leitura: validade antes de hoje (RQ10)', async () => {
      prisma.quotation.findMany.mockResolvedValue([
        quotationRow({ id: 9, validUntil: new Date('2026-09-23T00:00:00Z') }),
        quotationRow({ id: 8, validUntil: new Date('2026-09-22T00:00:00Z') }),
        quotationRow({ id: 7, validUntil: new Date('2026-09-21T00:00:00Z') }),
      ]);

      const result = await service.findByNegotiation(3);

      expect(result.map((q) => [q.id, q.expired])).toEqual([
        [9, false],
        [8, false],
        [7, true],
      ]);
    });

    it('404 quando a Negociação não existe ou foi excluída', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(null);

      await expect(service.findByNegotiation(3)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      expect(prisma.quotation.findMany).not.toHaveBeenCalled();
    });

    it('Negociação ganha ou perdida continua listando os emitidos', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(
        negotiationRow({ status: 'GANHA' }),
      );
      prisma.quotation.findMany.mockResolvedValue([quotationRow()]);

      await expect(service.findByNegotiation(3)).resolves.toHaveLength(1);
    });

    it('editar os itens da Negociação depois da emissão não altera o Orçamento', async () => {
      storeCreatedQuotation(7);
      const issued = await issue({ installments: 10 });
      const { data } = callArg<CreateArg>(prisma.quotation.create);

      // A Negociação segue viva: o VENDEDOR troca preço e quantidade depois.
      prisma.negotiationItem.findMany.mockResolvedValue([
        {
          ...negotiationItemRows()[0],
          quantity: 5,
          unitPrice: decimal('10.00'),
        },
      ]);
      prisma.negotiationItem.findMany.mockClear();
      prisma.quotation.findMany.mockResolvedValue([
        quotationRow({
          totalValue: decimal(data.totalValue.toFixed(2)),
          installments: data.installments,
          ratePercent: decimal(data.ratePercent.toFixed(2)),
          totalWithInterest: decimal(data.totalWithInterest.toFixed(2)),
          validUntil: data.validUntil,
        }),
      ]);

      const [listed] = await service.findByNegotiation(3);

      expect(prisma.negotiationItem.findMany).not.toHaveBeenCalled();
      expect(listed).toMatchObject({
        totalValue: issued.totalValue,
        totalWithInterest: issued.totalWithInterest,
        installmentValue: issued.installmentValue,
        validUntil: issued.validUntil,
      });
      expect(Object.keys(data.items.create[0])).not.toContain(
        'negotiationItemId',
      );
    });
  });

  // RQ3: a autorização é do RolesGuard global, a partir do @Roles do
  // controller — sem restrição de responsável.
  describe('perfis (RQ3)', () => {
    const guard = new RolesGuard(new Reflector());

    const canCall = (
      handler: keyof QuotationsController,
      role: RoleEnum,
    ): boolean => {
      const context = {
        getHandler: () => QuotationsController.prototype[handler],
        getClass: () => QuotationsController,
        switchToHttp: () => ({ getRequest: () => ({ user: { role } }) }),
      } as unknown as ExecutionContext;
      try {
        return guard.canActivate(context);
      } catch (error) {
        if (error instanceof ForbiddenException) return false;
        throw error;
      }
    };

    it.each(['issue', 'findByNegotiation'] as const)(
      '%s: ADMIN e VENDEDOR passam; ATENDENTE e TECNICO levam 403',
      (handler) => {
        expect(canCall(handler, RoleEnum.ADMIN)).toBe(true);
        expect(canCall(handler, RoleEnum.VENDEDOR)).toBe(true);
        expect(canCall(handler, RoleEnum.ATENDENTE)).toBe(false);
        expect(canCall(handler, RoleEnum.TECNICO)).toBe(false);
      },
    );

    it('qualquer VENDEDOR emite de qualquer Negociação: não confere o responsável', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(
        negotiationRow({ vendedorId: 99 }),
      );

      await expect(issue()).resolves.toMatchObject({ code: 'ORC-7' });
    });
  });
});
