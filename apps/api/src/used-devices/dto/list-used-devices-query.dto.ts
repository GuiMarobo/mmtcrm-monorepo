import { IsEnum, IsOptional } from 'class-validator';

// Filtro da Fila de avaliação: os três resultados da avaliação mais TODOS.
export enum UsedDeviceQueueFilter {
  AGUARDANDO = 'AGUARDANDO',
  AVALIADO = 'AVALIADO',
  RECUSADO = 'RECUSADO',
  TODOS = 'TODOS',
}

export class ListUsedDevicesQueryDto {
  // Ausente, vale AGUARDANDO (RD15).
  @IsOptional()
  @IsEnum(UsedDeviceQueueFilter)
  status?: UsedDeviceQueueFilter;
}
