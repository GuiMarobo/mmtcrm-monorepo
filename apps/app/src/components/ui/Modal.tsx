import Dialog from '@mui/material/Dialog'
import DialogActions from '@mui/material/DialogActions'
import DialogContent from '@mui/material/DialogContent'
import DialogTitle from '@mui/material/DialogTitle'
import IconButton from '@mui/material/IconButton'
import Typography from '@mui/material/Typography'
import Box from '@mui/material/Box'
import useMediaQuery from '@mui/material/useMediaQuery'
import { useTheme } from '@mui/material/styles'
import type { ReactNode } from 'react'
import { I } from '../../icons'

interface ModalProps {
  title: ReactNode
  subtitle?: ReactNode
  onClose: () => void
  width?: number
  children: ReactNode
  footer?: ReactNode
  closeOnBackdrop?: boolean
}

export function Modal({
  title,
  subtitle,
  onClose,
  width = 600,
  children,
  footer,
  closeOnBackdrop = true,
}: ModalProps) {
  const theme = useTheme()
  const fullScreen = useMediaQuery(theme.breakpoints.down('sm'))

  return (
    <Dialog
      open
      fullScreen={fullScreen}
      onClose={closeOnBackdrop ? onClose : undefined}
      slotProps={{ paper: { sx: { width: fullScreen ? '100%' : width, maxWidth: '100%' } } }}
    >
      <DialogTitle
        component="div"
        sx={{
          display: 'flex',
          alignItems: 'center',
          gap: 1.5,
          p: '20px 28px',
          borderBottom: 1,
          borderColor: 'divider',
        }}
      >
        <Box sx={{ flex: 1 }}>
          <Typography sx={{ fontSize: 16, fontWeight: 700 }}>{title}</Typography>
          {subtitle && (
            <Typography sx={{ fontSize: 12.5, color: 'text.disabled', mt: '2px' }}>
              {subtitle}
            </Typography>
          )}
        </Box>
        <IconButton onClick={onClose} aria-label="Fechar" size="small">
          {I.x}
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: '24px 28px', '&.MuiDialogContent-root': { pt: '24px' } }}>
        {children}
      </DialogContent>

      {footer && (
        <DialogActions
          sx={{ p: '16px 28px', borderTop: 1, borderColor: 'divider', gap: 1 }}
        >
          {footer}
        </DialogActions>
      )}
    </Dialog>
  )
}
