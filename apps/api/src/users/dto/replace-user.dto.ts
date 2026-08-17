import {
  IsNotEmpty,
  IsString,
  IsEmail,
  MinLength,
  IsEnum,
  IsOptional,
  Matches,
} from 'class-validator';
import { RoleEnum, UserStatusEnum } from './create-user.dto';

export class ReplaceUserDto {
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
  role!: RoleEnum;

  @IsEnum(UserStatusEnum)
  status!: UserStatusEnum;
}
