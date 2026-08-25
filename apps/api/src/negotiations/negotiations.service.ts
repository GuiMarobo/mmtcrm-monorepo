import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { NegotiationStatus } from '../../generated/prisma/enums';
import { NOT_DELETED, PrismaService } from '../prisma/prisma.service';
import {
  CreateNegotiationDto,
  PaymentMethodEnum,
} from './dto/create-negotiation.dto';
import { UpdateNegotiationDto } from './dto/update-negotiation.dto';
import { ReplaceNegotiationDto } from './dto/replace-negotiation.dto';

const negotiationSelect = {
  id: true,
  clientId: true,
  vendedorId: true,
  status: true,
  totalValue: true,
  notes: true,
  closedAt: true,
  createdAt: true,
  updatedAt: true,
  client: { select: { id: true, name: true, status: true } },
  vendedor: { select: { id: true, name: true } },
  order: {
    select: {
      id: true,
      code: true,
      status: true,
      paymentMethod: true,
      totalValue: true,
      deletedAt: true,
    },
  },
} satisfies Prisma.NegotiationSelect;

type NegotiationRow = Prisma.NegotiationGetPayload<{
  select: typeof negotiationSelect;
}>;

// A maquina de estados da spec 001 tem exatamente estas quatro arestas.
// Converter em pedido e o que torna a negociacao GANHA; nao existe "concluir".
const ALLOWED_TRANSITIONS: Record<NegotiationStatus, NegotiationStatus[]> = {
  ABERTA: ['GANHA', 'PERDIDA'],
  GANHA: ['ABERTA'],
  PERDIDA: ['ABERTA'],
};

@Injectable()
export class NegotiationsService {
  constructor(private readonly prisma: PrismaService) {}

  private toResponse(negotiation: NegotiationRow) {
    const { order, ...rest } = negotiation;
    return {
      ...rest,
      totalValue: Number(negotiation.totalValue),
      // O pedido so acompanha negociacao excluida logicamente; fora disso nunca
      // vem marcado. O guarda existe para o contrato nao mentir se vier.
      order:
        order && !order.deletedAt
          ? {
              id: order.id,
              code: order.code,
              status: order.status,
              paymentMethod: order.paymentMethod,
              totalValue: Number(order.totalValue),
            }
          : null,
    };
  }

  private assertTransition(from: NegotiationStatus, to: NegotiationStatus) {
    if (!ALLOWED_TRANSITIONS[from].includes(to)) {
      throw new ConflictException(
        `Não é possível passar de ${from} para ${to}. Reabra a negociação antes.`,
      );
    }
  }

  private async ensureExists(id: number) {
    const negotiation = await this.prisma.negotiation.findFirst({
      where: { ...NOT_DELETED, id },
      select: negotiationSelect,
    });
    if (!negotiation) throw new NotFoundException('Negociação não encontrada');
    return negotiation;
  }

  // Cliente anonimizado (LGPD) e imutavel: o historico comercial fica visivel,
  // mas nao aceita escrita. UC3 secao 3.6.
  private async ensureClientEditable(clientId: string) {
    const client = await this.prisma.client.findFirst({
      where: { ...NOT_DELETED, id: clientId },
      select: { id: true, status: true, anonymizedAt: true },
    });
    if (!client) throw new NotFoundException('Cliente não encontrado');
    if (client.anonymizedAt) {
      throw new ConflictException(
        'Cliente com dados pessoais eliminados (LGPD) não pode ter negociações alteradas',
      );
    }
    return client;
  }

  private ensureOpen(negotiation: NegotiationRow) {
    if (negotiation.status !== 'ABERTA') {
      throw new ConflictException(
        'Só é possível alterar os dados de uma negociação em aberto',
      );
    }
  }

  async create(dto: CreateNegotiationDto, vendedorId: number) {
    await this.ensureClientEditable(dto.clientId);

    const negotiation = await this.prisma.negotiation.create({
      data: {
        clientId: dto.clientId,
        vendedorId,
        status: 'ABERTA',
        totalValue: dto.totalValue,
        notes: dto.notes,
      },
      select: negotiationSelect,
    });

    return this.toResponse(negotiation);
  }

