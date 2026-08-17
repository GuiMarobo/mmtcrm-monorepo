import { BadRequestException, Injectable } from '@nestjs/common';
import { parse } from 'csv-parse/sync';
import {
  ClientStatus,
  LeadQualification,
} from '../../../generated/prisma/client';
import { NOT_DELETED, PrismaService } from '../../prisma/prisma.service';
import { parseClientRow } from './parsers/client-row.parser';
import { ImportReportDto } from './dto/import-report.dto';
import { ImportRowErrorDto } from './dto/import-row-error.dto';
import { ImportClientRowDto } from './dto/import-client-row.dto';

interface QueuedRow {
  rowNumber: number;
  rawData: Record<string, string>;
  dto: ImportClientRowDto;
}

const KNOWN_COLUMNS = new Set<string>([
  'nome',
  'ltv',
  'nascimento',
  'cpf',
  'telefone',
  'indicado_por',
  'qtd_indicacoes',
  'cep',
  'endereco',
  'numero',
  'complemento',
  'bairro',
  'cidade',
  'estado',
  'pais',
]);

@Injectable()
export class ClientsImportService {
  constructor(private readonly prisma: PrismaService) {}

  async importCsv(buffer: Buffer, dryRun: boolean): Promise<ImportReportDto> {
    const records = this.parseCsv(buffer);
    const ignoredColumns = this.extractIgnoredColumns(records);

    const errors: ImportRowErrorDto[] = [];
    const queued: QueuedRow[] = [];
    const cpfsInFile = new Set<string>();
    let failedRows = 0;

    records.forEach((rawData, index) => {
      const rowNumber = index + 5;

      const result = parseClientRow(rawData);

      if (!result.ok) {
        failedRows++;
        result.errors.forEach((e) =>
          errors.push({
            rowNumber,
            field: e.field,
            message: e.message,
            rawData,
          }),
        );
        return;
      }

      const cpf = result.data.cpf;
      if (cpf && cpfsInFile.has(cpf)) {
        failedRows++;
        errors.push({
          rowNumber,
          field: 'cpf',
          message: 'CPF duplicado no próprio arquivo',
          rawData,
        });
        return;
      }
      if (cpf) cpfsInFile.add(cpf);

      queued.push({ rowNumber, rawData, dto: result.data });
    });

    const cpfsToCheck = queued
      .map((r) => r.dto.cpf)
      .filter((c): c is string => !!c);

    const existing = cpfsToCheck.length
      ? await this.prisma.client.findMany({
          where: { ...NOT_DELETED, cpf: { in: cpfsToCheck } },
          select: { cpf: true },
        })
      : [];
    const existingCpfs = new Set(
      existing.map((c) => c.cpf).filter((c): c is string => !!c),
    );

    const toCreate: QueuedRow[] = [];
    let skipped = 0;
    queued.forEach((row) => {
      if (row.dto.cpf && existingCpfs.has(row.dto.cpf)) {
        skipped++;
        return;
      }
      toCreate.push(row);
    });

    const withLtv = toCreate.filter((r) => r.dto.ltv !== undefined);
    const withoutLtv = toCreate.filter((r) => r.dto.ltv === undefined);

    if (!dryRun && toCreate.length > 0) {
      await this.prisma.$transaction(async (tx) => {
        if (withoutLtv.length > 0) {
          await tx.client.createMany({
            data: withoutLtv.map((r) => this.toClientData(r.dto)),
            skipDuplicates: true,
          });
        }

        if (withLtv.length > 0) {
          await Promise.all(
            withLtv.map((r) =>
              tx.client.create({
                data: {
                  ...this.toClientData(r.dto),
                  negotiations: {
                    create: {
                      status: 'GANHA',
                      totalValue: r.dto.ltv!,
                      closedAt: new Date(),
                      notes: 'Importado via CSV',
                      order: {
                        create: {
                          code: `IMP-${r.rowNumber}`,
                          status: 'COMPRA_APROVADA',
                          totalValue: r.dto.ltv!,
                          notes: 'Importado via CSV',
                        },
                      },
                    },
                  },
                },
                select: { id: true },
              }),
            ),
          );
        }
      });
    }

    return {
      dryRun,
      totalRows: records.length,
      toCreate: toCreate.length,
      skipped,
      failed: failedRows,
      negotiationsCreated: dryRun ? 0 : withLtv.length,
      errors,
      ignoredColumns,
    };
  }

  private toClientData(dto: ImportClientRowDto) {
    return {
      name: dto.name,
      email: dto.email,
      phone: dto.phone,
      cpf: dto.cpf,
      address: dto.address,
      status: (dto.status ?? 'LEAD') as ClientStatus,
      qualification: (dto.qualification ??
        'NAO_QUALIFICADO') as LeadQualification,
      origin: dto.origin,
      notes: dto.notes,
    };
  }

  private parseCsv(buffer: Buffer): Record<string, string>[] {
    try {
      return parse(buffer, {
        columns: (headers: string[]) =>
          headers.map((h) => this.normalizeColumnName(h)),
        trim: true,
        skip_empty_lines: true,
        bom: true,
        from_line: 4,
      });
    } catch (err) {
      throw new BadRequestException(
        `CSV inválido: ${err instanceof Error ? err.message : 'erro desconhecido'}`,
      );
    }
  }

  private normalizeColumnName(raw: string): string {
    const key = raw
      .toLowerCase()
      .normalize('NFD')
      .replace(/[̀-ͯ]/g, '')
      .replace(/[^a-z0-9]+/g, ' ')
      .trim();

    const map: Record<string, string> = {
      nome: 'nome',
      ltv: 'ltv',
      'data de nascimento': 'nascimento',
      'cpf cnpj': 'cpf',
      telefone: 'telefone',
      'quem indicou': 'indicado_por',
      'qtd indicacoes': 'qtd_indicacoes',
      cep: 'cep',
      endereco: 'endereco',
      numero: 'numero',
      complemento: 'complemento',
      bairro: 'bairro',
      cidade: 'cidade',
      estado: 'estado',
      pais: 'pais',
    };

    return map[key] ?? key;
  }

  private extractIgnoredColumns(records: Record<string, string>[]): string[] {
    if (records.length === 0) return [];
    return Object.keys(records[0]).filter((k) => !KNOWN_COLUMNS.has(k));
  }
}
