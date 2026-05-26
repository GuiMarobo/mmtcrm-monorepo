import { IsNotEmpty, IsString, IsEmail, MinLength, IsEnum, IsOptional } from 'class-validator';
import { RoleEnum, UserStatusEnum } from './create-user.dto';

export class ReplaceUserDto {
  @IsString()
  @IsNotEmpty()
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
