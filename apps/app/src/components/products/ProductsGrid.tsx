import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import ContentCopyOutlinedIcon from '@mui/icons-material/ContentCopyOutlined'
import DeleteOutlinedIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import PriceChangeOutlinedIcon from '@mui/icons-material/PriceChangeOutlined'
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined'
import SwapVertOutlinedIcon from '@mui/icons-material/SwapVertOutlined'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Chip from '@mui/material/Chip'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { DataGridPremium } from '@mui/x-data-grid-premium'
import type { GridColDef, GridRowSelectionModel } from '@mui/x-data-grid-premium'
import { useMemo, useRef, useState, type MutableRefObject, type ReactNode } from 'react'
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
import type { BatchAction } from './productsBatch'
import { BulkActionsBar } from '../common/BulkActionsBar'
import { ConfirmDialog } from '../common/ConfirmDialog'
import { FilterButton, FilterChips } from '../common/FilterPanel'
import { RowActionsMenu } from '../common/RowActionsMenu'
import type { RowAction } from '../common/RowActionsMenu'
import type { BulkAction } from '../common/BulkActionsBar'
import { SearchField } from '../common/SearchField'
import { SectionToolbar } from '../common/SectionCard'
import { ToneChip } from '../common/ToneChip'
import { formatCurrency, formatDate, plural } from '../../utils/format'
import type { Product, ProductCategory } from '../../types'
import {
  PRODUCT_CATEGORY_LABELS,
  PRODUCT_CATEGORY_OPTIONS,
  PRODUCT_STATUS_LABELS,
} from '../../types'

export interface ProductRowActions {
  onEdit: (product: Product) => void
  onUpdatePrice: (product: Product) => void
  onMoveStock: (product: Product) => void
  onDuplicate: (product: Product) => void
  onDiscontinue: (product: Product) => void
  onReactivate: (product: Product) => void
  onDelete: (product: Product) => void
}

interface ProductsGridProps {
  rows: Product[]
  loading: boolean
  onOpen: (product: Product) => void
  actions?: ProductRowActions
  onBatch?: (action: BatchAction, products: Product[]) => Promise<void>
  disableVirtualization?: boolean
}

const PAGE_SIZE_OPTIONS = [10, 25, 50]

const EMPTY_SELECTION: GridRowSelectionModel = { type: 'include', ids: new Set() }

function selectedIn(rows: Product[], model: GridRowSelectionModel): Product[] {
  return model.type === 'include'
    ? rows.filter((row) => model.ids.has(row.id))
    : rows.filter((row) => !model.ids.has(row.id))
}

