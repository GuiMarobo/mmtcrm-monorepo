import { IsString, MaxLength } from 'class-validator';

// RD7: o laudo é o motivo da recusa. Vazio ou só com espaços é recusado no
// service, em pt-BR.
export class RefuseUsedDeviceDto {
  @IsString()
  @MaxLength(2000)
  report!: string;
}
