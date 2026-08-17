import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
} from 'class-validator';
import {
  ClientStatusEnum,
  LeadOriginEnum,
  LeadQualificationEnum,
} from '../../dto/create-client.dto';

export class ImportClientRowDto {
  @IsString()
  @IsNotEmpty()
  name!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @IsString()
  @IsOptional()
  cpf?: string;

  @IsString()
  @IsOptional()
  address?: string;

  @IsNumber()
  @Min(0.01)
  @IsOptional()
  ltv?: number;

  @IsEnum(ClientStatusEnum)
  @IsOptional()
  status?: ClientStatusEnum;

  @IsEnum(LeadQualificationEnum)
  @IsOptional()
  qualification?: LeadQualificationEnum;

  @IsEnum(LeadOriginEnum)
  @IsOptional()
  origin?: LeadOriginEnum;

  @IsString()
  @IsOptional()
  notes?: string;
}
