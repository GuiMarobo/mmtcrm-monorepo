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
import {
  ClientStatusEnum,
  LeadQualificationEnum,
  LeadOriginEnum,
} from './create-client.dto';

export class ReplaceClientDto {
  @IsString()
  @IsNotEmpty()
  @IsPersonName()
  @MaxLength(200)
  name!: string;

  @IsString()
  @IsNotEmpty()
  @IsBrazilianPhone()
  phone!: string;

  @IsEnum(LeadOriginEnum)
  origin!: LeadOriginEnum;

  @IsEnum(ClientStatusEnum)
  status!: ClientStatusEnum;

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
