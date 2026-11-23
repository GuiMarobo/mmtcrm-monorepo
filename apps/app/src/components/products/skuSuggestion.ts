export const SKU_MAX_LENGTH = 60

const trimHyphens = (value: string): string => value.replace(/^-+|-+$/g, '')

export const skuSlug = (name: string): string =>
  trimHyphens(
    trimHyphens(
      name
        .normalize('NFD')
        .replace(/[̀-ͯ]/g, '')
        .toUpperCase()
        .replace(/[^A-Z0-9]+/g, '-'),
    ).slice(0, SKU_MAX_LENGTH),
  )

const normalizeSku = (sku: string): string => sku.trim().toUpperCase()

const withSuffix = (base: string, n: number): string => {
  const suffix = `-${n}`
  return `${trimHyphens(base.slice(0, SKU_MAX_LENGTH - suffix.length))}${suffix}`
}

export const suggestSku = (name: string, taken: string[]): string => {
  const base = skuSlug(name)
  if (!base) return base
  const used = new Set(taken.map(normalizeSku))
  if (!used.has(base)) return base
  let n = 2
  while (used.has(withSuffix(base, n))) n += 1
  return withSuffix(base, n)
}
