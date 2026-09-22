import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { NOT_DELETED, PrismaService } from '../prisma/prisma.service';
import {
  INSTALLMENT_OPTIONS,
  MAX_RATE_PERCENT,
  MIN_RATE_PERCENT,
  SettingsService,
} from '../settings/settings.service';
import { priceItem } from '../negotiations/negotiation-item-pricing';
import {
  fromCents,
  negotiationItemsSelect,
  toItemResponse,
} from '../negotiations/negotiation-item-response';
import { IssueQuotationDto } from './dto/issue-quotation.dto';
import {
  splitInstallments,
  totalWithInterestCents,
} from './installment-pricing';

// RQ5: a validade vai de amanhã a hoje + 90 dias.
const MAX_VALIDITY_AHEAD_DAYS = 90;

// "Hoje" é o dia do balcão, não o do servidor: rodando em UTC, depois das 21h
// de Brasília o servidor já estaria no dia seguinte e recusaria "amanhã".
const STORE_TIME_ZONE = 'America/Sao_Paulo';

const storeDateFormat = new Intl.DateTimeFormat('en-CA', {
  timeZone: STORE_TIME_ZONE,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
});

// Datas sem hora circulam como AAAA-MM-DD, que comparam certo como string.
const storeToday = () => storeDateFormat.format(new Date());

const toDate = (isoDate: string) => new Date(`${isoDate}T00:00:00Z`);

const toIsoDate = (date: Date) => date.toISOString().slice(0, 10);

const addDays = (isoDate: string, days: number) => {
  const date = toDate(isoDate);
  date.setUTCDate(date.getUTCDate() + days);
  return toIsoDate(date);
};

const isRealDate = (isoDate: string) => {
  const date = toDate(isoDate);
  return !Number.isNaN(date.getTime()) && toIsoDate(date) === isoDate;
};

const toBrazilianDate = (isoDate: string) =>
  isoDate.split('-').reverse().join('/');

const toCents = (value: number) => Math.round(value * 100);

const quotationSelect = {
  id: true,
  negotiationId: true,
  code: true,
  totalValue: true,
  installments: true,
  ratePercent: true,
  totalWithInterest: true,
  validUntil: true,
  createdAt: true,
  author: { select: { id: true, name: true } },
} satisfies Prisma.QuotationSelect;

type QuotationRow = Prisma.QuotationGetPayload<{
  select: typeof quotationSelect;
}>;

// Os itens congelados têm o mesmo formato do item da Negociação: nome e código
// do Produto lidos do catálogo (RI2), preço e desconto como gravados.
const quotationWithItemsSelect = {
  ...quotationSelect,
  items: {
    select: negotiationItemsSelect.select,
    orderBy: { id: 'asc' },
  },
} satisfies Prisma.QuotationSelect;

type QuotationWithItemsRow = Prisma.QuotationGetPayload<{
  select: typeof quotationWithItemsSelect;
}>;

@Injectable()
export class QuotationsService {
  constructor(
    private readonly prisma: PrismaService,
    private readonly settings: SettingsService,
  ) {}

  // Valor da parcela e "Vencido" não são guardados: derivam do que está
  // congelado, na leitura (RQ10).
  private toResponse(quotation: QuotationRow) {
    const totalWithInterest = Number(quotation.totalWithInterest);
    const { installmentCents, firstInstallmentCents } = splitInstallments(
      toCents(totalWithInterest),
      quotation.installments,
    );
    const validUntil = toIsoDate(quotation.validUntil);
    return {
      id: quotation.id,
      negotiationId: quotation.negotiationId,
      code: quotation.code,
      totalValue: Number(quotation.totalValue),
      installments: quotation.installments,
      ratePercent: Number(quotation.ratePercent),
      totalWithInterest,
      installmentValue: fromCents(installmentCents),
      firstInstallmentValue: fromCents(firstInstallmentCents),
      validUntil,
      expired: validUntil < storeToday(),
      createdAt: quotation.createdAt,
      author: quotation.author,
    };
  }

  private toResponseWithItems(quotation: QuotationWithItemsRow) {
    const { items, ...rest } = quotation;
    return { ...this.toResponse(rest), items: items.map(toItemResponse) };
  }

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

