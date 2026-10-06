import { PartialType } from '@nestjs/mapped-types';
import { CreateUsedDeviceDto } from './create-used-device.dto';

// RD4: corrige o que o Vendedor digitou enquanto o aparelho aguarda avaliação.
// Os campos da avaliação não chegam por aqui — o whitelist os descarta.
export class UpdateUsedDeviceDto extends PartialType(CreateUsedDeviceDto) {}
