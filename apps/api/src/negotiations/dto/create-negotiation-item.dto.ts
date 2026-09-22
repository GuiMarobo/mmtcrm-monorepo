import { IsNumber, IsUUID, Max } from 'class-validator';

// Teto da coluna Int do Postgres, no mesmo padrão de MAX_STOCK_QUANTITY.
export const MAX_ITEM_QUANTITY = 2_147_483_647;

export class CreateNegotiationItemDto {
  @IsUUID()
  productId!: string;

  // RI5 (inteiro >= 1) é conferida no service, que nomeia o Produto na
  // mensagem de recusa. Aqui fica só o tipo e o teto técnico da coluna.
  @IsNumber({ allowNaN: false, allowInfinity: false })
  @Max(MAX_ITEM_QUANTITY)
  quantity!: number;
}
