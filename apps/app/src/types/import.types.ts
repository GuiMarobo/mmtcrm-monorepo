export interface ImportRowError {
  rowNumber: number
  field?: string
  message: string
  rawData?: Record<string, string>
}

export interface ImportReport {
  dryRun: boolean
  totalRows: number
  toCreate: number
  skipped: number
  failed: number
  negotiationsCreated: number
  errors: ImportRowError[]
  ignoredColumns: string[]
}
