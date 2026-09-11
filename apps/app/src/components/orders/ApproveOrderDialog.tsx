import { ConfirmDialog } from '../common/ConfirmDialog'
import { formatCurrency } from '../../utils/format'
import type { Order } from '../../types'

interface ApproveOrderDialogProps {
  order: Order
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ApproveOrderDialog({
  order,
  loading,
  onConfirm,
  onCancel,
}: ApproveOrderDialogProps) {
  return (
    <ConfirmDialog
      title="Aprovar a compra?"
      description={
        <>
          Confirma que o pagamento de <b>{formatCurrency(order.totalValue)}</b> foi
          recebido? Só um administrador poderá desfazer.
        </>
      }
      confirmLabel="Aprovar Compra"
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
