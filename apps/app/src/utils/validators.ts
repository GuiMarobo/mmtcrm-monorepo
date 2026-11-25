import { MAX_INTEGER, MAX_MONEY, parseDecimal } from './format'

export function isValidEmail(value: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim())
}

export function isValidPhone(value: string): boolean {
  const digits = value.replace(/\D/g, '')
  if (digits.length !== 10 && digits.length !== 11) return false
  if (/^(\d)\1+$/.test(digits)) return false
  if (Number(digits.slice(0, 2)) < 11) return false
  return digits.length === 10 || digits[2] === '9'
}

export function isValidCnpj(value: string): boolean {
  const cnpj = value.replace(/\D/g, '')
  if (cnpj.length !== 14 || /^(\d)\1{13}$/.test(cnpj)) return false
  const digit = (length: number): number => {
    let sum = 0
    let weight = length - 7
    for (let i = 0; i < length; i++) {
      sum += Number(cnpj[i]) * weight
      weight = weight === 2 ? 9 : weight - 1
    }
    const rest = sum % 11
    return rest < 2 ? 0 : 11 - rest
  }
  return digit(12) === Number(cnpj[12]) && digit(13) === Number(cnpj[13])
}

export const MAX_NAME_LENGTH = 200

export function personNameError(value: string, emptyMessage: string): string | undefined {
  const name = value.trim()
  if (!name) return emptyMessage
  if (!/^[\p{L}][\p{L}\s'-]*$/u.test(name))
    return 'Só letras, espaço, hífen e apóstrofo — sem números ou símbolos.'
  return name.length > MAX_NAME_LENGTH ? `Até ${MAX_NAME_LENGTH} caracteres.` : undefined
}

export function isValidCpf(value: string): boolean {
  const cpf = value.replace(/\D/g, '')
  if (cpf.length !== 11) return false
  if (/^(\d)\1{10}$/.test(cpf)) return false

  const digit = (length: number): number => {
    let sum = 0
    for (let i = 0; i < length; i++) {
      sum += Number(cpf[i]) * (length + 1 - i)
    }
    const rest = (sum * 10) % 11
    return rest === 10 ? 0 : rest
  }

  return digit(9) === Number(cpf[9]) && digit(10) === Number(cpf[10])
}

export function priceError(value: number | null): string | undefined {
  if (value === null) return 'Informe o preço de venda.'
  if (!Number.isFinite(value) || value < 0) return 'Preço inválido.'
  return value > MAX_MONEY ? 'Preço acima do limite permitido.' : undefined
}

export function isPositiveInteger(value: string): boolean {
  if (!/^\d+$/.test(value.trim())) return false
  const n = Number(value)
  return n > 0 && n <= MAX_INTEGER
}

export function isValidQuantity(value: number | null): value is number {
  return value !== null && Number.isInteger(value) && value >= 1 && value <= MAX_INTEGER
}

export function quantityError(value: number | null): string | undefined {
  return isValidQuantity(value) ? undefined : 'Inteiro a partir de 1'
}

export function validityDaysError(value: string): string | undefined {
  if (!value.trim()) return 'Informe a validade padrão.'
  const days = Number(value)
  if (!/^\d+$/.test(value.trim()) || days < 1 || days > 90)
    return 'A validade deve ser de 1 a 90 dias.'
  return undefined
}

export function ratePercentError(value: string): string | undefined {
  if (!value.trim()) return 'Informe a taxa.'
  const normalized = value.trim().replace(',', '.')
  const rate = parseDecimal(normalized)
  if (Number.isNaN(rate) || rate < 0 || rate > 100) return 'De 0 a 100%.'
  return /^\d+(\.\d{1,2})?$/.test(normalized) ? undefined : 'Até duas casas decimais.'
}

export function imeiError(value: string): string | undefined {
  const imei = value.trim()
  if (!imei) return undefined
  return /^\d{15}$/.test(imei) ? undefined : 'O IMEI tem 15 dígitos.'
}
