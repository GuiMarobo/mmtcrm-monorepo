import BlockOutlinedIcon from '@mui/icons-material/BlockOutlined'
import DeleteOutlineIcon from '@mui/icons-material/DeleteOutlined'
import EditOutlinedIcon from '@mui/icons-material/EditOutlined'
import ReplayOutlinedIcon from '@mui/icons-material/ReplayOutlined'
import ShoppingBagOutlinedIcon from '@mui/icons-material/ShoppingBagOutlined'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import { NegotiationStatusBadge } from './NegotiationBadges'
import { DataTable } from '../common/DataTable'
import type { DataTableColumn } from '../common/DataTable'
import { DetailNotes, ItemsSummaryTable } from '../common/ItemsSummaryTable'
import { OrderStatusBadge } from '../common/OrderStatusBadge'
import { RowActionsMenu } from '../common/RowActionsMenu'
import type { RowAction } from '../common/RowActionsMenu'
import { RowDetail, useRowDetails } from '../common/RowDetail'
import { formatCurrency, formatDate } from '../../utils/format'
import type { Negotiation, NegotiationDetail, NegotiationStatus } from '../../types'
import { NEGOTIATION_STATUS_LABELS } from '../../types'

interface NegotiationsTableProps {
  rows: Negotiation[]
  loading: boolean
  loadDetail: (id: number) => Promise<NegotiationDetail>
  onEdit: (negotiation: Negotiation) => void
  onRequestTransition: (negotiation: Negotiation, target: NegotiationStatus) => void
  onDelete: (negotiation: Negotiation) => void
}

export function NegotiationsTable({
  rows,
  loading,
  loadDetail,
  onEdit,
  onRequestTransition,
  onDelete,
}: NegotiationsTableProps) {
  const theme = useTheme()
  const compact = useMediaQuery(theme.breakpoints.down('md'))
  const narrow = useMediaQuery(theme.breakpoints.down('sm'))
  const details = useRowDetails(loadDetail, rows, 'Falha ao carregar os itens da negociação.')

  const columns: DataTableColumn<Negotiation>[] = [
    {
      key: 'cliente',
      label: 'Cliente',
      sortValue: (negotiation) => negotiation.client?.name ?? '',
      render: (negotiation) => (
        <Box component="span" sx={{ fontWeight: 600 }}>
          {negotiation.client?.name ?? '-'}
        </Box>
      ),
    },
    {
      key: 'vendedor',
      label: 'Vendedor',
      hidden: narrow,
      sortValue: (negotiation) => negotiation.vendedor?.name ?? '',
      render: (negotiation) => negotiation.vendedor?.name ?? '-',
    },
    {
      key: 'totalValue',
      label: 'Valor',
      align: 'right',
      sortValue: (negotiation) => negotiation.totalValue,
      render: (negotiation) => (
        <Box component="span" sx={{ fontWeight: 700 }}>
          {formatCurrency(negotiation.totalValue)}
        </Box>
      ),
    },
    {
      key: 'status',
      label: 'Situação',
      sortValue: (negotiation) => NEGOTIATION_STATUS_LABELS[negotiation.status],
      render: (negotiation) => <NegotiationStatusBadge status={negotiation.status} />,
    },
    {
      key: 'pedido',
      label: 'Pedido',
      hidden: compact,
      sortValue: (negotiation) => negotiation.order?.code ?? '',
      render: (negotiation) =>
        negotiation.order ? (
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            <Box component="span" sx={{ fontWeight: 600 }}>
              {negotiation.order.code}
            </Box>
            <OrderStatusBadge status={negotiation.order.status} />
          </Box>
        ) : (
          '-'
        ),
    },
    {
      key: 'updatedAt',
      label: 'Atualizada',
      hidden: compact,
      sortValue: (negotiation) => negotiation.updatedAt,
      render: (negotiation) => formatDate(negotiation.updatedAt),
    },
  ]

  const actionsFor = (negotiation: Negotiation): RowAction[] => [
    ...(negotiation.status === 'ABERTA'
      ? [
          {
            key: 'edit',
            label: 'Editar',
            icon: <EditOutlinedIcon />,
            onClick: () => onEdit(negotiation),
          },
          {
            key: 'convert',
            label: 'Converter em pedido',
            icon: <ShoppingBagOutlinedIcon />,
            onClick: () => onRequestTransition(negotiation, 'GANHA'),
          },
          {
            key: 'lose',
            label: 'Marcar como perdida',
            icon: <BlockOutlinedIcon />,
            onClick: () => onRequestTransition(negotiation, 'PERDIDA'),
          },
        ]
      : [
          {
            key: 'reopen',
            label: 'Reabrir negociação',
            icon: <ReplayOutlinedIcon />,
            onClick: () => onRequestTransition(negotiation, 'ABERTA'),
          },
        ]),
    {
      key: 'delete',
      label: 'Excluir',
      icon: <DeleteOutlineIcon />,
      onClick: () => onDelete(negotiation),
    },
  ]

  return (
    <DataTable
      label="Negociações"
      rows={rows}
      columns={columns}
      getRowId={(negotiation) => negotiation.id}
      loading={loading}
      size={narrow ? 'small' : 'medium'}
      initialSort={{ key: 'updatedAt', direction: 'desc' }}
      emptyMessage="Nenhuma negociação encontrada"
      expandLabel={(negotiation) => `Ver itens da negociação de ${negotiation.client?.name ?? 'cliente'}`}
      renderExpanded={(negotiation) => (
        <RowDetail
          state={details.get(negotiation.id)}
          onRequest={() => details.request(negotiation.id)}
        >
          {(detail) => (
            <Box sx={{ display: 'grid', gap: 1.5 }}>
              <ItemsSummaryTable
                items={detail.items}
                totalValue={detail.totalValue}
                tradeInTotal={detail.tradeInTotal}
                amountDue={detail.amountDue}
              />
              <DetailNotes notes={detail.notes} />
            </Box>
          )}
        </RowDetail>
      )}
      renderActions={(negotiation) => (
        <RowActionsMenu label="Ações da negociação" actions={actionsFor(negotiation)} />
      )}
    />
  )
}
