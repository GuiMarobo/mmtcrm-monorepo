import {
  IsEnum,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Min,
  MaxLength,
} from 'class-validator';
import { Transform } from 'class-transformer';
import { IsCpf, IsPersonName, toDigits } from '../../../common/br-validators';
import {
  ClientStatusEnum,
  LeadOriginEnum,
  LeadQualificationEnum,
} from '../../dto/create-client.dto';

export class ImportClientRowDto {
  @IsString()
  @IsNotEmpty()
  @MaxLength(200)
  @IsPersonName()
  name!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsString()
  @IsOptional()
  email?: string;

  @Transform(toDigits)
  @IsString()
  @IsOptional()
  @IsCpf()
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
