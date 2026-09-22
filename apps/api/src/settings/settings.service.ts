import { BadRequestException, Injectable } from '@nestjs/common';
import { Prisma } from '../../generated/prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { ReplaceCompanySettingsDto } from './dto/replace-company-settings.dto';
import { ReplaceInstallmentRatesDto } from './dto/replace-installment-rates.dto';

// A configuração da loja é uma linha só, de id fixo (garantida pelo seed).
const COMPANY_ID = 1;

export const INSTALLMENT_OPTIONS = 12;

// RQ7: configuração ausente nunca recusa a emissão. Sem a linha da loja valem
// 7 dias de validade; parcela sem taxa cadastrada vale 0%. A leitura completa o
// que falta sem gravar nada — garantir as linhas é trabalho do seed.
export const DEFAULT_VALIDITY_DAYS = 7;

// RS3: faixa que impede publicar uma validade absurda por engano.
export const MIN_VALIDITY_DAYS = 1;
export const MAX_VALIDITY_DAYS = 90;

// RS3: taxa acima de 100% ou negativa é número absurdo publicado por engano.
export const MIN_RATE_PERCENT = 0;
export const MAX_RATE_PERCENT = 100;

const DEFAULT_COMPANY = {
  name: '',
  cnpj: null,
  address: null,
  phone: null,
  defaultValidityDays: DEFAULT_VALIDITY_DAYS,
};

const optionalText = (value: string | null | undefined) =>
  value?.trim() || null;

const companySelect = {
  name: true,
  cnpj: true,
  address: true,
  phone: true,
  defaultValidityDays: true,
} satisfies Prisma.CompanySettingsSelect;

const installmentRateSelect = {
  installments: true,
  ratePercent: true,
} satisfies Prisma.InstallmentRateSelect;

@Injectable()
export class SettingsService {
  constructor(private readonly prisma: PrismaService) {}

  async find() {
    const [company, rates] = await Promise.all([
      this.prisma.companySettings.findUnique({
        where: { id: COMPANY_ID },
        select: companySelect,
      }),
      this.prisma.installmentRate.findMany({
        select: installmentRateSelect,
        orderBy: { installments: 'asc' },
      }),
    ]);

    const percentByInstallments = new Map(
      rates.map((rate) => [rate.installments, Number(rate.ratePercent)]),
    );

    return {
      company: company ?? DEFAULT_COMPANY,
      installmentRates: Array.from(
        { length: INSTALLMENT_OPTIONS },
        (_, index) => ({
          installments: index + 1,
          ratePercent: percentByInstallments.get(index + 1) ?? 0,
        }),
      ),
    };
  }

  async updateCompany(dto: ReplaceCompanySettingsDto) {
    const name = dto.name.trim();
    if (!name) {
      throw new BadRequestException('Informe o nome da loja');
    }
    if (
      dto.defaultValidityDays < MIN_VALIDITY_DAYS ||
      dto.defaultValidityDays > MAX_VALIDITY_DAYS
    ) {
      throw new BadRequestException(
        `A validade padrão deve ser de ${MIN_VALIDITY_DAYS} a ${MAX_VALIDITY_DAYS} dias`,
      );
    }

    const data = {
      name,
      cnpj: optionalText(dto.cnpj),
      address: optionalText(dto.address),
      phone: optionalText(dto.phone),
      defaultValidityDays: dto.defaultValidityDays,
    };

    await this.prisma.companySettings.upsert({
      where: { id: COMPANY_ID },
      update: data,
      create: { id: COMPANY_ID, ...data },
    });

    return this.find();
  }

  async replaceInstallmentRates(dto: ReplaceInstallmentRatesDto) {
    // RS2: a tabela é escrita inteira. Um conjunto que não seja exatamente
    // 1x..12x, cada um uma vez, deixaria a simulação com buraco ou duplicata.
    const covered = new Set(dto.rates.map((rate) => rate.installments));
    const coversAll =
      dto.rates.length === INSTALLMENT_OPTIONS &&
      covered.size === INSTALLMENT_OPTIONS &&
      [...covered].every((n) => n >= 1 && n <= INSTALLMENT_OPTIONS);
    if (!coversAll) {
      throw new BadRequestException(
        `Informe uma taxa para cada parcelamento, de 1x a ${INSTALLMENT_OPTIONS}x`,
      );
    }

    const outOfRange = dto.rates.find(
      (rate) =>
        rate.ratePercent < MIN_RATE_PERCENT ||
        rate.ratePercent > MAX_RATE_PERCENT,
    );
    if (outOfRange) {
      throw new BadRequestException(
        `A taxa de ${outOfRange.installments}x deve ser de ${MIN_RATE_PERCENT} a ${MAX_RATE_PERCENT}%`,
      );
    }

    await this.prisma.$transaction(
      dto.rates.map(({ installments, ratePercent }) =>
        this.prisma.installmentRate.upsert({
          where: { installments },
          update: { ratePercent },
          create: { installments, ratePercent },
        }),
      ),
    );

    return this.find();
  }
}
