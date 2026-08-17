import {
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  IsUUID,
  MaxLength,
  Min,
} from 'class-validator';

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
export class CreateNegotiationDto {
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
