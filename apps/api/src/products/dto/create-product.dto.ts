import {
  IsEnum,
  IsInt,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  MaxLength,
  Min,
} from 'class-validator';

// Espelha ProductCategory do Prisma: o @IsEnum precisa de um enum de runtime, e
// a categoria é o único campo de enum que chega pelo corpo da requisição. O
// status não entra — todo Produto nasce ATIVO (RP1) e só muda por rota própria.
export enum ProductCategoryEnum {
  IPHONE = 'IPHONE',
  IPAD = 'IPAD',
  MAC = 'MAC',
  APPLE_WATCH = 'APPLE_WATCH',
  AUDIO = 'AUDIO',
  ACESSORIOS = 'ACESSORIOS',
}

export class CreateProductDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  // Gravado normalizado (trim + maiúsculas) pelo service — o DTO só garante que
  // veio preenchido.
  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  sku!: string;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  description?: string;

  @IsEnum(ProductCategoryEnum)
  @IsNotEmpty()
  category!: ProductCategoryEnum;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  price!: number;

  // Quantidade de carga inicial. Maior que zero vira o primeiro movimento do
  // histórico (RP1); zero não gera movimento nenhum.
  @IsInt()
  @Min(0)
  @IsOptional()
  initialStock?: number;
}
