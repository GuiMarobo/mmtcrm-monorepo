import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

// Espelha StockMovementType do Prisma, pelo mesmo motivo de ProductCategoryEnum:
// o @IsEnum precisa de um enum de runtime.
export enum StockMovementTypeEnum {
  ENTRADA = 'ENTRADA',
  SAIDA = 'SAIDA',
}

export class CreateStockMovementDto {
  @IsEnum(StockMovementTypeEnum)
  @IsNotEmpty()
  type!: StockMovementTypeEnum;

  // RP5: sempre inteiro positivo — o tipo diz a direção, não o sinal (ADR 0013).
  @IsInt()
  @Min(1)
  quantity!: number;

  @IsString()
  @IsOptional()
  @MaxLength(500)
  note?: string;
}
