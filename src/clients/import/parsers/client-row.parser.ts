import { plainToInstance } from 'class-transformer'
import { validateSync, ValidationError } from 'class-validator'
import { ImportClientRowDto } from '../dto/import-client-row.dto'

export interface ParseSuccess {
  ok: true
  data: ImportClientRowDto
}

export interface ParseFailure {
  ok: false
  errors: { field?: string; message: string }[]
}

export type ParseResult = ParseSuccess | ParseFailure

function normalize(value: string | undefined): string | undefined {
  const trimmed = value?.trim()
  return trimmed || undefined
}

function parseLtv(raw: string | undefined): number | undefined {
  const trimmed = raw?.trim()
  if (!trimmed) return undefined
  const cleaned = trimmed
    .replace(/R\$\s*/g, '')
    .replace(/\./g, '')
    .replace(',', '.')
    .trim()
  const value = parseFloat(cleaned)
  return isNaN(value) || value <= 0 ? undefined : value
}

function composeAddress(raw: Record<string, string>): string | undefined {
  const street = normalize(raw.endereco)
  const number = normalize(raw.numero)
  const complement = normalize(raw.complemento)
  const neighborhood = normalize(raw.bairro)
  const city = normalize(raw.cidade)
  const state = normalize(raw.estado)
  const zip = normalize(raw.cep)

  if (!street && !city && !zip) return undefined

  const parts: string[] = []
  if (street) {
    parts.push(number ? `${street}, ${number}` : street)
  }
  if (complement) parts.push(complement)
  if (neighborhood) parts.push(neighborhood)
  if (city && state) parts.push(`${city}/${state}`)
  else if (city) parts.push(city)
  else if (state) parts.push(state)
  if (zip) parts.push(`CEP ${zip}`)

  return parts.join(' - ')
}

function composeNotes(raw: Record<string, string>): string | undefined {
  const parts: string[] = []
  const birthDate = normalize(raw.nascimento)
  const referredBy = normalize(raw.indicado_por)
  const indicationsCount = normalize(raw.qtd_indicacoes)

  if (birthDate) parts.push(`Nasc: ${birthDate}`)
  if (referredBy) parts.push(`Indicado por: ${referredBy}`)
  if (indicationsCount && indicationsCount !== '0') {
    parts.push(`Indicações feitas: ${indicationsCount}`)
  }

  return parts.length ? parts.join(' | ') : undefined
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
  const ltv = parseLtv(row.ltv)
  const referredBy = normalize(row.indicado_por)

  const normalized: Record<string, unknown> = {
    name: normalize(row.nome),
    phone: normalize(row.telefone),
    cpf: normalize(row.cpf),
    address: composeAddress(row),
    ltv,
    status: ltv ? 'ATIVO' : 'LEAD',
    qualification: ltv ? 'QUALIFICADO' : 'NAO_QUALIFICADO',
    origin: referredBy ? 'INDICACAO' : 'OUTRO',
    notes: composeNotes(row),
  }

  if (!normalized.phone && !normalized.cpf) {
    return {
      ok: false,
      errors: [{ field: 'phone/cpf', message: 'Linha sem telefone nem CPF - não é possível identificar o cliente' }],
    }
  }

  const dto = plainToInstance(ImportClientRowDto, normalized)
  const errors = validateSync(dto, { whitelist: true })
  if (errors.length > 0) {
    return { ok: false, errors: flattenErrors(errors) }
  }

  return { ok: true, data: dto }
}
