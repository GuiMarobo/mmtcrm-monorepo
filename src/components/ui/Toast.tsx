import Snackbar from '@mui/material/Snackbar'
import Alert from '@mui/material/Alert'
import type { ToastType } from '../../hooks/useToast'

export function Toast({ text, type }: { text: string; type: ToastType }) {
  return (
    <Snackbar
      open
      anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      sx={{ bottom: { xs: 24, sm: 24 } }}
    >
      <Alert
        severity={type === 'error' ? 'error' : 'success'}
        variant="outlined"
        sx={{ backgroundColor: 'background.paper', boxShadow: 3, fontWeight: 500 }}
      >
        {text}
      </Alert>
    </Snackbar>
  )
}
