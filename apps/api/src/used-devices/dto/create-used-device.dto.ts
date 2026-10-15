import { IsNotEmpty, IsOptional, IsString, MaxLength } from 'class-validator';

// RD2: o DTO só garante os tipos e que modelo e série vieram. O service grava
// os textos sem espaços nas pontas (a série também em maiúsculas) e confere o
// IMEI, devolvendo a recusa em pt-BR.
export class CreateUsedDeviceDto {
  // Texto livre: aparelhos que a loja não vende mais não estão no catálogo.
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  model!: string;

  @IsString()
  @IsNotEmpty()
  @MaxLength(60)
  serialNumber!: string;

  // Opcional: iPad Wi-Fi, Mac e Apple Watch não têm IMEI. Em branco conta como
  // ausente.
  @IsOptional()
  @IsString()
  @MaxLength(20)
  imei?: string;
}