  async findAll() {
    const negotiations = await this.prisma.negotiation.findMany({
      where: { ...NOT_DELETED },
      select: negotiationSelect,
      orderBy: { updatedAt: 'desc' },
    });
    return negotiations.map((negotiation) => this.toResponse(negotiation));
  }

  async findOne(id: number) {
    return this.toResponse(await this.ensureExists(id));
  }

  async replace(id: number, dto: ReplaceNegotiationDto) {
    const current = await this.ensureExists(id);
    this.ensureOpen(current);
    await this.ensureClientEditable(dto.clientId);

    const negotiation = await this.prisma.negotiation.update({
      where: { id },
      data: {
        clientId: dto.clientId,
        totalValue: dto.totalValue,
        notes: dto.notes ?? null,
      },
      select: negotiationSelect,
    });

    return this.toResponse(negotiation);
  }

  async updatePartial(id: number, dto: UpdateNegotiationDto) {
    if (!dto || Object.keys(dto).length === 0) {
      throw new BadRequestException('PATCH requer ao menos um campo');
    }

    const current = await this.ensureExists(id);
    this.ensureOpen(current);
    await this.ensureClientEditable(dto.clientId ?? current.clientId);

    const negotiation = await this.prisma.negotiation.update({
      where: { id },
      data: dto,
      select: negotiationSelect,
    });

    return this.toResponse(negotiation);
  }

  async remove(id: number) {
    const negotiation = await this.ensureExists(id);
    const result = this.toResponse(negotiation);
    const deletedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      await tx.order.updateMany({
        where: { ...NOT_DELETED, negotiationId: id },
        data: { deletedAt },
      });
      await tx.negotiation.update({ where: { id }, data: { deletedAt } });
    });

    return result;
  }

  async cancel(id: number) {
    const negotiation = await this.ensureExists(id);
    await this.ensureClientEditable(negotiation.clientId);
    this.assertTransition(negotiation.status, 'PERDIDA');

    const updated = await this.prisma.negotiation.update({
      where: { id },
      data: { status: 'PERDIDA', closedAt: new Date() },
      select: negotiationSelect,
    });

    return this.toResponse(updated);
  }

  async convert(id: number, paymentMethod: PaymentMethodEnum) {
    const negotiation = await this.ensureExists(id);
    const client = await this.ensureClientEditable(negotiation.clientId);
    this.assertTransition(negotiation.status, 'GANHA');

    const closedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      // upsert, e nao create: reabrir preserva o pedido como DESISTENCIA, entao
      // reconverter reaproveita a mesma linha em vez de colidir com o @unique.
      await tx.order.upsert({
        where: { negotiationId: id },
        create: {
          negotiationId: id,
          code: `PED-${id}`,
          status: 'COMPRA_APROVADA',
          paymentMethod,
          totalValue: negotiation.totalValue,
        },
        update: {
          status: 'COMPRA_APROVADA',
          paymentMethod,
          totalValue: negotiation.totalValue,
          deletedAt: null,
        },
      });

      await tx.negotiation.update({
        where: { id },
        data: { status: 'GANHA', closedAt },
      });

      // Invariante do dominio: cliente com faturamento e, por definicao, ATIVO.
      if (client.status !== 'ATIVO') {
        await tx.client.update({
          where: { id: client.id },
          data: { status: 'ATIVO' },
        });
      }
    });

    return this.findOne(id);
  }

  async reopen(id: number) {
    const negotiation = await this.ensureExists(id);
    await this.ensureClientEditable(negotiation.clientId);
    this.assertTransition(negotiation.status, 'ABERTA');

    const wasWon = negotiation.status === 'GANHA';

    await this.prisma.$transaction(async (tx) => {
      if (wasWon) {
        await tx.order.updateMany({
          where: { ...NOT_DELETED, negotiationId: id },
          data: { status: 'DESISTENCIA' },
        });
      }

      await tx.negotiation.update({
        where: { id },
        data: { status: 'ABERTA', closedAt: null },
      });
    });

    return this.findOne(id);
  }
}
