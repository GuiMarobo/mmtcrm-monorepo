import { describe, expect, it } from 'vitest'
import { imeiError, quantityError, ratePercentError } from './validators'

describe('ratePercentError', () => {
  it.each(['0', '1.15', '0.29', '0.57', '12.5', '100', '100.00'])('aceita %p', (value) => {
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
