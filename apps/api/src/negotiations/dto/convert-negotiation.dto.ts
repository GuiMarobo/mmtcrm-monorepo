import { IsEnum } from 'class-validator';
import { PaymentMethodEnum } from './create-negotiation.dto';

export class ConvertNegotiationDto {
  @IsEnum(PaymentMethodEnum)
  paymentMethod!: PaymentMethodEnum;
}
