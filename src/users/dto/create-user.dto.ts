import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  IsEnum,
  IsOptional,
  Matches,
} from 'class-validator';

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
  @Matches(/\p{L}/u, { message: 'O nome não pode conter apenas números' })
  name!: string;

  @IsEmail()
  email!: string;

  @IsString()
  @MinLength(8)
  password!: string;

  @IsString()
  @IsOptional()
  phone?: string;

  @IsEnum(RoleEnum)
  @IsOptional()
  role?: RoleEnum;

  @IsEnum(UserStatusEnum)
  @IsOptional()
  status?: UserStatusEnum;
}
