import Paper from '@mui/material/Paper'
import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

export function StatGrid({
  children,
  columns = 4,
}: {
  children: ReactNode
  columns?: 2 | 4
}) {
  return (
    <Paper
      variant="outlined"
      sx={{
        display: 'grid',
        gridTemplateColumns: {
          xs: '1fr',
          sm: 'repeat(2, 1fr)',
          lg: `repeat(${columns}, 1fr)`,
        },
        overflow: 'hidden',
        mb: '20px',
        boxShadow: 'none',
        '& > *': { borderRight: 1, borderBottom: 1, borderColor: 'divider' },
        '& > *:last-of-type': { borderRight: 0 },
      }}
    >
      {children}
    </Paper>
  )
}

interface StatProps {
  label: ReactNode
  value: ReactNode
  delta?: ReactNode
  deltaTone?: 'up' | 'down'
}

export function Stat({ label, value, delta, deltaTone = 'up' }: StatProps) {
  return (
    <Box sx={{ p: '18px 22px' }}>
      <Typography sx={{ color: 'text.disabled', fontSize: 12.5, fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: 26,
          fontWeight: 700,
          mt: '6px',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </Typography>
      {delta != null && (
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: 12,
            mt: '8px',
            fontWeight: 600,
            color: deltaTone === 'down' ? 'error.main' : 'success.main',
          }}
        >
          {delta}
        </Box>
      )}
    </Box>
  )
}
