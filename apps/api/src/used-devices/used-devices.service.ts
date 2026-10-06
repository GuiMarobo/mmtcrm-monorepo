import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { NOT_DELETED, PrismaService } from '../prisma/prisma.service';
import { CreateUsedDeviceDto } from './dto/create-used-device.dto';
import { UpdateUsedDeviceDto } from './dto/update-used-device.dto';

// RD3: a série é comparada e gravada como o sku — sem espaços nas pontas e em
// maiúsculas —, para que "f2lx " e "F2LX" contem como o mesmo aparelho.
export const normalizeSerialNumber = (serialNumber: string) =>
  serialNumber.trim().toUpperCase();

const IMEI_PATTERN = /^\d{15}$/;

// Aparelho de Negociação excluída some junto (RD14), mesmo que a cascata
// lógica ainda não o tenha marcado.
const LIVE_DEVICE = {
  ...NOT_DELETED,
  negotiation: NOT_DELETED,
} satisfies Prisma.UsedDeviceWhereInput;

const usedDeviceSelect = {
  id: true,
  negotiationId: true,
  model: true,
  serialNumber: true,
  imei: true,
  evaluationStatus: true,
  condition: true,
  estimatedValue: true,
  report: true,
  icloudUnlocked: true,
  evaluatedAt: true,
  createdAt: true,
  evaluator: { select: { id: true, name: true } },
  createdBy: { select: { id: true, name: true } },
} satisfies Prisma.UsedDeviceSelect;

type UsedDeviceRow = Prisma.UsedDeviceGetPayload<{
  select: typeof usedDeviceSelect;
}>;

const toResponse = (device: UsedDeviceRow) => ({
  id: device.id,
  negotiationId: device.negotiationId,
  model: device.model,
  serialNumber: device.serialNumber,
  imei: device.imei,
  evaluationStatus: device.evaluationStatus,
  condition: device.condition,
  estimatedValue:
    device.estimatedValue === null ? null : Number(device.estimatedValue),
  report: device.report,
  icloudUnlocked: device.icloudUnlocked,
  evaluatedAt: device.evaluatedAt,
  evaluator: device.evaluator,
  createdAt: device.createdAt,
  createdBy: device.createdBy,
});

const requiredText = (value: string, field: string) => {
  const trimmed = value.trim();
  if (!trimmed) throw new BadRequestException(`Informe ${field} do aparelho`);
  return trimmed;
};

// RD2: IMEI é opcional; em branco conta como ausente. Informado, são 15
// dígitos.
const normalizeImei = (imei: string | null | undefined) => {
  const trimmed = imei?.trim();
  if (!trimmed) return null;
  if (!IMEI_PATTERN.test(trimmed)) {
    throw new BadRequestException('O IMEI deve ter 15 dígitos');
  }
  return trimmed;
};

// RD1/RD4/RD5: o aparelho só nasce e só muda com a Negociação Aberta. Ganha
// ou Perdida, reabre-se a Negociação, como nos itens.
const ensureOpen = (status: string) => {
  if (status !== 'ABERTA') {
    throw new ConflictException(
      'Só é possível alterar os aparelhos na troca de uma negociação em aberto',
    );
  }
};

@Injectable()
export class UsedDevicesService {
  constructor(private readonly prisma: PrismaService) {}

  private async ensureNegotiationExists(
    id: number,
    client: Prisma.TransactionClient = this.prisma,
  ) {
    const negotiation = await client.negotiation.findFirst({
      where: { ...NOT_DELETED, id },
      select: { id: true, status: true },
    });
    if (!negotiation) throw new NotFoundException('Negociação não encontrada');
    return negotiation;
  }

  private async ensureExists(id: number, client: Prisma.TransactionClient) {
    const device = await client.usedDevice.findFirst({
      where: { id, ...LIVE_DEVICE },
      select: {
        ...usedDeviceSelect,
        negotiation: { select: { status: true } },
      },
    });
    if (!device) throw new NotFoundException('Aparelho não encontrado');
    return device;
  }

  // RD1–RD3: só nasce dentro de uma Negociação Aberta e sempre aguardando
  // avaliação. Série repetida não bloqueia: a resposta diz quantas vezes ela
  // já apareceu, e a tela avisa.
  async create(
    negotiationId: number,
    dto: CreateUsedDeviceDto,
    createdById: number,
  ) {
    const model = requiredText(dto.model, 'o modelo');
    const serialNumber = normalizeSerialNumber(
      requiredText(dto.serialNumber, 'o número de série'),
    );
    const imei = normalizeImei(dto.imei);

    return this.prisma.$transaction(async (tx) => {
      const negotiation = await this.ensureNegotiationExists(negotiationId, tx);
      ensureOpen(negotiation.status);

      const serialSeenBefore = await tx.usedDevice.count({
        where: { ...LIVE_DEVICE, serialNumber },
      });

      const device = await tx.usedDevice.create({
        data: { negotiationId, model, serialNumber, imei, createdById },
        select: usedDeviceSelect,
      });

      return { ...toResponse(device), serialSeenBefore };
    });
  }

  // Lista da aba Troca: todos os não excluídos, na ordem do cadastro.
  async findByNegotiation(negotiationId: number) {
    await this.ensureNegotiationExists(negotiationId);

    const devices = await this.prisma.usedDevice.findMany({
      where: { ...NOT_DELETED, negotiationId },
      select: usedDeviceSelect,
      orderBy: { id: 'asc' },
    });

    return { devices: devices.map(toResponse) };
  }

  // RD4: depois da avaliação, modelo e série ficam presos ao aparelho que o
  // Técnico examinou. PATCH parcial: modelo e série nulos contam como
  // ausentes; só o IMEI, que é opcional, pode ser limpo.
  async update(id: number, dto: UpdateUsedDeviceDto) {
    const data: Prisma.UsedDeviceUpdateInput = {};
    if (dto.model != null) data.model = requiredText(dto.model, 'o modelo');
    if (dto.serialNumber != null) {
      data.serialNumber = normalizeSerialNumber(
        requiredText(dto.serialNumber, 'o número de série'),
      );
    }
    if (dto.imei !== undefined) data.imei = normalizeImei(dto.imei);

    // A conferência e a escrita ficam na mesma transação, para que uma
    // conversão ou avaliação entre as duas não deixe passar a edição.
    const updated = await this.prisma.$transaction(async (tx) => {
      const device = await this.ensureExists(id, tx);
      ensureOpen(device.negotiation.status);
      if (device.evaluationStatus !== 'AGUARDANDO') {
        throw new ConflictException(
          'O aparelho já foi avaliado: só é possível corrigir os dados enquanto aguarda avaliação',
        );
      }
      return tx.usedDevice.update({
        where: { id },
        data,
        select: usedDeviceSelect,
      });
    });
    return toResponse(updated);
  }

  // RD5: o Cliente pode desistir da troca a qualquer momento da tratativa,
  // qualquer que seja o resultado da avaliação.
  async remove(id: number) {
    const removed = await this.prisma.$transaction(async (tx) => {
      const device = await this.ensureExists(id, tx);
      ensureOpen(device.negotiation.status);
      return tx.usedDevice.update({
        where: { id },
        data: { deletedAt: new Date() },
        select: usedDeviceSelect,
      });
    });
    return toResponse(removed);
  }
}
