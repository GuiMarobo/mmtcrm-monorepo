import {
    IsString,
    IsNotEmpty,
    IsEmail,
    IsOptional,
    IsEnum,
    Matches,
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
    @Matches(/\p{L}/u, { message: 'O nome não pode conter apenas números' })
    name!: string;

    @IsString()
    @IsNotEmpty()
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
