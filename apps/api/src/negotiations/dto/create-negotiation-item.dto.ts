import { IsEnum, IsNumber, IsOptional, IsUUID, Max } from 'class-validator';

// Teto da coluna Int do Postgres, no mesmo padrão de MAX_STOCK_QUANTITY.
export const MAX_ITEM_QUANTITY = 2_147_483_647;

// Teto da coluna Decimal(12, 2) de discount_value.
export const MAX_DISCOUNT_VALUE = 9_999_999_999.99;

// Espelho do enum DiscountType do Prisma para o @IsEnum, no padrão de
// PaymentMethodEnum: chega pelo corpo da requisição.
export enum DiscountTypeEnum {
  PERCENTUAL = 'PERCENTUAL',
  VALOR = 'VALOR',
}

export class CreateNegotiationItemDto {
  @IsUUID()
  productId!: string;

  // RI5 (inteiro >= 1) é conferida no service, que nomeia o Produto na
  // mensagem de recusa. Aqui fica só o tipo e o teto técnico da coluna.
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Max(MAX_ITEM_QUANTITY)
  quantity!: number;

  // ADR 0015: forma e número informado. Ausentes, o item fica sem desconto
  // (VALOR, zero). As faixas da RI5 (0–100, >= 0, até a linha) são conferidas
  // no service, que nomeia o Produto na recusa.
  @IsOptional()
  @IsEnum(DiscountTypeEnum)
  discountType?: DiscountTypeEnum;

  @IsOptional()
  @IsNumber({ allowNaN: false, allowInfinity: false, maxDecimalPlaces: 2 })
  @Max(MAX_DISCOUNT_VALUE)
  discountValue?: number;
}
