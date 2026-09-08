import Alert from '@mui/material/Alert'
import Box from '@mui/material/Box'
import Button from '@mui/material/Button'
import Paper from '@mui/material/Paper'
import type { ReactNode } from 'react'

export function SectionCard({ children }: { children: ReactNode }) {
  return (
    <Paper variant="outlined" sx={{ boxShadow: 'none', overflow: 'hidden' }}>
      {children}
    </Paper>
  )
}

export function SectionToolbar({ children }: { children: ReactNode }) {
  return (
    <Box
      sx={{
        display: 'flex',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: 1.25,
        p: '14px 16px',
        borderBottom: 1,
        borderColor: 'divider',
      }}
    >
      {children}
    </Box>
  )
}

interface ErrorBannerProps {
  message: string
  onRetry?: () => void
}

export function ErrorBanner({ message, onRetry }: ErrorBannerProps) {
  return (
    <Alert
      severity="error"
      square
      sx={{ borderRadius: 0 }}
      action={
        onRetry && (
          <Button color="error" size="small" onClick={onRetry}>
            Tentar novamente
          </Button>
        )
      }
    >
      {message}
    </Alert>
  )
}
