import type { ReactNode } from 'react'
import { Button } from './Button'

interface ConfirmDialogProps {
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  onConfirm: () => void
  onCancel: () => void
}

export function ConfirmDialog({
  title,
  description,
  confirmLabel = 'Confirmar',
  cancelLabel = 'Cancelar',
  danger = false,
  loading = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <div className="modal-scrim" onClick={loading ? undefined : onCancel}>
      <div className="confirm" onClick={(e) => e.stopPropagation()}>
        <div className="confirm-title">{title}</div>
        {description && <div className="confirm-text">{description}</div>}
        <div className="confirm-actions">
          <Button onClick={onCancel} disabled={loading}>
            {cancelLabel}
          </Button>
          <Button
            variant={danger ? 'destructive' : 'primary'}
            onClick={onConfirm}
            disabled={loading}
          >
            {loading ? 'Aguarde…' : confirmLabel}
          </Button>
        </div>
      </div>
    </div>
  )
}
