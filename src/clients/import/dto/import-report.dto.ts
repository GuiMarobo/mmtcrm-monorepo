import { ImportRowErrorDto } from './import-row-error.dto';

export class ImportReportDto {
  dryRun!: boolean;
  totalRows!: number;
  toCreate!: number;
  skipped!: number;
  failed!: number;
  negotiationsCreated!: number;
  errors!: ImportRowErrorDto[];
  ignoredColumns!: string[];
}
