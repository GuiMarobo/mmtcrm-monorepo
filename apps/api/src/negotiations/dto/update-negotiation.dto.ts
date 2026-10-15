import {
  Equals,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
} from 'class-validator';

// Dto próprio, sem PartialType(CreateNegotiationDto): PATCH continua sem
// mexer em itens nem no total derivado (RI8) — só o create/replace de itens
// (tickets 03/04) ganhou items no lugar de totalValue.
export class UpdateNegotiationDto {
  @IsUUID()
  @IsOptional()
  clientId?: string;

  // Recusado de forma explícita em vez de sumir pelo whitelist: com itens o
  // total é a soma dos subtotais, e sem itens o valor informado não é mais
  // digitado (ADR 0015). Aceitar aqui quebraria totalValue == Σ subtotais.
  // Equals(undefined), e não IsEmpty, porque IsEmpty deixa passar null e ''.
  @Equals(undefined, {
    message:
      'totalValue não é editável: o valor da Negociação vem da soma dos itens',
  })
  totalValue?: never;

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}
