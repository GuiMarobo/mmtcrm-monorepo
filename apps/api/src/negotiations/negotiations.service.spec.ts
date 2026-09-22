import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { PrismaService } from '../prisma/prisma.service';
import { NegotiationsService } from './negotiations.service';
import { PaymentMethodEnum } from './dto/create-negotiation.dto';
import { RoleEnum } from '../users/dto/create-user.dto';
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
  items: [],
  _count: { items: 0 },
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
      await service.convert(3, PaymentMethodEnum.PIX, 42);
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

      await service.convert(3, PaymentMethodEnum.PIX, 42);

      expect(prisma.client.update).toHaveBeenCalledWith({
        where: { id: 'c1' },
        data: { status: 'ATIVO' },
      });
    });
  });

  describe('reopen', () => {
    const order = (status: string) => ({
      id: 9,
      code: 'PED-3',
      status,
      paymentMethod: 'PIX',
      totalValue: { toString: () => '1500.00' },
      deletedAt: null,
    });

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
        negotiationRow({ status: 'GANHA', order: order('EM_NEGOCIACAO') }),
      );

      const before = Date.now();
      await service.reopen(3, RoleEnum.VENDEDOR, 42);
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

      await service.reopen(3, RoleEnum.VENDEDOR, 42);

      expect(prisma.order.updateMany).not.toHaveBeenCalled();
    });

    it('VENDEDOR não reabre Negociação de Pedido COMPRA_APROVADA → 403 (RN11)', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(
        negotiationRow({ status: 'GANHA', order: order('COMPRA_APROVADA') }),
      );

      await expect(
        service.reopen(3, RoleEnum.VENDEDOR, 42),
      ).rejects.toBeInstanceOf(ForbiddenException);
      await expect(service.reopen(3, RoleEnum.VENDEDOR, 42)).rejects.toThrow(
        'Venda com pagamento confirmado só pode ser reaberta por um administrador',
      );
      expect(prisma.negotiation.update).not.toHaveBeenCalled();
    });

    it('ADMIN reabre Negociação de Pedido COMPRA_APROVADA (RN11)', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(
        negotiationRow({ status: 'GANHA', order: order('COMPRA_APROVADA') }),
      );

      await service.reopen(3, RoleEnum.ADMIN, 42);

      expect(prisma.negotiation.update).toHaveBeenCalled();
      const arg = callArg<{ data: { status: string } }>(
        prisma.order.updateMany,
      );
      expect(arg.data.status).toBe('DESISTENCIA');
    });

    it('Pedido EM_NEGOCIACAO: VENDEDOR reabre normalmente (sem regressão, RN11)', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(
        negotiationRow({ status: 'GANHA', order: order('EM_NEGOCIACAO') }),
      );

      await service.reopen(3, RoleEnum.VENDEDOR, 42);

      expect(prisma.negotiation.update).toHaveBeenCalled();
    });
  });

  // RN12 / ADR 0012: a anonimização LGPD não congela o ciclo comercial. As
  // transições e a edição de uma Negociação existente seguem liberadas — só o
  // cadastro pessoal e abrir/transferir Negociação para o titular continuam
  // bloqueados. `ensureClientEditable` faz exatamente uma query de client.
  describe('LGPD não bloqueia o ciclo comercial (RN12)', () => {
    beforeEach(() => {
      prisma.negotiation.update.mockResolvedValue({});
      prisma.order.upsert.mockResolvedValue({});
      prisma.order.updateMany.mockResolvedValue({});
      prisma.client.update.mockResolvedValue({});
    });

    it('convert não checa o Cliente (nem anonimização)', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(negotiationRow());

      await service.convert(3, PaymentMethodEnum.PIX, 42);

      expect(prisma.client.findFirst).not.toHaveBeenCalled();
    });

    it('cancel não checa o Cliente', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(negotiationRow());

      await service.cancel(3);

      expect(prisma.client.findFirst).not.toHaveBeenCalled();
    });

    it('reopen não checa o Cliente', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(
        negotiationRow({ status: 'GANHA', order: null }),
      );

      await service.reopen(3, RoleEnum.VENDEDOR, 42);

      expect(prisma.client.findFirst).not.toHaveBeenCalled();
    });

    it('editar a Negociação sem trocar o Cliente não o checa', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(negotiationRow());

      await service.updatePartial(3, { totalValue: 2000 });

      expect(prisma.client.findFirst).not.toHaveBeenCalled();
    });

    it('trocar o clientId na edição volta a checar o Cliente destino', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(negotiationRow());
      prisma.client.findFirst.mockResolvedValue({
        id: 'c2',
        status: 'LEAD',
        anonymizedAt: null,
      });

      await service.updatePartial(3, { clientId: 'c2' });

      expect(prisma.client.findFirst).toHaveBeenCalledTimes(1);
    });

    it('create continua checando o Cliente', async () => {
      prisma.client.findFirst.mockResolvedValue({
        id: 'c1',
        status: 'LEAD',
        anonymizedAt: null,
      });
      prisma.negotiation.create.mockResolvedValue(negotiationRow());

      await service.create({ clientId: 'c1', items: [] }, 2);

      expect(prisma.client.findFirst).toHaveBeenCalledTimes(1);
    });
  });

  describe('create — compor itens ao criar (RI2-RI4, RI7-RI9, ticket 03)', () => {
    beforeEach(() => {
      prisma.client.findFirst.mockResolvedValue({
        id: 'c1',
        status: 'LEAD',
        anonymizedAt: null,
      });
      prisma.negotiation.create.mockResolvedValue(negotiationRow());
    });

    it('cria sem itens com total R$ 0,00 e não consulta o catálogo (RI8)', async () => {
      await service.create({ clientId: 'c1', items: [] }, 2);

      const arg = callArg<{ data: { totalValue: number } }>(
        prisma.negotiation.create,
      );
      expect(arg.data.totalValue).toBe(0);
      expect(prisma.product.findMany).not.toHaveBeenCalled();
    });

    it('cria com um item copiando o preço do Produto e somando o total (RI4/RI7)', async () => {
      const price = { toString: () => '799.90' };
      prisma.product.findMany.mockResolvedValue([{ id: 'p1', price }]);

      await service.create(
        { clientId: 'c1', items: [{ productId: 'p1', quantity: 2 }] },
        2,
      );

      const arg = callArg<{
        data: {
          totalValue: number;
          items: {
            create: {
              productId: string;
              quantity: number;
              unitPrice: unknown;
            }[];
          };
        };
      }>(prisma.negotiation.create);
      expect(arg.data.items.create).toEqual([
        { productId: 'p1', quantity: 2, unitPrice: price },
      ]);
      expect(arg.data.totalValue).toBe(1599.8);
    });

    it('cria com vários itens somando os subtotais', async () => {
      prisma.product.findMany.mockResolvedValue([
        { id: 'p1', price: { toString: () => '100.00' } },
        { id: 'p2', price: { toString: () => '50.00' } },
      ]);

      await service.create(
        {
          clientId: 'c1',
          items: [
            { productId: 'p1', quantity: 2 },
            { productId: 'p2', quantity: 3 },
          ],
        },
        2,
      );

      const arg = callArg<{ data: { totalValue: number } }>(
        prisma.negotiation.create,
      );
      expect(arg.data.totalValue).toBe(350);
    });

    it('recusa Produto inativo ou excluído, sem gravar nada (RI2)', async () => {
      prisma.product.findMany.mockResolvedValue([]);

      await expect(
        service.create(
          { clientId: 'c1', items: [{ productId: 'fantasma', quantity: 1 }] },
          2,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.negotiation.create).not.toHaveBeenCalled();
    });

    it('recusa Produto repetido no mesmo envio antes de precificar (RI3)', async () => {
      await expect(
        service.create(
          {
            clientId: 'c1',
            items: [
              { productId: 'p1', quantity: 1 },
              { productId: 'p1', quantity: 2 },
            ],
          },
          2,
        ),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.product.findMany).not.toHaveBeenCalled();
      expect(prisma.negotiation.create).not.toHaveBeenCalled();
    });
  });

  describe('findOne — detalhe com itens (ticket 03)', () => {
    it('devolve os itens não excluídos com Produto, quantidade, preço e subtotal', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(
        negotiationRow({
          items: [
            {
              id: 1,
              quantity: 2,
              unitPrice: { toString: () => '100.00' },
              product: {
                id: 'p1',
                name: 'iPhone 15 Pro',
                sku: 'IP15P',
                status: 'ATIVO',
                deletedAt: null,
              },
            },
          ],
        }),
      );

      const result = await service.findOne(3);

      expect(result.items).toEqual([
        {
          id: 1,
          product: {
            id: 'p1',
            name: 'iPhone 15 Pro',
            sku: 'IP15P',
            status: 'ATIVO',
            deleted: false,
          },
          quantity: 2,
          unitPrice: 100,
          subtotal: 200,
        },
      ]);
    });

    it('marca o item como excluído quando o Produto foi excluído do catálogo (RI2)', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(
        negotiationRow({
          items: [
            {
              id: 1,
              quantity: 1,
              unitPrice: { toString: () => '100.00' },
              product: {
                id: 'p1',
                name: 'iPhone 15 Pro',
                sku: 'IP15P',
                status: 'ATIVO',
                deletedAt: new Date('2026-09-20T00:00:00Z'),
              },
            },
          ],
        }),
      );

      const result = await service.findOne(3);

      expect(result.items[0].product.deleted).toBe(true);
    });

    it('conta itens excluídos para saber se a Negociação já teve itens (RI8/RI9, ticket 05)', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(negotiationRow());

      await service.findOne(3);

      expect(
        callArg<{ select: { _count: unknown } }>(prisma.negotiation.findFirst)
          .select._count,
      ).toEqual({ select: { items: true } });
    });

    it('Negociação que nunca teve item (antiga ou importada) expõe o valor informado', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(
        negotiationRow({ _count: { items: 0 } }),
      );

      const result = await service.findOne(3);

      expect(result.informedValue).toBe(1500);
      expect(result).not.toHaveProperty('_count');
    });

    it('Negociação cujos itens foram todos removidos não volta ao valor informado (RI9)', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(
        negotiationRow({
          totalValue: { toString: () => '0.00' },
          items: [],
          _count: { items: 2 },
        }),
      );

      const result = await service.findOne(3);

      expect(result.informedValue).toBeNull();
    });

    it('Negociação com itens não tem valor informado', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(
        negotiationRow({ _count: { items: 1 } }),
      );

      const result = await service.findOne(3);

      expect(result.informedValue).toBeNull();
    });

    it('Negociação nova criada sem itens (R$ 0,00) não tem valor informado a preservar (RI8)', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(
        negotiationRow({
          totalValue: { toString: () => '0.00' },
          _count: { items: 0 },
        }),
      );

      const result = await service.findOne(3);

      expect(result.informedValue).toBeNull();
    });
  });

  describe('replace — editar itens de Negociação Aberta (RI4, RI9, RI10, ticket 04)', () => {
    beforeEach(() => {
      prisma.negotiation.update.mockResolvedValue(negotiationRow());
    });

    it('recusa editar Negociação não-Aberta (ensureOpen)', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(
        negotiationRow({ status: 'GANHA' }),
      );

      await expect(
        service.replace(3, { clientId: 'c1', items: [] }),
      ).rejects.toBeInstanceOf(ConflictException);
      expect(prisma.negotiation.update).not.toHaveBeenCalled();
    });

    it('adiciona um item novo copiando o preço do Produto (RI4)', async () => {
      const price = { toString: () => '100.00' };
      prisma.negotiation.findFirst.mockResolvedValue(negotiationRow());
      prisma.negotiationItem.findMany.mockResolvedValue([]);
      prisma.product.findMany.mockResolvedValue([{ id: 'p1', price }]);
      prisma.negotiationItem.createMany.mockResolvedValue({ count: 1 });

      await service.replace(3, {
        clientId: 'c1',
        items: [{ productId: 'p1', quantity: 2 }],
      });

      expect(prisma.negotiationItem.createMany).toHaveBeenCalledWith({
        data: [
          {
            productId: 'p1',
            quantity: 2,
            unitPrice: price,
            negotiationId: 3,
          },
        ],
      });
      const arg = callArg<{ data: { totalValue: number } }>(
        prisma.negotiation.update,
      );
      expect(arg.data.totalValue).toBe(200);
    });

    it('mantém o item (mesma quantidade) sem regravar preço nem quantidade', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(negotiationRow());
      prisma.negotiationItem.findMany.mockResolvedValue([
        {
          id: 10,
          productId: 'p1',
          quantity: 2,
          unitPrice: { toString: () => '100.00' },
        },
      ]);

      await service.replace(3, {
        clientId: 'c1',
        items: [{ productId: 'p1', quantity: 2 }],
      });

      expect(prisma.negotiationItem.update).not.toHaveBeenCalled();
      expect(prisma.negotiationItem.updateMany).not.toHaveBeenCalled();
      expect(prisma.product.findMany).not.toHaveBeenCalled();
      const arg = callArg<{ data: { totalValue: number } }>(
        prisma.negotiation.update,
      );
      expect(arg.data.totalValue).toBe(200);
    });

    it('altera a quantidade de um item preservando o preço praticado', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(negotiationRow());
      prisma.negotiationItem.findMany.mockResolvedValue([
        {
          id: 10,
          productId: 'p1',
          quantity: 2,
          unitPrice: { toString: () => '100.00' },
          product: { name: 'iPhone 15 Pro', sku: 'IP15P-256', deletedAt: null },
        },
      ]);

      await service.replace(3, {
        clientId: 'c1',
        items: [{ productId: 'p1', quantity: 5 }],
      });

      expect(prisma.negotiationItem.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { quantity: 5 },
      });
      const arg = callArg<{ data: { totalValue: number } }>(
        prisma.negotiation.update,
      );
      expect(arg.data.totalValue).toBe(500);
    });

    it('remove um item que saiu da lista por exclusão lógica e refaz a soma', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(negotiationRow());
      prisma.negotiationItem.findMany.mockResolvedValue([
        {
          id: 10,
          productId: 'p1',
          quantity: 2,
          unitPrice: { toString: () => '100.00' },
        },
        {
          id: 11,
          productId: 'p2',
          quantity: 1,
          unitPrice: { toString: () => '50.00' },
        },
      ]);

      await service.replace(3, {
        clientId: 'c1',
        items: [{ productId: 'p1', quantity: 2 }],
      });

      expect(prisma.negotiationItem.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [11] } },
        data: { deletedAt: expect.any(Date) as Date },
      });
      const arg = callArg<{ data: { totalValue: number } }>(
        prisma.negotiation.update,
      );
      expect(arg.data.totalValue).toBe(200);
    });

    it('remover o último item deixa o total em R$ 0,00 (RI9)', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(negotiationRow());
      prisma.negotiationItem.findMany.mockResolvedValue([
        {
          id: 10,
          productId: 'p1',
          quantity: 2,
          unitPrice: { toString: () => '100.00' },
        },
      ]);

      await service.replace(3, { clientId: 'c1', items: [] });

      expect(prisma.negotiationItem.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [10] } },
        data: { deletedAt: expect.any(Date) as Date },
      });
      const arg = callArg<{ data: { totalValue: number } }>(
        prisma.negotiation.update,
      );
      expect(arg.data.totalValue).toBe(0);
    });

    it('Negociação sem itens desde sempre mantém o valor informado (RI8)', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(
        negotiationRow({ totalValue: { toString: () => '1500.00' } }),
      );
      prisma.negotiationItem.findMany.mockResolvedValue([]);

      await service.replace(3, { clientId: 'c1', items: [] });

      const arg = callArg<{ data: Record<string, unknown> }>(
        prisma.negotiation.update,
      );
      expect(arg.data.totalValue).toBeUndefined();
    });

    it('recusa Produto repetido no envio (RI3), sem gravar nada', async () => {
      prisma.negotiation.findFirst.mockResolvedValue(negotiationRow());

      await expect(
        service.replace(3, {
          clientId: 'c1',
          items: [
            { productId: 'p1', quantity: 1 },
            { productId: 'p1', quantity: 2 },
          ],
        }),
      ).rejects.toBeInstanceOf(BadRequestException);
      expect(prisma.negotiation.update).not.toHaveBeenCalled();
    });
  });

  describe('validações do item — recusas com Produto e motivo (RI2, RI3, RI5, ticket 06)', () => {
    const catalogProduct = (overrides: Record<string, unknown> = {}) => ({
      id: 'p1',
      name: 'iPhone 15 Pro',
      sku: 'IP15P-256',
      status: 'ATIVO',
      deletedAt: null,
      ...overrides,
    });

    beforeEach(() => {
      prisma.client.findFirst.mockResolvedValue({
        id: 'c1',
        status: 'LEAD',
        anonymizedAt: null,
      });
      prisma.negotiation.findFirst.mockResolvedValue(negotiationRow());
      prisma.negotiationItem.findMany.mockResolvedValue([]);
    });

    const expectNothingWritten = () => {
      expect(prisma.negotiation.create).not.toHaveBeenCalled();
      expect(prisma.negotiation.update).not.toHaveBeenCalled();
      expect(prisma.negotiationItem.createMany).not.toHaveBeenCalled();
      expect(prisma.negotiationItem.update).not.toHaveBeenCalled();
      expect(prisma.negotiationItem.updateMany).not.toHaveBeenCalled();
    };

    const write = {
      create: (items: { productId: string; quantity: number }[]) =>
        service.create({ clientId: 'c1', items }, 2),
      replace: (items: { productId: string; quantity: number }[]) =>
        service.replace(3, { clientId: 'c1', items }),
    };

    describe.each(['create', 'replace'] as const)('%s', (operation) => {
      it('recusa Produto descontinuado, nomeando o Produto (RI2)', async () => {
        prisma.product.findMany.mockResolvedValue([]);
        prisma.product.findFirst.mockResolvedValue(
          catalogProduct({ status: 'INATIVO' }),
        );

        const attempt = write[operation]([{ productId: 'p1', quantity: 1 }]);

        await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
        await expect(attempt).rejects.toThrow(
          'O Produto iPhone 15 Pro (IP15P-256) está descontinuado e não pode ser adicionado',
        );
        expectNothingWritten();
      });

      it('recusa Produto excluído do catálogo, nomeando o Produto (RI2)', async () => {
        prisma.product.findMany.mockResolvedValue([]);
        prisma.product.findFirst.mockResolvedValue(
          catalogProduct({ deletedAt: new Date('2026-09-01T00:00:00Z') }),
        );

        const attempt = write[operation]([{ productId: 'p1', quantity: 1 }]);

        await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
        await expect(attempt).rejects.toThrow(
          'O Produto iPhone 15 Pro (IP15P-256) foi excluído do catálogo e não pode ser adicionado',
        );
        expectNothingWritten();
      });

      it('recusa Produto que não existe no catálogo (RI2)', async () => {
        prisma.product.findMany.mockResolvedValue([]);
        prisma.product.findFirst.mockResolvedValue(null);

        const attempt = write[operation]([
          { productId: 'fantasma', quantity: 1 },
        ]);

        await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
        await expect(attempt).rejects.toThrow(
          'O Produto fantasma não existe no catálogo',
        );
        expectNothingWritten();
      });

      it('recusa Produto repetido, nomeando o Produto (RI3)', async () => {
        prisma.product.findFirst.mockResolvedValue(catalogProduct());

        const attempt = write[operation]([
          { productId: 'p1', quantity: 1 },
          { productId: 'p1', quantity: 2 },
        ]);

        await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
        await expect(attempt).rejects.toThrow(
          'O Produto iPhone 15 Pro (IP15P-256) aparece mais de uma vez — aumente a quantidade em vez de repetir o Produto',
        );
        expectNothingWritten();
      });

      it.each([0, -1, 1.5])(
        'recusa quantidade %p, nomeando o Produto (RI5)',
        async (quantity) => {
          prisma.product.findFirst.mockResolvedValue(catalogProduct());

          const attempt = write[operation]([{ productId: 'p1', quantity }]);

          await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
          await expect(attempt).rejects.toThrow(
            'Quantidade inválida para o Produto iPhone 15 Pro (IP15P-256): informe um número inteiro maior ou igual a 1',
          );
          expectNothingWritten();
        },
      );
    });

    it('replace recusa quantidade inválida também em item já gravado (RI5)', async () => {
      prisma.negotiationItem.findMany.mockResolvedValue([
        {
          id: 10,
          productId: 'p1',
          quantity: 2,
          unitPrice: { toString: () => '100.00' },
        },
      ]);
      prisma.product.findFirst.mockResolvedValue(catalogProduct());

      await expect(
        service.replace(3, {
          clientId: 'c1',
          items: [{ productId: 'p1', quantity: 0 }],
        }),
      ).rejects.toThrow(/Quantidade inválida para o Produto iPhone 15 Pro/);
      expectNothingWritten();
    });
  });
  describe('item de Produto descontinuado ou excluído depois de gravado (RI2, ticket 07)', () => {
    const savedItem = (product: Record<string, unknown>) => ({
      id: 10,
      productId: 'p1',
      quantity: 2,
      unitPrice: { toString: () => '100.00' },
      product: {
        name: 'iPhone 15 Pro',
        sku: 'IP15P-256',
        deletedAt: null,
        ...product,
      },
    });
    const deletedAt = new Date('2026-09-01T00:00:00Z');

    beforeEach(() => {
      prisma.negotiation.findFirst.mockResolvedValue(negotiationRow());
      prisma.negotiation.update.mockResolvedValue(negotiationRow());
    });

    it('item de Produto descontinuado aceita alterar a quantidade, com o preço congelado', async () => {
      prisma.negotiationItem.findMany.mockResolvedValue([
        savedItem({ status: 'INATIVO' }),
      ]);

      await service.replace(3, {
        clientId: 'c1',
        items: [{ productId: 'p1', quantity: 4 }],
      });

      expect(prisma.negotiationItem.update).toHaveBeenCalledWith({
        where: { id: 10 },
        data: { quantity: 4 },
      });
      expect(prisma.product.findMany).not.toHaveBeenCalled();
      const arg = callArg<{ data: { totalValue: number } }>(
        prisma.negotiation.update,
      );
      expect(arg.data.totalValue).toBe(400);
    });

    it('item de Produto excluído recusa alterar a quantidade, sem gravar nada', async () => {
      prisma.negotiationItem.findMany.mockResolvedValue([
        savedItem({ deletedAt }),
        { ...savedItem({}), id: 11, productId: 'p2' },
      ]);

      const attempt = service.replace(3, {
        clientId: 'c1',
        items: [{ productId: 'p1', quantity: 3 }],
      });

      await expect(attempt).rejects.toBeInstanceOf(BadRequestException);
      await expect(attempt).rejects.toThrow(
        'O Produto iPhone 15 Pro (IP15P-256) foi excluído do catálogo: o item só pode ser mantido como está ou removido',
      );
      expect(prisma.negotiationItem.update).not.toHaveBeenCalled();
      expect(prisma.negotiationItem.updateMany).not.toHaveBeenCalled();
      expect(prisma.negotiationItem.createMany).not.toHaveBeenCalled();
      expect(prisma.negotiation.update).not.toHaveBeenCalled();
    });

    it('item de Produto excluído pode ser mantido como está', async () => {
      prisma.negotiationItem.findMany.mockResolvedValue([
        savedItem({ deletedAt }),
      ]);

      await service.replace(3, {
        clientId: 'c1',
        items: [{ productId: 'p1', quantity: 2 }],
      });

      expect(prisma.negotiationItem.update).not.toHaveBeenCalled();
      const arg = callArg<{ data: { totalValue: number } }>(
        prisma.negotiation.update,
      );
      expect(arg.data.totalValue).toBe(200);
    });

    it('item de Produto excluído pode ser removido', async () => {
      prisma.negotiationItem.findMany.mockResolvedValue([
        savedItem({ deletedAt }),
      ]);

      await service.replace(3, { clientId: 'c1', items: [] });

      expect(prisma.negotiationItem.updateMany).toHaveBeenCalledWith({
        where: { id: { in: [10] } },
        data: { deletedAt: expect.any(Date) as Date },
      });
      const arg = callArg<{ data: { totalValue: number } }>(
        prisma.negotiation.update,
      );
      expect(arg.data.totalValue).toBe(0);
    });
  });
});
