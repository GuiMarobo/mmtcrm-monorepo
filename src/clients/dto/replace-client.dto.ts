import { IsString, IsNotEmpty, IsEmail, IsOptional, IsEnum, Matches } from 'class-validator';
import { ClientStatusEnum, LeadQualificationEnum, LeadOriginEnum } from './create-client.dto';

export class ReplaceClientDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/\p{L}/u, { message: 'O nome não pode conter apenas números' })
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
