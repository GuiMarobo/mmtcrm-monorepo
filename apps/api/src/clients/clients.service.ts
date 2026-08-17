import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { NOT_DELETED, PrismaService } from '../prisma/prisma.service';
import { CreateClientDto } from './dto/create-client.dto';
import { UpdateClientDto } from './dto/update-client.dto';
import { ReplaceClientDto } from './dto/replace-client.dto';
import { LeadQualificationEnum } from './dto/create-client.dto';

@Injectable()
export class ClientsService {
  private readonly clientSelect = {
    id: true,
    name: true,
    email: true,
    phone: true,
    cpf: true,
    address: true,
    status: true,
    qualification: true,
    origin: true,
    notes: true,
    lastContactAt: true,
    createdAt: true,
    updatedAt: true,
    anonymizedAt: true,
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  private async metricsFor(clientId: string) {
    const [neg] = await this.prisma.$queryRaw<{ count: number }[]>`
      SELECT COUNT(id)::int AS count
      FROM negotiations
      WHERE client_id = ${clientId}
        AND deleted_at IS NULL
    `;

    const [ord] = await this.prisma.$queryRaw<
      { orders_count: number; revenue: number }[]
    >`
      SELECT COUNT(o.id)::int AS orders_count,
             COALESCE(SUM(o.total_value), 0)::float8 AS revenue
      FROM orders o
      JOIN negotiations n ON n.id = o.negotiation_id AND n.deleted_at IS NULL
      WHERE n.client_id = ${clientId}
        AND o.status = 'COMPRA_APROVADA'
        AND o.deleted_at IS NULL
    `;

    return {
      negotiationsCount: neg?.count ?? 0,
      ordersCount: ord?.orders_count ?? 0,
      revenue: ord?.revenue ?? 0,
    };
  }

  private async withMetrics<T extends { id: string }>(client: T) {
    return { ...client, ...(await this.metricsFor(client.id)) };
  }

  async create(dto: CreateClientDto) {
    if (dto.cpf) {
      const existing = await this.prisma.client.findFirst({
        where: { ...NOT_DELETED, cpf: dto.cpf },
      });
      if (existing) throw new ConflictException('CPF já cadastrado');
    }

    const client = await this.prisma.client.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        cpf: dto.cpf,
        address: dto.address,
        status: dto.status,
        qualification: dto.qualification,
        origin: dto.origin,
        notes: dto.notes,
      },
      select: this.clientSelect,
    });

    return { ...client, negotiationsCount: 0, ordersCount: 0, revenue: 0 };
  }

  async findAll() {
    const clients = await this.prisma.client.findMany({
      where: { ...NOT_DELETED },
      select: this.clientSelect,
      orderBy: { createdAt: 'desc' },
    });

    const negotiations = await this.prisma.$queryRaw<
      { client_id: string; count: number }[]
    >`
      SELECT client_id, COUNT(id)::int AS count
      FROM negotiations
      WHERE deleted_at IS NULL
      GROUP BY client_id
    `;

    const orders = await this.prisma.$queryRaw<
      { client_id: string; orders_count: number; revenue: number }[]
    >`
      SELECT n.client_id,
             COUNT(o.id)::int AS orders_count,
             COALESCE(SUM(o.total_value), 0)::float8 AS revenue
      FROM orders o
      JOIN negotiations n ON n.id = o.negotiation_id AND n.deleted_at IS NULL
      WHERE o.status = 'COMPRA_APROVADA'
        AND o.deleted_at IS NULL
      GROUP BY n.client_id
    `;

    const negByClient = new Map(
      negotiations.map((row) => [row.client_id, row.count]),
    );
    const ordByClient = new Map(orders.map((row) => [row.client_id, row]));

    return clients.map((client) => {
      const ord = ordByClient.get(client.id);
      return {
        ...client,
        negotiationsCount: negByClient.get(client.id) ?? 0,
        ordersCount: ord ? ord.orders_count : 0,
        revenue: ord ? ord.revenue : 0,
      };
    });
  }

  private async ensureExists(id: string) {
    const client = await this.prisma.client.findFirst({
      where: { ...NOT_DELETED, id },
      select: this.clientSelect,
    });
    if (!client) throw new NotFoundException('Cliente não encontrado');
    return client;
  }

  private async ensureEditable(id: string) {
    const client = await this.ensureExists(id);
    if (client.anonymizedAt) {
      throw new ConflictException(
        'Cliente com dados pessoais eliminados (LGPD) não pode ser alterado',
      );
    }
    return client;
  }

  async findOne(id: string) {
    return this.withMetrics(await this.ensureExists(id));
  }

  async replace(id: string, dto: ReplaceClientDto) {
    await this.ensureEditable(id);

    if (dto.cpf) {
      const existing = await this.prisma.client.findFirst({
        where: { ...NOT_DELETED, cpf: dto.cpf, NOT: { id } },
      });
      if (existing) throw new ConflictException('CPF já cadastrado');
    }

    const client = await this.prisma.client.update({
      where: { id },
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        cpf: dto.cpf,
        address: dto.address,
        status: dto.status,
        qualification: dto.qualification,
        origin: dto.origin,
        notes: dto.notes,
      },
      select: this.clientSelect,
    });

    return this.withMetrics(client);
  }

  async updatePartial(id: string, dto: UpdateClientDto) {
    if (!dto || Object.keys(dto).length === 0) {
      throw new BadRequestException('PATCH requer ao menos um campo');
    }

    if ('name' in dto && !dto.name?.trim()) {
      throw new BadRequestException('O nome não pode ficar em branco');
    }
    if ('phone' in dto && !dto.phone?.trim()) {
      throw new BadRequestException('O telefone não pode ficar em branco');
    }

    await this.ensureEditable(id);

    if (dto.cpf) {
      const existing = await this.prisma.client.findFirst({
        where: { ...NOT_DELETED, cpf: dto.cpf, NOT: { id } },
      });
      if (existing) throw new ConflictException('CPF já cadastrado');
    }

    const client = await this.prisma.client.update({
      where: { id },
      data: dto,
      select: this.clientSelect,
    });

    return this.withMetrics(client);
  }

  async remove(id: string) {
    const client = await this.ensureExists(id);
    const result = await this.withMetrics(client);
    const deletedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      const negotiations = await tx.negotiation.findMany({
        where: { ...NOT_DELETED, clientId: id },
        select: { id: true },
      });
      const negotiationIds = negotiations.map((negotiation) => negotiation.id);

      if (negotiationIds.length > 0) {
        await tx.order.updateMany({
          where: { ...NOT_DELETED, negotiationId: { in: negotiationIds } },
          data: { deletedAt },
        });
        await tx.negotiation.updateMany({
          where: { id: { in: negotiationIds } },
          data: { deletedAt },
        });
      }

      await tx.client.update({ where: { id }, data: { deletedAt } });
    });

    return result;
  }

  async qualify(id: string, qualification: LeadQualificationEnum) {
    await this.ensureEditable(id);
    const client = await this.prisma.client.update({
      where: { id },
      data: { qualification },
      select: this.clientSelect,
    });
    return this.withMetrics(client);
  }

  async registerContact(id: string) {
    await this.ensureEditable(id);
    const client = await this.prisma.client.update({
      where: { id },
      data: { lastContactAt: new Date() },
      select: this.clientSelect,
    });
    return this.withMetrics(client);
  }

  async activate(id: string) {
    await this.ensureEditable(id);
    const client = await this.prisma.client.update({
      where: { id },
      data: { status: 'ATIVO' },
      select: this.clientSelect,
    });
    return this.withMetrics(client);
  }

  async deactivate(id: string) {
    await this.ensureEditable(id);
    const client = await this.prisma.client.update({
      where: { id },
      data: { status: 'INATIVO' },
      select: this.clientSelect,
    });
    return this.withMetrics(client);
  }

  async isLead(id: string) {
    const client = await this.ensureExists(id);
    return { isLead: client.status === 'LEAD' };
  }
}
