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
import { RoleEnum, UserStatusEnum } from './create-user.dto';

export class ReplaceUserDto {
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
  role!: RoleEnum;

  @IsEnum(UserStatusEnum)
  status!: UserStatusEnum;
}
