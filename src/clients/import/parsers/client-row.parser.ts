import { plainToInstance } from 'class-transformer'
import { validateSync, ValidationError } from 'class-validator'
import { CreateClientDto } from '../../dto/create-client.dto'

export interface ParseSuccess {
  ok: true
  data: CreateClientDto
}

export interface ParseFailure {
  ok: false
  errors: { field?: string; message: string }[]
}

export type ParseResult = ParseSuccess | ParseFailure

function normalize(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed ? trimmed : undefined
}

function normalizeRow(raw: Record<string, string>): Record<string, unknown> {
  return {
    name: normalize(raw.name),
    email: normalize(raw.email),
    phone: normalize(raw.phone),
    cpf: normalize(raw.cpf),
    address: normalize(raw.address),
    notes: normalize(raw.notes),
    status: normalize(raw.status)?.toUpperCase(),
    qualification: normalize(raw.qualification)?.toUpperCase(),
    origin: normalize(raw.origin)?.toUpperCase(),
  }
}

function flattenErrors(
  errors: ValidationError[],
): { field?: string; message: string }[] {
  return errors.flatMap((e) => {
    const messages = Object.values(e.constraints ?? {})
    return messages.map((message) => ({ field: e.property, message }))
  })
}

export function parseClientRow(row: Record<string, string>): ParseResult {
  const normalized = normalizeRow(row)
  const dto = plainToInstance(CreateClientDto, normalized)
  const errors = validateSync(dto, { whitelist: true })
  if (errors.length > 0) {
    return { ok: false, errors: flattenErrors(errors) }
  }
  return { ok: true, data: dto }
}
