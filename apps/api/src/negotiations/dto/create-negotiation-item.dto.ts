import { IsInt, IsUUID, Max, Min } from 'class-validator';

// Teto da coluna Int do Postgres, no mesmo padrão de MAX_STOCK_QUANTITY.
export const MAX_ITEM_QUANTITY = 2_147_483_647;

export class CreateNegotiationItemDto {
  @IsUUID()
  productId!: string;

  // RI5: quantidade é inteiro >= 1.
  @IsInt()
  @Min(1)
  @Max(MAX_ITEM_QUANTITY)
  quantity!: number;
}
