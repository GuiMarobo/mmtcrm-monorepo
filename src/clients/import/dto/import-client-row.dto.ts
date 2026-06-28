import { IsEmail, IsEnum, IsNotEmpty, IsOptional, IsString } from 'class-validator';
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
    @IsNotEmpty()
    phone!: string;

    @IsEmail()
    @IsOptional()
    email?: string;

    @IsString()
    @IsOptional()
    cpf?: string;

    @IsString()
    @IsOptional()
    address?: string;

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
