import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  IsEnum,
  IsOptional,
  MaxLength,
} from 'class-validator';
import { IsBrazilianPhone, IsPersonName } from '../../common/br-validators';

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
  @IsPersonName()
  @MaxLength(200)
  name!: string;

  @IsEmail()
  @MaxLength(254)
  email!: string;

  @IsString()
  @MinLength(8)
  @MaxLength(72)
  password!: string;

  @IsString()
  @IsOptional()
  @IsBrazilianPhone()
  phone?: string;

  @IsEnum(RoleEnum)
  @IsOptional()
  role?: RoleEnum;

  @IsEnum(UserStatusEnum)
  @IsOptional()
  status?: UserStatusEnum;
}
