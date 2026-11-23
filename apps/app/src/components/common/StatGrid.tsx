import AutoAwesomeOutlinedIcon from '@mui/icons-material/AutoAwesomeOutlined'
import Avatar from '@mui/material/Avatar'
import Box from '@mui/material/Box'
import Paper from '@mui/material/Paper'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'
import { TONES } from '../../theme/tones'
import type { BadgeTone } from '../../theme/tones'

interface StatGridProps {
  children: ReactNode
  columns?: 2 | 3 | 4
  variant?: 'divided' | 'cards'
}

export function StatGrid({ children, columns = 4, variant = 'divided' }: StatGridProps) {
  if (variant === 'cards') {
    return (
      <Box
        sx={{
          display: 'grid',
          gridTemplateColumns: {
            xs: '1fr',
            sm: 'repeat(2, 1fr)',
            lg: `repeat(${columns}, 1fr)`,
          },
          gap: 2,
          mb: 2.5,
        }}
      >
        {children}
      </Box>
    )
  }

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

interface KpiStatProps {
  icon: ReactNode
  tone: BadgeTone
  label: string
  value: ReactNode
  hint?: ReactNode
}

export function KpiStat({ icon, tone, label, value, hint }: KpiStatProps) {
  return (
    <Paper
      variant="outlined"
      role="group"
      aria-label={label}
      sx={{ p: 2.5, boxShadow: 'none', display: 'flex', flexDirection: 'column', gap: 1 }}
    >
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <Avatar
          variant="rounded"
          sx={{
            width: (theme) => theme.spacing(4),
            height: (theme) => theme.spacing(4),
            bgcolor: TONES[tone].bg,
            color: TONES[tone].color,
          }}
        >
          {icon}
        </Avatar>
        <Typography variant="overline" sx={{ color: 'text.secondary' }}>
          {label}
        </Typography>
      </Box>
      <Typography variant="h4" component="p">
        {value}
      </Typography>
      {hint != null && (
        <Typography variant="subtitle2" sx={{ color: 'text.disabled', fontWeight: 'normal' }}>
          {hint}
        </Typography>
      )}
    </Paper>
  )
}