  // RQ5: faixas conferidas antes de ler qualquer coisa.
  private assertValidPayload(dto: IssueQuotationDto) {
    if (
      !Number.isInteger(dto.installments) ||
      dto.installments < 1 ||
      dto.installments > INSTALLMENT_OPTIONS
    ) {
      throw new BadRequestException(
        `O parcelamento deve ser de 1x a ${INSTALLMENT_OPTIONS}x`,
      );
    }
    if (
      dto.ratePercent !== undefined &&
      (dto.ratePercent < MIN_RATE_PERCENT || dto.ratePercent > MAX_RATE_PERCENT)
    ) {
      throw new BadRequestException(
        `A taxa deve ser de ${MIN_RATE_PERCENT} a ${MAX_RATE_PERCENT}%`,
      );
    }
    if (dto.validUntil !== undefined) {
      const today = storeToday();
      const earliest = addDays(today, 1);
      const latest = addDays(today, MAX_VALIDITY_AHEAD_DAYS);
      if (
        !isRealDate(dto.validUntil) ||
        dto.validUntil < earliest ||
        dto.validUntil > latest
      ) {
        throw new BadRequestException(
          `A validade deve ser de ${toBrazilianDate(earliest)} a ${toBrazilianDate(latest)}`,
        );
      }
    }
  }

  // RQ4/RQ6/RQ7: o Orçamento é a foto da Negociação agora. Os itens são
  // copiados (nunca recalculados do catálogo), os totais saem daqui, e a taxa e
  // a validade vêm do payload ou, na falta, da configuração — que por sua vez
  // cai em 0% e 7 dias quando o ADMIN nunca a gravou.
  async issue(negotiationId: number, dto: IssueQuotationDto, authorId: number) {
    this.assertValidPayload(dto);

    const settings = await this.settings.find();
    const ratePercent =
      dto.ratePercent ??
      settings.installmentRates.find(
        (rate) => rate.installments === dto.installments,
      )?.ratePercent ??
      0;
    const validUntil =
      dto.validUntil ??
      addDays(storeToday(), settings.company.defaultValidityDays);

    // RQ11: só lê a Negociação e grava o Orçamento — não muda situação, não
    // toca Pedido nem estoque, não trava a edição dos itens.
    const quotation = await this.prisma.$transaction(async (tx) => {
      const negotiation = await this.ensureNegotiationExists(negotiationId, tx);
      if (negotiation.status !== 'ABERTA') {
        throw new ConflictException(
          'Só é possível emitir orçamento de uma negociação em aberto',
        );
      }

      const items = await tx.negotiationItem.findMany({
        where: { ...NOT_DELETED, negotiationId },
        select: {
          productId: true,
          quantity: true,
          unitPrice: true,
          discountType: true,
          discountValue: true,
        },
        orderBy: { id: 'asc' },
      });
      if (items.length === 0) {
        throw new ConflictException(
          'Adicione ao menos um item à negociação antes de emitir o orçamento',
        );
      }

      const cashCents = items.reduce(
        (total, item) => total + priceItem(item).subtotalCents,
        0,
      );
      const totalCents = totalWithInterestCents(
        cashCents,
        toCents(ratePercent),
      );

      // O código usa o id, que só existe depois do insert (ORC-7, no padrão
      // de PED-7). Os dois passos estão na mesma transação.
      const { id } = await tx.quotation.create({
        data: {
          negotiationId,
          code: '',
          totalValue: fromCents(cashCents),
          installments: dto.installments,
          ratePercent,
          totalWithInterest: fromCents(totalCents),
          validUntil: toDate(validUntil),
          authorId,
          items: {
            create: items.map((item) => ({
              productId: item.productId,
              quantity: item.quantity,
              unitPrice: item.unitPrice,
              discountType: item.discountType,
              discountValue: item.discountValue,
            })),
          },
        },
        select: { id: true },
      });

      return tx.quotation.update({
        where: { id },
        data: { code: `ORC-${id}` },
        select: quotationWithItemsSelect,
      });
    });

    return this.toResponseWithItems(quotation);
  }

  // RQ9: todos os emitidos valem ao mesmo tempo — a lista é só do mais novo
  // para o mais antigo, sem filtro. Negociação já decidida continua listando.
  async findByNegotiation(negotiationId: number) {
    await this.ensureNegotiationExists(negotiationId);

    const quotations = await this.prisma.quotation.findMany({
      where: { negotiationId },
      select: quotationSelect,
      orderBy: { id: 'desc' },
    });

    return quotations.map((quotation) => this.toResponse(quotation));
  }
}
