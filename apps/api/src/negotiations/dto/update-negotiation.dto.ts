import {
  IsEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

// Dto proprio, sem PartialType(CreateNegotiationDto): PATCH continua sem
// mexer em itens nem no total derivado (RI8) — so o create/replace de itens
// (tickets 03/04) ganhou items no lugar de totalValue.
export class UpdateNegotiationDto {
  @IsUUID()
  @IsOptional()
  clientId?: string;

  // Recusado de forma explicita em vez de sumir pelo whitelist: com itens o
  // total e a soma dos subtotais, e sem itens o valor informado nao e mais
  // digitado (ADR 0015). Aceitar aqui quebraria totalValue == Σ subtotais.
  @IsEmpty({
    message:
      'totalValue não é editável: o valor da Negociação vem da soma dos itens',
  })
  totalValue?: never;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}
