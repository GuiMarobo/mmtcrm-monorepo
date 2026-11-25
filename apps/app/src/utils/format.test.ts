import { describe, expect, it } from 'vitest'
import {
  formatCurrency,
  maskCnpj,
  parseCurrencyInput,
  parseDecimal,
  sanitizeDecimal,
  sanitizeInteger,
} from './format'

describe('parseCurrencyInput', () => {
  it.each([
    ['1', 0.01],
    ['199900', 1999],
    [formatCurrency(1999) + '5', 19990.05],
    ['-12a3', 1.23],
  ])('%p vira %p', (raw, value) => {
    expect(parseCurrencyInput(raw)).toBe(value)
  })

  it.each(['', 'abc', '000', 'R$ 0,0'])('%p vira vazio', (raw) => {
    expect(parseCurrencyInput(raw)).toBeNull()
  })
})

describe('sanitizeInteger', () => {
  it.each([
    ['-3', '3'],
    ['1.5', '15'],
    ['1e3', '13'],
    ['007', '7'],
    ['0', '0'],
    ['12345678901234', '1234567890'],
  ])('%p vira %p', (raw, clean) => {
    expect(sanitizeInteger(raw)).toBe(clean)
  })
})

describe('sanitizeDecimal', () => {
  it.each([
    ['-1,5', '1,5'],
    ['1.255', '1.25'],
    ['1,2,3', '1,23'],
    ['abc', ''],
    ['05', '5'],
    ['0,5', '0,5'],
  ])('%p vira %p', (raw, clean) => {
    expect(sanitizeDecimal(raw)).toBe(clean)
  })
})

describe('parseDecimal', () => {
  it('lê vírgula e ponto como separador decimal', () => {
    expect(parseDecimal('2,5')).toBe(2.5)
    expect(parseDecimal('2.5')).toBe(2.5)
  })

  it('vazio não vira zero', () => {
    expect(parseDecimal('')).toBeNaN()
  })
})

describe('maskCnpj', () => {
  it('formata progressivamente', () => {
    expect(maskCnpj('11222')).toBe('11.222')
    expect(maskCnpj('11222333000181')).toBe('11.222.333/0001-81')
  })
})
