import VisibilityOutlinedIcon from '@mui/icons-material/VisibilityOutlined'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { DataGridPremium, GridActionsCellItem } from '@mui/x-data-grid-premium'
import type { GridColDef } from '@mui/x-data-grid-premium'
import { OrderStatusBadge } from '../common/OrderStatusBadge'
import { formatCurrency, formatDate } from '../../utils/format'
import type { Order } from '../../types'
import { ORDER_STATUS_OPTIONS, PAYMENT_METHOD_LABELS } from '../../types'

interface OrdersDataGridProps {
  rows: Order[]
  loading: boolean
  onOpen: (order: Order) => void
}

export function OrdersDataGrid({ rows, loading, onOpen }: OrdersDataGridProps) {
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('md'))
  const narrow = useMediaQuery(theme.breakpoints.down('sm'))

  const columns: GridColDef<Order>[] = [
    {
      field: 'code',
      headerName: 'Código',
      flex: 0.8,
      minWidth: 110,
    },
    {
      field: 'cliente',
      headerName: 'Cliente',
      flex: 1.6,
      minWidth: 190,
      valueGetter: (_, row) => row.client?.name ?? '-',
    },
    {
      field: 'vendedor',
      headerName: 'Vendedor',
      flex: 1,
      minWidth: 140,
      valueGetter: (_, row) => row.vendedor?.name ?? '-',
    },
    {
      field: 'status',
      headerName: 'Situação',
      flex: 1,
      minWidth: 150,
      type: 'singleSelect',
      valueOptions: ORDER_STATUS_OPTIONS,
      renderCell: ({ row }) => <OrderStatusBadge status={row.status} />,
    },
    {
      field: 'paymentMethod',
      headerName: 'Forma de Pagamento',
      flex: 1.1,
      minWidth: 160,
      valueGetter: (_, row) =>
        row.paymentMethod ? PAYMENT_METHOD_LABELS[row.paymentMethod] : '-',
    },
    {
      field: 'totalValue',
      headerName: 'Valor',
      type: 'number',
      flex: 0.9,
      minWidth: 120,
      renderCell: ({ row }) => <b>{formatCurrency(row.totalValue)}</b>,
    },
    {
      field: 'statusChangedAt',
      headerName: 'Situação desde',
      flex: 1,
      minWidth: 130,
      valueFormatter: (value: string) => formatDate(value),
    },
    {
      field: 'acoes',
      type: 'actions',
      headerName: '',
      width: 56,
      getActions: ({ row }) => [
        <GridActionsCellItem
          key="open"
          icon={<VisibilityOutlinedIcon />}
          label="Ver detalhe"
          onClick={() => onOpen(row)}
          showInMenu
        />,
      ],
    },
  ]

  return (
    <Box>
      <DataGridPremium
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={(row: Order) => row.id}
        onRowClick={({ row }) => onOpen(row)}
        columnVisibilityModel={{
          vendedor: !narrow,
          paymentMethod: !compact,
          statusChangedAt: !compact,
        }}
        initialState={{
          pagination: { paginationModel: { pageSize: 10, page: 0 } },
        }}
        sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
      />
    </Box>
  )
}
