import ErrorOutlined from '@mui/icons-material/ErrorOutlined'
import WarningAmberOutlined from '@mui/icons-material/WarningAmberOutlined'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Tooltip from '@mui/material/Tooltip'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { DataGridPremium } from '@mui/x-data-grid-premium'
import type { GridColDef, GridSortModel } from '@mui/x-data-grid-premium'
import { useMemo, useState } from 'react'
import { OrderStatusBadge } from '../common/OrderStatusBadge'
import { PersonCell } from '../common/PersonCell'
import { ErrorBanner } from '../common/SectionCard'
import {
  formatCurrency,
  formatDateTime,
  formatRelativeTime,
  initials,
} from '../../utils/format'
import type { Order } from '../../types'
import { PAYMENT_METHOD_LABELS } from '../../types'
import {
  INITIAL_ORDERS_TAB,
  ORDERS_TABS,
  PAYMENT_ALERT_DAYS,
  countOrdersByTab,
  ordersInTab,
  paymentAlert,
  tabDefinition,
} from './ordersList'
import type { OrdersTab } from './ordersList'

interface OrdersGridProps {
  rows: Order[]
  loading: boolean
  error: string | null
  onRetry: () => void
  onOpen: (order: Order) => void
  disableVirtualization?: boolean
}

const initialSortModel = (tab: OrdersTab): GridSortModel => [
  { field: 'statusChangedAt', sort: tabDefinition(tab).initialDirection },
]

const ALERT_ICONS = {
  warning: {
    Icon: WarningAmberOutlined,
    color: 'warning',
    label: `Alerta de cobrança: ${PAYMENT_ALERT_DAYS.warning} dias ou mais`,
  },
  error: {
    Icon: ErrorOutlined,
    color: 'error',
    label: `Alerta de cobrança: ${PAYMENT_ALERT_DAYS.error} dias ou mais`,
  },
} as const

function ClientCell({ order }: { order: Order }) {
  if (!order.client) return <Box component="span">-</Box>
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5, minWidth: 0 }}>
      <Avatar
        sx={{
          width: 32,
          height: 32,
          fontSize: 12.5,
          fontWeight: 700,
          bgcolor: 'primary.light',
          color: 'primary.main',
        }}
      >
        {initials(order.client.name)}
      </Avatar>
      <PersonCell
        name={order.client.name}
        secondary={`Vendedor: ${order.vendedor?.name ?? '-'}`}
        anonymized={order.client.anonymizedAt !== null}
      />
    </Box>
  )
}

function ValueCell({ order }: { order: Order }) {
  return (
    <Box sx={{ display: 'grid', gap: 0.25, textAlign: 'right' }}>
      <Box component="span" sx={{ fontWeight: 700 }}>
        {formatCurrency(order.totalValue)}
      </Box>
      <Box component="span" sx={{ color: 'text.disabled', fontSize: 12 }}>
        {order.paymentMethod ? PAYMENT_METHOD_LABELS[order.paymentMethod] : '-'}
      </Box>
    </Box>
  )
}

function StatusSinceCell({ order, showAlert }: { order: Order; showAlert: boolean }) {
  const now = new Date()
  const alert = showAlert ? paymentAlert(order, now) : 'none'
  const alertIcon = alert === 'none' ? null : ALERT_ICONS[alert]
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75 }}>
      {alertIcon && <alertIcon.Icon color={alertIcon.color} titleAccess={alertIcon.label} />}
      <Tooltip title={formatDateTime(order.statusChangedAt)}>
        <Box
          component="span"
          sx={{
            color: alertIcon ? `${alertIcon.color}.main` : 'text.primary',
            fontWeight: alertIcon ? 600 : 400,
          }}
        >
          {formatRelativeTime(order.statusChangedAt, now)}
        </Box>
      </Tooltip>
    </Box>
  )
}

const buildColumns = (tab: OrdersTab): GridColDef<Order>[] => [
  {
    field: 'code',
    headerName: 'Código',
    flex: 0.8,
    minWidth: 110,
    renderCell: ({ row }) => (
      <Box component="span" sx={{ fontWeight: 600 }}>
        {row.code}
      </Box>
    ),
  },
  {
    field: 'cliente',
    headerName: 'Cliente',
    flex: 1.8,
    minWidth: 220,
    valueGetter: (_, row) => row.client?.name ?? '-',
    renderCell: ({ row }) => <ClientCell order={row} />,
  },
  {
    field: 'totalValue',
    headerName: 'Valor',
    type: 'number',
    flex: 1,
    minWidth: 130,
    renderCell: ({ row }) => <ValueCell order={row} />,
  },
  {
    field: 'statusChangedAt',
    headerName: 'Situação desde',
    flex: 1,
    minWidth: 140,
    renderCell: ({ row }) => <StatusSinceCell order={row} showAlert={tab === 'aguardando'} />,
  },
  {
    field: 'status',
    headerName: 'Situação',
    flex: 1,
    minWidth: 150,
    renderCell: ({ row }) => <OrderStatusBadge status={row.status} />,
  },
]

export function OrdersGrid({
  rows,
  loading,
  error,
  onRetry,
  onOpen,
  disableVirtualization = false,
}: OrdersGridProps) {
  const theme = useTheme()
  const narrow = useMediaQuery(theme.breakpoints.down('sm'))
  const [tab, setTab] = useState<OrdersTab>(INITIAL_ORDERS_TAB)
  const [sortModel, setSortModel] = useState<GridSortModel>(initialSortModel(INITIAL_ORDERS_TAB))

  const counts = useMemo(() => countOrdersByTab(rows), [rows])
  const tabRows = useMemo(() => ordersInTab(rows, tab), [rows, tab])
  const columns = useMemo(() => buildColumns(tab), [tab])
  const { emptyMessage } = tabDefinition(tab)

  const changeTab = (next: OrdersTab) => {
    setTab(next)
    setSortModel(initialSortModel(next))
  }

  return (
    <Box>
      {error ? (
        <ErrorBanner message={error} onRetry={onRetry} />
      ) : (
        <>
          <Tabs
            value={tab}
            onChange={(_, next: OrdersTab) => changeTab(next)}
            variant="scrollable"
            allowScrollButtonsMobile
            aria-label="Situação dos pedidos"
            sx={{ px: 1, borderBottom: 1, borderColor: 'divider' }}
          >
            {ORDERS_TABS.map((definition) => (
              <Tab
                key={definition.value}
                value={definition.value}
                label={
                  <Box
                    component="span"
                    sx={{ display: 'inline-flex', alignItems: 'center', gap: 1 }}
                  >
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
          <DataGridPremium
            rows={tabRows}
            columns={columns}
            loading={loading}
            getRowId={(row: Order) => row.id}
            onRowClick={({ row }: { row: Order }) => onOpen(row)}
            sortModel={sortModel}
            onSortModelChange={setSortModel}
            columnVisibilityModel={{
              statusChangedAt: !narrow || tab === 'aguardando',
              status: tab === 'todos',
            }}
            initialState={{
              pagination: { paginationModel: { pageSize: 10, page: 0 } },
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
        </>
      )}
    </Box>
  )
}
