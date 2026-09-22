import { IsInt, IsNumber, IsOptional, Matches } from 'class-validator';

// RQ4: do cliente vêm só a condição e a validade — todo total é calculado no
// backend, e qualquer outro campo é descartado pelo whitelist do
// ValidationPipe. As faixas (RQ5) são conferidas no service, que devolve a
// recusa em pt-BR; aqui ficam os tipos.
export class IssueQuotationDto {
  @IsInt()
  installments!: number;

  // Ausente: vale a taxa da tabela para esse parcelamento (RQ6).
  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  ratePercent?: number;

  // Data sem hora (AAAA-MM-DD). Ausente: hoje + validade padrão da loja (RQ6).
  @IsOptional()
  @Matches(/^\d{4}-\d{2}-\d{2}$/, {
    message: 'validUntil deve ser uma data no formato AAAA-MM-DD',
  })
  validUntil?: string;
}
