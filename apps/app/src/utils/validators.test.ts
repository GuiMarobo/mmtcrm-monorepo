import { describe, expect, it } from 'vitest'
import { ratePercentError } from './validators'

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
