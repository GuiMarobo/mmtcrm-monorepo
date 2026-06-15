import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
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
  } as const;

  constructor(private readonly prisma: PrismaService) {}

  async create(dto: CreateClientDto) {
    if (dto.cpf) {
      const existing = await this.prisma.client.findUnique({
        where: { cpf: dto.cpf },
      });
      if (existing) throw new ConflictException('CPF já cadastrado');
    }

    return this.prisma.client.create({
      data: {
        name: dto.name,
        email: dto.email,
        phone: dto.phone,
        cpf: dto.cpf,
        address: dto.address,
        status: dto.status ?? 'LEAD',
        qualification: dto.qualification ?? 'NAO_QUALIFICADO',
        origin: dto.origin,
        notes: dto.notes,
      },
      select: this.clientSelect,
    });
  }

  async findAll() {
    const clients = await this.prisma.client.findMany({
      select: this.clientSelect,
      orderBy: { createdAt: 'desc' },
    });

    const negotiations = await this.prisma.$queryRaw<
      { client_id: string; count: number }[]
    >`
      SELECT client_id, COUNT(id)::int AS count
      FROM negotiations
      GROUP BY client_id
    `;

    const orders = await this.prisma.$queryRaw<
      { client_id: string; orders_count: number; revenue: number }[]
    >`
      SELECT n.client_id,
             COUNT(o.id)::int AS orders_count,
             COALESCE(SUM(o.total_value), 0)::float8 AS revenue
      FROM orders o
      JOIN negotiations n ON n.id = o.negotiation_id
      WHERE o.status = 'COMPRA_APROVADA'
      GROUP BY n.client_id
    `;

    const negByClient = new Map(negotiations.map((row) => [row.client_id, row.count]));
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

  async findOne(id: string) {
    const client = await this.prisma.client.findUnique({
      where: { id },
      select: this.clientSelect,
    });
    if (!client) throw new NotFoundException('Cliente não encontrado');
    return client;
  }

  async replace(id: string, dto: ReplaceClientDto) {
    await this.findOne(id);

    if (dto.cpf) {
      const existing = await this.prisma.client.findFirst({
        where: { cpf: dto.cpf, NOT: { id } },
      });
      if (existing) throw new ConflictException('CPF já cadastrado');
    }

    return this.prisma.client.update({
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
  }

  async updatePartial(id: string, dto: UpdateClientDto) {
    if (!dto || Object.keys(dto).length === 0) {
      throw new BadRequestException('PATCH requer ao menos um campo');
    }

    await this.findOne(id);

    if (dto.cpf) {
      const existing = await this.prisma.client.findFirst({
        where: { cpf: dto.cpf, NOT: { id } },
      });
      if (existing) throw new ConflictException('CPF já cadastrado');
    }

    return this.prisma.client.update({
      where: { id },
      data: dto,
      select: this.clientSelect,
    });
  }

  async remove(id: string) {
    await this.findOne(id);
    return this.prisma.client.delete({
      where: { id },
      select: this.clientSelect,
    });
  }

  async qualify(id: string, qualification: LeadQualificationEnum) {
    await this.findOne(id);
    return this.prisma.client.update({
      where: { id },
      data: { qualification },
      select: this.clientSelect,
    });
  }

  async registerContact(id: string) {
    await this.findOne(id);
    return this.prisma.client.update({
      where: { id },
      data: { lastContactAt: new Date() },
      select: this.clientSelect,
    });
  }

  async activate(id: string) {
    await this.findOne(id);
    return this.prisma.client.update({
      where: { id },
      data: { status: 'ATIVO' },
      select: this.clientSelect,
    });
  }

  async deactivate(id: string) {
    await this.findOne(id);
    return this.prisma.client.update({
      where: { id },
      data: { status: 'INATIVO' },
      select: this.clientSelect,
    });
  }

  async isLead(id: string) {
    const client = await this.findOne(id);
    return { isLead: client.status === 'LEAD' };
  }
  
}
