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

// Só PaymentMethod precisa de enum aqui: é o único que chega pelo corpo de uma
// requisição e passa pelo @IsEnum. NegotiationStatus e OrderStatus nunca são
// enviados pelo cliente — o service os controla pela máquina de estados, usando
// os enums gerados pelo Prisma.
export enum PaymentMethodEnum {
  PIX = 'PIX',
  DINHEIRO = 'DINHEIRO',
  CARTAO_CREDITO = 'CARTAO_CREDITO',
  CARTAO_DEBITO = 'CARTAO_DEBITO',
  BOLETO = 'BOLETO',
  TRANSFERENCIA = 'TRANSFERENCIA',
}

// vendedorId nao entra no DTO de proposito: o responsavel e sempre o usuario
// autenticado, lido do token no controller (spec 001, Q2). Como o ValidationPipe
// global usa whitelist, mandar o campo no corpo nao tem efeito.
//
// totalValue nao entra mais no DTO (spec 010, RI8): com itens, o total e
// sempre derivado da soma dos subtotais, gravado pelo service na mesma
// transacao da escrita dos itens.
export class CreateNegotiationDto {
  @IsUUID()
  @IsNotEmpty()
  clientId!: string;

  // RI3: lista completa de itens. Vazia e valida — Negociacao nasce com
  // total R$ 0,00.
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => CreateNegotiationItemDto)
  items!: CreateNegotiationItemDto[];

  @IsString()
  @IsOptional()
  @MaxLength(1000)
  notes?: string;
}
