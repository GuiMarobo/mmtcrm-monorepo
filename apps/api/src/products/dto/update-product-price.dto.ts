import { PickType } from '@nestjs/mapped-types';
import { CreateProductDto } from './create-product.dto';

// RP4: só o novo preço, com as mesmas regras do cadastro (não negativo, duas
// casas decimais, dentro do Decimal(12, 2)).
export class UpdateProductPriceDto extends PickType(CreateProductDto, [
  'price',
]) {}
