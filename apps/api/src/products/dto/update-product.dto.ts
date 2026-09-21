import { PartialType, PickType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// RP3: só os dados cadastrais. Preço tem rota própria (PATCH :id/price) e o
// saldo só muda por movimento de estoque (ADR 0013) — com o whitelist do
// ValidationPipe, price/initialStock enviados aqui são descartados na borda.
export class UpdateProductDto extends PartialType(
  PickType(CreateProductDto, ['name', 'sku', 'description', 'category']),
) {}
