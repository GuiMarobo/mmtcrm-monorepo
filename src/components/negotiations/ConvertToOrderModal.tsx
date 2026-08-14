import { useState } from 'react'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { Button, Modal } from '../ui'
import { formatCurrency } from '../../utils/format'
import type { Negotiation, PaymentMethod } from '../../types'
import { PAYMENT_METHOD_OPTIONS } from '../../types'

interface ConvertToOrderModalProps {
  negotiation: Negotiation
  loading: boolean
  onConfirm: (paymentMethod: PaymentMethod) => void
  onCancel: () => void
}

export function ConvertToOrderModal({
  negotiation,
  loading,
  onConfirm,
  onCancel,
}: ConvertToOrderModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')

  return (
    <Modal
      title="Converter em pedido"
      subtitle={`${negotiation.client?.name ?? 'Cliente'} · ${formatCurrency(negotiation.totalValue)}`}
      onClose={loading ? () => undefined : onCancel}
      width={460}
      closeOnBackdrop={!loading}
      footer={
        <>
          <Button onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="primary"
            onClick={() => paymentMethod && onConfirm(paymentMethod)}
            disabled={loading || !paymentMethod}
          >
            {loading ? 'Convertendo…' : 'Converter em pedido'}
          </Button>
        </>
      }
    >
      <Typography sx={{ mb: 2 }}>
        A negociação passará a <b>Ganha</b>, o pedido será gerado e o cliente
        passará a <b>Ativo</b>.
      </Typography>

      <TextField
        select
        label="Forma de pagamento"
        required
        value={paymentMethod}
        onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
        autoFocus
        fullWidth
      >
        <MenuItem value="">Selecione…</MenuItem>
        {PAYMENT_METHOD_OPTIONS.map((o) => (
          <MenuItem key={o.value} value={o.value}>
            {o.label}
          </MenuItem>
        ))}
      </TextField>
    </Modal>
  )
}
