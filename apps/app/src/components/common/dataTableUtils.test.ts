import { describe, expect, it } from 'vitest'
import { matchesQuery, sortRows } from './dataTableUtils'

describe('sortRows', () => {
  it('ordena números pelo valor, não pelo texto', () => {
    const rows = [{ v: 100 }, { v: 9 }, { v: 25 }]
    expect(sortRows(rows, (r) => r.v, 'asc').map((r) => r.v)).toEqual([9, 25, 100])
    expect(sortRows(rows, (r) => r.v, 'desc').map((r) => r.v)).toEqual([100, 25, 9])
  })

  it('ordena textos em pt-BR com números embutidos na ordem natural', () => {
    const rows = ['PED-10', 'PED-2', 'Ágata', 'abel']
    expect(sortRows(rows, (r) => r, 'asc')).toEqual(['abel', 'Ágata', 'PED-2', 'PED-10'])
  })

  it('não altera a lista original', () => {
    const rows = [3, 1, 2]
    sortRows(rows, (r) => r, 'asc')
    expect(rows).toEqual([3, 1, 2])
  })
})

describe('matchesQuery', () => {
  it('busca vazia aceita tudo', () => {
    expect(matchesQuery(['Maria'], '   ')).toBe(true)
  })

  it('ignora acento e caixa', () => {
    expect(matchesQuery(['João Gonçalves'], 'joao goncalves')).toBe(true)
  })

  it('exige que cada termo apareça em algum dos valores', () => {
    expect(matchesQuery(['Maria Souza', 'maria@mmt.com'], 'maria mmt')).toBe(true)
    expect(matchesQuery(['Maria Souza', 'maria@mmt.com'], 'maria pedro')).toBe(false)
  })

  it('ignora valores nulos', () => {
    expect(matchesQuery([null, undefined, 'Ana'], 'ana')).toBe(true)
  })
})
