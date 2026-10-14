import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import MenuItem from '@mui/material/MenuItem'
import TextField from '@mui/material/TextField'
import Typography from '@mui/material/Typography'
import { useState } from 'react'
import { ApiError } from '../../api'
import { FormDialog } from '../common/FormDialog'
import { formatCurrency } from '../../utils/format'
import type { Negotiation, PaymentMethod, UsedDevice } from '../../types'
import { PAYMENT_METHOD_OPTIONS } from '../../types'
import { AmountDueLines } from './AmountDueLines'
import { conversionBlockedReason, summarizeAmountDue } from './amountDue'

interface ConvertToOrderModalProps {
  negotiation: Negotiation
  tradeIns: UsedDevice[] | null
  tradeInsError: string | null
  loading: boolean
  onConfirm: (paymentMethod: PaymentMethod) => Promise<void>
  onCancel: () => void
}

export function ConvertToOrderModal({
  negotiation,
  tradeIns,
  tradeInsError,
  loading,
  onConfirm,
  onCancel,
}: ConvertToOrderModalProps) {
  const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | ''>('')
  const [error, setError] = useState<string | null>(null)
  const tradeInsLoading = !tradeIns && !tradeInsError
  const blockedReason = tradeIns ? conversionBlockedReason(negotiation.totalValue, tradeIns) : null
  const canConfirm = !!paymentMethod && !tradeInsLoading && !blockedReason

  const confirm = async () => {
    if (!paymentMethod || !canConfirm) return
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
            disabled={loading || !canConfirm}
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

      <Box sx={{ mb: 2 }}>
        {tradeIns ? (
          <AmountDueLines summary={summarizeAmountDue(negotiation.totalValue, tradeIns)} />
        ) : tradeInsError ? (
          <Alert severity="info">
            Não foi possível carregar a troca para mostrar o Saldo a pagar. A conversão ainda confere
            os aparelhos ao confirmar.
          </Alert>
        ) : (
          <Typography sx={{ fontSize: 13, color: 'text.disabled' }}>
            Carregando aparelhos na troca…
          </Typography>
        )}
        {blockedReason && (
          <Alert severity="warning" sx={{ mt: 1.5 }}>
            {blockedReason}
          </Alert>
        )}
      </Box>

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
