import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { DataGridPremium, GridActionsCellItem } from '@mui/x-data-grid-premium'
import type { GridColDef } from '@mui/x-data-grid-premium'
import { NegotiationStatusBadge, OrderStatusBadge } from './NegotiationBadges'
import { formatCurrency, formatDate } from '../../utils/format'
import type { Negotiation, NegotiationStatus } from '../../types'
import { NEGOTIATION_STATUS_OPTIONS } from '../../types'

interface NegotiationsDataGridProps {
  rows: Negotiation[]
  loading: boolean
  quickFilter: string
  onEdit: (negotiation: Negotiation) => void
  onRequestTransition: (negotiation: Negotiation, target: NegotiationStatus) => void
  onDelete: (negotiation: Negotiation) => void
}

export function NegotiationsDataGrid({
  rows,
  loading,
  quickFilter,
  onEdit,
  onRequestTransition,
  onDelete,
}: NegotiationsDataGridProps) {
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('md'))
  const narrow = useMediaQuery(theme.breakpoints.down('sm'))

  const columns: GridColDef<Negotiation>[] = [
    {
      field: 'cliente',
      headerName: 'Cliente',
      flex: 1.6,
      minWidth: 200,
      valueGetter: (_, row) => row.client?.name ?? '-',
      renderCell: ({ row }) => (
        <Box sx={{ py: 1 }}>
          <Box sx={{ fontWeight: 600 }}>{row.client?.name ?? '-'}</Box>
          {row.notes && <Box sx={{ color: 'text.disabled', fontSize: 12 }}>{row.notes}</Box>}
        </Box>
      ),
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
      renderCell: ({ row }) => <b>{formatCurrency(row.totalValue)}</b>,
    },
    {
      field: 'status',
      headerName: 'Situação',
      flex: 0.9,
      minWidth: 130,
      type: 'singleSelect',
      valueOptions: NEGOTIATION_STATUS_OPTIONS,
      renderCell: ({ row }) => <NegotiationStatusBadge status={row.status} />,
    },
    {
      field: 'pedido',
      headerName: 'Pedido',
      flex: 1,
      minWidth: 150,
      sortable: false,
      valueGetter: (_, row) => row.order?.code ?? '-',
      renderCell: ({ row }) =>
        row.order ? (
          <Box sx={{ py: 1 }}>
            <Box sx={{ fontWeight: 600 }}>{row.order.code}</Box>
            <Box sx={{ mt: 0.25 }}>
              <OrderStatusBadge status={row.order.status} />
            </Box>
          </Box>
        ) : (
          '-'
        ),
    },
    {
      field: 'updatedAt',
      headerName: 'Atualizada',
      flex: 1,
      minWidth: 130,
      valueFormatter: (value: string) => formatDate(value),
    },
    {
      field: 'acoes',
      type: 'actions',
      headerName: '',
      width: 56,
      getActions: ({ row }) => {
        const actions = []
        if (row.status === 'ABERTA') {
          actions.push(
            <GridActionsCellItem
              key="edit"
              icon={<EditOutlinedIcon />}
              label="Editar"
              onClick={() => onEdit(row)}
              showInMenu
            />,
            <GridActionsCellItem
              key="convert"
              icon={<ShoppingBagOutlinedIcon />}
              label="Converter em pedido"
              onClick={() => onRequestTransition(row, 'GANHA')}
              showInMenu
            />,
            <GridActionsCellItem
              key="lose"
              icon={<BlockOutlinedIcon />}
              label="Marcar como perdida"
              onClick={() => onRequestTransition(row, 'PERDIDA')}
              showInMenu
            />,
          )
        } else {
          actions.push(
            <GridActionsCellItem
              key="reopen"
              icon={<ReplayOutlinedIcon />}
              label="Reabrir negociação"
              onClick={() => onRequestTransition(row, 'ABERTA')}
              showInMenu
            />,
          )
        }
        actions.push(
          <GridActionsCellItem
            key="delete"
            icon={<DeleteOutlineIcon />}
            label="Excluir"
            onClick={() => onDelete(row)}
            showInMenu
          />,
        )
        return actions
      },
    },
  ]

  return (
    <DataGridPremium
      rows={rows}
      columns={columns}
      loading={loading}
      getRowId={(row: Negotiation) => row.id}
      columnVisibilityModel={{
        vendedor: !narrow,
        pedido: !compact,
        updatedAt: !compact,
      }}
      filterModel={{
        items: [],
        quickFilterValues: quickFilter.trim().split(/\s+/).filter(Boolean),
      }}
      initialState={{
        pagination: { paginationModel: { pageSize: 10, page: 0 } },
        sorting: { sortModel: [{ field: 'updatedAt', sort: 'desc' }] },
      }}
    />
  )
}
