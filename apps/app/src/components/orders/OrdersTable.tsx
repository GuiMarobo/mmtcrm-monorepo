import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { DataTable } from '../common/DataTable'
import type { DataTableColumn } from '../common/DataTable'
import { OrderStatusBadge } from '../common/OrderStatusBadge'
import { formatCurrency, formatDate } from '../../utils/format'
import type { Order } from '../../types'
import { ORDER_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../../types'

interface OrdersTableProps {
  rows: Order[]
  loading: boolean
  onOpen: (order: Order) => void
}

const paymentLabel = (order: Order) =>
  order.paymentMethod ? PAYMENT_METHOD_LABELS[order.paymentMethod] : '-'

export function OrdersTable({ rows, loading, onOpen }: OrdersTableProps) {
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('md'))
  const narrow = useMediaQuery(theme.breakpoints.down('sm'))

  const columns: DataTableColumn<Order>[] = [
    {
      key: 'code',
      label: 'Código',
      sortValue: (order) => order.code,
      render: (order) => (
        <Box component="span" sx={{ fontWeight: 600 }}>
          {order.code}
        </Box>
      ),
    },
    {
      key: 'cliente',
      label: 'Cliente',
      sortValue: (order) => order.client?.name ?? '',
      render: (order) => order.client?.name ?? '-',
    },
    {
      key: 'vendedor',
      label: 'Vendedor',
      hidden: narrow,
      sortValue: (order) => order.vendedor?.name ?? '',
      render: (order) => order.vendedor?.name ?? '-',
    },
    {
      key: 'status',
      label: 'Situação',
      sortValue: (order) => ORDER_STATUS_LABELS[order.status],
      render: (order) => <OrderStatusBadge status={order.status} />,
    },
    {
      key: 'paymentMethod',
      label: 'Forma de Pagamento',
      hidden: compact,
      sortValue: paymentLabel,
      render: paymentLabel,
    },
    {
      key: 'totalValue',
      label: 'Valor',
      align: 'right',
      sortValue: (order) => order.totalValue,
      render: (order) => (
        <Box component="span" sx={{ fontWeight: 700 }}>
          {formatCurrency(order.totalValue)}
        </Box>
      ),
    },
    {
      key: 'statusChangedAt',
      label: 'Situação desde',
      hidden: compact,
      sortValue: (order) => order.statusChangedAt,
      render: (order) => formatDate(order.statusChangedAt),
    },
  ]

  return (
    <DataTable
      label="Pedidos"
      rows={rows}
      columns={columns}
      getRowId={(order) => order.id}
      loading={loading}
      size={narrow ? 'small' : 'medium'}
      onRowClick={onOpen}
    />
  )
}
