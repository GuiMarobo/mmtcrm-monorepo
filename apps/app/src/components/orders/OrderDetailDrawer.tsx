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
import { ToneChip } from '../common/ToneChip'
import { AmountDueLines } from '../negotiations/AmountDueLines'
import { summarizeTradeIns } from '../negotiations/amountDue'
import { CLIENT_STATUS_LABELS, PAYMENT_METHOD_LABELS } from '../../types'
import { formatCurrency, formatDate, formatPercent } from '../../utils/format'
import type { NegotiationItem, Order, OrderTradeIn } from '../../types'

interface OrderDetailDrawerProps {
  order: Order
  items: NegotiationItem[] | null
  tradeIns: OrderTradeIn[] | null
  approving: boolean
  onApprove: () => void
  onGoToNegotiations: () => void
  onClose: () => void
}

function discountLabel(item: NegotiationItem) {
  const amount = `-${formatCurrency(item.discountAmount)}`
  return item.discountType === 'PERCENTUAL'
    ? `Desconto ${formatPercent(item.discountValue)} · ${amount}`
    : `Desconto ${amount}`
}

function OrderItemsList({ items }: { items: NegotiationItem[] }) {
  return (
    <Box
      component="ul"
      aria-label="Itens"
      sx={{
        listStyle: 'none',
        m: 0,
        p: 0,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1.5,
        overflow: 'hidden',
      }}
    >
      {items.map((item, index) => (
        <Box component="li" key={item.id}>
          {index > 0 && <Divider />}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, px: 1.5, py: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.75, minWidth: 0 }}>
                <Typography
                  sx={{
                    fontSize: 13.5,
                    fontWeight: 600,
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: item.product.deleted ? 'text.disabled' : undefined,
                  }}
                >
                  {item.product.name}
                </Typography>
                {item.product.deleted && <ToneChip tone="red">Excluído do catálogo</ToneChip>}
              </Box>
              <Typography sx={{ fontSize: 11.5, color: 'text.disabled' }}>
                {item.product.sku} · {item.quantity} × {formatCurrency(item.unitPrice)}
              </Typography>
              {item.discountAmount > 0 && (
                <Typography sx={{ fontSize: 11.5, color: 'text.secondary' }}>
                  {discountLabel(item)}
                </Typography>
              )}
            </Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {formatCurrency(item.subtotal)}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

function TradeInList({ tradeIns }: { tradeIns: OrderTradeIn[] }) {
  return (
    <Box
      component="ul"
      aria-label="Aparelhos na troca"
      sx={{
        listStyle: 'none',
        m: 0,
        p: 0,
        border: 1,
        borderColor: 'divider',
        borderRadius: 1.5,
        overflow: 'hidden',
      }}
    >
      {tradeIns.map((tradeIn, index) => (
        <Box component="li" key={tradeIn.id}>
          {index > 0 && <Divider />}
          <Box sx={{ display: 'flex', alignItems: 'flex-start', gap: 1.5, px: 1.5, py: 1 }}>
            <Box sx={{ flex: 1, minWidth: 0 }}>
              <Typography sx={{ fontSize: 13.5, fontWeight: 600 }}>{tradeIn.model}</Typography>
              <Typography sx={{ fontSize: 11.5, color: 'text.disabled' }}>
                Série {tradeIn.serialNumber}
              </Typography>
            </Box>
            <Typography sx={{ fontSize: 13.5, fontWeight: 600, whiteSpace: 'nowrap' }}>
              {formatCurrency(tradeIn.tradeInValue)}
            </Typography>
          </Box>
        </Box>
      ))}
    </Box>
  )
}

export function OrderDetailDrawer({
  order,
  items,
  tradeIns,
  approving,
  onApprove,
  onGoToNegotiations,
  onClose,
}: OrderDetailDrawerProps) {
  const awaitingPayment = order.status === 'EM_NEGOCIACAO'
  const tradeInFailed = items !== null && tradeIns === null

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

        {(items === null || items.length > 0) && (
          <>
            <DetailSection title="Itens">
              {items === null ? (
                <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>
                  Carregando itens…
                </Typography>
              ) : (
                <OrderItemsList items={items} />
              )}
            </DetailSection>
            <Divider />
          </>
        )}

        {tradeInFailed && (
          <Box sx={{ px: 3, pt: 3 }}>
            <Alert severity="warning" sx={{ fontSize: 13 }}>
              Não foi possível carregar a troca: sem ela não dá para saber o Saldo a pagar.
              Feche e abra o pedido de novo antes de aprovar.
            </Alert>
          </Box>
        )}

        {tradeIns !== null && tradeIns.length > 0 && (
          <>
            <DetailSection title="Troca">
              <TradeInList tradeIns={tradeIns} />
              <Box sx={{ mt: 1.5 }}>
                <AmountDueLines
                  totalLabel="Total do pedido"
                  summary={summarizeTradeIns(
                    order.totalValue,
                    tradeIns.map((tradeIn) => tradeIn.tradeInValue),
                  )}
                />
              </Box>
            </DetailSection>
            <Divider />
          </>
        )}

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
            disabled={approving || tradeIns === null}
            onClick={onApprove}
          >
            {approving ? 'Aprovando…' : 'Aprovar Compra'}
          </Button>
        </Box>
      )}
    </Drawer>
  )
}
