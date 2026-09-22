import { describe, expect, it } from 'vitest'
import { formatIsoDate } from '../../utils/format'
import { validUntilError, validityDateFrom } from './quotationValidity'

const today = new Date(2026, 8, 22, 23, 30)

describe('validityDateFrom', () => {
  it('soma os dias ao dia de hoje no fuso local', () => {
    expect(validityDateFrom(today, 7)).toBe('2026-09-29')
  })

  it('atravessa a virada do mês e do ano', () => {
    expect(validityDateFrom(today, 10)).toBe('2026-10-02')
    expect(validityDateFrom(new Date(2026, 11, 30), 3)).toBe('2027-01-02')
  })
})

describe('validUntilError', () => {
  it('aceita de amanhã a hoje + 90 dias', () => {
    expect(validUntilError('2026-09-23', today)).toBeUndefined()
    expect(validUntilError('2026-12-21', today)).toBeUndefined()
  })

  it('recusa hoje, o passado e depois de 90 dias', () => {
    expect(validUntilError('2026-09-22', today)).toBe('De 23/09/2026 a 21/12/2026.')
    expect(validUntilError('2026-09-01', today)).toBe('De 23/09/2026 a 21/12/2026.')
    expect(validUntilError('2026-12-22', today)).toBe('De 23/09/2026 a 21/12/2026.')
  })

  it('exige a data', () => {
    expect(validUntilError('', today)).toBe('Informe a validade.')
  })
})

describe('formatIsoDate', () => {
  it('formata data sem hora sem cair no dia anterior pelo fuso', () => {
    expect(formatIsoDate('2026-10-02')).toBe('02/10/2026')
  })
})
