import { IsNotEmpty, IsString, IsEmail, MinLength, IsEnum, IsOptional } from 'class-validator'

export enum RoleEnum {
  ADMIN = 'ADMIN',
  VENDEDOR = 'VENDEDOR',
  ATENDENTE = 'ATENDENTE',
  TECNICO = 'TECNICO',
}

export enum UserStatusEnum {
  ATIVO = 'ATIVO',
  INATIVO = 'INATIVO',
}

export class CreateUserDto {
    @IsString()
    @IsNotEmpty()
    name!: string

    @IsEmail()
    email!: string

    @IsString()
    @MinLength(8)
    password!: string

    @IsEnum(RoleEnum)
    @IsOptional()
    role?: RoleEnum

    @IsEnum(UserStatusEnum)
    @IsOptional()
    status?: UserStatusEnum
}
