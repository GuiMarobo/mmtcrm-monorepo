import { Type } from 'class-transformer';
import {
  ArrayMaxSize,
  IsArray,
  IsInt,
  IsNumber,
  ValidateNested,
} from 'class-validator';

// As faixas (1 a 12 parcelas, cada uma uma vez; taxa de 0 a 100%) são
// conferidas no service, que devolve a recusa em pt-BR. Aqui ficam os tipos e
// as duas casas decimais da coluna Decimal(5, 2).
export class InstallmentRateDto {
  @IsInt()
  installments!: number;

  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  ratePercent!: number;
}

// RS2: a tabela é escrita inteira — as 12 linhas numa requisição só.
export class ReplaceInstallmentRatesDto {
  @IsArray()
  @ArrayMaxSize(100)
  @ValidateNested({ each: true })
  @Type(() => InstallmentRateDto)
  rates!: InstallmentRateDto[];
}
