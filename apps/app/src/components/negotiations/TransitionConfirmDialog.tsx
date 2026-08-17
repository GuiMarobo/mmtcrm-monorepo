import { ConfirmDialog } from '../ui'
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
