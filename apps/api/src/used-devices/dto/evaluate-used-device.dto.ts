import {
  IsBoolean,
  IsEnum,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  MaxLength,
} from 'class-validator';

// Teto da coluna Decimal(12, 2) de estimated_value.
export const MAX_ESTIMATED_VALUE = 9_999_999_999.99;

// Espelho do enum DeviceCondition do Prisma para o @IsEnum, no padrão de
// DiscountTypeEnum: chega pelo corpo da requisição.
export enum DeviceConditionEnum {
  EXCELENTE = 'EXCELENTE',
  BOM = 'BOM',
  REGULAR = 'REGULAR',
  RUIM = 'RUIM',
}

// RD6: o DTO só garante os tipos. Valor > 0 e iCloud liberado são conferidos
// no service, que devolve a recusa em pt-BR orientando a recusar o aparelho.
export class EvaluateUsedDeviceDto {
  @IsEnum(DeviceConditionEnum)
  condition!: DeviceConditionEnum;

  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Max(MAX_ESTIMATED_VALUE)
  estimatedValue!: number;

  @IsOptional()
  @IsString()
  @MaxLength(2000)
  report?: string;

  // Opcional no DTO para que a ausência chegue ao service e receba a mesma
  // mensagem do falso.
  @IsOptional()
  @IsBoolean()
  icloudUnlocked?: boolean;
}
