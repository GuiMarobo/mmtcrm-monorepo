import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { DataGridPremium } from '@mui/x-data-grid-premium'
import type { GridColDef } from '@mui/x-data-grid-premium'
import { ProductStatusBadge } from './ProductStatusBadge'
import { formatCurrency } from '../../utils/format'
import type { Product } from '../../types'
import { PRODUCT_CATEGORY_OPTIONS, PRODUCT_STATUS_OPTIONS } from '../../types'

interface ProductsDataGridProps {
  rows: Product[]
  loading: boolean
}

export function ProductsDataGrid({ rows, loading }: ProductsDataGridProps) {
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('md'))
  const narrow = useMediaQuery(theme.breakpoints.down('sm'))

  const columns: GridColDef<Product>[] = [
    {
      field: 'name',
      headerName: 'Nome',
      flex: 1.8,
      minWidth: 200,
    },
    {
      field: 'sku',
      headerName: 'Código de Referência',
      flex: 1,
      minWidth: 150,
    },
    {
      field: 'category',
      headerName: 'Categoria',
      flex: 1,
      minWidth: 130,
      type: 'singleSelect',
      valueOptions: PRODUCT_CATEGORY_OPTIONS,
    },
    {
      field: 'price',
      headerName: 'Preço',
      type: 'number',
      flex: 0.9,
      minWidth: 120,
      renderCell: ({ row }) => <b>{formatCurrency(row.price)}</b>,
    },
    {
      field: 'stock',
      headerName: 'Saldo',
      type: 'number',
      flex: 0.6,
      minWidth: 90,
    },
    {
      field: 'status',
      headerName: 'Situação',
      flex: 0.9,
      minWidth: 120,
      type: 'singleSelect',
      valueOptions: PRODUCT_STATUS_OPTIONS,
      renderCell: ({ row }) => <ProductStatusBadge status={row.status} />,
    },
  ]

  return (
    <Box>
      <DataGridPremium
        rows={rows}
        columns={columns}
        loading={loading}
        density={narrow ? 'compact' : 'standard'}
        getRowId={(row: Product) => row.id}
        columnVisibilityModel={{
          sku: !narrow,
          category: !compact,
        }}
        initialState={{
          pagination: { paginationModel: { pageSize: 10, page: 0 } },
        }}
      />
    </Box>
  )
}
