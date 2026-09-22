import Alert from '@mui/material/Alert'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { ApiError } from '../../api'
import { FormDialog } from '../common/FormDialog'
import { formatCurrency } from '../../utils/format'
import type { Negotiation, PaymentMethod } from '../../types'
import { PAYMENT_METHOD_OPTIONS } from '../../types'

interface ConvertToOrderModalProps {
  negotiation: Negotiation
  loading: boolean
  onConfirm: (paymentMethod: PaymentMethod) => Promise<void>
  onCancel: () => void
}

export function ConvertToOrderModal({
  negotiation,
  loading,
  onConfirm,
  onCancel,
}: ConvertToOrderModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [error, setError] = useState<string | null>(null)

  const confirm = async () => {
    if (!paymentMethod) return
    setError(null)
    try {
      await onConfirm(paymentMethod)
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Erro ao converter em pedido')
    }
  }

  return (
    <FormDialog
      title="Converter em pedido"
      subtitle={`${negotiation.client?.name ?? 'Cliente'} · ${formatCurrency(negotiation.totalValue)}`}
      onClose={loading ? () => undefined : onCancel}
      width={460}
      closeOnBackdrop={!loading}
      footer={
        <>
          <Button variant="outlined" color="inherit" onClick={onCancel} disabled={loading}>
            Cancelar
          </Button>
          <Button
            variant="contained"
            onClick={() => void confirm()}
            disabled={loading || !paymentMethod}
          >
            {loading ? 'Convertendo…' : 'Converter em pedido'}
          </Button>
        </>
      }
    >
      {error && (
        <Alert severity="error" sx={{ mb: 2 }}>
          {error}
        </Alert>
      )}

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
    </FormDialog>
  )
}
