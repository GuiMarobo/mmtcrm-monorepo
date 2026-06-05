import { ImportRowErrorDto } from './import-row-error.dto'

export class ImportReportDto {
  dryRun!: boolean              // foi simulação ou execução real?
  totalRows!: number            // total de linhas processadas
  toCreate!: number             // linhas que viram clientes novos
  skipped!: number              // linhas puladas (duplicados, etc.)
  failed!: number               // linhas com erro de validação
  errors!: ImportRowErrorDto[]  // detalhamento dos erros
  ignoredColumns!: string[]     // colunas do CSV que o sistema não conhece
}
