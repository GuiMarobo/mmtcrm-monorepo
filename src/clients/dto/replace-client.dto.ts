import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ClientStatusEnum, LeadQualificationEnum, LeadOriginEnum } from './create-client.dto';

export class ReplaceClientDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsNotEmpty()
  phone!: string;

  @IsEnum(LeadOriginEnum)
  origin!: LeadOriginEnum;

  @IsEnum(ClientStatusEnum)
  status!: ClientStatusEnum;

  @IsEnum(LeadQualificationEnum)
  qualification!: LeadQualificationEnum;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  cpf?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsString()
  @IsOptional()
  notes?: string;
}
