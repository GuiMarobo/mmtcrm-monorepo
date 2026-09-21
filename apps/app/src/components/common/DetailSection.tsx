import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { ReactNode } from 'react'

export function DetailSection({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <Box sx={{ px: 3, py: 2.5 }}>
      <Typography
        sx={{
          fontSize: 11.5,
          fontWeight: 700,
          letterSpacing: '0.04em',
          textTransform: 'uppercase',
          color: 'text.disabled',
          mb: 1.5,
        }}
      >
        {title}
      </Typography>
      <Box sx={{ display: 'grid', gap: 1.25 }}>{children}</Box>
    </Box>
  )
}

export function DetailField({
  label,
  children,
}: {
  label: string
  children: ReactNode
}) {
  return (
    <Box
      sx={{
        display: 'flex',
        justifyContent: 'space-between',
        gap: 2,
        alignItems: 'baseline',
      }}
    >
      <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>{label}</Typography>
      <Typography
        aria-label={label}
        sx={{ fontSize: 13.5, fontWeight: 600, textAlign: 'right' }}
      >
        {children}
      </Typography>
    </Box>
  )
}
