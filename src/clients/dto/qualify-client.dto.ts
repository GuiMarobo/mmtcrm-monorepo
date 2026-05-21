import { IsEnum } from 'class-validator';
import { LeadQualificationEnum } from './create-client.dto';

export class QualifyClientDto {
  @IsEnum(LeadQualificationEnum)
  qualification!: LeadQualificationEnum;
}
