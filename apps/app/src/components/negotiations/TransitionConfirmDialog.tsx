import { ConfirmDialog } from '../common/ConfirmDialog'
import { formatCurrency } from '../../utils/format'
import type { Negotiation, NegotiationStatus } from '../../types'

interface TransitionConfirmDialogProps {
  negotiation: Negotiation
  target: NegotiationStatus
  loading: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function TransitionConfirmDialog({
  negotiation,
  target,
  loading,
  onConfirm,
  onCancel,
}: TransitionConfirmDialogProps) {
  const isCancel = target === 'PERDIDA'
  const clientName = negotiation.client?.name ?? 'este cliente'
  const orderPaid = negotiation.order?.status === 'COMPRA_APROVADA'

  return (
    <ConfirmDialog
      title={
        isCancel ? 'Marcar negociação como perdida?' : 'Reabrir negociação?'
      }
      description={
        isCancel ? (
          <>
            A negociação de <b>{clientName}</b> passará a Perdida. A situação do
            cliente não muda.
          </>
        ) : (
          <>
            A negociação de <b>{clientName}</b> voltará a Aberta.
            {negotiation.status === 'GANHA' && (
              <>
                {' '}
                O pedido <b>{negotiation.order?.code}</b> passará a Desistência.
                {orderPaid && (
                  <>
                    {' '}
                    Como o pagamento já foi confirmado,{' '}
                    <b>{formatCurrency(negotiation.totalValue)}</b> sairão do
                    faturamento do cliente.
                  </>
                )}
              </>
            )}
          </>
        )
      }
      confirmLabel={isCancel ? 'Marcar como perdida' : 'Reabrir'}
      danger={isCancel}
      loading={loading}
      onConfirm={onConfirm}
      onCancel={onCancel}
    />
  )
}
