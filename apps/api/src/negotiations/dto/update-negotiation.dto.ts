import {
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

// Dto proprio, sem PartialType(CreateNegotiationDto): PATCH continua sem
// mexer em itens nem no total derivado (RI8) — so o create/replace de itens
// (tickets 03/04) ganhou items no lugar de totalValue.
export class UpdateNegotiationDto {
  @IsUUID()
  @IsOptional()
  clientId?: string;

  @IsNumber({ maxDecimalPlaces: 2 })
  @Min(0)
  @IsOptional()
  totalValue?: number;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}
