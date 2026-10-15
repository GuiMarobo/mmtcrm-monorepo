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

type CreatedTradeIn = {
  usedDeviceId: number;
  model: string;
  serialNumber: string;
  tradeInValue: unknown;
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
    tradeIns: { create: CreatedTradeIn[] };
  };
};

// Aparelho na troca da Negociação 3, como o banco devolve.
const usedDeviceRow = (overrides: Record<string, unknown> = {}) => ({
  id: 40,
  model: 'iPhone 12 128 GB',
  serialNumber: 'F2LXK0AAAAAA',
  evaluationStatus: 'AVALIADO',
  estimatedValue: decimal('300.00'),
  ...overrides,
});

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
          tradeIns: data.tradeIns.create.map((tradeIn, index) => ({
            id: 200 + index,
            ...tradeIn,
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
    prisma.usedDevice.findMany.mockResolvedValue([]);
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

  // RD12 (spec 007): o Orçamento reflete a troca. A emissão espera as
  // avaliações, recusa saldo negativo, congela os avaliados e parcela o saldo.
  describe('issue com aparelho na troca (RD12)', () => {
    it('recusa com 409 aparelho aguardando avaliação, nomeando-o, sem gravar', async () => {
      prisma.usedDevice.findMany.mockResolvedValue([
        usedDeviceRow(),
        usedDeviceRow({
          id: 41,
          model: 'Apple Watch S6',
          serialNumber: 'GY7AAAAAAAA',
          evaluationStatus: 'AGUARDANDO',
          estimatedValue: null,
        }),
      ]);

      await expect(issue()).rejects.toBeInstanceOf(ConflictException);
      await expect(issue()).rejects.toThrow(
        'O aparelho Apple Watch S6 (série GY7AAAAAAAA) ainda aguarda avaliação',
      );
      expect(prisma.quotation.create).not.toHaveBeenCalled();
    });

    it('recusa com 409 Saldo a pagar negativo, sem gravar', async () => {
      prisma.usedDevice.findMany.mockResolvedValue([
        usedDeviceRow({ estimatedValue: decimal('1100.01') }),
      ]);

      await expect(issue()).rejects.toBeInstanceOf(ConflictException);
      await expect(issue()).rejects.toThrow('Saldo a pagar negativo');
      expect(prisma.quotation.create).not.toHaveBeenCalled();
    });

    it('só lê os aparelhos não excluídos da Negociação, dentro da transação', async () => {
      await issue();

      const { where } = callArg<{ where: Record<string, unknown> }>(
        prisma.usedDevice.findMany,
      );
      expect(where).toMatchObject({ deletedAt: null, negotiationId: 3 });
    });

    it('congela só os avaliados, copiando modelo, série e valor de troca; recusado fica de fora', async () => {
      prisma.usedDevice.findMany.mockResolvedValue([
        usedDeviceRow(),
        usedDeviceRow({
          id: 41,
          model: 'Apple Watch S6',
          serialNumber: 'GY7AAAAAAAA',
          evaluationStatus: 'RECUSADO',
          estimatedValue: null,
        }),
        usedDeviceRow({
          id: 42,
          model: 'iPad 9',
          serialNumber: 'DMPAAAAAAAA',
          estimatedValue: decimal('150.50'),
        }),
      ]);

      const result = await issue();

      const { data } = callArg<CreateArg>(prisma.quotation.create);
      expect(
        data.tradeIns.create.map((tradeIn) => ({
          ...tradeIn,
          tradeInValue: String(tradeIn.tradeInValue),
        })),
      ).toEqual([
        {
          usedDeviceId: 40,
          model: 'iPhone 12 128 GB',
          serialNumber: 'F2LXK0AAAAAA',
          tradeInValue: '300.00',
        },
        {
          usedDeviceId: 42,
          model: 'iPad 9',
          serialNumber: 'DMPAAAAAAAA',
          tradeInValue: '150.50',
        },
      ]);
      expect(result.tradeIns.map((tradeIn) => tradeIn.model)).toEqual([
        'iPhone 12 128 GB',
        'iPad 9',
      ]);
    });

    it('parcela sobre o Saldo a pagar e mantém o total à vista dos itens', async () => {
      // 1.100,00 − 300,00 = 800,00; 10x a 5% = 840,00.
      prisma.usedDevice.findMany.mockResolvedValue([usedDeviceRow()]);

      const result = await issue({ installments: 10 });

      const { data } = callArg<CreateArg>(prisma.quotation.create);
      expect(data.totalValue).toBe(1100);
      expect(data.totalWithInterest).toBe(840);
      expect(result).toMatchObject({
        totalValue: 1100,
        tradeInTotal: 300,
        amountDue: 800,
        totalWithInterest: 840,
        installmentValue: 84,
        firstInstallmentValue: 84,
      });
      expect(result.tradeIns).toEqual([
        {
          id: 200,
          usedDeviceId: 40,
          model: 'iPhone 12 128 GB',
          serialNumber: 'F2LXK0AAAAAA',
          tradeInValue: 300,
        },
      ]);
    });

    it('parcela base truncada sobre o saldo, com o resíduo na primeira', async () => {
      // 1.100,00 − 100,01 = 999,99; 12x a 3,33% = 1.033,29 → 86,10 e 86,19.
      prisma.usedDevice.findMany.mockResolvedValue([
        usedDeviceRow({ estimatedValue: decimal('100.01') }),
      ]);

      const result = await issue({ installments: 12, ratePercent: 3.33 });

      expect(result).toMatchObject({
        amountDue: 999.99,
        totalWithInterest: 1033.29,
        installmentValue: 86.1,
        firstInstallmentValue: 86.19,
      });
    });

    it('troca que zera o saldo emite com total parcelado zero', async () => {
      prisma.usedDevice.findMany.mockResolvedValue([
        usedDeviceRow({ estimatedValue: decimal('1100.00') }),
      ]);

      await expect(issue({ installments: 3 })).resolves.toMatchObject({
        amountDue: 0,
        totalWithInterest: 0,
      });
    });

    it('sem aparelhos, o saldo é o total à vista e não há linhas de troca', async () => {
      const result = await issue({ installments: 10 });

      const { data } = callArg<CreateArg>(prisma.quotation.create);
      expect(data.tradeIns.create).toEqual([]);
      expect(result).toMatchObject({ amountDue: 1100, tradeIns: [] });
    });

    it('não altera os aparelhos ao emitir', async () => {
      prisma.usedDevice.findMany.mockResolvedValue([usedDeviceRow()]);

      await issue();

      expect(prisma.usedDevice.update).not.toHaveBeenCalled();
      expect(prisma.usedDevice.updateMany).not.toHaveBeenCalled();
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

  describe('findOne', () => {
    const detailRow = (overrides: Record<string, unknown> = {}) => ({
      id: 7,
      negotiationId: 3,
      code: 'ORC-7',
      totalValue: decimal('11350.00'),
      installments: 12,
      ratePercent: decimal('0.00'),
      totalWithInterest: decimal('11350.00'),
      validUntil: new Date('2026-10-02T00:00:00Z'),
      createdAt: new Date('2026-09-22T12:00:00Z'),
      author: { id: 5, name: 'Outra Vendedora' },
      negotiation: {
        client: { id: 'c1', name: 'Fulana de Tal', anonymizedAt: null },
        vendedor: { id: 2, name: 'Vendedora Responsável' },
      },
      items: [
        {
          id: 100,
          quantity: 2,
          unitPrice: decimal('600.00'),
          discountType: 'PERCENTUAL',
          discountValue: decimal('10.00'),
          product: product('p1', 'iPhone 15 Pro'),
        },
      ],
      tradeIns: [],
      ...overrides,
    });

    it('devolve os dados congelados, os itens com nome e código do catálogo e a parcela com resíduo', async () => {
      prisma.quotation.findFirst.mockResolvedValue(detailRow());

      const result = await service.findOne(7);

      expect(
        callArg<{ where: Record<string, unknown> }>(prisma.quotation.findFirst)
          .where,
      ).toEqual({ id: 7, negotiation: { deletedAt: null } });
      expect(result).toMatchObject({
        id: 7,
        code: 'ORC-7',
        totalValue: 11350,
        installments: 12,
        totalWithInterest: 11350,
        installmentValue: 945.83,
        firstInstallmentValue: 945.87,
        validUntil: '2026-10-02',
        expired: false,
        author: { id: 5, name: 'Outra Vendedora' },
      });
      expect(result.items).toEqual([
        {
          id: 100,
          product: {
            id: 'p1',
            name: 'iPhone 15 Pro',
            sku: 'P1-SKU',
            status: 'ATIVO',
            deleted: false,
          },
          quantity: 2,
          unitPrice: 600,
          discountType: 'PERCENTUAL',
          discountValue: 10,
          discountAmount: 120,
          subtotal: 1080,
        },
      ]);
    });

    it('lê o Cliente e o vendedor responsável pela Negociação, não pelo autor (RQ12)', async () => {
      prisma.quotation.findFirst.mockResolvedValue(detailRow());

      const result = await service.findOne(7);

      expect(result.client).toEqual({
        id: 'c1',
        name: 'Fulana de Tal',
        anonymized: false,
      });
      expect(result.seller).toEqual({ id: 2, name: 'Vendedora Responsável' });
    });

    it('Cliente anonimizado pela LGPD aparece anonimizado', async () => {
      prisma.quotation.findFirst.mockResolvedValue(
        detailRow({
          negotiation: {
            client: {
              id: 'c1',
              name: 'Cliente anonimizado',
              anonymizedAt: new Date('2026-09-20T00:00:00Z'),
            },
            vendedor: { id: 2, name: 'Vendedora Responsável' },
          },
        }),
      );

      const result = await service.findOne(7);

      expect(result.client).toEqual({
        id: 'c1',
        name: 'Cliente anonimizado',
        anonymized: true,
      });
    });

    it('vencido continua consultável, com expired derivado (RQ10)', async () => {
      prisma.quotation.findFirst.mockResolvedValue(
        detailRow({ validUntil: new Date('2026-09-21T00:00:00Z') }),
      );

      await expect(service.findOne(7)).resolves.toMatchObject({
        expired: true,
      });
    });

    it('sem trocas, o saldo é o total à vista e a lista de trocas vem vazia', async () => {
      prisma.quotation.findFirst.mockResolvedValue(detailRow());

      await expect(service.findOne(7)).resolves.toMatchObject({
        totalValue: 11350,
        tradeInTotal: 0,
        amountDue: 11350,
        tradeIns: [],
      });
    });

    it('traz as trocas e o saldo lidos do que foi congelado, nunca dos aparelhos atuais (RD12)', async () => {
      prisma.quotation.findFirst.mockResolvedValue(
        detailRow({
          totalWithInterest: decimal('9350.00'),
          tradeIns: [
            {
              id: 200,
              usedDeviceId: 40,
              model: 'iPhone 12 128 GB',
              serialNumber: 'F2LXK0AAAAAA',
              tradeInValue: decimal('1500.00'),
            },
            {
              id: 201,
              usedDeviceId: null,
              model: 'Apple Watch S6',
              serialNumber: 'GY7AAAAAAAA',
              tradeInValue: decimal('500.00'),
            },
          ],
        }),
      );

      const result = await service.findOne(7);

      expect(prisma.usedDevice.findMany).not.toHaveBeenCalled();
      expect(result.tradeInTotal).toBe(2000);
      expect(result.amountDue).toBe(9350);
      expect(result.tradeIns).toEqual([
        {
          id: 200,
          usedDeviceId: 40,
          model: 'iPhone 12 128 GB',
          serialNumber: 'F2LXK0AAAAAA',
          tradeInValue: 1500,
        },
        {
          id: 201,
          usedDeviceId: null,
          model: 'Apple Watch S6',
          serialNumber: 'GY7AAAAAAAA',
          tradeInValue: 500,
        },
      ]);
    });

    it('reavaliar ou remover o aparelho depois da emissão não altera o emitido', async () => {
      prisma.usedDevice.findMany.mockResolvedValue([usedDeviceRow()]);
      const issued = await issue({ installments: 10 });
      const { data } = callArg<CreateArg>(prisma.quotation.create);

      // O Técnico reavalia para 900,00 e o Vendedor remove outro aparelho.
      prisma.usedDevice.findMany.mockResolvedValue([
        usedDeviceRow({ estimatedValue: decimal('900.00') }),
      ]);
      prisma.usedDevice.findMany.mockClear();
      prisma.quotation.findFirst.mockResolvedValue(
        detailRow({
          totalValue: decimal(data.totalValue.toFixed(2)),
          installments: data.installments,
          ratePercent: decimal(data.ratePercent.toFixed(2)),
          totalWithInterest: decimal(data.totalWithInterest.toFixed(2)),
          validUntil: data.validUntil,
          tradeIns: data.tradeIns.create.map((tradeIn, index) => ({
            id: 200 + index,
            ...tradeIn,
          })),
        }),
      );

      const reread = await service.findOne(7);

      expect(prisma.usedDevice.findMany).not.toHaveBeenCalled();
      expect(reread).toMatchObject({
        totalValue: issued.totalValue,
        amountDue: issued.amountDue,
        totalWithInterest: issued.totalWithInterest,
        installmentValue: issued.installmentValue,
        firstInstallmentValue: issued.firstInstallmentValue,
        tradeIns: issued.tradeIns,
      });
    });

    it('404 quando o Orçamento não existe', async () => {
      prisma.quotation.findFirst.mockResolvedValue(null);

      await expect(service.findOne(99)).rejects.toBeInstanceOf(
        NotFoundException,
      );
      await expect(service.findOne(99)).rejects.toThrow(
        'Orçamento não encontrado',
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

    it.each(['issue', 'findByNegotiation', 'findOne'] as const)(
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
