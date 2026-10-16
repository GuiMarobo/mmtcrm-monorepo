import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { ProductStatusBadge } from './ProductStatusBadge'
import { DataTable } from '../common/DataTable'
import type { DataTableColumn } from '../common/DataTable'
import { ToneChip } from '../common/ToneChip'
import { formatCurrency } from '../../utils/format'
import type { Product } from '../../types'
import { PRODUCT_CATEGORY_LABELS, PRODUCT_STATUS_LABELS } from '../../types'

interface ProductsTableProps {
  rows: Product[]
  loading: boolean
  onOpen: (product: Product) => void
}

export function ProductsTable({ rows, loading, onOpen }: ProductsTableProps) {
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('md'))
  const narrow = useMediaQuery(theme.breakpoints.down('sm'))

  const columns: DataTableColumn<Product>[] = [
    {
      key: 'name',
      label: 'Nome',
      sortValue: (product) => product.name,
      render: (product) => (
        <Box component="span" sx={{ fontWeight: 600 }}>
          {product.name}
        </Box>
      ),
    },
    {
      key: 'sku',
      label: 'Código de Referência',
      hidden: narrow,
      sortValue: (product) => product.sku,
      render: (product) => product.sku,
    },
    {
      key: 'category',
      label: 'Categoria',
      hidden: compact,
      sortValue: (product) => PRODUCT_CATEGORY_LABELS[product.category],
      render: (product) => PRODUCT_CATEGORY_LABELS[product.category],
    },
    {
      key: 'price',
      label: 'Preço',
      align: 'right',
      sortValue: (product) => product.price,
      render: (product) => (
        <Box component="span" sx={{ fontWeight: 700 }}>
          {formatCurrency(product.price)}
        </Box>
      ),
    },
    {
      key: 'stock',
      label: 'Saldo',
      align: 'right',
      sortValue: (product) => product.stock,
      render: (product) =>
        product.stock > 0 ? (
          <ToneChip tone="green" dot>{`${product.stock} un.`}</ToneChip>
        ) : (
          <ToneChip tone="red" dot>Sem estoque</ToneChip>
        ),
    },
    {
      key: 'status',
      label: 'Situação',
      sortValue: (product) => PRODUCT_STATUS_LABELS[product.status],
      render: (product) => <ProductStatusBadge status={product.status} />,
    },
  ]

  return (
    <DataTable
      label="Produtos"
      rows={rows}
      columns={columns}
      getRowId={(product) => product.id}
      loading={loading}
      size="small"
      initialSort={{ key: 'name', direction: 'asc' }}
      onRowClick={onOpen}
    />
  )
}
