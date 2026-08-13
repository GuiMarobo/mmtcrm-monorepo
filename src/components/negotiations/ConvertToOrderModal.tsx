import { useState } from 'react'
import { Button, Field, Modal } from '../ui'
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
      <p>
        A negociação passará a <b>Ganha</b>, o pedido será gerado e o cliente
        passará a <b>Ativo</b>.
      </p>

      <Field label="Forma de pagamento" required>
        <select
          value={paymentMethod}
          onChange={(e) => setPaymentMethod(e.target.value as PaymentMethod)}
          autoFocus
        >
          <option value="">Selecione…</option>
          {PAYMENT_METHOD_OPTIONS.map((o) => (
            <option key={o.value} value={o.value}>
              {o.label}
            </option>
          ))}
        </select>
      </Field>
    </Modal>
  )
}
