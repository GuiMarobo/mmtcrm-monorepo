import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

interface StatGridProps {
  children: ReactNode
  columns?: 2 | 4
}

export function StatGrid({ children, columns = 4 }: StatGridProps) {
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
        mb: 2.5,
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
  hint?: ReactNode
}

export function Stat({ label, value, hint }: StatProps) {
  return (
    <Box sx={{ p: '18px 22px' }}>
      <Typography sx={{ color: 'text.disabled', fontSize: 12.5, fontWeight: 500 }}>
        {label}
      </Typography>
      <Typography
        sx={{
          fontSize: { xs: 23, sm: 26 },
          fontWeight: 700,
          mt: '6px',
          letterSpacing: '-0.02em',
        }}
      >
        {value}
      </Typography>
      {hint != null && (
        <Box
          sx={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '4px',
            fontSize: 12,
            mt: '8px',
            fontWeight: 600,
            color: 'success.main',
          }}
        >
          <AutoAwesomeOutlinedIcon sx={{ fontSize: 13 }} />
          <span>{hint}</span>
        </Box>
      )}
    </Box>
  )
}
