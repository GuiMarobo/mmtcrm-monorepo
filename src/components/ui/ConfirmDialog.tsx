import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { Button } from './Button'

interface ConfirmDialogProps {
  title: string
  description?: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  danger?: boolean
  loading?: boolean
  confirmDisabled?: boolean
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
  confirmDisabled = false,
  onConfirm,
  onCancel,
}: ConfirmDialogProps) {
  return (
    <Dialog
      open
      onClose={loading ? undefined : onCancel}
      slotProps={{ paper: { sx: { width: 440, maxWidth: '100%' } } }}
    >
      <DialogContent sx={{ p: '24px 24px 0' }}>
        <Typography
          sx={{ fontSize: 18, fontWeight: 700, letterSpacing: '-0.01em' }}
        >
          {title}
        </Typography>
        {description && (
          <Typography
            component="div"
            sx={{
              mt: 1,
              color: 'text.secondary',
              fontSize: 13.5,
              lineHeight: 1.55,
            }}
          >
            {description}
          </Typography>
        )}
      </DialogContent>

      <DialogActions sx={{ p: '22px 24px 24px', gap: 1 }}>
        <Button onClick={onCancel} disabled={loading}>
          {cancelLabel}
        </Button>
        <Button
          variant={danger ? 'destructive' : 'primary'}
          onClick={onConfirm}
          disabled={loading || confirmDisabled}
        >
          {loading ? 'Aguarde…' : confirmLabel}
        </Button>
      </DialogActions>
    </Dialog>
  )
}
