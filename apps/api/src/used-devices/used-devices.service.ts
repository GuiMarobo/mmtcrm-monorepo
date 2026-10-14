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
import { EvaluateUsedDeviceDto } from './dto/evaluate-used-device.dto';
import { RefuseUsedDeviceDto } from './dto/refuse-used-device.dto';
import {
  ListUsedDevicesQueryDto,
  UsedDeviceQueueFilter,
} from './dto/list-used-devices-query.dto';
import { fromCents } from '../negotiations/negotiation-item-response';
import { amountDue } from './amount-due';

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

// RD16: o lado do Técnico lê da Negociação só o Cliente, o Vendedor e a
// situação — nunca os itens nem os valores.
const queueDeviceSelect = {
  ...usedDeviceSelect,
  negotiation: {
    select: {
      id: true,
      status: true,
      client: { select: { id: true, name: true } },
      vendedor: { select: { id: true, name: true } },
    },
  },
} satisfies Prisma.UsedDeviceSelect;

type QueueDeviceRow = Prisma.UsedDeviceGetPayload<{
  select: typeof queueDeviceSelect;
}>;

const toQueueResponse = ({ negotiation, ...device }: QueueDeviceRow) => ({
  ...toResponse(device),
  negotiation,
});

const serialHistorySelect = {
  id: true,
  createdAt: true,
  evaluatedAt: true,
  evaluationStatus: true,
  condition: true,
  estimatedValue: true,
} satisfies Prisma.UsedDeviceSelect;

// RD15: o padrão é a fila de trabalho — pendentes de Negociações Abertas, na
// ordem de chegada. Os demais filtros são consulta, o mais recente primeiro,
// e mostram também os aparelhos de Negociações fechadas.
const queueWhere = (
  status: UsedDeviceQueueFilter,
): Prisma.UsedDeviceWhereInput => {
  if (status === UsedDeviceQueueFilter.AGUARDANDO) {
    return {
      ...LIVE_DEVICE,
      evaluationStatus: 'AGUARDANDO',
      negotiation: { ...LIVE_DEVICE.negotiation, status: 'ABERTA' },
    };
  }
  if (status === UsedDeviceQueueFilter.TODOS) return LIVE_DEVICE;
  return { ...LIVE_DEVICE, evaluationStatus: status };
};

// "Mês corrente" é o da loja, não o do servidor: rodando em UTC, depois das
// 21h de Brasília do último dia o servidor já estaria no mês seguinte. O
// Brasil não tem horário de verão desde 2019, então o mês começa às 00:00
// -03:00.
const STORE_TIME_ZONE = 'America/Sao_Paulo';
const STORE_UTC_OFFSET = '-03:00';

const storeMonthFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: STORE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
});

const storeMonthStart = (year: number, month: number) =>
  new Date(
    `${year}-${String(month).padStart(2, '0')}-01T00:00:00${STORE_UTC_OFFSET}`,
  );

const currentStoreMonth = () => {
  const [year, month] = storeMonthFormat
    .format(new Date())
    .split('-')
    .map(Number);
  return {
    gte: storeMonthStart(year, month),
    lt:
      month === 12
        ? storeMonthStart(year + 1, 1)
        : storeMonthStart(year, month + 1),
  };
};

const OLDEST_FIRST = [
  { createdAt: 'asc' },
  { id: 'asc' },
] satisfies Prisma.UsedDeviceOrderByWithRelationInput[];

const NEWEST_FIRST = [
  { createdAt: 'desc' },
  { id: 'desc' },
] satisfies Prisma.UsedDeviceOrderByWithRelationInput[];

