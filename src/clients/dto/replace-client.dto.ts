import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum } from 'class-validator';
import { ClientStatusEnum, LeadQualificationEnum, LeadOriginEnum } from './create-client.dto';

export class ReplaceClientDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsEmail()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  cpf?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsEnum(ClientStatusEnum)
  status!: ClientStatusEnum;

  @IsEnum(LeadQualificationEnum)
  qualification!: LeadQualificationEnum;

  @IsEnum(LeadOriginEnum)
  @IsOptional()
  origin?: LeadOriginEnum;

  @IsString()
  @IsOptional()
  notes?: string;
}
