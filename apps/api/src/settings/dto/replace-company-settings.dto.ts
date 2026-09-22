import {
  IsInt,
  IsNotEmpty,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class ReplaceCompanySettingsDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  name!: string;

  // RS3: CNPJ e telefone são texto livre — o sistema não valida CNPJ em nenhum
  // outro lugar, e o documento só os reproduz.
  @IsOptional()
  @IsString()
  @MaxLength(40)
  cnpj?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(300)
  address?: string | null;

  @IsOptional()
  @IsString()
  @MaxLength(40)
  phone?: string | null;

  // A faixa de 1 a 90 dias (RS3) é conferida no service, que devolve a
  // mensagem de recusa em pt-BR. Aqui fica só o tipo.
  @IsInt()
  defaultValidityDays!: number;
}
