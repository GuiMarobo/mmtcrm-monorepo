import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { DataGridPremium } from '@mui/x-data-grid-premium'
import type { GridColDef } from '@mui/x-data-grid-premium'
import { useMemo, useState, type ReactNode } from 'react'
import { CategoryAvatar } from './CategoryAvatar'
import { ProductStatusBadge } from './ProductStatusBadge'
import {
  INITIAL_PRODUCTS_TAB,
  PRODUCTS_TABS,
  countProductsByTab,
  filterByCategories,
  productsInTab,
  searchProducts,
  stockLevel,
  tabDefinition,
} from './productsList'
import type { ProductsTab } from './productsList'
import { FilterButton, FilterChips } from '../common/FilterPanel'
import { SearchField } from '../common/SearchField'
import { SectionToolbar } from '../common/SectionCard'
import { ToneChip } from '../common/ToneChip'
import { formatCurrency, formatDate } from '../../utils/format'
import type { Product, ProductCategory } from '../../types'
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_CATEGORY_OPTIONS,
  PRODUCT_STATUS_LABELS,
} from '../../types'

interface ProductsGridProps {
  rows: Product[]
  loading: boolean
  onOpen: (product: Product) => void
  disableVirtualization?: boolean
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

function ProductCell({ product }: { product: Product }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      <CategoryAvatar category={product.category} />
      <Box sx={{ display: 'grid', gap: 0.25, minWidth: 0 }}>
        <Box component="span" data-testid="product-name" sx={{ fontWeight: 600 }}>
          {product.name}
        </Box>
        <Box component="span" sx={{ color: 'text.disabled', fontSize: 12 }}>
          {PRODUCT_CATEGORY_LABELS[product.category]}
        </Box>
      </Box>
    </Box>
  )
}

function CodeCell({ product }: { product: Product }) {
  return (
    <Box sx={{ display: 'grid', gap: 0.25 }}>
      <Box component="span" sx={{ fontWeight: 500 }}>
        {product.sku}
      </Box>
      <Box component="span" sx={{ color: 'text.disabled', fontSize: 12 }}>
        {formatDate(product.createdAt)}
      </Box>
    </Box>
  )
}

function StockChip({ stock }: { stock: number }) {
  const level = stockLevel(stock)
  if (level === 'zerado') {
    return (
      <ToneChip tone="red" dot>
        Sem estoque
      </ToneChip>
    )
  }
  if (level === 'baixo') {
    return (
      <ToneChip tone="amber" dot>
        {`Estoque baixo · ${stock} un.`}
      </ToneChip>
    )
  }
  return (
    <ToneChip tone="green" dot>
      {`${stock} un.`}
    </ToneChip>
  )
}

const columns: GridColDef<Product>[] = [
  {
    field: 'name',
    headerName: 'Produto',
    flex: 2,
    minWidth: 240,
    renderCell: ({ row }) => <ProductCell product={row} />,
  },
  {
    field: 'sku',
    headerName: 'Código & Cadastro',
    flex: 1.2,
    minWidth: 150,
    renderCell: ({ row }) => <CodeCell product={row} />,
  },
  {
    field: 'price',
    headerName: 'Preço (R$)',
    type: 'number',
    flex: 1,
    minWidth: 130,
    renderCell: ({ row }) => (
      <Box component="span" sx={{ fontWeight: 700 }}>
        {formatCurrency(row.price)}
      </Box>
    ),
  },
  {
    field: 'stock',
    headerName: 'Estoque',
    type: 'number',
    flex: 1.2,
    minWidth: 170,
    renderCell: ({ row }) => <StockChip stock={row.stock} />,
  },
  {
    field: 'status',
    headerName: 'Situação',
    flex: 0.8,
    minWidth: 110,
    valueGetter: (_, row) => PRODUCT_STATUS_LABELS[row.status],
    renderCell: ({ row }) => <ProductStatusBadge status={row.status} />,
  },
]

export function ProductsGrid({
  rows,
  loading,
  onOpen,
  disableVirtualization = false,
}: ProductsGridProps) {
  const theme = useTheme()
  const narrow = useMediaQuery(theme.breakpoints.down('sm'))
  const [tab, setTab] = useState<ProductsTab>(INITIAL_PRODUCTS_TAB)
  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState<ProductCategory[]>([])

  const searched = useMemo(
    () => filterByCategories(searchProducts(rows, query), categories),
    [rows, query, categories],
  )
  const counts = useMemo(() => countProductsByTab(searched), [searched])
  const tabRows = useMemo(() => productsInTab(searched, tab), [searched, tab])
  const { emptyMessage } = tabDefinition(tab)

  if (!loading && rows.length === 0) return <EmptyMessage text="Nenhum produto ainda" />

  const narrowed = query.trim() !== '' || categories.length > 0
  const narrowedEmpty = !loading && narrowed && searched.length === 0

  const clearFilters = () => {
    setQuery('')
    setCategories([])
  }

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, next: ProductsTab) => setTab(next)}
        variant="scrollable"
        allowScrollButtonsMobile
        aria-label="Situação dos produtos"
        sx={{ px: 1, borderBottom: 1, borderColor: 'divider' }}
      >
        {PRODUCTS_TABS.map((definition) => (
          <Tab
            key={definition.value}
            value={definition.value}
            label={
              <Box component="span" sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}>
                {definition.label}
                <Chip
                  size="small"
                  label={counts[definition.value]}
                  color={definition.value === tab ? 'primary' : 'default'}
                />
              </Box>
            }
          />
        ))}
      </Tabs>
      <SectionToolbar>
        <SearchField
          value={query}
          onChange={setQuery}
          placeholder="Buscar por nome ou código de referência…"
        />
        <FilterButton
          title="Categorias"
          options={PRODUCT_CATEGORY_OPTIONS}
          selected={categories}
          onApply={setCategories}
        />
      </SectionToolbar>
      <FilterChips
        options={PRODUCT_CATEGORY_OPTIONS}
        selected={categories}
        onRemove={(category) => setCategories((current) => current.filter((c) => c !== category))}
      />
      {narrowedEmpty ? (
        <EmptyMessage text="Nenhum produto encontrado para a busca e os filtros">
          <Button size="small" onClick={clearFilters} sx={{ mt: 1.5 }}>
            Limpar filtros
          </Button>
        </EmptyMessage>
      ) : (
        <DataGridPremium
          rows={tabRows}
          columns={columns}
          loading={loading}
          getRowId={(row: Product) => row.id}
          onRowClick={({ row }: { row: Product }) => onOpen(row)}
          columnVisibilityModel={{ sku: !narrow, status: !narrow }}
          pagination
          pageSizeOptions={PAGE_SIZE_OPTIONS}
          initialState={{
            sorting: { sortModel: [{ field: 'name', sort: 'asc' }] },
            pagination: { paginationModel: { pageSize: 25, page: 0 } },
          }}
          disableVirtualization={disableVirtualization}
          autoHeight
          slots={{
            noRowsOverlay: () => (
              <Typography
                sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '100%',
                  color: 'text.disabled',
                  fontSize: 13,
                }}
              >
                {emptyMessage}
              </Typography>
            ),
          }}
          sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
        />
      )}
    </Box>
  )
}

function EmptyMessage({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <Box sx={{ p: 6, textAlign: 'center' }}>
      <Typography sx={{ color: 'text.disabled', fontSize: 13 }}>{text}</Typography>
      {children}
    </Box>
  )
}
