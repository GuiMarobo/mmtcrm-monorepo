import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import { DetailField, DetailSection } from '../common/DetailSection'
import { OrderStatusBadge } from '../common/OrderStatusBadge'
import { CLIENT_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../../types'
import { formatCurrency, formatDate } from '../../utils/format'
import type { Order } from '../../types'

interface OrderDetailDrawerProps {
  order: Order
  approving: boolean
  onApprove: () => void
  onGoToNegotiations: () => void
  onClose: () => void
}

export function OrderDetailDrawer({
  order,
  approving,
  onApprove,
  onGoToNegotiations,
  onClose,
}: OrderDetailDrawerProps) {
  const awaitingPayment = order.status === 'EM_NEGOCIACAO'

  return (
    <Drawer
      anchor="right"
      open
      onClose={onClose}
      slotProps={{ paper: { sx: { width: 440, maxWidth: '100%' } } }}
    >
      <Box
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          px: 3,
          py: 2,
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ flex: 1, minWidth: 0 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700 }}>
            Pedido {order.code}
          </Typography>
          <Box sx={{ mt: 0.5 }}>
            <OrderStatusBadge status={order.status} />
          </Box>
        </Box>
        <IconButton onClick={onClose} aria-label="Fechar" size="small">
          <CloseOutlinedIcon />
        </IconButton>
      </Box>

      <Box sx={{ flex: 1, overflow: 'auto' }}>
        <DetailSection title="Pedido">
          <DetailField label="Valor">{formatCurrency(order.totalValue)}</DetailField>
          <DetailField label="Forma de pagamento">
            {order.paymentMethod ? PAYMENT_METHOD_LABELS[order.paymentMethod] : '-'}
          </DetailField>
          <DetailField label="Situação desde">{formatDate(order.statusChangedAt)}</DetailField>
        </DetailSection>
        <Divider />

        <DetailSection title="Cliente">
          <DetailField label="Nome">{order.client?.name ?? '-'}</DetailField>
          <DetailField label="Situação">
            {order.client ? CLIENT_STATUS_LABELS[order.client.status] : '-'}
          </DetailField>
        </DetailSection>
        <Divider />

        <DetailSection title="Negociação de origem">
          <DetailField label="Número">#{order.negotiationId}</DetailField>
          <DetailField label="Vendedor">{order.vendedor?.name ?? '-'}</DetailField>
          {order.notes && <DetailField label="Observações">{order.notes}</DetailField>}
        </DetailSection>

        {awaitingPayment && (
          <Box sx={{ px: 3, pb: 3 }}>
            <Alert severity="info" sx={{ fontSize: 13 }}>
              Cliente desistiu ou vai pagar de outra forma? Reabra a negociação no
              quadro.
              <Box sx={{ mt: 1 }}>
                <Button
                  size="small"
                  endIcon={<ArrowForwardOutlinedIcon />}
                  onClick={onGoToNegotiations}
                >
                  Ir para o quadro de Negociações
                </Button>
              </Box>
            </Alert>
          </Box>
        )}
      </Box>

      {awaitingPayment && (
        <Box
          sx={{
            px: 3,
            py: 2,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <Button
            variant="contained"
            fullWidth
            disabled={approving}
            onClick={onApprove}
          >
            {approving ? 'Aprovando…' : 'Aprovar Compra'}
          </Button>
        </Box>
      )}
    </Drawer>
  )
}
