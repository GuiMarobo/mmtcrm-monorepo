import { PartialType } from '@nestjs/mapped-types';
import { CreateNegotiationDto } from './create-negotiation.dto';

export class UpdateNegotiationDto extends PartialType(CreateNegotiationDto) {}
