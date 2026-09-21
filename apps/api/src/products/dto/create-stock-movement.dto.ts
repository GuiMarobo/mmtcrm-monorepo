import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  Max,
  MaxLength,
  Min,
} from 'class-validator';

// Espelha StockMovementType do Prisma, pelo mesmo motivo de ProductCategoryEnum:
// o @IsEnum precisa de um enum de runtime.
export enum StockMovementTypeEnum {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA',
}

// Teto da coluna Int do Postgres: acima disto a escrita estouraria em 500.
export const MAX_STOCK_QUANTITY = 2_147_483_647;

export class CreateStockMovementDto {
  @IsEnum(StockMovementTypeEnum)
  @IsNotEmpty()
  type!: StockMovementTypeEnum;

  // RP5: sempre inteiro positivo — o tipo diz a direção, não o sinal (ADR 0013).
  @IsInt()
  @Min(1)
  @Max(MAX_STOCK_QUANTITY)
  quantity!: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}
