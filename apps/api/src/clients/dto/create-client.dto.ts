import {
  IsString,
  IsNotEmpty,
  IsEmail,
  IsOptional,
  IsEnum,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import {
  IsBrazilianPhone,
  IsCpf,
  IsPersonName,
  toDigits,
} from '../../common/br-validators';

export enum ClientStatusEnum {
  LEAD = 'LEAD',
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}

export enum LeadQualificationEnum {
  NAO_QUALIFICADO = 'NAO_QUALIFICADO',
  QUALIFICADO = 'QUALIFICADO',
  ALTA_INTENCAO = 'ALTA_INTENCAO',
}

export enum LeadOriginEnum {
  WHATSAPP = 'WHATSAPP',
  INSTAGRAM = 'INSTAGRAM',
  SITE = 'SITE',
  INDICACAO = 'INDICACAO',
  OUTRO = 'OUTRO',
}

export class CreateClientDto {
  @IsString()
  @IsNotEmpty()
  @IsPersonName()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @IsBrazilianPhone()
  phone!: string;

  @IsNotEmpty()
  @IsEnum(LeadOriginEnum)
  origin!: LeadOriginEnum;

  @IsNotEmpty()
  @IsEnum(ClientStatusEnum)
  status!: ClientStatusEnum;

  @IsNotEmpty()
  @IsEnum(LeadQualificationEnum)
  qualification!: LeadQualificationEnum;

  @IsEmail()
  @MaxLength(254)
  @IsOptional()
  email?: string;

  @Transform(toDigits)
  @IsString()
  @IsOptional()
  @IsCpf()
  cpf?: string;

  @IsString()
  @IsOptional()
  @MaxLength(300)
  address?: string;

  @IsString()
  @IsOptional()
  @MaxLength(2000)
  notes?: string;
}
