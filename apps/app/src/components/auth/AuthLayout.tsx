import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { FormEvent, ReactNode } from 'react'
import { INK } from '../../theme'

const ORB_BASE = {
  position: 'absolute',
  borderRadius: '999px',
  filter: 'blur(20px)',
  opacity: 0.55,
  pointerEvents: 'none',
} as const

interface AuthLayoutProps {
  headline: string
  pitch: string
  title: string
  lead: string
  onSubmit: (event: FormEvent) => void
  children: ReactNode
}

export function AuthLayout({
  headline,
  pitch,
  title,
  lead,
  onSubmit,
  children,
}: AuthLayoutProps) {
  return (
    <Box
      sx={{
        minHeight: '100vh',
        display: 'grid',
        gridTemplateColumns: { xs: '1fr', md: '1.05fr 1fr' },
        backgroundColor: 'background.default',
      }}
    >
      <Box
        sx={{
          display: { xs: 'none', md: 'flex' },
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          p: 5,
          backgroundColor: INK,
          color: '#fff',
        }}
      >
        <Box
          sx={{
            ...ORB_BASE,
            right: -120,
            top: 40,
            width: 420,
            height: 420,
            background:
              'radial-gradient(circle at 30% 30%, #3a82ff 0%, #1d4ed8 40%, transparent 70%)',
          }}
        />
        <Box
          sx={{
            ...ORB_BASE,
            right: 120,
            top: 220,
            width: 260,
            height: 260,
            background:
              'radial-gradient(circle at 30% 30%, #ff8a4c 0%, #c2410c 50%, transparent 75%)',
          }}
        />

        <Box sx={{ position: 'relative' }}>
          <Typography sx={{ fontWeight: 800, fontSize: 15, lineHeight: 1 }}>
            MMT Urbana
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', mt: '3px' }}>
            CRM Comercial
          </Typography>
        </Box>

        <Box sx={{ position: 'relative', mt: 'auto', maxWidth: 460 }}>
          <Typography
            component="h2"
            sx={{ fontSize: 36, fontWeight: 700, letterSpacing: '-0.025em', lineHeight: 1.1 }}
          >
            {headline}
          </Typography>
          <Typography
            sx={{ color: 'rgba(255,255,255,0.65)', mt: '14px', lineHeight: 1.6, fontSize: 14.5 }}
          >
            {pitch}
          </Typography>
        </Box>
      </Box>

      <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: '24px 16px', sm: '32px 20px', md: 5 } }}>
        <Box component="form" onSubmit={onSubmit} sx={{ width: '100%', maxWidth: 380 }}>
          <Typography
            component="h1"
            sx={{ fontSize: { xs: 23, sm: 26 }, fontWeight: 700, letterSpacing: '-0.02em' }}
          >
            {title}
          </Typography>
          <Typography sx={{ color: 'text.disabled', mt: '6px', fontSize: 13.5 }}>
            {lead}
          </Typography>
          <Box sx={{ height: 28 }} />
          {children}
        </Box>
      </Box>
    </Box>
  )
}
