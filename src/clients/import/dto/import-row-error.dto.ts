export class ImportRowErrorDto {
  rowNumber!: number;
  field?: string;
  message!: string;
  rawData?: Record<string, string>;
}