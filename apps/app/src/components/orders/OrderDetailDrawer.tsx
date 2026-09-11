import ArrowForwardOutlinedIcon from '@mui/icons-material/ArrowForwardOutlined'
import CloseOutlinedIcon from '@mui/icons-material/CloseOutlined'
import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Divider from '@mui/material/Divider'
import Drawer from '@mui/material/Drawer'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
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

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <Box sx={{ px: 3, py: 2.5 }}>
      <Typography
        sx={{
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'text.disabled',
          mb: 1.5,
        }}
      >
        {title}
      </Typography>
      <Box sx={{ display: 'grid', gap: 1.25 }}>{children}</Box>
    </Box>
  )
}

function Field({ label, children }: { label: string; children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 2,
        alignItems: 'baseline',
      }}
    >
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{label}</Typography>
      <Typography sx={{ fontSize: 13.5, fontWeight: 600, textAlign: 'right' }}>
        {children}
      </Typography>
    </Box>
  )
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
        <Section title="Pedido">
          <Field label="Valor">{formatCurrency(order.totalValue)}</Field>
          <Field label="Forma de pagamento">
            {order.paymentMethod ? PAYMENT_METHOD_LABELS[order.paymentMethod] : '-'}
          </Field>
          <Field label="Situação desde">{formatDate(order.statusChangedAt)}</Field>
        </Section>
        <Divider />

        <Section title="Cliente">
          <Field label="Nome">{order.client?.name ?? '-'}</Field>
          <Field label="Situação">
            {order.client ? CLIENT_STATUS_LABELS[order.client.status] : '-'}
          </Field>
        </Section>
        <Divider />

        <Section title="Negociação de origem">
          <Field label="Número">#{order.negotiationId}</Field>
          <Field label="Vendedor">{order.vendedor?.name ?? '-'}</Field>
          {order.notes && <Field label="Observações">{order.notes}</Field>}
        </Section>

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
