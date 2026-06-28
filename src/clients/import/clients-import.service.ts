import { BadRequestException, Injectable } from '@nestjs/common'
import { parse } from 'csv-parse/sync'
import { PrismaService } from '../../prisma/prisma.service'
import { parseClientRow } from './parsers/client-row.parser'
import { ImportReportDto } from './dto/import-report.dto'
import { ImportRowErrorDto } from './dto/import-row-error.dto'
import { ImportClientRowDto } from './dto/import-client-row.dto'

interface QueuedRow {
  rowNumber: number
  rawData: Record<string, string>
  dto: ImportClientRowDto
}

const KNOWN_COLUMNS = new Set<string>([
  'name',
  'email',
  'phone',
  'cpf',
  'address',
  'status',
  'qualification',
  'origin',
  'notes',
])

@Injectable()
export class ClientsImportService {
  constructor(private readonly prisma: PrismaService) {}

  async importCsv(buffer: Buffer, dryRun: boolean): Promise<ImportReportDto> {
    const records = this.parseCsv(buffer)
    const ignoredColumns = this.extractIgnoredColumns(records)

    const errors: ImportRowErrorDto[] = []
    const queued: QueuedRow[] = []
    const cpfsInFile = new Set<string>()
    let failedRows = 0

    records.forEach((rawData, index) => {

      const rowNumber = index + 2

      const result = parseClientRow(rawData)

      if (!result.ok) {
        failedRows++
        result.errors.forEach((e) =>
          errors.push({
            rowNumber,
            field: e.field,
            message: e.message,
            rawData,
          }),
        )
        return
      }

      const cpf = result.data.cpf
      if (cpf && cpfsInFile.has(cpf)) {
        failedRows++
        errors.push({
          rowNumber,
          field: 'cpf',
          message: 'CPF duplicado no próprio arquivo',
          rawData,
        })
        return
      }
      if (cpf) cpfsInFile.add(cpf)

      queued.push({ rowNumber, rawData, dto: result.data })
    })

    const cpfsToCheck = queued
      .map((r) => r.dto.cpf)
      .filter((c): c is string => !!c)

    const existing = cpfsToCheck.length
      ? await this.prisma.client.findMany({
          where: { cpf: { in: cpfsToCheck } },
          select: { cpf: true },
        })
      : []
    const existingCpfs = new Set(
      existing.map((c) => c.cpf).filter((c): c is string => !!c),
    )

    const toCreate: QueuedRow[] = []
    let skipped = 0
    queued.forEach((row) => {
      if (row.dto.cpf && existingCpfs.has(row.dto.cpf)) {
        skipped++
        return
      }
      toCreate.push(row)
    })

    if (!dryRun && toCreate.length > 0) {
      await this.prisma.client.createMany({
        data: toCreate.map((r) => ({
          name: r.dto.name,
          email: r.dto.email,
          phone: r.dto.phone,
          cpf: r.dto.cpf,
          address: r.dto.address,
          status: r.dto.status ?? 'LEAD',
          qualification: r.dto.qualification ?? 'NAO_QUALIFICADO',
          origin: r.dto.origin,
          notes: r.dto.notes,
        })),
        skipDuplicates: true,
      })
    }

    return {
      dryRun,
      totalRows: records.length,
      toCreate: toCreate.length,
      skipped,
      failed: failedRows,
      errors,
      ignoredColumns,
    }
  }

  private parseCsv(buffer: Buffer): Record<string, string>[] {
    try {
      return parse(buffer, {
        columns: (header: string[]) => header.map((h) => h.trim().toLowerCase()),
        trim: true,
        skip_empty_lines: true,
        bom: true, // tolera o BOM que o Excel adiciona ao salvar CSV
      })
    } catch (err) {
      throw new BadRequestException(
        `CSV inválido: ${err instanceof Error ? err.message : 'erro desconhecido'}`,
      )
    }
  }

  private extractIgnoredColumns(
    records: Record<string, string>[],
  ): string[] {
    if (records.length === 0) return []
    return Object.keys(records[0]).filter((k) => !KNOWN_COLUMNS.has(k))
  }
}
