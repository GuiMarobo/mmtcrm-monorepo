import type { Product, ProductCategory } from '../../types'

export type ProductsTab = 'todos' | 'ativos' | 'inativos' | 'sem-estoque'

export interface ProductsTabDefinition {
  value: ProductsTab
  label: string
  includes: (product: Product) => boolean
  emptyMessage: string
}

export const PRODUCTS_TABS: ProductsTabDefinition[] = [
  {
    value: 'todos',
    label: 'Todos',
    includes: () => true,
    emptyMessage: 'Nenhum produto ainda',
  },
  {
    value: 'ativos',
    label: 'Ativos',
    includes: (product) => product.status === 'ATIVO',
    emptyMessage: 'Nenhum produto ativo',
  },
  {
    value: 'inativos',
    label: 'Inativos',
    includes: (product) => product.status === 'INATIVO',
    emptyMessage: 'Nenhum produto inativo',
  },
  {
    value: 'sem-estoque',
    label: 'Sem estoque',
    includes: (product) => stockLevel(product.stock) === 'zerado',
    emptyMessage: 'Nenhum produto sem estoque',
  },
]

export const INITIAL_PRODUCTS_TAB: ProductsTab = 'todos'

export const tabDefinition = (tab: ProductsTab): ProductsTabDefinition =>
  PRODUCTS_TABS.find((definition) => definition.value === tab) ?? PRODUCTS_TABS[0]

export const productsInTab = (products: Product[], tab: ProductsTab): Product[] =>
  products.filter(tabDefinition(tab).includes)

export const countProductsByTab = (products: Product[]): Record<ProductsTab, number> =>
  Object.fromEntries(
    PRODUCTS_TABS.map(({ value }) => [value, productsInTab(products, value).length]),
  ) as Record<ProductsTab, number>

const normalize = (text: string) =>
  text.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase()

export const searchProducts = (products: Product[], query: string): Product[] => {
  const needle = normalize(query)
  if (!needle) return products
  return products.filter(
    (product) => normalize(product.name).includes(needle) || normalize(product.sku).includes(needle),
  )
}

export const filterByCategories = (
  products: Product[],
  categories: ProductCategory[],
): Product[] =>
  categories.length === 0
    ? products
    : products.filter((product) => categories.includes(product.category))

export type StockLevel = 'zerado' | 'baixo' | 'normal'

export const LOW_STOCK_LIMIT = 3

export const stockLevel = (stock: number): StockLevel => {
  if (stock <= 0) return 'zerado'
  if (stock <= LOW_STOCK_LIMIT) return 'baixo'
  return 'normal'
}
