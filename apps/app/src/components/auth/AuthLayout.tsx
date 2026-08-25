import Box from '@mui/material/Box'
import Typography from '@mui/material/Typography'
import type { FormEvent, ReactNode } from 'react'

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
      <Box className="login-left" sx={{ display: { xs: 'none', md: 'flex' } }}>
        <div className="login-orb" />
        <div className="login-orb b" />
        <Box className="login-layer">
          <Typography sx={{ fontWeight: 800, fontSize: 15, lineHeight: 1 }}>
            MMT Urbana
          </Typography>
          <Typography sx={{ fontSize: 11, color: 'rgba(255,255,255,0.6)', mt: '3px' }}>
            CRM Comercial
          </Typography>
        </Box>
        <Box className="login-layer" sx={{ mt: 'auto', maxWidth: 460 }}>
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

      <Box sx={{ display: 'grid', placeItems: 'center', p: { xs: '32px 20px', md: 5 } }}>
        <Box
          component="form"
          onSubmit={onSubmit}
          sx={{ width: '100%', maxWidth: 380 }}
        >
          <Typography
            component="h1"
            sx={{ fontSize: 26, fontWeight: 700, letterSpacing: '-0.02em' }}
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
