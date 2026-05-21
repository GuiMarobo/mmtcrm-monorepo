import {
    IsString,
    IsNotEmpty,
    IsEmail,
    IsOptional,
    IsEnum,
} from 'class-validator';

export enum ClientStatusEnum{
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
