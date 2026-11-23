import { describe, expect, it } from 'vitest'
import { skuSlug, suggestSku } from './skuSuggestion'

describe('skuSlug', () => {
  it.each([
    ['iPhone 15 Pro 256GB', 'IPHONE-15-PRO-256GB'],
    ['Película de Proteção Câmera', 'PELICULA-DE-PROTECAO-CAMERA'],
    ['Capa  —  Couro (MagSafe)', 'CAPA-COURO-MAGSAFE'],
    ['  #AirPods Pro 2!  ', 'AIRPODS-PRO-2'],
    ['!!! ???', ''],
  ])('%j vira %j', (name, sku) => {
    expect(skuSlug(name)).toBe(sku)
  })

  it('corta em 60 caracteres sem deixar hífen na ponta', () => {
    const name = `${'A'.repeat(59)} BCD`

    expect(skuSlug(name)).toBe('A'.repeat(59))
    expect(skuSlug('B'.repeat(70))).toBe('B'.repeat(60))
  })
})

describe('suggestSku', () => {
  it.each<[string, string[], string]>([
    ['iPhone 15 Pro', ['MBA-M3'], 'IPHONE-15-PRO'],
    ['iPhone 15 Pro', [' iphone-15-pro '], 'IPHONE-15-PRO-2'],
    ['iPhone 15 Pro', ['IPHONE-15-PRO', 'iphone-15-pro-2'], 'IPHONE-15-PRO-3'],
    ['!!!', [''], ''],
  ])('%j com %j sugere %j', (name, taken, sku) => {
    expect(suggestSku(name, taken)).toBe(sku)
  })

  it('o sufixo cabe nos 60 caracteres', () => {
    const base = 'A'.repeat(60)

    expect(suggestSku(base, [base])).toBe(`${'A'.repeat(58)}-2`)
  })
})
