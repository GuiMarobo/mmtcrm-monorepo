import { IsOptional, IsString, MaxLength } from 'class-validator';

export class EraseDataDto {
  @IsString()
  @IsOptional()
  @MaxLength(500)
  reason?: string;
}
