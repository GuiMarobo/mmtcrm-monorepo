import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { EvaluationStatusChip } from './EvaluationStatusChip'
import { receivedLabel } from './receivedLabel'
import { DataTable } from '../common/DataTable'
import type { DataTableColumn } from '../common/DataTable'
import { formatDate } from '../../utils/format'
import type { QueueUsedDevice } from '../../types'
import { EVALUATION_STATUS_LABELS } from '../../types'

interface UsedDevicesTableProps {
  rows: QueueUsedDevice[]
  loading: boolean
  onOpen: (device: QueueUsedDevice) => void
}

export function UsedDevicesTable({ rows, loading, onOpen }: UsedDevicesTableProps) {
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('md'))
  const narrow = useMediaQuery(theme.breakpoints.down('sm'))

  const columns: DataTableColumn<QueueUsedDevice>[] = [
    {
      key: 'model',
      label: 'Modelo',
      sortValue: (device) => device.model,
      render: (device) => (
        <Box component="span" sx={{ fontWeight: 600 }}>
          {device.model}
        </Box>
      ),
    },
    {
      key: 'serialNumber',
      label: 'Série',
      sortValue: (device) => device.serialNumber,
      render: (device) => device.serialNumber,
    },
    {
      key: 'imei',
      label: 'IMEI',
      hidden: compact,
      sortValue: (device) => device.imei ?? '',
      render: (device) => device.imei ?? '—',
    },
    {
      key: 'cliente',
      label: 'Cliente',
      sortValue: (device) => device.negotiation.client.name,
      render: (device) => device.negotiation.client.name,
    },
    {
      key: 'vendedor',
      label: 'Vendedor',
      hidden: narrow,
      sortValue: (device) => device.negotiation.vendedor?.name ?? '',
      render: (device) => device.negotiation.vendedor?.name ?? '—',
    },
    {
      key: 'createdAt',
      label: 'Cadastro',
      hidden: narrow,
      sortValue: (device) => device.createdAt,
      render: (device) => formatDate(device.createdAt),
    },
    {
      key: 'evaluationStatus',
      label: 'Situação',
      sortValue: (device) => EVALUATION_STATUS_LABELS[device.evaluationStatus],
      render: (device) => <EvaluationStatusChip status={device.evaluationStatus} />,
    },
    {
      key: 'recebimento',
      label: 'Recebimento',
      hidden: compact,
      sortValue: (device) => receivedLabel(device.negotiation.status),
      render: (device) => receivedLabel(device.negotiation.status),
    },
  ]

  return (
    <DataTable
      label="Dispositivos usados"
      rows={rows}
      columns={columns}
      getRowId={(device) => device.id}
      loading={loading}
      size="small"
      stickyHeader
      onRowClick={onOpen}
    />
  )
}
