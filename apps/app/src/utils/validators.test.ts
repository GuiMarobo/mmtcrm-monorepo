import { describe, expect, it } from 'vitest'
import {
  imeiError,
  isPositiveInteger,
  isValidCnpj,
  isValidPhone,
  personNameError,
  priceError,
  quantityError,
  ratePercentError,
  validityDaysError,
} from './validators'

describe('ratePercentError', () => {
  it.each(['0', '1.15', '0.29', '0.57', '12.5', '100', '100.00', '1,15', '12,5'])('aceita %p', (value) => {
    expect(ratePercentError(value)).toBeUndefined()
  })

  it.each([
    ['', 'Informe a taxa.'],
    ['-0.01', 'De 0 a 100%.'],
    ['100.01', 'De 0 a 100%.'],
    ['abc', 'De 0 a 100%.'],
    ['1.234', 'Até duas casas decimais.'],
  ])('recusa %p', (value, message) => {
    expect(ratePercentError(value)).toBe(message)
  })
})

describe('imeiError', () => {
  it.each(['', '   ', '356789012345678', ' 356789012345678 '])('aceita %p', (value) => {
    expect(imeiError(value)).toBeUndefined()
  })

  it.each(['35678901234567', '3567890123456789', '35678901234567A'])('recusa %p', (value) => {
    expect(imeiError(value)).toBe('O IMEI tem 15 dígitos.')
  })
})

describe('quantityError (história 44, só para UX — o backend decide)', () => {
  it.each([0, -1, 1.5, null])('recusa %s', (quantity) => {
    expect(quantityError(quantity)).toBe('Inteiro a partir de 1')
  })

  it.each([1, 3])('aceita %s', (quantity) => {
    expect(quantityError(quantity)).toBeUndefined()
  })
})

describe('isValidPhone', () => {
  it.each(['11987654321', '(11) 98765-4321', '1132654321'])('aceita %p', (phone) => {
    expect(isValidPhone(phone)).toBe(true)
  })

  it.each(['119876543', '0198765432', '11887654321', '11111111111', '(00) 00000-0000'])(
    'recusa %p',
    (phone) => {
      expect(isValidPhone(phone)).toBe(false)
    },
  )
})

describe('isValidCnpj', () => {
  it('aceita CNPJ com ou sem máscara', () => {
    expect(isValidCnpj('11222333000181')).toBe(true)
    expect(isValidCnpj('11.222.333/0001-81')).toBe(true)
  })

  it.each(['11222333000182', '00000000000000', '1122233300018'])('recusa %p', (cnpj) => {
    expect(isValidCnpj(cnpj)).toBe(false)
  })
})

describe('personNameError', () => {
  it.each(['Maria', 'João da Silva', "Ana D'Ávila", 'Ana-Clara'])('aceita %p', (name) => {
    expect(personNameError(name, 'Informe o nome.')).toBeUndefined()
  })

  const SYMBOLS = 'Só letras, espaço, hífen e apóstrofo — sem números ou símbolos.'

  it.each([
    ['', 'Informe o nome.'],
    ['   ', 'Informe o nome.'],
    ['12345', SYMBOLS],
    ['Maria 2', SYMBOLS],
    ['Maria/José', SYMBOLS],
    ['Maria!', SYMBOLS],
    ['maria@email', SYMBOLS],
    ['a'.repeat(201), 'Até 200 caracteres.'],
  ])('recusa %p', (value, message) => {
    expect(personNameError(value, 'Informe o nome.')).toBe(message)
  })
})

describe('priceError', () => {
  it('aceita preço dentro do Decimal(12, 2)', () => {
    expect(priceError(0.01)).toBeUndefined()
    expect(priceError(9_999_999_999.99)).toBeUndefined()
  })

  it.each([
    [null, 'Informe o preço de venda.'],
    [-1, 'Preço inválido.'],
    [Number.NaN, 'Preço inválido.'],
    [10_000_000_000, 'Preço acima do limite permitido.'],
  ])('recusa %p', (value, message) => {
    expect(priceError(value)).toBe(message)
  })
})

describe('isPositiveInteger', () => {
  it.each(['1', '42', '2147483647'])('aceita %p', (value) => {
    expect(isPositiveInteger(value)).toBe(true)
  })

  it.each(['', '0', '-1', '1.5', '1e3', 'abc', '2147483648'])('recusa %p', (value) => {
    expect(isPositiveInteger(value)).toBe(false)
  })
})

describe('validityDaysError', () => {
  it.each(['0', '91', '1.5', '1e1', '-5'])('recusa %p', (value) => {
    expect(validityDaysError(value)).toBe('A validade deve ser de 1 a 90 dias.')
  })
})
