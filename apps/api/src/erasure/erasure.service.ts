import {
  ConflictException,
  ForbiddenException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { randomBytes } from 'crypto';
import * as bcrypt from 'bcrypt';
import { PrismaService } from '../prisma/prisma.service';
import { ErasureAction, ErasureSubject } from '../../generated/prisma/enums';
import { Prisma } from '../../generated/prisma/client';

export interface EraseResult {
  action: ErasureAction;
  performedAt: Date;
}

export const ANONYMIZED_CLIENT_NAME = 'Titular removido';
export const ANONYMIZED_USER_NAME = 'Usuário removido';

@Injectable()
export class ErasureService {
  constructor(private readonly prisma: PrismaService) {}

  async eraseClient(
    id: string,
    performedById: number,
    reason?: string,
  ): Promise<EraseResult> {
    const client = await this.prisma.client.findUnique({
      where: { id },
      select: { id: true, anonymizedAt: true },
    });
    if (!client) throw new NotFoundException('Cliente não encontrado');
    if (client.anonymizedAt) {
      throw new ConflictException(
        'Os dados deste cliente já foram anonimizados',
      );
    }

    // Negociação excluída logicamente continua sendo obrigação fiscal, então conta.
    const history = await this.prisma.negotiation.count({
      where: { clientId: id },
    });
    const action: ErasureAction = history === 0 ? 'ELIMINADO' : 'ANONIMIZADO';
    const performedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      if (action === 'ELIMINADO') {
        await tx.client.delete({ where: { id } });
      } else {
        await tx.client.update({
          where: { id },
          data: {
            name: ANONYMIZED_CLIENT_NAME,
            email: null,
            phone: null,
            cpf: null,
            address: null,
            notes: null,
            anonymizedAt: performedAt,
          },
        });
      }

      await this.log(tx, {
        subject: 'CLIENTE',
        subjectId: id,
        subjectLabel: `Cliente #${id.slice(0, 8)}`,
        action,
        reason,
        performedById,
        performedAt,
      });
    });

    return { action, performedAt };
  }

  async eraseUser(
    id: number,
    performedById: number,
    reason?: string,
  ): Promise<EraseResult> {
    if (id === performedById) {
      throw new ForbiddenException(
        'Não é possível eliminar os próprios dados: peça a outro administrador',
      );
    }

    const user = await this.prisma.user.findUnique({
      where: { id },
      select: { id: true, anonymizedAt: true },
    });
    if (!user) throw new NotFoundException('Usuário não encontrado');
    if (user.anonymizedAt) {
      throw new ConflictException(
        'Os dados deste usuário já foram anonimizados',
      );
    }

    const history = await this.prisma.negotiation.count({
      where: { vendedorId: id },
    });
    const action: ErasureAction = history === 0 ? 'ELIMINADO' : 'ANONIMIZADO';
    const performedAt = new Date();

    await this.prisma.$transaction(async (tx) => {
      if (action === 'ELIMINADO') {
        await tx.user.delete({ where: { id } });
      } else {
        await tx.user.update({
          where: { id },
          data: {
            name: ANONYMIZED_USER_NAME,
            email: `removido+${id}@invalido.local`,
            phone: null,
            status: 'INATIVO',
            password: await bcrypt.hash(randomBytes(32).toString('hex'), 10),
            mustChangePassword: false,
            anonymizedAt: performedAt,
          },
        });
      }

      await this.log(tx, {
        subject: 'USUARIO',
        subjectId: String(id),
        subjectLabel: `Usuário #${id}`,
        action,
        reason,
        performedById,
        performedAt,
      });
    });

    return { action, performedAt };
  }

  private log(
    tx: Prisma.TransactionClient,
    data: {
      subject: ErasureSubject;
      subjectId: string;
      subjectLabel: string;
      action: ErasureAction;
      reason?: string;
      performedById: number;
      performedAt: Date;
    },
  ) {
    return tx.dataErasureLog.create({ data });
  }
}
