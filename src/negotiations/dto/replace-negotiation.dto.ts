import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

// PUT substitui: exige o conjunto completo, igual ao create.
export class ReplaceNegotiationDto {
  @IsUUID()
  @IsNotEmpty()
  clientId!: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  totalValue!: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}
