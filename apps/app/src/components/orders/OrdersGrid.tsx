import Box from '@mui/material/Box'
import Chip from '@mui/material/Chip'
import Tab from '@mui/material/Tab'
import Tabs from '@mui/material/Tabs'
import Typography from '@mui/material/Typography'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { DataGridPremium } from '@mui/x-data-grid-premium'
import type { GridColDef, GridSortModel } from '@mui/x-data-grid-premium'
import { useMemo, useState } from 'react'
import { OrderStatusBadge } from '../common/OrderStatusBadge'
import { ErrorBanner } from '../common/SectionCard'
import { formatCurrency, formatDate } from '../../utils/format'
import type { Order } from '../../types'
import { PAYMENT_METHOD_LABELS } from '../../types'
import {
  INITIAL_ORDERS_TAB,
  ORDERS_TABS,
  countOrdersByTab,
  ordersInTab,
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

const columns: GridColDef<Order>[] = [
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
    field: 'totalValue',
    headerName: 'Valor',
    type: 'number',
    flex: 0.9,
    minWidth: 120,
    renderCell: ({ row }) => (
      <Box component="span" sx={{ fontWeight: 700 }}>
        {formatCurrency(row.totalValue)}
      </Box>
    ),
  },
  {
    field: 'paymentMethod',
    headerName: 'Forma de pagamento',
    flex: 1.1,
    minWidth: 160,
    valueGetter: (_, row) =>
      row.paymentMethod ? PAYMENT_METHOD_LABELS[row.paymentMethod] : '-',
  },
  {
    field: 'statusChangedAt',
    headerName: 'Situação desde',
    flex: 1,
    minWidth: 130,
    valueFormatter: (value: string) => formatDate(value),
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
  const compact = useMediaQuery(theme.breakpoints.down('md'))
  const narrow = useMediaQuery(theme.breakpoints.down('sm'))
  const [tab, setTab] = useState<OrdersTab>(INITIAL_ORDERS_TAB)
  const [sortModel, setSortModel] = useState<GridSortModel>(initialSortModel(INITIAL_ORDERS_TAB))

  const counts = useMemo(() => countOrdersByTab(rows), [rows])
  const tabRows = useMemo(() => ordersInTab(rows, tab), [rows, tab])
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
              vendedor: !narrow,
              paymentMethod: !compact,
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