const optionalText = (value: string | null | undefined) =>
  value?.trim() || null;

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
const ensureOpen = (
  status: string,
  message = 'Só é possível alterar os aparelhos na troca de uma negociação em aberto',
) => {
  if (status !== 'ABERTA') throw new ConflictException(message);
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
      select: { id: true, status: true, totalValue: true },
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

  // Lista da aba Troca: todos os não excluídos, na ordem do cadastro, com o
  // Saldo a pagar para o rodapé.
  async findByNegotiation(negotiationId: number) {
    const negotiation = await this.ensureNegotiationExists(negotiationId);

    const devices = await this.prisma.usedDevice.findMany({
      where: { ...NOT_DELETED, negotiationId },
      select: usedDeviceSelect,
      orderBy: { id: 'asc' },
    });

    const balance = amountDue(negotiation.totalValue, devices);
    return {
      devices: devices.map(toResponse),
      tradeInTotal: fromCents(balance.tradeInTotalCents),
      amountDue: fromCents(balance.amountDueCents),
    };
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

  async findQueue(query: ListUsedDevicesQueryDto) {
    const status = query.status ?? UsedDeviceQueueFilter.AGUARDANDO;
    const devices = await this.prisma.usedDevice.findMany({
      where: queueWhere(status),
      select: queueDeviceSelect,
      orderBy:
        status === UsedDeviceQueueFilter.AGUARDANDO
          ? OLDEST_FIRST
          : NEWEST_FIRST,
    });
    return { devices: devices.map(toQueueResponse) };
  }

  // RD17: Aguardando avaliação é o tamanho da fila padrão (RD15). Recebidos no
  // mês são os aparelhos que de fato entraram na loja: avaliados, numa
  // Negociação ganha neste mês. Reabrir a Negociação a tira da conta.
  async summary() {
    const [awaiting, received] = await Promise.all([
      this.prisma.usedDevice.count({
        where: queueWhere(UsedDeviceQueueFilter.AGUARDANDO),
      }),
      this.prisma.usedDevice.aggregate({
        where: {
          ...LIVE_DEVICE,
          evaluationStatus: 'AVALIADO',
          negotiation: {
            ...LIVE_DEVICE.negotiation,
            status: 'GANHA',
            closedAt: currentStoreMonth(),
          },
        },
        _count: true,
        _sum: { estimatedValue: true },
      }),
    ]);

    return {
      awaiting,
      receivedThisMonth: {
        count: received._count,
        value: Number(received._sum.estimatedValue ?? 0),
      },
    };
  }

  // O histórico da série são os outros aparelhos não excluídos com a mesma
  // série normalizada, para o Técnico avaliar sabendo que o aparelho voltou.
  async findOne(id: number) {
    const device = await this.prisma.usedDevice.findFirst({
      where: { id, ...LIVE_DEVICE },
      select: queueDeviceSelect,
    });
    if (!device) throw new NotFoundException('Aparelho não encontrado');

    const history = await this.prisma.usedDevice.findMany({
      where: {
        ...LIVE_DEVICE,
        serialNumber: device.serialNumber,
        id: { not: id },
      },
      select: serialHistorySelect,
      orderBy: NEWEST_FIRST,
    });

    return {
      ...toQueueResponse(device),
      serialHistory: history.map((entry) => ({
        ...entry,
        estimatedValue:
          entry.estimatedValue === null ? null : Number(entry.estimatedValue),
      })),
    };
  }

  // RD6/RD8: o valor estimado é o Valor de troca (RD10). Reavaliar sobrescreve
  // tudo, inclusive um aparelho recusado, e passa a responder quem avaliou por
  // último.
  async evaluate(id: number, dto: EvaluateUsedDeviceDto, evaluatorId: number) {
    if (dto.icloudUnlocked !== true) {
      throw new BadRequestException(
        'Confirme que o iCloud está liberado. Com o iCloud bloqueado, recuse o aparelho',
      );
    }
    if (!(dto.estimatedValue > 0)) {
      throw new BadRequestException(
        'O valor estimado deve ser maior que zero. Aparelho sem valor é recusado',
      );
    }

    return this.recordEvaluation(id, {
      evaluationStatus: 'AVALIADO',
      condition: dto.condition,
      estimatedValue: dto.estimatedValue,
      report: optionalText(dto.report),
      icloudUnlocked: true,
      evaluatedAt: new Date(),
      evaluatorId,
    });
  }

  // RD7/RD8: o laudo é o motivo. A recusa limpa o que a avaliação gravou, para
  // que um valor antigo não sobreviva num aparelho que não entra no saldo.
  async refuse(id: number, dto: RefuseUsedDeviceDto, evaluatorId: number) {
    const report = optionalText(dto.report);
    if (!report) {
      throw new BadRequestException('Informe no laudo o motivo da recusa');
    }

    return this.recordEvaluation(id, {
      evaluationStatus: 'RECUSADO',
      condition: null,
      estimatedValue: null,
      report,
      icloudUnlocked: null,
      evaluatedAt: new Date(),
      evaluatorId,
    });
  }

  // A conferência da situação e a escrita ficam na mesma transação, para que
  // uma conversão entre as duas não deixe passar a avaliação.
  private async recordEvaluation(
    id: number,
    data: Prisma.UsedDeviceUncheckedUpdateInput,
  ) {
    const updated = await this.prisma.$transaction(async (tx) => {
      const device = await this.ensureExists(id, tx);
      // RD9: avaliar e recusar só com a Negociação Aberta.
      ensureOpen(
        device.negotiation.status,
        'Só é possível avaliar aparelhos de uma negociação em aberto. Reabra a negociação para alterar a avaliação',
      );
      return tx.usedDevice.update({
        where: { id },
        data,
        select: usedDeviceSelect,
      });
    });
    return toResponse(updated);
  }
}
