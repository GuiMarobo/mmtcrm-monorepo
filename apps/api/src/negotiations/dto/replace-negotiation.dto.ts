import { Type } from 'class-transformer';
import {
  IsArray,
  IsNotEmpty,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  ValidateNested,
} from 'class-validator';
import { CreateNegotiationItemDto } from './create-negotiation-item.dto';

// PUT substitui: exige o conjunto completo, igual ao create. totalValue nao
// entra mais no DTO (spec 010, ticket 04): com itens, o total e sempre
// derivado da soma dos subtotais, gravado pelo service na mesma transacao da
// escrita dos itens.
export class ReplaceNegotiationDto {
  @IsUUID()
  @IsNotEmpty()
  clientId!: string;

  // RI3/RI10: lista completa de itens. O service compara com os itens
  // gravados por Produto para decidir o que incluir, alterar ou excluir.
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNegotiationItemDto)
  items!: CreateNegotiationItemDto[];

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}