function ProductCell({ product }: { product: Product }) {
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      <CategoryAvatar category={product.category} />
      <Box sx={{ display: 'grid', gap: 0.25, minWidth: 0 }}>
        <Box component="span" data-testid="product-name" sx={{ fontWeight: 600 }}>
          {product.name}
        </Box>
        <Box component="span" sx={{ color: 'text.disabled', typography: 'caption' }}>
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
      <Box component="span" sx={{ color: 'text.disabled', typography: 'caption' }}>
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

function rowActionsFor(product: Product, handlers: ProductRowActions): RowAction[] {
  const situation: RowAction =
    product.status === 'ATIVO'
      ? {
          key: 'discontinue',
          label: 'Descontinuar',
          icon: <BlockOutlinedIcon />,
          onClick: () => handlers.onDiscontinue(product),
        }
      : {
          key: 'reactivate',
          label: 'Reativar',
          icon: <ReplayOutlinedIcon />,
          onClick: () => handlers.onReactivate(product),
        }
  return [
    {
      key: 'edit',
      label: 'Editar',
      icon: <EditOutlinedIcon />,
      onClick: () => handlers.onEdit(product),
    },
    {
      key: 'price',
      label: 'Alterar preço',
      icon: <PriceChangeOutlinedIcon />,
      onClick: () => handlers.onUpdatePrice(product),
    },
    {
      key: 'stock',
      label: 'Movimentar estoque',
      icon: <SwapVertOutlinedIcon />,
      onClick: () => handlers.onMoveStock(product),
    },
    {
      key: 'duplicate',
      label: 'Duplicar',
      icon: <ContentCopyOutlinedIcon />,
      onClick: () => handlers.onDuplicate(product),
    },
    situation,
    {
      key: 'delete',
      label: 'Excluir',
      icon: <DeleteOutlinedIcon />,
      onClick: () => handlers.onDelete(product),
    },
  ]
}

type ConfirmedBatchAction = Exclude<BatchAction, 'reactivate'>

const BATCH_CONFIRM: Record<
  ConfirmedBatchAction,
  { verb: string; description: string; danger: boolean }
> = {
  discontinue: {
    verb: 'Descontinuar',
    description:
      'Os produtos passam a Inativo e deixam de ser oferecidos em novas negociações. Podem ser reativados depois.',
    danger: false,
  },
  delete: {
    verb: 'Excluir',
    description: 'Os produtos saem do catálogo. O histórico de estoque é preservado.',
    danger: true,
  },
}

const productsCount = (count: number) => `${count} ${plural(count, 'produto', 'produtos')}`

function bulkActionsFor(selected: Product[], start: (action: BatchAction) => void): BulkAction[] {
  const bulk: BulkAction[] = []
  if (selected.some((product) => product.status === 'ATIVO')) {
    bulk.push({
      key: 'discontinue',
      label: 'Descontinuar',
      icon: <BlockOutlinedIcon />,
      onClick: () => start('discontinue'),
    })
  }
  if (selected.some((product) => product.status === 'INATIVO')) {
    bulk.push({
      key: 'reactivate',
      label: 'Reativar',
      icon: <ReplayOutlinedIcon />,
      onClick: () => start('reactivate'),
    })
  }
  bulk.push({
    key: 'delete',
    label: 'Excluir',
    icon: <DeleteOutlinedIcon />,
    danger: true,
    onClick: () => start('delete'),
  })
  return bulk
}

function actionsColumn(
  handlers: MutableRefObject<ProductRowActions | undefined>,
): GridColDef<Product> {
  return {
    field: 'actions',
    headerName: '',
    width: 56,
    sortable: false,
    filterable: false,
    disableColumnMenu: true,
    disableReorder: true,
    align: 'right',
    renderCell: ({ row }) =>
      handlers.current && (
        <Box onClick={(event) => event.stopPropagation()}>
          <RowActionsMenu
            label={`Ações de ${row.name}`}
            actions={rowActionsFor(row, handlers.current)}
          />
        </Box>
      ),
  }
}

const baseColumns: GridColDef<Product>[] = [
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
  actions,
  onBatch,
  disableVirtualization = false,
}: ProductsGridProps) {
  const theme = useTheme()
  const narrow = useMediaQuery(theme.breakpoints.down('sm'))
  const [tab, setTab] = useState<ProductsTab>(INITIAL_PRODUCTS_TAB)
  const [query, setQuery] = useState('')
  const [categories, setCategories] = useState<ProductCategory[]>([])
  const [selection, setSelection] = useState<GridRowSelectionModel>(EMPTY_SELECTION)
  const [confirming, setConfirming] = useState<ConfirmedBatchAction | null>(null)
  const [running, setRunning] = useState(false)

  const searched = useMemo(
    () => filterByCategories(searchProducts(rows, query), categories),
    [rows, query, categories],
  )
  const actionsRef = useRef(actions)
  actionsRef.current = actions
  const withActions = actions !== undefined
  const columns = useMemo(
    () => (withActions ? [...baseColumns, actionsColumn(actionsRef)] : baseColumns),
    [withActions],
  )
  const counts = useMemo(() => countProductsByTab(searched), [searched])
  const tabRows = useMemo(() => productsInTab(searched, tab), [searched, tab])
  const { emptyMessage } = tabDefinition(tab)
  const selected = useMemo(() => selectedIn(tabRows, selection), [tabRows, selection])

  if (!loading && rows.length === 0) return <EmptyMessage text="Nenhum produto ainda" />

  const narrowed = query.trim() !== '' || categories.length > 0
  const narrowedEmpty = !loading && narrowed && searched.length === 0

  const clearSelection = () => setSelection(EMPTY_SELECTION)

  const runBatch = async (action: BatchAction) => {
    if (!onBatch) return
    setRunning(true)
    try {
      await onBatch(action, selected)
    } finally {
      setRunning(false)
      setConfirming(null)
      clearSelection()
    }
  }

  const startBatch = (action: BatchAction) => {
    if (action === 'reactivate') void runBatch(action)
    else setConfirming(action)
  }
  const changeTab = (next: ProductsTab) => {
    setTab(next)
    clearSelection()
  }
  const changeQuery = (next: string) => {
    setQuery(next)
    clearSelection()
  }
  const changeCategories = (next: ProductCategory[]) => {
    setCategories(next)
    clearSelection()
  }

  const clearFilters = () => {
    changeQuery('')
    changeCategories([])
  }

  return (
    <Box>
      <Tabs
        value={tab}
        onChange={(_, next: ProductsTab) => changeTab(next)}
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
          onChange={changeQuery}
          placeholder="Buscar por nome ou código de referência…"
        />
        <FilterButton
          title="Categorias"
          options={PRODUCT_CATEGORY_OPTIONS}
          selected={categories}
          onApply={changeCategories}
        />
      </SectionToolbar>
      <FilterChips
        options={PRODUCT_CATEGORY_OPTIONS}
        selected={categories}
        onRemove={(category) => changeCategories(categories.filter((c) => c !== category))}
      />
      <Box sx={{ position: 'relative' }}>
        <DataGridPremium
          rows={tabRows}
          columns={columns}
          loading={loading}
          getRowId={(row: Product) => row.id}
          onRowClick={({ row }: { row: Product }) => onOpen(row)}
          checkboxSelection={onBatch !== undefined}
          disableRowSelectionOnClick
          rowSelectionModel={selection}
          onRowSelectionModelChange={setSelection}
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
            noRowsOverlay: () =>
              narrowedEmpty ? (
                <EmptyMessage text="Nenhum produto encontrado para a busca e os filtros">
                  <Button size="small" onClick={clearFilters} sx={{ mt: 1.5 }}>
                    Limpar filtros
                  </Button>
                </EmptyMessage>
              ) : (
                <EmptyMessage text={emptyMessage} />
              ),
          }}
          sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
        />
        {onBatch && !running && selected.length > 0 && (
          <BulkActionsBar
            count={selected.length}
            actions={bulkActionsFor(selected, startBatch)}
            onClear={clearSelection}
          />
        )}
      </Box>
      {confirming && (
        <ConfirmDialog
          title={`${BATCH_CONFIRM[confirming].verb} ${productsCount(selected.length)}?`}
          description={BATCH_CONFIRM[confirming].description}
          confirmLabel={BATCH_CONFIRM[confirming].verb}
          danger={BATCH_CONFIRM[confirming].danger}
          loading={running}
          onConfirm={() => void runBatch(confirming)}
          onCancel={() => setConfirming(null)}
        />
      )}
    </Box>
  )
}

function EmptyMessage({ text, children }: { text: string; children?: ReactNode }) {
  return (
    <Box sx={{ p: 6, textAlign: 'center', height: '100%' }}>
      <Typography variant="body2" sx={{ color: 'text.disabled' }}>
        {text}
      </Typography>
      {children}
    </Box>
  )
}
