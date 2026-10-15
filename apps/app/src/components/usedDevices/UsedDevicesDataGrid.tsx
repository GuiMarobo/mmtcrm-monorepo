import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { DataGridPremium } from '@mui/x-data-grid-premium'
import type { GridColDef } from '@mui/x-data-grid-premium'
import { EvaluationStatusChip } from './EvaluationStatusChip'
import { receivedLabel } from './receivedLabel'
import { formatDate } from '../../utils/format'
import type { QueueUsedDevice } from '../../types'

interface UsedDevicesDataGridProps {
  rows: QueueUsedDevice[]
  loading: boolean
  onOpen: (device: QueueUsedDevice) => void
}

export function UsedDevicesDataGrid({ rows, loading, onOpen }: UsedDevicesDataGridProps) {
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('md'))
  const narrow = useMediaQuery(theme.breakpoints.down('sm'))

  const columns: GridColDef<QueueUsedDevice>[] = [
    { field: 'model', headerName: 'Modelo', flex: 1.4, minWidth: 170 },
    { field: 'serialNumber', headerName: 'Série', flex: 1, minWidth: 130 },
    {
      field: 'imei',
      headerName: 'IMEI',
      flex: 1.1,
      minWidth: 150,
      valueGetter: (_, row) => row.imei ?? '—',
    },
    {
      field: 'cliente',
      headerName: 'Cliente',
      flex: 1.3,
      minWidth: 160,
      valueGetter: (_, row) => row.negotiation.client.name,
    },
    {
      field: 'vendedor',
      headerName: 'Vendedor',
      flex: 1,
      minWidth: 130,
      valueGetter: (_, row) => row.negotiation.vendedor?.name ?? '—',
    },
    {
      field: 'createdAt',
      headerName: 'Cadastro',
      flex: 0.8,
      minWidth: 110,
      valueFormatter: (value: string) => formatDate(value),
    },
    {
      field: 'evaluationStatus',
      headerName: 'Situação',
      flex: 1.1,
      minWidth: 170,
      renderCell: ({ row }) => <EvaluationStatusChip status={row.evaluationStatus} />,
    },
    {
      field: 'recebimento',
      headerName: 'Recebimento',
      flex: 1,
      minWidth: 130,
      valueGetter: (_, row) => receivedLabel(row.negotiation.status),
    },
  ]

  return (
    <Box>
      <DataGridPremium
        rows={rows}
        columns={columns}
        loading={loading}
        getRowId={(row: QueueUsedDevice) => row.id}
        onRowClick={({ row }) => onOpen(row)}
        columnVisibilityModel={{
          imei: !compact,
          vendedor: !narrow,
          createdAt: !narrow,
          recebimento: !compact,
        }}
        initialState={{
          pagination: { paginationModel: { pageSize: 10, page: 0 } },
        }}
        sx={{ '& .MuiDataGrid-row': { cursor: 'pointer' } }}
      />
    </Box>
  )
}
